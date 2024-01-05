const devotee = require("../model/devotee");
const jwt = require("jsonwebtoken");
const moment = require('moment-timezone');
const allmodel = require("../model/allmodel");
const e = require("express");
const { model } = require("mongoose");
const dotenv = require("dotenv").config();
const messages = require("./messages/message")



// Create Devotee
const devotee_create = async (req, res) => {
    try {
        let data = req.body;
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

const getPrasadUpdate =  async() => {
    const currentDate = moment.tz("Asia/Kolkata").format("YYYY-MM-DD");
    const currentTime = moment.tz("Asia/Kolkata").format("HH:mm");



}
//update prasad by qr code
const prasdUpdateDevotee = async (req, res) => {
    let data = req.body;
    const currentDate = data.date;
    const currentTime = data.time;

    try {
        const devoteeDetails = await allmodel.devoteemodel.findOne({ devoteeCode: parseInt(req.params.code, 10) });
        if (!devoteeDetails) throw messages.NO_DEVOTEEFOUND;

        if(devoteeDetails.status == "blacklisted" || devoteeDetails.status == "lost" || devoteeDetails.status == "rejected") throw messages.BLACKLISTED_DEVOTEE_SCAN;

        const prasadDetails = await allmodel.prasadModel.findOne({ devoteeCode: parseInt(req.params.code, 10) });
        
        if (prasadDetails && prasadDetails!= null) {
            const existingPrasad = prasadDetails.prasad.find(prasad => prasad.date === currentDate);

            if (existingPrasad && existingPrasad.balyaTiming && existingPrasad.MadhyannaTiming && existingPrasad.ratriTiming) {
                // If all timings are updated, show an error that prasad is already taken for today
                return res.status(400).json({ error: messages.PRASAD_TAKEN, devoteeData : devoteeDetails});
            }else {
                // Check if the current time falls within any meal timings
                const isBalyaTime = await compareThreeTime(currentTime, process.env.balyaStartTime, process.env.balyaEndTime);
                const isMadhyannaTime = await compareThreeTime(currentTime, process.env.madhyanaStartTime, process.env.madhyanaEndTime);
                const isRatraTime = await compareThreeTime(currentTime, process.env.ratraStartTime, process.env.ratraEndTime);
              
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
                        return res.status(400).json({ error: messages.PRASAD_TAKEN ,devoteeData : devoteeDetails});
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
                return res.status(200).json({ error: messages.SCAN_SUCCESSFULLY,devoteeData : devoteeDetails });
                
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
           
                return res.status(200).json({ error: messages.SCAN_SUCCESSFULLY,devoteeData : devoteeDetails });
            } else {
                return res.status(400).json({ error: messages.INVALID_TIME,devoteeData : devoteeDetails });
            }
        }
    } catch (error) {
        console.log("Error: ", error);
        return res.status(400).json({ error: error });
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
        let allDevotee = []
        if (req.query.sangha) {
            allDevotee = await devotee.find({sangha:{ "$regex": `${req.query.sangha}`, '$options': 'i' }}).sort({name:1})
        } else {
        allDevotee = await devotee.find().sort({name:1})
        }
        for (let i = 0; i < allDevotee.length; i++) {
            const createdByDevotee = await devotee.findOne({ devoteeId: allDevotee[i].createdById });
            if (createdByDevotee) {
                allDevotee[i].createdById = createdByDevotee.name;
                // delete allDevotee[i].createdById; // Remove the createdById field
            }
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
        for (let i = 0; i < searchDevotee.length; i++) {
            const createdByDevotee = await devotee.findOne({ devoteeId: searchDevotee[i].createdById });
            if (createdByDevotee) {
                searchDevotee[i].createdById = createdByDevotee.name;
                // delete allDevotee[i].createdById; // Remove the createdById field
            }
        }
       
        res.status(200).json({searchDevotee})
    } catch (error) {
        console.log(error);
        res.status(400).json({"error":error.message});
    }
};
// advance search Devotee with Relatives
const advanceSearchDevotee = async (req, res) => {
    let searchDevotee;
    try {
if(req.query.sangha){
    searchDevotee = await devotee.find({sangha: {"$regex": `${req.query.sangha}`, '$options': 'i' }});
}else if(req.query.status){
    searchDevotee = await devotee.find({status: {"$regex": `${req.query.status}`, '$options': 'i' }})
}else if(req.query.bloodGroup){
    searchDevotee = await devotee.find({bloodGroup: req.query.bloodGroup})
}else if(req.query.gender){
    searchDevotee = await devotee.find({gender: req.query.gender })
}else if(req.query.mobileNumber){
    searchDevotee = await devotee.find({mobileNumber: {"$regex": `${req.query.mobileNumber}`, '$options': 'i' }})
}else if(req.query.emailId){
    searchDevotee = await devotee.find({emailId: {"$regex": `${req.query.emailId}`, '$options': 'i' }})
}else if(req.query.name){
    searchDevotee = await devotee.find({name: {"$regex": `${req.query.name}`, '$options': 'i' }})
}



    //   let advanceSearch = await devotee.find({})
    //     for (let i = 0; i < searchDevotee.length; i++) {
    //         const createdByDevotee = await devotee.findOne({ devoteeId: searchDevotee[i].createdById });
    //         if (createdByDevotee) {
    //             searchDevotee[i].createdById = createdByDevotee.name;
    //             // delete allDevotee[i].createdById; // Remove the createdById field
    //         }
    //     }
       
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
async function countDevoteePrasadtaken(desiredDate, timingKey) {
    const countResult = await allmodel.prasadModel.aggregate([
        { $unwind: '$prasad' },
        {
          $match: {
            'prasad.date': desiredDate,
            timingKey: { $ne: '' }
          }
        },
        // {
        //   $group: {
        //     _id: '$devoteeCode',
        //     count: { $sum: 1 }
        //   }
        // },
        // { $group: { _id: null, total: { $sum: 1 } } }

      ]);
      console.log("countResult------",countResult)
      let devoteeprasadTakenCount = countResult.length;
      return devoteeprasadTakenCount;
}
       let allDevotee = await devotee.find().sort({name:1})

        let data = [
            {
                title: "",
                message: "ପଞ୍ଜିକୃତ ଭକ୍ତଙ୍କ ସଂଖ୍ୟା",
                translate: "All devotee",
                status: "allDevotee",
                count: allDevotee.length,
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
                message: "ରଦ୍ଦ ହୋଇଥିବା ପ୍ରବେଶ ପତ୍ର",
                translate: "Blacklisted devotee",
                status: "blacklisted",
                count: await devoteeList("rejected"),
            },
            {
                title: "",
                message: "ପ୍ରବେଶ ପତ୍ର ଛପା ସଂଖ୍ୟା",
                translate: "Printed devotee",
                status: "printed",
                count: await devoteeList("printed")
            },
            {
                title: "",
                message: "ହଜିଯାଇଥିବା ପ୍ରବେଶ ପତ୍ର",
                translate: "Lost delegate card",
                status: "lost",
                count: await devoteeList("lost")
            },
            {
                title: moment.tz('Asia/Kolkata').format('YYYY-MM-DD'),
                message: "ବାଲ୍ୟ",
                translate: "breakfast",
                status: "lost",
                count: await countDevoteePrasadtaken(moment.tz('Asia/Kolkata').format('YYYY-MM-DD'),"prasad.balyaTiming")
            },       
            {
                title: moment.tz('Asia/Kolkata').clone().subtract(1, 'day').format('YYYY-MM-DD'),
                message: "ବାଲ୍ୟ",
                translate: "breakfast",
                status: "lost",
                count: await countDevoteePrasadtaken(moment.tz('Asia/Kolkata').clone().subtract(1, 'day').format('YYYY-MM-DD'),"prasad.balyaTiming")
            },       
            {
                title: moment.tz('Asia/Kolkata').clone().subtract(2, 'day').format('YYYY-MM-DD'),
                message: "ବାଲ୍ୟ",
                translate: "breakfast",
                status: "lost",
                count: await countDevoteePrasadtaken(moment.tz('Asia/Kolkata').clone().subtract(2, 'day').format('YYYY-MM-DD'),"prasad.balyaTiming")
            },       
            {
                title: moment.tz('Asia/Kolkata').format('YYYY-MM-DD'),
                message: "ମଧ୍ୟାହ୍ନ",
                translate: "Lunch",
                status: "lost",
                count: await countDevoteePrasadtaken(moment.tz('Asia/Kolkata').format('YYYY-MM-DD'),"prasad.madhyanaTiming")
            },       
            {
                title: moment.tz('Asia/Kolkata').clone().subtract(1, 'day').format('YYYY-MM-DD'),
                message: "ମଧ୍ୟାହ୍ନ",
                translate: "Lunch",
                status: "lost",
                count: await countDevoteePrasadtaken(moment.tz('Asia/Kolkata').clone().subtract(1, 'day').format('YYYY-MM-DD'),"prasad.madhyanaTiming")
            },       
            {
                title: moment.tz('Asia/Kolkata').clone().subtract(2, 'day').format('YYYY-MM-DD'),
                message: "ମଧ୍ୟାହ୍ନ",
                translate: "Lunch",
                status: "lost",
                count: await countDevoteePrasadtaken(moment.tz('Asia/Kolkata').clone().subtract(2, 'day').format('YYYY-MM-DD'),"prasad.madhyanaTiming")
            },       
            {
                title: moment.tz('Asia/Kolkata').format('YYYY-MM-DD'),
                message: "ରାତ୍ର",
                translate: "Dinner",
                status: "lost",
                count: await countDevoteePrasadtaken(moment.tz('Asia/Kolkata').format('YYYY-MM-DD'),"prasad.ratraTiming")
            },       
            {
                title: moment.tz('Asia/Kolkata').clone().subtract(1, 'day').format('YYYY-MM-DD'),
                message: "ରାତ୍ର",
                translate: "Dinner",
                status: "lost",
                count: await countDevoteePrasadtaken(moment.tz('Asia/Kolkata').clone().subtract(1, 'day').format('YYYY-MM-DD'),"prasad.ratraTiming")
            },       
            {
                title: moment.tz('Asia/Kolkata').clone().subtract(2, 'day').format('YYYY-MM-DD'),
                message: "ରାତ୍ର",
                translate: "Dinner",
                status: "lost",
                count: await countDevoteePrasadtaken(moment.tz('Asia/Kolkata').clone().subtract(2, 'day').format('YYYY-MM-DD'),"prasad.ratraTiming")
            },       
            
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
    advanceSearchDevotee,
    createRelativeDevotee,
    admin_devoteeDashboard,
    prasdUpdateDevotee
}

//