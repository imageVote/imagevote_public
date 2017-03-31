
VotationButtons = function () {
    var buttonsHTML = "<div id='defaultButtons'>"
            + "<button id='send' class='share'><em></em><span data-lang='Share'></span></button>"
            + "<button id='cancel' data-lang='Cancel'></button>"
            + "</div>"
            + "<button id='usersButton' data-lang='Voters'></button>";

    //create BUTTONS every time for good reset (class saveAndshare ex.)
    $("#defaultButtons").remove();
    $("#usersButton").remove();
    $("#votationButtons").prepend(buttonsHTML);
    loadTranslations();

    this.VotationButtons_send();
    this.VotationButtons_cancel();
    this.VotationButtons_users();
    $("#buttons").show();
};

VotationButtons.prototype.VotationButtons_send = function () {
    console.log("VotationButtons.VotationButtons_send original")

    $("#send").click(function (e) {
        if (window.preventSendEvents) {
            console.log("preventSendEvents");
            return;
        }

        //prevent docuble tap save and share ?
        e.stopPropagation();
        $("body").append("<img from='votationEvents_buttonsEvents' class='loading absoluteLoading' src='~img/loader.gif'/>");

        var obj = screenPoll.obj;
        console.log(obj);

        //IF SAVE and/or SHARE
        //prevent sav and share if premium cose not key con be loaded!
        if ($("#send").hasClass("saveAndShare")) {
            if (!obj.users) {
                obj.users = [];
            }
            //save user on screenPoll 'obj' (1st time)
            obj.users[window.user.id] = getUserArray(window.user);

            //.SaveAndShare class includes votationEvents_shareButton!
            votationEvents_saveButton("create", obj, function (done) {
                if (false === done) {
                    $(".absoluteLoading").remove();
                    return;
                }
                localStorage.setItem("unusedKey", "");
            });

        } else if (!$("#send").hasClass("share")) { //class is save
            $("#send").attr("disabled", "disabled");
            votationEvents_saveButton("update", obj, function (done) {
                $(".absoluteLoading").remove();
                if (false !== done) {
                    saveToShare();
                }
            });

        } else { //share
            votationEvents_shareButton(screenPoll, function () {
                $(".absoluteLoading").remove();
            });
        }
    });
};

VotationButtons.prototype.VotationButtons_cancel = function () {

    $("#cancel").click(function () {
        window.screenPoll = new LoadedPoll();

        if (window.isTranslucent) {
            if (Device.close) {
                console.log("closing.. window.isTranslucent: " + window.isTranslucent);
                Device.close("VotationButtons_cancel window.isTranslucent");
                return;
            }
        }
        if (window.keyLinkPage) {
            if (document.referrer.indexOf(window.location.host) > -1 || true) {
                window.history.back();

                if (history.length <= 1 && Device.close) {
                    console.log("no history close");
                    Device.close("window.keyLinkPage & history.length <= 1");
                }

            } else {
                hashManager.update("polls");
            }
        } else {
//            hashManager.defaultPage();
//            $("html").removeClass("withoutHeader");
//            //reset main but not show
//            $("#mainPage > div").hide();
//            $("#creator").show();
//            location.hash = "polls";
            hashManager.update("");
        }

        $(document).off(".swipePrevent");
    });
};

VotationButtons.prototype.VotationButtons_users = function () {
    //voters users
    var obj = window.screenPoll.obj;
    var users = obj.users;

    var nameIndex;
    if (obj.style && obj.style.extraValues) {
        for (var i = 0; i < obj.style.extraValues.length; i++) {
            if ("nm" == obj.style.extraValues[i]) {
                nameIndex = 2 + i;
                break;
            }
        }
    }

    var unknown = 0;
    var voters = [];
    for (var id in users) {
        var user = users[id];

        //if not vote, not show
        var userVotes = user[1];
        if (!userVotes && 0 !== userVotes) {
            continue;
        }

        var name = user[nameIndex];
        if (!name || (!user[1] && 0 !== user[1])) {
            unknown++;
            continue;
        }

        voters.push(user);
    }

    //prevent show voters button if no voters exist
    if (voters.length < 2) {
        $("#usersButton").hide();
        return;
    }

    $("#usersButton").click(function () {
        $("#users .list").html("");

        //SORT
        var arrUsers = [];
        for (var id in voters) {
            arrUsers.push(voters[id]);
        }
        arrUsers.sort(function (a, b) {
            return a[nameIndex].localeCompare(b[nameIndex]);
        });

        for (var i = 0; i < arrUsers.length; i++) {
            var user = arrUsers[i];
            var id = user[0];

            var from = user[nameIndex + 1];

            //ROW
            var html = "<div id='user_" + id + "'> <div class='left'><div class='usr'>" + decode_uri(name);
            if (from) {
                if ("_" == from[0]) {
                    from = transl(from.substr(1));
                }
                html += " <small style='color: rgba(0,0,0,0.3)'>(" + from + ")</small>";
            }
            html += "</div></div>";

            //show voters votes
            if (obj.style.openVotes) {
                html += "<div class='right'><span>" + obj.options[user[1]] + "</span></div>";
            }

            html += "</div>";

            var tr = $(html);
            $("#users .list").append(tr);
        }

        var len = $("#users .list > div").length;
        if (len) {
            if (unknown) {
                var tr = $("<tr><td>(and " + unknown + " " + transl("unknown") + ")</td></tr>");
                $("#users table").append(tr);
            }

            $("#mainPage > div").hide();
            $("#users").show();
        } else {
            flash(lang["notPublicUsers"]);
        }
    });
};

window._ajaxKeyWaiting = 0;
//not pass obj for function. this is a Device function.
var votationEvents_shareButton = function (poll, callback) {
    console.log(poll);
    var _args = arguments;

    if (!$("#shareButtonLoading").length) {
        $("body").append("<img from='votationEvents_shareButton' id='shareButtonLoading' class='loading absoluteLoading' src='~img/loader.gif'/>");
    }

    console.log("votationEvents_shareButton");
    if (!Device.share && !poll.key) {
        //if not seems respond
        if (window._ajaxKeyWaiting > 10) {
            window._ajaxKeyWaiting = 0;
            error("missingAjaxKey");
            if (callback) {
                callback(false);
            }
            return;
        }
        window._ajaxKeyWaiting++;

        setTimeout(function () {
            console.log("waiting ajax key..");
            votationEvents_shareButton.apply(this, _args);
        }, 700);
        return;
    }
    window._ajaxKeyWaiting = 0;

    console.log("country = " + poll.country);
    var keyId = poll.key;
    var divQuery = "#image .image";

    $("#image").remove();
    var div = $("<div id='image'><hr/><div class='image'></div></div>");
    $("#mainPage").append(div);

    var type = "";
    if ($(poll.divQuery).hasClass("show")) {
        type = "show";
    }

    var width = null;
    getCanvasImage(divQuery, poll.obj, keyId, width, type, function (imgData) {
        if (!imgData) {
            error("!imgData on getCanvasImage");
            return;
        }
        if (Device.share) {
            div.hide();
            votationEvents_deviceShare(keyId, imgData);

        } else {
            $("#stored").addClass("hidden");
            div.show();
            //votationEvents_saveImageLocally(keyId, imgData);
        }

        if (callback) {
            callback(true);
        }
    });
};

//device function too !
var votationEvents_deviceShare = function (keyId, imgData) {
    //Device.share(imgData.replace("data:image/png;base64,", ""), keyId);
    return Device.share(imgData.substring(22), keyId);
}

var savingPoll = false;
var votationEvents_saveButton = function (action, obj, callback) {
    var _args = arguments;
    console.log("votationEvents_shareButton screenPoll");
    console.log(obj);

    var poll = window.screenPoll;
    var user = window.user;

    if (!poll.public) {
        //name is mandatory for prevent troll's confusion votes, and disagree results
        var inputName = $("#userNamePoll").val() || localStorage.getItem("userName");

        if (inputName) {
            if (!user) {
                user = {};
            }
            user.nm = inputName;
            if (window.Device) {
                if (window.isAndroid) {
                    user.from = "android";
                } else {
                    user.from = "device";
                }
            } else {
                user.from = browser();
            }
            updateUserName(inputName);

        } else {
            var userName = localStorage.getItem("userName");
            modalInput(transl("myName"), userName, function (val) {
                updateUserName(val);
                votationEvents_saveButton(action, obj, callback);
            });

            if (callback) {
                callback(false);
            }
            return;
        }

        if (!poll.key) {
            if (checkConnection()) {
                if (window.key_waiting > 10) {
                    $(".absoluteLoading").remove();
                    flash("server connection is taking too long");
                }

                console.log("no key yet");
                setTimeout(function () {
                    votationEvents_saveButton.apply(this, _args);
                }, 500);

                window.key_waiting ? window.key_waiting++ : window.key_waiting = 0;
                return;
            }
            //stop
            if (callback) {
                callback(false);
            }
            return;
        }
    }

    if (!window.savingPoll) {
        //loading class for group and work with all loadings on page
        if ($(".absoluteLoading").length) {
            $(".absoluteLoading").attr("from", 'votationEvents_saveButton');
        } else {
            $("body").append("<img from='votationEvents_saveButton' class='loading absoluteLoading' src='~img/loader.gif'/>");
        }
        window.savingPoll = true;
    }

    //before change anything
    //if existing votation is public
    console.log("saving key: '" + poll.key + "'");
    if (window.Device && poll.key) {
        if ("_" == poll.key[0]) { //error
            notice(poll.key);

        } else if (!poll.key[0] == "-") { //not private key
            console.log("not private key: " + poll.key);
            //if create poll
            if (!window.publicId) {
                votationEvents_notSave(2);
                if (window.loadingPublicKey) {
                    flash(transl("loadingPublicKey"));
                    return;
                }

                //can't save votation if not publicId is working
                console.log("ASKING PHONE " + poll.key);
                askPhone();

                //stop
                if (callback) {
                    callback(false);
                }
                return;
            }

            //public = "true";
            poll.isPublic("true");
            //remove old not-public user
            if (window.phoneId && obj.users[phoneId]) {
                delete obj.users[phoneId];
            }
        }
    }

    var votes = obj.users[user.id][1];

    $("#image").remove();
    saveDefaultValues(votes);

    //wait callback only if creating poll 4 check that works
    var saveCallback = "";
    if ($("#send").hasClass("saveAndShare")) {
        saveCallback = function () {
            votationEvents_shareButton(poll, function () {
                $(".absoluteLoading").remove();
            });
        };
    }

    //update before ask phone
    var sendJson;
    if ("update" == action) {
        console.log('update" == action');
        var userArr = obj.users[user.id];
        //sendJson = JSON.stringify(userArr);
        sendJson = CSV.stringify([userArr]);
        saveLocally(poll.key, poll.json + "," + sendJson);

    } else if ("create" == action) {
        sendJson = pollToCSV(obj);

        //not local stored if not voted by me
        if ("undefined" !== typeof (votes) && "" !== votes) {
            saveLocally(poll.key, sendJson);
        }

    } else {
        console.log("error on action: " + action);
        if (callback) {
            callback(false);
        }
        return;
    }

    //callback
    var call = true;

    //WEB like ios change button now
    if (!Device.save) {
        saveAjax(action, sendJson, saveCallback);

    } else {
        saveCallback = "" + saveCallback;
        //only way of public - public-id has to be updated on load
        console.log("callback: " + saveCallback);
        saveDevice(action, sendJson, "" + poll.public, poll.country, saveCallback);
    }

    //remove any stored cache
    if (poll.key) {
        var urlParts = getPathsFromKeyId(poll.key);
        var url = urlParts.realPath + urlParts.realKey;
        //1 DAY with no cache (don't do less, older file could will be cached!)
        var cacheTimeout = (new Date()).getTime() + 86400000;
        localStorage.setItem(url, cacheTimeout);

        if (call) {
            callback(call);
        }
    }

    //$(".absoluteLoading").remove();
    savingPoll = false;
};

var votationEvents_notSave = function (why) {
    console.log("votationEvents_notSave: " + why);
    $("#send").removeAttr("disabled");
};
