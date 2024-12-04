import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import crypto from 'crypto';


let a= async () => {
  let data = await fetch('https://api.github.com/users/defunkt',{
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    }
  }
  )
}

// Create the Express app
let app = express();

app.use(cors({
    origin: true , // Allow all origins
    credentials: true, // Allow cookies to be sent
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


//Routes Import
import userRoutes from './routes/user.routes.js';
import WebContent from './routes/webContent.routes.js';


//Routes Definition
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/content', WebContent);



export default app;