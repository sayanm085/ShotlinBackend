import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import crypto from 'crypto';
let app = express();

app.use(cors())

app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({extended: true, limit: "16kb"}))
app.use(express.static("public"))
app.use(cookieParser())

app.get('/', (req, res) => {
// // Generate a random salt (128 bits)
// const salt = crypto.randomBytes(16);

// // Use PBKDF2 to derive a 512-bit key from the salt and a random secret
// crypto.pbkdf2(crypto.randomBytes(64), salt, 100000, 64, 'sha512', (err, derivedKey) => {
//   if (err) throw err;

//   const encryptionSecret = derivedKey.toString('hex');  // Convert the derived key to hex format
//   console.log('Encryption Secret Token:', encryptionSecret);

// });
res.send('Encryption Secret Token Generated');

});

//Routes Import
import userRoutes from './routes/user.routes.js';


//Routes Definition
app.use('/api/v1/users', userRoutes);




export default app;