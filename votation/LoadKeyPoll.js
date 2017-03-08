
var LoadKeyPoll = function (poll) {
    console.log("LoadKeyPoll");
    
    this.poll = window.screenPoll = poll;
    this.key = this.poll.key;

    //first
    loading();

    var isCountry = poll.key.indexOf("-") > 0;
    if (poll.key[0] != "-" || isCountry) {
        console.log("loadKeyPoll public '" + poll.key + "' " + isCountry);
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
};

LoadKeyPoll.prototype.requestPollByKey = function () {
    var key = this.key;
    console.log("requestPollByKey " + key);

    var urlParts = getPathsFromKeyId(key);
    var realPath = urlParts.realPath;
    this.poll.realKey = urlParts.realKey;

    var url = realPath + this.poll.realKey;
    var params = "";
    if ("public" == urlParts.visible) {
        url = window.keysPath + "get.php";
        params = "url=public/" + urlParts.countryPath + this.poll.realKey;
    }
    
    console.log("url: " + realPath + " + " + this.poll.realKey);
    if ("private" == urlParts.visible || "public" == urlParts.visible) {
        if (window.Device) {
            //return on dataIsReady
            //console.log("Device.loadKeyData(" + key + ")");
            //Device.loadKeyData(key);            
            Device.simpleRequest(url, params, "new RequestPollByKeyCallback");

        } else {
            loadAjaxKey(url, params, function (data) {
                new RequestPollByKeyCallback(data);
            });
        }
    }
};

///////////////////////////////////////////////////////////////////////////////

//ON LOAD VOTATION AND STORED
function loadAjaxKey(url, params, callback, findCache) {
    console.log("url: " + url + " on loadAjaxKey()");

    // jquery not allows overrideMimeType
    var xhr = new XMLHttpRequest();
    if (!findCache) {
        params += "nocache=" + (new Date()).getTime();
    }
    xhr.open('POST', url); //absolute no cache
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
    xhr.send(params);
}

////device (allow run directly from android url scratch)
//function dataIsReady(keyId) {
//    //huge js codes cant be sent with loadUrl, only Device function
//    var data = window.Device.getKeyData(keyId);
//    new RequestPollByKeyCallback(keyId, data);
//}

///////////////////////////////////////////////////////////////////////////////

var RequestPollByKeyCallback = function (data) {
    var _this = this;
    this.data = data;
    this.query = "#votation .votationBox";
    
    this.user = window.user;
    this.poll = window.screenPoll;
    
    if (!this.poll) {
        this.poll = new LoadedPoll();
    }

    $("#errorLog").html("");

    if (!data) {
        if (alternative.keysPath && keysPath != alternative.keysPath) {
            keysPath = alternative.keysPath;
            console.log("requestPollByKey again");
            new requestPollByKey();
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
        //TODO: or iPhone on future
        if (!window.isAndroid) {
            noticeBrowser();
            if ("true" == _this.poll.public) {
                disableVotation();
                noticePublic();
            }
        }

        // + buttons
        showVotation(obj.users);
        _this.user = _this.getUser(obj);

        var keyId = _this.poll.key;
        checkCountry(keyId);
    });
};

//parse ajax by userId
RequestPollByKeyCallback.prototype.parseUserVotes = function (callback) {
    var _this = this;
    var data = this.data;

    //wait userId request
    if (!this.user || !this.user.id) {
        console.log("waiting for userId..");
        setTimeout(function () {
            _this.parseUserVotes(callback);
        }, 700);
        return;
    }

    console.log(data);
    var obj = this.poll.obj = parseData(data);

    this.poll.json = data;
    saveLocally(this.poll.key, this.poll.json);

    if (!this.poll.obj) {
        console.log("error parsing object: " + this.poll.json);
        errorParse("e_votationWithErrors");
        return;
    }

    console.log("parseUserVotes newUser");
    this.user = this.getUser(obj);
    saveDefaultValues(this.user.vt);

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

RequestPollByKeyCallback.prototype.getUser = function (obj) {
    var userId = this.user.id;

    if (!obj.users) {
        obj.users = {};
    }

    if (!obj.users[userId]) {
        obj.users[userId] = getUserArray();
    }

    var obj_user = obj.users[userId];
    if (!obj_user) {
        throw "user = " + JSON.stringify(obj_user);
    }
    var userObj = {id: userId, vt: obj_user[1]};
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

//device call
function errorParse(code) {
    console.log("errorParse " + $("html").hasClass("translucent").toString());
    if (window.Device && $("html").hasClass("translucent")) {
        $(".loading").remove();
        flash(transl(code), null, function () {
            Device.close();
        });
        return;
    }
    hashManager.update("home", code);
}

function disableVotation() {
    $("#votation .votationBox").addClass("unClickable");
}
