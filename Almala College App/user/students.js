var CONSTANTS = require('../utils/constants');
const logger = require('../utils/logger.js');
var server = require("../server");
var ObjectId = require('mongodb').ObjectId;
const successMessages = require('../utils/successMessages.json');
const errorMessages = require('../utils/errorMessages.json');
const jwt = require("jsonwebtoken");
const { response } = require('express');
ObjectId = require('mongodb').ObjectID;
const CLASS_NAME = "students :: ";
 
var studentLogin = async function(req, res) {
  const SERVICE_NAME = "studentLogin() :: "
  const db = server.db
  const reqObj = req.body
  logger.info(CLASS_NAME + SERVICE_NAME + "Entering into studentLogin")
  console.log("reqObj="+JSON.stringify(reqObj))
  try{
    //Perform validation on input request
    if(reqObj.roleId !== CONSTANTS.FIVE){
        return res.send({
          status: "error",
          statusCode: "STUDTE013",
          message: errorMessages.STUDTE013
      })
    }else if(reqObj.password == undefined || reqObj.password == "") {
      return res.send({
        status: "error",
        statusCode: "STUDTE015",
        message: errorMessages.STUDTE015
    })
  }else if (reqObj.enrollmentNo == undefined || reqObj.enrollmentNo == "") {
    return res.send({
          status: "error",
          statusCode: "STUDTE001",
          message: errorMessages.STUDTE001 
    })
  }else if (reqObj.deviceTokenId == undefined || reqObj.deviceTokenId == "") {
    return res.send({
          status: "error",
          statusCode: "STUDTE017",
          message: errorMessages.STUDTE017 
    })
  }
  const payload = {
    enrollmentNo: reqObj.enrollmentNo
  };
    
  //Check whether student already present?
    var studentObj = await db.collection("students").findOne({ enrollmentNo: reqObj.enrollmentNo  },
    { projection: { firstName:1, lastName:1, enrollmentNo:1, password:1, _id:0, userId:1, DOB:1,phone:1, department:1, gender:1, deviceTokenId:1 } })
    console.log("studentObj="+JSON.stringify(studentObj))
    
    if (studentObj == null) {
          return res.send({
          status: "error",
          statusCode: "STUDTE012",
          message: errorMessages.STUDTE012
      })
    }else if(studentObj.password === reqObj.password){

      await db.collection("students").updateOne(
        { enrollmentNo: reqObj.enrollmentNo },
        {
          $set: {
            deviceTokenId: reqObj.deviceTokenId,
            modifiedBy: studentObj.userId,
            modifiedOn: new Date(),
          },
        }
      );

      //Construct response object
      let studentResponseObj={
        firstName: studentObj.firstName,
        lastName: studentObj.lastName,
        userId: studentObj.userId,
        accessToken: accessToken,
        enrollmentNo: studentObj.enrollmentNo,
        DOB: studentObj.DOB,
        phone: studentObj.phone,
        department: studentObj.department,
        gender: studentObj.gender,
        deviceTokenId: studentObj.deviceTokenId
      }

      return res.send({
        status: "success",
        statusCode: "STUDTS004",
        message: successMessages.STUDTS004,
        response: studentResponseObj
      })
    }else{
        return res.send({
          status: "error",
          statusCode: "STUDTE011",
          message: errorMessages.STUDTE011
      })
    }
  }catch(error){
    console.error(error)
    throw res.send({
        status: "error",
        statusCode: "STUDTE010",
        message: errorMessages.STUDTE010
    })
  }
}

//Save new Student
var createStudent = async function(req, res) {
    const SERVICE_NAME = "createStudent() :: "
    const db = server.db
    const reqObj = req.body
    logger.info(CLASS_NAME + SERVICE_NAME + "Entering into createStudent")
  
    try{
      //Perform validation on input request
      for(const student of reqObj){
        console.log('student.enrollmentNo='+student.enrollmentNo)
        if (student.enrollmentNo == undefined || student.enrollmentNo == "") {
              return res.send({
                    status: "error",
                    statusCode: "STUDTE001",
                    message: errorMessages.STUDTE001 
              })
        }else if(student.userId == undefined || student.userId == "") {
          return res.send({
                status: "error",
                statusCode: "USERER005",
                message: errorMessages.USERER005 + ' for student enrollment no ' + student.enrollmentNo
              })
        }else if (student.firstName == undefined || student.firstName == "") {
          return res.send({
                status: "error",
                statusCode: "USERER001",
                message: errorMessages.USERER001 + ' for student enrollment no ' + student.enrollmentNo
              })
        }else if(student.lastName == undefined || student.lastName == "") {
          return res.send({
                status: "error",
                statusCode: "USERER002",
                message: errorMessages.USERER002 + ' for student enrollment no ' + student.enrollmentNo
              })
        }else if(student.gender == undefined || student.gender == "") {
          return res.send({
                status: "error",
                statusCode: "STUDTE002",
                message: errorMessages.STUDTE002 + ' for student enrollment no ' + student.enrollmentNo
              })
        }
        else if(student.DOB == undefined || student.DOB == "") {
          return res.send({
                status: "error",
                statusCode: "STUDTE007",
                message: errorMessages.STUDTE007 + ' for student enrollment no ' + student.enrollmentNo
              })
        } else if(student.password == undefined || student.password == "") {
          return res.send({
                status: "error",
                statusCode: "STUDTE015",
                message: errorMessages.STUDTE015 + ' for student enrollment no ' + student.enrollmentNo
              })
        }else if(student.department == undefined || student.department == "") {
          return res.send({
                status: "error",
                statusCode: "STUDTE018",
                message: errorMessages.STUDTE018 + ' for student enrollment no ' + student.enrollmentNo
              })
        }
      }
      console.log('validation done')
      let alreadyRegisteredStudentsArr = []
      let newlyRegisteredStudentsArr = []

      for(const student of reqObj){
        const isStudentPresent = await db.collection("students").findOne({ enrollmentNo: student.enrollmentNo });
      
        if (isStudentPresent !== null) {
          alreadyRegisteredStudentsArr.push(student.enrollmentNo)
        
        }else{
          console.log("creating student")
          const newStudentId = await db.collection("students").insertOne({
            enrollmentNo: student.enrollmentNo,
            firstName: student.firstName,
            middleName: student.middleName || null,
            lastName: student.lastName,
            password: student.password,
            DOB: student.DOB,
            phone: student.phone || null,
            gender: student.gender,
            department: student.department,
            parents:{
              phone: student.parents.phone || null
            },
            createdBy: ObjectId(student.userId),
            createdOn: new Date(),
            status: "active"   //default status
          });

          await db.collection("students").updateOne({ enrollmentNo: student.enrollmentNo },
            {$set: {
                userId: newStudentId.insertedId
              }
            }
          );
          newlyRegisteredStudentsArr.push(student.enrollmentNo)
          console.log("pushed into newlyRegisteredStudentsArr")
        }
      }
  
      return res.send({
          status: "success",
          statusCode: "STUDTS001",
          message: successMessages.STUDTS001,
          response: {
            alreadyRegisteredStudents: alreadyRegisteredStudentsArr,
            newlyRegisteredStudents: newlyRegisteredStudentsArr
          }
      })
    }catch(error){
      console.error(error)
      throw res.send({
          status: "error",
          statusCode: "STUDTE004",
          message: errorMessages.STUDTE004
      })
    }
}

//Update student details 
var updateStudent = async function(req, res) {
  const SERVICE_NAME = "updateStudent() :: "
  const db = server.db
  const reqObj = req.body
  logger.info(CLASS_NAME + SERVICE_NAME + "Entering into updateStudent")
  
  try{
    //Perform validation on input request
      if (reqObj.enrollmentNo == undefined || reqObj.enrollmentNo == "") {
        return res.send({
              status: "error",
              statusCode: "STUDTE001",
              message: errorMessages.STUDTE001 
        })
      }else if(reqObj.userId == undefined || reqObj.userId == "") {
        return res.send({
              status: "error",
              statusCode: "USERER005",
              message: errorMessages.USERER005 
            })
      }else if (reqObj.firstName == undefined || reqObj.firstName == "") {
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
      }else if(reqObj.gender == undefined || reqObj.gender == "") {
        return res.send({
              status: "error",
              statusCode: "STUDTE002",
              message: errorMessages.STUDTE002
            })
      }
      else if(reqObj.DOB == undefined || reqObj.DOB == "") {
        return res.send({
              status: "error",
              statusCode: "STUDTE007",
              message: errorMessages.STUDTE007
            })
      }
      console.log("validation done")
      const isStudentPresent = await db.collection("students").findOne({ enrollmentNo: reqObj.enrollmentNo });

        if (isStudentPresent === null) {
          return res.send({
            status: "error",
            statusCode: "STUDTE006",
            message: errorMessages.STUDTE006
          })
        }
     //updating student
    await db.collection("students").updateOne(
      { enrollmentNo: reqObj.enrollmentNo },
      {
        $set: {
          firstName: reqObj.firstName,
          middleName: reqObj.middleName || null,
          lastName: reqObj.lastName,
          DOB: reqObj.DOB,
          phone: reqObj.phone || null,
          gender: reqObj.gender,
          parents:{
            phone: reqObj.parents.phone || null
          },
          modifiedBy: ObjectId(reqObj.userId),
          modifiedOn: new Date(),
        }
      }
    );
    return res.send({
        status: "success",
        statusCode: "STUDTS005",
        message: successMessages.STUDTS005
      })
  }catch(error){
    console.error(error)
    throw res.send({
        status: "error",
        statusCode: "STUDTE014",
        message: errorMessages.STUDTE014
    })
  }
}


//Fetch all students from database  
var fetchAllStudents = async function(req, res) {
  const SERVICE_NAME = "fetchAllStudents() :: "
  const db = server.db
  logger.info(CLASS_NAME + SERVICE_NAME + "Entering into fetchAllStudents")
  
  try{
    //Perform validation on input request
    var studentsArr = await db.collection("students").find({},
    { projection: { modifiedBy:0, modifiedOn:0, createdBy:0, _id:0 } }).toArray()
    if (studentsArr == null) {
          return res.send({
          status: "error",
          statusCode: "STUDTE008",
          message: errorMessages.STUDTE008
      })
    }
    return res.send({
        status: "success",
        statusCode: "STUDTS003",
        message: successMessages.STUDTS003,
        response: studentsArr
      })
  }catch(error){
    console.error(error)
    throw res.send({
        status: "error",
        statusCode: "STUDTE009",
        message: errorMessages.STUDTE009
    })
  }
}

//Fetch student on the basis of enrollment number  
var fetchStudentByEnrollmentNo = async function(req, res) {
  const SERVICE_NAME = "fetchStudentByEnrollmentNo() :: "
  const db = server.db
  logger.info(CLASS_NAME + SERVICE_NAME + "Entering into fetchStudentByEnrollmentNo")
  
  try{
    //Perform validation on input request
    var studentsArr = await db.collection("students").findOne({ enrollmentNo: req.params.enrollmentNo },
    { projection: { modifiedBy:0, modifiedOn:0, createdBy:0, _id:0 } })
    if (studentsArr == null) {
          return res.send({
          status: "error",
          statusCode: "STUDTE006",
          message: errorMessages.STUDTE006
      })
    }
    return res.send({
        status: "success",
        statusCode: "STUDTS002",
        message: successMessages.STUDTS002,
        response: studentsArr
      })
  }catch(error){
    console.error(error)
    throw res.send({
        status: "error",
        statusCode: "STUDTE005",
        message: errorMessages.STUDTE005
    })
  }
}


exports.createStudent = createStudent
exports.fetchAllStudents = fetchAllStudents
exports.fetchStudentByEnrollmentNo = fetchStudentByEnrollmentNo
exports.studentLogin = studentLogin
exports.updateStudent = updateStudent

