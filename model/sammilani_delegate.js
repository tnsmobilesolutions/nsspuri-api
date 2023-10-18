const mongoose = require("mongoose");

const sammilaniDelegateSchema = new mongoose.Schema({
    devotee: String,
    number: Number,
    delegateFee: Number,
    feeStatus: String,
    paymentMode: String,
    transactionId: String,
    preparedBy: String,
    remarks: String,
});

module.exports = mongoose.model("delegate", sammilaniDelegateSchema);