const CONSTANTS = require("../utils/constants");
const logger = require("../utils/logger.js");
const server = require("../server");
const successMessages = require('../utils/successMessages.json');
const errorMessages = require('../utils/errorMessages.json');
const notificationFCM = require("../utils/notificationFCM");
var ObjectId = require("mongodb").ObjectId;
const CLASS_NAME = "task :: ";

//Save the task created by user
var saveTask = async function (req, res) {
    const SERVICE_NAME = "saveTask() :: ";
    const db = server.db;
    const reqObj = req.body
    logger.info(CLASS_NAME + SERVICE_NAME + "Entering into saveTask");
   
    try {
      //Perform validation on input request
        if(reqObj.name == undefined || reqObj.name == "") {
            return res.send({
              status: "error",
              statusCode: "TASKE001",
              message: errorMessages.TASKE001
          })
        }else if (reqObj.date == undefined || reqObj.date == "") {
          return res.send({
                status: "error",
                statusCode: "TASKE002",
                message: errorMessages.TASKE002 
          })
        }else if (reqObj.description == undefined || reqObj.description == "") {
            return res.send({
                  status: "error",
                  statusCode: "TASKE003",
                  message: errorMessages.TASKE003 
            })
        }else if (reqObj.time == undefined || reqObj.time == "") {
            return res.send({
                  status: "error",
                  statusCode: "TASKE004",
                  message: errorMessages.TASKE004 
            })
        }else if (reqObj.createdOn == undefined || reqObj.createdOn == "") {
          return res.send({
                status: "error",
                statusCode: "TASKE018",
                message: errorMessages.TASKE018 
          })
        }else if (reqObj.roleId != CONSTANTS.FOUR) {
            return res.send({
                  status: "error",
                  statusCode: "TASKE005",
                  message: errorMessages.TASKE005 
            })
        }

        //Saving the task
        const newTaskId = await db.collection("tasks").insertOne({
            name: reqObj.name,
            date: reqObj.date,
            time: reqObj.time,
            description: reqObj.description,
            teacherId: ObjectId(reqObj.teacherId),
            createdOn: reqObj.createdOn,
            createdBy: ObjectId(reqObj.teacherId),
            status: CONSTANTS.PENDING,
          });

          await db.collection("tasks").updateOne({ _id: newTaskId.insertedId },
            {$set: {
                taskId: newTaskId.insertedId
              }
            });

        let notification = {
        title: "Task Update"
        }
        console.log('send notification to hod')
        let teacherResp = await db.collection("teacher").findOne({ userId: ObjectId(reqObj.teacherId) },
        { projection: { _id:0, department: 1, firstName:1, lastName:1 } })

        let managementResp = await db.collection("management").findOne({ department: teacherResp.department },
        { projection: { _id:0, deviceTokenId: 1  } })

        notification.message = "You have a new task created by "+ teacherResp.firstName + " " + teacherResp.lastName
        notification.deviceTokenId = managementResp.deviceTokenId
        if(notification.deviceTokenId !== undefined){
            let notificationArr = []
            notificationArr.push(notification)
            let notificationFCMRes =  await notificationFCM.notificationFCM(notificationArr)
        }

      return res.send({
        status: "success",
        statusCode: "TASKS001",
        message: successMessages.TASKS001
      });
    } catch (error) {
      console.error(error);
      throw res.send({
        status: "error",
        statusCode: "TASKE006",
        message: errorMessages.TASKE006
      });
    }
};

//Update task info
var updateTask = async function (req, res) {
    const SERVICE_NAME = "updateTask() :: ";
    const db = server.db;
    const reqObj = req.body
    logger.info(CLASS_NAME + SERVICE_NAME + "Entering into updateTask");
   
    try {
        //Perform validation on input request
        if(reqObj.taskId == undefined || reqObj.taskId == "") {
            return res.send({
                status: "error",
                statusCode: "TASKE008",
                message: errorMessages.TASKE008
          })
        }else if(reqObj.name == undefined || reqObj.name == "") {
            return res.send({
              status: "error",
              statusCode: "TASKE001",
              message: errorMessages.TASKE001
          })
        }else if (reqObj.date == undefined || reqObj.date == "") {
          return res.send({
                status: "error",
                statusCode: "TASKE002",
                message: errorMessages.TASKE002 
          })
        }else if (reqObj.description == undefined || reqObj.description == "") {
            return res.send({
                  status: "error",
                  statusCode: "TASKE003",
                  message: errorMessages.TASKE003 
            })
        }else if (reqObj.time == undefined || reqObj.time == "") {
            return res.send({
                  status: "error",
                  statusCode: "TASKE004",
                  message: errorMessages.TASKE004 
            })
        }else if (reqObj.roleId != CONSTANTS.FOUR) {
            return res.send({
                  status: "error",
                  statusCode: "TASKE005",
                  message: errorMessages.TASKE005 
            })
        }else if (reqObj.teacherId == undefined || reqObj.teacherId == "") {
            return res.send({
                  status: "error",
                  statusCode: "TASKE012",
                  message: errorMessages.TASKE012 
            })
        }

        //For deciding the status while updating
        let taskResp = await db.collection("tasks").findOne({ taskId: ObjectId(reqObj.taskId) },
        { projection: { status: 1, _id: 0 } });

        //Update the task
        await db.collection("tasks").updateOne({ taskId: ObjectId(reqObj.taskId) },
        {$set: {
                name: reqObj.name,
                date: reqObj.date,
                time: reqObj.time,
                description: reqObj.description,
                modifiedOn: new Date(),
                modifiedBy: ObjectId(reqObj.teacherId),
                status: taskResp.status === CONSTANTS.REJECTED ? CONSTANTS.PENDING: CONSTANTS.PENDING,
            }
          });

      return res.send({
        status: "success",
        statusCode: "TASKS002",
        message: successMessages.TASKS002
      });
    } catch (error) {
      console.error(error);
      throw res.send({
        status: "error",
        statusCode: "TASKE007",
        message: errorMessages.TASKE007
      });
    }
};

//Fetch all tasks by their individual status
var fetchTasksByStatus = async function (req, res) {
    const SERVICE_NAME = "fetchAllTask() :: ";
    const db = server.db;
    const teacherId = req.query.teacherId
    const status = req.query.status
    logger.info(CLASS_NAME + SERVICE_NAME + "Entering into fetchAllTask");
   
    try {
      //Perform validation on input request
        if(status == undefined || status == "") {
            return res.send({
                status: "error",
                statusCode: "TASKE009",
                message: errorMessages.TASKE009
          })
        }else if(teacherId == undefined || teacherId == "") {
            return res.send({
                status: "error",
                statusCode: "TASKE012",
                message: errorMessages.TASKE012
          })
        }

        let query = {}
        if(status == CONSTANTS.ALL){
          const startDate = req.query.startDate
          const endDate = req.query.endDate

          if(startDate == undefined || startDate == "") {
            return res.send({
                status: "error",
                statusCode: "TASKE016",
                message: errorMessages.TASKE016
          })
        }else if(endDate == undefined || endDate == "") {
            return res.send({
                status: "error",
                statusCode: "TASKE017",
                message: errorMessages.TASKE017
          })
        }
          query = {teacherId: ObjectId(teacherId), "createdOn": {"$gte": startDate, "$lte": endDate}}
        }else{
          query = {teacherId: ObjectId(teacherId), status: status}
        }

        var taskResp = await db.collection("tasks").find(query,
        { projection: { modifiedBy: 0, modifiedOn: 0, _id: 0, createdBy:0 } }).sort({"createdOn":-1}).toArray();;

      return res.send({
        status: "success",
        statusCode: "TASKS003",
        message: successMessages.TASKS003,
        response: taskResp
      });
    } catch (error) {
      console.error(error);
      throw res.send({
        status: "error",
        statusCode: "TASKE010",
        message: errorMessages.TASKE010
      });
    }
};

//delete the task - hard delete
var deleteTask = async function (req, res) {
    const SERVICE_NAME = "deleteTask() :: ";
    const db = server.db;
    const reqObj = req.body
    logger.info(CLASS_NAME + SERVICE_NAME + "Entering into deleteTask");
   
    try {
        //Perform validation on input request
        if(reqObj.taskId == undefined || reqObj.taskId == "") {
            return res.send({
                status: "error",
                statusCode: "TASKE008",
                message: errorMessages.TASKE008
          })
        }else if (reqObj.roleId != CONSTANTS.FOUR) {
            return res.send({
                  status: "error",
                  statusCode: "TASKE005",
                  message: errorMessages.TASKE005 
            })
        }
        await db.collection("tasks").deleteOne({ taskId: ObjectId(reqObj.taskId) });

      return res.send({
        status: "success",
        statusCode: "TASKS004",
        message: successMessages.TASKS004
      });
    } catch (error) {
      console.error(error);
      throw res.send({
        status: "error",
        statusCode: "TASKE013",
        message: errorMessages.TASKE013
      });
    }
};

//Update individual task status
var updateStatus = async function (req, res) {
    const SERVICE_NAME = "updateStatus() :: ";
    const db = server.db;
    const reqObj = req.body
    logger.info(CLASS_NAME + SERVICE_NAME + "Entering into updateStatus");
   
    try {
        //Perform validation on input request
        if(reqObj.taskId == undefined || reqObj.taskId == "") {
            return res.send({
                status: "error",
                statusCode: "TASKE008",
                message: errorMessages.TASKE008
          })
        }else if(reqObj.status == undefined || reqObj.status == "") {
            return res.send({
              status: "error",
              statusCode: "TASKE009",
              message: errorMessages.TASKE009
          })
        }else if (reqObj.roleId != CONSTANTS.THREE) {
            return res.send({
                  status: "error",
                  statusCode: "TASKE005",
                  message: errorMessages.TASKE005 
            })
        }else if(reqObj.userId == undefined || reqObj.userId == "") {
            return res.send({
                  status: "error",
                  statusCode: "TASKE015",
                  message: errorMessages.TASKE015 
            })
        }else if (reqObj.status == CONSTANTS.REJECTED && (reqObj.remark == undefined || reqObj.remark == "")) {
            return res.send({
                  status: "error",
                  statusCode: "TASKE014",
                  message: errorMessages.TASKE014 
            })
        }else if(reqObj.teacherId == undefined || reqObj.teacherId == "") {
            return res.send({
              status: "error",
              statusCode: "TASKE012",
              message: errorMessages.TASKE012
          })
        }

        //Updating task status
        await db.collection("tasks").updateOne({ taskId: ObjectId(reqObj.taskId) },
        {$set: {
                status: reqObj.status,
                remark: reqObj.remark || null,
                modifiedOn: new Date(),
                modifiedBy: ObjectId(reqObj.userId)
            }
          });

        //send notification of status update to user
        console.log('send notification for status update='+reqObj.status)
       
        let notification = {
        title: "Task Update",
        message: "Your task has been " + reqObj.status
        }
        console.log('send notification to teacher')
        let teacherResp = await db.collection("teacher").findOne({ userId: ObjectId(reqObj.teacherId) },
        { projection: { _id:0, deviceTokenId: 1 } })

        notification.deviceTokenId = teacherResp.deviceTokenId
        if(notification.deviceTokenId !== undefined){
            let notificationArr = []
            notificationArr.push(notification)
            const notificationFCMRes =  await notificationFCM.notificationFCM(notificationArr)
        }

      return res.send({
        status: "success",
        statusCode: (reqObj.status == CONSTANTS.REJECTED ? "TASKS006" : "TASKS005"),
        message: (reqObj.status == CONSTANTS.REJECTED ? successMessages.TASKS006 : successMessages.TASKS005)
      });
    } catch (error) {
      console.error(error);
      throw res.send({
        status: "error",
        statusCode: "TASKE007",
        message: errorMessages.TASKE007
      });
    }
};

//Fetch all notification from database - No Filter
var fetchAllCollection = async function (req, res) {
  const SERVICE_NAME = "fetchAllCollection() :: ";
  const db = server.db;
  const collectionName = req.query.collectionName
  logger.info(CLASS_NAME + SERVICE_NAME + "Entering into fetchAllCollection");
 
  try {
     
      var taskResp = await db.collection(collectionName).find().toArray();;
      console.log('taskResp='+JSON.stringify(taskResp))

    return res.send({
      status: "success",
      statusCode: "TASKS003",
      message: successMessages.TASKS003,
      response: taskResp
    });
  } catch (error) {
    console.error(error);
    throw res.send({
      status: "error",
      statusCode: "TASKE010",
      message: errorMessages.TASKE010
    });
  }
};

exports.saveTask = saveTask;
exports.updateTask = updateTask;
exports.deleteTask = deleteTask;
exports.fetchTasksByStatus = fetchTasksByStatus;
exports.updateStatus = updateStatus;
exports.fetchAllCollection = fetchAllCollection;
