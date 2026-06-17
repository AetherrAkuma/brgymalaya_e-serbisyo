const nodemailer = require('nodemailer');

/**
 * Sends an email notification to residents or officials.
 * Falls back to console simulation if SMTP keys are not configured or if email is disabled.
 * 
 * @param {string} to - Recipient email address
 * @param {string} subject - Subject of the email
 * @param {string} htmlContent - HTML formatted email body
 */
async function sendEmail(to, subject, htmlContent) {
    const enabled = process.env.EMAIL_SERVICE_ENABLED === 'true';
    const host = process.env.SMTP_HOST;
    const port = process.env.SMTP_PORT || 587;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const from = process.env.SMTP_FROM || `"E-Serbisyo Barangay Malaya" <${user}>`;

    if (!enabled || !host || !user || !pass) {
        console.log('\n=================== [EMAIL SIMULATION] ===================');
        console.log(`To:      ${to}`);
        console.log(`Subject: ${subject}`);
        console.log('-------------------- Content --------------------');
        // Strip simple HTML tags for cleaner console reading if needed, but outputting HTML is fine
        console.log(htmlContent.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim());
        console.log('==========================================================\n');
        return { simulated: true, success: true };
    }

    try {
        const transporter = nodemailer.createTransport({
            host: host,
            port: parseInt(port),
            secure: parseInt(port) === 465, // true for port 465, false for other ports
            auth: {
                user: user,
                pass: pass
            }
        });

        const mailOptions = {
            from: from,
            to: to,
            subject: subject,
            html: htmlContent
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`[EMAIL] Mail successfully sent to ${to}. Message ID: ${info.messageId}`);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error(`[EMAIL ERROR] Failed to send email to ${to}:`, error.message);
        // Do not crash the application, return standard error status
        return { success: false, error: error.message };
    }
}

module.exports = { sendEmail };
