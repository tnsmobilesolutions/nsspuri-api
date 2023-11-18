const mongoose = require("mongoose");
const moment = require('moment-timezone');
const devoteeSchema = new mongoose.Schema({
    name: { type: String,},
    mobileNumber: { type: String},
    emailId: { type: String},
    dob: String,
    bloodGroup: String,
    gender: String,
    presentAddress: String,
    permanentAddress: String,
    sangha: String,
    profilePhotoUrl: String,
    isKYDVerified: { type: Boolean, default: false },
    hasGruhasana: String,
    isApproved: { type: Boolean, default: false },
    isAdmin: { type: Boolean, default: false },
    isGruhasanaApproved: { type: Boolean, default: false },
    householdMembersCount: Number,
    devoteeId: { type: String, unique: true, required: true },
    uid: String,
    createdById: String,
    updatedById: String,
    createdOn: { type: String, default: moment.tz("Asia/Kolkata").format("YYYY-MM-DD_hh:mm A") },
    updatedOn: { type: String, default: moment.tz("Asia/Kolkata").format("YYYY-MM-DD_hh:mm A") },
    status: { type: String, default: "dataSubmitted"}, // You can set your preferred default status here
    address: {
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

    // status: String, //dataSubbmited/paid/rejected/accepted/printed/withdrawn/lost/reissued
  