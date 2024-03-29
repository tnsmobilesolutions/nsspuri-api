const devotee = require("../model/devotee");
const allmodel = require("../model/allmodel");
const dotenv = require("dotenv").config();
const messages = require("./messages/message");
const uuid = require("uuid")

async function createEvent(req,res) {
    try {
        let data = req.body
   createdData =  await allmodel.eventModel.create(data);
   res.json(createdData)
    } catch (error) {
        console.log('createEventError',error)
        res.json('createEventError',error)
    }
}

async function getSingleEvent(req,res) {
    try {
        const devoteeCode = parseInt(req.query.devoteeCode);
   createdData =  await allmodel.eventModel.findOne({eventId:req.params.eventId,devoteeCode:devoteeCode});
   res.json(createdData)
    } catch (error) {
        console.log('createEventError',error)
        res.json('createEventError',error)
    }
}

async function getAllEvent(req,res) {
    try {
        createdData =  await allmodel.eventModel.find({eventId:req.params.eventId}).sort({createdAt:-1});
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
        createdData =  await allmodel.eventModel.findOneandUpdate({eventId:req.params.eventId,devoteeCode:devoteeCode},{$set:data})
        res.json(createdData)
         } catch (error) {
             console.log('createEventError',error)
             res.json('createEventError',error)
         }
}

async function deleteSingleEvent(req,res) {
    try {
        const devoteeCode = parseInt(req.query.devoteeCode);
    createdData =  await allmodel.eventModel.delete({eventId:req.params.eventId,devoteeCode:devoteeCode})
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

