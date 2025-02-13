import mongoose from "mongoose";


const AddressSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    mobile: {
        type: Number,
        required: true
    },
    CompanyName: {
        type: String,
    },
    address: {
        type: String,
        required: true
    },
    city: {
        type: String,
        required: true
    },
    state: {
        type: String,
        required: true
    },
    pincode: {
        type: Number,
        required: true
    },
    GSTIN:{
        type: String,
        
    },
    isDefault: {
        type: Boolean,
        default: false
    }
    }, {
    timestamps: true
});


const Address = mongoose.model('Address', AddressSchema);

export default Address;