// GLOBAL EVENTS

function showVotation(users) {
    $("#mainPage > div").hide();
    $("#votation").show();

    //public is defined on load html
    VotationInterface_addButtons();
    $("#send").hide();

    var style = screenPoll.style;
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
    //askUserName();
}

function backVotation() {
    $("#mainPage > div").hide();
    $("#votation").show();
    $("#buttons").show();
}

// VOTATION EVENTS

function saveDefaultValues(votes) {
    if (!votes) {
        votes = [];
    }
    originalVotes = votes.toString();

    originalPublic = $("#p_makePublic input").is(':checked');
    originalCountry = $("#countrySelect select").val();
    originalLink = $("#externalLink").val();
}

function saveToShare() {
    if ($("#send").hasClass("saveAndShare")) {
        //not change if first time
        return;
    }

    if (!$("#send").hasClass("share") && !$("#send").hasClass("saveAndShare")) {
        $("#send").removeAttr("disabled");
    }
    $("#send").attr("class", "share");
    $("#send span").text(lang["Share"]);

    //hide public options to show share image?
    $("#publicMessage").hide();

    //checkShareEnvirontment("#save");
}

function checkShareEnvirontment(tag, optionsResult) {
    if (window.intentLoads) {
        shareIntents(window.intentLoads, tag, optionsResult);
        return;
    }

    //ANDROID BROWSER CASE (or TWITTER APP!)
    if (window.isAndroid && !window.Device && navigator.plugins.length == 0) {
        console.log("window.isAndroid && !window.Device");
        //http://stackoverflow.com/questions/6567881/how-can-i-detect-if-an-app-is-installed-on-an-android-device-from-within-a-web-p
        var intentUrl = "intent://" + location.host + "/#Intent;end";
        detectAndroidIntent(intentUrl, function (intentLoads) {
            console.log("intentLoads: " + intentLoads);
            window.intentLoads = intentLoads;

            shareIntents(intentLoads, tag, optionsResult);
        });

    } else {
        window.intentLoads = false;
    }
}

function shareIntents(intentLoads, tag, optionsResult) {
    window.preventSendEvents = true;

    //if android detects intent url
    if (intentLoads) {

        var extra = "";
        if (optionsResult) {
            for (var n = 0; n < optionsResult.length; n++) {
                var votes = optionsResult[n][2];
                var option_number = $(tag).closest(".option").attr("class").split("_")[1];
                if (option_number == n) {
                    votes++;
                }
                extra += "_" + votes;
            }
        }

        var url = "intent://" + location.host + "/share" + extra + location.pathname + "/#Intent;"
                + "scheme=http;"
                + "package=" + window.package + ";"
                //(empty or wrong code function) if twitter webview, this will redirect to app store but inside browser!
                //+ "S.browser_fallback_url=" + escape(fallback_url) + ";"
                + "end";

        var a = $("<a class='intentLink' href='" + url + "'>");
        $(tag).wrap(a);

    } else { //not detects any intent (not installed app)
        var link = "https://play.google.com/store/apps/details?id=" + window.package;

        $(tag).one("click", function () {
            modalBox("Usa la la app para compartir la encuesta!",
                    "La app es gratuita y no requiere de permisos especiales.",
                    function () {
                        window.open(link, "_blank");
                    });
        });

        var err = notice(transl("notInApp"));
        err.click(function () {
            window.open(link, "_blank");
        });
    }

    //return all to normality (required on google play links)
    $(tag).one("click", function () {
        flash("app redirect");
        //prevent any send click
        setTimeout(function () {
            window.preventSendEvents = false;

            $(".intentLink").each(function () {
                $(this).find(" > *:eq(0)").unwrap();
            });
        }, 500);
    });
}

function shareToSave() {
    if ($("#send").hasClass("saveAndShare")) {
        //not change if first time
        return;
    }

    $("#send").removeAttr("disabled");
    $("#send").removeClass();
    $("#send span").text(lang["Save"]);
}

//ADD functionality
function askUserName() {
    //FORCE enter name to prevent poll problems with troll random url voters
    var votes = null;
    var obj = screenPoll.obj;
    if (obj.users && obj.users[user.id]) {
        votes = obj.users[user.id][1];
    }

    //get value: name attr
    var nameValue = "";
    if (window.user && user.nm) {
        var name = decode_uri(user.nm);
        nameValue = "value='" + name + "'";
    } else {
        var savedName = localStorage.getItem("userName");
        if (savedName) {
            nameValue = "value='" + savedName + "'";
        }
    }

    //add input
    $("#userNamePoll").remove();
    var userName = $("<div id='modal_background'><input id='userNamePoll' type='text' data-placeholder='myName' " + nameValue + " /></div>");
    $("#votationButtons").prepend(userName);

    //if public poll
    if (screenPoll.public) {
        no_requiredName();
    }

    //on public change
    $(document).on("public", function () {
        no_requiredName();
    });
    $(document).on("private", function () {
        requiredName();
    });
}

function requiredName() {
    $("#modal_input").removeClass("hideHeight");
    $("#send").off(".requiredName"); //clean

    $("#send").on("click.requiredName", function (e) {
        var votes = screenPoll.obj.users[user.id][1];
        if (!$("#userNamePoll").val()
                && (votes || 0 === votes)) {
            $("#userNamePoll").focus();
        }
    });
}
function no_requiredName() {
    $("#modal_input").addClass("hideHeight");
    $("#send").off(".requiredName");
}

///////////////////////////////////////////////////////////////////////////////
//PRIVATE FUNCTIONS

VotationInterface_addButtons = function () {
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

    VotationInterface_sendButtonEvent();
    VotationInterface_cancelButtonEvent();
    VotationInterface_usersButtonEvent();
    $("#buttons").show();
};

function VotationInterface_sendButtonEvent() {
//    checkShareEnvirontment("#save");
    $("#send").click(function (e) {
        if (window.preventSendEvents) {
            console.log("preventSendEvents");
            return;
        }

        //prevent docuble tap save and share ?
        e.stopPropagation();
        $("body").append("<img from='VotationInterface_buttonsEvents' class='loading absoluteLoading' src='~img/loader.gif'/>");

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

            //.SaveAndShare class includes VotationInterface_shareButton!
            VotationInterface_saveButton("create", obj, function (done) {
                if (false === done) {
                    $(".absoluteLoading").remove();
                    return;
                }
                localStorage.setItem("unusedKey", "");
            });

        } else if (!$("#send").hasClass("share")) { //class is save
            $("#send").attr("disabled", "disabled");
            VotationInterface_saveButton("update", obj, function (done) {
                $(".absoluteLoading").remove();
                if (false !== done) {
                    saveToShare();
                }
            });

        } else { //share
            VotationInterface_shareButton(screenPoll, function () {
                $(".absoluteLoading").remove();
            });
        }
    });
}

function VotationInterface_cancelButtonEvent() {

    $("#cancel").click(function () {
        window.screenPoll = new LoadedPoll();

        if (window.isTranslucent) {
            if (window.Device) {
                console.log("closing.. window.isTranslucent: " + window.isTranslucent);
                Device.close();
                return;
            }
        }
        if (window.keyLinkPage) {
            if (document.referrer.indexOf(window.location.host) > -1 || true) {
                window.history.back();

                if (history.length <= 1 && window.Device) {
                    console.log("no history close");
                    Device.close();
                }

            } else {
                hashManager.update("polls");
            }
        } else {
//            defaultPage();
//            $("html").removeClass("withoutHeader");
//            //reset main but not show
//            $("#mainPage > div").hide();
//            $("#creator").show();
//            location.hash = "polls";
            hashManager.update("");
        }

        $(document).off(".swipePrevent");
    });
}

function VotationInterface_usersButtonEvent() {
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
}

VotationInterface_notSave = function (why) {
    console.log("VotationInterface_notSave: " + why);
    $("#send").removeAttr("disabled");
};

var _ajaxKeyWaiting = 0;
//not pass obj for function. this is a Device function.
VotationInterface_shareButton = function (poll, callback) {
    var _args = arguments;
    
    if (!$("#shareButtonLoading").length) {
        $("body").append("<img from='VotationInterface_shareButton' id='shareButtonLoading' class='loading absoluteLoading' src='~img/loader.gif'/>");
    }

    console.log("VotationInterface_shareButton");
    if (!window.Device && !poll.key) {
        //if not seems respond
        if (_ajaxKeyWaiting > 10) {
            _ajaxKeyWaiting = 0;
            error("missingAjaxKey");
            if (callback) {
                callback(false);
            }
            return;
        }
        _ajaxKeyWaiting++;

        setTimeout(function () {
            console.log("waiting ajax key..");
            VotationInterface_shareButton.apply(this, _args);
        }, 700);
        return;
    }
    _ajaxKeyWaiting = 0;

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
        if (window.Device) {
//            div.hide();
            Device.share(imgData, keyId);

        } else {
            $("#stored").addClass("hidden");
            div.show();
            //VotationInterface_saveImageLocally(keyId, imgData);
        }

        if (callback) {
            callback(true);
        }
    });
};

//VotationInterface_saveImageLocally = function(keyId, imgData) {
//    if (window.saveImageLocally) {
//        var myDate = new Date();
//        myDate.setHours(myDate.getHours() + 1);
//        //console.log("save image = " + imgData);
////        document.cookie = "img_" + keyId + "=" + imgData + ",expires=" + myDate;
//
//        console.log('img_' + keyId + " :: " + imgData);
//
//        var s = 'img_' + keyId + '=123';
//        document.cookie = s;
//
//        //localStorage.setItem('img_' + keyId, imgData);
//
//        console.log("COOKIES!!! = " + listCookies());
//    }
//};

function listCookies() {
    var theCookies = document.cookie.split(';');
    var aString = '';
    for (var i = 1; i <= theCookies.length; i++) {
        aString += i + ' ' + theCookies[i - 1] + "\n";
    }
    return aString;
}

var savingPoll = false;
VotationInterface_saveButton = function (action, obj, callback) {
    var _args = arguments;
    console.log("VotationInterface_shareButton screenPoll");
    console.log(obj);

    if (!screenPoll.public) {
        //name is mandatory for prevent troll's confusion votes, and disagree results
        var inputName = $("#userNamePoll").val() || localStorage.getItem("userName");

        if (inputName) {
            if (!window.user) {
                window.user = {};
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
                VotationInterface_saveButton(action, obj, callback);
            });

            if (callback) {
                callback(false);
            }
            return;
        }

        if (!screenPoll.key) {
            if (checkConnection()) {
                if (window.key_waiting > 10) {
                    $(".absoluteLoading").remove();
                    flash("server connection is taking too long");
                }

                console.log("no key yet");
                setTimeout(function () {
                    VotationInterface_saveButton.apply(this, _args);
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

    if (!savingPoll) {
        //loading class for group and work with all loadings on page
        if ($(".absoluteLoading").length) {
            $(".absoluteLoading").attr("from", 'VotationInterface_saveButton');
        } else {
            $("body").append("<img from='VotationInterface_saveButton' class='loading absoluteLoading' src='~img/loader.gif'/>");
        }
        savingPoll = true;
    }

    //before change anything
    //if existing votation is public
    console.log("saving key: '" + screenPoll.key + "'");
    if (window.Device && screenPoll.key) {
        if ("_" == screenPoll.key[0]) {
            notice(screenPoll.key);

        } else if ("-" != screenPoll.key[0]) { //not private key
            //if create poll
            if (!window.publicId) {
                VotationInterface_notSave(2);
                if (window.loadingPublicKey) {
                    flash(transl("loadingPublicKey"));
                    return;
                }

                //can't save votation if not publicId is working
                console.log("ASKING PHONE " + screenPoll.key);
                askPhone();

                //stop
                if (callback) {
                    callback(false);
                }
                return;
            }

            //public = "true";
            screenPoll.isPublic("true");
            //remove old not-public user
            if (window.phoneId && obj.users[phoneId]) {
                delete obj.users[phoneId];
            }
        }
    }

    var votes = obj.users[window.user.id][1];

    $("#image").remove();
    saveDefaultValues(votes);

    //wait callback only if creating poll 4 check that works
    var saveCallback = "";
    if ($("#send").hasClass("saveAndShare")) {
        saveCallback = function () {
            VotationInterface_shareButton(screenPoll, function () {
                $(".absoluteLoading").remove();
            });
        };
    }

    //update before ask phone
    var sendJson;
    if ("update" == action) {
        console.log('update" == action');
        var userArr = obj.users[user.id];
        sendJson = JSON.stringify(userArr);
//        obj.users[user.id] = userArr;
        saveLocally(screenPoll.key, screenPoll.json + "," + sendJson);

    } else if ("create" == action) {
        sendJson = pollToJson(obj);

        //not local stored if not voted by me
        if ("undefined" !== typeof (votes) && "" !== votes) {
            saveLocally(screenPoll.key, sendJson);
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
    if (!Device) {
//        if (!window.deviceIntentLoads) {
        saveAjax(action, sendJson, saveCallback);
//        } else {
//            user.vt = originalVotes;
//
//            $("#votationBox tr").each(function () {
//                var checkbox = $(this).find(".checkbox")[0];
//                if (checkbox.checked == true) {
//                    checkbox.checked = false;
//                    var option = $(this).find(".option");
//                    var num = parseInt(option.text()) - 1;
//                    option.text(num);
//                }
//            });
//
//            addUserVotes("#votationBox", user.vt);
//        }
//        window.deviceIntentLoads = false;

    } else {
        saveCallback = "" + saveCallback;
        //only way of public - public-id has to be updated on load
        console.log("callback: " + saveCallback);
        saveDevice(action, sendJson, "" + screenPoll.public, screenPoll.country, saveCallback);
    }

    //remove any stored cache
    if (screenPoll.key) {
        var urlParts = getPathsFromKeyId(screenPoll.key);
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
