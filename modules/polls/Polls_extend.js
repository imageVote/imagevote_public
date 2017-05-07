
var Polls = function () {

};

Polls.prototype.navigationEvents = function () {
    var _this = this;

    $("#pollsPageContainer").off(".gamePoll");

    $("#pollsPageContainer").on("swiperight.gamePoll", function (e) {
        e.preventDefault();
        e.stopPropagation();
        var previousPoll = _this.previous();
        if (previousPoll) {
            _this.load(previousPoll, true, true);
        } else {
            flash(transl("polls_noMorePrevious"));
        }
    });

    $("#pollsPageContainer").on("swipeleft.gamePoll", function (e) {
        e.preventDefault();
        e.stopPropagation();
        var anyone = true;
        var nextPoll = _this.next(_this.idQ + 1, anyone);
        _this.load(nextPoll, true);
    });

    var gameSwipeButtons = $("<div id='gameSwipeButtons'>");

    var back = $("<button id='gameBack'><em style='height:15px'></em><span data-lang='back_symbol'></span></button>");
    gameSwipeButtons.append(back);
    back.on("click", function () {
        var previousPoll = _this.previous();
        if (previousPoll) {
            _this.load(previousPoll, true, true);
        } else {
            flash(transl("polls_noMoreFound"));
        }
    });

    var next = $("<button id='gameNext'><em style='height:15px'></em><span data-lang='next_symbol'></span></button>");
    gameSwipeButtons.append(next);
    next.on("click", function () {
        var anyone = true;
        var nextPoll = _this.next(_this.idQ + 1, anyone);
        _this.load(nextPoll, true);
    });

    this.buttons.find(".votationButtons").append(gameSwipeButtons);
    this.buttons.find("#cancel").hide();

//    if (is_touch_device()) {
//        gameSwipeButtons.hide();
//    }
};

Polls.prototype.game_config = function () {
    console.log("GamePoll.game_config");
    var _this = this;
    //this info needs to be in server to update all devices in realtime!
    var file = "game_config.json";
    if (Device.simpleRequest) {
        Device.simpleRequest(file, null, this.window_name + ".game_configCallback");
    } else {
        //$.post returns error:412 in ios with '.json' !!
        $.getJSON("core/" + file, function (data) {
            _this.game_configCallback(data);
        });
    }
};

Polls.prototype.request = function (idQ, individual) {
    //prevent loop requests
    if (idQ == this.request_idQ) {
        return;
    }
    this.request_idQ = idQ;

    console.log(666 + " " + idQ + " " + individual)
    var _this = this;
    var table = this.gameDB();

    var request = table + "_" + idQ;
    if (request === this.last_request) {
        console.log("stop request loop " + request);
        flash(transl("polls_noMoreFound"));

        //reset request
        this.last_request = false;
        return;
    }
    this.last_request = request;

    if ("undefined" == typeof idQ || !table) {
        console.log("wrong params: " + idQ + " " + table);
        this.reset();
        return false;
    }

    var id = "";
    var lastId = "";

    var params = "table=" + table;
    if (individual) {
        id = idQ;
        params += "&id=" + idQ;
    } else {
        lastId = idQ;
        params += "&lastId=" + idQ;
    }

    console.log("post select " + params);
    this.loading();

    if (Device.simpleRequest) {
        //prevent object not exists error
        var func = this.window_name + ".requestCallback";
        //Device.simpleRequest("parseSelect.php", params, "if(window." + func + ") " + func);
        Device.parseSelect(table, lastId, id, "if(window." + func + ") " + func);
    } else {
        $.post(this.coreSelect, params, function (json) {
            _this.requestCallback(json);
        });
    }
};

Polls.prototype.requestCallback = function (json) {
    //console.log(json);
    this.loaded("requestCallback");
    if (!json) {
        flash(transl("polls_noMoreFound"));
        var idQ = this.lastIdQ();
        this.load(gamePolls[idQ], null, false);
        return;
    }

    json = json.replace(/\r\n/g, "<br/>");

    var obj;
    try {
        obj = JSON.parse(json);
    } catch (e) {
        console.log(e);
        if (json.length > 1000) {
            console.log("in " + json.substr(0, 20) + " [...] " + json.substr(json.length - 20));
        } else {
            console.log("in " + json);
        }
        return;
    }

    var polls = this.parsePolls(obj);

    //SAVE AS FALSE UNEXISTING POLLS, ALLOW NULL's TO NOT YET LOADED POLLS
//    for (var i = 0; i < polls.length; i++) {
//        var poll = polls[i];
//        gamePolls[poll[1]] = poll;
//    }
    var game_db = this.gameDB();
    var polls_idQ = localStorage.getItem("idQ_" + game_db);
    if (null === polls_idQ) { //if not idQ saved, get first loaded poll idQ
        //polls_idQ = polls[0][1]; //this auses bug on loaded polls not starting in idQ == 1 (it)
        polls_idQ = 0;
    }

    console.log(polls);
    for (var i = 0; i < polls.length; i++) {
        var idQ = polls[i][1];
        gamePolls[idQ] = polls[i];
    }

    var table = this.gameDB();
    localStorage.setItem(table, JSON.stringify(gamePolls));

    var next_idQ = this.idQ + 1;
    if (this.individual) {
        next_idQ = this.idQ;
    }
    var nextPoll = this.next(next_idQ);
    if (!nextPoll) {
        console.log("no poll!");
        var previous = this.previous(next_idQ);
        if (this.idQ !== previous[1]) {
            this.load(previous, null, false); //false totally removes animation
        }
        return;
    }
    this.load(nextPoll);
};

Polls.prototype.next = function (idQ, anyone) {
    console.log(111)
    console.log("anyone: " + anyone)
    var storedPolls = gamePolls;
    //console.log(storedPolls);

    var lastIdQ = this.lastIdQ(storedPolls);
    var i = parseInt(idQ);
    console.log("next " + idQ + " of " + lastIdQ);

    while (i <= lastIdQ) {
        console.log("looking for poll " + i);
        var poll = storedPolls[i];
//        if (null === poll) {
//            i++;
//            continue;
//        } else if ("undefined" === typeof poll) {
//            console.log("nothing in poll idQ " + i);
//            this.request(i);
//            return;
//        }
        if (null === poll || "undefined" === typeof poll) {
            i++;
            continue;
        }

        this.idQ = i;
        this.update_idQ(i);
        var vote = poll[6];
        if ("undefined" === typeof vote || anyone) {
            return storedPolls[i];
        }
        i++;
    }

    console.log("NO MORE STORED POLLS");

    var request_idQ;
    if (!$.isEmptyObject(storedPolls)) {
        request_idQ = Object.keys(storedPolls).reduce(function (a, b) {
            a = parseInt(a);
            b = parseInt(b);
            return a > b ? a : b;
        });
    } else {
        request_idQ = 0;
    }

    this.request(request_idQ + 1);
};

Polls.prototype.previous = function (idQ) {
    if (!idQ) {
        idQ = this.idQ;
        if (!idQ) {
            idQ = $(this.query + " .gameContainer").attr("data-idq");
            if (!idQ) {
                idQ = this.lastIdQ();
            }
        }
    }
    console.log("previous. attr idQ " + idQ);
    var storedPolls = gamePolls;

    var i = idQ - 1;
    while (i >= 0) {
        var poll = storedPolls[i];
        if (!poll) {
            console.log("!poll: " + i);
            i--;
            continue;
        }
        console.log(idQ + " to " + i);
        this.idQ = i; //not save locally when 'previous'
        return storedPolls[i];
    }

    return false;
};

Polls.prototype.load = function (poll, individual, back) {
    console.log(222)
    if (!poll) {
//        this.request(poll[1]);
        return false;
    }

    var _this = this;
    console.log("loadGamePoll " + poll[1]);

    //if already voted
    if ("undefined" != typeof poll[6] && !individual) {
        var idQ = parseInt(poll[1]);
        var next = this.next(idQ + 1);
        if (next) {
            poll = next;
        }
    }

    //this for device manipulation for browser share
    var obj = this.obj = {
        question: "",
        options: [
            [0, poll[2], poll[4]],
            [1, poll[3], poll[5]]
        ],
        users: {}
    };

    //add own votes
    if ("undefined" !== typeof poll[6]) {
        obj.users[window.user.id] = [window.user.id, poll[6]];
    }

    //stop previous timeouts
    if (window.gamePoll) {
        clearTimeout(gamePoll.updateOptionsTimeout);
    }

    var original = this.loadAnimation(back);
    original.attr("data-idQ", poll[1]);

    window.gamePoll = this.gamePoll = new FillTable(original, obj, null, function (option) {
        console.log("game option click " + option);
        _this.voted[poll[1]] = true;
        if (!obj.users[window.user.id]) {
            obj.users[window.user.id] = getUserArray();
        }
        obj.users[window.user.id][1] = option;

        //remove last event fast:        
        _this.checkedEvent();

        var table = _this.gameDB();
        if (!table) {
            console.log("LANGUAGE GAME NOT FOUND");
            this.reset();
            return;
        }

        var idQ = poll[1];
        var options = JSON.stringify([option]);
        var params = "table=" + table + "&id=" + poll[0] + "&add=" + options + "&idQ=" + poll[1] + "&userId=" + window.user.id + "&data=" + options;
        //decrease: (poll[6] can be 0!)
        if ("undefined" != typeof poll[6] && option != poll[6]) {
            params += "&sub=" + JSON.stringify([poll[6]]);

            //update locally (after params set!)
            switch (poll[6]) {
                case 0:
                    _this.update(idQ, 4, poll[4] - 1);
                    break;
                case 1:
                    _this.update(idQ, 5, poll[5] - 1);
                    break;
            }
        }
        console.log(params);

        //update locally - before to continue playing (after params set!)    
        _this.update(idQ, 6, option);
        switch (option) {
            case 0:
                _this.update(idQ, 4, poll[4] + 1);
                break;
            case 1:
                _this.update(idQ, 5, poll[5] + 1);
                break;
        }
        _this.update_idQ(idQ + 1);

        if (_this.update_frequency && Math.random() * _this.update_frequency < 1) {
            console.log("post update " + _this.update_frequency);
            if (Device.simpleRequest) {
                //Device.simpleRequest("parseUpdate.php", params, _this.window_name + ".updateCallback");
                Device.parseUpdate(table, poll[0], option, poll[6], idQ, _this.window_name + ".updateCallback");
            } else {
                $.post(_this.coreUpdate, params, function (json) {
                    _this.updateCallback(json);
                });
            }
        }

        //Stars:
        _this.answers++;

        //TODO: save stars done
        var stars_done = localStorage.getItem("stars_rate");
        if (!stars_done && _this.stars_frequency && _this.answers > _this.stars_frequency) {
            console.log("STARS DONE!");
            localStorage.setItem("stars_rate", "done");
//            if (Device.showStars) {
//                Device.showStars();
//            }
            if (Device) {
                $("<div>").appendTo("body").load("~commons/modules/rate/rate.html", function () {
                    new Rate();
                });
            }
        }

        if (_this.interstitial_frequency && _this.answers % _this.interstitial_frequency == 0) {
            console.log("Device.loadAd()");
            if (Device.loadAd) {
                Device.loadAd();
            }
        }

        //to prevent change votation on the fly:
        return false;
    });

    if (this.onFillTable) {
        this.onFillTable(poll[0]);
    }

    //prevent reselect
    if ("undefined" != typeof poll[6]) {
        _this.checkedEvent();
    }
    //prevent fast vote change 
    if (this.voted[poll[1]]) {
        original.find(".option").css("pointer-events", "none");
    }

    // ENABLE WHEN GAME POLLS COMES FROM SERVER!! 
//    //LIKE
//    require(["text!~commons/modules/like/like.html"], function (html) {
//        original.find(".like").remove();
//        original.append(html);
//
//        var keyId = _this.lang + "_" + poll[1];
//        var like = new Like(keyId, "");
//        like.click(function (type) {
//
//        });
//    });

    //REPORT
    require(["text!~commons/modules/report/report.html"], function (html) {
        original.find(".report").remove();
        original.append(html);

        var report = new Report();
        report.click(function (type) {
            if ("badGramar" == type) {
                var nextPoll = _this.next(poll[1] + 1);
                _this.load(nextPoll);
            }
            if ("vulgarWords" == type) {
                gamePolls[poll[1]] = null;
                var nextPoll = _this.next(poll[1] + 1);
                _this.load(nextPoll);
            }
        });
    });

    //SHARE
    this.votationButtons.$sendButton.off(".gameShare");

    this.votationButtons.$sendButton.on("click.gameShare", function () {
        _this.share(obj, poll[1]);
    });

    if (!window.Device) {
        //add sharing in browser:
        shareIntent.checkShareEnvirontment(this.votationButtons.$sendButton, obj.options);
    }
};

Polls.prototype.share = function (obj, idQ) {
    var _this = this;
    console.log(obj);

    var game_db = this.gameDB();
    var lang = game_db.split("preguntas").pop();

    _this.votationButtons.poll = {
        key: lang + "_" + idQ,
        obj: obj,
        divQuery: ".gameContainer"
    };

    this.votationButtons.share(function (done) {
        _this.loaded("this.gamePoll.votatioButtons.share");
        if (!done) {
            console.log("ERROR");
            return;
        }

        if (!window.Device) {
            setTimeout(function () {
                $(_this.query).after($("#image"));
            }, 1);
        }
    });
};

Polls.prototype.loadAnimation = function (back) {
    var _this = this;

    var $container = $(_this.query + " .gameContainer:not(.game_clone)");
    var $clone = $container.clone();
    $clone.addClass("game_clone");
//    $clone.css("position", "absolute");

    $container.before($clone);
    if (false !== back) {
        if (back) {
            _this.updateTransform($container, "-100%");
        } else {
            _this.updateTransform($container, "100%");
        }
        $container.css("opacity", 0);
    }

    //prevent swipe event before reset animation
    setTimeout(function () {
        $clone.addClass("game_animation");

        setTimeout(function () {
            $container.addClass("game_animation");
            _this.updateTransform($container, "0");
            $container.css("opacity", 1);
            if (false === back) {
                $clone.hide();
            } else {
                if (back) {
                    _this.updateTransform($clone, "100%");
                } else {
                    _this.updateTransform($clone, "-100%");
                }
                $clone.css("opacity", 0);
            }

            //end animation
            var timeout = setTimeout(function () {
                $(_this.query + " .game_clone").remove();
                $container.removeClass("game_animation");
                $("#pollsPageContainer").off(".gameSwipe");
            }, 300);

            //reset animation on swipe again
            $("#pollsPageContainer").one("swipe.gameSwipe", function () {
                $container.removeClass("game_animation");
                clearTimeout(timeout);
                $(_this.query + " .game_clone").remove();
                clearTimeout(_this.gamePoll.updateOptionsTimeout);
            });

        }, 1);
    }, 1);

    return $container;
};

Polls.prototype.updateTransform = function (dom, val) {
    dom.css({
        '-webkit-transform': "translate(" + val + ")",
        '-ms-transform': "translate(" + val + ")",
        'transform': "translate(" + val + ")"
    });
};

Polls.prototype.updateCallback = function (json) {
    console.log("updateCallback " + json);
    this.loaded("updateCallback");

    if (json.indexOf("error") != -1) {
        notice(json);
        return;
    }

    var data = JSON.parse(json);
    this.update(data.idQ, 4, data.first_nvotes);
    this.update(data.idQ, 5, data.second_nvotes);
    this.update(data.idQ, 6, data.add);
    //this.gamePoll.addUserVotes();    
};

Polls.prototype.checkedEvent = function () {
    var _this = this;

    //click event
    $(this.query + " .option").off(".game");

    //second time click
    $(this.query + " .checked").one("click.game", function (e) {
        console.log("click.game");
        e.preventDefault();
        e.stopPropagation();

        var nextPoll = _this.next(_this.idQ + 1);
        _this.load(nextPoll);
    });
};

Polls.prototype.stored = function () {
    console.log("stored ");
    var table = this.gameDB();

    var json = localStorage.getItem(table);
    if (json) {
        return JSON.parse(json);
    } else {
        return {};
    }
};

Polls.prototype.update = function (id, pos, value) {
    if ("undefined" === typeof value) {
        return;
    }
    if (!gamePolls[id]) {
        console.log("!gamePolls[id]");
        return;
    }
    console.log("update: " + id + " " + pos + " " + value);
    gamePolls[id][pos] = value;
    var table = this.gameDB();
    localStorage.setItem(table, JSON.stringify(gamePolls));
};

Polls.prototype.reset = function () {
    var _this = this;

    var table = this.gameDB();
    if (!table) {
        setTimeout(function () {
            console.log("waiting db..");
            _this.loading();
            _this.reset();
        }, 500);
        return;
    }

    window.gamePolls = null;
    $("#pollsPage").html("");
    if (location.hash == "#polls") {
        hashManager.update("polls");
    }
};

Polls.prototype.loading = function (query) {
//    if (!query) {
//        $(this.query).append("<img from='searchAction' class='loading absoluteLoading' src='~img/loader.gif'/>");
//    } else {
//        $(this.query + " " + query).html("<img from='searchAction' class='loading absoluteLoading' src='~img/loader.gif'/>");
//    }
    loading(this.query, true);
};

Polls.prototype.loaded = function (where) {
    console.log(this.query + " .loading - loaded on " + where);
    //$(this.query + " .loading").remove(); //tthis not works with shareButtonLoading
    loaded(this.query, true); //all
};

Polls.prototype.update_idQ = function (idQ) {
    console.log("local idQ changed to " + idQ);
    var table = this.gameDB();
    if (!this.individual) {
        localStorage.setItem("idQ_" + table, idQ);
    }
};

Polls.prototype.gameDB = function () {
    var table = localStorage.getItem("game_db");
    if (this.request_db) {
        table = this.request_db;
    }
    return table;
};

Polls.prototype.lastIdQ = function (polls) {
    if (!polls) {
        polls = gamePolls;
    }
    if (!polls) {
        return 0;
    }
    var keys = Object.keys(polls);
    if (!keys.length) {
        return 0;
    }
    var max = Math.max.apply(Math, keys);
    console.log("max: " + max);
    return max;
};
