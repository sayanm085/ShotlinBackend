import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { createZoomMeeting } from "./utils/zoomService.js";
import mailsend from "./utils/nodemailer.utils.js";
// Create the Express app
let app = express();

// Enable CORS for all requests (for testing purposes) - ✅ Fix CORS policy
app.use(cors({
    origin: ['http://localhost:5173',"http://localhost:5174", "https://shotlin.in", "https://shotlin.com","http://shotlin.com","https://www.shotlin.com","http://www.shotlin.com","http://128.199.102.244","http://localhost:4173" ], 
    credentials: true, // ✅ Allow cookies
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // ✅ Fix methods property
    allowedHeaders: ['Content-Type', 'Authorization'], // ✅ Fix "Authorization " (extra space removed)
}));



app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({extended: true, limit: "16kb"}))
app.use(express.static("public"))
app.use(cookieParser())

app.get('/', (req, res) => {

res.json({message: "Welcome to the API or CL/CD testing done by Shotlin"});

});

app.post("/schedule-call", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) return res.status(400).json({ message: "Email is required" });
  
      const meetingLink = await createZoomMeeting(email);
      
        await mailsend(email, "Meeting Scheduled", `Your meeting has been scheduled. Click the link to join the meeting: ${meetingLink || "No link found"}`);
  
      res.status(200).json({ message: "Meeting scheduled!", meetingLink });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });












// POST route to set the cookie
app.post('/api/set-cookie', (req, res) => {
    res.cookie('myCookie', 'Hello', {
        httpOnly: true,   // Cookie can't be accessed via JavaScript
        secure: true,     // Cookie is only sent over HTTPS
        sameSite: 'None', // Allows cross-origin cookies (necessary in this case)
        maxAge: 1000 * 60 * 60 * 24 * 7  // Cookie expiration time (1 week)
    });
    res.json('Cookie set successfully');
});
// GET route to get the cookie
app.get("/api/get-cookie", (req, res) => {
    const myCookie = req.cookies?.myCookie;
    res.json({ cookieValue: myCookie });
});


//Routes Import
import userRoutes from './routes/user.routes.js';
import WebContent from './routes/webContent.routes.js';
import product  from './routes/product.routes.js';
import Contact from './routes/contact.routes.js';
import admin from './routes/admin.routes.js';
import invoice from './routes/Invoice.routes.js';
import discount from './routes/Discount.routes.js';


//Routes Definition
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/content', WebContent);
app.use('/api/v1/products', product);
app.use('/api/v1/contact', Contact);
app.use('/api/v1/invoice', invoice);
app.use('/api/v1/discount', discount);

//Admin Routes
app.use('/api/v1/admin', admin);


export default app;