
// DEVICE
//device error key
function newKeyConnectionError() {
    if (checkConnection()) {
        flash("retrieve key error");
    }
}

// on 'new' hash
function newPoll() {
    console.log("newPoll");
    //if worng hash call
    if (!$("#options").val() || !window.fromCreateFunction) {        
        newPollView()
        return;
    }

    loadedPoll = false;
    resetData();

    var key = screenPoll.key = localStorage.getItem("unusedKey");

    if (!key) {
        if (window.Device) {
            console.log("newKey(), call number token: " + window.lastKeyAsk);
            Device.newKey(window.lastKeyAsk);
        } else {
            NewVotation_newKeyAjax(window.lastKeyAsk);
        }
    }
    //echo:
    else {
        console.log("using unused key: " + key);
    }

    window.fromCreateFunction = false;

    var question = $("#question").val();
    var optionsArray = $("#options").val().split('\n');
    var options = []; //object
    for (var i = 0; i < optionsArray.length; i++) {
        var duplicated = false;
        //check duplicates
        for (var j = 0; j < options.length; j++) {
            if (options[j] == optionsArray[i]) {
                duplicated = true;
                break;
            }
        }

        if (optionsArray[i] && !duplicated) {
            options.push(optionsArray[i]);
        }
    }

    saveDefaultValues(user.vt);

    screenPoll.obj = {
        question: question,
        options: options,
        users: {},
        style: $.extend(true, {}, screenPoll.style)
    };

    //add user in object ON CREATE
    if (user.id) {
        //remove votes on newPoll

        // change userName if needed
        var userName = $("#username input").val();
        if (userName != user.name) {
            user.nm = userName;

            if (window.Device) {
                Device.nameUpdate(userName);
            }
            //else, not device way
            localStorage.setItem("userName", userName);
        }
        screenPoll.obj.users[userId] = getUserArray(user);
        screenPoll.obj.style.owner = userName;
    }

    new fillTable("#votationBox", screenPoll.obj); //table
    showVotation(screenPoll.obj.users);
    $("#send").attr("class", "saveAndShare");
    $("#usersButton").hide(); //not let show users on create

    //create OPTIONS every time for good reset (checkbox ex)
    $("#onCreateOptions").remove();
    var options = $("<div id='onCreateOptions'>");

    //MULTIPLE CHOICE
    var multipleChoice = $("<div id='multipleChoice'>"
            + "<input type='checkbox'/><span>" + transl("multipleChoice") + "</span>"
            + "</div>");
    options.append(multipleChoice);

    //OPEN VOTES
    var openVotes = $("<div id='openVotes'>");
    var input = $("<input type='checkbox'/>");
    var txt = $("<span>" + transl("openVotes") + "</span>");
    openVotes.append(input);
    openVotes.append(txt);
    options.append(openVotes);

    input.on("change.onCreateOptions", function () {
        if ($(this).is(':checked')) {
            screenPoll.obj.style.openVotes = 1;
        } else {
            delete screenPoll.obj.style.openVotes;
        }
    });
    $(document).on("public", function () {
        $("#openVotes").addClass("hideHeight");
    });
    $(document).on("private", function () {
        $("#openVotes").removeClass("hideHeight");
    });

//disabled for not being rly nice
//    //ONLY DEVICE
//    if (window.Device && !screenPoll.public) {
//        optionsHtml += "<div id='onlyDevice'>"
//                + "<input type='checkbox'/><span>" + transl("onlyDevice") + "</span>"
//                + "</div>";
//        $(document).on("public", function () {
//            $("#onlyDevice input").addAttr("disbaled", "true");
//        });
//        $(document).on("private", function () {
//            $("#onlyDevice input").removeAttr("disbaled")[0].checked = false;
//        });
//    }

    $("#votationBox").after(options);

    //OPTIONS EVENTS
    if (screenPoll.obj.options.length > 1) {
        //multipleChoice
        $("#multipleChoice").show();
        $("#multipleChoice input").on("change.onCreateOptions", function () {
            //if not selected when changed, check options votation number

            if ($(this).is(':checked')) {
                screenPoll.obj.style.multipleChoice = 1;

            } else {
                if ($("#votationBox input:checked").length > 1) {
                    $("#votationBox tr").each(function () {
                        var option = $(this).attr("class").split("_")[1];
                        console.log(option);
                        unSelectOption(option);
                    });
                }

                delete screenPoll.obj.style.multipleChoice;
            }
        });

        //onlyDevice
        $("#onlyDevice").show();
        $("#onlyDevice input").on("change.onCreateOptions", function () {
            //if not selected when changed, check options votation number

            if ($(this).is(':checked')) {
                screenPoll.obj.style.onlyDevice = 1;

            } else {
                if ($("#votationBox input:checked").length > 1) {
                    $("#votationBox tr").each(function () {
                        var option = $(this).attr("class").split("_")[1];
                        console.log(option);
                        unSelectOption(option);
                    });
                }

                delete screenPoll.obj.style.onlyDevice;
            }
        });

        //colorify text checked
        $("#onCreateOptions input").on("change.onCreateOptions", function () {
            if ($(this).is(':checked')) {
                $(this).parent().addClass("checked");
            } else {
                $(this).parent().removeClass("checked");
            }
        });
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
        url: "http://click-to-vote.at/update.php",
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
