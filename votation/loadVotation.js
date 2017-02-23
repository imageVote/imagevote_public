
function loadKeyPoll(poll) {
    this.poll = screenPoll = poll;
    this.key = this.poll.key;
    
    this.query = "#votation .votationBox";
    
    //first
    loading();

    var isCountry = poll.key.indexOf("-") > 0;
    if (poll.key[0] != "-" || isCountry) {
        //public = true;
        poll.isPublic("true");
        if (isCountry) {
            poll.country = poll.key.split("-").shift();
        }

    } else {
        //TODO: activate maybe when app goes big
        //notice(transl("warnNotPublic"));
    }

    this.requestPollByKey();

    //prevent swipe events
    $(document).on("swiperight.swipePrevent swipeleft.swipePrevent touchstart.swipePrevent touchend.swipePrevent touchup.swipePrevent", function (e) {
        e.stopPropagation();
    });
}

loadKeyPoll.prototype.requestPollByKey = function () {
    var _this = this;
    var key = this.key;
    console.log("requestPollByKey " + key);

    var urlParts = getPathsFromKeyId(key);
    var realPath = urlParts.realPath;
    this.poll.realKey = urlParts.realKey;

    if (window.Device) {
        //return on dataIsReady
        console.log("Device.loadKeyData(" + key + ")");
        Device.loadKeyData(key);

    } else {
        if ("game" == urlParts.visible) {
            console.log($("#pollsPage").length)
//            loadHash("polls");
            window.gamePollKey = new GamePoll("#pollsPage", urlParts.keyId, "gamePollKey");
            $("html").removeClass("withoutHeader");
            $("#body").addClass("pollsView");
            return;
        }

        var url = realPath + screenPoll.realKey + "?";
        if ("public" == urlParts.visible) {
            url = window.keysPath + "get.php?url=public/" + urlParts.countryPath + screenPoll.realKey + "&";
        }

        loadAjaxKey(url, function (data) {
            _this.data = data;
            _this.requestPollByKeyCallback();
        });
    }
};

loadKeyPoll.prototype.requestPollByKeyCallback = function () {
    var _this = this;
    var data = this.data;
    
    window.loadedPoll = true;
    $("#errorLog").html("");

    if (!data) {
        if (alternative.keysPath && keysPath != alternative.keysPath) {
            keysPath = alternative.keysPath;
            console.log("requestPollByKey again");
            this.requestPollByKey();
            return;
        }

        error("votationNotFound");
        error("e_noDataReceived");
        defaultPage();
        return;
    }

    if (data[0] == "_") {
        error(data);
    }

    this.parseUserVotes(function (obj) {
        if (!obj) {
            loadHash("home", "votationNotFound");
            return;
        }

        //TODO: or iphone on future
        if (!window.isAndroid) {
            noticeBrowser();
            if ("true" == _this.poll.public) {
                disableVotation();
                noticePublic();
            }
        }

        // + buttons
        showVotation(obj.users);
        window.user = _this.LoadVotation_getUser(obj);

        checkCountry(key);
    });
};

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

//device 
loadKeyPoll.prototype.dataIsReady = function (keyId) {
    //huge js codes cant be sent with loadUrl, only Device function
    this.data = window.Device.getKeyData(keyId);
    this.requestPollByKeyCallback();
};

//parse ajax by userId
loadKeyPoll.prototype.parseUserVotes = function (callback) {
    var _this = this;
    var _args = arguments;
    var data = this.data;
    
    //wait userId request
    if (!window.user || !window.user.id) {
        console.log("waiting for userId..");
        setTimeout(function () {
            _this.parseUserVotes(callback);
        }, 700);
        return;
    }

    var obj = this.poll.obj = parseData(data);

    this.poll.json = data;
    saveLocally(this.poll.key, this.poll.json);

    if (!this.poll.obj) {
        console.log("error parsing object");
        callback(false);
        return;
    }

    console.log("LoadVotation_parseUserVotes newUser");
    window.user = this.LoadVotation_getUser(obj);
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

    window.loadedTable = new FillTable(this.query, obj);
    callback(obj);
};

loadKeyPoll.prototype.LoadVotation_getUser = function (obj) {
    if (!obj.users) {
        obj.users = {};
    }
//    if (!window.user) {
//        window.user = new User();
//    }
    if (!obj.users[user.id]) {
        obj.users[user.id] = window.user;
    }

    var obj_user = obj.users[user.id];
    if (!obj_user) {
        throw "user = " + JSON.stringify(obj_user);
    }
    var userObj = {id: user.id, vt: obj_user[1]};
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
