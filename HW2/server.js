const express = require("express");
const app = express();
const path = require("path");
const dbi = require("./db-interface.js");

//Logging
const morgan = require("morgan");
app.use(morgan("combined"));

//Static files
app.use(express.static(path.resolve("./hw2/public")));

//Post request data handling
var bodyParser = require('body-parser');
app.use(bodyParser.json()); 
app.use(bodyParser.urlencoded({ extended: true }));

//Cookie handling
var cookieParser = require('cookie-parser');
app.use(cookieParser());

// Login check
app.use("/*", (req, res, next) => {
    // On every request made, check if a user passes a valid session token
    // If they do, add the logged in user to the request.
    dbi.CheckLogin(req.cookies.un, req.cookies.sk, (dbres) => {
        if (dbres.loggedIn) {
           console.log("Registered user request, un: " + req.cookies.un);

           req.LoggedInUser = req.cookies.un
           next();
           return;
        } 
        else if (dbres.err == "Session expired") {
            //Send error and wait for the client to log in again
            res.clearCookie("sk")
            res.clearCookie("un")
            res.send({errcode: 11});    
            return;
        }
        next();
        return;
    });
});

// Everything related to users and their info
let userroute = require("./user-route")
app.use(userroute)

//Everything related directly to quizes
let quizroute = require("./quiz-route.js");
app.use(quizroute);

//Catch-all invalid page handler
app.all("*", (req, res) => {
    res.status(404).send("Page not found")
})

app.listen(8045, () => {
    console.log("Server started on port 8045");
});
