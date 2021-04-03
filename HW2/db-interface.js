var sqlite3 = require('sqlite3').verbose();
let db = new sqlite3.Database("./hw2/uwu.db");

function SetupDB() {
    db.serialize(() => {
        db.run(`
            CREATE TABLE Topics(
                TopicID VARCHAR(16) NOT NULL PRIMARY KEY,
                TopicTitle VARCHAR(256) NOT NULL,
                TopicDesc VARCHAR(2048) NOT NULL
            )
        `)
        db.run(`
            CREATE TABLE Quizes(
                TopicID VARCHAR(16) NOT NULL,
                QuizID VARCHAR(16) NOT NULL PRIMARY KEY,
                QuizTitle VARCHAR(256) NOT NULL,
                CONSTRAINT Quiz_FK FOREIGN KEY (TopicID) REFERENCES Topics(TopicID)
            );
        `)
        db.run(`
            CREATE TABLE Questions(
                QuizID VARCHAR(16) NOT NULL,
                QuestionID VARCHAR(16) NOT NULL PRIMARY KEY,
                QuestionStatement VARCHAR(1024) NOT NULL,
                QuestionAnswer VARCHAR(512) NOT NULL,
                QuestionType VARCHAR(16) NOT NULL,
                CONSTRAINT Question_FK FOREIGN KEY (QuizID) REFERENCES Quizes(QuizID)
            );
        `)
        db.run(`
            CREATE TABLE MCQuestions(
                QuestionID VARCHAR(16) NOT NULL,
                QuestionOption VARCHAR(512) NOT NULL,
                CONSTRAINT MCQ_FK FOREIGN KEY (QuestionID) REFERENCES Questions(QuestionID)
            );
        `)
    });
}

function GetQuizQuestions(quizid, cb) {
    db.all(`
        SELECT QuestionID, QuestionStatement, QuestionAnswer, QuestionType 
        FROM Questions 
        WHERE QuizID = ?
    `, 
    [quizid],
    (qerr, qres) => {
        if (qerr) console.log(qerr);
        db.all(`
            SELECT MCQuestions.QuestionID, QuestionOption
            FROM MCQuestions
            WHERE MCQuestions.QuestionID IN (
                SELECT Questions.QuestionID
                FROM Questions 
                WHERE Questions.QuizID = ?
            )
        `, 
        [quizid],
        (oerr, ores) => {
            if (oerr) console.log(oerr);
            
            for(let i = 0; i < qres.length; i++) {
                if (qres[i].QuestionType == "MCQ") {
                    qres[i].Options = ores.filter(e => e.QuestionID == qres[i].QuestionID).map(e => e.QuestionOption)
                    qres[i].Options.push(qres[i].QuestionAnswer)
                }
                qres[i].QuestionAnswer = undefined
            }
            
            cb(qres);
        }
        )
    });
}

function GetQuizInfo(quizid, cb) {
    db.all(`
        SELECT Quizes.TopicID, Quizes.QuizID, Quizes.QuizTitle, COUNT(Questions.QuizID) AS QuestionCount
        FROM Quizes, Questions
        WHERE Quizes.TopicID = ? AND Questions.QuizID = Quizes.QuizID
        GROUP BY Questions.QuizID
    `, 
    [quizid],
    (err, res) => {
        if (err) console.log(err)
        cb(res)
    });
}

function GetTopics(cb) {
    db.all(`
        SELECT *
        FROM Topics
    `,
    (err, res) => {
        if (err) console.log(err)
        cb(res)
    });
}

function CheckAnswer(questionid, answer, cb) {
    db.each(`
        SELECT QuestionAnswer
        FROM Questions
        WHERE QuestionID = ?
    `,
    [questionid],
    (err, res) => {
        if (err) console.log(err)

        cb({IsCorrect: res.QuestionAnswer == answer})
    });
}

module.exports = {
    GetQuizInfo: GetQuizInfo,
    GetQuizQuestions: GetQuizQuestions,
    GetTopics: GetTopics,
    CheckAnswer: CheckAnswer,
    SetupDB: SetupDB
};