const devotee = require("../model/devotee");


// Create Devotee
const devotee_create = async (req, res) => {
    try {
        const createDevotee = await devotee.create(req.body)
        res.status(200).json(createDevotee)
    } catch (error) {
        res.status(400).json({"error":error.message});
    }
};

// All Devotee
const devotee_all = async (req, res) => {
    try {
        const allDevotee = await devotee.find()
        res.status(200).json({allDevotee})
    } catch (error) {
        res.status(400).json({"error":error.message});
    }
};

// Single Devotee
const devotee_details = async (req, res) => {
    try {
        const singleDevotee = await devotee.findOne({devoteeId:req.params.id})
        res.status(200).json({singleDevotee})
    } catch (error) {
        res.status(400).json({"error":error.message});
    }
};
// Single Devotee by uid
const devotee_details_uid = async (req, res) => {
    try {
        const singleDevotee = await devotee.findOne({uid:req.params.uid})
        res.status(200).json({singleDevotee})
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
    devotee_details_uid,
    devotee_update,
    devotee_delete
}