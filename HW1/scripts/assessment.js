//Superclass for the different question types
class Question {
    constructor(qText, answer) {
        this.questionText = qText;      // The question to be displayed to the used
        this.correctAnswer = answer;    // The correct answer
        this.id = -1;                   //The id of the question, must be a unique identifier on the page
    }

    // Simply returns whether a given answer is the correct one 
    checkAnswer(answer) {
        //Selects the question section, if it exists already
        let q = document.getElementById(`q${this.id}`);

        if (q) {
            let oldResP = document.getElementById(`q${this.id}-res`); //Tries to fetch an existing answer element from the page
            if (oldResP) {
                q.removeChild(oldResP);
            }

            //Make a new result element
            let resP = document.createElement("p");
            resP.setAttribute("id", `q${this.id}-res`);
            resP.classList.add("question__result")
            q.appendChild(resP);
            
            //If the correct answer was displayed, let the user now and disable the button
            if (answer == this.correctAnswer) {
                resP.appendChild(document.createTextNode("✔"));
                q.removeChild(document.querySelector(`#q${this.id} button`));
                q.classList.add("question--completed")
            }
            else {
                resP.appendChild(document.createTextNode("incorrect, try again!"));
            }
        }

        return this.correctAnswer == answer;
    }

    //Checks to see if an ID was set
    checkID() {
        if (this.id == -1) {
            throw new Error("No question id was set for the element.");
        }
    }

    //Generates the basic question structure, returns a reference to the element after which 
    generateBase() {
        this.checkID()

        // Each question is a section
        let section = document.createElement("section");
        section.setAttribute("id", `q${this.id}`);
        section.classList.add("question")

        // Adds the question text as a header
        let header = document.createElement("h3");
        header.appendChild(document.createTextNode(this.questionText));
        section.appendChild(header);

        // Button to check for answer
        let button = document.createElement("button");
        button.appendChild(document.createTextNode("Check answer"));
        section.appendChild(button);

        this.section = section;
        this.button = button;
    }

    // Overridable function to generate the html node.
    generateElement() {
        throw new Error("No question type was specified");
    }
};

// Fill in the blank style question. Is correct when the user enters the right word/phrase in the blank spot.
class FillInTheBlank extends Question {
    constructor(qText, answer, qPart1, qPart2) {
        super(qText, answer);   // qText is now simply the text thata is displayd above the question    
        this.qPart1 = qPart1;        // The first half of the question
        this.qPart2 = qPart2;        // The second half of the question
    }
    
    //Generates the fill in the blank html node
    generateElement() {
        this.generateBase()
        
        //The entire question is wrapped in a paragraph for styling and accessibility reasons
        let questionInput = document.createElement("p");
        questionInput.classList.add("question__fitbtext")

        // First part of question
        let beginning = document.createElement("span");
        beginning.appendChild(document.createTextNode(this.qPart1 + " "));
        
        //Last part of question
        let ending = document.createElement("span");
        ending.appendChild(document.createTextNode(" " + this.qPart2));
        
        //Input in the middle of the question
        let input = document.createElement("input");
        input.setAttribute("type", "text");
        input.setAttribute("size", this.correctAnswer.length)
        
        this.button.onclick = () => {
            if (this.checkAnswer(input.value)) {
                input.setAttribute("disabled", "true");
            }
        }

        //Build the entire node
        questionInput.appendChild(beginning);
        questionInput.appendChild(input);
        questionInput.appendChild(ending);
        this.section.insertBefore(questionInput, this.button);

        return this.section;
    }
};

// A multiple choice question, implemented with radiobuttons
class MultipleChoice extends Question {
    constructor(qText, answer, options) {
        super(qText, answer);
        this.options = options;     //An array of possible answers
    }
    
    //Generates the multiple choice element
    generateElement() {
        this.generateBase()
        
        //For every possible answer, add a radiobutton to the node
        this.options.forEach((option, index)  => {
            //For styling purposes, wrap it in a div
            let div = document.createElement("div");
            div.classList.add("question__selectable")

            //Crete the radiobutton
            let input = document.createElement("input");
            input.setAttribute("type", "radio");
            input.setAttribute("id", `q${this.id}-i${index}`); //If we ever need to refer back to a button, there's a unique id
            input.setAttribute("name", `q${this.id}`);
            input.setAttribute("value", option); //Value can just simply be the option itself, which makes checking easier
            
            //Create the label
            let label = document.createElement("label");
            label.appendChild(document.createTextNode(option));
            label.setAttribute("for", option);

            //Build up this node and add it to the section
            div.appendChild(input);
            div.appendChild(label);
            this.section.insertBefore(div, this.button);
        });

        //Set button onclick
        this.button.onclick = () => {
            if (this.checkAnswer(document.querySelector(`input[name="q${this.id}"]:checked`)?.value)) {
                // If the answer was correct, block new input
                document.getElementsByName(`q${this.id}`).forEach(e => {
                    e.setAttribute("disabled", true)
                })
            }
        }

        return this.section;
    }
}

//Create a list of questions
let questions = [
    new MultipleChoice("What does the name VSCode stand for?", "Visual Studio Code", [
        "Visual Styling Code", "Visual Studio Code", "Version Selection Code", "Version Studio Code"
    ]),
    new MultipleChoice("How long does it take most users to get started in Vim?", "30 minutes", [
        "30 minutes", "5 minutes", "15 minutes", "1 hour", "2.5 hours"
    ]),
    new FillInTheBlank("Fill in the correct size", "4", "The installed size of Notepad++ is", "MB."),
    new MultipleChoice("Which of these editors does not have a built-in debugger?", "Notepad++", [
        "VSCode", "Vim", "Notepad++"
    ]),
    new FillInTheBlank("Fill in the correct name", "Marketplace", 
        "You can use the", "to download additional content for VSCode.")
];

questions.forEach((q, i) => {
    q.id = i;
    document.getElementById('assessment-questions').appendChild(q.generateElement())
})
