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
        // createdData =  await allmodel.eventModel.find({eventId:req.params.eventId,eventAttendance:true}).sort({createdAt:-1});
        createdData =  await allmodel.eventModel.aggregate([{
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
           }
          ])
        res.json(createdData)
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

