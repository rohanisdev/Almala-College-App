const express = require("express");
const routes = require("./routes.js");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const app = express();
app.use(cors({ origin: "*" }));
app.use(bodyParser.urlencoded({ limit: "100mb", extended: true }));
app.use(bodyParser.json({ limit: "100mb" }));
app.use(function (req, res, next) {
  console.log(">", req.originalUrl);
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

//Check whether server started
try {
  app.listen(3000);
  console.log("Server started on:" + 3000);
} catch (error) {
  console.log("Error while server starting:" + error);
} 

//Connection with MongoDB
const localUrl = "mongodb://127.0.0.1:27017";
const databaseName = "almalacollegeapp";
// connect database
const MongoClient = require("mongodb").MongoClient;
const client = new MongoClient(localUrl, {
  useUnifiedTopology: true,
  useNewUrlParser: true,
  connectTimeoutMS: 30000,
  keepAlive: 1
});

//Verify database connection
client.connect((err) => {
  client.db(databaseName); 
  console.log("Database connection started");
});

const db = client.db(databaseName);

require("./routes.js")(app);
exports.db = db;