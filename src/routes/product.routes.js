import { Router } from "express";
import {productUpload} from "../controllers/ProductList.controllers.js";
import upload from "../middlewares/multer.middleware.js";


const router = Router();

Router.route("/product-upload").get().post(upload.fields([
    { name: "heroImage", maxCount: 5 },
]), productUpload);


