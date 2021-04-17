let main = document.getElementById('assessment-questions');
var xmlHttp = new XMLHttpRequest();
var selectedTopic;

function getTopics(url){
    xmlHttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            var res = JSON.parse(xmlHttp.responseText);
            res.forEach((topic) => {
                let button = document.createElement("button");
                button.innerHTML = "<h2>" + topic.TopicTitle + "</h2><p>" + topic.TopicDesc + "</p>";
                button.classList.add("topic-button");
                button.addEventListener("click", function(){
                    selectedTopic = topic.TopicTitle;
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
            var res = JSON.parse(xmlHttp.responseText);
            res.forEach((quiz) => {
                let button = document.createElement("button");
                button.innerHTML = "<h2>" + quiz.QuizTitle.split("-")[0] + "</h2><p>" + quiz.QuizTitle.split("-")[1] + "</p>";
                button.classList.add("topic-button");
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
            var res = JSON.parse(xmlHttp.responseText);
            res.forEach((questions) => {
                var answer;
                let section = document.createElement("section");
                section.setAttribute("id", questions.QuestionID + "s");
                main.appendChild(section);
                let question = document.createElement("h3");
                question.innerText = questions.QuestionStatement;
                section.appendChild(question);
                let button = document.createElement("button");
                button.appendChild(document.createTextNode("Check answer"));
                button.setAttribute("id", questions.QuestionID + "b");
                console.log(document.getElementById(id + "b"));
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
                    link = "Notepadpp";
                }
                p.innerHTML = 'Incorrect. The correct answer was: "answer i dont have yet". For more info, go to the <a href="./' + link + '.html">' + selectedTopic + ' page</a>';
                resP.appendChild(document.createTextNode("✖"));
            }
            else{
                p.appendChild(document.createTextNode("Correct!"));
                resP.appendChild(document.createTextNode("✔"));
            }
            sect.classList.add("question--completed");
            sect.appendChild(resP);
            sect.appendChild(p);
        }
      };
      xmlHttp.open("GET", "/checkquestion/" + id + "?answer=" + answer, true);
      xmlHttp.send();
}

function removeChild(parent) {
    while (parent.firstChild) {
        parent.removeChild(parent.firstChild);
    }
}

getTopics("./topics");