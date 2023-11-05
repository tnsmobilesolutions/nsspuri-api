const mongoose = require("mongoose");

const devoteeSchema = new mongoose.Schema({
    name: String,
    mobileNumber: String,
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
    uid: String,
    createdById: String,
    updatedById: String,
    createdOn: String,
    updatedOn: String,
    address : {
        addressLine1: String,
        addressLine2: String,
        city: String,
        state: String,
        country: String,
        postalCode: Number,
        addressId: String
    },
});


module.exports = mongoose.model("devotee", devoteeSchema);