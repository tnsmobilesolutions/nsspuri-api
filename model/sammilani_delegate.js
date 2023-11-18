const mongoose = require("mongoose");

const sammilaniDelegateSchema = new mongoose.Schema({
    sammilaniId: String,
    devotee: String,
    devoteeId: String,
    number: Number,
    delegateFee: Number,
    feestatus: String, //dataSubbmited/paid/rejected/accepted/printed/withdrawn/lost/reissued
    paymentMode: String,
    transactionId: String,
    preparedBy: String,
    remarks: String,
});

module.exports = mongoose.model("delegate", sammilaniDelegateSchema);