import nodemailer from 'nodemailer';

import {  SMTP_PASSWORD,
    SMTP_USERNAME,
    EMAIL_FROM,
    SMTP_HOST,
    SMTP_PORT} from '../constants.js'
const mailsend = async (to, subject, html) => {

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        port: SMTP_PORT,               // true for 465, false for other ports
        host: SMTP_HOST,
        secure: true, // true for 465, false for other ports
        auth: {
            user: "shotlin085@gmail.com",
            pass:"frwwjsgyyrmassbk"

        }
    });

    const mailOptions = {
        from:"shotlin085@gmail.com",
        to: to,
        subject: subject,
        html: html
    };

    try {
        const result = await transporter.sendMail(mailOptions);
        console.log(result);
        return result.messageId;
    } catch (error) {
        return error;
    }

};

export default mailsend;