const address = require("../model/address");


// Create Address
const address_create = async (req, res) => {
    try {
        const createAddress = await address.create(req.body)
        res.status(200).json(createAddress)
    } catch (error) {
        res.status(400).json({"error":error.message});
    }
};

// All Address
const address_all = async (req, res) => {
    try {
        const allAddress = await address.find()
        res.status(200).json({allAddress})
    } catch (error) {
        res.status(400).json({"error":error.message});
    }
};

// Single Address
const address_details = async (req, res) => {
    try {
        const singleAddress = await address.findOne({addressId:req.params.id})
        res.status(200).json({singleAddress})
    } catch (error) {
        res.status(400).json({"error":error.message});
    }
};

// Update Address
const address_update = async (req, res) => {
    try {
        const updateAddress = await address.findOneAndUpdate({addressId:req.params.id}, {$set:req.body})
        res.status(200).json({updateAddress})
    } catch (error) {
        res.status(400).json({"error":error.message});
    }
};

// Delete Address
const address_delete = async (req, res) => {
    try {
        const deleteAddress = await address.findOneAndDelete({addressId:req.params.id})
        res.status(200).json({deleteAddress})
    } catch (error) {
        res.status(400).json({"error":error.message});
    }
};


module.exports = {
    address_create,
    address_all,
    address_details,
    address_update,
    address_delete
}