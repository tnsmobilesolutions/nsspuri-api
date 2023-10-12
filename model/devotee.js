const mongoose = require("mongoose");

const devoteeSchema = new mongoose.Schema({
    name: String,
    mobileNumber: Number,
    emailId: String,
    dob: String,
    bloodGroup: String,
    gender: String,
    presentAddress: String,
    sangha: String,
    profilePhotoUrl: String,
    isApprover: Boolean,
    isAdmin: Boolean,
    devoteeId: String
});

module.exports = mongoose.model("devotee", devoteeSchema);