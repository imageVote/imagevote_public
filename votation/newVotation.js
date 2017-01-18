
// DEVICE
//device error key
function newKeyConnectionError() {
    if (checkConnection()) {
        flash("retrieve key error");
    }
}

//CONNECTIVITY

NewVotation_newKeyAjax = function (id) {
    var xhr = null;
    var interval = null;

    console.log("update.php request: newkey, " + window.userId);
    $.ajax({
        beforeSend: function (jqXHR, settings) {
            xhr = jqXHR;  // To get the ajax XmlHttpRequest 
        },
        url: window.urlPath + "/core/update.php",
        method: "POST",
        cache: false,
        data: {
            action: "newkey",
            id: window.userId
        }
    }).done(function (res) {
        console.log("NewVotation_newKeyAjax: " + res);
        loadKey(id, res);

    }).error(function (res) {
        console.log(res);
        console.log("new key error !!");
        //if network worked
    }).complete(function () {
        clearInterval(interval);
    });
    //check connection not ends while ajax
    interval = setInterval(function () {
        console.log("5s TIMEOUT");
        if (!checkConnection) {
            //abort ajax
            xhr.abort();
        }
    }, 5000); //timeout: 5 seconds
};
