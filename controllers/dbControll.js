const allModel = require("../model/allmodel")
const moment = require("moment")

async function updateDOB(req,res) {
    function isValidDobFormat(dob) {
        return moment(dob, 'YYYY-MM-DD', true).isValid();
      }
    let alldevotee = await allModel.devoteemodel.find({})
    let filteredDevotees = alldevotee.filter((devotee) => {
        return devotee.dob !== "" && isValidDobFormat(devotee.dob);
    });
    console.log("filteredDevotees---",filteredDevotees.length)
    // filteredDevotees.forEach((devotee) => {
    //     devotee.dob = moment(devotee.dob, 'D/MMM/YYYY').format('YYYY-MM-DD');
    //     // devotee.save();
    // });
  
console.log('filteredDevotees=====',filteredDevotees)
console.log('filteredDevotees=====',filteredDevotees.length)
res.status(200).json(filteredDevotees.length)
    
}
module.exports ={
    updateDOB
}