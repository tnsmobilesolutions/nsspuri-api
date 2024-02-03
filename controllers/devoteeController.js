const devotee = require("../model/devotee");
const jwt = require("jsonwebtoken");
const moment = require('moment-timezone');
const allmodel = require("../model/allmodel");
const e = require("express");
const { model } = require("mongoose");
const dotenv = require("dotenv").config();
const messages = require("./messages/message");
const settings = require("../model/settings");



// Create Devotee
const devotee_create = async (req, res) => {
    try {
        let data = req.body;
        // let checkAvailableDevotee =await devotee.findOne({emailId: data.emailId});
        // if(checkAvailableDevotee) throw messages.EXISTING_DEVOTEE;

        let findLastdevoteeCode =await devotee.find({}).sort({devoteeCode : -1}).limit(1);
        console.log(findLastdevoteeCode);
        console.log("findLastdevoteeCode --- ",findLastdevoteeCode)
        if(findLastdevoteeCode.length != 0){
            data.devoteeCode = findLastdevoteeCode[0].devoteeCode + 1
        }else{
            data.devoteeCode = 100000
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

const updateSettings = async (req, res) => {
    try {
        let data = req.body;
        
        let updateSettings = await allmodel.settings.findOneAndUpdate({}, { $set: data }, { upsert: true, new: true });
        res.json({ success: true, settings: updateSettings });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: "Internal Server Error" });
    }
};
const getSettings = async (req, res) => {
    try {
        let updateSettings = await allmodel.settings.findOne({});
        res.json(updateSettings);
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: "Internal Server Error" });
    }
};




const devoteeListBycreatedById = async(req,res)=>{
  try {
    let devoteeList = await allmodel.devoteemodel.find({createdById: req.params.id})
    for (let i = 0; i < devoteeList.length; i++) {
        const createdByDevotee = await devotee.findOne({ devoteeId: devoteeList[i].createdById });
        if (createdByDevotee) {
            devoteeList[i].createdById = createdByDevotee.name;
            // delete allDevotee[i].createdById; // Remove the createdById field
        }
    }
    res.status(200).json({devoteeList})
  } catch (error) {
    console.log(error)
  }
}
//update prasad by qr code
const prasdUpdateDevotee = async (req, res) => {

    try {
        
        let data = req.body;
        let allTimings = await allmodel.settings.findOne();
        console.log("allTimings-------",allTimings)
        if(allTimings){
            let balyaStartTime = allTimings.balyaStartTime
            let balyaEndTime = allTimings.balyaEndTime
            let madhyanaStartTime = allTimings.madhyanaStartTime
            let madhyanaEndTime = allTimings.madhyanaEndTime
            let ratraStartTime = allTimings.ratraStartTime
            let ratraEndTime = allTimings.ratraEndTime
            const currentDate = data.date;
            const currentTime = data.time;
            const devoteeDetails = await allmodel.devoteemodel.findOne({ devoteeCode: parseInt(req.params.code, 10) });
            
            if (!devoteeDetails) {return res.status(200).json({ status: "Failure",error: {errorCode :1001,message: messages.NO_DEVOTEEFOUND}, devoteeData : devoteeDetails});} 
    
            if(devoteeDetails.status == "blacklisted"  ) {return res.status(200).json({ status: "Failure",error: {errorCode :1001,message: messages.BLACKLISTED_DEVOTEE_SCAN}, devoteeData : devoteeDetails});}
            if( devoteeDetails.status == "rejected") {return res.status(200).json({ status: "Failure",error: {errorCode :1001,message: messages.REJECTED_DEVOTEE_SCAN}, devoteeData : devoteeDetails});}
            if(devoteeDetails.status == "lost") {return res.status(200).json({ status: "Failure",error: {errorCode :1001,message: messages.LOST_DEVOTEE_SCAN}, devoteeData : devoteeDetails});}
            if(devoteeDetails.status == "withdrawn") {return res.status(200).json({ status: "Failure",error: {errorCode :1001,message: messages.WITHDRAWN_DEVOTEE_SCAN}, devoteeData : devoteeDetails});}
            if(devoteeDetails && (devoteeDetails.role == "paid" ||devoteeDetails.role == "printed" )){
                const prasadDetails = await allmodel.prasadModel.findOne({ devoteeCode: parseInt(req.params.code, 10) });
            
                if (prasadDetails && prasadDetails!= null) {
                    const existingPrasad = prasadDetails.prasad.find(prasad => prasad.date === currentDate);
        
                    if (existingPrasad && existingPrasad.balyaTiming && existingPrasad.MadhyannaTiming && existingPrasad.ratriTiming) {
                        // If all timings are updated, show an error that prasad is already taken for today
                        return res.status(200).json({ status: "Failure",error: {errorCode :1001,message: messages.PRASAD_TAKEN}, devoteeData : devoteeDetails});
                    }else {
                        // Check if the current time falls within any meal timings
                        const isBalyaTime = await compareThreeTime(currentTime, balyaStartTime, balyaEndTime);
                        const isMadhyannaTime = await compareThreeTime(currentTime, madhyanaStartTime, madhyanaEndTime);
                        const isRatraTime = await compareThreeTime(currentTime, ratraStartTime, ratraEndTime);
                      
                        let prasadFound = false;
        
                        const existingPrasad = prasadDetails.prasad.find(prasad => prasad.date === currentDate);
        
                        if (existingPrasad) {
                            console.log("prasad exist", existingPrasad)
                            if (isBalyaTime && !existingPrasad.balyaTiming) {
                                existingPrasad.balyaTiming = currentTime;
                            } else if (isMadhyannaTime && !existingPrasad.madhyanaTiming) {
                                existingPrasad.madhyanaTiming = currentTime;
                            } else if (isRatraTime && !existingPrasad.ratraTiming) {
                                existingPrasad.ratraTiming = currentTime;
                            } else {
                                return res.status(200).json({ status: "Failure",error: {errorCode :1001,message: messages.PRASAD_TAKEN} ,devoteeData : devoteeDetails});
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
                        return res.status(200).json({ status: "Success",message: messages.SCAN_SUCCESSFULLY,error: null,devoteeData : devoteeDetails});
  
                    }
                } else {
                    // Create a new prasad entry for the devotee
                    const isBalyaTime = await compareThreeTime(currentTime, balyaStartTime, balyaEndTime);
                        const isMadhyannaTime = await compareThreeTime(currentTime, madhyanaStartTime, madhyanaEndTime);
                        const isRatraTime = await compareThreeTime(currentTime, ratraStartTime, ratraEndTime);
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
                       return res.status(200).json({ status: "Failure",message: messages.SCAN_SUCCESSFULLY ,error: null ,devoteeData : devoteeDetails});
                        // return res.status(200).json({ error: messages.SCAN_SUCCESSFULLY,devoteeData : devoteeDetails });
                    } else {
                        return res.status(200).json({ status: "Failure",error: {errorCode :1001,message: messages.INVALID_TIME} ,devoteeData : devoteeDetails});
                        // return res.status(200).json({ error: messages.INVALID_TIME,devoteeData : devoteeDetails });
                    }
                }
            }else{
                console.log("Error: messages.PRANAMI_NOT_PAID");
                return res.status(500).json({ error: messages.PRANAMI_NOT_PAID });
            }
           
        }else{
            console.log("Error: ", error);
            return res.status(500).json({ error: "Please check the timings-- " });
        }
       
    } catch (error) {
        console.log("Error: ", error);
        return res.status(500).json({ error: error });
    }
};

const securityCheck = async (req,res) =>{
    let data = req.body
    try {
        let devotee = await allmodel.devoteemodel.findOne({devoteeCode: req.params.devoteeCode});
        if(!devotee){
            throw messages.NO_DEVOTEEFOUND
        }else{
            res.status(200).json(messages.DEVOTEE_VERIFIED)
        }
    } catch (error) {
        res.status(500).json(error)
        console.log("security check error",error)
    }
}



async function compareThreeTime(orderTime, mealStartTime, mealEndTime) {
    const orderTimestamp = new Date(`1970-01-01T${orderTime}:00Z`).getTime();
    const mealStartTimestamp = new Date(`1970-01-01T${mealStartTime}:00Z`).getTime();
    const mealEndTimestamp = new Date(`1970-01-01T${mealEndTime}:00Z`).getTime();
    return orderTimestamp >= mealStartTimestamp && orderTimestamp <= mealEndTimestamp;
}



const createRelativeDevotee = async (req, res) => {
    try {
        let data = req.body
        // let existdevotee =await devotee.findOne({emailId: data.emailId})
        // if (existdevotee) throw messages.EXISTING_DEVOTEE

        let findLastdevoteeCode =await devotee.find({}).sort({devoteeCode : -1}).limit(1);
        console.log("findLastdevoteeCode --- ",findLastdevoteeCode)
        if(findLastdevoteeCode){
            data.devoteeCode = findLastdevoteeCode[0].devoteeCode + 1
        }

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
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5000;
        const numberofskipdata = (page - 1) * limit;
        let allDevotee = []
        let count
        if (req.query.sangha) {
            count = await devotee.countDocuments({sangha:{ "$regex": `${req.query.sangha}`, '$options': 'i' }})
            allDevotee = await devotee.find({sangha:{ "$regex": `${req.query.sangha}`, '$options': 'i' }}).sort({devoteeCode:-1}).skip(numberofskipdata).limit(limit); 
        } else {
            count = await devotee.countDocuments()
        allDevotee = await devotee.find().sort({devoteeCode:-1}).skip(numberofskipdata).limit(limit); 
        }
        const totalPages = Math.ceil(count / limit);
        for (let i = 0; i < allDevotee.length; i++) {
            const createdByDevotee = await devotee.findOne({ devoteeId: allDevotee[i].createdById });
            if (createdByDevotee) {
                allDevotee[i].createdById = createdByDevotee.name;
                // delete allDevotee[i].createdById; // Remove the createdById field
            }
        }
        res.status(200).json({allDevotee,count,totalPages,page})
    } catch (error) {
        console.log(error);
        res.status(400).json({"error":error.message});
    }
};

// Single Devotee
const devotee_details = async (req, res) => {
    try {
        const singleDevotee = await devotee.find({devoteeId:req.user.devoteeId})
        for (let i = 0; i < singleDevotee.length; i++) {
            const createdByDevotee = await devotee.findOne({ devoteeId: singleDevotee[i].createdById });
            if (createdByDevotee) {
                singleDevotee[i].createdById = createdByDevotee.name;
                // delete singleDevotee[i].createdById; // Remove the createdById field
            }
        }
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
        // for (let i = 0; i < singleDevotee.length; i++) {
        //     const createdByDevotee = await devotee.findOne({ devoteeId: singleDevotee[i].createdById });
        //     if (createdByDevotee) {
        //         singleDevotee[i].createdById = createdByDevotee.name;
        //         // delete singleDevotee[i].createdById; // Remove the createdById field
        //     }
        // }
        res.status(200).json({singleDevotee})
    } catch (error) {
        console.log(error);
        res.status(400).json({"error":error.message});
    }
};
// search Devotee with Relatives
const searchDevotee = async (req, res) => {
    let searchDevotee;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5000;
    const numberofskipdata = (page - 1) * limit;
    let count
    try {
        if(req.query.status){
                count = await devotee.countDocuments({status: {"$regex": `${req.query.status}`, '$options': 'i' }})
                searchDevotee = await devotee.find({status: {"$regex": `${req.query.status}`, '$options': 'i' }}).sort({devoteeCode:-1}).skip(numberofskipdata).limit(limit); 
           
            
        }
        if(req.query.devoteeName){
            count = await devotee.find({name: {"$regex": `${req.query.devoteeName}`, '$options': 'i' }})
         searchDevotee = await devotee.find({name: {"$regex": `${req.query.devoteeName}`, '$options': 'i' }}).sort({devoteeCode:-1}).skip(numberofskipdata).limit(limit); ;
        }
        if(req.query.status && req.query.devoteeName){
            count = await devotee.find({status: {"$regex": `${req.query.status}`, '$options': 'i' },name:{"$regex": `${req.query.devoteeName}`, '$options': 'i' } })
            searchDevotee = await devotee.find({status: {"$regex": `${req.query.status}`, '$options': 'i' },name:{"$regex": `${req.query.devoteeName}`, '$options': 'i' } }).sort({devoteeCode:-1}).skip(numberofskipdata).limit(limit); 
        }
        const totalPages = Math.ceil(count / limit);

        for (let i = 0; i < searchDevotee.length; i++) {
            let approvedByDevoteename = "";
            let rejectedByDevoteename = "";
            let createdId
            const createdByDevotee = await devotee.findOne({ devoteeId: searchDevotee[i].createdById });
         if(searchDevotee[i].status== "approved"){
           let approvedByDevotee = await  devotee.findOne({ devoteeId: searchDevotee[i].approvedBy });
           if(approvedByDevotee){
              approvedByDevoteename = approvedByDevotee.name  ?? ""
           }
          
         }
         if(searchDevotee[i].status== "rejected"){
            let rejectedByDevotee = await  devotee.findOne({ devoteeId: searchDevotee[i].rejectedBy });
            if(rejectedByDevotee){
                rejectedByDevoteename = rejectedByDevotee.name  ?? ""
            }
          }
            
            if (createdByDevotee) {
                searchDevotee[i].createdByUUID = createdByDevotee.createdById
                searchDevotee[i].createdById = createdByDevotee.name;
                searchDevotee[i].approvedBy = approvedByDevoteename
                searchDevotee[i].rejectedBy = rejectedByDevoteename
            }
        }
       
        res.status(200).json({searchDevotee,count,totalPages,page})
    } catch (error) {
        console.log(error);
        res.status(400).json({"error":error.message});
    }
};
// advance search Devotee with Relatives
const advanceSearchDevotee = async (req, res) => {
    let searchDevotee;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5000;
    const numberofskipdata = (page - 1) * limit;
    let count
    try {
        if(req.query.advanceStatus){
            if(req.query.sangha){
                searchDevotee = await devotee.find({sangha: {"$regex": `${req.query.sangha}`, '$options': 'i' },status: req.query.advanceStatus}).sort({devoteeCode:-1}).skip(numberofskipdata).limit(limit); 
                count = await devotee.countDocuments({sangha: {"$regex": `${req.query.sangha}`, '$options': 'i' },status: req.query.advanceStatus}) 
            }else if(req.query.status){
                searchDevotee = await devotee.find({status: {"$regex": `${req.query.status}`, '$options': 'i' }}).sort({devoteeCode:-1}).skip(numberofskipdata).limit(limit); 
                count = await devotee.countDocuments({status: {"$regex": `${req.query.status}`, '$options': 'i' }})
            }else if(req.query.bloodGroup){
                searchDevotee = await devotee.find({bloodGroup: req.query.bloodGroup,status: req.query.advanceStatus}).sort({devoteeCode:-1}).skip(numberofskipdata).limit(limit); 
                count = await devotee.countDocuments({bloodGroup: req.query.bloodGroup,status: req.query.advanceStatus})
            }else if(req.query.gender){
                searchDevotee = await devotee.find({gender: req.query.gender,status: req.query.advanceStatus }).sort({devoteeCode:-1}).skip(numberofskipdata).limit(limit); 
                count = await devotee.countDocuments({gender: req.query.gender,status: req.query.advanceStatus }) 
            }else if(req.query.mobileNumber){
                searchDevotee = await devotee.find({mobileNumber: {"$regex": `${req.query.mobileNumber}`, '$options': 'i' },status: req.query.advanceStatus}).sort({devoteeCode:-1}).skip(numberofskipdata).limit(limit); 
                count = await devotee.countDocuments({mobileNumber: {"$regex": `${req.query.mobileNumber}`, '$options': 'i' },status: req.query.advanceStatus}); 
            }else if(req.query.emailId){
                searchDevotee = await devotee.find({emailId: {"$regex": `${req.query.emailId}`, '$options': 'i' },status: req.query.advanceStatus}).sort({devoteeCode:-1}).skip(numberofskipdata).limit(limit); 
                count = await devotee.countDocuments({emailId: {"$regex": `${req.query.emailId}`, '$options': 'i' },status: req.query.advanceStatus})
            }else if(req.query.name){
                searchDevotee = await devotee.find({name: {"$regex": `${req.query.name}`, '$options': 'i' },status: req.query.advanceStatus}).sort({devoteeCode:-1}).skip(numberofskipdata).limit(limit); 
                count = await devotee.countDocuments({name: {"$regex": `${req.query.name}`, '$options': 'i' },status: req.query.advanceStatus})
            }else if(req.query.devoteeCode){
                searchDevotee = await devotee.find({devoteeCode:req.query.devoteeCode,status: req.query.advanceStatus}).sort({devoteeCode:-1}).skip(numberofskipdata).limit(limit); 
                count = await devotee.countDocuments({devoteeCode:req.query.devoteeCode,status: req.query.advanceStatus})
            }
        }else{
            if(req.query.sangha){
                searchDevotee = await devotee.find({sangha: {"$regex": `${req.query.sangha}`, '$options': 'i' }}).sort({devoteeCode:1}).skip(numberofskipdata).limit(limit); 
                count = await devotee.countDocuments({sangha: {"$regex": `${req.query.sangha}`, '$options': 'i' }})
            }else if(req.query.status){
                searchDevotee = await devotee.find({status: {"$regex": `${req.query.status}`, '$options': 'i' }}).sort({devoteeCode:1}).skip(numberofskipdata).limit(limit); 
                count = await devotee.countDocuments({status: {"$regex": `${req.query.status}`, '$options': 'i' }})
            }else if(req.query.bloodGroup){
                searchDevotee = await devotee.find({bloodGroup: req.query.bloodGroup}).sort({devoteeCode:1}).skip(numberofskipdata).limit(limit); 
                count = await devotee.countDocuments({bloodGroup: req.query.bloodGroup})
            }else if(req.query.gender){
                searchDevotee = await devotee.find({gender: req.query.gender }).sort({devoteeCode:1}).skip(numberofskipdata).limit(limit); 
                count = await devotee.countDocuments({gender: req.query.gender })
            }else if(req.query.mobileNumber){
                searchDevotee = await devotee.find({mobileNumber: {"$regex": `${req.query.mobileNumber}`, '$options': 'i' }}).sort({devoteeCode:1}).skip(numberofskipdata).limit(limit); 
                count = await devotee.countDocuments({mobileNumber: {"$regex": `${req.query.mobileNumber}`, '$options': 'i' }})
            }else if(req.query.emailId){
                searchDevotee = await devotee.find({emailId: {"$regex": `${req.query.emailId}`, '$options': 'i' }}).sort({devoteeCode:1}).skip(numberofskipdata).limit(limit); 
                count = await devotee.countDocuments({emailId: {"$regex": `${req.query.emailId}`, '$options': 'i' }})
            }else if(req.query.name){
                searchDevotee = await devotee.find({name: {"$regex": `${req.query.name}`, '$options': 'i' }}).sort({devoteeCode:1}).skip(numberofskipdata).limit(limit); 
                count = await devotee.countDocuments({name: {"$regex": `${req.query.name}`, '$options': 'i' }})
            }else if(req.query.devoteeCode){
                searchDevotee = await devotee.find({devoteeCode: req.query.devoteeCode}).sort({devoteeCode:1}).skip(numberofskipdata).limit(limit); 
                count = await devotee.countDocuments({devoteeCode: req.query.devoteeCode})
            }
        }
        const totalPages = Math.ceil(count / limit);
        for (let i = 0; i < searchDevotee.length; i++) {
            let approvedByDevoteename = "";
            let rejectedByDevoteename = "";
            const createdByDevotee = await devotee.findOne({ devoteeId: searchDevotee[i].createdById });
         if(searchDevotee[i].status== "approved"){
           let approvedByDevotee = await  devotee.findOne({ devoteeId: searchDevotee[i].approvedBy });
           if(approvedByDevotee){
              approvedByDevoteename = approvedByDevotee.name  ?? ""
           }
          
         }
         if(searchDevotee[i].status== "rejected"){
            let rejectedByDevotee = await  devotee.findOne({ devoteeId: searchDevotee[i].rejectedBy });
            if(rejectedByDevotee){
                rejectedByDevoteename = rejectedByDevotee.name  ?? ""
            }
          }
            
            if (createdByDevotee) {
                searchDevotee[i].createdByUUID = createdByDevotee.createdById
                searchDevotee[i].createdById = createdByDevotee.name;
                searchDevotee[i].approvedBy = approvedByDevoteename
                searchDevotee[i].rejectedBy = rejectedByDevoteename
            }
        }
       
        res.status(200).json({searchDevotee,count,totalPages,page})
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
data.updatedById = currentDevotee.devoteeId
if(data.status == "approved"){
    data.approvedBy = currentDevotee.devoteeId;
}
if(data.status == "rejected"){
    data.rejectedBy = currentDevotee.devoteeId;
}
let oldDevoteeData = await devotee.findOne({devoteeId: req.params.id});
if(!oldDevoteeData) throw messages.NO_DEVOTEEFOUND

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
        let findPrasadDate =await allmodel.settings.find();
        console.log("findPrasadDate------",findPrasadDate)
       let firstDate = findPrasadDate[0].prasadFirstDate
       let secondDate = findPrasadDate[0].prasadSecondDate
       let thirdDate = findPrasadDate[0].prasadThirdDate
 
async function devoteeList(status) {
    let statusby ;
        statusby = await devotee.find({status: status});
    return statusby.length;
}
async function countDevoteePrasadtaken(desiredDate, timeStamp) {
    const countResult = await allmodel.prasadModel.aggregate([
        { $unwind: '$prasad' },
        {
          $match: {
            'prasad.date': desiredDate,
            [timeStamp]: { $ne: '' },
          },
        },
        {
          $group: {
            _id: '$devoteeId',
          },
        },
        {
          $group: {
            _id: null,
            totalCount: { $sum: 1 },
          },
        },
      ]);
      let devoteeprasadTakenCount = countResult.length > 0 ? countResult[0].totalCount : 0;
      return devoteeprasadTakenCount;
}

       let allDevotee = await devotee.find().sort({name:1})
       let currentDevotee = await devotee.findById(req.user._id)
let data;

  data = [
            {
                title: "",
                message: "ପଞ୍ଜିକୃତ ଭକ୍ତଙ୍କ ସଂଖ୍ୟା",
                translate: "All Devotee",
                status: "allDevotee",
                count: allDevotee.length,
            },
            {
                title: "",
                message: "ନିବେଦନକାରୀ ପ୍ରବେଶପତ୍ର",
                translate: "Delegate Submitted",
                status: "dataSubmitted",
                count: await devoteeList("dataSubmitted")
            },
            {
                title: "",
                message: "ଗ୍ରହୀତ ପ୍ରବେଶପତ୍ର",
                translate: "Delegate Approved",
                status: "Approved",
                count: await devoteeList("approved")
            },
            {
                title: "",
                message: "ପ୍ରବେଶ ପତ୍ର ପ୍ରଣାମୀ ଦାଖଲକାରୀ ସଂଖ୍ୟା",
                translate: "Paid Devotee",
                status : "paid",
                count:await devoteeList("paid")
            },
            {
                title: "",
                message: "ପ୍ରବେଶ ପତ୍ର ଛପା ସଂଖ୍ୟା",
                translate: "Delegate Printed",
                status: "printed",
                count: await devoteeList("printed")
            },
            {
                title: "",
                message: "ଖାରଜ ହୋଇଥିବା ପ୍ରବେଶ ପତ୍ର",
                translate: "Rejected Delegate",
                status: "rejected",
                count: await devoteeList("rejected"),
            },
            {
                title: "",
                message: "ରଦ୍ଦ ହୋଇଥିବା ପ୍ରବେଶ ପତ୍ର",
                translate: "Blacklisted Delegate",
                status: "blacklisted",
                count: await devoteeList("blacklisted"),
            },
           
            {
                title: "",
                message: "ହଜିଯାଇଥିବା ପ୍ରବେଶ ପତ୍ର",
                translate: "Lost delegate card",
                status: "lost",
                count: await devoteeList("lost")
            },    
            {
                title: firstDate || moment.tz('Asia/Kolkata').format('YYYY-MM-DD'),
                message: "ବାଲ୍ୟ",
                translate: "breakfast",
                status: "lost",
                count: await countDevoteePrasadtaken(firstDate || moment.tz('Asia/Kolkata').format('YYYY-MM-DD'),"prasad.balyaTiming")
            },       
            {
                title: secondDate || moment.tz('Asia/Kolkata').clone().subtract(1, 'day').format('YYYY-MM-DD'),
                message: "ବାଲ୍ୟ",
                translate: "breakfast",
                status: "lost",
                count: await countDevoteePrasadtaken(secondDate || moment.tz('Asia/Kolkata').clone().subtract(1, 'day').format('YYYY-MM-DD'),"prasad.balyaTiming")
            },       
            {
                title: thirdDate || moment.tz('Asia/Kolkata').clone().subtract(2, 'day').format('YYYY-MM-DD'),
                message: "ବାଲ୍ୟ",
                translate: "breakfast",
                status: "lost",
                count: await countDevoteePrasadtaken(thirdDate || moment.tz('Asia/Kolkata').clone().subtract(2, 'day').format('YYYY-MM-DD'),"prasad.balyaTiming")
            },       
            {
                title: firstDate || moment.tz('Asia/Kolkata').format('YYYY-MM-DD'),
                message: "ମଧ୍ୟାହ୍ନ",
                translate: "Lunch",
                status: "lost",
                count: await countDevoteePrasadtaken(firstDate || moment.tz('Asia/Kolkata').format('YYYY-MM-DD'),"prasad.madhyanaTiming")
            },       
            {
                title: secondDate || moment.tz('Asia/Kolkata').clone().subtract(1, 'day').format('YYYY-MM-DD'),
                message: "ମଧ୍ୟାହ୍ନ",
                translate: "Lunch",
                status: "lost",
                count: await countDevoteePrasadtaken(secondDate || moment.tz('Asia/Kolkata').clone().subtract(1, 'day').format('YYYY-MM-DD'),"prasad.madhyanaTiming")
            },       
            {
                title: thirdDate || moment.tz('Asia/Kolkata').clone().subtract(2, 'day').format('YYYY-MM-DD'),
                message: "ମଧ୍ୟାହ୍ନ",
                translate: "Lunch",
                status: "lost",
                count: await countDevoteePrasadtaken(thirdDate || moment.tz('Asia/Kolkata').clone().subtract(2, 'day').format('YYYY-MM-DD'),"prasad.madhyanaTiming")
            },       
            {
                title: firstDate || moment.tz('Asia/Kolkata').format('YYYY-MM-DD'),
                message: "ରାତ୍ର",
                translate: "Dinner",
                status: "lost",
                count: await countDevoteePrasadtaken(firstDate || moment.tz('Asia/Kolkata').format('YYYY-MM-DD'),"prasad.ratraTiming")
            },       
            {
                title: secondDate || moment.tz('Asia/Kolkata').clone().subtract(1, 'day').format('YYYY-MM-DD'),
                message: "ରାତ୍ର",
                translate: "Dinner",
                status: "lost",
                count: await countDevoteePrasadtaken(secondDate || moment.tz('Asia/Kolkata').clone().subtract(1, 'day').format('YYYY-MM-DD'),"prasad.ratraTiming")
            },       
            {
                title: thirdDate ||moment.tz('Asia/Kolkata').clone().subtract(2, 'day').format('YYYY-MM-DD'),
                message: "ରାତ୍ର",
                translate: "Dinner",
                status: "lost",
                count: await countDevoteePrasadtaken(thirdDate || moment.tz('Asia/Kolkata').clone().subtract(2, 'day').format('YYYY-MM-DD'),"prasad.ratraTiming")
            },   
            
        ]

       

        res.status(200).json(data)
    } catch (error) {
        console.log(error);
        res.status(400).json({"error":error.message});
    }
};

const prasadCount = async(req,res) =>{
    let findPrasadDate =await allmodel.settings.find();
    console.log("findPrasadDate------",findPrasadDate)
   let firstDate = findPrasadDate[0].prasadFirstDate
   let secondDate = findPrasadDate[0].prasadSecondDate
   let thirdDate = findPrasadDate[0].prasadThirdDate
    async function countDevoteePrasadtaken(desiredDate, timeStamp) {
        const countResult = await allmodel.prasadModel.aggregate([
          { $unwind: '$prasad' },
          {
            $match: {
              'prasad.date': desiredDate,
              [timeStamp]: { $ne: '' },
            },
          },
          {
            $group: {
              _id: '$devoteeId',
            },
          },
          {
            $group: {
              _id: null,
              totalCount: { $sum: 1 },
            },
          },
        ]);
        let devoteeprasadTakenCount = countResult.length > 0 ? countResult[0].totalCount : 0;
        return devoteeprasadTakenCount;
    }
        let data = [];
        if(firstDate){
            data.push( {
                title: firstDate,
                message: "ବାଲ୍ୟ",
                translate: "breakfast",
                status: "lost",
                count:   await countDevoteePrasadtaken(firstDate,"prasad.balyaTiming")
            },  
            {
                title: firstDate,
                message: "ମଧ୍ୟାହ୍ନ",
                translate: "Lunch",
                status: "lost",
                count:  await countDevoteePrasadtaken(firstDate,"prasad.madhyanaTiming")
            },       
            {
                title: firstDate,
                message: "ରାତ୍ର",
                translate: "Dinner",
                status: "lost",
                count:  await countDevoteePrasadtaken(firstDate,"prasad.ratraTiming")
            }, )
    }
    if(secondDate){
        data.push( {
            title: secondDate,
            message: "ବାଲ୍ୟ",
            translate: "breakfast",
            status: "lost",
            count:   await countDevoteePrasadtaken(secondDate,"prasad.balyaTiming")
        },  
        {
            title: secondDate,
            message: "ମଧ୍ୟାହ୍ନ",
            translate: "Lunch",
            status: "lost",
            count:  await countDevoteePrasadtaken(secondDate,"prasad.madhyanaTiming")
        },       
        {
            title: secondDate,
            message: "ରାତ୍ର",
            translate: "Dinner",
            status: "lost",
            count:  await countDevoteePrasadtaken(secondDate,"prasad.ratraTiming")
        }, )
}
    if(thirdDate){
        data.push( {
            title: thirdDate,
            message: "ବାଲ୍ୟ",
            translate: "breakfast",
            status: "lost",
            count:   await countDevoteePrasadtaken(thirdDate,"prasad.balyaTiming")
        },  
        {
            title: thirdDate,
            message: "ମଧ୍ୟାହ୍ନ",
            translate: "Lunch",
            status: "lost",
            count:  await countDevoteePrasadtaken(thirdDate,"prasad.madhyanaTiming")
        },       
        {
            title: thirdDate,
            message: "ରାତ୍ର",
            translate: "Dinner",
            status: "lost",
            count:  await countDevoteePrasadtaken(thirdDate,"prasad.ratraTiming")
        }, )
}
        res.status(200).json(data) ;
      }


const prasadCountByselectdate = async(req,res)=>{
  let data= []
    async function countDevoteePrasadtaken(desiredDate, timeStamp) {
    const countResult = await allmodel.prasadModel.aggregate([
        { $unwind: '$prasad' },
        {
          $match: {
            'prasad.date': desiredDate,
            [timeStamp]: { $ne: '' },
          },
        },
        {
          $group: {
            _id: '$devoteeId',
          },
        },
        {
          $group: {
            _id: null,
            totalCount: { $sum: 1 },
          },
        },
      ]);
      let devoteeprasadTakenCount = countResult.length > 0 ? countResult[0].totalCount : 0;
      return devoteeprasadTakenCount;
     
    }
   
         data =  [{
              title: req.query.date,
              message: "ବାଲ୍ୟ",
              translate: "breakfast",
              status: "lost",
              count:   await countDevoteePrasadtaken(req.query.date ,"prasad.balyaTiming")
          },  
          {
              title: req.query.date,
              message: "ମଧ୍ୟାହ୍ନ",
              translate: "Lunch",
              status: "lost",
              count:  await countDevoteePrasadtaken(req.query.date,"prasad.madhyanaTiming")
          },       
          {
              title: req.query.date,
              message: "ରାତ୍ର",
              translate: "Dinner",
              status: "lost",
              count:  await countDevoteePrasadtaken(req.query.date,"prasad.ratraTiming")
          }, ]
          res.status(200).json(data);
  }

  const prasdCountNow = async(req,res)=>{
    try {
        let allTimings = await allmodel.settings.findOne();
   
            let balyaStartTime = allTimings.balyaStartTime
            let balyaEndTime = allTimings.balyaEndTime
            let madhyanaStartTime = allTimings.madhyanaStartTime
            let madhyanaEndTime = allTimings.madhyanaEndTime
            let ratraStartTime = allTimings.ratraStartTime
            let ratraEndTime = allTimings.ratraEndTime

        const isBalyaTime = await compareThreeTime(req.query.currentTime, balyaStartTime, balyaEndTime);
        const isMadhyannaTime = await compareThreeTime(req.query.currentTime, madhyanaStartTime, madhyanaEndTime);
        const isRatraTime = await compareThreeTime(req.query.currentTime, ratraStartTime, ratraEndTime);
        async function countDevoteePrasadtaken(desiredDate, timeStamp) {
            const countResult = await allmodel.prasadModel.aggregate([
                { $unwind: '$prasad' },
                {
                  $match: {
                    'prasad.date': desiredDate,
                    [timeStamp]: { $ne: '' },
                  },
                },
                {
                  $group: {
                    _id: '$devoteeId',
                  },
                },
                {
                  $group: {
                    _id: null,
                    totalCount: { $sum: 1 },
                  },
                },
              ]);
              let devoteeprasadTakenCount = countResult.length > 0 ? countResult[0].totalCount : 0;
              return devoteeprasadTakenCount;
        }
        let data;
        if(isBalyaTime){
            data = {
              date: req.query.date,
              timing: "ବାଲ୍ୟ",
              translate: "breakfast",
              count:   await countDevoteePrasadtaken(req.query.date ,"prasad.balyaTiming")
            }
           
          
        }else if(isMadhyannaTime){
            data =   {
                date: req.query.date,
                timing: "ମଧ୍ୟାହ୍ନ",
                translate: "Lunch",
                count:  await countDevoteePrasadtaken(req.query.date,"prasad.madhyanaTiming")
            }
        }else if(isRatraTime){
 data = {
    date: req.query.date,
    timing: "ରାତ୍ର",
              translate: "Dinner",
            
              count:  await countDevoteePrasadtaken(req.query.date,"prasad.ratraTiming")
          }
        }else{
            data = {
                date: req.query.date,
                timing: messages.INVALID_TIME,
                translate: "",
                count:  0
                      }
        }
 res.status(200).json(data)
    } catch (error) {
        console.log("error in find count",data)
         res.status(500).json(error)
    }
   
  }

    



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
    advanceSearchDevotee,
    createRelativeDevotee,
    admin_devoteeDashboard,
    prasdUpdateDevotee,
    securityCheck,
    devoteeListBycreatedById,
    prasadCount,
    updateSettings,
    prasadCountByselectdate,
    getSettings,
    prasdCountNow
}

//