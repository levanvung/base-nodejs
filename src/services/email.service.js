const nodemailer = require('nodemailer');
const { email } = require('@/configs/config.email');

// tạo transprter

const transporter = nodemailer.createTransport({
    host: email.host,
    port: email.port,
    secure: false,  // true for 465, false for other ports
    auth: {
        user: email.auth.user,
        pass: email.auth.pass
    }
});

const sendMail = async({to, subject, text, html}) => {
    try {
        const info = await transporter.sendMail({
            from: email.from,
            to,
            subject,
            text,
            html
        })
        console.log("Message sent: %s", info.messageId);
        return info;
    } catch (error) {
        console.error("Error sending email:", error);
        return null
    }
};

module.exports = {
    sendMail
};