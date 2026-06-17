const path = require('path');
require('dotenv').config();
const { sendEmail } = require('./utils/emailSender');

async function run() {
    const to = process.argv[2];
    if (!to) {
        console.error("Error: Please provide a recipient email address.");
        console.log("Usage: node test-smtp.js recipient@example.com");
        process.exit(1);
    }

    console.log(`Sending test email to: ${to}...`);
    console.log(`Using SMTP settings:`);
    console.log(`- Enabled: ${process.env.EMAIL_SERVICE_ENABLED}`);
    console.log(`- Host: ${process.env.SMTP_HOST}`);
    console.log(`- Port: ${process.env.SMTP_PORT}`);
    console.log(`- User: ${process.env.SMTP_USER}`);

    const res = await sendEmail(
        to,
        "E-Serbisyo SMTP Connection Test",
        `<h3>Congratulations!</h3><p>Your SMTP configurations are correct. This test email was successfully sent from your E-Serbisyo Barangay Malaya Portal.</p>`
    );

    if (res.success && !res.simulated) {
        console.log("SUCCESS! Test email was successfully sent to SMTP server.");
    } else if (res.simulated) {
        console.log("SIMULATION LOGGED: EMAIL_SERVICE_ENABLED is false in .env. Email logged to console above.");
    } else {
        console.error("FAILED: Could not send email. Error:", res.error);
    }
    process.exit(0);
}

run();
