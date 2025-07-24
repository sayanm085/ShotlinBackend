import Client from "../models/Client.model.js";
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import mongoose from 'mongoose';

/**
 * Create a new client
 * @route POST /api/v1/clients
 * @access Private
 */
export const createClient = asyncHandler(async (req, res) => {
  try {
    // Use request body directly since we don't have organization or createdBy fields
    const clientData = { ...req.body };
    
    // Validate at least one primary contact if contact persons provided
    if (clientData.contactPersons && clientData.contactPersons.length > 0) {
      const hasPrimary = clientData.contactPersons.some(cp => cp.isPrimary);
      
      if (!hasPrimary) {
        clientData.contactPersons[0].isPrimary = true;
      }
    }
    
    // Create client
    const client = new Client(clientData);
    await client.save();
    
    return res.status(201).json(
      new ApiResponse(
        201, 
        { client }, 
        "Client created successfully"
      )
    );
  } catch (error) {
    console.error("Error creating client:", error);
    
    // Handle mongoose validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      }));
      
      return res.status(400).json(
        new ApiResponse(
          400, 
          { errors: validationErrors }, 
          "Validation error"
        )
      );
    }
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json(
        new ApiResponse(
          400, 
          null, 
          `A client with this ${field} already exists`
        )
      );
    }
    
    return res.status(500).json(
      new ApiResponse(
        500, 
        null, 
        error.message || "Failed to create client"
      )
    );
  }
});

/**
 * Get client by ID
 * @route GET /api/v1/clients/:id
 * @access Private
 */
export const getClientById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json(
        new ApiResponse(400, null, "Invalid client ID format")
      );
    }
    
    const client = await Client.findById(id);
    
    if (!client) {
      return res.status(404).json(
        new ApiResponse(404, null, "Client not found")
      );
    }
    
    // Get additional data
    let outstandingBalance = 0;
    
    try {
      outstandingBalance = await client.getOutstandingBalance();
    } catch (error) {
      console.error("Error calculating outstanding balance:", error);
      // Continue even if we can't calculate balance
    }
    
    return res.status(200).json(
      new ApiResponse(
        200, 
        { 
          client,
          outstandingBalance,
          meta: {
            lastUpdated: new Date().toISOString(),
            retrievedBy: req.user?.username || "sayanm085"
          }
        }, 
        "Client retrieved successfully"
      )
    );
  } catch (error) {
    console.error("Error retrieving client:", error);
    
    return res.status(500).json(
      new ApiResponse(
        500, 
        null, 
        error.message || "Failed to retrieve client"
      )
    );
  }
});

/**
 * Get all clients with pagination and filtering
 * @route GET /api/v1/clients
 * @access Private
 */
export const getAllClients = asyncHandler(async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      sortBy = 'name', 
      sortOrder = 'asc',
      search = '',
      status,
      clientType
    } = req.query;
    
    // Build query - removed organization filter
    const query = {
      isDeleted: false
    };
    
    // Filter by status if provided
    if (status && status !== 'all') {
      query.status = status;
    }
    
    // Filter by client type if provided
    if (clientType && clientType !== 'all') {
      query.clientType = clientType;
    }
    
    // Search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { 'address.city': { $regex: search, $options: 'i' } },
        { 'contactPersons.name': { $regex: search, $options: 'i' } },
        { 'contactPersons.email': { $regex: search, $options: 'i' } }
      ];
    }
    
    // Calculate pagination values
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    
    // Set up sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;
    
    // Get total count for pagination
    const total = await Client.countDocuments(query);
    
    // Fetch clients
    const clients = await Client.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum);
    
    // Calculate total pages
    const totalPages = Math.ceil(total / limitNum);
    
    return res.status(200).json(
      new ApiResponse(
        200,
        {
          clients,
          pagination: {
            total,
            page: pageNum,
            limit: limitNum,
            pages: totalPages
          },
          meta: {
            timestamp: "2025-07-14 19:02:59",
            user: "sayanm085"
          }
        },
        "Clients retrieved successfully"
      )
    );
  } catch (error) {
    console.error("Error retrieving clients:", error);
    
    return res.status(500).json(
      new ApiResponse(
        500, 
        null, 
        error.message || "Failed to retrieve clients"
      )
    );
  }
});
/**
 * Get client search suggestions
 * @route GET /api/v1/clients/suggestions
 * @access Private
 */
export const getClientSuggestions = asyncHandler(async (req, res) => {
  try {
    const { search = '' } = req.query;
    
    // Current timestamp and user information
    const currentTimestamp = "2025-07-16 09:26:04";
    const currentUser = "sayanm085";
    
    // Build base query for active, non-deleted clients
    const baseQuery = {
      isDeleted: false,
      status: 'active'
    };
    
    let query = { ...baseQuery };
    
    // Only add search criteria if search term is provided and has sufficient length
    if (search && search.length >= 2) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { 'address.city': { $regex: search, $options: 'i' } },
        { 'contactPersons.name': { $regex: search, $options: 'i' } },
        { 'contactPersons.email': { $regex: search, $options: 'i' } }
      ];
    }
    
    // Fetch clients based on the query
    const clients = await Client.find(query)
      .sort({ name: 1 })
      .limit(search && search.length >= 2 ? 0 : 10); // Limit to 10 if showing all clients
    
    // Return the response
    return res.status(200).json({
      statusCode: 200,
      data: {
        clients,
        pagination: {
          total: clients.length,
          page: 1,
          limit: 10,
          pages: Math.ceil(clients.length / 10)
        },
        meta: {
          timestamp: currentTimestamp,
          user: currentUser
        }
      },
      message: search && search.length >= 2 
        ? "Client suggestions retrieved successfully"
        : "All clients retrieved successfully",
      success: true
    });
  } catch (error) {
    console.error("Error retrieving client suggestions:", error);
    
    return res.status(500).json({
      statusCode: 500,
      data: null,
      message: error.message || "Failed to retrieve client suggestions",
      success: false
    });
  }
});
/**
 * Update client
 * @route PUT /api/v1/clients/:id
 * @access Private
 */
export const updateClient = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json(
        new ApiResponse(400, null, "Invalid client ID format")
      );
    }
    
    // Find client
    const client = await Client.findById(id);
    
    if (!client) {
      return res.status(404).json(
        new ApiResponse(404, null, "Client not found")
      );
    }
    
    // No organization check needed since we removed that field
    
    // Update fields
    const updateData = { ...req.body };
    
    // Validate at least one primary contact if contact persons provided
    if (updateData.contactPersons && updateData.contactPersons.length > 0) {
      const hasPrimary = updateData.contactPersons.some(cp => cp.isPrimary);
      
      if (!hasPrimary) {
        updateData.contactPersons[0].isPrimary = true;
      }
    }
    
    // Update the client
    const updatedClient = await Client.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
    
    return res.status(200).json(
      new ApiResponse(
        200, 
        { client: updatedClient }, 
        "Client updated successfully"
      )
    );
  } catch (error) {
    console.error("Error updating client:", error);
    
    // Handle mongoose validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      }));
      
      return res.status(400).json(
        new ApiResponse(
          400, 
          { errors: validationErrors }, 
          "Validation error"
        )
      );
    }
    
    return res.status(500).json(
      new ApiResponse(
        500, 
        null, 
        error.message || "Failed to update client"
      )
    );
  }
});

/**
 * Delete client (soft delete)
 * @route DELETE /api/v1/clients/:id
 * @access Private
 */
export const deleteClient = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json(
        new ApiResponse(400, null, "Invalid client ID format")
      );
    }
    
    // Find client
    const client = await Client.findById(id);
    
    if (!client) {
      return res.status(404).json(
        new ApiResponse(404, null, "Client not found")
      );
    }
    
    // No organization check needed since we removed that field
    
    // Soft delete
    client.isDeleted = true;
    client.status = 'archived';
    await client.save();
    
    return res.status(200).json(
      new ApiResponse(
        200, 
        null, 
        "Client deleted successfully"
      )
    );
  } catch (error) {
    console.error("Error deleting client:", error);
    
    return res.status(500).json(
      new ApiResponse(
        500, 
        null, 
        error.message || "Failed to delete client"
      )
    );
  }
});

export default {
  createClient,
  getClientById,
  getAllClients,
  updateClient,
  deleteClient
};