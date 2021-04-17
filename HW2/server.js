const express = require("express");
const app = express();
const path = require("path");
const dbi = require("./db-interface.js")
const morgan = require("morgan")
var cookieParser = require('cookie-parser')

//dbi.SetupDB();
app.use(morgan("combined"))
app.use(express.static(path.resolve("./hw2/public")));
var bodyParser = require('body-parser');
app.use(bodyParser.json()); 
app.use(bodyParser.urlencoded({ extended: true })); 
app.use(cookieParser())

app.use("/*", (req, res, next) => {
    dbi.CheckLogin(req.cookies.un, req.cookies.sk, (dbres) => {
        if (dbres.loggedIn) {
           console.log("Registered user request, un: " + req.cookies.un)

           req.LoggedInUser = req.cookies.un
           next()
        } 
        else if (dbres.err == "Session expired") {
            //Redirect client to a different page if their login is expired
            res.redirect('/register.html');
        }
        next()
    })
})

app.post("/register/", (req, res) => {
    dbi.Register(req.body.un, req.body.pw, req.body.fn, (dbres) => {
        res.send(dbres)
    })
});

app.post("/login/", (req, res) => {
    console.log("fhasuifdhsiua")
    dbi.Login(req.body.un, req.body.pw, (dbres) => {
        if (dbres.loggedIn) {
            console.log("Setting cookie")
            res.cookie("un", dbres.un, { maxAge:24*60*60*1000, httpOnly: false })
            res.cookie("sk", dbres.sk, { maxAge:24*60*60*1000, httpOnly: false })
        }
        res.send(dbres)
    })
});

app.get("/topics/", (req, res) => {
    dbi.GetTopics((topicres) => {
        res.send(topicres)
    });
});

app.get("/quizes/:topicid/", (req, res) => {
    dbi.GetQuizInfo(req.params.topicid, (quizesres) => {
        res.send(quizesres)
    });
});

app.get("/quizquestions/:quiz/", (req, res) => {
    dbi.GetQuizQuestions(req.params.quiz, (quizres) => {
        res.send(quizres)
    });
});

app.get("/checkquestion/:questionid", (req, res) => {
    if (!req.query.answer) res.sendStatus(400)
    dbi.CheckAnswer(req.params.questionid, req.query.answer, (answerres) => {
        res.send(answerres)
    });
});


app.listen(8080, () => {
    console.log("Server started on port 8080");
});
