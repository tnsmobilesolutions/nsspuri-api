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

async function getTotalAmountCollected (req,res) {
    let totalAmount = await allModel.devoteemodel.aggregate([
        {
          $match: {
            $and: [
              {
                paidAmount: {
                  $exists: true,
                },
              },
              {
                status: {
                  $in: ["paid", "printed", "delivered"],
                },
              },
            ],
          },
        },
        {
          $group: {
            _id: null,
            totalAmount: {
              $sum: "$paidAmount",
            },
          },
        },
      ])
      res.status(200).json({totalAmount})
}
 
async function totalCouponAmount(req,res) {
    let data = await allModel.prasadModel.aggregate([
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
            "_id": null,
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
      ]
      )
      res.status(200).json({data})
}
module.exports ={
    updateDOB,
    getTotalAmountCollected,
    totalCouponAmount,
    
}