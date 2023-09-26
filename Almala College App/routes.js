const express = require("express");
const app = express();
const jwt = require("jsonwebtoken");
const CONSTANTS = require("./utils/constants");

//Middle layer: performing pre operations on input request
var ensureAuthorized = (req, res, next) => {
  let token = req.headers.authorization;
  if (token) {
      token = token.substring(7);
      //Validate JSON Web Token
      jwt.verify(token, CONSTANTS.SECRET_KEY, (err, decoded) => {
          if (err) {
              if (err.name === "TokenExpiredError") {
                //Throw 401 for unauthorize user
                  return res.sendStatus(401);
              } else {
                //Throw 401 for forbidden
                  return res.sendStatus(403);
              }
          } else {
            console.log("Valid token")
              next();  // Input request move ahead from middle layer here
          }
      });
  } else {
      //For token not present scenario
      return res.sendStatus(401);
  }
}

module.exports = function (app) {
  try {
    var user = require("./user/user.js");
    var driver = require("./user/driver.js");
    var vehicle = require("./transportation/vehicle.js");
    var students = require("./user/students.js");
    var feedback = require("./student/feedback.js");
    var teacher = require("./teacher/teacher.js");
    var principal = require("./management/principal.js");
    var task = require("./teacher/task.js");

    //Driver module
    app.post("/app/api/user/driver", driver.createDriver);
    app.get("/app/api/user/driver", driver.fetchDriverById);
    app.put("/app/api/user/driver", driver.updateDriver);
    app.put("/app/api/user/driver/salary", driver.updateSalary);

    //Students module
    app.post("/app/api/user/student/login", students.studentLogin);
    app.post("/app/api/user/student", ensureAuthorized, students.createStudent);
    app.get("/app/api/user/student", ensureAuthorized, students.fetchAllStudents);
    app.get("/app/api/user/student/:enrollmentNo", ensureAuthorized, students.fetchStudentByEnrollmentNo);
    app.put("/app/api/user/student", ensureAuthorized, students.updateStudent);

    //Teacher module
    app.post("/app/api/user/teacher/login", teacher.teacherLogin);
    app.post("/app/api/user/teacher/save", teacher.saveTeacher);
    app.get("/app/api/user/teacher/by-department", teacher.fetchTeachersByDepartment);
    

    //Principal module
    app.post("/app/api/user/principal/login", principal.principalLogin);
    app.get("/app/api/management", principal.getAllManagement);

    //Feedback Category module
    app.get("/app/api/student/feedback/category", ensureAuthorized, feedback.fetchFeedbackCategory);

    //Feedback module
    app.post("/app/api/student/feedback", ensureAuthorized, feedback.saveFeedback);
    app.post("/app/api/student/feedback/manually", ensureAuthorized, feedback.saveFeedbackManually);
    app.get("/app/api/student/feedback/feedbackId/:feedbackId", ensureAuthorized, feedback.fetchFeedbackByFeedbackId);
    app.put("/app/api/student/feedback/feedbackId/:feedbackId", ensureAuthorized, feedback.feedbackChats);
    app.put("/app/api/student/feedback/status/feedbackId/:feedbackId", ensureAuthorized, feedback.updateFeedbackStatus);
    app.get("/app/api/student/feedback/status/:status", ensureAuthorized, feedback.fetchFeedbackByStatus);
    app.get("/app/api/student/feedback/chats/:feedbackId", ensureAuthorized, feedback.fetchFeedbackChats);
    app.get("/app/api/student/feedback/enrollmentNo/:enrollmentNo", ensureAuthorized, feedback.fetchFeedbackByEnrollmentNo);
    app.put("/app/api/student/feedback/rating/:feedbackId", ensureAuthorized, feedback.updateRating);
    app.get("/app/api/student/feedback/graph/byCategory/:category", ensureAuthorized, feedback.FeedbackStatusByCategoryGraph);
    app.put("/app/api/student/feedback/createdOn/:feedbackId", ensureAuthorized, feedback.updateCreatedOn);
    app.get("/app/api/student/feedback/date", ensureAuthorized, feedback.getFeedbackByDate);
    
    //Vehicle module
    app.post("/app/api/transportation/vehicle", vehicle.createVehicle);
    app.get("/app/api/transportation/vehicle", vehicle.fetchVehicles);

    //Tasks module
    app.post("/app/api/teacher/task", task.saveTask);
    app.put("/app/api/teacher/task", task.updateTask);
    app.delete("/app/api/teacher/task", task.deleteTask);
    app.get("/app/api/teacher/task/status", task.fetchTasksByStatus);
    app.put("/app/api/teacher/task/status", task.updateStatus);
    app.get("/app/api/teacher/fetchAllCollection", task.fetchAllCollection);
    

  } catch (error) {
    console.log("error in routes.js--->>", error);
  }
};
