const mongoose = require("mongoose");
const moment = require("moment-timezone");

let prasdSchema = mongoose.Schema({
    outsideDevotee:Boolean,
    numberOfDevoteeBalyaTaken: Number,
    numberOfDevoteeMadhyanaTaken: Number,
    numberOfDevoteeRatraTaken: Number,
    date:String,
    prasadid : String,
    devoteeId: { type: String, default: null },
    devoteeCode: { type: Number, default: null },
    prasad :[{
        date: String,
        balyaTiming: String,
        madhyanaTiming: String,
        ratraTiming: String,
    }]
});

module.exports = mongoose.model("prasad", prasdSchema);