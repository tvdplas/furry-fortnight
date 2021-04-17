
let fs = require("fs")
let path = require("path")
var sqlite3 = require('sqlite3').verbose();
let db = new sqlite3.Database("./hw2/uwu.db");
var passwordHash = require('password-hash');

function SetupDB() {
    let topics = JSON.parse(fs.readFileSync(path.resolve("./HW2/topics.json")).toString())
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
        db.run(`
            CREATE TABLE Users(
                Username VARCHAR(16) NOT NULL PRIMARY KEY,
                HashedPassword VARCHAR(64) NOT NULL,
                FullName VARCHAR(256)
            );
        `)
        db.run(`
            CREATE TABLE Sessions(
                Username VARCHAR(16) NOT NULL,
                Sessiontoken VARCHAR(64) NOT NULL,
                ExperationDate DATETIME NOT NULL,
                CONSTRAINT Username_FK FOREIGN KEY (Username) REFERENCES Users(Username)
          );
        `)
        topics.forEach((t, tindex) => {
            db.run(`
                INSERT INTO Topics 
                VALUES (?, ?, ?)
            `,
            [`t${tindex}`, t.title, t.description])

            t.quizes.forEach((q, qindex) => {
                db.run(`
                    INSERT INTO Quizes
                    VALUES (?, ?, ?)
                `,
                [`t${tindex}`, `t${tindex}q${qindex}`, q.title])

                q.questions.forEach((question, questionID) => {
                    db.run(`
                        INSERT INTO Questions
                        VALUES (?, ?, ?, ?, ?)
                    `,
                    [`t${tindex}q${qindex}`, `t${tindex}q${qindex}-${questionID}`,
                        question.qtext, question.qanswer, question.qtype])

                    question.qoptions.forEach(o => {
                        db.run(`
                            INSERT INTO MCQuestions
                            VALUES (?, ?)
                        `,
                        [`t${tindex}q${qindex}-${questionID}`, o])   
                    })
                })
            })
        });
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

function Register(un, pw, fn, cb) {
    if (un.length <= 3 || un.length > 16){
        cb({errcode: 2})
        return;
    }
    if (pw.length <= 5){
        cb({errcode: 3})
        return;
    }
    if (fn.length <= 1 || fn.length > 256){
        cb({errcode: 4})
        return;
    }
    db.run(`
        INSERT INTO Users
        VALUES (?, ?, ?)
    `,
    [un, passwordHash.generate(pw + un), fn],
    (err) => {
        if (err && err.errno == 19) {
            cb({err: "User already exists"})
        }  
    })
}

function Login(un, pw, cb) {
    db.all(`
        SELECT HashedPassword 
        FROM Users
        WHERE Username = ?
    `, 
    [un],
    (err, res) => {
        if (err) throw err

        if (res.length == 0) {
            cb({errcode: 1})
            return
        } 

        if(passwordHash.verify(pw+un, res[0].HashedPassword)) {
            
            //session key maken -> random string of chars
            //skey -> db & user als cookie
            let sk = MakeSK(64);
            let expire = new Date(Date.now() - new Date().getTimezoneOffset()*60*1000 + 1000*60*60*3)
            db.run(`
                INSERT INTO Sessions
                VALUES (?, ?, ?)
            `,
            [un, sk, expire.toISOString().slice(0, 19).replace('T', ' ')], 
            (sesInsertErr) => {
                if (sesInsertErr) throw sesInsertErr
            })


            cb({loggedIn: true, un: un, sk: sk})
        } 
        else {
            cb({errcode: 1})
        }
    })
}

//source: https://stackoverflow.com/questions/1349404/generate-random-string-characters-in-javascript
function MakeSK(length) {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
       result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

function DateFromSQLString(sqlstring) {
    var a = sqlstring.split("T");
    var d = a[0].split("-");
    var t = a[1].slice(0, -1).split(":");
    return new Date(d[0], (d[1] - 1), d[2], t[0], t[1], t[2]);
}
 
 function CheckLogin(un, sk, cb) {
    db.all(`
    SELECT ExperationDate
    FROM Sessions
    WHERE Username = ? AND Sessiontoken = ?
    `,
    [un, sk],
    (dberr, dbres) => {
        if (dberr) throw dberr

        if (dbres.length == 0) {
            cb({err: "User/Token combination was either not valid, or is expired"})
            return 
        }
       // console.log(dbres[0].ExperationDate)
        let now = new Date(Date.now() - new Date().getTimezoneOffset()*60*1000)
        let exp = new Date(dbres[0].ExperationDate)

        if (now < exp) {
            //Session token is valid
            cb({loggedIn: true, un: un})
            return
        } 
        else {
            cb({loggedIn: false, err: "Session expired"})
            return
        }
    })

 }
 

module.exports = {
    GetQuizInfo: GetQuizInfo,
    GetQuizQuestions: GetQuizQuestions,
    GetTopics: GetTopics,
    CheckAnswer: CheckAnswer,
    SetupDB: SetupDB,
    Register: Register,
    Login: Login,
    CheckLogin: CheckLogin
};