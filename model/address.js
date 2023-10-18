const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema({
    addressLine1: String,
    addressLine2: String,
    city: String,
    state: String,
    country: String,
    postalCode: Number,
    addressId: String
});

module.exports = mongoose.model("address", addressSchema);