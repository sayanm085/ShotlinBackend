import nodemailer from 'nodemailer';


const mailsend = async (to, subject, html) => {

    const transporter = nodemailer.createTransport({
        service: 'Zoho Mail',
        port: 465,               // true for 465, false for other ports
        host: "smtppro.zoho.in",
        secure: true, // true for 465, false for other ports
        auth: {
            user: "noreply@shotlin.in",
            pass: "WTuemYh1Q9fF"
        }
    });

    const mailOptions = {
        from: 'Shotlin Team <noreply@shotlin.in>',
        to: to,
        subject: subject,
        html: html
    };

    try {
        const result = await transporter.sendMail(mailOptions);
        return result;
    } catch (error) {
        return error;
    }

};

export default mailsend;