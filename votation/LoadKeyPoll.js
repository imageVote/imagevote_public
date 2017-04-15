
var LoadKeyPoll = function (poll) {
    console.log("LoadKeyPoll " + poll.key);
    $("html").addClass("loadKeyPoll"); //removes on hashManager

    this.poll = window.screenPoll = poll;
    this.key = this.poll.key;

    //first
    loading();

    var isCountry = poll.key.indexOf("-") > 0;
    if ((poll.key[0] != "-" || isCountry) && poll.key.indexOf("_") == -1) {
        poll.isPublic("true");
        if (isCountry) {
            poll.country = poll.key.split("-").shift();
        }

    } else {
        //TODO: activate maybe when app goes big
        //notice(transl("warnNotPublic"));
    }

    this.requestPollByKey();
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
        url = settings.keysPath + "get.php";
        params = "url=public/" + urlParts.countryPath + this.poll.realKey;
    }

    if ("private" == urlParts.visible || "public" == urlParts.visible) {
        console.log("url: " + realPath + " + " + this.poll.realKey);
        if (Device.simpleRequest) {
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

    console.log(data);

    this.user = window.user;
    this.poll = window.screenPoll;

    if (!this.poll) {
        this.poll = new LoadedPoll();
    }

    $("#errorLog").html("");

    if (!data) {
        if (alternative.keysPath && settings.keysPath != alternative.keysPath) {
            settings.keysPath = alternative.keysPath;
            console.log("requestPollByKey again");
            new requestPollByKey();
            return;
        }

        error("votationNotFound");
        error("e_noDataReceived");
        hashManager.defaultPage();
        return;
    }

    if (data[0] == "_") {
        error(data);
    }

    this.parseUserVotes(function (obj) {
        //TODO: or iPhone on future
        if (!window.isAndroid) {
            noticeBrowser();
            if ("true" == _this.poll._public) {
                disableVotation();
                noticePublic();
            }
        }

        // + buttons
        showVotation(obj.users);
        _this.user = _this.getUser(obj);

        var keyId = _this.poll.key;
        _this.checkCountry(keyId);
    });
};

//parse ajax by userId
RequestPollByKeyCallback.prototype.parseUserVotes = function (callback) {
    var data = this.data;
    var obj = this.poll.obj = parseData(data);

    this.poll.json = data;
    saveLocally(this.poll.key, this.poll.json);

    if (!this.poll.obj) {
        console.log("error parsing object: " + this.poll.json);
        errorParse("e_votationWithErrors");
        return;
    }

    console.log("parseUserVotes newUser " + window.user.id);
    var user = this.getUser(obj);
    saveDefaultValues(user.vt);
    this.user = user;

    $("#votationOwner").remove();
    if (obj.style && !empty(obj.style.owner)) {
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

RequestPollByKeyCallback.prototype.checkCountry = function (keyId) {
    if (keyId[0] == "-") {
        return;
    }
    var country = keyId.split("-").shift();

    if (country) { //then is public
        var countryName = getCountryName(country.toUpperCase(), getUserLang());

        if (!isUserCountry(country)) {
            if ("undefined" != typeof publicId && publicId) {
                disableVotation();
                notice(transl("WrongCountry") + countryName + ".");
            }
            //ELSE ask phone when click

        } else {
            //only say country disponibility if not errors or notices ¿?
            if ($("#linksLink").html() == "") {
                notice(lang["PollOnlyAvailableIn"] + countryName + ".");
            }
        }
    }
}

//device call
function errorParse(code) {
    console.log("errorParse " + $("html").hasClass("translucent").toString());
    if (Device.close && $("html").hasClass("translucent")) {
        $(".loading").remove();
        flash(transl(code), null, function () {
            Device.close("errorParse " + code);
        });
        return;
    }
    hashManager.update("home", code);
}

function disableVotation() {
    $("#votation .votationBox").addClass("unClickable");
}
