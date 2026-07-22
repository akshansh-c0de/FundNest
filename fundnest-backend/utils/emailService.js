import nodemailer from 'nodemailer';

const sendEmail = async ({ to, subject, text, html }) => {
    // In production/development, check if we have SMTP details
    const hasSmtp =
        process.env.SMTP_HOST &&
        process.env.SMTP_PORT &&
        process.env.SMTP_USER &&
        process.env.SMTP_PASS;

    if (!hasSmtp) {
        console.log('\n--- [EMAIL SERVICE MOCK] ---');
        console.log(`To:      ${to}`);
        console.log(`Subject: ${subject}`);
        console.log(`Text:    ${text}`);
        if (html) {
            console.log(`HTML:    (omitted, text version used instead or available)`);
        }
        console.log('-----------------------------\n');
        return { success: true, mock: true };
    }

    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT, 10),
        secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });

    const mailOptions = {
        from: process.env.FROM_EMAIL || '"FundNest Support" <support@fundnest.com>',
        to,
        subject,
        text,
        html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully: ${info.messageId}`);
    return info;
};

export { sendEmail };
