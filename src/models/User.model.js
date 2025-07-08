import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import redisClient from "../db/Radis.db.js";
import mongoosePaginate from "mongoose-paginate-v2";
import {
  REFRESH_TOKEN_SECRET,
  REFRESH_TOKEN_EXPIRY,
  ACCESS_TOKEN_SECRET,
  ACCESS_TOKEN_EXPIRY,
} from "../constants.js";

const userSchema = new mongoose.Schema({
    
      username: {
        type: String,
        required: true,
        unique: true, // Ensure usernames are unique
        lowercase: true, // Convert username to lowercase
        trim: true, // Remove leading/trailing whitespace
        index: true, // Add an index for this field
      },
      varifyby: {
        type: String,
        required: true,
        default: 'email',
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
      gender: {
        type: String,
        required: false,
        enum: ["male", "female", "other"]
      },
      DOB: {
        type: Date,
        required: false
      },
      avatar: {
        default: null || "https://www.gravatar.com/avatar/",
        type: String, // URL to avatar image
      },
      password: {
        type: String,
        required: true,
      },
      phone: {
        default: null,
        type: Number,
        required: false,
        varify: false
      },
      shippingAddress: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Address'
      }],
      wishlist: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product' // Reference to the Product model (assumed you have a Product schema)
      }],

      otp: {
        type: Number,
        required: false
      },
      otpExpires: {
        type: Date,
        required: false
      },
      isVerified: {
        type: Boolean,
        default: false
      },

      MeetingSchedule: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MeetingSchedule'
      }],

      refreshToken: {
        type: String,
      },

},{timestamps: true});

// 🔥 Auto-remove Redis cache when a user's shipping address is updated
userSchema.post("save", async function () {
  if (this.isModified("shippingAddress")) {
    await redisClient.del(`user:${this._id}:shippingAddress`);
    console.log(`✅ Redis cache cleared for user ${this._id} due to address update`);
  }
});

// 🔥 Auto-remove Redis cache when a user is deleted
userSchema.post("findOneAndDelete", async function (doc) {
  if (doc) {
    await redisClient.del(`user:${doc._id}:shippingAddress`);
    console.log(`❌ Redis cache cleared for deleted user ${doc._id}`);
  }
});

// 🔒 Encrypt password before saving
userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});
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
          REFRESH_TOKEN_SECRET, // Refresh Token Secret key
        {
          expiresIn: "7d" // Token expires in 7 days
        }
    )
}

userSchema.methods.generateAccessToken= function(){  // Generate Access Token methods
    return jwt.sign(
        {
            _id: this._id,
        }, 
        ACCESS_TOKEN_SECRET, // Access Token Secret key
        {
          expiresIn: "1d" // Token expires in 1 day
        }
    )
}

userSchema.plugin(mongoosePaginate); // Add pagination plugin to the schema

let User= mongoose.model("User", userSchema);

export default User; // Export User model