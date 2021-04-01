const express = require("express");
const app = express();
const path = require("path");
const dbi = require("./db-interface.js")

//dbi.SetupDB();

app.use(express.static(path.resolve("./hw2/public")));

app.get("/quizquestions/:quiz/", (req, res) => {
    dbi.GetQuizQuestions(req.params.quiz, (quizres) => {
        res.send(quizres)
    })
});

app.get("/quiz/:quiz/", (req, res) => {
    dbi.GetQuizInfo(req.params.quiz, (quizres) => {
        res.send(quizres)
    })
});

app.listen(8080, () => {
    console.log("Server started on port 8080");
});
