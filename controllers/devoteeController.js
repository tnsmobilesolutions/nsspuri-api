const devotee = require("../model/devotee");
const jwt = require("jsonwebtoken");
const moment = require('moment-timezone');
const allmodel = require("../model/allmodel");
const e = require("express");
const { model } = require("mongoose");
const dotenv = require("dotenv").config();
const messages = require("./messages/message");
const settings = require("../model/settings");
const uuid = require("uuid")


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
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5000;
    const numberofskipdata = (page - 1) * limit;

    let count
    let sort ={}
if(req.query.name=="ascending"){
sort = {name:1}
}else if (req.query.name=="descending"){
sort = {name:-1}
}else{
sort = {devoteeCode: 1}
}
  try {
    let devoteeList = await allmodel.devoteemodel.find({createdById: req.params.id}).sort(sort).skip(numberofskipdata).limit(limit); 
   
     count = await allmodel.devoteemodel.countDocuments({createdById: req.params.id})
    for (let i = 0; i < devoteeList.length; i++) {
        const createdByDevotee = await devotee.findOne({ devoteeId: devoteeList[i].createdById });
        if (createdByDevotee) {
            devoteeList[i].createdById = createdByDevotee.name;
            // delete allDevotee[i].createdById; // Remove the createdById field
        }
    }
    const totalPages = Math.ceil(count / limit);
    res.status(200).json({devoteeList,count,totalPages,page})
  } catch (error) {
    console.log(error)
  }
}
//update prasad by qr code
const prasdUpdateDevotee = async (req, res) => {
    try {
        let data = req.body;
        let code = parseInt(req.params.code, 10)
        let allTimings = await allmodel.settings.findOne();
        if(allTimings){
            let balyaStartTime = allTimings.balyaStartTime
            let balyaEndTime = allTimings.balyaEndTime
            let madhyanaStartTime = allTimings.madhyanaStartTime
            let madhyanaEndTime = allTimings.madhyanaEndTime
            let ratraStartTime = allTimings.ratraStartTime
            let ratraEndTime = allTimings.ratraEndTime
            let prasadFirstDate = allTimings.prasadFirstDate
            let prasadSecondDate = allTimings.prasadSecondDate
            let prasadThirdDate = allTimings.prasadThirdDate     
            const currentDate = data.date;
            const currentTime = data.time;
            const prasadDates = [prasadFirstDate, prasadSecondDate, prasadThirdDate];
               // Check if the current time falls within any meal timings
               const isBalyaTime = await compareThreeTime(currentTime, balyaStartTime, balyaEndTime);
               const isMadhyannaTime = await compareThreeTime(currentTime, madhyanaStartTime, madhyanaEndTime);
               const isRatraTime = await compareThreeTime(currentTime, ratraStartTime, ratraEndTime);
if(code > 1000000){
    const couponDevotee =  await allmodel.prasadModel.findOne({couponCode: code})
    if(!couponDevotee){
        return res.status(200).json({ status: "Failure",error: {errorCode :1001,message: messages.NO_COUPONCODE}, devoteeData : null})
}else{
    const couponDevoteewithDate =  await allmodel.prasadModel.findOne({couponDevotee:true,couponCode: code,"couponPrasad.date":currentDate})
    let limitmessage;
    if (couponDevoteewithDate) {
        let limitExceeded = false;
    
        for (let prasad of couponDevoteewithDate.couponPrasad) {
            if (prasad.date === currentDate) {
                if (isBalyaTime && prasad.balyaCount > 0) {
                    prasad.balyaCount--;
                    prasad.balyaTiming.push(currentTime);
                } else if (isMadhyannaTime && prasad.madhyanaCount > 0) {
                    prasad.madhyanaCount--;
                    prasad.madhyanaTiming.push(currentTime);
                } else if (isRatraTime && prasad.ratraCount > 0) {
                    prasad.ratraCount--;
                    prasad.ratraTiming.push(currentTime);
                } else {
                    limitExceeded = true;
                    break;
                }
            }
        }
        if (limitExceeded) {
            return res.status(200).json({ status: "Failure", error: { errorCode: 1001, message: messages.LIMIT_EXCEEDED }, devoteeData: null,couponCode: code });
        }
    
        await couponDevoteewithDate.save();
        return res.status(200).json({ status: "Success", error: { errorCode: 1001, message: messages.SCAN_SUCCESSFULLY }, devoteeData: null,couponCode: code });
    } else {
        return res.status(200).json({ status: "Failure", error: { errorCode: 1001, message: messages.LIMIT_EXCEEDED }, devoteeData: null,couponCode: code });
    }
}
}
            const devoteeDetails = await allmodel.devoteemodel.findOne({ devoteeCode: code });
            if (!devoteeDetails) {return res.status(200).json({ status: "Failure",error: {errorCode :1001,message: messages.NO_DEVOTEEFOUND}, devoteeData : devoteeDetails});} 
    
            if(devoteeDetails.status == "blacklisted"  ) {return res.status(200).json({ status: "Failure",error: {errorCode :1001,message: messages.BLACKLISTED_DEVOTEE_SCAN}, devoteeData : devoteeDetails});}
            if( devoteeDetails.status == "rejected") {return res.status(200).json({ status: "Failure",error: {errorCode :1001,message: messages.REJECTED_DEVOTEE_SCAN}, devoteeData : devoteeDetails});}
            if(devoteeDetails.status == "lost") {return res.status(200).json({ status: "Failure",error: {errorCode :1001,message: messages.LOST_DEVOTEE_SCAN}, devoteeData : devoteeDetails});}
            if(devoteeDetails.status == "withdrawn") {return res.status(200).json({ status: "Failure",error: {errorCode :1001,message: messages.WITHDRAWN_DEVOTEE_SCAN}, devoteeData : devoteeDetails});}
            if (!prasadDates.includes(currentDate)){
                return res.status(200).json({ status: "Failure",error: {errorCode :1001,message: messages.INVALID_TIME} ,devoteeData : devoteeDetails});
            }
            if (isNaN(req.params.code)) {
                return res.status(200).json({ status: "Failure", error: { errorCode: 1002, message: messages.NO_DEVOTEEFOUND }, devoteeData: null });
            }
            if(devoteeDetails && (devoteeDetails.status == "paid" || devoteeDetails.status == "printed" || devoteeDetails.status == "delivered" )){
                const prasadDetails = await allmodel.prasadModel.findOne({ devoteeCode: parseInt(req.params.code, 10) });
            
                if (prasadDetails && prasadDetails!= null) {
                    const existingPrasad = prasadDetails.prasad.find(prasad => prasad.date === currentDate);
        
                    if (existingPrasad && existingPrasad.balyaTiming && existingPrasad.MadhyannaTiming && existingPrasad.ratriTiming) {
                        let prasadTakenTiming;
                        if(existingPrasad.balyaTiming) prasadTakenTiming = existingPrasad.balyaTiming
                        if(existingPrasad.madhyanaTiming) prasadTakenTiming = existingPrasad.madhyanaTiming
                        if(existingPrasad.ratraTiming) prasadTakenTiming = existingPrasad.ratraTiming
                        return res.status(200).json({ status: "Failure",error: {errorCode :1001,message: messages.PRASAD_TAKEN,prasadTakentiming :prasadTakenTiming } ,devoteeData : devoteeDetails});
                    }else {
                        let prasadFound = false;
                        const existingPrasad = prasadDetails.prasad.find(prasad => prasad.date === currentDate);
        let prasadTakenTiming;
                        if (existingPrasad) {
                            
                            if (isBalyaTime && !existingPrasad.balyaTiming) {
                                existingPrasad.balyaTiming = currentTime;
                            } else if (isMadhyannaTime && !existingPrasad.madhyanaTiming) {
                                existingPrasad.madhyanaTiming = currentTime;
                            } else if (isRatraTime && !existingPrasad.ratraTiming) {
                                existingPrasad.ratraTiming = currentTime;
                            } else {
                                if(existingPrasad.balyaTiming) prasadTakenTiming = existingPrasad.balyaTiming
                                if(existingPrasad.madhyanaTiming) prasadTakenTiming = existingPrasad.madhyanaTiming
                                if(existingPrasad.ratraTiming) prasadTakenTiming = existingPrasad.ratraTiming
                                return res.status(200).json({ status: "Failure",error: {errorCode :1001,message: messages.PRASAD_TAKEN,prasadTakentiming :prasadTakenTiming } ,devoteeData : devoteeDetails});
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
                       return res.status(200).json({ status: "Success",message: messages.SCAN_SUCCESSFULLY ,error: null ,devoteeData : devoteeDetails});
                        // return res.status(200).json({ error: messages.SCAN_SUCCESSFULLY,devoteeData : devoteeDetails });
                    } else {
                        return res.status(200).json({ status: "Failure",error: {errorCode :1001,message: messages.INVALID_TIME} ,devoteeData : devoteeDetails});
                        // return res.status(200).json({ error: messages.INVALID_TIME,devoteeData : devoteeDetails });
                    }
                }
            }else{
                console.log("Error: messages.PRANAMI_NOT_PAID");
                return res.status(200).json({ status: "Failure",error: {errorCode :1001,message: messages.PRANAMI_NOT_PAID} ,devoteeData : devoteeDetails});
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



const offlinePrasad = async (req,res)=>{
    try{
    const updates = req.body; 
    let allTimings = await allmodel.settings.findOne();
        let balyaStartTime = allTimings.balyaStartTime
        let balyaEndTime = allTimings.balyaEndTime
        let madhyanaStartTime = allTimings.madhyanaStartTime
        let madhyanaEndTime = allTimings.madhyanaEndTime
        let ratraStartTime = allTimings.ratraStartTime
        let ratraEndTime = allTimings.ratraEndTime

    for (const update of updates) {
        const { devoteeCodes, date, time } = update;
        const isBalyaTime = await compareThreeTime(time, balyaStartTime, balyaEndTime);
        const isMadhyannaTime = await compareThreeTime(time, madhyanaStartTime, madhyanaEndTime);
        const isRatraTime = await compareThreeTime(time, ratraStartTime, ratraEndTime);

        for (const devoteeCode of devoteeCodes) {
            // Fetch devotee details
            const devoteeDetails = await allmodel.devoteemodel.findOne({ devoteeCode });

            if (!devoteeDetails) {
                console.log(`Devotee with code ${devoteeCode} not found`);
                continue; 
            }

            // Check devotee status
            if (devoteeDetails.status !== "paid" && devoteeDetails.status !== "printed") {
                console.log(`Devotee with code ${devoteeCode} is not paid or printed`);
                continue; 
            }

            // Fetch prasad details
            let prasadDetails = await allmodel.prasadModel.findOne({ devoteeCode });

            if (!prasadDetails) {
                
                if(isBalyaTime){
                    prasadDetails = await allmodel.prasadModel.create({
                        devoteeCode,
                        devoteeId: devoteeDetails.devoteeId,
                        prasad: [{ date, balyaTiming: time, madhyanaTiming: "", ratraTiming: "" }]
                    });
                }if(isMadhyannaTime){
                    prasadDetails = await allmodel.prasadModel.create({
                        devoteeCode,
                        devoteeId: devoteeDetails.devoteeId,
                        prasad: [{ date, balyaTiming: "", madhyanaTiming: time, ratraTiming: "" }]
                    });
                }if(isRatraTime){
                    prasadDetails = await allmodel.prasadModel.create({
                        devoteeCode,
                        devoteeId: devoteeDetails.devoteeId,
                        prasad: [{ date, balyaTiming: "", madhyanaTiming: "", ratraTiming: time }]
                    });
                }
                
            } else {
                // If prasad details found, update existing entry or create new entry
                let existingPrasad = prasadDetails.prasad.find(prasad => prasad.date === date);
                if (existingPrasad) {
                    // Update existing prasad entry
                    if (existingPrasad.balyaTiming && existingPrasad.madhyanaTiming && existingPrasad.ratraTiming) {
                        console.log(`Prasad for devotee with code ${devoteeCode} is already taken for ${date}`);
                        continue; 
                    } else {
                        // Update prasad timing
                        if (!existingPrasad.balyaTiming) existingPrasad.balyaTiming = time;
                        else if (!existingPrasad.madhyanaTiming) existingPrasad.madhyanaTiming = time;
                        else if (!existingPrasad.ratraTiming) existingPrasad.ratraTiming = time;
                       await existingPrasad.save()
                    }
                } else {
                    if(isBalyaTime){
                        prasadDetails.prasad.push({ date, balyaTiming: time, madhyanaTiming: "", ratraTiming: "" });
                    }
                    if(isMadhyannaTime){
                        prasadDetails.prasad.push({ date, balyaTiming: "", madhyanaTiming: time, ratraTiming: "" });
                    }
                    if(isRatraTime){
                        prasadDetails.prasad.push({ date, balyaTiming: "", madhyanaTiming: "", ratraTiming: time });
                    }
                    // Create new prasad entry
                    // prasadDetails.prasad.push({ date, balyaTiming: "", madhyanaTiming: "", ratraTiming: "" });
                }
                await prasadDetails.save();
            }
            console.log(`Prasad updated successfully for devotee with code ${devoteeCode}`);
        }
    }

    return res.status(200).json({ status: "Success", message: "Prasad updated successfully" })
    } catch (error) {
        console.log("error - ---",error)
}
}

const securityCheck = async (req, res) => {
    let data = req.body;
    try {
        // Check if devoteeCode is a number
        const devoteeCode = req.params.devoteeCode;
        if (isNaN(devoteeCode)) {
            return res.status(200).json({ status: "Failure", error: { errorCode: 1002, message: messages.NO_DEVOTEEFOUND }, devoteeData: null });
        }

        let devotee = await allmodel.devoteemodel.findOne({ devoteeCode: devoteeCode });
        if (!devotee) {
            return res.status(200).json({ status: "Failure", error: { errorCode: 1001, message: messages.NO_DEVOTEEFOUND }, devoteeData: null });
        }  
        if(devotee.status == "blacklisted"  ) {return res.status(200).json({ status: "Failure",error: {errorCode :1001,message: messages.BLACKLISTED_DEVOTEE_SCAN}, devoteeData : devotee});}
       else if( devotee.status == "rejected") {return res.status(200).json({ status: "Failure",error: {errorCode :1001,message: messages.REJECTED_DEVOTEE_SCAN}, devoteeData : devotee});}
       else if(devotee.status == "lost") {return res.status(200).json({ status: "Failure",error: {errorCode :1001,message: messages.LOST_DEVOTEE_SCAN}, devoteeData : devotee});}
       else if(devotee.status == "withdrawn") {return res.status(200).json({ status: "Failure",error: {errorCode :1001,message: messages.WITHDRAWN_DEVOTEE_SCAN}, devoteeData : devotee});} 
       else if(devotee.status == "paid" || devotee.status == "printed" ) {return res.status(200).json({ status: "Success",error: null, devoteeData : devotee});} 
        else{
            return res.status(200).json({ status: "Failure",error: {errorCode :1001,message: messages.PRANAMI_NOT_PAID}, devoteeData : devotee});
        }

            // return res.status(200).json({ status: "Success", error: null, devoteeData: devotee });
    } catch (error) {
        res.status(500).json(error);
        console.log("security check error", error);
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
        data.createdByName = req.user.name
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
        let sort ={}
if(req.query.name=="ascending"){
sort = {name:1}
}else if (req.query.name=="descending"){
    sort = {name:-1}
}else{
    sort = {devoteeCode: 1}
}

        if (req.query.sangha) {
            count = await devotee.countDocuments({sangha:{ "$regex": `${req.query.sangha}`, '$options': 'i' }})
            allDevotee = await devotee.find({sangha:{ "$regex": `${req.query.sangha}`, '$options': 'i' }}).sort(sort).skip(numberofskipdata).limit(limit); 
        } else {
            count = await devotee.countDocuments()
        allDevotee = await devotee.find().sort(sort).skip(numberofskipdata).limit(limit); 
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
        let sort ={}
        if(req.query.name=="ascending"){
        sort = {name:1}
        }else if (req.query.name=="descending"){
            sort = {name:-1}
        }else{
            sort = {devoteeCode: 1}
        }
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5000;
        const numberofskipdata = (page - 1) * limit;
        let count = await devotee.countDocuments({createdById: req.user.devoteeId})
        const singleDevotee = await devotee.find({createdById: req.user.devoteeId}).sort(sort).skip(numberofskipdata).limit(limit); 
        if (req.query.eventId) {
            for (let devotee of singleDevotee) {
                let event = await allmodel.eventModel.findOne({ eventId: req.query.eventId, devoteeCode: devotee.devoteeCode }).lean();
                if (!event) {
                    devotee.eventAttendance = null;
                } else {
                    devotee.eventAttendance = event.eventAttendance;
                }
            }
        }
        const totalPages = Math.ceil(count / limit);
        res.status(200).json({singleDevotee,count,totalPages,page})
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
    let sort ={}
    if(req.query.name=="ascending"){
    sort = {name:1}
    }else if (req.query.name=="descending"){
        sort = {name:-1}
    }else{
        sort = {devoteeCode: 1}
    }
    try {
        if(req.query.status){
                count = await devotee.countDocuments({status: {"$regex": `${req.query.status}`, '$options': 'i' }})
                searchDevotee = await devotee.find({status: {"$regex": `${req.query.status}`, '$options': 'i' }}).sort(sort).skip(numberofskipdata).limit(limit).lean(); 
                if (req.query.eventId) {
                    for (let devotee of searchDevotee) {
                        let event = await allmodel.eventModel.findOne({ eventId: req.query.eventId, devoteeCode: devotee.devoteeCode }).lean();
                        if (!event) {
                            devotee.eventAttendance = null;
                        } else {
                            devotee.eventAttendance = event.eventAttendance;
                        }
                    }
                }
            
        }
        if(req.query.devoteeName){
            count = await devotee.find({name: {"$regex": `${req.query.devoteeName}`, '$options': 'i' }})
         searchDevotee = await devotee.find({name: {"$regex": `${req.query.devoteeName}`, '$options': 'i' }}).sort(sort).skip(numberofskipdata).limit(limit); ;
         if (req.query.eventId) {
            for (let devotee of searchDevotee) {
                let event = await allmodel.eventModel.findOne({ eventId: req.query.eventId, devoteeCode: devotee.devoteeCode }).lean();
                if (!event) {
                    devotee.eventAttendance = null;
                } else {
                    devotee.eventAttendance = event.eventAttendance;
                }
            }
        }
        
        }
        if(req.query.status && req.query.devoteeName){
            count = await devotee.find({status: {"$regex": `${req.query.status}`, '$options': 'i' },name:{"$regex": `${req.query.devoteeName}`, '$options': 'i' } })
            searchDevotee = await devotee.find({status: {"$regex": `${req.query.status}`, '$options': 'i' },name:{"$regex": `${req.query.devoteeName}`, '$options': 'i' } }).sort(sort).skip(numberofskipdata).limit(limit); 
            if (req.query.eventId) {
                for (let devotee of searchDevotee) {
                    let event = await allmodel.eventModel.findOne({ eventId: req.query.eventId, devoteeCode: devotee.devoteeCode }).lean();
                    if (!event) {
                        devotee.eventAttendance = null;
                    } else {
                        devotee.eventAttendance = event.eventAttendance;
                    }
                }
            }
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
    let sort ={}
    if(req.query.nameOrder=="ascending"){
    sort = {name:1}
    }else if (req.query.nameOrder=="descending"){
        sort = {name:-1}
    }else{
        sort = {devoteeCode: 1}
    }
    try {
        if(req.query.advanceStatus){
            if(req.query.sangha){
                searchDevotee = await devotee.find({sangha: {"$regex": `${req.query.sangha}`, '$options': 'i' },status: req.query.advanceStatus}).sort(sort).skip(numberofskipdata).limit(limit); 
                
                count = await devotee.countDocuments({sangha: {"$regex": `${req.query.sangha}`, '$options': 'i' },status: req.query.advanceStatus}) 
            }else if(req.query.status){
                searchDevotee = await devotee.find({status: {"$regex": `${req.query.status}`, '$options': 'i' }}).sort(sort).skip(numberofskipdata).limit(limit); 
                count = await devotee.countDocuments({status: {"$regex": `${req.query.status}`, '$options': 'i' }})
            }else if(req.query.bloodGroup){
                searchDevotee = await devotee.find({bloodGroup: req.query.bloodGroup,status: req.query.advanceStatus}).sort(sort).skip(numberofskipdata).limit(limit); 
                count = await devotee.countDocuments({bloodGroup: req.query.bloodGroup,status: req.query.advanceStatus})
            }else if(req.query.gender){
                searchDevotee = await devotee.find({gender: req.query.gender,status: req.query.advanceStatus }).sort(sort).skip(numberofskipdata).limit(limit); 
                count = await devotee.countDocuments({gender: req.query.gender,status: req.query.advanceStatus }) 
            }else if(req.query.mobileNumber){
                searchDevotee = await devotee.find({mobileNumber: {"$regex": `${req.query.mobileNumber}`, '$options': 'i' },status: req.query.advanceStatus}).sort(sort).skip(numberofskipdata).limit(limit); 
                count = await devotee.countDocuments({mobileNumber: {"$regex": `${req.query.mobileNumber}`, '$options': 'i' },status: req.query.advanceStatus}); 
            }else if(req.query.emailId){
                searchDevotee = await devotee.find({emailId: {"$regex": `${req.query.emailId}`, '$options': 'i' },status: req.query.advanceStatus}).sort(sort).skip(numberofskipdata).limit(limit); 
                count = await devotee.countDocuments({emailId: {"$regex": `${req.query.emailId}`, '$options': 'i' },status: req.query.advanceStatus})
            }else if(req.query.name){
                searchDevotee = await devotee.find({name: {"$regex": `${req.query.name}`, '$options': 'i' },status: req.query.advanceStatus}).sort(sort).skip(numberofskipdata).limit(limit); 
                count = await devotee.countDocuments({name: {"$regex": `${req.query.name}`, '$options': 'i' },status: req.query.advanceStatus})
            }else if(req.query.devoteeCode){
                searchDevotee = await devotee.find({devoteeCode:req.query.devoteeCode,status: req.query.advanceStatus}).sort(sort).skip(numberofskipdata).limit(limit); 
                count = await devotee.countDocuments({devoteeCode:req.query.devoteeCode,status: req.query.advanceStatus})
            }
        }else{
            if(req.query.sangha){
                searchDevotee = await devotee.find({sangha: {"$regex": `${req.query.sangha}`, '$options': 'i' }}).sort(sort).skip(numberofskipdata).limit(limit); 
                count = await devotee.countDocuments({sangha: {"$regex": `${req.query.sangha}`, '$options': 'i' }})
            }else if(req.query.status){
                searchDevotee = await devotee.find({status: {"$regex": `${req.query.status}`, '$options': 'i' }}).sort(sort).skip(numberofskipdata).limit(limit); 
                count = await devotee.countDocuments({status: {"$regex": `${req.query.status}`, '$options': 'i' }})
            }else if(req.query.bloodGroup){
                searchDevotee = await devotee.find({bloodGroup: req.query.bloodGroup}).sort(sort).skip(numberofskipdata).limit(limit); 
                count = await devotee.countDocuments({bloodGroup: req.query.bloodGroup})
            }else if(req.query.gender){
                searchDevotee = await devotee.find({gender: req.query.gender }).sort(sort).skip(numberofskipdata).limit(limit); 
                count = await devotee.countDocuments({gender: req.query.gender })
            }else if(req.query.mobileNumber){
                searchDevotee = await devotee.find({mobileNumber: {"$regex": `${req.query.mobileNumber}`, '$options': 'i' }}).sort(sort).skip(numberofskipdata).limit(limit); 
                count = await devotee.countDocuments({mobileNumber: {"$regex": `${req.query.mobileNumber}`, '$options': 'i' }})
            }else if(req.query.emailId){
                searchDevotee = await devotee.find({emailId: {"$regex": `${req.query.emailId}`, '$options': 'i' }}).sort(sort).skip(numberofskipdata).limit(limit); 
                count = await devotee.countDocuments({emailId: {"$regex": `${req.query.emailId}`, '$options': 'i' }})
            }else if(req.query.name){
                searchDevotee = await devotee.find({name: {"$regex": `${req.query.name}`, '$options': 'i' }}).sort(sort).skip(numberofskipdata).limit(limit); 
                count = await devotee.countDocuments({name: {"$regex": `${req.query.name}`, '$options': 'i' }})
            }else if(req.query.devoteeCode){
                searchDevotee = await devotee.find({devoteeCode: req.query.devoteeCode}).sort(sort).skip(numberofskipdata).limit(limit); 
                count = await devotee.countDocuments({devoteeCode: req.query.devoteeCode})
            }
        }
        if (req.query.eventId) {
            for (let devotee of searchDevotee) {
                let event = await allmodel.eventModel.findOne({ eventId: req.query.eventId, devoteeCode: devotee.devoteeCode }).lean();
                if (!event) {
                    devotee.eventAttendance = null;
                } else {
                    devotee.eventAttendance = event.eventAttendance;
                }
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
// if(data.status == "paid" && (!data.paymentMode || data.paymentMode == "" || data.paymentMode == null))throw messages.PAYMENT_MODE

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
        let findPrasadDate =await allmodel.settings.find().lean();
       let firstDate = findPrasadDate[0].prasadFirstDate
       let secondDate = findPrasadDate[0].prasadSecondDate
       let thirdDate = findPrasadDate[0].prasadThirdDate
 
async function devoteeList(status) {
    return await devotee.countDocuments({status: status}).lean();
}
async function countDevoteePrasadtaken(desiredDate, timeStamp) {
   let pipeline = [
    {
      $match: {
        "prasad.date": desiredDate,
      },
    },
    {
      $unwind: {
        path: "$prasad",
      },
    },
     {
      $match: {
        "prasad.date": desiredDate,
      },
    },
    {
      $match: {
        $and: [
          {
            [timeStamp]: {
              $exists: true,
            },
          },
          {
            [timeStamp]: {
              $ne: "",
            },
          },
          {
            [timeStamp]: {
              $ne: null,
            },
          },
        ],
      },
    },
  ]
      let countResult1 = await allmodel.prasadModel.aggregate(pipeline)

      let numberOfDevotee;
      let offlineDevoteeCounter = await allmodel.prasadModel.findOne({outsideDevotee : true,date :desiredDate}).lean()
      if(offlineDevoteeCounter){
        if(timeStamp == "prasad.balyaTiming"){
            numberOfDevotee = offlineDevoteeCounter.numberOfDevoteeBalyaTaken || 0
        }else if(timeStamp == "prasad.madhyanaTiming"){
            numberOfDevotee = offlineDevoteeCounter.numberOfDevoteeMadhyanaTaken || 0
        }else if(timeStamp == "prasad.ratraTiming"){
            numberOfDevotee = offlineDevoteeCounter.numberOfDevoteeRatraTaken || 0
        }else{
            numberOfDevotee = 0
        }
      }else{
        numberOfDevotee = 0
      }
      let couponNumber =0
      let coupononDate = await allmodel.prasadModel.find({couponDevotee:true,"couponPrasad.date": desiredDate}).lean()
      if(coupononDate.length > 0){
        coupononDate.forEach((coupon)=>{
            coupon.couponPrasad.forEach((prasadCoupon)=>{
                if(prasadCoupon.date === desiredDate){
                    if (timeStamp === "prasad.balyaTiming") {
                        couponNumber += prasadCoupon.balyaTiming.length || 0;
                    } else if (timeStamp === "prasad.madhyanaTiming") {
                        couponNumber += prasadCoupon.madhyanaTiming.length || 0;
                    } else if (timeStamp === "prasad.ratraTiming") {
                        couponNumber += prasadCoupon.ratraTiming.length || 0;
                    }else{
                        couponNumber = 0
                    }
                }
            })
    
        })
      }
                  let devoteeprasadTakenCount = countResult1.length
    
    let allDevotee = devoteeprasadTakenCount + numberOfDevotee + couponNumber
                  return {allDevotee,devoteeprasadTakenCount,numberOfDevotee,couponNumber};
}
       let allDevotee = await devotee.find().sort({name:1}).lean()
       let currentDevotee = await devotee.findById(req.user._id).lean()
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
                message: "ବିତରଣ କରାଯାଇଥିବା ପ୍ରବେଶ ପତ୍ର ସଂଖ୍ୟା",
                translate: "Delegate Delivered",
                status: "delivered",
                count: await devoteeList("delivered")
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
                count: (await countDevoteePrasadtaken(firstDate || moment.tz('Asia/Kolkata').format('YYYY-MM-DD'),"prasad.balyaTiming")).allDevotee,
                online: (await countDevoteePrasadtaken(firstDate || moment.tz('Asia/Kolkata').format('YYYY-MM-DD'),"prasad.balyaTiming")).devoteeprasadTakenCount,
                offline: (await countDevoteePrasadtaken(firstDate || moment.tz('Asia/Kolkata').format('YYYY-MM-DD'),"prasad.balyaTiming")).numberOfDevotee,
                coupon: (await countDevoteePrasadtaken(firstDate || moment.tz('Asia/Kolkata').format('YYYY-MM-DD'),"prasad.balyaTiming")).couponNumber,
            },       
            {
                title: secondDate || moment.tz('Asia/Kolkata').clone().subtract(1, 'day').format('YYYY-MM-DD'),
                message: "ବାଲ୍ୟ",
                translate: "breakfast",
                status: "lost",
                count: (await countDevoteePrasadtaken(secondDate || moment.tz('Asia/Kolkata').clone().subtract(1, 'day').format('YYYY-MM-DD'),"prasad.balyaTiming")).allDevotee,
                online: (await countDevoteePrasadtaken(secondDate || moment.tz('Asia/Kolkata').clone().subtract(1, 'day').format('YYYY-MM-DD'),"prasad.balyaTiming")).devoteeprasadTakenCount,
                offline: (await countDevoteePrasadtaken(secondDate || moment.tz('Asia/Kolkata').clone().subtract(1, 'day').format('YYYY-MM-DD'),"prasad.balyaTiming")).numberOfDevotee,
                coupon: (await countDevoteePrasadtaken(secondDate || moment.tz('Asia/Kolkata').clone().subtract(1, 'day').format('YYYY-MM-DD'),"prasad.balyaTiming")).couponNumber,
            },       
            {
                title: thirdDate || moment.tz('Asia/Kolkata').clone().subtract(2, 'day').format('YYYY-MM-DD'),
                message: "ବାଲ୍ୟ",
                translate: "breakfast",
                status: "lost",
                count: (await countDevoteePrasadtaken(thirdDate || moment.tz('Asia/Kolkata').clone().subtract(2, 'day').format('YYYY-MM-DD'),"prasad.balyaTiming")).allDevotee,
                online: (await countDevoteePrasadtaken(thirdDate || moment.tz('Asia/Kolkata').clone().subtract(2, 'day').format('YYYY-MM-DD'),"prasad.balyaTiming")).devoteeprasadTakenCount,
                offline: (await countDevoteePrasadtaken(thirdDate || moment.tz('Asia/Kolkata').clone().subtract(2, 'day').format('YYYY-MM-DD'),"prasad.balyaTiming")).numberOfDevotee,
                coupon: (await countDevoteePrasadtaken(thirdDate || moment.tz('Asia/Kolkata').clone().subtract(2, 'day').format('YYYY-MM-DD'),"prasad.balyaTiming")).couponNumber,
            },       
            {
                title: firstDate || moment.tz('Asia/Kolkata').format('YYYY-MM-DD'),
                message: "ମଧ୍ୟାହ୍ନ",
                translate: "Lunch",
                status: "lost",
                count: (await countDevoteePrasadtaken(firstDate || moment.tz('Asia/Kolkata').format('YYYY-MM-DD'),"prasad.madhyanaTiming")).allDevotee,
                online: (await countDevoteePrasadtaken(firstDate || moment.tz('Asia/Kolkata').format('YYYY-MM-DD'),"prasad.madhyanaTiming")).devoteeprasadTakenCount,
                offline: (await countDevoteePrasadtaken(firstDate || moment.tz('Asia/Kolkata').format('YYYY-MM-DD'),"prasad.madhyanaTiming")).numberOfDevotee,
                coupon: (await countDevoteePrasadtaken(firstDate || moment.tz('Asia/Kolkata').format('YYYY-MM-DD'),"prasad.madhyanaTiming")).couponNumber,
            },       
            {
                title: secondDate || moment.tz('Asia/Kolkata').clone().subtract(1, 'day').format('YYYY-MM-DD'),
                message: "ମଧ୍ୟାହ୍ନ",
                translate: "Lunch",
                status: "lost",
                count: (await countDevoteePrasadtaken(secondDate || moment.tz('Asia/Kolkata').clone().subtract(1, 'day').format('YYYY-MM-DD'),"prasad.madhyanaTiming")).allDevotee,
                online: (await countDevoteePrasadtaken(secondDate || moment.tz('Asia/Kolkata').clone().subtract(1, 'day').format('YYYY-MM-DD'),"prasad.madhyanaTiming")).devoteeprasadTakenCount,
                offline: (await countDevoteePrasadtaken(secondDate || moment.tz('Asia/Kolkata').clone().subtract(1, 'day').format('YYYY-MM-DD'),"prasad.madhyanaTiming")).numberOfDevotee,
                coupon: (await countDevoteePrasadtaken(secondDate || moment.tz('Asia/Kolkata').clone().subtract(1, 'day').format('YYYY-MM-DD'),"prasad.madhyanaTiming")).couponNumber
            },       
            {
                title: thirdDate || moment.tz('Asia/Kolkata').clone().subtract(2, 'day').format('YYYY-MM-DD'),
                message: "ମଧ୍ୟାହ୍ନ",
                translate: "Lunch",
                status: "lost",
                count: (await countDevoteePrasadtaken(thirdDate || moment.tz('Asia/Kolkata').clone().subtract(2, 'day').format('YYYY-MM-DD'),"prasad.madhyanaTiming")).allDevotee,
                online: (await countDevoteePrasadtaken(thirdDate || moment.tz('Asia/Kolkata').clone().subtract(2, 'day').format('YYYY-MM-DD'),"prasad.madhyanaTiming")).devoteeprasadTakenCount,
                offline: (await countDevoteePrasadtaken(thirdDate || moment.tz('Asia/Kolkata').clone().subtract(2, 'day').format('YYYY-MM-DD'),"prasad.madhyanaTiming")).numberOfDevotee,
                coupon: (await countDevoteePrasadtaken(thirdDate || moment.tz('Asia/Kolkata').clone().subtract(2, 'day').format('YYYY-MM-DD'),"prasad.madhyanaTiming")).couponNumber,
            },       
            {
                title: firstDate || moment.tz('Asia/Kolkata').format('YYYY-MM-DD'),
                message: "ରାତ୍ର",
                translate: "Dinner",
                status: "lost",
                count: (await countDevoteePrasadtaken(firstDate || moment.tz('Asia/Kolkata').format('YYYY-MM-DD'),"prasad.ratraTiming")).allDevotee,
                online: (await countDevoteePrasadtaken(firstDate || moment.tz('Asia/Kolkata').format('YYYY-MM-DD'),"prasad.ratraTiming")).devoteeprasadTakenCount,
                offline: (await countDevoteePrasadtaken(firstDate || moment.tz('Asia/Kolkata').format('YYYY-MM-DD'),"prasad.ratraTiming")).numberOfDevotee,
                coupon: (await countDevoteePrasadtaken(firstDate || moment.tz('Asia/Kolkata').format('YYYY-MM-DD'),"prasad.ratraTiming")).couponNumber,
            },       
            {
                title: secondDate || moment.tz('Asia/Kolkata').clone().subtract(1, 'day').format('YYYY-MM-DD'),
                message: "ରାତ୍ର",
                translate: "Dinner",
                status: "lost",
                count: (await countDevoteePrasadtaken(secondDate || moment.tz('Asia/Kolkata').clone().subtract(1, 'day').format('YYYY-MM-DD'),"prasad.ratraTiming")).allDevotee,
                online: (await countDevoteePrasadtaken(secondDate || moment.tz('Asia/Kolkata').clone().subtract(1, 'day').format('YYYY-MM-DD'),"prasad.ratraTiming")).devoteeprasadTakenCount,
                offline: (await countDevoteePrasadtaken(secondDate || moment.tz('Asia/Kolkata').clone().subtract(1, 'day').format('YYYY-MM-DD'),"prasad.ratraTiming")).numberOfDevotee,
                coupon: (await countDevoteePrasadtaken(secondDate || moment.tz('Asia/Kolkata').clone().subtract(1, 'day').format('YYYY-MM-DD'),"prasad.ratraTiming")).couponNumber,
            },       
            {
                title: thirdDate ||moment.tz('Asia/Kolkata').clone().subtract(2, 'day').format('YYYY-MM-DD'),
                message: "ରାତ୍ର",
                translate: "Dinner",
                status: "lost",
                count: (await countDevoteePrasadtaken(thirdDate || moment.tz('Asia/Kolkata').clone().subtract(2, 'day').format('YYYY-MM-DD'),"prasad.ratraTiming")).allDevotee,
                online: (await countDevoteePrasadtaken(thirdDate || moment.tz('Asia/Kolkata').clone().subtract(2, 'day').format('YYYY-MM-DD'),"prasad.ratraTiming")).devoteeprasadTakenCount,
                offline: (await countDevoteePrasadtaken(thirdDate || moment.tz('Asia/Kolkata').clone().subtract(2, 'day').format('YYYY-MM-DD'),"prasad.ratraTiming")).numberOfDevotee,
                coupon: (await countDevoteePrasadtaken(thirdDate || moment.tz('Asia/Kolkata').clone().subtract(2, 'day').format('YYYY-MM-DD'),"prasad.ratraTiming")).couponNumber,
            },   
            
        ]
        res.status(200).json(data)
    } catch (error) {
        console.log(error);
        res.status(400).json({"error":error.message});
    }
};

const prasadCount = async(req,res) =>{
  try {
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
        let numberOfDevotee;
        let offlineDevoteeCounter = await allmodel.prasadModel.findOne({outsideDevotee : true,date :req.query.date})
        if(offlineDevoteeCounter){
          if(desiredDate == "prasad.balyaTiming"){
              numberOfDevotee = offlineDevoteeCounter.numberOfDevoteeBalyaTaken || 0
          }else if(desiredDate == "prasad.madhyanaTiming"){
              numberOfDevotee = offlineDevoteeCounter.numberOfDevoteeMadhyanaTaken || 0
          }else if(desiredDate == "prasad.ratraTiming"){
              numberOfDevotee = offlineDevoteeCounter.numberOfDevoteeRatraTaken || 0
          }else{
              numberOfDevotee = 0
          }
        }else{
          numberOfDevotee = 0
        }
                  
                    let devoteeprasadTakenCount = countResult.length > 0 ? countResult[0].totalCount : 0;
      
      let allDevotee = devoteeprasadTakenCount + numberOfDevotee
                    return allDevotee;
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
  } catch (error) {
    console.log("error---",error) 
    res.status(500).json(error);

  }
      }


const prasadCountByselectdate = async(req,res)=>{
try {
    let data= []
    async function countDevoteePrasadtaken(desiredDate, timeStamp) {
        let pipeline =  [
            {
              $match: {
                "prasad.date": desiredDate,
              },
            },
            {
              $unwind: {
                path: "$prasad",
              },
            },
             {
              $match: {
                "prasad.date": desiredDate,
              },
            },
            {
              $match: {
                $and: [
                  {
                    [timeStamp]: {
                      $exists: true,
                    },
                  },
                  {
                    [timeStamp]: {
                      $ne: "",
                    },
                  },
                  {
                    [timeStamp]: {
                      $ne: null,
                    },
                  },
                ],
              },
            },
          ]
    const countResult = await allmodel.prasadModel.aggregate(pipeline);

   let numberOfDevotee;
  let offlineDevoteeCounter = await allmodel.prasadModel.findOne({outsideDevotee : true,date :desiredDate})
  if(offlineDevoteeCounter){
    if(timeStamp == "prasad.balyaTiming"){
        numberOfDevotee = offlineDevoteeCounter.numberOfDevoteeBalyaTaken || 0
    }else if(timeStamp == "prasad.madhyanaTiming"){
        numberOfDevotee = offlineDevoteeCounter.numberOfDevoteeMadhyanaTaken || 0
    }else if(timeStamp == "prasad.ratraTiming"){
        numberOfDevotee = offlineDevoteeCounter.numberOfDevoteeRatraTaken || 0
    }else{
        numberOfDevotee = 0
    }
  }else{
    numberOfDevotee = 0
  }
  let couponNumber =0
  let coupononDate = await allmodel.prasadModel.find({couponDevotee:true,"couponPrasad.date": desiredDate})
  if(coupononDate.length > 0){
    coupononDate.forEach((coupon)=>{
        coupon.couponPrasad.forEach((prasadCoupon)=>{
            if(prasadCoupon.date === desiredDate){
                if (timeStamp === "prasad.balyaTiming") {
                    couponNumber += prasadCoupon.balyaTiming.length || 0;
                } else if (timeStamp === "prasad.madhyanaTiming") {
                    couponNumber += prasadCoupon.madhyanaTiming.length || 0;
                } else if (timeStamp === "prasad.ratraTiming") {
                    couponNumber += prasadCoupon.ratraTiming.length || 0;
                }else{
                    couponNumber = 0
                }
            }
        })

    })
  }
              let devoteeprasadTakenCount = countResult.length;

let allDevotee = devoteeprasadTakenCount + numberOfDevotee + couponNumber
              return {allDevotee,devoteeprasadTakenCount,numberOfDevotee,couponNumber};
     
    }
   
         data =  [{
              title: req.query.date,
              message: "ବାଲ୍ୟ",
              translate: "breakfast",
              status: "lost",
              count:  ( await countDevoteePrasadtaken(req.query.date ,"prasad.balyaTiming")).allDevotee,
              online:  ( await countDevoteePrasadtaken(req.query.date ,"prasad.balyaTiming")).devoteeprasadTakenCount,
              offline:  ( await countDevoteePrasadtaken(req.query.date ,"prasad.balyaTiming")).numberOfDevotee,
              coupon:  ( await countDevoteePrasadtaken(req.query.date ,"prasad.balyaTiming")).couponNumber,
          },  
          {
              title: req.query.date,
              message: "ମଧ୍ୟାହ୍ନ",
              translate: "Lunch",
              status: "lost",
              count:  ( await countDevoteePrasadtaken(req.query.date ,"prasad.madhyanaTiming")).allDevotee,
              online:  ( await countDevoteePrasadtaken(req.query.date ,"prasad.madhyanaTiming")).devoteeprasadTakenCount,
              offline:  ( await countDevoteePrasadtaken(req.query.date ,"prasad.madhyanaTiming")).numberOfDevotee,
              coupon:  ( await countDevoteePrasadtaken(req.query.date ,"prasad.madhyanaTiming")).couponNumber,
          },       
          {
              title: req.query.date,
              message: "ରାତ୍ର",
              translate: "Dinner",
              status: "lost",
              count:  ( await countDevoteePrasadtaken(req.query.date ,"prasad.ratraTiming")).allDevotee,
              online:  ( await countDevoteePrasadtaken(req.query.date ,"prasad.ratraTiming")).devoteeprasadTakenCount,
              offline:  ( await countDevoteePrasadtaken(req.query.date ,"prasad.ratraTiming")).numberOfDevotee,
              coupon:  ( await countDevoteePrasadtaken(req.query.date ,"prasad.ratraTiming")).couponNumber,
          }, ]
          res.status(200).json(data);
} catch (error) {
    console.log("error --",error)
    res.status(500).json({error});
}
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
let pipeline =  [
    {
      $match: {
        "prasad.date": desiredDate,
      },
    },
    {
      $unwind: {
        path: "$prasad",
      },
    },
     {
      $match: {
        "prasad.date": desiredDate,
      },
    },
    {
      $match: {
        $and: [
          {
            [timeStamp]: {
              $exists: true,
            },
          },
          {
            [timeStamp]: {
              $ne: "",
            },
          },
          {
            [timeStamp]: {
              $ne: null,
            },
          },
        ],
      },
    },
  ]
  let numberOfDevotee;
  let offlineDevoteeCounter = await allmodel.prasadModel.findOne({outsideDevotee : true,date :desiredDate})
  if(offlineDevoteeCounter){
    if(timeStamp == "prasad.balyaTiming"){
        numberOfDevotee = offlineDevoteeCounter.numberOfDevoteeBalyaTaken || 0
    }else if(timeStamp == "prasad.madhyanaTiming"){
        numberOfDevotee = offlineDevoteeCounter.numberOfDevoteeMadhyanaTaken || 0
    }else if(timeStamp == "prasad.ratraTiming"){
        numberOfDevotee = offlineDevoteeCounter.numberOfDevoteeRatraTaken || 0
    }else{
        numberOfDevotee = 0
    }
  }else{
    numberOfDevotee = 0
  }
  let couponNumber =0
  let coupononDate = await allmodel.prasadModel.find({couponDevotee:true,"couponPrasad.date": desiredDate})
  if(coupononDate.length > 0){
    coupononDate.forEach((coupon)=>{
        coupon.couponPrasad.forEach((prasadCoupon)=>{
            if(prasadCoupon.date === desiredDate){
                if (timeStamp === "prasad.balyaTiming") {
                    couponNumber += prasadCoupon.balyaTiming.length || 0;
                } else if (timeStamp === "prasad.madhyanaTiming") {
                    couponNumber += prasadCoupon.madhyanaTiming.length || 0;
                } else if (timeStamp === "prasad.ratraTiming") {
                    couponNumber += prasadCoupon.ratraTiming.length || 0;
                }else{
                    couponNumber = 0
                }
            }
        })

    })
  }
            const countResult = await allmodel.prasadModel.aggregate(pipeline);
              let devoteeprasadTakenCount = countResult.length

let allDevotee = devoteeprasadTakenCount + numberOfDevotee + couponNumber
              return {allDevotee,devoteeprasadTakenCount,numberOfDevotee,couponNumber};
        }

        let data;
        if(isBalyaTime){
            data = {
              date: req.query.date,
              timing: "ବାଲ୍ୟ",
              translate: "breakfast",
              count:   (await countDevoteePrasadtaken(req.query.date ,"prasad.balyaTiming")).allDevotee,
              online:   (await countDevoteePrasadtaken(req.query.date ,"prasad.balyaTiming")).devoteeprasadTakenCount,
              offline:   (await countDevoteePrasadtaken(req.query.date ,"prasad.balyaTiming")).numberOfDevotee,
              coupon:   (await countDevoteePrasadtaken(req.query.date ,"prasad.balyaTiming")).couponNumber,
            }
           
          
        }else if(isMadhyannaTime){
            data =   {
                date: req.query.date,
                timing: "ମଧ୍ୟାହ୍ନ",
                translate: "Lunch",
                count:   (await countDevoteePrasadtaken(req.query.date ,"prasad.madhyanaTiming")).allDevotee,
                online:   (await countDevoteePrasadtaken(req.query.date ,"prasad.madhyanaTiming")).devoteeprasadTakenCount,
                offline:   (await countDevoteePrasadtaken(req.query.date ,"prasad.madhyanaTiming")).numberOfDevotee,
                coupon:   (await countDevoteePrasadtaken(req.query.date ,"prasad.madhyanaTiming")).couponNumber,
            }
        }else if(isRatraTime){
            data = {
                 date: req.query.date,
                 timing: "ରାତ୍ର",
                 translate: "Dinner",
                 count:   (await countDevoteePrasadtaken(req.query.date ,"prasad.ratraTiming")).allDevotee,
                 online:   (await countDevoteePrasadtaken(req.query.date ,"prasad.ratraTiming")).devoteeprasadTakenCount,
                 offline:   (await countDevoteePrasadtaken(req.query.date ,"prasad.ratraTiming")).numberOfDevotee,
                 coupon:   (await countDevoteePrasadtaken(req.query.date ,"prasad.ratraTiming")).couponNumber,
          }
        }else{
            data = {
                date: req.query.date,
                timing: null,
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

  async function offlinePrasadNonDevoteeCounter(req,res) {
   try {
    let data = req.body
    let allTimings = await allmodel.settings.findOne();
    let balyaStartTime = allTimings.balyaStartTime
    let balyaEndTime = allTimings.balyaEndTime
    let madhyanaStartTime = allTimings.madhyanaStartTime
    let madhyanaEndTime = allTimings.madhyanaEndTime
    let ratraStartTime = allTimings.ratraStartTime
    let ratraEndTime = allTimings.ratraEndTime

const isBalyaTime = await compareThreeTime(data.time, balyaStartTime, balyaEndTime);
const isMadhyannaTime = await compareThreeTime(data.time, madhyanaStartTime, madhyanaEndTime);
const isRatraTime = await compareThreeTime(data.time, ratraStartTime, ratraEndTime);
let addData = {} ;
let updatedPrasad
let offlineprasadDetailsfordate = await allmodel.prasadModel.findOne({"outsideDevotee": true,"date":data.date})
if(offlineprasadDetailsfordate){
    if (isBalyaTime) {
        addData.numberOfDevoteeBalyaTaken = (offlineprasadDetailsfordate.numberOfDevoteeBalyaTaken || 0) + data.numberOfDevotee;
    } else if (isMadhyannaTime) {
        addData.numberOfDevoteeMadhyanaTaken = (offlineprasadDetailsfordate.numberOfDevoteeMadhyanaTaken || 0) + data.numberOfDevotee;
    } else if (isRatraTime) {
        addData.numberOfDevoteeRatraTaken = (offlineprasadDetailsfordate.numberOfDevoteeRatraTaken || 0) + data.numberOfDevotee;
    } else {
        return res.status(200).json({ status: "Failure", error: { errorCode: 1001, message: messages.INVALID_TIME }, prasad: null });
    }
    updatedPrasad = await allmodel.prasadModel.findOneAndUpdate({"outsideDevotee": true,"date":data.date},{$set:addData});
}else{
    if(isBalyaTime){
        addData.outsideDevotee = true
        addData.date = data.date
        addData.numberOfDevoteeBalyaTaken = data.numberOfDevotee
        }else if (isMadhyannaTime){
            addData.outsideDevotee = true
            addData.date = data.date
            addData.numberOfDevoteeMadhyanaTaken = data.numberOfDevotee
        }else if(isRatraTime){
            addData.outsideDevotee = true
            addData.date = data.date
            addData.numberOfDevoteeRatraTaken = data.numberOfDevotee
        }else{
            return res.status(200).json({ status: "Failure",error: {errorCode :1001,message: messages.INVALID_TIME}, prasad : null})
        }
        // addData.devoteeId = uuid.v4()
        updatedPrasad = await allmodel.prasadModel.create(addData);
}
return res.status(200).json({ status: "Success",error: null, prasad : updatedPrasad})
   } catch (error) {
    console.log("error in offline addcounter ---- ",error)
    res.status(500).json({error: error})
   }
  }

  async function createEditCoupon(req,res) {
   try {
    let data = req.body
    data.couponDevotee = true;
    let existingCoupon = await allmodel.prasadModel.findOne({couponCode:data.couponCode})

    let createCoupon = await allmodel.prasadModel.findOneAndUpdate({couponCode:data.couponCode},data,{upsert:true,new: true})
    return res.status(200).json(createCoupon)
    
   } catch (error) {
    console.log("error : ",error)
    return res.status(500).json(error)
   }
  }
  async function viewCoupon(req,res) {
   try {
   
    let existingCoupon = await allmodel.prasadModel.findOne({couponCode:req.params.code})
    if(existingCoupon){
        return res.status(200).json({existingCoupon})
    }else{
        return res.status(200).json({existingCoupon: null})
    }
   } catch (error) {
    console.log("error : ",error)
    return res.status(500).json(error)
   }
  }
  async function viewAllCoupon(req,res) {
    try {

        let allCoupons = await allmodel.prasadModel.find({couponDevotee: true })
        let allCouponAmount = await allmodel.prasadModel.aggregate([
            {
              "$match": {
                "couponDevotee": true,
              }
            },
            {
              "$unwind": {
                "path": "$couponPrasad"
              }
            },
            {
              "$group": {
                "_id": couponCode,
                "totalBalya": {
                  "$sum": "$couponPrasad.balyaCount"
                },
                "totalMadhyanna": {
                  "$sum": "$couponPrasad.madhyanaCount"
                },
                "totalRatra": {
                  "$sum": "$couponPrasad.ratraCount"
                },
                "totalBalyaTiming": {
                  "$sum": {
                    "$size": "$couponPrasad.balyaTiming"
                  }
                },
                "totalMadhayannaTiming": {
                  "$sum": {
                    "$size": "$couponPrasad.madhyanaTiming"
                  }
                },
                "totalRatraTiming": {
                  "$sum": {
                    "$size": "$couponPrasad.ratraTiming"
                  }
                }
              }
            },
            {
              "$addFields": {
                "sumOfBalyaAndTiming": {
                  "$add": ["$totalBalya", "$totalBalyaTiming"]
                }
              }
            },
            {
              "$addFields": {
                "sumOfMadhayannaAndTiming": {
                  "$add": ["$totalMadhyanna", "$totalMadhayannaTiming"]
                }
              }
            },
            {
              "$addFields": {
                "sumOfRatraAndTiming": {
                  "$add": ["$totalRatra", "$totalRatraTiming"]
                }
              }
            },
            {
              "$addFields": {
                "balyaAmount": {
                  $multiply: ["$sumOfBalyaAndTiming", 50]
                }
              }
            },
            {
              "$addFields": {
                "MadhyanaAmount": {
                  $multiply: ["$sumOfMadhayannaAndTiming", 100]
                }
              }
            },
            {
              "$addFields": {
                "ratraAmount": {
                  $multiply: ["$sumOfRatraAndTiming", 100]
                }
              }
            },
            {
              "$addFields": {
                "totalCouponAmount": {
                  $add: ["$balyaAmount", "$MadhyanaAmount","$ratraAmount"]
                }
              }
            },
            {
                $project:{
                    
                }
            }
          ]
          )
        let allCouponList = []
        allCoupons.forEach((coupon)=>{
            if(coupon.createdAt){
                coupon.couponCreatedDate = coupon.createdAt.toISOString().substring(0, 10);
            }else {
                coupon.couponCreatedDate = ""
            }
              coupon.couponPrasad.forEach((couponPrasad)=>{
                coupon.amount = (((couponPrasad.balyaCount ?? 0) * 50) + (couponPrasad.balyaTiming.length * 50))  + (((couponPrasad.madhyanaCount ?? 0) * 100) + (couponPrasad.madhyanaTiming.length * 100)) + (((couponPrasad.ratraCount ?? 0) * 100) + (couponPrasad.ratraTiming.length * 100))
            })
            coupon.totalCouponAmount = allCouponAmount[0]
            allCouponList.push(coupon)
        })
        return  res.status(200).send(allCouponList);
    } catch (error) {
        console.log("error - ",error)
        return res.status(500).json(error)
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
    prasdCountNow,
    offlinePrasad,
    offlinePrasadNonDevoteeCounter,
    createEditCoupon,
    viewCoupon,
    viewAllCoupon
}