import Address from "../models/Address.model.js";
import User from '../models/User.model.js';
import {asyncHandler} from '../utils/asyncHandler.js';
import {ApiResponse} from '../utils/ApiResponse.js';
import redisClient from "../db/Radis.db.js";



// Create and Save a new Address 

const addrescreate = asyncHandler(async (req, res) => {
    if (!req.body) {
        return res.status(400).json(new ApiResponse(400, null, "Content cannot be empty!"));
    }

    const address = new Address({
        user: req.user._id,
        name: req.body.name,
        mobile: req.body.mobile,
        CompanyName: req.body.CompanyName,
        address: req.body.address,
        city: req.body.city,
        state: req.body.state,
        pincode: req.body.pincode,
        GSTIN: req.body.GSTIN,
        isDefault: req.body.isDefault
    });

    try {
        // Save the new address
        const data = await address.save();

        // Update user with the new address reference
        await User.findByIdAndUpdate(
            req.user._id,
            { $push: { shippingAddress: data._id } },
            { new: true, useFindAndModify: false }
        );

        // ✅ Clear Redis cache for user's addresses
        const cacheKey = `user:${req.user._id}:shippingAddress`;
        await redisClient.del(cacheKey);
        console.log(`✅ Redis cache cleared for user ${req.user._id} after address creation`);

        res.status(200).json(new ApiResponse(200, data, "Address created successfully"));
    } catch (err) {
        res.status(500).json(new ApiResponse(500, null, err.message || "Some error occurred while creating the Address."));
    }
});

// Update an address identified by the addressId in the request
const updateUserAddress = asyncHandler(async (req, res) => {
    const userId = req.user._id.toString();
    const { addressId, newAddress } = req.body;

    try {
        // ✅ Find the user first
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json(new ApiResponse(404, null, "User not found"));
        }

        // ✅ Ensure the address exists
        const address = await Address.findOne({ _id: addressId, user: userId });
        if (!address) {
            return res.status(404).json(new ApiResponse(404, null, "Address not found"));
        }

        // ✅ Update the address properly
        await Address.findByIdAndUpdate(addressId, { $set: newAddress }, { new: true });

        // ✅ Clear Redis cache
        await redisClient.del(`user:${userId}:shippingAddress`);
        console.log(`✅ Redis cache cleared for user ${userId} after address update`);

        res.status(200).json(new ApiResponse(200, newAddress, "Address updated successfully"));
    } catch (error) {
        console.error("Error updating address:", error);
        res.status(500).json(new ApiResponse(500, null, "Server Error"));
    }
});

// Delete an address with the specified addressId in the request
const deleteUserAddress = asyncHandler(async (req, res) => {
    const userId = req.user._id.toString();
    const { addressId } = req.body;

    try {
        // ✅ Check if the user exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json(new ApiResponse(404, null, "User not found"));
        }

        // ✅ Check if the address exists and belongs to the user
        const address = await Address.findOne({ _id: addressId, user: userId });
        if (!address) {
            return res.status(404).json(new ApiResponse(404, null, "Address not found"));
        }

        // ✅ Delete the address
        await Address.findByIdAndDelete(addressId);

        // ✅ Remove the address ID from the user's shippingAddress array
        await User.findByIdAndUpdate(userId, { $pull: { shippingAddress: addressId } });

        // ✅ Clear Redis cache
        await redisClient.del(`user:${userId}:shippingAddress`);
        console.log(`❌ Redis cache cleared for user ${userId} after address deletion`);

        res.status(200).json(new ApiResponse(200, null, "Address deleted successfully"));
    } catch (error) {
        console.error("Error deleting address:", error);
        res.status(500).json(new ApiResponse(500, null, "Server Error"));
    }
});



// user all saved address get

const useralladdress = asyncHandler(async (req, res) => {
    const userId = req.user._id.toString();
    const cacheKey = `user:${userId}:shippingAddress`;

    try {
        // Check if data exists in Redis cache
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
            return res.status(200).json(new ApiResponse(200, JSON.parse(cachedData), "All Address (Cached)"));
        }

        // Fetch from MongoDB if not cached
        const userShippingAddresses = await User.findById(userId)
            .select('shippingAddress')
            .populate({
                path: 'shippingAddress',
                select: 'address city state zip country',
            })
            .lean();

        const addresses = userShippingAddresses?.shippingAddress || [];

        // Store result in Redis with an expiry (e.g., 1 hour)
        await redisClient.setEx(cacheKey, 3600, JSON.stringify(addresses));

        res.status(200).json(new ApiResponse(200, addresses, "All Address (Fresh)"));
    } catch (error) {
        console.error("Redis Error:", error);
        res.status(500).json(new ApiResponse(500, null, "Server Error"));
    }
});



export {addrescreate,useralladdress ,updateUserAddress,deleteUserAddress};