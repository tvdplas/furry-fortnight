document.getElementById("regbutt").addEventListener("click", Register)

//Onclick handler for the register event
function Register() {
    // Get all form values
    let un = document.getElementById("usernameinp").value;
    let pw = document.getElementById("pwinp").value;
    let fn = document.getElementById("fninp").value;

    var xhr = new XMLHttpRequest();
    xhr.open("POST", './register/', true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.onreadystatechange = () => {
        if (xhr.readyState == 4) {
            let res = JSON.parse(xhr.responseText);
            
            //If there's an error, handle it
            if (res.errcode) {

                // If we get a negative error code, the register succeeded.
                // The user is then asked to log in
                if (res.errcode == -1) {
                    window.location.replace("./login.html");
                    return;
                }

                //If we have a previous error message, delete it
                document.getElementById("errmsg")?.remove();

                // Pregenerate some of the elements, cause each error uses them
                var node = document.createElement("H2");
                node.id = "errmsg";

                let textnode;

                // Display the correct error message for a code, otherwise, 
                switch(res.errcode) {
                    case 2:
                        textnode = document.createTextNode("Username is too short/long");
                        break;
                    case 3:
                        textnode = document.createTextNode("Password is too short");
                        break;
                    case 4:
                        textnode = document.createTextNode("Full name is too short")
                        break;
                    case 5:
                        textnode = document.createTextNode("User already exists")
                        break;
                    default:
                        textnode = document.createTextNode("An unknown error occured")
                }

                node.appendChild(textnode);
                document.getElementById("control-box").appendChild(node);
            }
        }
    }
    //Once done, send the request
    xhr.send(JSON.stringify({
        un: un,
        pw: pw,
        fn: fn
    }));
}