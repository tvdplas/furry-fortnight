document.getElementById("logbutt").addEventListener("click", Login)

//Onclick handler for the login button
function Login() {
    //Get all form data
    let un = document.getElementById("usernameinp").value
    let pw = document.getElementById("pwinp").value

    var xhr = new XMLHttpRequest();
    xhr.open("POST", './login/', true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.onreadystatechange = () => {
        if (xhr.readyState == 4) {
            //Parse the respons
            let res = JSON.parse(xhr.responseText);

            // If the server wants us to redirect after making the request, we do that
            if (res.errcode == 300) {
                window.location.replace(res.redirect);
                return;
            }

            if (res.loggedIn) {
                window.location.replace(res.redirect)
            }

            // If there was an existing error message, remove it
            document.getElementById("errmsg")?.remove();

            // Pre-create some of the nodes
            var node = document.createElement("H2");
            node.id = "errmsg"
            var textnode

            // If there was an errorcode, handle it
            if (res.errcode == 1) {
                textnode = document.createTextNode("Invalid login.");
            } 
            else if (res.errcode) {
                textnode = document.createTextNode("There was an unknown error");
            }

            node.appendChild(textnode);
            document.getElementById("control-box").appendChild(node);
        }
    }
    //Send the login attempt
    xhr.send(JSON.stringify({
        un: un,
        pw: pw
    }));
}