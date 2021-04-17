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

           req.LoggedInUser = req.cookies.un;
           next();
           return
        } 
        else if (dbres.err == "Session expired") {
            // If a user still had an old token which is expired, 
            // redirect them to the login page to get a new token
            res.redirect('/register.html');
            return
        }
        next()
        return
    });
});

// Registering of new users
app.post("/register/", (req, res) => {
    dbi.Register(req.body.un, req.body.pw, req.body.fn, (dbres) => {
        res.send(dbres);
    });
});

// Logging in of users
app.post("/login/", (req, res) => {

    dbi.Login(req.body.un, req.body.pw, (dbres) => {
        
        if (dbres.loggedIn) {
            // If the user provided valid credentials, set a browser cookie
            // with the username and sessionkey which can be checked later.
            // NOTE: because of time zone issues with the dates, the default
            // age of the cookies is set to one day, which is longer than the db time.
            console.log("Setting cookie");
            res.cookie("un", dbres.un, { maxAge:24*60*60*1000, httpOnly: false });
            res.cookie("sk", dbres.sk, { maxAge:24*60*60*1000, httpOnly: false });
        }

        // Send the result of the database query to the client for handling
        res.send(dbres);
    });
});

// Get all of the topics which are available
app.get("/topics/", (req, res) => {
    dbi.GetTopics((topicres) => {
        // Sends an array with the id, title and description
        res.send(topicres);
    });
});

// Get all of the quizes for a given topic id
app.get("/quizes/:topicid/", (req, res) => {
    dbi.GetQuizInfo(req.params.topicid, (quizesres) => {
        // Sends an array of quizes with the quiz id, name and amount of questions
        res.send(quizesres);
    });
});

// Get all of the questions for a given quiz id
app.get("/quizquestions/:quiz/", (req, res) => {
    dbi.GetQuizQuestions(req.params.quiz, (quizres) => {
        // Sends an array of questions with the question id, type, title (and possible answers for MCQ)
        res.send(quizres);
    });
});

// Checks if the answer to a questionid is the right one
app.get("/checkquestion/:questionid", (req, res) => {
    // Check if the user is logged in before they're allowed to check answers
    if (!req.LoggedInUser) {
        res.status(400).send("Invalid request: please log in")
        return
    }

    // The answer must be passed as a query parameter
    if (!req.query.answer) {
        res.status(400).send("Invalid request: no answer found");
        return;
    }

    dbi.CheckAnswer(req.params.questionid, req.query.answer, req.LoggedInUser, (answerres) => {
        // Sends a bool isCorrect
        res.send(answerres);
    });
});

app.get("/completion/", (req, res) => {
    //First, check if we have a RU.
    if (!req.LoggedInUser) {
        res.status(400).send("Invalid request")
    }
    else {
        dbi.GetQuizCompletion(req.LoggedInUser, (dbres) => {
            res.send(dbres)
        })
    }
})

app.listen(8080, () => {
    console.log("Server started on port 8080");
});
