let main = document.getElementById('assessment-questions');
var xmlHttp = new XMLHttpRequest();
var selectedTopic, activeQuestion, selectedTopicID;
let backButton = document.createElement("button");
backButton.appendChild(document.createTextNode("←"));
backButton.classList.add("back-button");
let buttonDiv = document.createElement("div");
buttonDiv.classList.add("button-div");

function getTopics(url){
    xmlHttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            var res = JSON.parse(xmlHttp.responseText);
            removeChild(main);
            res.forEach((topic) => {
                let button = document.createElement("button");
                button.classList.add("topic-button");
                let bh = document.createElement("h2");
                bh.appendChild(document.createTextNode(topic.TopicTitle));
                let bp = document.createElement("p");
                bp.appendChild(document.createTextNode(topic.TopicDesc));
                button.appendChild(bh);
                button.appendChild(bp);

                button.addEventListener("click", function(){
                    selectedTopic = topic.TopicTitle;
                    selectedTopicID = topic.TopicID;
                    quizType(topic.TopicID);
                });
                main.appendChild(button);
            });
        }
      };
      xmlHttp.open("GET", url, true);
      xmlHttp.send();
}

function quizType(id){
    xmlHttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            removeChild(main);
            backButton.addEventListener("click", function(){
                getTopics("./topics");
            });
            main.appendChild(buttonDiv);
            buttonDiv.appendChild(backButton);
            var res = JSON.parse(xmlHttp.responseText);
            res.forEach((quiz) => {
                let button = document.createElement("button");
                button.classList.add("topic-button");

                let bh = document.createElement("h2");
                bh.appendChild(document.createTextNode(quiz.QuizTitle.split("-")[0]));
                let bp = document.createElement("p");
                bp.appendChild(document.createTextNode(quiz.QuizTitle.split("-")[1]));
                button.appendChild(bh);
                button.appendChild(bp);

                button.addEventListener("click", function(){
                    quizQuestions(quiz.QuizID);
                });
                main.appendChild(button);
            });
        }
    }
    xmlHttp.open("GET", "./quizes/" + id, true);
    xmlHttp.send();
}

function quizQuestions(id){
    xmlHttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            removeChild(main);
            backButton.addEventListener("click", function(){
                quizType(selectedTopicID);
            });
            main.appendChild(buttonDiv);
            buttonDiv.appendChild(backButton);
            var res = JSON.parse(xmlHttp.responseText);
            res.forEach((questions) => {
                var answer;
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
                
                if(questions.QuestionType === "MCQ"){
                    questions.Options.forEach((mcq) =>{
                        let div = document.createElement("div");
                        div.classList.add("question__selectable");
                        let input = document.createElement("input");
                        input.setAttribute("type", "radio");
                        input.setAttribute("name", questions.QuestionID);
                        input.setAttribute("value", mcq);
                        input.addEventListener('click', function (event) {
                            if (event.target && event.target.matches("input[type='radio']")) {
                                answer = (event.target.value);
                            }
                        });

                        let label = document.createElement("label");
                        label.appendChild(document.createTextNode(mcq));
                        label.setAttribute("for", mcq);
                        section.appendChild(div);
                        div.appendChild(input);
                        div.appendChild(label);
                    });
                    var p;
                    button.addEventListener("click", function(){
                        if(answer){
                            if(p){
                                section.removeChild(p);
                            }
                            checkQuestion(questions.QuestionID, answer);
                        }
                        else{
                            if(!p){
                            p = document.createElement("p");
                            p.appendChild(document.createTextNode("No answer selected"))
                            section.appendChild(p);
                            }
                        }
                    });
                }
                else{
                    let input = document.createElement("input");
                    input.setAttribute("type", "text");
                    input.setAttribute("id", questions.QuestionID);
                    section.appendChild(input);
                    button.addEventListener("click", function(){
                        answer = input.value;
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

            if(activeQuestion){
                var scroll = document.getElementById(activeQuestion + "s");
                scroll.scrollIntoView({behavior: "smooth", block: "start"});
            }
        }
    }
    xmlHttp.open("GET", "./quizquestions/" + id, true);
    xmlHttp.send();
}

function checkQuestion(id, answer){
    xmlHttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            var res = JSON.parse(xmlHttp.responseText);
            let p = document.createElement("p");
            let resP = document.createElement("p");
            var sect = document.getElementById(id + "s");
            var link = selectedTopic;
            sect.removeChild(document.getElementById(id + "b"));
            document.getElementsByName(id).forEach(e => {
                e.setAttribute("disabled", true);
            });
            if(!res.IsCorrect){
                if(selectedTopic == "Notepad++"){
                    link = "notepadpp";
                }

                //InnerHTML is used here because in our research, it was not possible
                //to place an <a> tag in the middle of a single paragraph using formal
                //dom manipulation. 
                p.innerHTML = 'Incorrect. The correct answer was: "'+ res.CorrectAnswer +'". For more info, go to the <a href="./' + link.toLowerCase() + '.html">' + selectedTopic + ' page</a>';
                resP.appendChild(document.createTextNode("✖"));
            }
            else{
                p.appendChild(document.createTextNode("Correct!"));
                resP.appendChild(document.createTextNode("✔"));
            }
            sect.classList.add("question--completed");
            sect.appendChild(resP);
            sect.appendChild(p);
            newActiveQuestion(id);
        }
        else if(this.readyState == 4 && this.status == 400){
            var res = JSON.parse(xmlHttp.responseText);
            if(res.errcode == 6){
                window.location.replace("./profile")
            }
        }
      };
      xmlHttp.open("GET", "./checkquestion/" + id + "?answer=" + answer, true);
      xmlHttp.send();
}

function newActiveQuestion(id){
      xmlHttp.open("GET", "./setactivequestion/" + id, true);
      xmlHttp.send();
}

function removeChild(parent) {
    while (parent.firstChild) {
        parent.removeChild(parent.firstChild);
    }
}

function getActiveQuestion(){
    xmlHttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            var res = JSON.parse(xmlHttp.responseText);
            if(res.QuestionID){
                quizQuestions(res.QuizID);
                activeQuestion = res.QuestionID;
                selectedTopic = res.TopicTitle;
                selectedTopicID = res.TopicID;
            }
            else{
                getTopics("./topics");
            }
        }
        if (this.readyState == 4 && this.status == 400) {
            getTopics("./topics");
        }
    }
    xmlHttp.open("GET", "./getactivequestion/", true);
    xmlHttp.send();
}      

getActiveQuestion();