const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const QRCode = require('qrcode');

/**
 * Generates a secured Barangay Document.
 * @param {Object} data - Request data with resident info (contains .purpose)
 * @param {Buffer} sigBuffer - Decrypted signature image buffer
 * @param {string} qrHash - QR code hash for verification
 * @param {Object} layout - Layout configuration from database (JSON)
 * @param {Buffer} templateBuffer - Decrypted template background buffer
 */
async function generateBarangayPDF(data, sigBuffer, qrHash, layout, templateBuffer = null) {
    let pdfDoc;
    let page;

    const A4_WIDTH = 595.28;
    const A4_HEIGHT = 841.89;

    // 1. Initialize Document and Handle Background Template
    if (templateBuffer && templateBuffer.length > 0) {
        try {
            const isPdf = templateBuffer.length >= 4 && templateBuffer.toString('utf8', 0, 4) === '%PDF';
            
            if (isPdf) {
                // Load existing PDF as template
                pdfDoc = await PDFDocument.load(templateBuffer);
                page = pdfDoc.getPages()[0];
            } else {
                // Detect Image Type (PNG or JPG)
                let finalBuffer = templateBuffer;
                let isPng = templateBuffer.length >= 8 && templateBuffer.toString('hex', 0, 8) === '89504e470d0a1a0a';
                let isJpg = templateBuffer.length >= 2 && templateBuffer[0] === 0xFF && templateBuffer[1] === 0xD8;

                // Fallback for WebP, HEIC, BMP, etc. via sharp conversion
                if (!isPng && !isJpg) {
                    try {
                        const sharp = require('sharp');
                        finalBuffer = await sharp(templateBuffer).png().toBuffer();
                        isPng = true; // after sharp processing, it is natively a PNG
                    } catch (err) {
                        throw new Error("Background conversion via sharp failed: " + err.message + ". File might be corrupted.");
                    }
                }

                pdfDoc = await PDFDocument.create();
                page = pdfDoc.addPage([A4_WIDTH, A4_HEIGHT]); 
                const { width, height } = page.getSize();
                
                const bgImage = isPng ? await pdfDoc.embedPng(finalBuffer) : await pdfDoc.embedJpg(finalBuffer);
                
                page.drawImage(bgImage, { x: 0, y: 0, width: width, height: height });
            }
        } catch (e) {
            console.error("Template processing failed, using blank page:", e.message);
            pdfDoc = await PDFDocument.create();
            page = pdfDoc.addPage([A4_WIDTH, A4_HEIGHT]);
        }
    } else {
        pdfDoc = await PDFDocument.create();
        page = pdfDoc.addPage([A4_WIDTH, A4_HEIGHT]);
    }

    const { height } = page.getSize();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Helper: Map Top-Down (Frontend) to Bottom-Up (PDF-Lib) coordinates
    const getPos = (key, defX, defY) => ({
        x: parseFloat(layout[key]?.x ?? defX),
        y: height - parseFloat(layout[key]?.y ?? defY)
    });

    // 2. Draw Resident Name
    const namePos = getPos('name', 100, 200);
    // pdf-lib's y is the baseline. We subtract the exact font size to marry the baseline strictly to the bottom threshold of the frontend's visual bounding box
    page.drawText(`${data.first_name.toUpperCase()} ${data.last_name.toUpperCase()}`, { 
        x: namePos.x, y: namePos.y - 14, size: 14, font: bold 
    });

    // 3. Draw ONLY the Purpose
    const purposeKey = layout.purpose ? 'purpose' : 'body';
    const purposePos = getPos(purposeKey, 70, 300);
    const purposeText = data.purpose || "N/A";
    
    page.drawText(purposeText, {
        x: purposePos.x, y: purposePos.y - 11, size: 11, font, maxWidth: 450, lineHeight: 15
    });

    // 4. Digital Signature
    if (sigBuffer) {
        const sigPos = getPos('signature', 380, 600);
        try {
            const sigImg = await pdfDoc.embedPng(sigBuffer);
            // pdf-lib's y is bottom-left for images. Subtract image height to align top-left
            page.drawImage(sigImg, { x: sigPos.x, y: sigPos.y - 70, width: 150, height: 70 });
        } catch (e) {}
    }

    // 5. Verification QR
    const qrPos = getPos('qr', 50, 700);
    try {
        const qrDataUrl = await QRCode.toDataURL(`https://brgy-verify.gov.ph/${qrHash}`);
        const qrImg = await pdfDoc.embedPng(qrDataUrl);
        page.drawImage(qrImg, { x: qrPos.x, y: qrPos.y - 90, width: 90, height: 90 });
    } catch (e) {}

    const refPos = getPos('reference', 50, 800);
    page.drawText(`VERIFICATION REF: ${data.reference_no}`, { x: refPos.x, y: refPos.y - 7, size: 7, font });

    return Buffer.from(await pdfDoc.save());
}

module.exports = { generateBarangayPDF };