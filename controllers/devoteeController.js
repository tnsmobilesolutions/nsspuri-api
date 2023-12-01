const devotee = require("../model/devotee");
const jwt = require("jsonwebtoken");
const moment = require('moment-timezone');
const allmodel = require("../model/allmodel");
const e = require("express");
const { model } = require("mongoose");
const dotenv = require("dotenv").config();



// Create Devotee
const devotee_create = async (req, res) => {
    try {
        let data = req.body;
        let findLastdevoteeCode =await devotee.find({}).sort({devoteeCode : -1}).limit(1);
        console.log("findLastdevoteeCode --- ",findLastdevoteeCode)
        if(findLastdevoteeCode){
            data.devoteeCode = findLastdevoteeCode[0].devoteeCode + 1
        }
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

const getPrasadUpdate =  async() => {
    const currentDate = moment.tz("Asia/Kolkata").format("YYYY-MM-DD");
    const currentTime = moment.tz("Asia/Kolkata").format("HH:mm");



}
const prasdUpdateDevotee = async (req, res) => {
    let data = req.body;
    const currentDate = data.date;
    const currentTime = data.time;

    try {
        const devoteeDetails = await allmodel.devoteemodel.findOne({ devoteeCode: parseInt(req.params.code, 10) });
        if (!devoteeDetails) throw "No devotee found with this code";

        const prasadDetails = await allmodel.prasadModel.findOne({ devoteeCode: parseInt(req.params.code, 10) });
        
        if (prasadDetails && prasadDetails!= null) {
            const existingPrasad = prasadDetails.prasad.find(prasad => prasad.date === currentDate);

            if (existingPrasad && existingPrasad.balyaTiming && existingPrasad.MadhyannaTiming && existingPrasad.ratriTiming) {
                // If all timings are updated, show an error that prasad is already taken for today
                return res.status(500).json({ error: "Prasad already taken for today" });
            }else {

                // Check if the current time falls within any meal timings
                const isBalyaTime = await compareThreeTime(currentTime, process.env.balyaStartTime, process.env.balyaEndTime);
                const isMadhyannaTime = await compareThreeTime(currentTime, process.env.madhyanaStartTime, process.env.madhyanaEndTime);
                const isRatraTime = await compareThreeTime(currentTime, process.env.ratraStartTime, process.env.ratraEndTime);
              
                let prasadFound = false;

                const existingPrasad = prasadDetails.prasad.find(prasad => prasad.date === currentDate);

                if (existingPrasad) {
                    console.log("prasad exist", existingPrasad);
                    // Check and prevent updates for balyaTiming if already set
                    if (isBalyaTime && !existingPrasad.balyaTiming) {
                        existingPrasad.balyaTiming = currentTime;
                    } else if (isMadhyannaTime && !existingPrasad.madhyanaTiming) {
                        existingPrasad.madhyanaTiming = currentTime;
                    } else if (isRatraTime && !existingPrasad.ratraTiming) {
                        existingPrasad.ratraTiming = currentTime;
                    } else {
                        return res.status(500).json({ error: "Cannot update timing, it's already set" });
                    }
                } else {
                    console.log("new prasad");
                    // Create a new prasad object if the currentDate does not exist
                    let newPrasad = {
                        date: currentDate,
                    };
                    if (isBalyaTime) {
                        newPrasad.balyaTiming = currentTime;
                    } else if (isMadhyannaTime) {
                        newPrasad.madhyanaTiming = currentTime;
                    } else if (isRatraTime) {
                        newPrasad.ratraTiming = currentTime;
                    }
                    prasadDetails.prasad.push(newPrasad);
                }
                
                await prasadDetails.save();
                
                return res.status(200).json({ error: "Prasad recorded successfully" });
                

                

                // } else {
                //     return res.status(500).json({ error: "Invalid time for prasad" });
                // }
            }
        } else {
            // Create a new prasad entry for the devotee
            const isBalyaTime = await compareThreeTime(currentTime, process.env.balyaStartTime, process.env.balyaEndTime);
            const isMadhyannaTime = await compareThreeTime(currentTime, process.env.madhyanaStartTime, process.env.madhyanaEndTime);
            const isRatraTime = await compareThreeTime(currentTime, process.env.ratraStartTime, process.env.ratraEndTime);
            if (isBalyaTime || isMadhyannaTime || isRatraTime) {
                // Create a new prasad entry for the devotee
                const prasadData = {
                    devoteeCode : devoteeDetails.devoteeCode,
                    devoteeId: devoteeDetails.devoteeId,
                    prasad: [{
                    date: currentDate,
                    balyaTiming: isBalyaTime ? currentTime : '',
                    madhyanaTiming: isMadhyannaTime ? currentTime : '',
                    ratraTiming: isRatraTime ? currentTime : ''
                }]};
               await allmodel.prasadModel.create(prasadData);
           
                return res.status(200).json({ error: "Prasad recorded successfully" });
            } else {
                return res.status(500).json({ error: "Invalid time for prasad" });
            }
        }
    } catch (error) {
        console.log("Error: ", error);
        return res.status(500).json({ error: error });
    }
};

async function compareThreeTime(orderTime, mealStartTime, mealEndTime) {
    const orderTimestamp = new Date(`1970-01-01T${orderTime}:00Z`).getTime();
    const mealStartTimestamp = new Date(`1970-01-01T${mealStartTime}:00Z`).getTime();
    const mealEndTimestamp = new Date(`1970-01-01T${mealEndTime}:00Z`).getTime();
    return orderTimestamp >= mealStartTimestamp && orderTimestamp <= mealEndTimestamp;
}



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
        const singleDevotee = await devotee.find({devoteeId:req.params.id})
        res.status(200).json({singleDevotee})
    } catch (error) {
        console.log(error);
        res.status(400).json({"error":error.message});
    }
};

// Single Devotee with Relativess
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
data.updatedbyId = currentDevotee.devoteeId;
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
    admin_devoteeDashboard,
    prasdUpdateDevotee
}