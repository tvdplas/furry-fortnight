document.getElementById("fnbutt").addEventListener("click", FNChange)
document.getElementById("lobutt").addEventListener("click", Logout)


//Since we know users will be logged in on this page, we can safely make requests for their progress

//Set the welcome message
WelcomeMsg();

//Get the amount of questions they did in this session
var sessionQuestionsXHR = new XMLHttpRequest();
//Done synchronously so that this is always the first bar that is displayed
sessionQuestionsXHR.open("GET", './sessionquestions/', false);
sessionQuestionsXHR.onreadystatechange = () => {
    if (sessionQuestionsXHR.readyState == 4) {
        let res = JSON.parse(sessionQuestionsXHR.responseText)

        //Add a title because we dont have one for this request
        res.QuizTitle = "Correct answers in session"

        //Then display it
        MakeProgressBar(res, 0)
    }
}
sessionQuestionsXHR.send(null);

//Then, get all of their completed questions
var completedQuizesXHR = new XMLHttpRequest();
completedQuizesXHR.open("GET", './completion/', true);
completedQuizesXHR.onreadystatechange = () => {
    if (completedQuizesXHR.readyState == 4) {
        let res = JSON.parse(completedQuizesXHR.responseText)
        //For each of the quizes, add their progress
        for (i = 0; i < res.length; i++) {
            MakeProgressBar(res[i], i + 1)
        }
    }
}
completedQuizesXHR.send(null);

//Make the entire progress bar
function MakeProgressBar(data, i) {
    //Calculate the percentage of questions that the user got right
    let percentage = Math.round((data.CQuestionCount / data.QuestionCount) * 100) + "%"
    //If there were no questions (can happen with the session), just set it to 0
    if (data.QuestionCount == 0) percentage = 0

    let node = document.createElement("div")

    let hwrapper = document.createElement("div")
    hwrapper.id = "hwrapper"

    //Create the left header
    let header = document.createElement("h2")
    let htext = document.createTextNode(data.QuizTitle)
    header.appendChild(htext)
    hwrapper.appendChild(header)

    //Create the right header
    let percCounter = document.createElement("h2")
    let percText = document.createTextNode(percentage)
    percCounter.id = "perccounter"
    percCounter.appendChild(percText)
    hwrapper.appendChild(percCounter)
    node.appendChild(hwrapper)

    //Create the wrapper div 
    let progressdiv = document.createElement("div")
    progressdiv.classList.add("progress");
    node.appendChild(progressdiv)

    //Then create the inside div, aka the one that gets the color
    let progressinsidediv = document.createElement("div")
    progressinsidediv.classList.add("progressinside");
    progressinsidediv.id = "progress-" + i;
    progressdiv.appendChild(progressinsidediv)
    progressinsidediv.style.width = percentage

    //Finally, add it
    document.getElementById("progsec").appendChild(node)
}

//onclick handler for when the user wants to change their name
function FNChange() {
    //First, get the input value
    let fn = document.getElementById("fninp").value

    //Then, create a post request for the name change
    var xhr = new XMLHttpRequest();
    xhr.open("POST", './fnchange/', true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.onreadystatechange = () => {
        if (xhr.readyState == 4) {
            //Parse the response
            let res = JSON.parse(xhr.responseText)

            //If we had a previous error, remove it
            document.getElementById("errmsg")?.remove();
            var node = document.createElement("H2");
            node.id = "errmsg"
            var textnode

            //Handle errors, negative numbers are OK
            switch (res.errcode) {
                case 4:
                    textnode = document.createTextNode("Full name is too short");
                    break;
                case -2:
                    textnode = document.createTextNode("Full name changed!");
                    WelcomeMsg();
                    break;
                default:
                    textnode = document.createTextNode("Unknown error occured");
                    break;
            }

            node.appendChild(textnode);
            document.getElementById("fn-box").appendChild(node);
        }
    }
    xhr.send(JSON.stringify({
        fn: fn
    }));
}

//Sets the welcome message at the top of the screen
function WelcomeMsg() {
    var welcomeXHR = new XMLHttpRequest();
    welcomeXHR.open("GET", './userinfo/', false);
    welcomeXHR.onreadystatechange = () => {
        if (welcomeXHR.readyState == 4) {
            let res = JSON.parse(welcomeXHR.responseText);

            //Remove an old welcome message if it exists
            document.getElementById("welcomemsg")?.remove();

            //Create the element
            var node = document.createElement("H2");
            node.id = "welcomemsg";
            var textnode = document.createTextNode("Welcome " + res.FullName);
            node.appendChild(textnode);

            //Set it as the first element
            document.getElementById("fn-box").prepend(node);
        }
    }
    welcomeXHR.send(null);
}

function Logout() {
    var allCookies = document.cookie.split(';');
    for (var i = 0; i < allCookies.length; i++) {
        if (allCookies[i].slice(0, 2) == "sk" || allCookies[i].slice(0, 2) == "un") {
            document.cookie = allCookies[i] + "=;expires=" + new Date(0).toUTCString();
        } else {
            document.cookie = allCookies[i]
        }
    }
    location.reload(); 
}