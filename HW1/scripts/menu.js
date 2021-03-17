let elements = ["Body", "Header", "Footer", "Aside", "Article", "Section"];
let allFonts = ['Helios Regular', 'Helios Bold', 'Arial', 'Arial Black', 'Bahnschrift', 'Calibri', 'Cambria', 'Cambria Math', 'Candara', 'Comic Sans MS', 'Consolas', 'Constantia', 'Corbel', 'Courier New', 'Ebrima', 'Franklin Gothic Medium', 'Gabriola', 'Gadugi', 'Georgia', 'HoloLens MDL2 Assets', 'Impact', 'Ink Free', 'Javanese Text', 'Leelawadee UI', 'Lucida Console', 'Lucida Sans Unicode', 'Malgun Gothic', 'Marlett', 'Microsoft Himalaya', 'Microsoft JhengHei', 'Microsoft New Tai Lue', 'Microsoft PhagsPa', 'Microsoft Sans Serif', 'Microsoft Tai Le', 'Microsoft YaHei', 'Microsoft Yi Baiti', 'MingLiU-ExtB', 'Mongolian Baiti', 'MS Gothic', 'MV Boli', 'Myanmar Text', 'Nirmala UI', 'Palatino Linotype', 'Segoe MDL2 Assets', 'Segoe Print', 'Segoe Script', 'Segoe UI', 'Segoe UI Historic', 'Segoe UI Emoji', 'Segoe UI Symbol', 'SimSun', 'Sitka', 'Sylfaen', 'Symbol', 'Tahoma', 'Times New Roman', 'Trebuchet MS', 'Verdana', 'Webdings',
'Wingdings', 'Yu Gothic'].sort();
let allSizes = [8, 9, 10, 11, 12, 14, 18, 20, 28, 30, 36, 48, 60, 72];
let menuButton = document.getElementById("menu_button");
let menu = document.getElementById("menu");
let close = document.getElementById("close");
let selectElement = document.getElementById("select_element");
let modifyElement = document.getElementById("modify_element");
let currentElement = document.getElementsByTagName("Body");

// Makes sure only elements available on the page are shown in the menu
elements.forEach(item => {
    let x = document.querySelectorAll(item);
    if(x.length>0){
        let element = document.createElement("input");
        element.setAttribute("type", "radio");
        element.setAttribute("id", item);
        element.setAttribute("name", "elements");
        element.setAttribute("value", item);
        element.setAttribute("onchange", "changeRadio(this)");
        selectElement.appendChild(element);
        let label = document.createElement("label");
        label.appendChild(document.createTextNode(item));
        label.setAttribute("for", item);
        selectElement.appendChild(label);
        selectElement.appendChild(document.createElement("br"));
    }
});
document.getElementById("Body").checked = true;

createLabel("Font: ", "fonts");
let selectFont = createSelect("fonts","Choose a font");

//Puts all the available fonts in an option element
allFonts.forEach(item =>{
    let optionFont = document.createElement("option");
    optionFont.setAttribute("value", item);
    optionFont.style.fontFamily = item;
    optionFont.appendChild(document.createTextNode(item));
    selectFont.appendChild(optionFont);
});

createLabel("Color: ", "color");

let colorPicker = document.createElement("input");
colorPicker.setAttribute("type", "color");
colorPicker.setAttribute("id", "color");
colorPicker.setAttribute("name", "color");
colorPicker.setAttribute("value", "#ffffff");
modifyElement.appendChild(colorPicker);
modifyElement.appendChild(document.createElement("br"));

createLabel("Size: ", "size");
let selectSize = createSelect("size", "Choose a size");

//Shows size options
allSizes.forEach(item =>{
    optionSize = document.createElement("option");
    optionSize.setAttribute("value", item);
    optionSize.style.fontFamily = "Helios Regular,sans-serif";
    optionSize.style.fontSize = '16px';
    optionSize.appendChild(document.createTextNode(item+"px"));
    selectSize.appendChild(optionSize);
});

let submitButton = document.createElement("button");
submitButton.innerHTML = "Submit";
submitButton.id = "submit";
modifyElement.appendChild(submitButton);

//Creates a label
function createLabel(text, f){
    let label = document.createElement("label");
    label.appendChild(document.createTextNode(text));
    label.setAttribute("for", f);
    modifyElement.appendChild(label); 
}

//Creates a select element with placeholder
function createSelect(id, txt){
    let select = document.createElement("select");
    select.setAttribute("name", id);
    select.setAttribute("id", id);
    modifyElement.appendChild(select);

    let option = document.createElement("option");
    option.setAttribute("value", "");
    option.selected = true;
    option.disabled = true;
    option.hidden = true;
    option.appendChild(document.createTextNode(txt));
    select.appendChild(option);
    modifyElement.appendChild(document.createElement("br"));

    return select;
}

//The currentElement variable is set to the currently selected radiobutton
function changeRadio(rButton){
    currentElement = document.getElementsByTagName(rButton.value);
}

//Function to change the font, color and size
function changeElements(currentElement){
    for(let i=0; i<currentElement.length; i++){
        if(currentElement[i].id == "menu"){                     //Doesn't change for the menu.
            currentElement[i].style.fontSize = "20px";          //Changing the font size in the body will automatically include the menu as wellso we have to make sure it goes back to 20px
        }
        else{
        currentElement[i].style.fontSize = selectSize.value+"px";
        currentElement[i].style.color = colorPicker.value;
        currentElement[i].style.fontFamily = selectFont.value;
        changeElements(currentElement[i].children);             //Goes through all children of the current element
        }
    }
}

//Changes are only made when pressing the submit button
submitButton.onclick = function(){
    changeElements(currentElement);
    menu.style.display = "none";
}

//Menu is invisible untill the button is clicked
menuButton.onclick = function(){
    menu.style.display = "block";
}

//Menu becomes invisible again when close is pressed
close.onclick = function(){
    menu.style.display = "none";
}