import { Router } from "express";
import {
  createQuotation,
  createAdvancePayment,
  createFinalPayment,
  createInvoiceFromQuotation,
  recordPayment,
  createInvoiceFromAdvance,
  getInvoiceById,
  getInvoicesByType,
  getInvoiceStats,
} from '../controllers/Invoice.controllers.js';

import { getInvoiceSuggestions,searchInvoices} from "../controllers/Search.controllers.js"


const router = Router();
// Invoice creation routes
router.route('/quotation').post(createQuotation);
router.route('/advance-payment').post(createAdvancePayment);
router.route('/final-payment').post(createFinalPayment);
router.route('/invoice-from-quotation').post(createInvoiceFromQuotation);
router.route('/invoice-from-advance').post(createInvoiceFromAdvance);
// Payment recording route
router.route('/:invoiceId/payment').post(recordPayment);
// Get invoice routes
router.route("/stats").get(getInvoiceStats);
router.route("/type/:type").get(getInvoicesByType);
router.route("/:id").get(getInvoiceById);
// Search and autocomplete routes
// Search API routes
router.route("/search/suggestions").get(getInvoiceSuggestions);
router.route("/search").get(searchInvoices);
// PDF generation routes


export default router;