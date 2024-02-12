const mongoose = require("mongoose");
const moment = require("moment-timezone");

let prasdSchema = mongoose.Schema({
    outsideDevotee:Boolean,
    numberOfDevotee: Number,
    prasadid : String,
    devoteeId: { type: String, unique: true, required: true },
    devoteeCode: { type: Number, unique: true, required: true },
    prasad :[{
        date: String,
        balyaTiming: String,
        madhyanaTiming: String,
        ratraTiming: String,
    }]
},{
    timestamps : true
});

module.exports = mongoose.model("prasad", prasdSchema);