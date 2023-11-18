const devotee = require("../model/devotee");
const jwt = require("jsonwebtoken");
const moment = require('moment-timezone');



// Create Devotee
const devotee_create = async (req, res) => {
    try {
        let data = req.body
        data.createdById = data.devoteeId;
        data.createdOn = moment.tz("Asia/Kolkata").format("YYYY-MM-DD_hh:mm A")
        data.updatedOn = moment.tz("Asia/Kolkata").format("YYYY-MM-DD_hh:mm A")
        const createDevotee = await devotee.create(data)
        res.status(200).json(createDevotee)
    } catch (error) {
        console.log(error);
        res.status(400).json({"error":error.message});
    }
};
const createRelativeDevotee = async (req, res) => {
    try {
        let data = req.body
        data.createdById = req.user.devoteeId
        data.createdOn = moment.tz("Asia/Kolkata").format("YYYY-MM-DD_hh:mm A")
        data.updatedOn = moment.tz("Asia/Kolkata").format("YYYY-MM-DD_hh:mm A")
        const createDevotee = await devotee.create(data)
        res.status(200).json(createDevotee)
    } catch (error) {
        console.log(error);
        res.status(400).json({"error":error.message});
    }
};

// All Devotee or by sangha
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
        console.log(error);
        res.status(400).json({"error":error.message});
    }
};

// Single Devotee
const devotee_details = async (req, res) => {
    try {
        const singleDevotee = await devotee.find({devoteeId:req.user.devoteeId})
        res.status(200).json({singleDevotee})
    } catch (error) {
        console.log(error);
        res.status(400).json({"error":error.message});
    }
};
const devotee_details_by_devoteeId = async (req, res) => {
    try {
        const singleDevotee = await devotee.find({devoteeId:req.params.devoteeId})
        res.status(200).json({singleDevotee})
    } catch (error) {
        console.log(error);
        res.status(400).json({"error":error.message});
    }
};

// Single Devotee with Relatives
const devotee_with_relatives = async (req, res) => {
    try {
        const singleDevotee = await devotee.find({createdById: req.user.devoteeId})
        res.status(200).json({singleDevotee})
    } catch (error) {
        console.log(error);
        res.status(400).json({"error":error.message});
    }
};
// search Devotee with Relatives
const searchDevotee = async (req, res) => {
    let searchDevotee;
    try {
        if(req.query.status){
            searchDevotee = await devotee.find({status: {"$regex": `${req.query.status}`, '$options': 'i' }})
        }
        if(req.query.devoteeName){
         searchDevotee = await devotee.find({name: {"$regex": `${req.query.devoteeName}`, '$options': 'i' }});
        }
        if(req.query.status && req.query.devoteeName){
            searchDevotee = await devotee.find({status: {"$regex": `${req.query.status}`, '$options': 'i' },name:{"$regex": `${req.query.devoteeName}`, '$options': 'i' } })
        }
       
        res.status(200).json({searchDevotee})
    } catch (error) {
        console.log(error);
        res.status(400).json({"error":error.message});
    }
};


// Single Devotee by uid
const devoteeLogin = async (req, res) => {
    try {
        const singleDevotee = await devotee.findOne({uid : req.params.uid})
        let user = {
            _id: singleDevotee._id,
            devoteeId: singleDevotee.devoteeId,
        }
        const accesstoken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '90d' });
    let data = { singleDevotee: singleDevotee, accesstoken: accesstoken }
        res.status(200).json(data)
    } catch (error) {
        console.log(error);
        res.status(400).json({"error":error.message});
    }
};

// Update Devotee
const devotee_update = async (req, res) => {
    try {
        let currentDevotee = await devotee.findOne({devoteeId : req.user.devoteeId})
let data = req.body;
data.updatedbyId = currentDevotee.name;
data.updatedOn = moment.tz("Asia/Kolkata").format("YYYY-MM-DD_hh:mm A")

        const updateDevotee = await devotee.findOneAndUpdate({devoteeId:req.params.id}, {$set:data})
        res.status(200).json({updateDevotee})
    } catch (error) {
        console.log(error);
        res.status(400).json({"error":error.message});
    }
};

// Delete Devotee
const devotee_delete = async (req, res) => {
    try {
        const deleteDevotee = await devotee.findOneAndDelete({devoteeId:req.params.id})
        res.status(200).json({deleteDevotee})
    } catch (error) {
        console.log(error);
        res.status(400).json({"error":error.message});
    }
};

// All Devotee or by status
const admin_devoteeDashboard = async (req, res) => {
    try {
async function devoteeList(status) {
    let statusby = await devotee.find({status: status});
    return statusby.length;
}
       let allDevotee = await devotee.find().sort({name:1})

        let data = [
            {
                message: "Total Regesterd Devotee",
                status: "allDevotee",
                count: allDevotee.length,
            },
            {
                message: "Delegate Pranami Paid",
                status : "paid",
                count:await devoteeList("paid")
            },
            {
                message: "Delegate rejected",
                status: "rejected",
                count: await devoteeList("rejected"),
            },
            {
                message: "Delegate accepted",
                status : "accepted",
                count: await devoteeList("accepted")
            },
            {
                message: "Delegate printed",
                status: "printed",
                count: await devoteeList("printed")
            },
            {
                message: "Delegate withdrawn",
                status : "withdrawn",
                count: await devoteeList("withdrawn")
            },
            {
                message: "Delegate lost",
                status: "lost",
                count: await devoteeList("lost")
            },
            {
                message: "Delegate reissued",
                status : "reissued",
                count: await devoteeList("reissued")
            }
        ]
        res.status(200).json(data)
    } catch (error) {
        console.log(error);
        res.status(400).json({"error":error.message});
    }
};


module.exports = {
    devotee_create,
    devotee_all,
    devotee_details,
    devotee_details_by_devoteeId,
    devoteeLogin,
    devotee_update,
    devotee_delete,
    devotee_with_relatives,
    searchDevotee,
    createRelativeDevotee,
    admin_devoteeDashboard
}