function Register() {
    let un = document.getElementById("usernameinp").value
    let pw = document.getElementById("pwinp").value
    let fn = document.getElementById("fninp").value

    var xhr = new XMLHttpRequest();
    xhr.open("POST", '/register/', true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.onreadystatechange = () => {
        if (xhr.readyState == 4) {
            let res = JSON.parse(xhr.responseText)
            console.log(res)
            if (res.errcode) {

                if (res.errcode == -1) {
                    window.location.replace("/login.html")
                }

                document.getElementById("errmsg")?.remove();
                var node = document.createElement("H2");
                node.id = "errmsg"
                var textnode
                if (res.errcode == 2) {
                    textnode = document.createTextNode("Username is too short/long");
                }
                else if (res.errcode == 3) {
                    textnode = document.createTextNode("Password is too short");
                }
                else if (res.errcode == 4) {
                    textnode = document.createTextNode("Full name is too short")
                }
                node.appendChild(textnode);
                document.getElementById("control-box").appendChild(node);

            }
        }
    }
    xhr.send(JSON.stringify({
        un: un,
        pw: pw,
        fn: fn
    }));
}