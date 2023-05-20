const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    
    const transporter = nodemailer.createTransport({
        host: process.env.HOST,
        service: process.env.SERVICE,
        port: process.env.EMAIL_PORT,
        secure: process.env.SECURE,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
        }
    });

    const message = {
        from: process.env.EMAIL_USER,
        to: options.email,
        subject: options.subject,
        text: options.message
    }
    const info = await transporter.sendMail(message);
    console.log('Message sent: %s', info.messageId);
}

module.exports = sendEmail;