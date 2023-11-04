const devotee = require("../model/devotee");
const jwt = require("jsonwebtoken");
const moment = require("moment");


// Create Devotee
const devotee_create = async (req, res) => {
    try {
        let data = req.body
        data.createdById = req.user.singleDevotee.devoteeId
        data.createdOn = moment.tz("Asia/Kolkata").format("YYYY-MM-DD_hh:mm A")
        data.updatedOn = moment.tz("Asia/Kolkata").format("YYYY-MM-DD_hh:mm A")
        const createDevotee = await devotee.create(data)
        res.status(200).json(createDevotee)
    } catch (error) {
        res.status(400).json({"error":error.message});
    }
};

// All Devotee
const devotee_all = async (req, res) => {
    try {
        let allDevotee = []
        if (req.query.sangha) {
            allDevotee = await devotee.find({sangha:{ "$regex": `${req.query.sangha}`, '$options': 'i' }}).sort({name:1})
        } else {
        allDevotee = await devotee.find().sort({name:1})
        }
        res.status(200).json({allDevotee})
    } catch (error) {
        res.status(400).json({"error":error.message});
    }
};

// Single Devotee
const devotee_details = async (req, res) => {
    try {
        const singleDevotee = await devotee.find({devoteeId:req.user.singleDevotee.devoteeId})
        res.status(200).json({singleDevotee})
    } catch (error) {
        res.status(400).json({"error":error.message});
    }
};

// Single Devotee with Relatives
const devotee_with_relatives = async (req, res) => {
    try {
        const singleDevotee = await devotee.find({createdById:req.user.singleDevotee.devoteeId})
        res.status(200).json({singleDevotee})
    } catch (error) {
        res.status(400).json({"error":error.message});
    }
};
// search Devotee with Relatives
const searchDevotee = async (req, res) => {
    try {
        const searchDevotee = await devotee.find({name: req.query.devoteeName})
        res.status(200).json({searchDevotee})
    } catch (error) {
        res.status(400).json({"error":error.message});
    }
};

// Single Devotee by uid
const devoteeLogin = async (req, res) => {
    try {
        const singleDevotee = await devotee.findOne({uid:req.params.uid})
        const accesstoken = jwt.sign({user:singleDevotee}, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '90d' });
    let data = { singleDevotee: singleDevotee, accesstoken: accesstoken }
        res.status(200).json(data)
    } catch (error) {
        res.status(400).json({"error":error.message});
    }
};

// Update Devotee
const devotee_update = async (req, res) => {
    try {
        const updateDevotee = await devotee.findOneAndUpdate({devoteeId:req.params.id}, {$set:req.body})
        res.status(200).json({updateDevotee})
    } catch (error) {
        res.status(400).json({"error":error.message});
    }
};

// Delete Devotee
const devotee_delete = async (req, res) => {
    try {
        const deleteDevotee = await devotee.findOneAndDelete({devoteeId:req.params.id})
        res.status(200).json({deleteDevotee})
    } catch (error) {
        res.status(400).json({"error":error.message});
    }
};


module.exports = {
    devotee_create,
    devotee_all,
    devotee_details,
    devoteeLogin,
    devotee_update,
    devotee_delete,
    devotee_with_relatives,
    searchDevotee
}