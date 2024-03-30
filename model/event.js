const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema({
    eventAntendeeId: String,
    eventId:String,
    eventAttendance: Boolean,
    eventName: String,
    devoteeId: { type: String, unique: true, required: true },
    devoteeCode: { type: Number, unique: true, required: true },
    inDate: String,
    outDate: String,
    remark:String,
},{timestamps:true});

module.exports = mongoose.model("eventAttendance", eventSchema);