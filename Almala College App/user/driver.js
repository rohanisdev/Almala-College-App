var CONSTANTS = require('../utils/constants');
const logger = require('../utils/logger.js');
var server = require("../server");
var ObjectId = require('mongodb').ObjectId;
const successMessages = require('../utils/successMessages.json');
const errorMessages = require('../utils/errorMessages.json');
const CLASS_NAME = "driver :: ";

//save driver
var createDriver = async function(req, res) {
    const SERVICE_NAME = "createDriver() :: "
    const db = server.db
    const reqObj = req.body
    logger.info(CLASS_NAME + SERVICE_NAME + "Entering into createDriver")
  
    try{
      //Perform validation on input request
      if (reqObj.firstName == undefined || reqObj.firstName == "") {
        return res.send({
              status: "error",
              statusCode: "USERER001",
              message: errorMessages.USERER001
            })
      }else if(reqObj.lastName == undefined || reqObj.lastName == "") {
        return res.send({
              status: "error",
              statusCode: "USERER002",
              message: errorMessages.USERER002
            })
      }else if(reqObj.phone == undefined || reqObj.phone == "") {
        return res.send({
              status: "error",
              statusCode: "USERER003",
              message: errorMessages.USERER003
            })
      }else if(reqObj.currentSalary == undefined || reqObj.currentSalary == "") {
        return res.send({
              status: "error",
              statusCode: "USERER004",
              message: errorMessages.USERER004
            })
      }else if(reqObj.userId == undefined || reqObj.userId == "") {
        return res.send({
              status: "error",
              statusCode: "USERER005",
              message: errorMessages.USERER005
            })
      }
  
      var isUserPresent = await db.collection("users").findOne({ phone: reqObj.phone });
      if (isUserPresent !== null) {
          return res.send({
            status: "error",
            statusCode: "USERER006",
            message: errorMessages.USERER006
          })
      }
      
      const salaryHistory = [{
        amount: reqObj.currentSalary,
        modifiedOn: new Date()
      }]
  
      // Insert new Driver in database
      var newDriverDocument = await db.collection("users").insertOne({
        firstName: reqObj.firstName,
        lastName: reqObj.lastName,
        phone: reqObj.phone,
        address: reqObj.address,
        currentSalary: reqObj.currentSalary,
        salaryHistory: salaryHistory,
        createdBy: reqObj.userId,
        createdOn: new Date(),
        status: "active",
        roleId: 3,
        roleName: "driver"
      });
  
      return res.send({
          status: "success",
          statusCode: "USERSC001",
          message: successMessages.USERSC001,
          response: {
              driverId: newDriverDocument.insertedId
            }
        })
    }catch(error){
      console.error(errorMessages.USERER007+ "="+ error)
      throw res.send({
          status: "error",
          statusCode: "USERER007",
          message: errorMessages.USERER007
      })
  
    }
  }
  
  //Fetch single driver by id
  var fetchDriverById = async function(req, res) {
    const SERVICE_NAME = "fetchDriverById() :: "
    const db = server.db
    const userId = req.query.userId
    logger.info(CLASS_NAME + SERVICE_NAME + "Entering into fetchDriverById")
    
    try{
      var driverDocument = await db.collection("users").findOne({ _id: ObjectId(userId) },
      { projection: { modifiedBy:0, modifiedOn:0, createdBy:0, createdOn:0 } })

      if (driverDocument == null) {
        return res.send({
          status: "error",
          statusCode: "USERER008",
          message: errorMessages.USERER008
        })
     }

      return res.send({
          status: "success",
          statusCode: "USERSC002",
          message: successMessages.USERSC002,
          response: driverDocument
        })
    }catch(error){
      console.error(errorMessages.USERER009+ "="+ error)
      throw res.send({
          status: "error",
          statusCode: "USERER009",
          message: errorMessages.USERER009
      })
    }
  }
  
//Update driver
var updateDriver = async function(req, res) {
    const SERVICE_NAME = "updateDriver() :: "
    const db = server.db
    const reqObj = req.body
    logger.info(CLASS_NAME + SERVICE_NAME + "Entering into updateDriver")
    
    try{
      //Perform validation on input request
      if (reqObj.userId == undefined || reqObj.userId == "") {
        return res.send({
              status: "error",
              statusCode: "USERER005",
              message: errorMessages.USERER005
            })
      }else if (reqObj.profilePic == undefined || reqObj.profilePic == "") {
        return res.send({
              status: "error",
              statusCode: "USERER010",
              message: errorMessages.USERER010
            })
      }
      console.log("userId="+ObjectId(reqObj.userId))
      await db.collection('users').updateOne(
        {_id: ObjectId(reqObj.userId)},
        {
            $set: {
                profilePic: reqObj.profilePic,
                modifiedBy: reqObj.userId,
                modifiedOn: new Date()
            }
        }
    );
    return res.send({
        status: "success",
        statusCode: "USERSC003",
        message: successMessages.USERSC003,
    });
    }catch(error){
      console.error(error)
      throw res.send({
          status: "error",
          statusCode: "USERER011",
          message: errorMessages.USERER011
      })
    }
}

//Update Salary of User  
var updateSalary = async function(req, res) {
    const SERVICE_NAME = "updateSalary() :: "
    const db = server.db
    const reqObj = req.body
    logger.info(CLASS_NAME + SERVICE_NAME + "Entering into updateSalary")
    
    try{
      //Perform validation on input request
      if (reqObj.userId == undefined || reqObj.userId == "") {
        return res.send({
              status: "error",
              statusCode: "USERER005",
              message: errorMessages.USERER005
            })
      }else if (reqObj.currentSalary == undefined || reqObj.currentSalary == "") {
        return res.send({
              status: "error",
              statusCode: "USERER004",
              message: errorMessages.USERER004
            })
      }

      var userDocument = await db.collection("users").findOne({ _id: ObjectId(reqObj.userId) },
        { projection: { salaryHistory: 1 } });
      console.log("userDocument="+JSON.stringify(userDocument))

      //Store the salary changes
      userDocument.salaryHistory.push({
        amount: reqObj.currentSalary,
        modifiedOn: new Date()
      })
  
      await db.collection('users').updateOne(
        { _id: ObjectId(reqObj.userId) },
        {
            $set: {
                currentSalary: reqObj.currentSalary,
                salaryHistory: userDocument.salaryHistory,
                modifiedBy: reqObj.userId,
                modifiedOn: new Date()
            }
        }
    );
    return res.send({
        status: "success",
        statusCode: "USERSC003",
        message: successMessages.USERSC003,
    });
    }catch(error){
      console.error(error)
      throw res.send({
          status: "error",
          statusCode: "USERER015",
          message: errorMessages.USERER015
      })
    }
}

exports.createDriver = createDriver
exports.fetchDriverById = fetchDriverById
exports.updateDriver = updateDriver
exports.updateSalary = updateSalary
