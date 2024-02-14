const mongoose = require("mongoose");
const moment = require("moment-timezone");

let prasdSchema = mongoose.Schema({
    outsideDevotee:Boolean,
    couponDevotee:Boolean,
    numberOfDevoteeBalyaTaken: Number,
    numberOfDevoteeMadhyanaTaken: Number,
    numberOfDevoteeRatraTaken: Number,
    date:String,
    prasadid : String,
    devoteeId: String,
    devoteeCode: Number,
    couponCode: Number,
    couponPrasad:[{
        date: String,
        balyaCount:Number,
        balyaTiming: [],
        madhyanaTiming:[],
        ratraTiming:[],
        madhyanaCount:Number,
        ratraCount:Number
    }],
    prasad :[{
        date: String,
        balyaTiming: String,
        madhyanaTiming: String,
        ratraTiming: String,
    }]
});

module.exports = mongoose.model("prasad", prasdSchema);