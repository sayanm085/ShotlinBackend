import { SendMailClient } from "zeptomail";
import {
  ZEPTOMAIL_URL,      // e.g., "https://api.zeptomail.in"
  ZEPTOMAIL_TOKEN,    // Your secure Zoho encoded token
  EMAIL_FROM,         // e.g., "noreply@yourdomain.com"
  EMAIL_FROM_NAME     // e.g., "Your App Name"
} from "../constants.js";

// Initialize ZeptoMail client with production configuration
const client = new SendMailClient({
  url: ZEPTOMAIL_URL,
  token: ZEPTOMAIL_TOKEN,
});

const sendMail = async (to, subject, html) => {
  // Extract the part before "@" to use as the recipient's name
  const recipientName = to.split("@")[0];

  const emailData = {
    from: {
      address: EMAIL_FROM,
      name: EMAIL_FROM_NAME,
    },
    to: [
      {
        email_address: {
          address: to,
          name: recipientName,
        }
      }
    ],
    subject,
    htmlbody: html,
  };

  try {
    const response = await client.sendMail(emailData);
    console.log("Email sent successfully:", response);
    return response;
  } catch (error) {
    console.error("Failed to send email:", error);
    throw error;
  }
};

export default sendMail;
