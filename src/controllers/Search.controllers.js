/**
 * Search Controller for Invoices
 * 
 * Last updated: 2025-07-15 07:48:03
 * Author: sayanm085
 */

import Invoice from '../models/invoiceSchema.model.js';
import Client from "../models/Client.model.js";
import Project from '../models/Project.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';

/**
 * Get search suggestions for invoices
 * This endpoint returns invoice suggestions that match the search query
 * @route GET /api/v1/invoice/search-suggestions
 * @access Private
 */
export const getInvoiceSuggestions = asyncHandler(async (req, res) => {
    const query = req.query.q || "";
    const limit = parseInt(req.query.limit) || 10;
    const type = req.query.type || null; // Optional filter by invoice type
    
    // Return empty array for queries less than 2 characters
    if (query.length < 2) {
        return res.status(200).json(
            new ApiResponse(200, { suggestions: [] }, "Minimum 2 characters required")
        );
    }
    
    try {
        // Build the base search query
        const baseQuery = { isDeleted: false };
        
        // Add text search conditions
        const searchConditions = [
            { invoiceNumber: { $regex: query, $options: 'i' } },
            { 'projectDetails.name': { $regex: query, $options: 'i' } },
            { 'services.name': { $regex: query, $options: 'i' } }
        ];
        
        // Add type filter if specified
        if (type && ['quotation', 'advance', 'final'].includes(type)) {
            baseQuery.type = type;
        }
        
        // Final query with search conditions
        baseQuery.$or = searchConditions;
        
        // Get matching invoices with populated references
        const invoices = await Invoice.find(baseQuery)
            .populate('client', 'name email phone address gstin panNumber')
            .populate('project', 'name description')
            .sort({ createdAt: -1 })
            .limit(limit)
            .lean(); // Use lean() for better performance
        
        // Get client IDs from the results for additional searching
        const clientIds = invoices.map(invoice => invoice.client?._id).filter(Boolean);
        
        // Search for additional clients if needed
        if (clientIds.length < limit) {
            const clientQuery = {
                name: { $regex: query, $options: 'i' },
                _id: { $nin: clientIds }
            };
            
            const clients = await Client.find(clientQuery)
                .limit(limit - clientIds.length)
                .select('name email phone address gstin panNumber')
                .lean();
            
            // Find invoices for these clients
            const clientInvoices = await Invoice.find({ 
                    client: { $in: clients.map(c => c._id) },
                    isDeleted: false
                })
                .populate('client', 'name email phone address gstin panNumber')
                .populate('project', 'name description')
                .sort({ createdAt: -1 })
                .limit(clients.length)
                .lean();
            
            // Merge results
            invoices.push(...clientInvoices);
        }
        
        // Process results to add highlighting and categorization
        const suggestions = processInvoiceResults(invoices, query);
        
        return res.status(200).json(
            new ApiResponse(200, { 
                suggestions,
                query
            }, "Invoice suggestions fetched successfully")
        );
    } catch (error) {
        console.error("Invoice search error:", error);
        return res.status(500).json(
            new ApiResponse(500, null, "Error fetching invoice suggestions")
        );
    }
});

/**
 * Process invoice results to add highlighting and formatting
 */
function processInvoiceResults(invoices, query) {
    return invoices.map(invoice => {
        // Create regex for highlighting
        const regex = new RegExp(`(${escapeRegExp(query)})`, 'gi');
        
        // Extract client and project data safely
        const clientName = invoice.client?.name || '';
        const projectName = invoice.project?.name || invoice.projectDetails?.name || '';
        
        // Determine match type and create highlighted fields
        const isInvoiceNumberMatch = regex.test(invoice.invoiceNumber);
        const isClientMatch = clientName && regex.test(clientName);
        const isProjectMatch = projectName && regex.test(projectName);
        
        // Reset regex for each field
        regex.lastIndex = 0;
        
        // Create highlighted versions
        const highlightedInvoiceNumber = isInvoiceNumberMatch 
            ? invoice.invoiceNumber.replace(regex, '<strong>$1</strong>') 
            : invoice.invoiceNumber;
            
        regex.lastIndex = 0;
        const highlightedClientName = clientName && isClientMatch 
            ? clientName.replace(regex, '<strong>$1</strong>') 
            : clientName;
            
        regex.lastIndex = 0;
        const highlightedProjectName = projectName && isProjectMatch 
            ? projectName.replace(regex, '<strong>$1</strong>') 
            : projectName;
        
        // Format date
        const formattedDate = invoice.issueDate 
            ? new Date(invoice.issueDate).toLocaleDateString('en-IN', { 
                day: '2-digit', 
                month: 'short', 
                year: 'numeric' 
              }) 
            : '';
        
        // Format amount
        const formattedAmount = invoice.summary && invoice.summary.total 
            ? new Intl.NumberFormat('en-IN', {
                style: 'currency',
                currency: 'INR',
                maximumFractionDigits: 0
              }).format(invoice.summary.total)
            : '';
        
        // Determine primary display text based on match type
        let primaryText, primaryMatch;
        if (isInvoiceNumberMatch) {
            primaryText = highlightedInvoiceNumber;
            primaryMatch = 'invoiceNumber';
        } else if (isClientMatch) {
            primaryText = highlightedClientName;
            primaryMatch = 'client';
        } else if (isProjectMatch) {
            primaryText = highlightedProjectName;
            primaryMatch = 'project';
        } else {
            primaryText = invoice.invoiceNumber;
            primaryMatch = 'invoiceNumber';
        }
        
        // Create status display info
        let statusClass = 'text-gray-600';
        switch (invoice.status) {
            case 'draft':
                statusClass = 'text-blue-600';
                break;
            case 'sent':
                statusClass = 'text-yellow-600';
                break;
            case 'paid':
                statusClass = 'text-green-600';
                break;
            case 'overdue':
                statusClass = 'text-red-600';
                break;
            case 'cancelled':
                statusClass = 'text-gray-600';
                break;
        }
        
        // Get invoice type display
        const typeDisplay = {
            'quotation': 'Quotation',
            'advance': 'Advance Payment',
            'final': 'Final Invoice'
        }[invoice.type] || invoice.type;
        
        return {
            _id: invoice._id,
            invoiceNumber: invoice.invoiceNumber,
            type: invoice.type,
            typeDisplay,
            clientName: clientName,
            projectName: projectName,
            status: invoice.status,
            issueDate: invoice.issueDate,
            total: invoice.summary ? invoice.summary.total : 0,
            
            // Include full client and project objects for reference
            client: invoice.client,
            project: invoice.project,
            
            // Display formatting
            highlightedInvoiceNumber,
            highlightedClientName,
            highlightedProjectName,
            formattedDate,
            formattedAmount,
            primaryText,
            primaryMatch,
            statusClass,
            
            // Secondary info for display
            secondaryInfo: `${typeDisplay} • ${formattedDate} • ${formattedAmount}`
        };
    });
}

/**
 * Advanced search for invoices with filters and pagination
 * @route GET /api/v1/invoice/search
 * @access Private
 */
export const searchInvoices = asyncHandler(async (req, res) => {
    const {
        query = "",
        type,
        status,
        clientId,
        startDate,
        endDate,
        minAmount,
        maxAmount,
        page = 1,
        limit = 10,
        sortBy = "createdAt",
        sortOrder = "desc"
    } = req.query;
    
    try {
        // Build the search query
        const searchQuery = { isDeleted: false };
        
        // Text search if query provided
        if (query && query.length >= 2) {
            searchQuery.$or = [
                { invoiceNumber: { $regex: query, $options: 'i' } },
                { 'projectDetails.name': { $regex: query, $options: 'i' } },
                { 'services.name': { $regex: query, $options: 'i' } }
            ];
        }
        
        // Type filter
        if (type && ['quotation', 'advance', 'final'].includes(type)) {
            searchQuery.type = type;
        }
        
        // Status filter
        if (status) {
            searchQuery.status = status;
        }
        
        // Client filter
        if (clientId) {
            searchQuery.client = clientId;
        }
        
        // Date range filter
        if (startDate || endDate) {
            searchQuery.issueDate = {};
            
            if (startDate) {
                searchQuery.issueDate.$gte = new Date(startDate);
            }
            
            if (endDate) {
                searchQuery.issueDate.$lte = new Date(endDate);
            }
        }
        
        // Amount range filter
        if (minAmount || maxAmount) {
            searchQuery['summary.total'] = {};
            
            if (minAmount) {
                searchQuery['summary.total'].$gte = parseFloat(minAmount);
            }
            
            if (maxAmount) {
                searchQuery['summary.total'].$lte = parseFloat(maxAmount);
            }
        }
        
        // Configure sort
        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;
        
        // Calculate pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        // Execute search query with pagination and populated references
        const invoices = await Invoice.find(searchQuery)
            .populate('client', 'name email phone address gstin panNumber')
            .populate('project', 'name description')
            .sort(sortOptions)
            .skip(skip)
            .limit(parseInt(limit))
            .lean();
            
        // Get total count for pagination
        const total = await Invoice.countDocuments(searchQuery);
        
        // Calculate total pages
        const pages = Math.ceil(total / parseInt(limit));
        
        // Process results
        const results = invoices.map(invoice => {
            // Extract client and project names safely
            const clientName = invoice.client?.name || '';
            const projectName = invoice.project?.name || invoice.projectDetails?.name || '';
            
            return {
                _id: invoice._id,
                invoiceNumber: invoice.invoiceNumber,
                type: invoice.type,
                typeDisplay: {
                    'quotation': 'Quotation',
                    'advance': 'Advance Payment',
                    'final': 'Final Invoice'
                }[invoice.type] || invoice.type,
                client: invoice.client,
                clientName: clientName,
                project: invoice.project,
                projectName: projectName,
                status: invoice.status,
                issueDate: invoice.issueDate,
                formattedDate: new Date(invoice.issueDate).toLocaleDateString('en-IN'),
                total: invoice.summary ? invoice.summary.total : 0,
                formattedAmount: new Intl.NumberFormat('en-IN', {
                    style: 'currency',
                    currency: 'INR'
                }).format(invoice.summary ? invoice.summary.total : 0),
                createdAt: invoice.createdAt
            };
        });
        
        return res.status(200).json(
            new ApiResponse(200, {
                results,
                pagination: {
                    total,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    pages
                },
                query
            }, "Invoice search results fetched successfully")
        );
    } catch (error) {
        console.error("Invoice search error:", error);
        return res.status(500).json(
            new ApiResponse(500, null, "Error searching invoices")
        );
    }
});

/**
 * Search clients for autocomplete
 * @route GET /api/v1/clients/search
 * @access Private
 */
export const searchClients = asyncHandler(async (req, res) => {
    const query = req.query.q || "";
    const limit = parseInt(req.query.limit) || 10;
    
    try {
        if (query.length < 2) {
            return res.status(200).json(
                new ApiResponse(200, { clients: [] }, "Minimum 2 characters required")
            );
        }
        
        const clients = await Client.find({
            name: { $regex: query, $options: 'i' }
        })
        .limit(limit)
        .lean();
        
        return res.status(200).json(
            new ApiResponse(200, { clients }, "Clients fetched successfully")
        );
    } catch (error) {
        return res.status(500).json(
            new ApiResponse(500, null, "Error searching clients")
        );
    }
});

/**
 * Escape special characters in a string for use in a regular expression
 */
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export default {
    getInvoiceSuggestions,
    searchInvoices,
    searchClients
};