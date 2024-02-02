const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema({
    balyaStartTime : String,
    balyaEndTime : String,
    madhyanaStartTime: String,
    madhyanaEndTime : String,
    ratraStartTime : String,
    ratraEndTime : String,
    prasadFirstDate : String,
    prasadSecondDate : String,
    prasadThirdDate : String,
},{timestamps: true});

module.exports = mongoose.model("settings", settingsSchema);