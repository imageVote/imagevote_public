
function requestPollByKey(key) {
    console.log("requestPollByKey");
    var _args = arguments;

    var urlParts = getPathsFromKeyId(key);
    var realPath = urlParts.realPath;
    screenPoll.realKey = urlParts.realKey;

    if (window.Device) {
        //return on dataIsReady
        console.log("KEY = " + key);
        Device.loadKeyData(key);

    } else {
        var url = realPath + screenPoll.realKey + "?";
        if ("public" == urlParts.visible) {
            url = keysPath + "get.php?url=public/" + urlParts.countryPath + screenPoll.realKey + "&";
        }

        loadAjaxKey(url, function(data) {
            console.log("DATA!!");
            console.log(data);

            if (!data) {
                if (alternative.keysPath && keysPath != alternative.keysPath) {
                    keysPath = alternative.keysPath;
                    console.log("requestPollByKey again");
                    requestPollByKey.apply(this, _args);
                    return;
                }

                error("votationNotFound");
                defaultPage();
                return;
            }

            LoadVotation_parseUserVotes(data, "#votationBox", function(obj) {
                console.log("obj =");
                console.log(obj);

                if (!obj) {
                    pollsView();
                    setTimeout(function(){
                        location.hash = "";
                    },400);
                }

                //TODO: or iphone on future
                if (!isAndroid) {
                    noticeBrowser();
                    if (screenPoll.public) {
                        disableVotation();
                        noticePublic();
                    }
                }

                //buttons
                showVotation(obj.users);

                if (obj.users && obj.users[userId]) {
                    user = LoadVotation_getUser(obj);
                }

                checkCountry(key);

                //url hash callback
                if (window.hashCallback) {
                    console.log("hash = " + location.hash);
                    window.hashCallback();
                    window.hashCallback = null;
                }
            });
        });
    }
}

//huge js codes cant be sent with loadUrl, only Device function
//device 
function dataIsReady(keyId) {
    loadImage(window.Device.getKeyData(keyId), keyId);

    //url hash callback
    if (window.hashCallback) {
        console.log("window.hashCallback() on dataIsReady()");
        window.hashCallback();
    }
}

//device
function loadImage(data, keyId) {
    console.log("load image");
    loadedPoll = true;
    $("#errorLog").html("");

    if (data) {
        if (data[0] == "_") {
            error(data);
        }
        //json = data; //let share directly
        if (keyId) {
            screenPoll.key = keyId;
        }
        var obj = screenPoll.obj = parseData(data);
        if (obj) {

            console.log("loadImage newUser");
            if (obj.users && obj.users[userId]) {
                user = LoadVotation_getUser(obj);
            } else {
                var withVotes = false;
                user = newUser(withVotes); //false
            }

            saveDefaultValues(user.vt);

            console.log(obj);
            fillTable("#votationBox", obj);

            //buttons
            showVotation(obj.users);

            checkCountry(keyId);
        }
    } else {
        error("e_noDataReceived");
    }
}


// PRIVATE FUNCTIONS

//parse ajax by userId
LoadVotation_parseUserVotes = function(data, divQuery, callback) {
    var _args = arguments;
    //wait userId request
    if (!userId) {
        console.log("waiting for userId..");
        setTimeout(function() {
            LoadVotation_parseUserVotes.apply(this, _args);
        }, 700);
        return;
    }

    var obj = screenPoll.obj = parseData(data);

    if (!screenPoll.obj) {
        console.log("error parsing object");
        callback(false);
        return;
    }

    var withVotes = false;
    console.log("LoadVotation_parseUserVotes newUser");
    user = newUser(withVotes); //false
    if (obj.users && obj.users[userId]) {
        user = LoadVotation_getUser(obj);
    }
    saveDefaultValues(user.vt);

    $("#votationOwner").remove();
    if (obj.style.owner) {
        var ownerDiv = $("<div id='votationOwner'><span class='by'>by: </span></div>");
        var text = obj.style.owner;
        text = decode_uri(text);

        var arr = text.split(" ");
        for (var i = 0; i < arr.length; i++) {
            if (isUrl(arr[i])) {
                var url = arr[i];
                if (url.indexOf("http") == -1) {
                    url = "http://" + arr[i];
                }
                arr[i] = "<a href='" + url + "'>" + arr[i] + "</a> ";

                ownerDiv.append(arr[i]);
                continue;
            }
            //prevent code injection
            var span = $("<span>");
            span.text(arr[i] + " ");
            ownerDiv.append(span);
        }
        //ownerDiv.append(".");
        $("#votation").prepend(ownerDiv);
    }

    fillTable(divQuery, obj);
    callback(obj);
};

LoadVotation_getUser = function(obj) {
    var user = obj.users[userId];
    if (!user) {
        throw "user = " + JSON.stringify(user);
    }
    var userObj = {id: user[0], vt: user[1]};
    //add extra values
    if (obj.style.extraValues) {
        for (var i = 0; i < obj.style.extraValues.length; i++) {
            var key = obj.style.extraValues[i];
            userObj[key] = user[2 + i];
        }
    }
    return userObj;
};

function disableVotation() {
    $("#votationBox").addClass("unClickable");
}
