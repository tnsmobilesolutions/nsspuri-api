const mongoose = require("mongoose");

const sanghaSchema = new mongoose.Schema({
    sanghaName: String,
    jillaSanghaName: String,
    sanghaId: String
});

module.exports = mongoose.model("sangha", sanghaSchema);