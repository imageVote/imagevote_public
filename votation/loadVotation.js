
function loadKeyPoll() {
    //first
    loading();

    var isCountry = screenPoll.key.indexOf("-") > 0;
    if (screenPoll.key[0] != "-" || isCountry) {
        //public = true;
        screenPoll.isPublic("true");
        if (isCountry) {
            screenPoll.country = screenPoll.key.split("-").shift();
        }

    } else {
        //TODO: activate maybe when app goes big
        //notice(transl("warnNotPublic"));
    }

    requestPollByKey(screenPoll.key);

    //prevent swipe events
    $(document).on("swiperight.swipePrevent swipeleft.swipePrevent touchstart.swipePrevent touchend.swipePrevent touchup.swipePrevent", function (e) {
        e.stopPropagation();
    });
}

function requestPollByKey(key) {
    console.log("requestPollByKey");
    var _args = arguments;

    var urlParts = getPathsFromKeyId(key);
    var realPath = urlParts.realPath;
    screenPoll.realKey = urlParts.realKey;

    if (window.Device) {
        //return on dataIsReady
        console.log("Device.loadKeyData(" + key + ")");
        Device.loadKeyData(key);

    } else {
        var url = realPath + screenPoll.realKey + "?";
        if ("public" == urlParts.visible) {
            url = keysPath + "get.php?url=public/" + urlParts.countryPath + screenPoll.realKey + "&";
        }

        loadAjaxKey(url, function (data) {
            //console.log(data);

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

            LoadVotation_parseUserVotes(data, "#votation .votationBox", function (obj) {
                console.log("obj =");
                console.log(obj);

                if (!obj) {
                    pollsView();
                    setTimeout(function () {
                        location.hash = "";
                    }, 400);
                }

                //TODO: or iphone on future
                if (!isAndroid) {
                    noticeBrowser();
                    if (screenPoll.public) {
                        disableVotation();
                        noticePublic();
                    }
                }

                // + buttons
                showVotation(obj.users);

                if (obj.users && obj.users[user.id]) {
                    user = LoadVotation_getUser(obj);
                }

                checkCountry(key);
            });
        });
    }
}

//ON LOAD VOTATION AND STORED
function loadAjaxKey(url, callback, findCache) {
    console.log("url: " + url + " on loadAjaxKey()");

    // jquery not allows overrideMimeType
    var xhr = new XMLHttpRequest();
    var nocache = "nocache=" + (new Date()).getTime();
    if (findCache) {
        nocache = "";
    }
    xhr.open('GET', url + nocache); //absolute no cache
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                callback(xhr.responseText);
            } else {
                console.log("Error " + xhr.status + " occurred uploading your file.");
                callback(false);
            }
        }
    };
    // important 4 accents and, ñ, etc..
    xhr.overrideMimeType('text/plain; charset=ISO-8859-1');
    xhr.send();
}

//huge js codes cant be sent with loadUrl, only Device function
//device 
function dataIsReady(keyId) {
    loadImage(window.Device.getKeyData(keyId), keyId);
}

//device
function loadImage(data, keyId) {
    console.log("load image key: " + keyId);
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
            if (obj.users && obj.users[user.id]) {
                user = LoadVotation_getUser(obj);
            } else {
                //user = newUser();
            }

            saveDefaultValues(user.vt);

            console.log(obj);
            window.loadedTable = new fillTable("#votation .votationBox", obj);

            // + buttons
            showVotation(obj.users);

            checkCountry(keyId);
        }
    } else {
        error("e_noDataReceived");
    }
}


// PRIVATE FUNCTIONS

//parse ajax by userId
LoadVotation_parseUserVotes = function (data, divQuery, callback) {
    var _args = arguments;
    //wait userId request
    if (!window.user.id) {
        console.log("waiting for userId..");
        setTimeout(function () {
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

    console.log("LoadVotation_parseUserVotes newUser");
    //user = newUser();
    if (obj.users && user && obj.users[user.id]) {
        user = LoadVotation_getUser(obj);
    }
    saveDefaultValues(user.vt);

    $("#votationOwner").remove();
    if (obj.style && obj.style.owner) {
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

    window.loadedTable = new fillTable(divQuery, obj);
    callback(obj);
};

LoadVotation_getUser = function (obj) {
    var obj_user = obj.users[user.id];
    if (!obj_user) {
        throw "user = " + JSON.stringify(obj_user);
    }
    var userObj = {id: obj_user[0], vt: obj_user[1]};
    //add extra values
    if (obj.style && obj.style.extraValues) {
        for (var i = 0; i < obj.style.extraValues.length; i++) {
            var key = obj.style.extraValues[i];
            userObj[key] = obj_user[2 + i];
        }
    }
    console.log(userObj);
    return userObj;
};

function disableVotation() {
    $("#votation .votationBox").addClass("unClickable");
}
