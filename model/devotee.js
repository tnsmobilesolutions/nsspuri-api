const mongoose = require("mongoose");
const moment = require('moment-timezone');
const devoteeSchema = new mongoose.Schema({
    name: { type: String,},
    mobileNumber: { type: String},
    emailId: { type: String},
    role: { type: String,default: "User"},
    dob: String,
    remarks: String,
    bloodGroup: String,
    gender: String,
    presentAddress: String,
    permanentAddress: String,
    sangha: String,
    ageGroup: String,
    profilePhotoUrl: String,
    isKYDVerified: { type: Boolean, default: false },
    hasGruhasana: String,
    hasParichayaPatra: { type: Boolean, default: false },
    isApproved: { type: Boolean, default: false },
    isAdmin: { type: Boolean, default: false },
    isGruhasanaApproved: { type: Boolean, default: false },
    householdMembersCount: Number,
    devoteeId: { type: String, unique: true, required: true },
    devoteeCode: { type: Number, unique: true, required: true },
    isAllowedToScanPrasad: { type: Boolean, default: false },
    isGuest: { type: Boolean, default: false },
    isSpeciallyAbled: { type: Boolean, default: false },
    isOrganizer: { type: Boolean, default: false },
    uid: String,
    paidAmount: Number,
    paymentMode: String,
    createdById: String,
    createdByName: String,
    createdByUUID: String,
    updatedById: String,
    approvedBy: String,
    rejectedBy: String,
    receivedBy: String,
    eventAttendance: Boolean,
    createdOn: { type: String, default: moment.tz("Asia/Kolkata").format("YYYY-MM-DD_hh:mm A") },
    updatedOn: { type: String, default: moment.tz("Asia/Kolkata").format("YYYY-MM-DD_hh:mm A") },
    status: { type: String, default: "dataSubmitted"}, 
    address: {
        addressLine1: String,
        addressLine2: String,
        city: String,
        state: String,
        country: String,
        postalCode: Number,
        addressId: String
    },
},{timestamps: true});

module.exports = mongoose.model("devotee", devoteeSchema);

    // status: String, //dataSubmitted/paid/rejected/accepted/printed/withdrawn/lost/reissued/blacklisted
    //role: SuperAdmin,Admin,Approver,PrasadScanner,SecurityCheck,user
  