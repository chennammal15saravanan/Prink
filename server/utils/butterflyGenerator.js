const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const sharp = require('sharp');
const crypto = require('crypto');

const { UPLOADS_DIR, PRINT_DIR, ensureDirs, resolveOriginalImageSource } = require('./printRenderer');

const mmToPt = (mm) => (mm / 25.4) * 72;

/**
 * Generate a Print-Ready PDF for the Butterfly Box layout.
 * 
 * @param {Object} options 
 * @param {string} options.orderId - The Order ID
 * @param {Array<Object>} options.images - Array of 8 image objects (each having url/serverFilename/originalKey)
 * @param {Object} options.order - Full order object with customer and product details
 * @param {string} [options.orderId2] - The second Order ID (for the Red side)
 * @param {Array<Object>} [options.images2] - Array of 8 image objects for the second order
 * @param {Object} [options.order2] - Full order object for the second order
 * @param {string} [options.templateId] - The shared Butterfly Template ID
 * @returns {Promise<Object>} Object containing filename, url, etc.
 */
async function generateButterflyBoxPdf({ orderId, images, order, orderId2, images2, order2, templateId }) {
  ensureDirs();

  if (!images || images.length === 0) {
    throw new Error('Butterfly Box requires at least 1 image.');
  }

  // If there are fewer than 8 images (e.g., old test orders), duplicate them to fill all 8 slots
  let paddedImages = [...images];
  while (paddedImages.length < 8) {
    paddedImages.push(images[paddedImages.length % images.length]);
  }
  // If there are more than 8, slice to 8
  paddedImages = paddedImages.slice(0, 8);

  const getImgKey = (img) => img.id || img.url || img.serverFilename || JSON.stringify(img);

  // Helper to process a set of padded images by only rendering unique ones
  const processImagesList = async (imgs) => {
    const uniqueMap = new Map();
    const uniqueList = [];
    for (const img of imgs) {
      const key = getImgKey(img);
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, null);
        uniqueList.push(img);
      }
    }

    const uniqueBuffers = await Promise.all(uniqueList.map(async (img) => {
      const src = await resolveOriginalImageSource(img);
      if (!src) {
        console.warn(`[WARNING] Could not find original file for image ${img.id || 'unknown'}. Using placeholder.`);
        return await require('sharp')({
          create: { width: 1000, height: 1000, channels: 4, background: { r: 230, g: 230, b: 230, alpha: 1 } }
        }).jpeg({ quality: 90 }).toBuffer();
      }
      
      return await sharp(src)
        .rotate() // auto-orient based on EXIF
        .resize({
          width: 1000,
          height: 1000,
          fit: 'cover',
          position: 'center'
        })
        .jpeg({ quality: 90 })
        .toBuffer();
    }));

    uniqueList.forEach((img, index) => {
      const key = getImgKey(img);
      uniqueMap.set(key, uniqueBuffers[index]);
    });

    return imgs.map(img => uniqueMap.get(getImgKey(img)));
  };

  // Pre-process all 8 images
  // This avoids placing 10MB original JPEGs directly into the PDF, keeping the PDF size manageable.
  const processedBuffers = await processImagesList(paddedImages);

  // Process second order images if present
  let processedBuffers2 = [];
  if (images2 && images2.length > 0) {
    let paddedImages2 = [...images2];
    while (paddedImages2.length < 8) paddedImages2.push(images2[paddedImages2.length % images2.length]);
    paddedImages2 = paddedImages2.slice(0, 8);
    
    processedBuffers2 = await processImagesList(paddedImages2);
  }

  const PAGE_WIDTH_MM = 330.2;
  const PAGE_HEIGHT_MM = 482.6;
  const SAFE_WIDTH_MM = 320.2;
  const SAFE_HEIGHT_MM = 460.1;
  const SAFE_OFFSET_X = 5;
  const SAFE_OFFSET_Y = 11.25;

  const pageW = mmToPt(PAGE_WIDTH_MM);
  const pageH = mmToPt(PAGE_HEIGHT_MM);

  const safeOrderId = templateId || String(orderId).replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `BUTTERFLY_${safeOrderId}_${Date.now()}.pdf`;
  const outputPath = path.join(PRINT_DIR, filename);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: [pageW, pageH],
      margin: 0,
      info: {
        Title: `Butterfly Box Print - ${templateId || orderId}`,
        Author: 'THE PRINK'
      }
    });

    const stream = fs.createWriteStream(outputPath);
    doc.pipe(stream);

    // 1. Draw Green Cut Line
    doc.lineWidth(1).strokeColor('green')
       .rect(0, 0, pageW, pageH)
       .stroke();

    // 2. Draw Red Safe Margin
    doc.lineWidth(1).strokeColor('red')
       .rect(mmToPt(SAFE_OFFSET_X), mmToPt(SAFE_OFFSET_Y), mmToPt(SAFE_WIDTH_MM), mmToPt(SAFE_HEIGHT_MM))
       .stroke();

    // 3. Define Image Coordinates (in mm)
    // Product 1 (Blue)
    const p1_small = [
      { x: 9, y: 22.35 },
      { x: 88.73, y: 22.35 },
      { x: 168.47, y: 22.35 },
      { x: 248.2, y: 22.35 }
    ];
    const p1_large = [
      { x: 9, y: 118.35 },
      { x: 9, y: 209.02 },
      { x: 9, y: 299.68 },
      { x: 9, y: 390.35 }
    ];

    // Product 2 (Red)
    const p2_large = [
      { x: 155, y: 118.35 },
      { x: 155, y: 209.02 },
      { x: 155, y: 299.68 },
      { x: 155, y: 390.35 }
    ];
    const p2_small = [
      { x: 248.2, y: 132.35 },
      { x: 248.2, y: 221.02 },
      { x: 248.2, y: 309.68 },
      { x: 248.2, y: 398.35 }
    ];

    // We have 8 images. Let's assign images 0-3 to large, 4-7 to small.
    const largeImgs = processedBuffers.slice(0, 4);
    const smallImgs = processedBuffers.slice(4, 8);

    // Helper to draw boxes + images
    const placeImages = (coords, buffers, size, strokeColor) => {
      coords.forEach((coord, i) => {
        const xPt = mmToPt(coord.x);
        const yPt = mmToPt(coord.y);
        const sizePt = mmToPt(size);

        // Draw border
        doc.lineWidth(1).strokeColor(strokeColor)
           .rect(xPt, yPt, sizePt, sizePt)
           .stroke();

        // Place image inside border
        doc.image(buffers[i], xPt, yPt, { width: sizePt, height: sizePt });
      });
    };

    // Product 1 (Blue lines)
    placeImages(p1_large, largeImgs, 81, 'blue');
    placeImages(p1_small, smallImgs, 73, 'blue');

    // Product 2 (Red lines)
    if (processedBuffers2.length === 8) {
      const largeImgs2 = processedBuffers2.slice(0, 4);
      const smallImgs2 = processedBuffers2.slice(4, 8);
      placeImages(p2_large, largeImgs2, 81, 'red');
      placeImages(p2_small, smallImgs2, 73, 'red');
    }

    // 4. Barcode / Order ID
    doc.fillColor('black').font('Helvetica-Bold').fontSize(8);
    // Left Blue block text
    doc.text(`Bt: ${orderId}`, mmToPt(14), mmToPt(106.85));
    // Middle Red block text
    doc.text(`Bt: ${orderId2 || ''}`, mmToPt(160), mmToPt(106.85));
    // Right Red block text
    doc.text(`Bt: ${orderId2 || ''}`, mmToPt(251), mmToPt(140));

    // 5. HD Order Information Print block (printed in the empty space)
    if (order || order2) {
      doc.fillColor('#1e3a8a').fontSize(16).text('BUTTERFLY BOX ORDER', mmToPt(155), mmToPt(30), { width: mmToPt(150), align: 'left' });
      
      doc.fillColor('#333333').fontSize(11).font('Helvetica');
      let y = 40;
      doc.text(`Blue Order ID:`, mmToPt(155), mmToPt(y)).font('Helvetica-Bold').text(`${order?.orderNumber || order?.id || 'N/A'}`, mmToPt(185), mmToPt(y));
      y += 6;
      doc.font('Helvetica').text(`Red Order ID:`, mmToPt(155), mmToPt(y)).font('Helvetica-Bold').text(`${order2?.orderNumber || order2?.id || 'N/A'}`, mmToPt(185), mmToPt(y));
      y += 6;
      doc.font('Helvetica').text(`Date:`, mmToPt(155), mmToPt(y)).font('Helvetica-Bold').text(`${order?.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}`, mmToPt(185), mmToPt(y));
      y += 10;
      
      doc.fillColor('#1e3a8a').fontSize(12).text('CUSTOMER DETAILS', mmToPt(155), mmToPt(y));
      y += 6;
      doc.fillColor('#333333').fontSize(10).font('Helvetica-Bold');
      const cust = order?.customer || {};
      const cust2 = order2?.customer || {};
      doc.text(`Blue: ${cust.name || 'No Name provided'}`, mmToPt(155), mmToPt(y));
      y += 5;
      doc.font('Helvetica').text(`${cust.phone || 'No Phone'} | ${cust.email || 'No Email'}`, mmToPt(155), mmToPt(y));
      y += 5;
      doc.font('Helvetica-Bold').text(`Red: ${cust2.name || 'No Name provided'}`, mmToPt(155), mmToPt(y));
      y += 5;
      doc.font('Helvetica').text(`${cust2.phone || 'No Phone'} | ${cust2.email || 'No Email'}`, mmToPt(155), mmToPt(y));
      y += 10;

      if (order.shippingAddress) {
        doc.fillColor('#1e3a8a').fontSize(12).font('Helvetica-Bold').text('SHIPPING ADDRESS', mmToPt(155), mmToPt(y));
        y += 6;
        doc.fillColor('#333333').fontSize(10).font('Helvetica');
        const addr = order.shippingAddress;
        doc.text(`${addr.address1 || ''}`, mmToPt(155), mmToPt(y));
        y += 5;
        if (addr.address2) { doc.text(`${addr.address2}`, mmToPt(155), mmToPt(y)); y += 5; }
        doc.text(`${addr.city || ''}, ${addr.province || ''} ${addr.zip || ''}`, mmToPt(155), mmToPt(y));
        y += 5;
        doc.text(`${addr.country || ''}`, mmToPt(155), mmToPt(y));
      }
    }

    doc.end();

    stream.on('finish', async () => {
      try {
        const { saveToGridFS } = require('./dbStorage');
        await saveToGridFS(filename, outputPath);
      } catch (gridfsErr) {
        console.error('[GridFS Butterfly Print PDF Save Error]', gridfsErr);
      }
      const stats = fs.statSync(outputPath);
      resolve({
        filename,
        path: outputPath,
        url: `/uploads/print/${filename}`,
        bytes: stats.size,
        widthMm: PAGE_WIDTH_MM,
        heightMm: PAGE_HEIGHT_MM,
        dpi: 300,
        effectiveDpi: 300,
        belowMinimumDpi: false,
        colourSpace: 'RGB',
        templateId: 'butterfly-box',
        generatedAt: new Date()
      });
    });

    stream.on('error', reject);
  });
}

module.exports = {
  generateButterflyBoxPdf
};


