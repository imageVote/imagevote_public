
var VotationButtons = function (poll, $dom, tpye) {
    this.poll = poll;

    this.savingPoll = false;
    this.key_waiting = 0;
    this._ajaxKeyWaiting = 0;

    this.sendButton = $("<button id='send' class='share'><em></em><span data-lang='Share'></span></button>");
    this.cancelButton = $("<button id='cancel' data-lang='Cancel'>");
    this.usersButton = $("<button id='usersButton' data-lang='Voters'>");

    if (!$dom) {
        $dom = $("#votationButtons");
        this.$votation = $("#creator");
    } else {
        this.$votation = $dom.parent();
    }
    this.$dom = $dom;
    
    $dom.find("#defaultButtons").remove();
    $dom.find("#usersButton").remove();
    
    $dom.prepend(this.usersButton);
    var buttonsHTML = $("<div id='defaultButtons'>");
    buttonsHTML.append(this.sendButton);
    buttonsHTML.append(this.cancelButton);
    $dom.prepend(buttonsHTML);

    loadTranslations();

    this.sendButtonEvent();
    this.cancelButtonEvent();
    this.usersButtonEvent();
    //$("#buttons").show();
};

VotationButtons.prototype.sendButtonEvent = function () {
    var _this = this;
    console.log("VotationButtons.sendButtonEvent original")

    this.sendButton.click(function (e) {
        //prevent docuble tap save and share ?
        e.stopPropagation();
        $("body").append("<img from='VotationButtons.sendButtonEvent' class='loading absoluteLoading' src='~img/loader.gif'/>");
        
        _this.$votation.find(".text").removeAttr("contenteditable");
        _this.$votation.find(".option").css("pointer-events", "none");

        var obj = _this.poll.obj;
        console.log(obj);

        //IF SAVE and/or SHARE
        //prevent sav and share if premium cose not key con be loaded!
        if (_this.sendButton.hasClass("saveAndShare")) {
            if (!obj.users) {
                obj.users = [];
            }
            //save user on screenPoll 'obj' (1st time)
            obj.users[_this.user.id] = getUserArray(_this.user);

            //.SaveAndShare class includes VotationButtons.share!
            _this.save("create", function (done) {
                if (false === done) {
                    $(".absoluteLoading").remove();
                    return;
                }
                localStorage.setItem("unusedKey", "");
            });

        } else if (!_this.sendButton.hasClass("share")) { //class is save
            _this.sendButton.attr("disabled", "disabled");
            _this.save("update", function (done) {
                $(".absoluteLoading").remove();
                if (false !== done) {
                    saveToShare();
                }
            });

        } else { //share
            _this.share(function () {
                $(".absoluteLoading").remove();
            });
        }
    });
};

VotationButtons.prototype.cancelButtonEvent = function () {

    this.cancelButton.click(function () {
        window.screenPoll = new LoadedPoll();

        if (window.isTranslucent) {
            if (Device.close) {
                console.log("closing.. window.isTranslucent: " + window.isTranslucent);
                Device.close("cancelButton window.isTranslucent");
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

VotationButtons.prototype.usersButtonEvent = function () {
    //voters users
    var obj = this.poll.obj;
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
        this.usersButton.hide();
        return;
    }

    this.usersButton.click(function () {
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
            _this.usersButton.show();
        } else {
            flash(lang["notPublicUsers"]);
        }
    });
};

//not pass obj for function. this is a Device function.
VotationButtons.prototype.share = function (callback) {
    var _this = this;
    var poll = this.poll;
    console.log(poll);
    var _args = arguments;

    if (!$("#shareButtonLoading").length) {
        $("body").append("<img from='VotationButtons.share' id='shareButtonLoading' class='loading absoluteLoading' src='~img/loader.gif'/>");
    }

    console.log("VotationButtons.share");
    if (!Device.share && !poll.key) {
        //if not seems respond
        if (this._ajaxKeyWaiting > 10) {
            this._ajaxKeyWaiting = 0;
            error("missingAjaxKey");
            if (callback) {
                callback(false);
            }
            return;
        }
        this._ajaxKeyWaiting++;

        setTimeout(function () {
            console.log("waiting ajax key..");
            _this.share.apply(this, _args);
        }, 700);
        return;
    }
    this._ajaxKeyWaiting = 0;

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

    //at the end
    console.log("poll.json: " + poll.json)
    saveLocally(keyId, poll.json);
};

VotationButtons.prototype.save = function (action, callback) {
    var _this = this;
    console.log("VotationButtons.save screenPoll");

    var poll = this.poll;
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
                _this.save(action, callback);
            });

            if (callback) {
                callback(false);
            }
            return;
        }

//        if (!poll.key) {
//            if (checkConnection()) {
//                if (this.key_waiting > 10) {
//                    $(".absoluteLoading").remove();
//                    flash("server connection is taking too long");
//                    return;
//                }
//
//                console.log("no key yet");
//                setTimeout(function () {
//                    _this.save(action, callback);
//                }, 500);
//
//                this.key_waiting++;
//                return;
//            }
//            //stop
//            if (callback) {
//                callback(false);
//            }
//            return;
//        }
    }

    if (!this.savingPoll) {
        //loading class for group and work with all loadings on page
        if ($(".absoluteLoading").length) {
            $(".absoluteLoading").attr("from", 'VotationButtons.save');
        } else {
            $("body").append("<img from='VotationButtons.save' class='loading absoluteLoading' src='~img/loader.gif'/>");
        }
        this.savingPoll = true;
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
                this.notSave(2);

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
            if (window.phoneId && poll.obj.users[phoneId]) {
                delete poll.obj.users[phoneId];
            }
        }
    }

    var votes = poll.obj.users[user.id][1];

    $("#image").remove();
    saveDefaultValues(votes);

    //update before ask phone  
    var sendJson = "";
    if ("update" == action) {
        console.log('update" == action');
        var userArr = poll.obj.users[user.id];
        sendJson = CSV.stringify([userArr]);
        poll.json += "\n" + sendJson;
        saveLocally(poll.key, poll.json);

    } else if ("create" == action) {
        sendJson = poll.json = pollToCSV(poll.obj);

        //not local stored if not voted by me
//        if ("undefined" !== typeof (votes) && "" !== votes) {
//            saveLocally(poll.key, sendJson);
//        }

    } else {
        console.log("error on action: " + action);
        if (callback) {
            callback(false);
        }
        return;
    }
    
    //is shared before
    if(this.lastSendJson == sendJson){
        _this.saveCallback(this.poll.key);
        return;
    }
    this.lastSendJson = sendJson;

    //WEB like ios change button now
    this.saveEventCallback = callback;
    if (!Device.save) {
        this.saveAjax(action, sendJson, function (res) {
            _this.saveCallback(res);
        });

    } else {
        //only way of public - public-id has to be updated on load
        this.saveDevice(action, "screenPoll.buttons.saveCallback");
    }
};

//device calls:
VotationButtons.prototype.saveCallback = function (res) {        
    console.log("saveCallback " + res);
    this.poll.key = res;

    //remove any stored cache
    if (this.poll.key) {
        var urlParts = getPathsFromKeyId(this.poll.key);
        var url = urlParts.realPath + urlParts.realKey;
        //1 DAY with no cache (don't do less, older file could will be cached!)
        var cacheTimeout = (new Date()).getTime() + 86400000;
        localStorage.setItem(url, cacheTimeout);

        if (this.saveEventCallback) {
            this.saveEventCallback();
        }
    }

    if (this.sendButton.hasClass("saveAndShare")) {
        this.share(function () {
            $(".absoluteLoading").remove();
            this.savingPoll = false;
        });
    } else {
        $(".absoluteLoading").remove();
        this.savingPoll = false;
    }
    
    //saveLocally(key, this.poll.json);
};

VotationButtons.prototype.notSave = function (why) {
    console.log("VotationButtons.notSave: " + why);
    this.sendButton.removeAttr("disabled");
};
