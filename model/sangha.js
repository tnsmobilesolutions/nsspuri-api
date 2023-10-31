const mongoose = require("mongoose");

const sanghaSchema = new mongoose.Schema({
    sanghaName: String,
    jillaSanghaName: String,
    address: String,
    devoteeCount: Number,
    sabhapatiName: String,
    sampadakaName: String,
    ashramArea: String,
    isItPathachakra: Boolean,
    isApproved: Boolean,
    sanghaId: String
});

module.exports = mongoose.model("sangha", sanghaSchema);