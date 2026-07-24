/**
 * THE PRINK - Server-side print-ready renderer.
 *
 * Rebuilds the customer-approved composition from:
 *     original HD source image  +  template configuration  +  saved transform
 *
 * It never upscales the browser preview. The preview is a low-resolution
 * *view* of the same transform; this module applies that transform to the
 * untouched original at the template's print resolution.
 */

const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const sharp = require('sharp');

const { printPixelSize, effectiveDpi } = require('../config/printTemplates');
const { computePlacement, normalizeTransform } = require('./designTransform');

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');
const PRINT_DIR = path.join(UPLOADS_DIR, 'print');

function ensureDirs() {
  for (const dir of [UPLOADS_DIR, PRINT_DIR]) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * Resolve the ORIGINAL (never the optimised preview derivative) source file.
 * Requirement 8: print generation must always use the original asset.
 */
function resolveOriginalPath(image) {
  const candidates = [
    image?.originalKey,
    image?.storageKey,
    image?.serverFilename,
    image?.url && path.basename(image.url)
  ].filter(Boolean);

  for (const candidate of candidates) {
    const full = path.isAbsolute(candidate) ? candidate : path.join(UPLOADS_DIR, candidate);
    // Keep resolution inside the uploads dir - a stored key must never be able
    // to walk the filesystem.
    const resolved = path.resolve(full);
    if (!resolved.startsWith(path.resolve(UPLOADS_DIR))) continue;
    if (fs.existsSync(resolved) && fs.statSync(resolved).isFile()) return resolved;
  }
  return null;
}

/**
 * Render one personalised image into a full-bleed print raster.
 * @returns {Promise<{buffer:Buffer, width:number, height:number, dpi:number,
 *                    effectiveDpi:number, belowMinimumDpi:boolean}>}
 */
async function renderPrintRaster(image, template, transformInput) {
  const sourcePath = resolveOriginalPath(image);
  if (!sourcePath) {
    throw new Error(`Original source image not found for upload ${image?.id || '(unknown)'}`);
  }

  const transform = normalizeTransform(transformInput);
  const canvas = printPixelSize(template);

  // Read the original at full resolution. `failOn: 'none'` keeps slightly
  // malformed but decodable customer photos usable instead of failing a job.
  const source = sharp(sourcePath, { failOn: 'none' }).rotate(); // rotate() honours EXIF orientation
  const meta = await source.metadata();
  if (!meta.width || !meta.height) {
    throw new Error(`Unable to read dimensions of source image ${path.basename(sourcePath)}`);
  }

  const placement = computePlacement({
    sourceWidth: meta.width,
    sourceHeight: meta.height,
    areaWidth: canvas.width,
    areaHeight: canvas.height,
    transform
  });

  const dpi = effectiveDpi(meta.width, meta.height, template, transform.scale);

  // Resize the ORIGINAL to its placed size, then apply colour adjustments.
  // brightness/contrast use sharp's linear(a, b): out = a*in + b, which is the
  // same model the CSS filter approximates in the preview.
  const a = transform.contrast / 100;
  const b = 255 * (transform.brightness / 100 - 1) - 128 * (a - 1);

  let layer = source
    .resize({
      width: Math.max(1, Math.round(placement.drawWidth)),
      height: Math.max(1, Math.round(placement.drawHeight)),
      fit: 'fill',
      kernel: 'lanczos3'
    })
    .linear(a, b);

  if (placement.rotation % 360 !== 0) {
    layer = layer.rotate(placement.rotation, { background: { r: 255, g: 255, b: 255, alpha: 0 } });
  }

  const layerBuffer = await layer.png().toBuffer();
  const layerMeta = await sharp(layerBuffer).metadata();
  const layerW = layerMeta.width || 0;
  const layerH = layerMeta.height || 0;

  // Rotation changes the bounding box; re-centre so the rotation pivots about
  // the intended centre point rather than the top-left corner.
  const left = Math.round(placement.centerX - layerW / 2);
  const top = Math.round(placement.centerY - layerH / 2);

  // A "cover" fit (and any zoom above it) intentionally overflows the print
  // area - that overflow is what fills the bleed. sharp refuses to composite a
  // layer larger than the canvas, so crop the layer to the visible region
  // first and composite the remainder at a non-negative origin.
  const srcLeft = Math.max(0, -left);
  const srcTop = Math.max(0, -top);
  const destLeft = Math.max(0, left);
  const destTop = Math.max(0, top);
  const visibleW = Math.min(layerW - srcLeft, canvas.width - destLeft);
  const visibleH = Math.min(layerH - srcTop, canvas.height - destTop);

  const composites = [];
  if (visibleW > 0 && visibleH > 0) {
    const cropped = (srcLeft === 0 && srcTop === 0 && visibleW === layerW && visibleH === layerH)
      ? layerBuffer
      : await sharp(layerBuffer)
          .extract({ left: srcLeft, top: srcTop, width: visibleW, height: visibleH })
          .png()
          .toBuffer();
    composites.push({ input: cropped, left: destLeft, top: destTop });
  }
  // If nothing is visible the customer has panned the photo entirely outside
  // the print area; a blank sheet is the correct, non-crashing result.

  const buffer = await sharp({
    create: {
      width: canvas.width,
      height: canvas.height,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 }
    }
  })
    .composite(composites)
    .withMetadata({ density: template.dpi || 300 })
    .png({ compressionLevel: 6 })
    .toBuffer();

  return {
    buffer,
    width: canvas.width,
    height: canvas.height,
    dpi: template.dpi || 300,
    effectiveDpi: dpi,
    belowMinimumDpi: dpi < (template.dpi || 300)
  };
}

/**
 * Build the print-ready PDF at the template's true physical dimensions,
 * including bleed and crop marks.
 *
 * NOTE ON COLOUR: PDFKit emits DeviceRGB. This function therefore produces an
 * honest high-resolution RGB PDF and records colourSpace:'RGB' in its result.
 * It deliberately does NOT claim CMYK - converting correctly requires an ICC
 * toolchain (e.g. Ghostscript with an output profile), which is not installed
 * here. See docs/PRINT_PIPELINE.md.
 */
async function generatePrintPdf({ orderId, order, image, template, transform }) {
  ensureDirs();

  const raster = await renderPrintRaster(image, template, transform);
  const { widthMm, heightMm, bleedMm } = template.physical;

  const mmToPt = mm => (mm / 25.4) * 72;
  const pageW = mmToPt(widthMm + bleedMm * 2);
  const pageH = mmToPt(heightMm + bleedMm * 2);

  const safeOrderId = String(orderId).replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `THEPRINK_${safeOrderId}_${template.id}_${Date.now()}.pdf`;
  const outputPath = path.join(PRINT_DIR, filename);

  await new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: [pageW, pageH],
      margin: 0,
      info: {
        Title: `THE PRINK print file ${orderId}`,
        Author: 'THE PRINK',
        Subject: `${template.name} - ${order?.product || ''}`,
        Keywords: `${template.dpi}dpi, bleed ${bleedMm}mm`
      }
    });

    const stream = fs.createWriteStream(outputPath);
    doc.pipe(stream);

    // Artwork covers the full bleed box.
    doc.image(raster.buffer, 0, 0, { width: pageW, height: pageH });

    // Crop marks at the trim box corners.
    const bleedPt = mmToPt(bleedMm);
    if (bleedPt > 0) {
      const markLen = Math.min(bleedPt, mmToPt(5));
      doc.lineWidth(0.5).strokeColor('#000000');
      const corners = [
        [bleedPt, bleedPt, -1, -1],
        [pageW - bleedPt, bleedPt, 1, -1],
        [bleedPt, pageH - bleedPt, -1, 1],
        [pageW - bleedPt, pageH - bleedPt, 1, 1]
      ];
      for (const [x, y, dx, dy] of corners) {
        doc.moveTo(x + dx * 1, y).lineTo(x + dx * markLen, y).stroke();
        doc.moveTo(x, y + dy * 1).lineTo(x, y + dy * markLen).stroke();
      }
    }

    doc.end();
    stream.on('finish', resolve);
    stream.on('error', reject);
  });

  const stats = fs.statSync(outputPath);

  return {
    filename,
    path: outputPath,
    url: `/uploads/print/${filename}`,
    bytes: stats.size,
    widthMm: widthMm + bleedMm * 2,
    heightMm: heightMm + bleedMm * 2,
    dpi: raster.dpi,
    effectiveDpi: raster.effectiveDpi,
    belowMinimumDpi: raster.belowMinimumDpi,
    colourSpace: 'RGB',
    templateId: template.id,
    generatedAt: new Date()
  };
}

module.exports = {
  UPLOADS_DIR,
  PRINT_DIR,
  ensureDirs,
  resolveOriginalPath,
  renderPrintRaster,
  generatePrintPdf
};
