// GLOBAL EVENTS

function showVotation(users) {
    //public is defined on load html
    VotationInterface_addButtons();

    $("#mainPage > div").hide();
    $("#votation").show();

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
    askUserName();
}

function backVotation() {
    $("#mainPage > div").hide();
    $("#votation").show();
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

    //checkShareEnvirontment();
}

function checkShareEnvirontment() {
    //ANDROID BROWSER CASE (or TWITTER APP!)
    if (window.isAndroid && !window.Device) {
        var intentUrl = "intent://" + window.appPath + "/#Intent;";
        detectAndroidIntent(intentUrl, function (intentLoads) {
            console.log("intentLoads: " + intentLoads);
            window.preventSendEvents = true;

            //if android detects intent url
            if (intentLoads) {
                //window.deviceIntentLoads = true;
                //window.saveImageLocally = true;

                var url = "intent://" + location.host + "/share" + location.pathname + "/#Intent;"
                        + "scheme=http;"
                        + "package=at.clicktovote;"
                        //(empty or wrong code function) if twitter webview, this will redirect to app store but inside browser!
                        //+ "S.browser_fallback_url=" + escape(fallback_url) + ";"
                        + "end";

                console.log("URL: " + url);
                $("#send").wrap("<a class='intentLink' href='" + url + "'></a>");

                //not detects any intent (not installed app)
            } else {
                var link = "https://play.google.com/store/apps/details?id=at.clicktovote";
                $("#send").one("click", function () {
                    window.open(link, "_blank");
                });
                var err = notice(transl("notInApp"));
                err.click(function () {
                    window.open(link, "_blank");
                });

            }

            //return all to normality
            $("#send").one("click", function () {
                //prevent any send click
                setTimeout(function () {
                    window.preventSendEvents = false;

                    $(".intentLink").each(function () {
                        $(this).find(" > *:eq(0)").unwrap();
                    });
                }, 500);
            });
        });
    }
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
    //FORCE enter name to prevent poll problems with troll random voters
    var votes = null;
    var obj = screenPoll.obj;
    if (obj.users && obj.users[userId]) {
        votes = obj.users[userId][1];
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
    var userName = $("<div id='userNameContainer'><input id='userNamePoll' type='text' placeholder='" + transl("myName") + "' " + nameValue + " /></div>");
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
    $("#userNameContainer").removeClass("hideHeight");
    $("#send").off(".requiredName"); //clean

    $("#send").on("click.requiredName", function (e) {
        var votes = screenPoll.obj.users[userId][1];
        if (!$("#userNamePoll").val()
                && (votes || 0 === votes)) {
            $("#userNamePoll").focus();
        }
    });
}
function no_requiredName() {
    $("#userNameContainer").addClass("hideHeight");
    $("#send").off(".requiredName");
}

///////////////////////////////////////////////////////////////////////////////
//PRIVATE FUNCTIONS

VotationInterface_addButtons = function () {
    var buttonsHTML = "<div id='defaultButtons'>"
            + "<button id='send' class='share'><em></em><span>" + transl("Share") + "</span></button>"
            + "<button id='cancel'>" + transl("Cancel") + "</button>"
            + "</div>"
            + "<button id='usersButton'>" + transl("Voters") + "</button>";

    //create BUTTONS every time for good reset (class saveAndshare ex.)
    $("#defaultButtons").remove();
    $("#usersButton").remove();
    $("#votationButtons").prepend(buttonsHTML);
    VotationInterface_buttonsEvents();

    //after events
    checkShareEnvirontment();
};

VotationInterface_buttonsEvents = function () {
//    checkShareEnvirontment();

    $("#send").click(function (e) {
        if (window.preventSendEvents) {
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
            obj.users[window.userId] = getUserArray(window.user);

            VotationInterface_saveButton("create", obj, function (done) {
                if (false === done) {
                    $(".absoluteLoading").remove();
                    return;
                }

                localStorage.setItem("unusedKey", "");
                //not save anymore
                //$("#send").attr("class", "share");
                VotationInterface_shareButton(function () {
                    $(".absoluteLoading").remove();
                });
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
            VotationInterface_shareButton(function () {
                $(".absoluteLoading").remove();
            });
        }
    });

    $("#cancel").click(function () {
        if (window.isTranslucent) {
            if (window.Device) {
                console.log("closing.. window.isTranslucent: " + window.isTranslucent);
                Device.close();
                return;
            }
        }
        if (keyLinkPage) {
            if (document.referrer.indexOf(window.location.host) > -1 || true) {
                window.history.back();

                if (history.length <= 1 && window.Device) {
                    console.log("no history close");
                    Device.close();
                }

            } else {
                loadHash("polls");
            }
        } else {
//            defaultPage();
//            $("html").removeClass("withoutHeader");
//            //reset main but not show
//            $("#mainPage > div").hide();
//            $("#creator").show();
//            location.hash = "polls";
            loadHash("");
        }

        $(document).off(".swipePrevent");
    });

    //voters users
    $("#usersButton").click(function () {
        var obj = screenPoll.obj;
        var users = obj.users;
        $("#users .list").html("");

        var nameIndex;
        if (obj.style.extraValues) {
            for (var i = 0; i < obj.style.extraValues.length; i++) {
                if ("nm" == obj.style.extraValues[i]) {
                    nameIndex = 2 + i;
                }
            }
        }

        //SORT
        var arrUsers = [];
        for (var id in users) {
            arrUsers.push(users[id]);
        }
        arrUsers.sort(function (a, b) {
            return a[nameIndex].localeCompare(b[nameIndex]);
        });

        var unknown = 0;
        for (var i = 0; i < arrUsers.length; i++) {
            var user = arrUsers[i];
            var id = user[0];

            //if not vote, not show
            var userVotes = user[1];
            if (!userVotes && 0 !== userVotes) {
                continue;
            }

            var name = user[nameIndex];
            if (!name || (!user[1] && 0 !== user[1])) {
                console.log("!name || !users[id][1]");
                unknown++;
                continue;
            }

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

VotationInterface_notSave = function (why) {
    console.log("VotationInterface_notSave: " + why);
    $("#send").removeAttr("disabled");
};

var sharingPoll = false;
var _ajaxKeyWaiting = 0;
//not pass obj for function. this is a Device function.
VotationInterface_shareButton = function (callback) {
    var _args = arguments;

    if (!sharingPoll) {
        $(".absoluteLoading").remove();
        //loading class for group and work with all loadings on page
        $("body").append("<img from='VotationInterface_shareButton' class='loading absoluteLoading' src='~img/loader.gif'/>");
        sharingPoll = true;
    }

    console.log("VotationInterface_shareButton");
    if (!Device && !screenPoll.key) {
        //if not seems respond
        if (_ajaxKeyWaiting > 10) {
            _ajaxKeyWaiting = 0;
            error("missingAjaxKey");
            callback(false);
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

    console.log("country = " + screenPoll.country);
    var keyId = screenPoll.key;
    var divQuery = "#image .image";

    //if canvas exists only re-share height modifications

    var canvas = $(divQuery + " canvas");
    var imgData;
    if (canvas.length) {
        console.log("canvas already exists");
        imgData = canvas[0].toDataURL();
        if (window.Device) {
            Device.share(imgData, keyId);

        } else {
            //VotationInterface_saveImageLocally(keyId, imgData);

            $(".absoluteLoading").remove();
            callback(true);
            sharingPoll = false;
        }

    } else {
        $("#image").remove();
        var div = $("<div id='image'><hr/><div class='image'></div></div>");
        $("#mainPage").append(div);

        var width = null;
        var list = null;
        getCanvasImage(divQuery, screenPoll.obj, keyId, width, list, function (imgData) {
            if (!imgData) {
                error("!imgData on getCanvasImage");
                return;
            }
            if (window.Device) {
                $(divQuery).hide();
                Device.share(imgData, keyId);

            } else {
                $(divQuery).show();
                //VotationInterface_saveImageLocally(keyId, imgData);
                
                callback(true);
                sharingPoll = false;
            }
        });
    }

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
    //console.log(JSON.stringify(screenPoll.obj.users));

    if (!screenPoll.public) {
        //name is mandatory for prevent troll's confusion votes, and disagree results
        var inputName = $("#userNamePoll").val() || localStorage.getItem("userName");
        var votes = null;
        if (obj.users[userId]) {
            votes = obj.users[userId][1];
        }

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
            saveUserName(inputName);

        } else {
            console.log("votes: " + votes);
            $("body").append(askName_html());
            $("#userNamePoll").focus();
            VotationInterface_notSave(1);
            callback(false);
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
            callback(false);
            return;
        }
    }

    if (!savingPoll) {
        $(".absoluteLoading").remove();
        //loading class for group and work with all loadings on page
        $("body").append("<img from='VotationInterface_saveButton !savingPoll' class='loading absoluteLoading' src='~img/loader.gif'/>");
        savingPoll = true;
    }

    //before change anything
    //if existing votation is public
    console.log("saving key: '" + screenPoll.key + "'");
    if (window.Device && screenPoll.key && "-" != screenPoll.key[0]) { //not private key        
        //if create poll
        if (!window.publicId) {
            VotationInterface_notSave(2);
            if (window.loadingPublicKey) {
                flash(transl("loadingPublicKey"));
                return;
            }
            //can't save votation if not publicId is working
            askPhone();
            //stop
            callback(false);
            return;
        }

        //public = "true";
        screenPoll.isPublic("true");
        //remove old not-public user
        if (window.phoneId && obj.users[phoneId]) {
            delete obj.users[phoneId];
        }
    }

    // WRONG VALUES CHECKED

    $("#image").remove();
    saveDefaultValues(user.vt);

    //wait callback only if creating poll 4 check that works
    var saveCallback = "";
    if ($("#send").hasClass("saveAndShare")) {
        saveCallback = function () {
            VotationInterface_shareButton(function () {
                $(".absoluteLoading").remove();
            });
        };
    }

    var arr = toArray(obj);
    var json = screenPoll.json = toJson(arr); //update user

    //update before ask phone
    var sendJson;
    if ("update" == action) {
        var userArr = getUserArray(user);
        sendJson = JSON.stringify(userArr);
        obj.users[userId] = JSON.parse(sendJson);

    } else if ("create" == action) {
        sendJson = json;

    } else {
        console.log("error on action: " + action);
        callback(false);
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

        saveLocally(screenPoll.key, json);
    }

    //$(".absoluteLoading").remove();
    savingPoll = false;
};

function saveUserName(name) {
    localStorage.setItem("userName", name);
}
