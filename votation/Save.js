
var Save = function (poll, $imageDOM, doneCallback, failCallback) {
    this.poll = poll;
    this.$imageDOM = $imageDOM;
    this.doneCallback = doneCallback;
    this.failCallback = failCallback;

    this.savingPoll = false;
};

Save.prototype.do = function (callback, andShare, add) {
    var _this = this;
    this.andShare = andShare;

    var poll = this.poll;
    console.log(this.poll)
    var user = window.user;

    if (!poll._public) {
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
            modalBox.input(transl("myName"), userName, function (val) {
                updateUserName(val);
                _this.do(callback, add);
            });

            if (callback) {
                callback(false);
            }
            return;
        }

//        if (!poll.key) {
//            if (checkConnection()) {
//                if (this.key_waiting > 10) {
//                    loaded();
//                    flash("server connection is taking too long");
//                    return;
//                }
//
//                console.log("no key yet");
//                setTimeout(function () {
//                    _this.save(callback);
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
        loading();
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

            poll.isPublic("true");
            //remove old not-public user
            if (window.phoneId && poll.obj.users[phoneId]) {
                delete poll.obj.users[phoneId];
            }
        }
    }

    //update before ask phone
    var sendJson = pollToCSV(poll.obj);
   
    //is shared before
    if (this.lastSendJson == sendJson) {
        _this.saveCallback(this.poll.key);
        return;
    }
    
    this.lastSendJson = sendJson;
    this.saveEventCallback = callback;

    //AJAX
    if (!Device.save) {
        this.addAjax(sendJson, function (res) {
            _this.saveCallback(res);
        }, add);

    } else {
        //only way of public - public-id has to be updated on load
        this.saveDevice(sendJson, "screenPoll.buttons.save.saveCallback");
    }

    //if new
    $("#image").remove();
    var votes = poll.obj.users[user.id][1];
    saveDefaultValues(votes);
    
    saveLocally(poll.key, poll.obj);
};

//device calls:
Save.prototype.saveCallback = function (res) {
    var _this = this;
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

    //if (this.$sendButton.hasClass("saveAndShare")) {
    if (this.$imageDOM && this.andShare) {
        new Share(this.poll, this.$imageDOM).do(function () {
            _this.loaded();
        });

    } else {
        this.loaded();
    }

    //saveLocally(key, this.poll.json);
};

Save.prototype.loaded = function () {
    loaded();
    this.savingPoll = false;
};

Save.prototype.saveDevice = function (sendJson, callback) {
    var _public = "" + this.poll._public;
    var country = this.poll.country;
    var key = this.poll.key;

//    if (!this.keyWaiting) {
//        this.keyWaiting = 0;
//    }
    //FORCE WAIT KEY
//    if (!key && !_public && "create" == action) { //check external key!
//        if (this.keyWaiting > 8) {
//            flash(transl("waitingKeyExpired"));
//            return;
//        }
//
//        //wait 4 key arrive
//        setTimeout(function () {
//            _this.saveDevice(action, sendJson, callback);
//        }, 700);
//
//        console.log("looking for new key");
//        this.keyWaiting++;
//        return;
//    }
//    this.keyWaiting = 0;

    //localStorage.setItem("unusedKey", "");
    var realKey = "";
    if (key) {
        var urlParts = getPathsFromKeyId(key);
        realKey = this.poll.realKey = urlParts.realKey;
    }

    //key value is only added on create()
    if (!window.lastKeyAsk) {
        window.lastKeyAsk = 0;
    }
    console.log("callback: " + callback);
    Device.save(sendJson, window.lastKeyAsk, realKey, _public, country, callback);
};

Save.prototype.addAjax = function (sendJson, callback, add) {
    var _this = this;
//    if ("true" == this.poll._public) {
//        error("PublicOnlyFromApp");
//        return;
//    }

    $.post(settings.corePath + "add.php", {
        userId: window.user.id,
        key: this.poll.key,
        data: sendJson,
        add: JSON.stringify(add)
    }).done(function (res) {
        _this.ajaxDone(res, callback);
    }).error(function (res) {
        _this.ajaxError(res);
    });
};

Save.prototype.ajaxDone = function (res, callback) {
    console.log(res);
    if (!res) {
        error("errorAjaxResponse");
        //TODO ERROR ?
        return;
    }
    if (callback) {
        callback(res);
    }
};

Save.prototype.ajaxError = function (res) {
    console.log(res);
    console.log("can't connect with ajax");
    error("votationNotSaved");
};


Save.prototype.notSave = function (why) {
    console.log("VotationButtons.notSave: " + why);
    if (this.failCallback) {
        this.failCallback();
    }
};
