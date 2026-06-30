const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Generates a real print-ready PDF for an order and saves it to the uploads folder.
 * @param {string} orderId - The order ID/display ID
 * @param {Object} order - The order document from MongoDB
 * @returns {Promise<string>} The filename of the generated PDF
 */
function generatePDF(orderId, order) {
  return new Promise((resolve, reject) => {
    try {
      const cleanId = orderId.replace('#', '');
      const filename = `THEPRINK_${cleanId}_${order.customer.replace(/\s+/g, '_')}_VECTOR_PRINT.pdf`;
      const uploadsDir = path.join(__dirname, '..', 'uploads');
      
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      
      const outputPath = path.join(uploadsDir, filename);

      // Determine dimensions based on product type
      // 72 PDF points = 1 inch
      let width = 612;  // 8.5 inches default
      let height = 792; // 11 inches default
      let isLandscape = false;

      const prodLower = (order.product || '').toLowerCase();
      if (prodLower.includes('mug')) {
        // Coffee Mug Wrap: 8.5" x 3.0"
        width = 8.5 * 72; // 612
        height = 3.0 * 72; // 216
        isLandscape = true;
      } else if (prodLower.includes('canvas')) {
        // Stretch Canvas: 12" x 16"
        width = 12 * 72; // 864
        height = 16 * 72; // 1152
      } else if (prodLower.includes('frame')) {
        // Photo Frame: 8" x 10"
        width = 8 * 72;  // 576
        height = 10 * 72; // 720
      }

      // Create PDF Document
      const doc = new PDFDocument({
        size: [width, height],
        margin: 0,
        info: {
          Title: `THE PRINK Order ${orderId}`,
          Author: 'THE PRINK Automation Engine',
          Subject: `${order.product} Layout Sheet`,
        }
      });

      const writeStream = fs.createWriteStream(outputPath);
      doc.pipe(writeStream);

      // 1. Draw Theme Background Color
      // Map theme id to hex colors
      const themeColors = {
        classic: '#ffffff',
        rustic: '#f5e6d0',
        ocean: '#e0f0ff',
        rose: '#fce4ec',
        midnight: '#0d1b2a',
        vintage: '#fdf3e7'
      };
      
      const themeTextColors = {
        classic: '#171C62',
        rustic: '#5a3d28',
        ocean: '#005f73',
        rose: '#880e4f',
        midnight: '#e0f1f8',
        vintage: '#7a5a00'
      };

      const selectedTheme = order.theme || 'classic';
      const bgColor = themeColors[selectedTheme] || '#ffffff';
      const textColor = themeTextColors[selectedTheme] || '#171C62';

      doc.rect(0, 0, width, height).fill(bgColor);

      // 2. Draw Subtle Border & Trim Guides (Calibration Lines)
      doc.lineWidth(1);
      doc.strokeColor('#e0e0e0');
      doc.rect(10, 10, width - 20, height - 20).stroke();

      // Calibration Registration circles at 4 corners
      const drawRegistrationMark = (x, y) => {
        doc.lineWidth(0.5);
        doc.strokeColor('#ff0055'); // Magenta calibration mark
        doc.circle(x, y, 6).stroke();
        doc.moveTo(x - 10, y).lineTo(x + 10, y).stroke();
        doc.moveTo(x, y - 10).lineTo(x, y + 10).stroke();
      };
      drawRegistrationMark(20, 20);
      drawRegistrationMark(width - 20, 20);
      drawRegistrationMark(20, height - 20);
      drawRegistrationMark(width - 20, height - 20);

      // 3. Draw Brand Label / Header
      doc.fillColor(textColor);
      doc.font('Helvetica-Bold').fontSize(12);
      doc.text('THE PRINK — PRINT RESOLUTION MASTER', 30, 25);
      
      doc.font('Helvetica').fontSize(8).fillColor('#888888');
      doc.text(`ORDER ID: ${orderId} | CUSTOMER: ${order.customer} | DATE: ${order.date || new Date().toDateString()}`, 30, 40);

      // 4. Draw Customer Uploaded Images
      if (order.images && order.images.length > 0) {
        // For simplicity, embed the first image
        const imgObj = order.images[0];
        const localImgPath = path.join(uploadsDir, imgObj.serverFilename || '');
        
        if (fs.existsSync(localImgPath)) {
          // Calculate target area inside the margins
          // Leave room at the bottom for metadata, caption, and calibration text
          const verticalPadding = isLandscape ? 60 : 150;
          const targetWidth = width - 80;
          const targetHeight = height - verticalPadding;
          
          doc.image(localImgPath, 40, 55, {
            fit: [targetWidth, targetHeight],
            align: 'center',
            valign: 'center'
          });

          // Print image filename and original name
          doc.fillColor('#888888').fontSize(6).text(`File: ${imgObj.originalName || 'uploaded_image'} (${imgObj.serverFilename})`, 40, height - 22);
        } else {
          // Placeholder box if image file is missing (e.g. testing context)
          doc.strokeColor('#ff0000');
          doc.rect(40, 55, width - 80, height - 150).stroke();
          doc.fillColor('#ff0000').font('Helvetica-Bold').fontSize(14);
          doc.text('IMAGE FILE NOT FOUND ON DISK', width / 2 - 120, height / 2 - 10, { width: 240, align: 'center' });
        }
      } else {
        // Fallback for mock orders with no uploads
        doc.strokeColor('#cccccc');
        doc.rect(40, 55, width - 80, height - 150).stroke();
        doc.fillColor('#999999').font('Helvetica-Oblique').fontSize(14);
        doc.text('[Awaiting Image Submission from Customer]', width / 2 - 150, height / 2 - 10, { width: 300, align: 'center' });
      }

      // 5. Draw Caption / Text if exists
      if (order.caption) {
        const textY = height - 65;
        doc.fillColor(textColor).font('Helvetica-BoldOblique').fontSize(12);
        doc.text(`"${order.caption}"`, 40, textY, {
          width: width - 80,
          align: 'center'
        });
      }

      // 6. Draw Footer CMYK color calibration bars
      const barY = height - 40;
      const barWidth = 20;
      const barHeight = 8;
      const colors = ['#00FFFF', '#FF00FF', '#FFFF00', '#000000']; // CMYK
      colors.forEach((col, index) => {
        doc.rect(40 + (index * 25), barY, barWidth, barHeight).fill(col);
      });
      
      doc.fillColor('#888888').font('Helvetica').fontSize(6);
      doc.text('CMYK CALIBRATION GUIDE', 150, barY + 2);

      // Finalize PDF file
      doc.end();

      writeStream.on('finish', () => {
        console.log(`[PDF GENERATOR] Successfully compiled PDF to ${outputPath}`);
        resolve(filename);
      });

      writeStream.on('error', (err) => {
        reject(err);
      });

    } catch (err) {
      reject(err);
    }
  });
}

module.exports = { generatePDF };
