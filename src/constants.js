import dotenv from 'dotenv';
dotenv.config();

const PORT = 3000;
 
 const DB_NAME = "Shotlin";
 const DATABASE_URL="mongodb+srv://Shotlin0912:Shotlin0912@shotlin.jpiyx.mongodb.net"

// cloudinary key 
 const CLOUDINARY_CLOUD_NAME= "shotlin";
 const CLOUDINARY_API_KEY= 452998463171572;
 const CLOUDINARY_API_SECRET= "ycIqO_ahCJv_EHtiF5sk40EP-7E";

 // razerpay key 
 const RAZORPAY_KEY_ID= "rzp_test_eVN0FscTOIsBqP";
 const RAZORPAY_KEY_SECRET= "vP70TYiJruIcQ0CMM6ecN6eA";

 //Nodemail Configuration for email sending
const SMTP_PASSWORD = "jTU3drvBQL56";
const SMTP_USERNAME = "noreply@shotlin.in";
const EMAIL_FROM = "Shotlin Team<noreply@shotlin.in>";
const SMTP_HOST = "smtp.zoho.in";
const SMTP_PORT = 465;

// radis Configuration for caching
const REDIS_USERNAME= "default";
const REDIS_PASSWORD="w0qm0OsbyFWXZz4mf16nEKyjpjl0eHM0";
const REDIS_HOST="redis-11835.c295.ap-southeast-1-1.ec2.redns.redis-cloud.com";
const REDIS_PORT=11835;

// JWT Configuration for token generation and verification 
const REFRESH_TOKEN_SECRET="bcc16f213859c1cfe9806871b1f4f5f8211e678bd168d84e76555e0863bab9d5bd79df0643700fe2ac39890027f938e8169bf2461d30c7e4e0e69d971df776fe";
const REFRESH_TOKEN_EXPIRY = "7d";
const ACCESS_TOKEN_SECRET="19202fe8fe06291ddd59bcef7b937d154bc1564204702db04eca5cf6c29e72731e599a419c497067bde0d7b322bfb55b8e097e26f3b84dc32fbffb1e8a4a7bcc"
const ACCESS_TOKEN_EXPIRY = "1d";
 
export {
  PORT,
  DB_NAME,
  DATABASE_URL,
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
  RAZORPAY_KEY_ID,
  RAZORPAY_KEY_SECRET,
  SMTP_PASSWORD,
  SMTP_USERNAME,
  EMAIL_FROM,
  SMTP_HOST,
  SMTP_PORT,
    REDIS_USERNAME,
    REDIS_PASSWORD,
    REDIS_HOST,
    REDIS_PORT,

    REFRESH_TOKEN_SECRET,
    REFRESH_TOKEN_EXPIRY,
    ACCESS_TOKEN_SECRET,
    ACCESS_TOKEN_EXPIRY

};