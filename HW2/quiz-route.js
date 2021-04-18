var express = require('express');
var router = express.Router();
const dbi = require("./db-interface.js");

// Get all of the topics which are available
router.get("/topics/", (req, res) => {
    dbi.GetTopics((topicres) => {
        // Sends an array with the id, title and description
        res.send(topicres);
    });
});

// Get all of the quizes for a given topic id
router.get("/quizes/:topicid/", (req, res) => {
    dbi.GetQuizInfo(req.params.topicid, (quizesres) => {
        // Sends an array of quizes with the quiz id, name and amount of questions
        res.send(quizesres);
    });
});

// Get all of the questions for a given quiz id
router.get("/quizquestions/:quiz/", (req, res) => {
    dbi.GetQuizQuestions(req.params.quiz, (quizres) => {
        // Sends an array of questions with the question id, type, title (and possible answers for MCQ)
        res.send(quizres);
    });
});

// Checks if the answer to a questionid is the right one
router.get("/checkquestion/:questionid", (req, res) => {
    // Check if the user is logged in before they're allowed to check answers
    if (!req.LoggedInUser) {
        res.status(400).send({msg: "Invalid request: please log in", errcode: 6});
        return;
    }

    // The answer must be passed as a query parameter
    if (!req.query.answer) {
        res.status(400).send({ msg: "Invalid request: no answer found", errcode: 7});
        return;
    }

    dbi.CheckAnswer(req.params.questionid, req.query.answer, req.LoggedInUser, req.cookies.sk, (answerres) => {
        // Sends the correctness of the answer, and the correct answer
        res.send(answerres);
    });
});

module.exports = router