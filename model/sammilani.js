const mongoose = require("mongoose");

const sammilaniSchema = new mongoose.Schema({
    number: Number,
    year: Number,
    place: String,
    address: String,
    devoteeCount: Number,
    chiefGuest: String,
    isBidhirakhya: Boolean,
    remarks: String
});

module.exports = mongoose.model("sammilani", sammilaniSchema);