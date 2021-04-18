var sessionQuestionsXHR = new XMLHttpRequest();
sessionQuestionsXHR.open("GET", '/sessionquestions/', false);
sessionQuestionsXHR.onreadystatechange = () => {
    if (sessionQuestionsXHR.readyState == 4) {
        let res = JSON.parse(sessionQuestionsXHR.responseText)
        res.QuizTitle = "Correct answers in session"
        MakeProgressBar(res, 0)
    }
}
sessionQuestionsXHR.send(null);

var completedQuizesXHR = new XMLHttpRequest();
completedQuizesXHR.open("GET", '/completion/', true);
completedQuizesXHR.onreadystatechange = () => {
    if (completedQuizesXHR.readyState == 4) {
        let res = JSON.parse(completedQuizesXHR.responseText)
        for (i = 0; i < res.length; i++) {
            MakeProgressBar(res[i], i + 1)
        }
    }
}
completedQuizesXHR.send(null);

function MakeProgressBar(data, i) {
    let percentage = Math.ceil((data.CQuestionCount / data.QuestionCount) * 100) + "%"

    let node = document.createElement("div")

    let hwrapper = document.createElement("div")
    hwrapper.id = "hwrapper"

    let header = document.createElement("h2")
    let htext = document.createTextNode(data.QuizTitle)
    header.appendChild(htext)
    hwrapper.appendChild(header)

    let percCounter = document.createElement("h2")
    let percText = document.createTextNode(percentage)
    percCounter.id = "perccounter"
    percCounter.appendChild(percText)
    hwrapper.appendChild(percCounter)
    node.appendChild(hwrapper)

    let progressdiv = document.createElement("div")
    progressdiv.classList.add("progress");
    node.appendChild(progressdiv)

    let progressinsidediv = document.createElement("div")
    progressinsidediv.classList.add("progressinside");
    progressinsidediv.id = "progress-" + i;
    progressdiv.appendChild(progressinsidediv)
    progressinsidediv.style.width = percentage

    document.getElementById("progsec").appendChild(node)
}

function FNChange() {

    let fn = document.getElementById("fninp").value

    var xhr = new XMLHttpRequest();
    xhr.open("POST", '/fnchange/', true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.onreadystatechange = () => {
        if (xhr.readyState == 4) {
            let res = JSON.parse(xhr.responseText)
            document.getElementById("errmsg")?.remove();
            var node = document.createElement("H2");
            node.id = "errmsg"
            var textnode

            if (res.errcode == 4) {
                textnode = document.createTextNode("Full name is too short")
            }
            else if (res.errcode == -2) {
                textnode = document.createTextNode("Full name changed succesfully!")
            }
            node.appendChild(textnode);
            document.getElementById("control-box").appendChild(node);
        }
    }
    xhr.send(JSON.stringify({
        fn: fn
    }));
}