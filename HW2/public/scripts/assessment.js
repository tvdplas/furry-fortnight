let main = document.getElementById('assessment-questions');
var xmlHttp = new XMLHttpRequest();
var selectedTopic, activeQuestion, selectedTopicID; //selectedTopic saves which topic was selected (and selectedTopicID it's ID),
                                                    //activeQuestion saves last checked question by the user
let backButton = document.createElement("button");
backButton.appendChild(document.createTextNode("←"));
backButton.classList.add("back-button");
let buttonDiv = document.createElement("div");
buttonDiv.classList.add("button-div");

//Gets possible topics you can pick from out of the DB
function getTopics(url){
    xmlHttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            var res = JSON.parse(xmlHttp.responseText);
            removeChild(main);                          //Removes all child elements that existed in main previously to create new ones
            res.forEach((topic) => {                    //Creates a topic button for every topic in the DB
                let button = document.createElement("button");
                button.classList.add("topic-button");
                let bh = document.createElement("h2");
                bh.appendChild(document.createTextNode(topic.TopicTitle));
                let bp = document.createElement("p");
                bp.appendChild(document.createTextNode(topic.TopicDesc));
                button.appendChild(bh);
                button.appendChild(bp);

                button.addEventListener("click", function(){
                    selectedTopic = topic.TopicTitle;       //Saves both the selectedTopic and ID for later reference
                    selectedTopicID = topic.TopicID;
                    quizType(topic.TopicID);                //Continues to quizType
                });
                main.appendChild(button);
            });
        }
      };
      xmlHttp.open("GET", url, true);
      xmlHttp.send();
}

//Gets possible quiz types corresponding to the selected topic
function quizType(id){
    xmlHttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            removeChild(main);
            backButton.addEventListener("click", function(){
                getTopics("./topics");                      //If backButton is pressed just goes back to the previous topics
            });
            main.appendChild(buttonDiv);
            buttonDiv.appendChild(backButton);
            var res = JSON.parse(xmlHttp.responseText);
            res.forEach((quiz) => {                         //Creates a button for every possible quiz type
                let button = document.createElement("button");
                button.classList.add("topic-button");

                let bh = document.createElement("h2");
                bh.appendChild(document.createTextNode(quiz.QuizTitle.split("-")[0]));
                let bp = document.createElement("p");
                bp.appendChild(document.createTextNode(quiz.QuizTitle.split("-")[1]));
                button.appendChild(bh);
                button.appendChild(bp);

                button.addEventListener("click", function(){
                    quizQuestions(quiz.QuizID);             //When the button is clicked shows the correct quiz
                });
                main.appendChild(button);
            });
        }
    }
    xmlHttp.open("GET", "./quizes/" + id, true);
    xmlHttp.send();
}

//Gets all the quiz questions corresponding to the chosen quiz type
function quizQuestions(id){
    xmlHttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            removeChild(main);
            backButton.addEventListener("click", function(){
                quizType(selectedTopicID);                  //When backButton is pressed will bring you back to the quiz type with
            });                                             //use of the selectedTopicID var
            main.appendChild(buttonDiv);
            buttonDiv.appendChild(backButton);
            var res = JSON.parse(xmlHttp.responseText);
            res.forEach((questions) => {                    //Creates all the questions, each in a seperate section
                var answer;                                 //answer saves the answer the user has selected (or written)
                let section = document.createElement("section");
                section.setAttribute("id", questions.QuestionID + "s");
                main.appendChild(section);
                let question = document.createElement("h3");
                question.appendChild(document.createTextNode(questions.QuestionStatement));
                section.appendChild(question);
                let button = document.createElement("button");
                button.appendChild(document.createTextNode("Check answer"));
                button.setAttribute("id", questions.QuestionID + "b");
                button.classList.add("answer-button");
                
                if(questions.QuestionType === "MCQ"){      //Creates radiobuttons if the question type is Multiple Choice
                    questions.Options.forEach((mcq) =>{
                        let div = document.createElement("div");
                        div.classList.add("question__selectable");
                        let input = document.createElement("input");
                        input.setAttribute("type", "radio");
                        input.setAttribute("name", questions.QuestionID);
                        input.setAttribute("value", mcq);
                        input.addEventListener('click', function (event) {
                            if (event.target && event.target.matches("input[type='radio']")) {  //Event listener will change the value of answer
                                answer = (event.target.value);                                  //to selected radiobutton
                            }   
                        });
                        let label = document.createElement("label");
                        label.appendChild(document.createTextNode(mcq));
                        label.setAttribute("for", mcq);
                        section.appendChild(div);
                        div.appendChild(input);
                        div.appendChild(label);
                    });
                    var p;                                          //var p will save whether an answer was selected or not
                    button.addEventListener("click", function(){
                        if(answer){                                 //if an answer was chosen
                            if(p){                                  //and the user had an 'No answer selected' error before
                                section.removeChild(p);             //this error will be deleted
                            }
                            checkQuestion(questions.QuestionID, answer);    //and the question will be checked
                        }
                        else{                                       //if an answer hasn't been chosen
                            if(!p){                                 //and there's no p yet (first time getting this error)
                            p = document.createElement("p");
                            p.appendChild(document.createTextNode("No answer selected"))       //will create a "No answer selected" error
                            section.appendChild(p);
                            }
                        }
                    });
                }
                else{                                               //If it's an open question
                    let input = document.createElement("input");
                    input.setAttribute("type", "text");
                    input.setAttribute("id", questions.QuestionID);
                    section.appendChild(input);
                    button.addEventListener("click", function(){
                        answer = input.value;                       //answer is the input value and only called after button onclick
                        if(answer){
                            if(p){
                                section.removeChild(p);
                            }
                            checkQuestion(questions.QuestionID, answer);
                        }
                        else{
                            if(!p){
                            p = document.createElement("p");
                            p.appendChild(document.createTextNode("No answer written"))
                            section.appendChild(p);
                            }
                        }
                    });
                }
                section.appendChild(button); 
            });

            if(activeQuestion){                                             //if there is an active question (the user had been working on this page before)
                var scroll = document.getElementById(activeQuestion + "s");     //it will get the section of the corresponding activeQuestion
                scroll.scrollIntoView({behavior: "smooth", block: "start"});    //the page will scroll to this section
            }
        }
    }
    xmlHttp.open("GET", "./quizquestions/" + id, true);
    xmlHttp.send();
}

//Checks whether the question is correct or not
function checkQuestion(id, answer){
    xmlHttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            var res = JSON.parse(xmlHttp.responseText);
            let p = document.createElement("p");
            let resP = document.createElement("p");
            var sect = document.getElementById(id + "s");
            var link = selectedTopic;
            sect.removeChild(document.getElementById(id + "b"));    //Removes the 'check answer' button
            document.getElementsByName(id).forEach(e => {           //Disables the radio buttons
                e.setAttribute("disabled", true);
            });
            if(!res.IsCorrect){                         //If the question is wrong
                if(selectedTopic == "Notepad++"){       //if selectedTopic is Notepad++
                    link = "notepadpp";                 //will change the link to 'notepadpp' because of our file name being 'notepadpp.html'
                }

                //InnerHTML is used here because in our research, it was not possible
                //to place an <a> tag in the middle of a single paragraph using formal
                //dom manipulation. 
                p.innerHTML = 'Incorrect. The correct answer was: "'+ res.CorrectAnswer +'". For more info, go to the <a href="./' + link.toLowerCase() + '.html">' + selectedTopic + ' page</a>';
                resP.appendChild(document.createTextNode("✖"));
            }
            else{                                                      //When answered correctly
                p.appendChild(document.createTextNode("Correct!"));
                resP.appendChild(document.createTextNode("✔"));
            }
            sect.classList.add("question--completed");
            sect.appendChild(resP);
            sect.appendChild(p);
            newActiveQuestion(id);                              //A new active question will be set
        }
        else if(this.readyState == 4 && this.status == 400){    //If there's an error
            var res = JSON.parse(xmlHttp.responseText);         
            if(res.errcode == 6){                               //When the errorcode is 6 this means the user isn't logged in and isn't allowed to answer
                window.location.replace("./profile")            //Will be redirected to the profile page to create an account
            }
        }
      };
      xmlHttp.open("GET", "./checkquestion/" + id + "?answer=" + answer, true);
      xmlHttp.send();
}

//When an answer is checked, will create a new active question
function newActiveQuestion(id){
      xmlHttp.open("GET", "./setactivequestion/" + id, true);   //QuestionID sent to the server
      xmlHttp.send();
}

//Called everytime all children of a parent element need to be removed
function removeChild(parent) {
    while (parent.firstChild) {
        parent.removeChild(parent.firstChild);
    }
}

//Gets the active question from the server
function getActiveQuestion(){
    xmlHttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            var res = JSON.parse(xmlHttp.responseText);
            if(res.QuestionID){                            //If there's a QuestionID (if there's an active question the user was working on)
                quizQuestions(res.QuizID);                 //it will immediately go to said active question
                activeQuestion = res.QuestionID;           //Active question saved to scroll
                selectedTopic = res.TopicTitle;            //TopicTitle saved to use in links
                selectedTopicID = res.TopicID;             //TopicID saved to use the back button
            }
            else{                                          //If there's no active question the user was working on
                getTopics("./topics");                     //It will just start at the general topic screen
            }
        }
        if (this.readyState == 4 && this.status == 400) {
            getTopics("./topics");                         //When there's an error (when the user isn't logged in) it will take the user
        }                                                  //to the general topic screen
    }
    xmlHttp.open("GET", "./getactivequestion/", true);
    xmlHttp.send();
}      

getActiveQuestion();