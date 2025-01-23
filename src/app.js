const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');

// Create the Express app
let app = express();

app.use(cors({
    // Allow all origins
    origin: "*",
    credentials: true,  // Allow cookies to be sent with requests
    allowedHeaders: ['Content-Type', 'Authorization '], // Allow the Authorization header to be sent
    allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', ] // Allow the GET, POST, PUT, DELETE methods
}));

app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({extended: true, limit: "16kb"}))
app.use(express.static("public"))
app.use(cookieParser())

app.get('/', (req, res) => {
    res.json({message: "Welcome to the API"});
});

// POST route to set the cookie
app.post('/api/set-cookie', (req, res) => {
    res.cookie('myCookie', 'Hello', {
        httpOnly: true,   // Cookie can't be accessed via JavaScript
        secure: true,     // Cookie is only sent over HTTPS
        sameSite: 'None', // Allows cross-origin cookies (necessary in this case)
        maxAge: 1000 * 60 * 60 * 24 * 7  // Cookie expiration time (1 week)
    });
    res.send('Cookie set successfully');
});

// GET route to get the cookie
app.get("/api/get-cookie", (req, res) => {
    const myCookie = req.cookies?.myCookie;
    res.json({ cookieValue: myCookie });
});

// Routes Import
const userRoutes = require('./routes/user.routes.js');
const WebContent = require('./routes/webContent.routes.js');
const product = require('./routes/Product.routes.js');
const orders = require('./routes/order.routes.js');
const discountcoupon = require('./routes/DiscountCoupon.routes.js');
const Contact = require('./routes/Contact.routes.js');
const admin = require('./routes/admin.routes.js');

// Routes Definition
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/content', WebContent);
app.use('/api/v1/products', product);
app.use('/api/v1/orders', orders);
app.use('/api/v1/discountcoupon', discountcoupon);
app.use('/api/v1/contact', Contact);

// Admin Routes
app.use('/api/v1/admin', admin);

module.exports = app;
