import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userSchema = new mongoose.Schema({
    
      username: {
        type: String,
        required: true,
        unique: true, // Ensure usernames are unique
        lowercase: true, // Convert username to lowercase
        trim: true, // Remove leading/trailing whitespace
        index: true, // Add an index for this field
      },
      email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
      },
      fullName: {
        type: String,
        required: true,
        trim: true,
        index: true,
      },
      avatar: {
        type: String, // URL to avatar image
      },
      coverImage: {
        type: String, // URL to cover image
      },
      watchHistory: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Video'  // Reference to your Video model (if you have one)
      }],
      password: {
        type: String,
        required: true,
      },
      refreshToken: {
        type: String,
      },

},{timestamps: true});

userSchema.pre("save", async function (next){ // encrypt password before saving
    if(this.isModified("password")){
        this.password= await bcrypt.hash(this.password, 10);
    }
    next();
} )

// *user model main code end here


// user model methods start here

userSchema.methods.verifyPassword= async function(password){ // Verify Password methods
    return await bcrypt.compare(password, this.password);
}


userSchema.methods.generaterefreshToken= function(){ // Generate Refresh Token methods 
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            fullName: this.fullName,
        
        }, 
        process.env.REFRESH_TOKEN_SECRET, // Refresh Token Secret key
        {
            expiresIn:process.env.REFRESH_TOKEN_EXPIRY  // Token expires in 7 days
        }
    )
}

userSchema.methods.generateAccessToken= function(){  // Generate Access Token methods
    return jwt.sign(
        {
            _id: this._id,
        }, 
        process.env.ACCESS_TOKEN_SECRET, // Access Token Secret key
        {
            expiresIn:process.env.ACCESS_TOKEN_EXPIRY  // Token expires in 1 day
        }
    )
}

export let User= mongoose.model("User", userSchema);