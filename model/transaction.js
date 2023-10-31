const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
    transactionId: String,
    amount: Number,
    status: String,
    date: String,
    for: String,
    processedBy: String,
    type: String,
    bank: String,
    upiAddress: String
});

module.exports = mongoose.model("payment", transactionSchema);