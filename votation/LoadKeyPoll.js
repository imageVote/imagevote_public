
var LoadKeyPoll = function (poll) {
    console.log("LoadKeyPoll " + poll.key);
    $("html").addClass("loadKeyPoll"); //removes on hashManager

    this.poll = window.screenPoll = poll;

    if (this.poll.key.indexOf("_") > -1) {
        console.log("w8 auto.load from GamePoll classes");
        return;
    }

    //first
    loading(null, "LoadKeyPoll");

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
    var key = this.poll.key;
    console.log("requestPollByKey " + key);

    var urlParts = getPathsFromKeyId(key);
    this.poll.realKey = urlParts.realKey;

    var callback = "loadKeyPoll";
    window[callback] = this;
    loadPollByKey(key, "requestPollByKeyCallback", callback);
};

LoadKeyPoll.prototype.requestPollByKeyCallback = function (json) {
    console.log("RequestPollByKeyCallback");
    var _this = this;
    this.user = window.user;

    if (!this.poll) {
        this.poll = new LoadedPoll("requestPollByKeyCallback");
    }
    console.log(this.poll);

    $("#errorLog").html("");
    this.poll.obj = parseKeyPoll(json, this.poll.key);

    if (!this.poll.obj) {
        console.log("!obj");
        error("votationNotFound");
        error("e_noDataReceived");
        hashManager.defaultPage();
        return;
    }

    this.parseUserVotes();

    //TODO: or iPhone on future
    if (!window.isAndroid) {
        noticeBrowser();
    }
    var keyId = this.poll.key;
    this.checkCountry(keyId);

    this.query = "#votation .votationBox";
    if (keyId.indexOf("_") > -1) {
        this.query = "#pollsPage .gameContainer";
    }

    //allow hash and search
    if (location.href.indexOf("share=") > -1) {
        loading(null, "RequestPollByKeyCallback");
        console.log("share in " + location.href);

        var arr = location.href.split("share=")[1].split("&")[0].split("_");
        //remove empty's between "_"
        arr = $.grep(arr, function (n) {
            return n === 0 || n;
        });
        for (var i = 0; i < arr.length; i++) {
            console.log("option " + i + ": " + arr[i]);
            if (this.poll.obj.options[i]) {
                this.poll.obj.options[i][2] = arr[i];
            }
        }

        var show;
        if (arr.length) {
            show = true;
        }
        new Share(this.poll).do(function () {
            if (Device.close) {
                Device.close("sharing");
            }
        }, show);

        return false;
    }

    console.log(this);
    //save on change option included
    window.loadedTable = new FillTable(this.query, this.poll);
    
    if (!window.Device) {
        //add sharing in browser:
        shareIntent.checkShareEnvirontment(loadedTable.$div.find(".option"), this.poll.obj.options);
    }

    // + buttons
    this.showVotation();
    this.user = _this.getUser();

    //this.uploadImage(keyId, obj);
    loaded();
};

//parse ajax by userId
LoadKeyPoll.prototype.parseUserVotes = function () {
    var obj = this.poll.obj;

    if (!obj) {
        console.log("error parsing object: " + obj);
        this.errorParse("e_votationWithErrors");
        return;
    }

    console.log("parseUserVotes newUser " + window.user.id);
    var user = this.getUser();
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
};

LoadKeyPoll.prototype.getUser = function () {
    var obj = this.poll.obj;
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

    console.log(JSON.stringify(userObj))
    return userObj;
};

LoadKeyPoll.prototype.checkCountry = function (keyId) {
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
                notice(transl("PollOnlyAvailableIn") + countryName + ".");
            }
        }
    }
};

//on load:
LoadKeyPoll.prototype.uploadImage = function (keyId, obj) {
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

LoadKeyPoll.prototype.showVotation = function () {
    console.log("RequestPollByKeyCallback.showVotation()");
    var poll = this.poll;
    var users = this.poll.obj.users;
    
    var $dom = $("#votation");
    $("#mainPage > div").hide();
    $dom.show();

    //public is defined on load html
    //VOTATION BUTTONS:
    poll.buttons = new VotationButtons(poll, $dom);
    poll.buttons.init();
    $("#send").hide();

    var style = poll.style;
    if (style && style.extraValues) {
        for (var i = 0; i < style.extraValues.length; i++) {
            if ("nm" == style.extraValues[i]) {
                var nameIndex = 2 + i;
                var someName = false;

                if (users) {
                    for (var id in users) {
                        var user = users[id];
                        if (user[nameIndex] && (user[1] || 0 === user[1])) {
                            console.log("some name exists: " + user[nameIndex] + " , " + user[1]);
                            someName = true;
                            break;
                        }
                    }
                }

                if (!someName) {
                    console.log("any 'nm' in obj.users - disable button");
                    $('#usersButton').addClass("disabled");
                }
                //break 'nm' value search
                break;
            }
        }
    }

    $("#send").removeAttr("disabled");

    //if private, add name input
    //new AskUserName();
};

LoadKeyPoll.prototype.errorParse = function (code) {
    console.log("errorParse " + $("html").hasClass("translucent").toString());
    if (Device.close && $("html").hasClass("translucent")) {
        loaded();
        flash(transl(code), null, function () {
            Device.close("errorParse " + code);
        });
        return;
    }
    hashManager.update("home", code);
};

///////////////////////////////////////////////////////////////////////////////

//ON LOAD VOTATION AND STORED
//only ajax, not Device
function loadPollByKey(keyId, callback, obj) {

//    TODO: FROM SELECT.PHP
    var table = "";
    var arr = keyId.split("_");
    if(arr.length > 1){
        table = arr[0];
    }
    var id = idKey(keyId);

    var url = "select.php";
    var params = {
        id: id,
        table: table
    };

    //LANGUAGE KEY_ID parseSelect GAME CASE:
//    var parseLanguages = ["en", "es", "pt", "it", "fr", "de"];
////    if (keyId.indexOf("_") > -1) {
//    if (parseLanguages.indexOf(keyId + "_") > -1) {
//        url = "parseSelect.php";
//        var lang = keyId.split("_")[0];
//        params.table = "preguntas" + lang.toUpperCase();
//
//        params.id = keyId.split("_")[1];
//        var local = localStorage.getItem("q_" + lang);
//        if (local) {
//            var poll = JSON.parse(local)[params.id];
//            if (poll) {
//                params = {
//                    table: table,
//                    objectId: poll.key
//                };
//            }
//        }
//    }

    if (Device.simpleRequest) {
        var string_params = "";
        for (var key in params) {
            string_params += key + "=" + params[key] + "&";
        }
        Device.simpleRequest(url, string_params, obj + "." + callback, "");

    } else {
        $.post(settings.corePath + url, params, function (json) {
            console.log(json);
            window[obj][callback](json);
        });
    }
}

function parseKeyPoll(json, keyId) {
    var arr;
    try {
        arr = JSON.parse(json);
    } catch (e) {
        console.log("ERROR PARSING " + json);
        return false;
    }
    var res = arr[0];

    //RECOVER STORED POLL USER VOTES
    var users = {};
    var saved = localStorage.getItem("key_" + keyId);
    if (saved) {
        var saved_obj = JSON.parse(saved);
        users = saved_obj.users;
    }

    //CASE GAME 
    if (!res && arr.results) {
        console.log(arr);
        var data = arr.results[0];

        if (!data) {
            console.log("!data");
            return false;
        }

        var table = "";
        if (keyId.indexOf("_") > -1) {
            var lang = keyId.split("_")[0];
            table = "preguntas" + lang.toUpperCase();
        } else if (keyId.indexOf("-") > -1) {
            table = keyId.split("-")[0];
        }

        if (!saved && table) {
            var local = JSON.parse(localStorage.getItem(table));
            if (local) {
                var poll = local[data.id];
                if (poll) {
                    console.log("votes?: " + poll.a);
                    users[window.user.id] = poll.a;
                }
            }
        }
        console.log(users);

        var obj = {
            question: "",
            options: [
                [0, data.first, data.first_nvotes],
                [1, data.second, data.second_nvotes]
            ],
            style: {},
            users: users
        };

        return obj;
    }

    if (!res) {
        return false;
    }

    var data = res.data.split("|");
    var opts = JSON.parse(data[1]);

    var obj = {
        question: data[0],
        options: [
            [0, opts[0], res.v0],
            [1, opts[1], res.v1]
        ],
        style: data[2],
        users: users
    };

    return obj;
}

///////////////////////////////////////////////////////////////////////////////

//DEVICE CALL TOO!
function disableVotation() {
    $("#votation .votationBox").addClass("unClickable");
}
