
var VotationButtons = function (poll, $dom) {
    var _this = this;
    console.log("VotationButtons()")

    this.poll = poll;
    this.$imageDOM = $("#mainPage");

    this.key_waiting = 0;

    this.$sendButton = $("<button id='send' class='share'><em></em><span data-lang='Share'></span></button>");
    this.$cancelButton = $("<button id='cancel' data-lang='Cancel'>");
    this.$usersButton = $("<button id='usersButton' data-lang='Voters'>");

    if (!$dom) {
        $dom = $("#buttons");
        this.$votation = $("#creator");
    } else {
        this.$votation = $dom.parent();
    }
    this.$dom = $dom;

    $dom.find(".votationButtons").remove();

    var votationButtons = $("<div class='votationButtons'>");
    votationButtons.prepend(this.$usersButton);
    var buttonsHTML = $("<div id='defaultButtons'>");
    buttonsHTML.append(this.$sendButton);
    buttonsHTML.append(this.$cancelButton);
    votationButtons.prepend(buttonsHTML);

    $dom.append(votationButtons);

    translate.loadTranslations();

    this.save = new Save(poll, this.$imageDOM, function () {
        //done
        
    }, function () {
        //fail
        _this.$sendButton.removeAttr("disabled");
    });
};

VotationButtons.prototype.init = function () {
    this.sendButtonEvent();
    this.cancelButtonEvent();
    this.usersButtonEvent();
    //$("#buttons").show();
};

// UNUSED IN WOULD-YOU-RATHER:
VotationButtons.prototype.sendButtonEvent = function () {
    var _this = this;
    console.log("VotationButtons.sendButtonEvent original");

    this.$sendButton.click(function (e) {
        //prevent docuble tap save and share ?
        e.stopPropagation();
        loading();

        var obj = _this.poll.obj;

        //IF SAVE and/or SHARE
        //prevent sav and share if premium cose not key con be loaded!
        if (_this.$sendButton.hasClass("saveAndShare")) {
            if (!obj.users) {
                obj.users = [];
            }
            //save user on screenPoll 'obj' (1st time)
            obj.users[_this.user.id] = getUserArray(_this.user);

            //.SaveAndShare class includes VotationButtons.share!
            _this.save.do("create", function (done) {
                if (false === done) {
                    loaded();
                    return;
                }
                localStorage.setItem("unusedKey", "");
            });

        } else if (!_this.$sendButton.hasClass("share")) { //class is save
            _this.$sendButton.attr("disabled", "disabled");
            _this.save.do("update", function (done) {
                loaded();
                if (false !== done) {
                    _this.saveToShare();
                }
            });

        } else { //share
            _this.share.do(function () {
                loaded();
            });
        }
    });
};

VotationButtons.prototype.cancelButtonEvent = function () {

    this.$cancelButton.click(function () {
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
//            _this.$imageDOM.find("> div").hide();
//            $("#creator").show();
//            location.hash = "polls";
            hashManager.update("");
        }

        $(document).off(".swipePrevent");
    });
};

VotationButtons.prototype.usersButtonEvent = function () {
    var _this = this;

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
        this.$usersButton.hide();
        return;
    }

    this.$usersButton.click(function () {
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

            _this.$imageDOM.find("> div").hide();
            _this.$usersButton.show();
        } else {
            flash(transl("notPublicUsers"));
        }
    });
};


VotationButtons.prototype.saveToShare = function () {
    if (this.$sendButton.hasClass("saveAndShare")) {
        //not change if first time
        return;
    }

    if (!this.$sendButton.hasClass("share") && !$("#send").hasClass("saveAndShare")) {
        this.$sendButton.removeAttr("disabled");
    }
    this.$sendButton.attr("class", "share");
    this.$sendButton.find("span").text(lang["Share"]);

    //hide public options to show share image?
    $("#publicMessage").hide();
};

VotationButtons.prototype.shareToSave = function () {
    if (this.$sendButton.hasClass("saveAndShare")) {
        //not change if first time
        return;
    }

    this.$sendButton.removeAttr("disabled");
    this.$sendButton.removeClass();
    this.$sendButton.find("span").text(transl("Save"));
};
