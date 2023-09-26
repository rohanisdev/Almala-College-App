var CONSTANTS = require('../utils/constants');
const logger = require('../utils/logger.js');
var server = require("../server");
var ObjectId = require('mongodb').ObjectId;
const successMessages = require('../utils/successMessages.json');
const errorMessages = require('../utils/errorMessages.json');
const CLASS_NAME = "vehicle :: ";


//Saving the vehicle info
var createVehicle = async function(req, res) {
    const SERVICE_NAME = "createVehicle() :: "
    const db = server.db
    const reqObj = req.body
    logger.info(CLASS_NAME + SERVICE_NAME + "Entering into createVehicle")
  
    try{
      //Perform validation on input request
      if (reqObj.userId == undefined || reqObj.totalSeats == "") {
        return res.send({
              status: "error",
              statusCode: "USERER005",
              message: errorMessages.USERER005
            })
      }else if(reqObj.totalSeats == undefined || reqObj.totalSeats == "") {
        return res.send({
              status: "error",
              statusCode: "VEHCLE001",
              message: errorMessages.VEHCLE001
            })
      }if(reqObj.vehicleNo == undefined || reqObj.vehicleNo == "") {
        return res.send({
              status: "error",
              statusCode: "VEHCLE002",
              message: errorMessages.VEHCLE002
            })
      }
  
      //Saving data
      var newVehicleDocument = await db.collection("vehicles").insertOne({
        totalSeats: reqObj.totalSeats,
        vehicleNo: reqObj.vehicleNo,
        createdBy: reqObj.userId,
        createdOn: new Date(),
        status: "active"
      });
      console.log("newVehicleDocument="+newVehicleDocument.insertedId)
      return res.send({
          status: "success",
          statusCode: "VEHCLS001",
          message: successMessages.VEHCLS001,
          response: {
                vehicleId: newVehicleDocument.insertedId
            }
        })
    }catch(error){
      console.error(error)
      throw res.send({
          status: "error",
          statusCode: "VEHCLE003",
          message: errorMessages.VEHCLE003
      })
    }
}

//Fetch all vehicles
var fetchVehicles = async function(req, res) {
    const SERVICE_NAME = "fetchVehicles() :: "
    const db = server.db
    logger.info(CLASS_NAME + SERVICE_NAME + "Entering into fetchVehicles")
    
    try{
      var vehicleArr = await db.collection("vehicles").find({},
      { projection: { modifiedBy:0, modifiedOn:0, createdBy:0, createdOn:0 } }).toArray()
      if (vehicleArr == null) {
            return res.send({
            status: "error",
            statusCode: "VEHCLE004",
            message: errorMessages.VEHCLE004
        })
      }
      return res.send({
          status: "success",
          statusCode: "VEHCLS002",
          message: successMessages.VEHCLS002,
          response: vehicleArr
        })
    }catch(error){
      console.error(error)
      throw res.send({
          status: "error",
          statusCode: "VEHCLE005",
          message: errorMessages.VEHCLE005
      })
    }
}

exports.createVehicle = createVehicle
exports.fetchVehicles = fetchVehicles
  

