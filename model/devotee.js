const mongoose = require("mongoose");

const devoteeSchema = new mongoose.Schema({
    name: String,
    mobileNumber: Number,
    emailId: String,
    dob: String,
    bloodGroup: String,
    gender: String,
    presentAddress: String,
    permanentAddress: String,
    sangha: String,
    profilePhotoUrl: String,
    isKYDVerified: Boolean,
    hasGruhasana: String,
    isApproved: Boolean,
    isAdmin: Boolean,
    isGruhasanaApproved: Boolean,
    householdMembersCount: Number,
    devoteeId: String,
    uid: String
});

module.exports = mongoose.model("devotee", devoteeSchema);