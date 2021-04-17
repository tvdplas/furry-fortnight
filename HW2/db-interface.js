
let fs = require("fs");
let path = require("path");
var sqlite3 = require('sqlite3').verbose();
let db = new sqlite3.Database("./hw2/uwu.db");
var passwordHash = require('password-hash');

// Sets up the entire database and fills it with data.
// Should only be run once for initial setup, 
// not every time the server starts
function SetupDB() {
    // Grabs all of the topics with their quizes and questions
    let topics = JSON.parse(fs.readFileSync(path.resolve("./HW2/topics.json")).toString());
    
    db.serialize(() => {
        db.run(`
            CREATE TABLE Topics(
                TopicID VARCHAR(16) NOT NULL PRIMARY KEY,
                TopicTitle VARCHAR(256) NOT NULL,
                TopicDesc VARCHAR(2048) NOT NULL
            )
        `);
        db.run(`
            CREATE TABLE Quizes(
                TopicID VARCHAR(16) NOT NULL,
                QuizID VARCHAR(16) NOT NULL PRIMARY KEY,
                QuizTitle VARCHAR(256) NOT NULL,
                CONSTRAINT Quiz_FK FOREIGN KEY (TopicID) REFERENCES Topics(TopicID)
            );
        `);
        db.run(`
            CREATE TABLE Questions(
                QuizID VARCHAR(16) NOT NULL,
                QuestionID VARCHAR(16) NOT NULL PRIMARY KEY,
                QuestionStatement VARCHAR(1024) NOT NULL,
                QuestionAnswer VARCHAR(512) NOT NULL,
                QuestionType VARCHAR(16) NOT NULL,
                CONSTRAINT Question_FK FOREIGN KEY (QuizID) REFERENCES Quizes(QuizID)
            );
        `);
        db.run(`
            CREATE TABLE MCQuestions(
                QuestionID VARCHAR(16) NOT NULL,
                QuestionOption VARCHAR(512) NOT NULL,
                CONSTRAINT MCQ_FK FOREIGN KEY (QuestionID) REFERENCES Questions(QuestionID)
            );
        `);
        db.run(`
            CREATE TABLE Users(
                Username VARCHAR(16) NOT NULL PRIMARY KEY,
                HashedPassword VARCHAR(64) NOT NULL,
                FullName VARCHAR(256)
            );
        `);
        db.run(`
            CREATE TABLE Sessions(
                Username VARCHAR(16) NOT NULL,
                Sessiontoken VARCHAR(64) NOT NULL,
                ExperationDate DATETIME NOT NULL,
                CONSTRAINT Username_FK FOREIGN KEY (Username) REFERENCES Users(Username)
          );
        `);
        db.run(`
            CREATE TABLE ActiveQuestions(
                Username VARCHAR(16) NOT NULL,
                QuestionID VARCHAR(16) NOT NULL,
                CONSTRAINT ActiveQuestions_PK PRIMARY KEY (Username),
                CONSTRAINT Username_FK FOREIGN KEY (Username) REFERENCES Users(Username), 
                CONSTRAINT Username_FK FOREIGN KEY (QuestionID) REFERENCES Questions(QuestionID)
            );
        `);
        db.run(`
            CREATE TABLE CompletedQuestions(
                Username VARCHAR(16) NOT NULL,
                QuestionID VARCHAR(16) NOT NULL,
                CONSTRAINT CompletedQuestions_PK PRIMARY KEY (Username, QuestionID),
                CONSTRAINT Username_FK FOREIGN KEY (Username) REFERENCES Users(Username), 
                CONSTRAINT Username_FK FOREIGN KEY (QuestionID) REFERENCES Questions(QuestionID)
            );
        `);

        // Once all other databases have been created, the content can safely be added
        topics.forEach((t, tindex) => {
            // Insert the topics
            db.run(`
                INSERT INTO Topics 
                VALUES (?, ?, ?)
            `,
            [`t${tindex}`, t.title, t.description]);

            t.quizes.forEach((q, qindex) => {
                // Then insert all quizes
                db.run(`
                    INSERT INTO Quizes
                    VALUES (?, ?, ?)
                `,
                [`t${tindex}`, `t${tindex}q${qindex}`, q.title]);

                q.questions.forEach((question, questionID) => {
                    // ..then insert all of the questions
                    db.run(`
                        INSERT INTO Questions
                        VALUES (?, ?, ?, ?, ?)
                    `,
                    [`t${tindex}q${qindex}`, `t${tindex}q${qindex}-${questionID}`,
                        question.qtext, question.qanswer, question.qtype]);
                    
                    // ....and lastly insert question options where necessary
                    question.qoptions.forEach(o => {
                        db.run(`
                            INSERT INTO MCQuestions
                            VALUES (?, ?)
                        `,
                        [`t${tindex}q${qindex}-${questionID}`, o]);  
                    });
                });
            });
        });
    });
}

// Return all of the questions for a certain quiz
function GetQuizQuestions(quizid, cb) {
    // First, get all of the questions with their answers
    db.all(`
        SELECT QuestionID, QuestionStatement, QuestionAnswer, QuestionType 
        FROM Questions 
        WHERE QuizID = ?
    `, 
    [quizid],
    (qerr, qres) => {
        if (qerr) console.log(qerr);
        //Then, grab the options for each MCQuestion
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
            
            // Once we have all of the extra options, we can add them to the question objects we had earlier
            // Any MCQ will have its answer added to the Options array.
            for(let i = 0; i < qres.length; i++) {
                if (qres[i].QuestionType == "MCQ") {
                    qres[i].Options = ores.filter(e => e.QuestionID == qres[i].QuestionID).map(e => e.QuestionOption);
                    qres[i].Options.push(qres[i].QuestionAnswer);
                }
                
                // Finally, remove the answer from the object so that the client doesnt get to see it
                qres[i].QuestionAnswer = undefined;
            }
            
            cb(qres);
        });
    });
}

// Get general info about a quiz based on its ID
function GetQuizInfo(quizid, cb) {
    // Select the quiz, and the count of all of its questions.
    db.all(`
        SELECT Quizes.TopicID, Quizes.QuizID, Quizes.QuizTitle, COUNT(Questions.QuizID) AS QuestionCount
        FROM Quizes, Questions
        WHERE Quizes.TopicID = ? AND Questions.QuizID = Quizes.QuizID
        GROUP BY Questions.QuizID
    `, 
    [quizid],
    (err, res) => {
        if (err) console.log(err);
        cb(res);
    });
}

// Get all topics
function GetTopics(cb) {
    db.all(`
        SELECT *
        FROM Topics
    `,
    (err, res) => {
        if (err) console.log(err);
        cb(res);
    });
}

// Checks the correctness of a answer
// THIS FUNCTION SHOULD ONLY BE CALLED WHEN A USER IS LOGGED IN
function CheckAnswer(questionid, answer, ruu, cb) {
    db.each(`
        SELECT QuestionAnswer
        FROM Questions
        WHERE QuestionID = ?
    `,
    [questionid],
    (err, res) => {
        if (err) console.log(err);

        let isCorrect = res.QuestionAnswer == answer;

        if (isCorrect) {
            db.run(`
                INSERT INTO CompletedQuestions
                VALUES (?, ?)
            `, 
            [ruu, questionid], 
            (err ) => {
                if (err && err.errno != 19) console.log(err)
            })
        }

        cb({IsCorrect: isCorrect});
    });
}

// Gets the completion of a quiz, based on a registered user's id
// SHOULD ONLY BE CALLED IN COMBINATION WITH AN RU, DO NOT RESPOND TO
// UNAUTHENTICATED USERS!!
function GetQuizCompletion (ruu, cb) {
    //ruu - registered user's username

    //First, select all the quizid's and the amount of questions that's in them. 
    //Also, display the name for easy understanding
    db.all(`
        SELECT Quizes.QuizTitle, Quizes.QuizID, COUNT(Questions.QuizID) AS QuestionCount
        FROM Quizes, Questions
        WHERE Questions.QuizID = Quizes.QuizID
        GROUP BY Questions.QuizID
    `, (quizerr, quizData) => {
        if (quizerr) throw quizerr;

        //Then, select the amount of questions that's correct for each of the quizes
        db.all(`
            SELECT Quizes.QuizID, COUNT(Questions.QuizID) AS CQuestionCount
            FROM Quizes, Questions, CompletedQuestions
            WHERE Questions.QuizID = Quizes.QuizID 
            AND Questions.QuestionID = CompletedQuestions.QuestionID 
            AND CompletedQuestions.Username = ?
            GROUP BY Questions.QuizID
        `, 
        [ruu], 
        (answerErr, correctQuestions) => {
            if (answerErr) throw answerErr;

            //console.log(quizData, correctQuestions)

            for (let i = 0; i < quizData.length; i++) {
                let cqc = correctQuestions.find(e => e.QuizID == quizData[i].QuizID)
                quizData[i].CQuestionCount = cqc ? cqc.CQuestionCount : 0
            }

            cb(quizData)
        })
       // console.log(res)
    });
}

// Allows for the registering of new users
function Register(un, pw, fn, cb) {
    // Checks if the username is within bounds
    if (un.length <= 3 || un.length > 16){
        cb({err:"Username length incorrect"});
        return;
    }

    //Checks if the password isn't too short
    if (pw.length <= 5){
        cb({err:"Password is too short"})
        return;
    }

    //Checks if the fullname is within bounds
    if (fn.length <= 1 || fn.length > 256){
        cb({err:"Full name length is incorrect"})
        return;
    }

    //Once the input has been validated, add it to the database
    db.run(`
        INSERT INTO Users
        VALUES (?, ?, ?)
    `,
    [un, passwordHash.generate(pw + un), fn],
    (err) => {
        // If an error occurs, it's most likely to do with the primary key constraint
        if (err && err.errno == 19) {
            cb({err: "User already exists"});
        }
    })
}

// Logs a user in based on their un and pw
function Login(un, pw, cb) {
    db.all(`
        SELECT HashedPassword 
        FROM Users
        WHERE Username = ?
    `, 
    [un],
    (err, res) => {
        if (err) throw err;

        // If the resulting array doesn't contain anything,
        // the user must not exist.
        if (res.length == 0) {
            cb({err: "User not found"});
            return;
        } 

        // If it does exist, verify the hashed password
        if(passwordHash.verify(pw+un, res[0].HashedPassword)) {
            
            //Make a new session key for the user
            let sk = MakeSK(64);
            
            //Let a session key be valid for 3 hours
            let expire = new Date(Date.now() - new Date().getTimezoneOffset()*60*1000 + 1000*60*60*3);
            db.run(`
                INSERT INTO Sessions
                VALUES (?, ?, ?)
            `,
            [un, sk, expire.toISOString().slice(0, 19).replace('T', ' ')], 
            (sesInsertErr) => {
                if (sesInsertErr) throw sesInsertErr;
            })


            cb({loggedIn: true, un: un, sk: sk});
        } 
        else {
            // If the password did not pass the check, notify the user
            cb({err: "Incorrect user/password combination."});
            return;
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

function CheckLogin(un, sk, cb) {
    db.all(`
    SELECT ExperationDate
    FROM Sessions
    WHERE Username = ? AND Sessiontoken = ?
    `,
    [un, sk],
    (dberr, dbres) => {
        if (dberr) throw dberr

        // If there's no result for this un/sk combination, let the user know
        // that they can't log in.
        if (dbres.length == 0) {
            cb({err: "User/Token combination was either not valid, or is expired"});
            return;
        }
        
        // Check if the sk is still valid
        let now = new Date(Date.now() - new Date().getTimezoneOffset()*60*1000);
        let exp = new Date(dbres[0].ExperationDate);

        if (now < exp) {
            // Session token is valid
            cb({loggedIn: true, un: un});
            return;
        } 
        else {
            // Session token has expired
            cb({loggedIn: false, err: "Session expired"});
            return;
        }
    });
}
 
module.exports = {
    GetQuizInfo: GetQuizInfo,
    GetQuizQuestions: GetQuizQuestions,
    GetTopics: GetTopics,
    CheckAnswer: CheckAnswer,
    SetupDB: SetupDB,
    Register: Register,
    Login: Login,
    GetQuizCompletion: GetQuizCompletion,
    CheckLogin: CheckLogin
};