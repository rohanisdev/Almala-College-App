const CONSTANTS = require("../utils/constants");
const logger = require("../utils/logger.js");
const server = require("../server");
const ObjectId = require("mongodb").ObjectId;
const successMessages = require("../utils/successMessages.json");
const errorMessages = require("../utils/errorMessages.json");
const randomize = require("randomatic");
const notificationFCM = require("../utils/notificationFCM");
const CLASS_NAME = "feedback :: ";

//Save new feedback
var saveFeedback = async function (req, res) {
  const SERVICE_NAME = "saveFeedback() :: ";
  const db = server.db;
  const reqObj = req.body;
  logger.info(CLASS_NAME + SERVICE_NAME + "Entering into saveFeedback");

  try {
    //Perform validation on input request
    if (reqObj.enrollmentNo == undefined || reqObj.enrollmentNo == "") {
      return res.send({
        status: "error",
        statusCode: "STUDTE001",
        message: errorMessages.STUDTE001,
      });
    } else if (reqObj.message == undefined || reqObj.message == "") {
      return res.send({
        status: "error",
        statusCode: "FEDBKE001",
        message: errorMessages.FEDBKE001,
      });
    } else if (reqObj.category == undefined || reqObj.category == "") {
      return res.send({
        status: "error",
        statusCode: "FEDBKE002",
        message: errorMessages.FEDBKE002,
      });
    } else if (reqObj.mainCategory == undefined || reqObj.mainCategory == "") {
      return res.send({
        status: "error",
        statusCode: "FEDBKE019",
        message: errorMessages.FEDBKE019,
      });
    }else if (reqObj.createdOn == undefined || reqObj.createdOn == "") {
      return res.send({
        status: "error",
        statusCode: "FEDBKE003",
        message: errorMessages.FEDBKE003,
      });
    }else if (reqObj.createdBy == undefined || reqObj.createdBy == "") {
      return res.send({
        status: "error",
        statusCode: "FEDBKE007",
        message: errorMessages.FEDBKE007,
      });
    }else if (reqObj.studentDepartment == undefined || reqObj.studentDepartment == "") {
      return res.send({
        status: "error",
        statusCode: "FEDBKE025",
        message: errorMessages.FEDBKE025,
      });
    }
    console.log("validation done");
    const feedbackId = randomize("0", 6);  //Create random unique feedback id

    console.log("creating feedback");
    await db.collection("feedback").insertOne({
      enrollmentNo: reqObj.enrollmentNo,
      feedbackId: feedbackId,
      message: reqObj.message,
      category: reqObj.category,
      mainCategory: reqObj.mainCategory,
      createdOn: reqObj.createdOn,
      createdBy: ObjectId(reqObj.createdBy),
      status: CONSTANTS.SUBMITTED,
      studentDepartment: reqObj.studentDepartment
    });

     //send notification to hod/principal
    let notificationArr = []
    let notification = {
      title: "New Feedback",
      message: "You have new Feedback of Id " + feedbackId  + " under " + reqObj.category + " category"
    }
    console.log('send notification to hod/principal')
    let managementObj = await db.collection("management").findOne({ department: reqObj.studentDepartment },
      { projection: { _id:0, deviceTokenId: 1 } })

      notification.deviceTokenId = managementObj.deviceTokenId
      if(notification.deviceTokenId !== undefined){
        notificationArr.push(notification)
        const notificationFCMRes =  await notificationFCM.notificationFCM(notificationArr)
      }

    return res.send({
      status: "success",
      statusCode: "FEDBKS001",
      message: successMessages.FEDBKS001,
      response: {
        feedbackId: feedbackId,
      },
    });
  } catch (error) {
    console.error(error);
    throw res.send({
      status: "error",
      statusCode: "FEDBKE004",
      message: errorMessages.FEDBKE004,
    });
  }
};

// Fetch feedback by user enrollment number for display
var fetchFeedbackByEnrollmentNo = async function (req, res) {
  const SERVICE_NAME = "fetchFeedbackByEnrollmentNo() :: ";
  const db = server.db;
  logger.info(
    CLASS_NAME + SERVICE_NAME + "Entering into fetchFeedbackByEnrollmentNo"
  );

  try {
    var feedbackArr = await db.collection("feedback").find({ enrollmentNo: req.params.enrollmentNo, 
      status: { "$nin": [CONSTANTS.DELETED] } }, {projection: {modifiedBy: 0, modifiedOn: 0, createdBy: 0, _id: 0}}).sort({"createdOn":-1}).toArray();

        if(feedbackArr === undefined){
         return res.send({
           status: "success",
           statusCode: "FEDBKS002",
           message: successMessages.FEDBKS002,
           response: []
         });
        }

        for(const feedback of feedbackArr){
          let studentInfo = await db.collection("students").findOne({ enrollmentNo: feedback.enrollmentNo },
          { projection: { firstName:1, lastName:1, _id:0, userId: 1 } })

          feedback.firstName = studentInfo.firstName
          feedback.lastName = studentInfo.lastName
          feedback.userId = studentInfo.userId
     } 

     //Handle null scenario
    if (feedbackArr == null) {
      return res.send({
        status: "error",
        statusCode: "FEDBKE005",
        message: errorMessages.FEDBKE005,
      });
    }
    return res.send({
      status: "success",
      statusCode: "FEDBKS002",
      message: successMessages.FEDBKS002,
      response: feedbackArr,
    });
  } catch (error) {
    console.error(error);
    throw res.send({
      status: "error",
      statusCode: "FEDBKE006",
      message: errorMessages.FEDBKE006,
    });
  }
};

//Fetch feedback by its feedback id
var fetchFeedbackByFeedbackId = async function (req, res) {
  const SERVICE_NAME = "fetchFeedbackByFeedbackId() :: ";
  const db = server.db;
  logger.info(
    CLASS_NAME + SERVICE_NAME + "Entering into fetchFeedbackByFeedbackId"
  );

  try {
    var feedbackObj = await db.collection("feedback").findOne({ feedbackId: req.params.feedbackId },
        { projection: { modifiedBy: 0, modifiedOn: 0, _id: 0, feedbackChatsArr:0 } });

        if (feedbackObj === null) {
          return res.send({
            status: "success",
            statusCode: "FEDBKS007",
            message: successMessages.FEDBKS007
          });
        }

        //gather user data for more details related to feedback
        let studentInfo = await db.collection("students").findOne({ enrollmentNo: feedbackObj.enrollmentNo },
        { projection: { firstName:1, lastName:1, _id:0, userId: 1 } })

        feedbackObj.firstName = studentInfo.firstName
        feedbackObj.lastName = studentInfo.lastName
        feedbackObj.userId = studentInfo.userId

    return res.send({
      status: "success",
      statusCode: "FEDBKS002",
      message: successMessages.FEDBKS002,
      response: feedbackObj,
    });
  } catch (error) {
    console.error(error);
    throw res.send({
      status: "error",
      statusCode: "FEDBKE006",
      message: errorMessages.FEDBKE006,
    });
  }
};

//Save feedback conversation
var feedbackChats = async function (req, res) {
  const SERVICE_NAME = "feedbackChats() :: ";
  const db = server.db;
  const reqObj = req.body
  const feedbackIdInput = req.params.feedbackId
  let feedbackChatsArr;
  logger.info(
    CLASS_NAME + SERVICE_NAME + "Entering into feedbackChats"
  );

  try {
    if (reqObj.message == undefined || reqObj.message == "") {
      return res.send({
        status: "error",
        statusCode: "FEDBKE001",
        message: errorMessages.FEDBKE001,
      });
    }else if (reqObj.from == undefined || reqObj.from == "") {
      return res.send({
        status: "error",
        statusCode: "FEDBKE009",
        message: errorMessages.FEDBKE009,
      });
    }else if (reqObj.roleId == undefined || reqObj.roleId == "") {
      return res.send({
        status: "error",
        statusCode: "STUDTE016",
        message: errorMessages.STUDTE016,
      });
    }else if (reqObj.createdOn == undefined || reqObj.createdOn == "") {
      return res.send({
        status: "error",
        statusCode: "FEDBKE003",
        message: errorMessages.FEDBKE003,
      });
    }

    const feedbackObj = await db.collection("feedback").findOne({ feedbackId: feedbackIdInput });

    if(feedbackObj.feedbackChatsArr === undefined){
      feedbackChatsArr = []
    }else{
      feedbackChatsArr = feedbackObj.feedbackChatsArr
    }
    feedbackChatsArr.push(reqObj)

    await db.collection("feedback").updateOne({ feedbackId: feedbackIdInput },
      {$set: {
          feedbackChatsArr: feedbackChatsArr,
          modifiedBy: ObjectId(reqObj.userId),
          modifiedOn: new Date()
        }
      }
    );

    const feedbackLatest = await db.collection("feedback").findOne({ feedbackId: feedbackIdInput },
      { projection: { feedbackChatsArr:1, _id:0 } });
    
      let messageByInfo

    for(const chat of feedbackLatest.feedbackChatsArr){
      switch(chat.roleId){
        //role by role gather info of user
        case 5: 
          messageByInfo = await db.collection("students").findOne({ userId: ObjectId(chat.from) },
          { projection: { firstName:1, lastName:1, _id:0, userId: 1 } })
          chat.firstName = messageByInfo.firstName
          chat.lastName = messageByInfo.lastName
          chat.userId = messageByInfo.userId
          break;
        case 3:
          messageByInfo = await db.collection("management").findOne({ userId: ObjectId(chat.from), roleId: chat.roleId },
          { projection: { firstName:1, lastName:1, _id:0, userId: 1 } })
          chat.firstName = messageByInfo.firstName
          chat.lastName = messageByInfo.lastName
          chat.userId = messageByInfo.userId
      }
    } 
    
    return res.send({
      status: "success",
      statusCode: "FEDBKS003",
      message: successMessages.FEDBKS003,
      response: feedbackLatest
    });
  } catch (error) {
    console.error(error);
    throw res.send({
      status: "error",
      statusCode: "FEDBKE008",
      message: errorMessages.FEDBKE008,
    });
  }
};

//Update feedback status
var updateFeedbackStatus = async function (req, res) {
  const SERVICE_NAME = "updateFeedbackStatus() :: ";
  const db = server.db;
  const reqObj = req.body
  const feedbackIdInput = req.params.feedbackId
  logger.info(
    CLASS_NAME + SERVICE_NAME + "Entering into updateFeedbackStatus"
  );

  try {
    //Perform validation on input request
    if (reqObj.status == undefined || reqObj.status == "") {
      return res.send({
        status: "error",
        statusCode: "FEDBKE011",
        message: errorMessages.FEDBKE011,
      });
    }else if (reqObj.modifiedBy == undefined || reqObj.modifiedBy == "") {
      return res.send({
        status: "error",
        statusCode: "FEDBKE012",
        message: errorMessages.FEDBKE012,
      });
    }
    await db.collection("feedback").updateOne({ feedbackId: feedbackIdInput },
      {$set: {
          status: reqObj.status,
          modifiedBy: ObjectId(reqObj.modifiedBy),
          modifiedOn: new Date()
        }
      }
    );

    if(reqObj.department === undefined || reqObj.userId === undefined){
      return res.send({
        status: "success",
        statusCode: "FEDBKS004",
        message: successMessages.FEDBKS004
      });
    }
    let notificationArr = []
    let notification = {
      title: "Feedback Status Update",
      message: "Feedback status of Id " + feedbackIdInput + " is now " +  reqObj.status
    }
    if(reqObj.status === CONSTANTS.SUBMITTED || reqObj.status === CONSTANTS.RESOLVED || 
      reqObj.status === CONSTANTS.NOTRESOLVED){
      //send notification to hod/principal
      console.log('send notification to hod/principal')
      let managementObj = await db.collection("management").findOne({ department: reqObj.department },
        { projection: { _id:0, deviceTokenId: 1 } })

        notification.deviceTokenId = managementObj.deviceTokenId
    
    }else if(reqObj.status === CONSTANTS.WORKING || reqObj.status === CONSTANTS.WAITINGFORCONFIRMATION
      || reqObj.status === CONSTANTS.HOLD){
      //send notification to student

      let studentObj = await db.collection("students").findOne({ userId: ObjectId(reqObj.userId) },
      { projection: { _id:0, deviceTokenId: 1 } })

      notification.deviceTokenId = studentObj.deviceTokenId
    }

    if(notification.deviceTokenId !== undefined){
      notificationArr.push(notification)
      const notificationFCMRes =  await notificationFCM.notificationFCM(notificationArr)
    }

    
    return res.send({
      status: "success",
      statusCode: "FEDBKS004",
      message: successMessages.FEDBKS004
    });
  } catch (error) {
    console.error(error);
    throw res.send({
      status: "error",
      statusCode: "FEDBKE010",
      message: errorMessages.FEDBKE010
    });
  }
};

//Fetch feedback by their different status
var fetchFeedbackByStatus = async function (req, res) {
  const SERVICE_NAME = "fetchFeedbackByStatus() :: ";
  const db = server.db;
  logger.info(
    CLASS_NAME + SERVICE_NAME + "Entering into fetchFeedbackByStatus"
  );

  try {
    const feedbackArr = await db.collection("feedback").find({ status: req.params.status },
      { projection: {  modifiedBy: 0, modifiedOn: 0, _id: 0, feedbackChatsArr:0, createdBy:0 } })
      .sort({"createdOn":-1}).toArray();

        if(feedbackArr === undefined){
          return res.send({
            status: "success",
            statusCode: "FEDBKS002",
            message: successMessages.FEDBKS002,
            response: []
          });
         }
  
         //Gather data related to user
        for(const feedback of feedbackArr){
              let studentInfo = await db.collection("students").findOne({ enrollmentNo: feedback.enrollmentNo },
              { projection: { firstName:1, lastName:1, _id:0, userId:1 } })

              feedback.firstName = studentInfo.firstName
              feedback.lastName = studentInfo.lastName,
              feedback.userId = studentInfo.userId
        } 

     return res.send({
      status: "success",
      statusCode: "FEDBKS002",
      message: successMessages.FEDBKS002,
      response: feedbackArr
    });
  } catch (error) {
    console.error(error);
    throw res.send({
      status: "error",
      statusCode: "FEDBKE006",
      message: errorMessages.FEDBKE006,
    });
  }
};

//Fetch feedback conversations
var fetchFeedbackChats = async function (req, res) {
  const SERVICE_NAME = "fetchFeedbackChats() :: ";
  const db = server.db;
  logger.info(CLASS_NAME + SERVICE_NAME + "Entering into fetchFeedbackChats");

  try {
    const feedbackObj = await db.collection("feedback").findOne({ feedbackId: req.params.feedbackId },
      { projection: { feedbackChatsArr:1, _id:0 } });

      if(feedbackObj === null){
        return res.send({
          status: "success",
          statusCode: "FEDBKS007",
          message: successMessages.FEDBKS007,
          response: {}
        });
       }else if(feedbackObj.feedbackChatsArr === undefined){
        return res.send({
          status: "success",
          statusCode: "FEDBKS005",
          message: successMessages.FEDBKS005,
          response: {}
        });
     }

     //Based on the role gather user info
    for(const chat of feedbackObj.feedbackChatsArr){
      switch(chat.roleId){
        case 5: 
          messageByInfo = await db.collection("students").findOne({ userId: ObjectId(chat.from) },
          { projection: { firstName:1, lastName:1, _id:0, userId: 1 } })
          chat.firstName = messageByInfo.firstName
          chat.lastName = messageByInfo.lastName
          chat.userId = messageByInfo.userId
          break;
        case 3:
          messageByInfo = await db.collection("management").findOne({ userId: chat.from, roleId: chat.roleId },
          { projection: { firstName:1, lastName:1, _id:0, userId: 1 } })
          chat.firstName = messageByInfo.firstName
          chat.lastName = messageByInfo.lastName
          chat.userId = messageByInfo.userId
      }
    } 
     return res.send({
      status: "success",
      statusCode: "FEDBKS005",
      message: successMessages.FEDBKS005,
      response: feedbackObj
    });
  } catch (error) {
    console.error(error);
    throw res.send({
      status: "error",
      statusCode: "FEDBKE013",
      message: errorMessages.FEDBKE013,
    });
  }
};

//Fetch categories of feedback for popup
var fetchFeedbackCategory = async function (req, res) {
  const SERVICE_NAME = "fetchFeedbackCategory() :: ";
  const db = server.db;
  logger.info(CLASS_NAME + SERVICE_NAME + "Entering into fetchFeedbackCategory");

  try {
    const feedbackCategoryArr = await db.collection("constants").findOne({ constant: "feedback" },
      { projection: { feedbackCategoryArr:1, _id:0 } });

     return res.send({
      status: "success",
      statusCode: "FEDBKS008",
      message: successMessages.FEDBKS008,
      response: feedbackCategoryArr
    });
  } catch (error) {
    console.error(error);
    throw res.send({
      status: "error",
      statusCode: "FEDBKE014",
      message: errorMessages.FEDBKE014,
    });
  }
};

//Update rating given to feedback
var updateRating = async function (req, res) {
  const SERVICE_NAME = "updateRating() :: ";
  const db = server.db;
  const reqObj = req.body
  const feedbackIdInput = req.params.feedbackId
  logger.info(CLASS_NAME + SERVICE_NAME + "Entering into updateRating");

  try {
    //Perform validation on input request
    if (reqObj.rating == undefined || reqObj.rating == "") {
      return res.send({
        status: "error",
        statusCode: "FEDBKE015",
        message: errorMessages.FEDBKE015,
      });
    }else if (reqObj.modifiedBy == undefined || reqObj.modifiedBy == "") {
      return res.send({
        status: "error",
        statusCode: "FEDBKE012",
        message: errorMessages.FEDBKE012,
      });
    }
    await db.collection("feedback").updateOne({ feedbackId: feedbackIdInput },
      {$set: {
          status: reqObj.status,
          modifiedBy: ObjectId(reqObj.modifiedBy),
          modifiedOn: new Date(),
          rating: {
            rating: reqObj.rating,
            comment: reqObj.comment || null
          } 
        }
      });
    return res.send({
      status: "success",
      statusCode: "FEDBKS009",
      message: successMessages.FEDBKS009
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

//For statistic, gather the data, calculate and send to frontend
var FeedbackStatusByCategoryGraph = async function (req, res) {
  const SERVICE_NAME = "FeedbackStatusByCategoryGraph() :: ";
  const db = server.db;
  const reqObj = req.body
  let Submitted = 0
  let Working = 0
  let Resolved = 0
  let waitingForConfirmation = 0
  let notResolved = 0
  let hold = 0
  let query = {}
  const categoryInput = req.params.category
  const isMainCategory = req.query.isMainCategory
  const mainCategory = req.query.mainCategory
  const startDate = req.query.startDate
  const endDate = req.query.endDate
  logger.info(CLASS_NAME + SERVICE_NAME + "Entering into FeedbackStatusByCategoryGraph");

  try {
    //Perform validation on input request
    if (isMainCategory === undefined) {
      return res.send({
        status: "error",
        statusCode: "FEDBKE020",
        message: errorMessages.FEDBKE020,
      });
    } else if (mainCategory == undefined || mainCategory == "") {
      return res.send({
        status: "error",
        statusCode: "FEDBKE019",
        message: errorMessages.FEDBKE019,
      });
    }else if (startDate == undefined || startDate == "") {
      return res.send({
        status: "error",
        statusCode: "FEDBKE022",
        message: errorMessages.FEDBKE022,
      });
    }else if (endDate == undefined || endDate == "") {
      return res.send({
        status: "error",
        statusCode: "FEDBKE023",
        message: errorMessages.FEDBKE023,
      });
    }
    //Condition of all scenarios
    if(categoryInput === "all"){
      query= {"createdOn": {"$gte": startDate, "$lte": endDate},
      "$or":[{ "status": CONSTANTS.SUBMITTED}, {"status": CONSTANTS.WORKING}, {"status":CONSTANTS.RESOLVED }, 
      { "status": CONSTANTS.WAITINGFORCONFIRMATION}, { "status": CONSTANTS.NOTRESOLVED}, { "status": CONSTANTS.HOLD}]}

    }else if(isMainCategory === "true"){
      let feedbackCategoryRes = await db.collection("constants").findOne({ constant: "feedback" },
      { projection: { feedbackCategoryArr:1, _id:0 } });

      
      let subCategoryArr = []
      for(const category of feedbackCategoryRes.feedbackCategoryArr){
        if(category.mainCategory === categoryInput){
          subCategoryArr = category.subCategory
          
          query = {"createdOn": {"$gte": startDate, "$lte": endDate}, category : {"$in":subCategoryArr}, mainCategory: categoryInput, "$or":[{ "status": CONSTANTS.SUBMITTED}, {"status": CONSTANTS.WORKING}, {"status":CONSTANTS.RESOLVED }, { "status": CONSTANTS.WAITINGFORCONFIRMATION}, { "status": CONSTANTS.NOTRESOLVED}, { "status": CONSTANTS.HOLD}]}
          break;
        }
      }
    }else{

      query= {"createdOn": {"$gte": startDate, "$lte": endDate}, category: categoryInput, mainCategory: mainCategory, "$or":[{ "status": CONSTANTS.SUBMITTED}, {"status": CONSTANTS.WORKING}, {"status":CONSTANTS.RESOLVED }, { "status": CONSTANTS.WAITINGFORCONFIRMATION}, { "status": CONSTANTS.NOTRESOLVED}, { "status": CONSTANTS.HOLD}]}
    }

   const feedbackStatusArr = await db.collection("feedback").find(query,
    { projection: { status:1, category:1, _id:0 } }).toArray();

    //Calculate the feedback count based on their status
    feedbackStatusArr.map((feedback) => {
      switch(feedback.status){
        case CONSTANTS.SUBMITTED:
          Submitted += 1
          break
        case CONSTANTS.WORKING:
          Working += 1
          break
        case CONSTANTS.RESOLVED:
          Resolved += 1
          break
        case CONSTANTS.WAITINGFORCONFIRMATION:
          waitingForConfirmation += 1
          break
        case CONSTANTS.NOTRESOLVED:
          notResolved += 1
          break
        case CONSTANTS.HOLD:
          hold += 1
        
      }
    })
   return res.send({
    status: "success",
    statusCode: "FEDBKS010",
    message: successMessages.FEDBKS010,
    response: {
      Submitted: Submitted,
      Working: Working,
      Resolved: Resolved,
      waitingForConfirmation: waitingForConfirmation,
      notResolved: notResolved,
      hold: hold
    }
  });

  } catch (error) {
    console.error(error);
    throw res.send({
      status: "error",
      statusCode: "FEDBKE018",
      message: errorMessages.FEDBKE018
    });
  }
};

//Update timestamps
var updateCreatedOn = async function (req, res) {
  const SERVICE_NAME = "updateCreatedOn() :: ";
  const db = server.db;
  const reqObj = req.body
  const feedbackIdInput = req.params.feedbackId
  logger.info(CLASS_NAME + SERVICE_NAME + "Entering into updateCreatedOn");

  try {
    if (reqObj.createdOn == undefined || reqObj.createdOn == "") {
      return res.send({
        status: "error",
        statusCode: "FEDBKE003",
        message: errorMessages.FEDBKE003,
      });
    }
    await db.collection("feedback").updateOne({ feedbackId: feedbackIdInput },
      {$set: {
        createdOn: reqObj.createdOn
        }
      }
    );
    return res.send({
      status: "success",
      statusCode: "FEDBKS004",
      message: successMessages.FEDBKS004
    });
  } catch (error) {
    console.error(error);
    throw res.send({
      status: "error",
      statusCode: "FEDBKE021",
      message: errorMessages.FEDBKE021
    });
  }
};

//Fetch feedback accourding to input date
var getFeedbackByDate = async function (req, res) {
  const SERVICE_NAME = "updateCreatedOn() :: ";
  const db = server.db;
  const reqObj = req.body
  const startDate = req.query.startDate
  const endDate = req.query.endDate
  const department = req.query.department
  logger.info(CLASS_NAME + SERVICE_NAME + "Entering into updateCreatedOn");

  try {
    //Perform validation on input request
    if (startDate == undefined || startDate == "") {
      return res.send({
        status: "error",
        statusCode: "FEDBKE022",
        message: errorMessages.FEDBKE022,
      });
    }else if (endDate == undefined || endDate == "") {
      return res.send({
        status: "error",
        statusCode: "FEDBKE023",
        message: errorMessages.FEDBKE023,
      });
    }else if (department == undefined || department == "") {
      return res.send({
        status: "error",
        statusCode: "FEDBKE024",
        message: errorMessages.FEDBKE024,
      });
    }
    let query = {}
    if(department === "Principal"){
      query = {"mainCategory": "Institute", "createdOn": {"$gte": startDate, "$lte": endDate},
      status: { "$nin": [CONSTANTS.DELETED] } }
    }else{
      query= {"studentDepartment": department, "mainCategory": "Academic", "createdOn": {"$gte": startDate, "$lte": endDate}, 
      status: { "$nin": [CONSTANTS.DELETED] } }
    }

    const feedbackArr = await db.collection('feedback').find(query,
      { projection: {_id:0, feedbackChatsArr:0 } }).sort({"createdOn":-1}).toArray()

    for(const feedback of feedbackArr){
      let studentInfo = await db.collection("students").findOne({ enrollmentNo: feedback.enrollmentNo },
      { projection: { firstName:1, lastName:1, _id:0, userId: 1 } })

      feedback.firstName = studentInfo.firstName
      feedback.lastName = studentInfo.lastName
      feedback.userId = studentInfo.userId
 } 

    return res.send({
      status: "success",
      statusCode: "FEDBKS002",
      message: successMessages.FEDBKS002,
      response: feedbackArr
    });
  } catch (error) {
    console.error(error);
    throw res.send({
      status: "error",
      statusCode: "FEDBKE006",
      message: errorMessages.FEDBKE006
    });
  }
};

//Manually saving the feedback for backend operations
var saveFeedbackManually = async function (req, res) {
  const SERVICE_NAME = "saveFeedbackManually() :: ";
  const db = server.db;
  const reqObj = req.body;
  logger.info(CLASS_NAME + SERVICE_NAME + "Entering into saveFeedbackManually");

  try {
    //Perform validation on input request
    for(const feedback of reqObj.feedbackArr){
      console.log('feedback.enrollmentNo='+feedback.enrollmentNo)
    if (feedback.enrollmentNo == undefined || feedback.enrollmentNo == "") {
      return res.send({
        status: "error",
        statusCode: "STUDTE001",
        message: errorMessages.STUDTE001,
      });
    } else if (feedback.message == undefined || feedback.message == "") {
      return res.send({
        status: "error",
        statusCode: "FEDBKE001",
        message: errorMessages.FEDBKE001,
      });
    } else if (feedback.category == undefined || feedback.category == "") {
      return res.send({
        status: "error",
        statusCode: "FEDBKE002",
        message: errorMessages.FEDBKE002,
      });
    } else if (feedback.mainCategory == undefined || feedback.mainCategory == "") {
      return res.send({
        status: "error",
        statusCode: "FEDBKE019",
        message: errorMessages.FEDBKE019,
      });
    }else if (feedback.createdOn == undefined || feedback.createdOn == "") {
      return res.send({
        status: "error",
        statusCode: "FEDBKE003",
        message: errorMessages.FEDBKE003,
      });
    }else if (feedback.studentDepartment == undefined || feedback.studentDepartment == "") {
      return res.send({
        status: "error",
        statusCode: "FEDBKE025",
        message: errorMessages.FEDBKE025,
      });
    }
  }

    for(const feedback of reqObj.feedbackArr){
    var studentObj = await db.collection("students").findOne({ enrollmentNo: feedback.enrollmentNo  },
      { projection: { _id:0, userId:1 } })

      const feedbackId = randomize("0", 6);

      if(studentObj !== null){
        var managementObj = await db.collection("management").findOne({ department: feedback.studentDepartment  },
          { projection: { _id:0, roleId:1, userId:1 } })
  
        let feedbackChatsArr = []
        feedbackChatsArr.push({
          roleId: managementObj.roleId,
          message: feedback.discussion,
          from: managementObj.userId,
          createdOn: feedback.createdOn
        })
  
      console.log("creating feedback");
      await db.collection("feedback").insertOne({
        enrollmentNo: feedback.enrollmentNo,
        feedbackId: feedbackId,
        message: feedback.message,
        category: feedback.category,
        mainCategory: feedback.mainCategory,
        createdOn: feedback.createdOn,
        createdBy: studentObj.userId,
        status: CONSTANTS.RESOLVED,
        studentDepartment: feedback.studentDepartment,
        feedbackChatsArr: feedbackChatsArr
      });
      }   
  }
    return res.send({
      status: "success",
      statusCode: "FEDBKS001",
      message: successMessages.FEDBKS001
    });
  } catch (error) {
    console.error(error);
    throw res.send({
      status: "error",
      statusCode: "FEDBKE004",
      message: errorMessages.FEDBKE004,
    });
  }
};

exports.saveFeedback = saveFeedback;
exports.saveFeedbackManually = saveFeedbackManually;
exports.fetchFeedbackByEnrollmentNo = fetchFeedbackByEnrollmentNo;
exports.fetchFeedbackByFeedbackId = fetchFeedbackByFeedbackId;
exports.feedbackChats = feedbackChats;
exports.updateFeedbackStatus = updateFeedbackStatus;
exports.fetchFeedbackByStatus = fetchFeedbackByStatus;
exports.fetchFeedbackChats = fetchFeedbackChats;
exports.fetchFeedbackCategory = fetchFeedbackCategory;
exports.updateRating = updateRating;
exports.FeedbackStatusByCategoryGraph = FeedbackStatusByCategoryGraph;
exports.updateCreatedOn = updateCreatedOn;
exports.getFeedbackByDate = getFeedbackByDate;


