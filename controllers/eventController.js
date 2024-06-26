const devotee = require("../model/devotee");
const allmodel = require("../model/allmodel");
const dotenv = require("dotenv").config();
const messages = require("./messages/message");
const uuid = require("uuid")

async function createEvent(req,res) {
    try {
        let data = req.body
        let createData
        let existingEvent = await allmodel.eventModel.findOne({eventId: data.eventId,devoteeCode:data.devoteeCode}); 

        if(!existingEvent){
            createData =  await allmodel.eventModel.create(data);
        }else{
createData = await allmodel.eventModel.findOneAndUpdate({eventId: data.eventId,devoteeCode:data.devoteeCode},{$set:data})
        }
        res.json(createData)
    } catch (error) {
        console.log('createEventError',error)
        res.json('createEventError',error)
    }
}

async function getSingleEvent(req,res) {
    try {
        const devoteeCode = parseInt(req.query.devoteeCode);
   createdData =  await allmodel.eventModel.findOne({eventAntendeeId:req.params.eventAntendeeId});
   res.json(createdData)
    } catch (error) {
        console.log('createEventError',error)
        res.json('createEventError',error)
    }
}

async function getAllEvent(req,res) {
    try {
        const currentPage = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5000;
        const numberofskipdata = (currentPage - 1) * limit;
        let count
        let pipeline = []
        pipeline.push({
            $match: {
              $and:[
                {eventId:req.params.eventId},
                {eventAttendance:true}
              ]
            },},
            {  $lookup: {
              from: 'devotees',
              localField: 'devoteeCode',
              foreignField: 'devoteeCode',
              as: 'devotee'
            }
          },
           {
             $unwind: '$devotee'
           },
           )
        if(req.query.search && req.query.searchBy && req.query.search != '' && req.query.searchBy != ''){
            if(req.query.searchBy == "name"){
pipeline.push({
    $match: {
        'devotee.name': {"$regex": `${req.query.search}`, '$options': 'i' }
    },},)
        }else if(req.query.searchBy == "sangha"){
            pipeline.push({
                $match: {
                    'devotee.sangha': {"$regex": `${req.query.search}`, '$options': 'i' }
                },},)
   
        }else if(req.query.searchBy == "bloodGroup"){
            pipeline.push({
                $match: {
                    'devotee.bloodGroup': {"$regex": `${req.query.search}`, '$options': 'i' }
                },},)
   
        }else if(req.query.searchBy == "mobileNumber"){

            pipeline.push({
                $match: {
                    'devotee.mobileNumber': {"$regex": `${req.query.search}`, '$options': 'i' }
                },},)
        }else if(req.query.searchBy == "emailId"){

            pipeline.push({
                $match: {
                    'devotee.emailId': {"$regex": `${req.query.search}`, '$options': 'i' }
                },},)
        }else if(req.query.searchBy == "status"){
            pipeline.push({
                $match: {
                    'devotee.status': {"$regex": `${req.query.search}`, '$options': 'i' }
                },},)
        }
       
        }
            pipeline.push({
                $sort: {'createdAt':-1}
              })
           
              createdData =  await allmodel.eventModel.aggregate(pipeline)
              count =createdData.length
              const totalPages = Math.ceil(count / limit);
              pipeline.push({
                $skip: numberofskipdata
              }, {
                $limit: limit
              });
              data =  await allmodel.eventModel.aggregate(pipeline)

              res.json({data,count,totalPages,currentPage})
         } catch (error) {
             console.log('createEventError',error)
             res.json('createEventError',error)
         }
}

async function updateEvent(req,res) {
    try {
        let data = req.body
        const devoteeCode = parseInt(req.query.devoteeCode);
        createdData =  await allmodel.eventModel.findOneandUpdate({eventAntendeeId:req.params.eventAntendeeId},{$set:data})
        res.json(createdData)
         } catch (error) {
             console.log('createEventError',error)
             res.json('createEventError',error)
         }
}

async function deleteSingleEvent(req,res) {
    try {
        const devoteeCode = parseInt(req.query.devoteeCode);
    createdData =  await allmodel.eventModel.delete({eventAntendeeId:req.params.eventAntendeeIde})
    res.json(createdData)
     } catch (error) {
         console.log('createEventError',error)
         res.json('createEventError',error)
     }
    
}
module.exports = {
    createEvent,
    getSingleEvent,
    getAllEvent,
    updateEvent,
    deleteSingleEvent
}

