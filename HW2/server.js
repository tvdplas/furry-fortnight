const express = require("express");
const app = express();
const path = require("path");
const dbi = require("./db-interface.js")
const morgan = require("morgan")

//dbi.SetupDB();
app.use(morgan("combined"))
app.use(express.static(path.resolve("./hw2/public")));

app.get("/topics/", (req, res) => {
    dbi.GetTopics((topicres) => {
        res.send(topicres)
    });
})

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
