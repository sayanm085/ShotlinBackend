import Product from '../models/product.model.js';
import {asyncHandler} from '../utils/asyncHandler.js';
import {ApiResponse} from '../utils/ApiResponse.js';
import uploadImage from '../utils/cloudinary.js';
import e from 'express';



// Product upload controller 

const productUpload = asyncHandler(async (req, res, next) => {

    res.status(200).json(ApiResponse("success", "Product uploaded successfully"));

});



export {productUpload};
