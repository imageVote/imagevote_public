
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
//    var realPath = urlParts.realPath;
    this.poll.realKey = urlParts.realKey;

//    var url = realPath + key;
//    var params = "";
//    if ("public" == urlParts.visible) {
//        url = settings.keysPath + "get.php";
//        params = "url=public/" + urlParts.countryPath + this.poll.realKey;
//    }

//    if ("private" == urlParts.visible || "public" == urlParts.visible) {
//        console.log("url: " + realPath + " + " + this.poll.realKey);
//        if (Device.simpleRequest) {
//            //return on dataIsReady
//            //console.log("Device.loadKeyData(" + key + ")");
//            //Device.loadKeyData(key);            
//            Device.simpleRequest(url, params, "new RequestPollByKeyCallback", "\\n");
//
//        } else {

    loadAjaxKey(key, function (data) {
//    loadAjaxKey(url, params, function (data) {
        new RequestPollByKeyCallback(data);
    });
//        }
};

///////////////////////////////////////////////////////////////////////////////

//ON LOAD VOTATION AND STORED
function loadAjaxKey(keyId, callback) {
//function loadAjaxKey(url, params, callback, findCache) {
//    url = url.slice(0, -1);

    // jquery not allows overrideMimeType
//    var xhr = new XMLHttpRequest();
//    if (!findCache) {
//        params += "nocache=" + (new Date()).getTime();
//    }
//    xhr.open('GET', url); //absolute no cache
//    xhr.onreadystatechange = function () {
//        if (xhr.readyState === 4) {
//            if (xhr.status === 200) {
//                callback(xhr.responseText);
//            } else {
//                console.log("Error " + xhr.status + " occurred uploading your file.");
//                callback(false);
//            }
//        }
//    };
//    // important 4 accents and, ñ, etc..
//    xhr.overrideMimeType('text/plain; charset=ISO-8859-1');
//    xhr.send(params);

//    TODO: FROM SELECT.PHP
    var table = "";
    var key64 = "";
    if (keyId.indexOf("_") > -1) {
        var arr = keyId.split("_");
        table = arr[0];
        key64 = arr[1];
    }
    if (keyId.indexOf("-") > -1) {
        var arr = keyId.split("-");
        table = arr[0];
        key64 = arr[1];
        //remove last
        if (keyId.indexOf("-") === 0) {
            key64 = key64.substring(0, key64.length - 1);
        }
    }
    console.log("key64: " + key64)
    var id = convertBase(key64, window.base62, window.base10);

    var url = "core/select.php";
    if (keyId.indexOf("_") > -1) {
        url = "core/parseSelect.php";
        table = "preguntas" + keyId.split("_")[0];
        id = keyId.split("_")[1];
    }

    $.post(url, {
        id: id,
        key: keyId,
        table: table
    }, function (json) {
        console.log(json)

        var arr;
        try {
            arr = JSON.parse(json);
        } catch (e) {
            console.log("ERROR PARSING " + json);
            callback(false);
            return;
        }
        var res = arr[0];

        //CASE PARSE 
        if (!res && arr.results) {
            console.log(arr);
            var data = arr.results[0];
            
            if(!data){
                callback(false);
                return;
            }

            var users = {};
            var saved = localStorage.getItem("key_" + keyId);
            if (saved) {
                var saved_obj = JSON.parse(saved);
                for (var user in saved_obj.users) {
                    users[user] = saved_obj.users[user];
                }
            }

            var obj = {
                question: "",
                options: [
                    [0, data.first, data.first_nvotes],
                    [1, data.second, data.second_nvotes]
                ],
                style: {},
                users: users
            };

            callback(obj);
            saveLocally(keyId, obj);
            return;
        }

        if (!res) {
            callback(false);
            return;
        }

        var data = res.data.split("|");
        var opts = JSON.parse(data[1]);

        var users = {};
        var saved = localStorage.getItem("key_" + keyId);
        if (saved) {
            var saved_obj = JSON.parse(saved);
            for (var user in saved_obj.users) {
                users[user] = saved_obj.users[user];
            }
        }

        var obj = {
            question: data[0],
            options: [
                [0, opts[0], res.v0],
                [1, opts[1], res.v1]
            ],
            style: data[2],
            users: users
        };

        callback(obj);
        saveLocally(keyId, obj);
    });

}

////device (allow run directly from android url scratch)
//function dataIsReady(keyId) {
//    //huge js codes cant be sent with loadUrl, only Device function
//    var data = window.Device.getKeyData(keyId);
//    new RequestPollByKeyCallback(keyId, data);
//}

///////////////////////////////////////////////////////////////////////////////

var RequestPollByKeyCallback = function (obj) {
    var _this = this;
//    this.data = data;
    this.query = "#votation .votationBox";
//    console.log("RequestPollByKeyCallback " + data);

    this.user = window.user;
    this.poll = window.screenPoll;

    if (!this.poll) {
        this.poll = new LoadedPoll();
    }

    $("#errorLog").html("");

    if (!obj) {
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

    if (obj[0] == "_") {
        error(obj);
    }

    this.poll.obj = obj;

    this.parseUserVotes(function (obj) {
        //TODO: or iPhone on future
        if (!window.isAndroid) {
            noticeBrowser();
//            if ("true" == _this.poll._public) {
//                disableVotation();
//                noticePublic();
//            }
        }

        // + buttons
        showVotation(obj.users);
        _this.user = _this.getUser(obj);

        var keyId = _this.poll.key;
        _this.checkCountry(keyId);

        //this.uploadImage(keyId, obj);
    });
};

//parse ajax by userId
RequestPollByKeyCallback.prototype.parseUserVotes = function (callback) {
//    var obj = this.poll.obj = parseData(data);
    var obj = this.poll.obj

    if (!obj) {
        console.log("error parsing object: " + obj);
        errorParse("e_votationWithErrors");
        return;
    }

    console.log("parseUserVotes newUser " + window.user.id);
    var user = this.getUser(obj);
    saveDefaultValues(user.vt);
    this.user = user;

    $("#votationOwner").remove();
    if (obj.style && !empty(obj.style.owner)) {
        console.log("obj.style: " + JSON.stringify(obj.style));
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

    console.log(obj)
    window.loadedTable = new FillTable(this.query, obj);
    if (!window.Device) {
        //add sharing in browser:
        shareIntent.checkShareEnvirontment(loadedTable.$div.find(".option"), obj.options);
    }

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
//    if (keyId[0] == "-") {
    return;
//    }
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
};

//on load:
RequestPollByKeyCallback.prototype.uploadImage = function (keyId, obj) {
    var _this = this;

    var div = $("<div style='display:none'>");
    $("body").append(div);
    getCanvasImage(div, obj, keyId, 506, "", function (base64) {
        $.post(settings.imagesURL, {
            name: _this.poll.key,
            base64: base64
        }, function (data) {
            console.log(data);
        });
    });
};

//device call
function errorParse(code) {
    console.log("errorParse " + $("html").hasClass("translucent").toString());
    if (Device.close && $("html").hasClass("translucent")) {
        loaded();
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
