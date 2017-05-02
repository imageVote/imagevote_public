
//poll url loading
$(document).ready(function () {
    setTimeout(function () {
        var keyId;
        //can't find url from device!
        if (window.screenPoll) {
            keyId = screenPoll.key;
        } else {
            console.log("!screenPoll in GamePoll setTimeout");
        }
        console.log("GamePoll setTimeout " + keyId);

        if (!keyId) {
            return;
        }

        var urlParts = getPathsFromKeyId(keyId);
        console.log(urlParts);

        if ("_" == urlParts.symbol) {
            console.log("'_' detected in GamePoll");
            window.gamePollKey = new GamePoll("#pollsPage", urlParts.realKey, "gamePollKey", urlParts.prefix.toUpperCase());
            //$("html").removeClass("withoutHeader");
            $("#body").addClass("pollsView");
        }
    }, 1);
});

var GamePoll = function (query, idQ, window_name, lang) {
    console.log("new GamePoll " + idQ + " " + lang);

    //default (in case server data failed)
    this.interstitial_frequency = 5;
    this.stars_frequency = 8;
    this.update_frequency = false; // '= 1' to update allways 

    this.query = query; //#pollsPageContainer
    this.lang = lang;
    this.window_name = window_name;
    if ("undefined" != typeof lang) {
        this.request_db = "preguntas" + lang;
    }

    this.answers = 0;
    this.voted = {};
    $(this.query).html("<div class='gameContainer'><div class='game'></div></div>");

    //header
    $("#voteHeader").hide();
    $("#pollsHeader").show();

    //share button
    this.buttons = $("<div id='gameButtons'>");
//    this.$sendButton = $("<button id='gameShare'><em style='height:15px'></em><span data-lang='Share'></span></button>");
//    this.buttons.append(this.share);
    $(this.query).append(this.buttons);
    //window.screenPoll.buttons = this.votationButtons = new VotationButtons(screenPoll, this.buttons); //game can't be screenPoll ???
    this.votationButtons = new VotationButtons(screenPoll, this.buttons);
    this.votationButtons.$usersButton.remove();

    this.navigationEvents();

    loadLanguage("~commons/modules/polls/lang", function () {
        translateTags();
        fontSize(); //TODO: stydy where call this
    });

    if (!window.gamePolls) {
        console.log("get stored " + lang);
        window.gamePolls = this.stored(lang);
    }

    this.individual = false;
    if (!idQ) {
        var table = this.gameDB();
        idQ = localStorage.getItem("idQ_" + table);
        if (idQ && "undefined" != idQ) {
            this.nextPoll = this.next(idQ);
        } else {
            idQ = 0;
        }

    } else {
        console.log("SHARED");
        this.individual = true;
        this.nextPoll = gamePolls[idQ];
    }

    //this info needs to be in server to update all devices in realtime!
    this.idQ = parseInt(idQ);

    this.game_config();

    if (this.nextPoll) {
        this.load(this.nextPoll, this.individual);
    } else {
        console.log("request " + this.idQ);
        this.request(this.idQ, this.individual, lang);
    }
};

GamePoll.prototype.navigationEvents = function () {
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
            flash("no more polls");
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

GamePoll.prototype.game_config = function () {
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

//DEVICE CALLBACK FUNCTION:
GamePoll.prototype.game_configCallback = function (json) {
    console.log("game_configCallback " + json);

    var data;
    if ("string" == typeof json) {
        try {
            data = JSON.parse(json);
        } catch (e) {
            console.log(json);
            console.log(e);
            return;
        }
    } else {
        data = json;
    }
    console.log(data);

    this.interstitial_frequency = data.interstitial_frequency;
    this.stars_frequency = data.stars_frequency;
    this.update_frequency = data.update_frequency;
};

GamePoll.prototype.request = function (idQ, individual) {
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
        $.post("core/parseSelect.php", params, function (json) {
            _this.requestCallback(json);
        });
    }
};

GamePoll.prototype.requestCallback = function (json) {
    //console.log(json);
    this.loaded("requestCallback");

    json = json.replace(/\r\n/g, "<br/>");

    var polls;
    try {
        polls = JSON.parse(json);
    } catch (e) {
        console.log(e);
        if (json.length > 1000) {
            console.log("in " + json.substr(0, 20) + " [...] " + json.substr(json.length - 20));
        } else {
            console.log("in " + json);
        }
        return;
    }


    if (!polls.results) {
        console.log("error !polls.results");
        return;
    }

    var arr = polls.results;

    var polls = [];
    for (var i = 0; i < arr.length; i++) {
        polls.push([
            arr[i].objectId,
            arr[i].idQ,
            arr[i].first,
            arr[i].second,
            arr[i].first_nvotes,
            arr[i].second_nvotes
        ]);
    }

    //SAVE AS FALSE UNEXISTING POLLS, ALLOW NULL's TO NOT YET LOADED POLLS
//    for (var i = 0; i < polls.length; i++) {
//        var poll = polls[i];
//        gamePolls[poll[1]] = poll;
//    }
    var polls_index = 0;
    var game_db = this.gameDB();
    var polls_idQ = localStorage.getItem("idQ_" + game_db);
    if (null === polls_idQ) { //if not idQ saved, get first loaded poll idQ
        //polls_idQ = polls[0][1]; //this auses bug on loaded polls not starting in idQ == 1 (it)
        polls_idQ = 0;
    }
    
    console.log(polls)
    var last_idQ = polls[polls.length - 1][1];
    while (polls_idQ <= last_idQ) {
        while (polls_idQ < polls[polls_index][1]) {
            gamePolls[polls_idQ] = null;
            polls_idQ++;
        }
        gamePolls[polls_idQ] = polls[polls_index];
        polls_idQ++;
        polls_index++;
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
        return;
    }
    this.load(nextPoll);
};

GamePoll.prototype.next = function (idQ, anyone) {
    console.log("anyone: " + anyone)
    var storedPolls = gamePolls;
    //console.log(storedPolls);

    var i = idQ;
    var lastIdQ = this.lastIdQ(storedPolls);
    console.log("next " + idQ + " of " + lastIdQ);
    while (i <= lastIdQ) {
        console.log("looking for poll " + i);
        var poll = storedPolls[i];
        if (null === poll) {
            i++;
            continue;
        } else if ("undefined" === typeof poll) {
            console.log("nothing in poll idQ " + i);
            this.request(i);
            return;
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

GamePoll.prototype.previous = function () {
    //var idQ = this.idQ;
    var idQ = $(this.query + " .gameContainer").attr("data-idq");
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

GamePoll.prototype.load = function (poll, individual, back) {
    if (!poll) {
//        this.request(poll[1]);
        return false;
    }

    var _this = this;
    console.log("loadGamePoll " + poll[1]);

    //if already voted
    if ("undefined" != typeof poll[6] && !individual) {
        poll = this.next(poll[1] + 1);
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
        var params = "table=" + table + "&id=" + poll[0] + "&add=" + option + "&idQ=" + poll[1];
        //decrease: (poll[6] can be 0!)
        if ("undefined" != typeof poll[6] && option != poll[6]) {
            params += "&sub=" + poll[6];

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
                $.post("core/parseUpdate.php", params, function (json) {
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
            if (Device.showStars) {
                Device.showStars();
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

GamePoll.prototype.share = function (obj, idQ) {
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

GamePoll.prototype.loadAnimation = function (back) {
    var _this = this;

    var $container = $(_this.query + " .gameContainer:not(.game_clone)");
    var $clone = $container.clone();
    $clone.addClass("game_clone");
//    $clone.css("position", "absolute");

    $container.before($clone);
    if (back) {
        _this.updateTransform($container, "-100%");
    } else {
        _this.updateTransform($container, "100%");
    }
    $container.css("opacity", 0);

    //prevent swipe event before reset animation
    setTimeout(function () {
        $clone.addClass("game_animation");

        setTimeout(function () {
            $container.addClass("game_animation");
            _this.updateTransform($container, "0");
            $container.css("opacity", 1);
            if (back) {
                _this.updateTransform($clone, "100%");
            } else {
                _this.updateTransform($clone, "-100%");
            }
            $clone.css("opacity", 0);

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

GamePoll.prototype.updateTransform = function (dom, val) {
    dom.css({
        '-webkit-transform': "translate(" + val + ")",
        '-ms-transform': "translate(" + val + ")",
        'transform': "translate(" + val + ")"
    });
};

GamePoll.prototype.updateCallback = function (json) {
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

GamePoll.prototype.checkedEvent = function () {
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

GamePoll.prototype.stored = function () {
    console.log("stored ");
    var table = this.gameDB();

    var json = localStorage.getItem(table);
    if (json) {
        return JSON.parse(json);
    } else {
        return {};
    }
};

GamePoll.prototype.update = function (id, pos, value) {
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

GamePoll.prototype.reset = function () {
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

GamePoll.prototype.loading = function (query) {
//    if (!query) {
//        $(this.query).append("<img from='searchAction' class='loading absoluteLoading' src='~img/loader.gif'/>");
//    } else {
//        $(this.query + " " + query).html("<img from='searchAction' class='loading absoluteLoading' src='~img/loader.gif'/>");
//    }
    loading(this.query, true);
};

GamePoll.prototype.loaded = function (where) {
    console.log(this.query + " .loading - loaded on " + where);
    //$(this.query + " .loading").remove(); //tthis not works with shareButtonLoading
    loaded(this.query, true); //all
};

GamePoll.prototype.update_idQ = function (idQ) {
    console.log("local idQ changed to " + idQ);
    var table = this.gameDB();
    if (!this.individual) {
        localStorage.setItem("idQ_" + table, idQ);
    }
};

GamePoll.prototype.gameDB = function () {
    var table = localStorage.getItem("game_db");
    if (this.request_db) {
        table = this.request_db;
    }
    return table;
};

GamePoll.prototype.lastIdQ = function (polls) {
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
