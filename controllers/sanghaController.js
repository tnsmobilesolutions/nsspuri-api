const sangha = require("../model/sangha");


// Create Sangha
const sangha_create = async (req, res) => {
    try {
        
        const createSangha = await sangha.create(req.body)
        res.status(200).json(createSangha)
    } catch (error) {
        res.status(400).json({"error":error.message});
    }
};

// All Sangha
const sangha_all = async (req, res) => {
    try {
        const allSangha = await sangha.find()
        res.status(200).json({allSangha})
    } catch (error) {
        res.status(400).json({"error":error.message});
    }
};

// Single Sangha
const sangha_details = async (req, res) => {
    try {
        const singleSangha = await sangha.findOne({sanghaId:req.params.id})
        res.status(200).json({singleSangha})
    } catch (error) {
        res.status(400).json({"error":error.message});
    }
};

// Update Sangha
const sangha_update = async (req, res) => {
    try {
        const updateSangha = await sangha.findOneAndUpdate({sanghaId:req.params.id}, {$set:req.body})
        res.status(200).json({updateSangha})
    } catch (error) {
        res.status(400).json({"error":error.message});
    }
};

// Delete Sangha
const sangha_delete = async (req, res) => {
    try {
        const deleteSangha = await sangha.findOneAndDelete({sanghaId:req.params.id})
        res.status(200).json({deleteSangha})
    } catch (error) {
        res.status(400).json({"error":error.message});
    }
};


module.exports = {
    sangha_create,
    sangha_all,
    sangha_details,
    sangha_update,
    sangha_delete
}