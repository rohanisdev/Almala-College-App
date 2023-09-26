var CONSTANTS = require("../utils/constants");
const logger = require("../utils/logger.js");
var server = require("../server");
const successMessages = require('../utils/successMessages.json');
const errorMessages = require('../utils/errorMessages.json');
const jwt = require("jsonwebtoken");
const CLASS_NAME = "teacher :: ";
 
//Teacher login
var teacherLogin = async function(req, res) {
    const SERVICE_NAME = "teacherLogin() :: "
    const db = server.db
    const reqObj = req.body
    logger.info(CLASS_NAME + SERVICE_NAME + "Entering into teacherLogin")
    try{
      //Perform validation on input request
      if(reqObj.password == undefined || reqObj.password == "") {
        return res.send({
          status: "error",
          statusCode: "TECHRE002",
          message: errorMessages.TECHRE002
      })
    }else if (reqObj.phone == undefined || reqObj.phone == "") {
      return res.send({
            status: "error",
            statusCode: "TECHRE003",
            message: errorMessages.TECHRE003 
      })
    }else if (reqObj.deviceTokenId == undefined || reqObj.deviceTokenId == "") {
        return res.send({
              status: "error",
              statusCode: "TECHRE007",
              message: errorMessages.TECHRE007 
        })
      }else if(reqObj.roleId !== CONSTANTS.FOUR){ // keep this condition always last
          if(reqObj.roleId !== CONSTANTS.SEVEN){
          return res.send({
            status: "error",
            statusCode: "TECHRE001",
            message: errorMessages.TECHRE001
        })
      }
    }

      //Check wthere teacher exists? if yes fetch the data
      var teacherObj = await db.collection("teacher").findOne({ roleId: reqObj.roleId, phone: reqObj.phone  },
      { projection: { firstName:1, lastName:1, password:1, _id:0, userId:1, department:1, designation:1, email:1 } })
      
      if (teacherObj == null) {
            return res.send({
            status: "error",
            statusCode: "TECHRE004",
            message: errorMessages.TECHRE004
        })
      }else if(teacherObj.password === reqObj.password){
        const payload = {
            userId: teacherObj.userId
          };
          const accessToken = jwtSign(payload);
  
        await db.collection("teacher").updateOne(
          { roleId: CONSTANTS.FOUR, phone: reqObj.phone },
          {
            $set: {
              deviceTokenId: reqObj.deviceTokenId,
              modifiedBy: teacherObj.userId,
              modifiedOn: new Date(),
            },
          }
        );
  
        //Prepare response object
        let teacherResponseObj={
          firstName: teacherObj.firstName,
          lastName: teacherObj.lastName,
          userId:  teacherObj.userId,
          department: teacherObj.department,
          designation: teacherObj.designation,
          accessToken: accessToken,
          email: teacherObj.email
        }
  
        return res.send({
          status: "success",
          statusCode: "TECHRS001",
          message: successMessages.TECHRS001,
          response: teacherResponseObj
        })
      }else{
          return res.send({
            status: "error",
            statusCode: "TECHRE005",
            message: errorMessages.TECHRE005
        })
      }
    }catch(error){
      console.error(error)
      throw res.send({
          status: "error",
          statusCode: "TECHRE006",
          message: errorMessages.TECHRE006
      })
    }
  }

//Save new teacher
var saveTeacher = async function (req, res) {
  const SERVICE_NAME = "saveTeacher() :: ";
  const db = server.db;
  const reqObj = req.body
  const feedbackIdInput = req.params.feedbackId
  logger.info(CLASS_NAME + SERVICE_NAME + "Entering into saveTeacher");

  try {
    for(const teacher of reqObj.teacherArr){
    let roleId = 0
    let collectionName = ""
    
    //Decide role
    if(teacher.designation === "PRINCIPAL"){
      roleId = 1
      collectionName = "management"
    }else if(teacher.designation === "HOD"){
      roleId = 3
      collectionName = "management"
    }else if(teacher.designation === "LECTURER/TPO"){
        roleId = 7
        collectionName = "teacher"
    }else if(teacher.designation === "LECTURER"){
      roleId = 4
      collectionName = "teacher"
    }

    //Saving the teacher
    const newStudentId = await db.collection(collectionName).insertOne({
      department: teacher.department,
      designation: teacher.designation,
      roleId: roleId,
      email: teacher.email,
      phone: teacher.phone,
      password: "admin123",
      firstName: teacher.last,
      middleName: teacher.middleName,
      lastName: teacher.firstName,
      gender: teacher.gender
    });

    console.log("userId="+newStudentId.insertedId)
    await db.collection(collectionName).updateOne({ _id: newStudentId.insertedId },
      {$set: {
          userId: newStudentId.insertedId
        }
      }
    );
  }
  
  var feedbackArr = await db.collection("teacher").find({ },
    {projection: {modifiedBy: 0, modifiedOn: 0, createdBy: 0}}).toArray();

    return res.send({
      status: "success",
      statusCode: "FEDBKS009",
      message: successMessages.FEDBKS009,
      response: feedbackArr
    });
  } catch (error) {
    console.error(error);
    throw res.send({
      status: "error",
      statusCode: "FEDBKE017",
      message: errorMessages.FEDBKE017
    });
  }
};

//Fetch the feedback based on their department code
var fetchTeachersByDepartment = async function (req, res) {
  const SERVICE_NAME = "fetchTeachersByDepartment() :: ";
  const db = server.db;
  const department = req.query.department
  logger.info(CLASS_NAME + SERVICE_NAME + "Entering into fetchTeachersByDepartment");
 
  try {
    //Perform validation on input request
      if(department == undefined || department == "") {
          return res.send({
              status: "error",
              statusCode: "TECHRE008",
              message: errorMessages.TECHRE008
        })
      }
      var teacherResp = await db.collection("teacher").find({ department: department },
      { projection: { modifiedBy: 0, modifiedOn: 0, _id: 0, createdBy:0, createdOn:0, password:0, roleId:0 } }).toArray();;
      console.log('teacherResp='+JSON.stringify(teacherResp))

    return res.send({
      status: "success",
      statusCode: "TECHRS002",
      message: successMessages.TECHRS002,
      response: teacherResp
    });
  } catch (error) {
    console.error(error);
    throw res.send({
      status: "error",
      statusCode: "TECHRE009",
      message: errorMessages.TECHRE009
    });
  }
};

exports.teacherLogin = teacherLogin
exports.saveTeacher = saveTeacher
exports.fetchTeachersByDepartment = fetchTeachersByDepartment

  