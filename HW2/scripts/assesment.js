//Superclass for the different question types
class Question {
    constructor(qText, answer, id) {
        this.questionText = qText;      // The question to be displayed to the used
        this.correctAnswer = answer;    // The correct answer
        this.id = id;                   //The id of the question, must be a unique identifier on the page
    }

    // Simply returns whether a given answer is the correct one 
    checkAnswer(answer) {
        return this.correctAnswer == answer;
    }

    // Overridable function to generate the html node. Should not be called in the question superclass. 
    generateElement() {
        throw new Error(`No question type specified.`);
    }
};

// Fill in the blank style question. Is correct when the user enters the right word/phrase in the blank spot.
class FillInTheBlank extends Question {
    constructor(qText, answer, id, qPart1, qPart2) {
        super(qText, answer, id);   // qText is now simply the text thata is displayd above the question    
        this.qPart1 = qPart1        // The first half of the question
        this.qPart2 = qPart2        // The second half of the question
    }

    //Generates the fill in the blank html node
    generateElement() {
        // Each question is a section
        let section = document.createElement("section");

        // Adds the question text as a header
        let header = document.createElement("h3");
        header.appendChild(document.createTextNode(this.questionText));
        
        //The entire question is wrapped in a paragraph for styling and accessibility reasons
        let questionInput = document.createElement("p");
        
        // First part of question
        let beginning = document.createElement("span");
        beginning.appendChild(document.createTextNode(this.qPart1 + " "));
        
        //Last part of question
        let ending = document.createElement("span");
        ending.appendChild(document.createTextNode(" " + this.qPart2));
        
        //Input in the middle of the question
        let input = document.createElement("input");
        input.setAttribute("type", "text");
        
        // Button to check for answer
        let button = document.createElement("button");
        button.appendChild(document.createTextNode("Check answer"));
        button.onclick = () => console.log(this.checkAnswer(input.value)) 

        //Build the entire node
        section.appendChild(header);
        questionInput.appendChild(beginning);
        questionInput.appendChild(input);
        questionInput.appendChild(ending);
        section.appendChild(questionInput);
        section.appendChild(button)

        return section;
    }
};

// A multiple choice question, implemented with radiobuttons
class MultipleChoice extends Question {
    constructor(qText, answer, id, options) {
        super(qText, answer, id);
        this.options = options;     //An array of possible answers
    }
    
    //Generates the multiple choice element
    generateElement() {
        // Each question is a section
        let section = document.createElement("section");

        // Adds the question text as a header
        let header = document.createElement("h3");
        header.appendChild(document.createTextNode(this.questionText));
        section.appendChild(header);
        
        //For every possible answer, add a radiobutton to the node
        this.options.forEach((option, index)  => {
            //For styling purposes, wrap it in a div
            let div = document.createElement("div");

            //Crete the radiobutton
            let input = document.createElement("input");
            input.setAttribute("type", "radio");
            input.setAttribute("id", `q${this.id}-i${index}`); //If we ever need to refer back to a button, there's a unique id
            input.setAttribute("name", this.id);
            input.setAttribute("value", option); //Value can just simply be the option itself, which makes checking easier
            
            //Create the label
            let label = document.createElement("label");
            label.appendChild(document.createTextNode(option));
            label.setAttribute("for", option);

            //Build up this node and add it to the section
            div.appendChild(input);
            div.appendChild(label);
            section.appendChild(div);
        });

        //Finally, add the button
        let button = document.createElement("button");
        button.appendChild(document.createTextNode("Check answer"));
        button.onclick = () => { 
            //Get the selected button (if it exists), and then check if its value if correct
            console.log(this.checkAnswer(document.querySelector(`input[name="${this.id}"]:checked`)?.value)) 
        }
        section.appendChild(button)

        return section;
    }
}

let fb = new FillInTheBlank('Fill in the blank', 'beans', 1, 'how many', 'do you have to eat')
let fb2 = new MultipleChoice('Which of the following is not a discussed code editor?', 'Atom', 2, ['VSCode', 'Atom', 'Vim', 'Notepad++'])
let fb3 = new MultipleChoice('whahaha', 'beans', 3, ['how many', 'do you have to eat'])
document.getElementById('assesment-questions').appendChild(fb.generateElement())
document.getElementById('assesment-questions').appendChild(fb2.generateElement())
document.getElementById('assesment-questions').appendChild(fb3.generateElement())