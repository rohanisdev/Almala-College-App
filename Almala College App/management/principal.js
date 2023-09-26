var CONSTANTS = require("../utils/constants");
const logger = require("../utils/logger.js");
var server = require("../server");
const successMessages = require('../utils/successMessages.json');
const errorMessages = require('../utils/errorMessages.json');
const jwt = require("jsonwebtoken");
const CLASS_NAME = "principal :: ";

//College Principal Login
var principalLogin = async function(req, res) {
    const SERVICE_NAME = "principalLogin() :: "
    const db = server.db
    const reqObj = req.body
    logger.info(CLASS_NAME + SERVICE_NAME + "Entering into principalLogin")

    try{
    //Perform validation on input request
      if(reqObj.password == undefined || reqObj.password == "") {
        return res.send({
          status: "error",
          statusCode: "PNCPLE002",
          message: errorMessages.PNCPLE002
      })
    }else if (reqObj.phone == undefined || reqObj.phone == "") {
      return res.send({
            status: "error",
            statusCode: "PNCPLE003",
            message: errorMessages.PNCPLE003 
      })
    }else if (reqObj.deviceTokenId == undefined || reqObj.deviceTokenId == "") {
        return res.send({
              status: "error",
              statusCode: "PNCPLE007",
              message: errorMessages.PNCPLE007 
        })
    }else if(reqObj.roleId !== CONSTANTS.THREE){ // keep this condition always last
      if(reqObj.roleId !== CONSTANTS.ONE){
        return res.send({
          status: "error",
          statusCode: "PNCPLE001",
          message: errorMessages.PNCPLE001
      })
  }
}

      //Check whether principal exists?
      var principalObj = await db.collection("management").findOne({ roleId: reqObj.roleId, phone: reqObj.phone  },
      { projection: { firstName:1, lastName:1, password:1, _id:0, userId:1, department:1, designation:1, email:1 } })
      
      if (principalObj == null) {
            return res.send({
            status: "error",
            statusCode: "PNCPLE004",
            message: errorMessages.PNCPLE004
        })
      }else if(principalObj.password === reqObj.password){
        const payload = {
            userId: principalObj.userId
          };
  
        await db.collection("management").updateOne(
          { roleId: reqObj.roleId, phone: reqObj.phone },
          {
            $set: {
              deviceTokenId: reqObj.deviceTokenId,
              modifiedBy: principalObj.userId,
              modifiedOn: new Date(),
            },
          }
        );
  
        //Construct response body
        let principalResponseObj={
          firstName: principalObj.firstName,
          lastName: principalObj.lastName,
          userId:  principalObj.userId,
          department: principalObj.department,
          designation: principalObj.designation,
          accessToken: accessToken,
          email: principalObj.email
        }

        return res.send({
          status: "success",
          statusCode: "PNCPLS001",
          message: successMessages.PNCPLS001,
          response: principalResponseObj
        })
      }else{
          return res.send({
            status: "error",
            statusCode: "PNCPLE005",
            message: errorMessages.PNCPLE005
        })
      }
    }catch(error){
      console.error(error)
      throw res.send({
          status: "error",
          statusCode: "PNCPLE006",
          message: errorMessages.PNCPLE006
      })
    }
}


//Fetch all management parties
var getAllManagement = async function (req, res) {
    const SERVICE_NAME = "getAllManagement() :: ";
    const db = server.db;
    const principal = req.query.principal
    const HOD = req.query.HOD
    logger.info(CLASS_NAME + SERVICE_NAME + "Entering into getAllManagement");
  
    try {
      //Perform validation on input request
      if (principal == undefined || principal == "") {
        return res.send({
          status: "error",
          statusCode: "PNCPLE008",
          message: errorMessages.PNCPLE008,
        });
      }else if (HOD == undefined || HOD == "") {
        return res.send({
          status: "error",
          statusCode: "PNCPLE009",
          message: errorMessages.PNCPLE009,
        });
      }
      let managementRoleArr = []
      if(principal === "true"){managementRoleArr.push("principal")}
      if(HOD  === "true"){managementRoleArr.push("HOD")}

      let query = { designation : {"$in":managementRoleArr}}

      const managementArr = await db.collection('management').find(query,
      { projection: {_id:0, firstName:1, lastName: 1, designation: 1, department: 1, userId:1, roleId:1, deviceTokenId:1, phone: 1, email: 1 } }).toArray()
  
      return res.send({
        status: "success",
        statusCode: "PNCPLS002",
        message: successMessages.PNCPLS002,
        response: managementArr
      });
    } catch (error) {
      console.error(error);
      throw res.send({
        status: "error",
        statusCode: "PNCPLE010",
        message: errorMessages.PNCPLE010
      });
    }
};


exports.principalLogin = principalLogin
exports.getAllManagement = getAllManagement