const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const QRCode = require('qrcode');

/**
 * Generates a secured Barangay Document.
 * Supports PDF Templates or Image Templates (PNG/JPG).
 * @param {Object} data - Request data with resident info
 * @param {Buffer} sigBuffer - Decrypted signature image buffer
 * @param {string} qrHash - QR code hash for verification
 * @param {Object} layout - Layout configuration from database (JSON)
 * @param {Buffer} templateBuffer - Optional template background buffer
 */
async function generateBarangayPDF(data, sigBuffer, qrHash, layout, templateBuffer = null) {
    let pdfDoc;
    let page;

    // A4 Size: 595.28 x 841.89 points
    const A4_WIDTH = 595.28;
    const A4_HEIGHT = 841.89;

    // 1. Initialize Document based on Template Type
    if (templateBuffer && templateBuffer.length > 0) {
        try {
            // Check if buffer is a PDF by looking for the magic number %PDF
            const isPdf = templateBuffer.length >= 4 && templateBuffer.toString('utf8', 0, 4) === '%PDF';
            
            if (isPdf) {
                // Load existing PDF as template
                pdfDoc = await PDFDocument.load(templateBuffer);
                page = pdfDoc.getPages()[0];
            } else {
                // Treat as an image template (PNG/JPG)
                pdfDoc = await PDFDocument.create();
                page = pdfDoc.addPage([A4_WIDTH, A4_HEIGHT]); // A4
                const { width, height } = page.getSize();
                
                // Detect image type
                const isPng = templateBuffer.length >= 8 && templateBuffer.toString('hex', 0, 8) === '89504e470d0a1a0a';
                const bgImage = isPng ? await pdfDoc.embedPng(templateBuffer) : await pdfDoc.embedJpg(templateBuffer);
                
                page.drawImage(bgImage, {
                    x: 0, y: 0, width: width, height: height
                });
            }
        } catch (e) {
            console.error("Template processing failed, using blank page.", e.message);
            pdfDoc = await PDFDocument.create();
            page = pdfDoc.addPage([A4_WIDTH, A4_HEIGHT]);
        }
    } else {
        // No template - create blank A4 page
        pdfDoc = await PDFDocument.create();
        page = pdfDoc.addPage([A4_WIDTH, A4_HEIGHT]);
    }

    const { height } = page.getSize();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Helper: Map intuitive "Top-Down" coordinates to pdf-lib's "Bottom-Up" coordinates
    const getPos = (key, defX, defY) => ({
        x: layout[key]?.x ?? defX,
        y: height - (layout[key]?.y ?? defY)
    });

    // 2. Draw Dynamic Content
    const namePos = getPos('name', 100, 200);
    page.drawText(`${data.first_name.toUpperCase()} ${data.last_name.toUpperCase()}`, { 
        x: namePos.x, y: namePos.y, size: 14, font: bold 
    });

    const bodyPos = getPos('body', 70, 300);
    const bodyText = `This is to certify that the individual named above is a bona fide resident of ${data.address_street}. Purpose: ${data.purpose}.`;
    page.drawText(bodyText, {
        x: bodyPos.x, y: bodyPos.y, size: 11, font, maxWidth: 450, lineHeight: 18
    });

    // 3. Digital Signature
    if (sigBuffer) {
        const sigPos = getPos('signature', 380, 600);
        try {
            const sigImg = await pdfDoc.embedPng(sigBuffer);
            page.drawImage(sigImg, { x: sigPos.x, y: sigPos.y, width: 150, height: 70 });
        } catch (e) {}
    }

    // 4. Verification QR
    const qrPos = getPos('qr', 50, 700);
    const qrDataUrl = await QRCode.toDataURL(`https://brgy-verify.gov.ph/${qrHash}`);
    const qrImg = await pdfDoc.embedPng(qrDataUrl);
    page.drawImage(qrImg, { x: qrPos.x, y: qrPos.y, width: 90, height: 90 });

    const refPos = getPos('reference', 50, 800);
    page.drawText(`VERIFICATION REF: ${data.reference_no}`, { x: refPos.x, y: refPos.y, size: 7, font });

    return Buffer.from(await pdfDoc.save());
}

module.exports = { generateBarangayPDF };