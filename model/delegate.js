const mongoose = require("mongoose");

const delegateSchema = new mongoose.Schema({});

module.exports = mongoose.model("delegate", delegateSchema);