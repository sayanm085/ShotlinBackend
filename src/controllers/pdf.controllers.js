import Invoice from '../models/invoiceSchema.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import uploadImage from "../utils/cloudinary.js";

// invoice PDF upload route
export const createInvoicesPDF = asyncHandler(async (req, res) => {
  const { invoiceId } = req.params;
  const invoice = await Invoice.findById(invoiceId);
  if (!invoice) {
    return ApiResponse.notFound(res, 'Invoice not found');
  } 

  if (!req.file) {
    return ApiResponse.badRequest(res, 'No file uploaded');
  }     

  // Upload the PDF to cloud storage
  const uploadResult = await uploadImage(req.file);
  if (!uploadResult) {
    return ApiResponse.internalServerError(res, 'Failed to upload PDF');
  }

  // Update the invoice with the PDF URL
  invoice.pdfUrl = uploadResult.secure_url;
  await invoice.save();

  return ApiResponse.success(res, 'Invoice PDF created successfully', invoice);
});



