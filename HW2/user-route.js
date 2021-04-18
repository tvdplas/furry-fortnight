var express = require('express');
var router = express.Router();
const path = require("path");
const dbi = require("./db-interface.js");

// Registering of new users
router.post("/register/", (req, res) => {
    dbi.Register(req.body.un, req.body.pw, req.body.fn, (dbres) => {
        res.send(dbres);
    });
});

// Logging in of users
router.post("/login/", (req, res) => {
    if (req.LoggedInUser) {
        res.send({errcode: 300, redirect: '/profile'});
        return;
    }
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

//If a user tries to request their profile, make sure they're logged in first
//Otherwise, make them do that
router.get("/profile/", (req, res) => {
    if (!req.LoggedInUser) {
        res.redirect("/login.html");
    } else {
        res.sendFile(path.resolve('HW2/report.html'));
    }    
})

router.post("/fnchange/", (req, res) => {
    //First, check if we have a RU.
    if (!req.LoggedInUser) {
        res.status(400).send({err: "Invalid request"});
        return;
    } else {
        dbi.ChangeFullname(req.LoggedInUser, req.body.fn, (dbres) => {
            res.send(dbres)
        });
    }
});

router.get("/completion/", (req, res) => {
    //First, check if we have a RU.
    if (!req.LoggedInUser) {
        res.status(400).send("Invalid request");
    }
    else {
        dbi.GetQuizCompletion(req.LoggedInUser, (dbres) => {
            res.send(dbres);
        });
    }
});

router.get("/userinfo/", (req, res) => {
    if (!req.LoggedInUser) {
        res.status(400).send("Invalid request");
    }
    else {
        dbi.GetUserInfo(req.LoggedInUser, (dbres) => {
            res.send(dbres);
        });
    }
});


router.get("/setactivequestion/:qid/", (req, res) => {
    if (!req.LoggedInUser) {
        res.status(400).send("Invalid request");
    }
    else {
        dbi.SetActiveQuestion(req.LoggedInUser, req.params.qid, (dbres) => {
            res.send(dbres);
        });
    }
});

router.get("/getactivequestion/", (req, res) => {
    if (!req.LoggedInUser) {
        res.status(400).send("Invalid request");
    }
    else {
        dbi.GetActiveQuestion(req.LoggedInUser, (dbres) => {
            res.send(dbres);
        });
    }
});

router.get("/sessionquestions/", (req, res) => {
    if (!req.LoggedInUser) {
        res.status(400).send("Invalid request");
    }
    else {
        dbi.GetSessionQuestions(req.LoggedInUser, req.cookies.sk, (dbres) => {
            res.send(dbres);
        });
    }
})

module.exports = router