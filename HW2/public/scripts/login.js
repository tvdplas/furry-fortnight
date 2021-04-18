function Login() {
    let un = document.getElementById("usernameinp").value
    let pw = document.getElementById("pwinp").value

    var xhr = new XMLHttpRequest();
    xhr.open("POST", '/login/', true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.onreadystatechange = () => {
        if (xhr.readyState == 4) {
            let res = JSON.parse(xhr.responseText)
            if (res.errcode == 300) {
                window.location.replace(res.redirect)
            }
            document.getElementById("errmsg")?.remove();
            var node = document.createElement("H2");
            node.id = "errmsg"
            var textnode

            if (res.errcode == 1) {
                textnode = document.createTextNode("Invalid login.");
                node.appendChild(textnode);
                document.getElementById("control-box").appendChild(node);
            }
            else if (res.loggedIn) {
                window.location.replace(res.redirect)
            }

        }
    }
    xhr.send(JSON.stringify({
        un: un,
        pw: pw
    }));
}