
// from DEVICE
//device error key
function newKeyConnectionError() {
    if (window.checkConnection()) {
        flash("retrieve key error");
    }
}

//CONNECTIVITY

NewVotation_newKeyAjax = function (id) {
    var xhr = null;
    var interval = null;

    console.log("update.php request: newkey, " + window.user.id);
    $.ajax({
        beforeSend: function (jqXHR, settings) {
            xhr = jqXHR;  // To get the ajax XmlHttpRequest 
        },
        url: window.urlPath + "/core/update.php",
        method: "POST",
        cache: false,
        data: {
            action: "newkey",
            id: window.user.id
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
        if (!window.checkConnection) {
            //abort ajax
            xhr.abort();
        }
    }, 5000); //timeout: 5 seconds
};

////CLICK-TO-VOTE ONLY
//// on 'new' hash
//function newPoll(manually) {
//    console.log("newPoll");
//    //if wrong hash call
//    if (!$("#option1 .option_text").text() || !$("#option2 .option_text").text() || (!window.fromCreateFunction && !manually)) {
//        console.log("wrong values");
//        newPollView();
//        return;
//    }
//
//    loadedPoll = false;
//    resetData();
//
//    var key = screenPoll.key = localStorage.getItem("unusedKey");
//
//    if (!key) {
//        if (window.Device) {
//            console.log("newKey(), call number token: " + window.lastKeyAsk);
//            Device.newKey(window.lastKeyAsk);
//        } else {
//            NewVotation_newKeyAjax(window.lastKeyAsk);
//        }
//    }
//    //echo:
//    else {
//        console.log("using unused key: " + key);
//    }
//
//    window.fromCreateFunction = false;
//
//    var options = [
//        $("#option1").text(),
//        $("#option2").text()
//    ];
//
//    saveDefaultValues(user.vt);
//
//    screenPoll.obj = {
//        options: options,
//        users: {},
//        style: $.extend(true, {}, screenPoll.style)
//    };
//
//    //add user in object ON CREATE
//    if (user.id) {
//        //remove votes on newPoll
//
//        // change userName if needed
//        var userName = $("#username input").val();
//        if (userName != user.name) {
//            user.nm = userName;
//            saveUserName(userName);
//        }
//        screenPoll.obj.users[user.id] = getUserArray(user);
//        screenPoll.obj.style.owner = userName;
//    }

//    fillTable("#votationBox", screenPoll.obj); //table
//    showVotation(screenPoll.obj.users);
//    $("#send").attr("class", "saveAndShare");
//    $("#usersButton").hide(); //not let show users on create
//
//    //create OPTIONS every time for good reset (checkbox ex)
//    $("#onCreateOptions").remove();
//    var options = $("<div id='onCreateOptions'>");
//
//    //OPEN VOTES
//    var openVotes = $("<div id='openVotes'>");
//    var input = $("<input type='checkbox'/>");
//    var txt = $("<span>" + transl("openVotes") + "</span>");
//    openVotes.append(input);
//    openVotes.append(txt);
//    options.append(openVotes);
//
//    input.on("change.onCreateOptions", function () {
//        if ($(this).is(':checked')) {
//            screenPoll.obj.style.openVotes = 1;
//        } else {
//            delete screenPoll.obj.style.openVotes;
//        }
//    });
//    $(document).on("public", function () {
//        $("#openVotes").addClass("hideHeight");
//    });
//    $(document).on("private", function () {
//        $("#openVotes").removeClass("hideHeight");
//    });
//
//    //OPTIONS EVENTS
//    if (screenPoll.obj.options.length > 1) {
//        //colorify text checked
//        $("#onCreateOptions input").on("change.onCreateOptions", function () {
//            if ($(this).is(':checked')) {
//                $(this).parent().addClass("checked");
//            } else {
//                $(this).parent().removeClass("checked");
//            }
//        });
//    }
//}
