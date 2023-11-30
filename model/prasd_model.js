const mongoose = require("mongoose");
const moment = require("moment-timezone");

let prasdSchema = mongoose.Schema({
    prasadid : String,
    devoteeId: { type: String, unique: true, required: true },
    devoteeCode: { type: Number, unique: true, required: true },
    prasad :[{
        date: String,
        balyaTiming: String,
        MadhyannaTiming: String,
        ratriTiming: String,
    }]
},{
    timestamps : true
});

module.exports = mongoose.model("prasad", prasdSchema);