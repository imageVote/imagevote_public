
var Polls = function () {
    //EMPTY! ONLT FOR PROTOTYPE EXTENDS CLASS
};

Polls.prototype.construct = function (query, keyId) {
    var _this = this;
    //not load if sharing!
    if (location.href.indexOf("share=") > -1) {
        console.log('location.hash.indexOf("share=")');
        loading();
        return;
    }
    console.log("new Poll " + keyId);

    //default (in case server data failed)
    window.interstitial_start = window.interstitial_start || 2;
    window.interstitial_frequency = window.interstitial_frequency || 4;
    window.stars_frequency = window.stars_frequency || 8;

    var idQ = null;
    if (keyId) {
        var keyArr = keyId.split("_");
        idQ = keyArr[keyArr.length - 1];
        if (keyArr.length > 1) {
            this.game_db = "q_" + keyArr[0];
        }
    }

    this.get = new PollsGet(this, idQ);
    this.query = query; //#pollsPageContainer

    this.answers = 0;
    this.voted = {};
    $(this.query).html("<div class='gameContainer'><div class='game'></div></div>");

    //header
    $("#voteHeader").hide();
    $("#pollsHeader").show();

    //share button
    this.buttons = $("<div id='gameButtons' class='buttons'>");
    $(this.query).append(this.buttons);
    this.votationButtons = new VotationButtons(screenPoll, this.buttons);
    this.votationButtons.$usersButton.remove();

    this.navigationEvents();

    if (!window.gamePolls) {
        console.log("get stored");
        window.gamePolls = this.stored();
    }

    this.game_config();

    translate.loadLanguage("~commons/modules/polls/", "#pollsPage", function () {
        fontSize(); //TODO: stydy where call this

        _this.nextPoll = window.gamePolls[_this.get.idQ];
        if ("object" === typeof (_this.nextPoll) && !_this.get.individual) { //if individual, force request
            _this.load(_this.nextPoll, _this.get.individual);

        } else {
            console.log("request.poll " + _this.get.idQ);
            _this.pollsRequest = new PollsRequest(_this, window.gamePolls).poll(_this.get.idQ, _this.get.individual);
        }
    });
};

Polls.prototype.navigationEvents = function () {
    var _this = this;

    $("#pollsPageContainer").off(".gamePoll");

    $("#pollsPageContainer").on("swiperight.gamePoll", function (e) {
        e.preventDefault();
        e.stopPropagation();
        var previousPoll = _this.get.previous();
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
        var nextPoll = _this.next(null, anyone);
        _this.load(nextPoll, true);
    });

    var gameSwipeButtons = $("<div id='gameSwipeButtons'>");

    //var back = $("<button id='gameBack'><em style='height:15px'></em><span data-lang='back_symbol'>" + transl("back_symbol") + "</span></button>");
    var back = $("<a is='pushstate-anchor' class='button' id='gameBack'><em style='height:15px'></em><span><</span></a>");
    gameSwipeButtons.append(back);
    back.on("click", function () {
        var previousPoll = _this.get.previous();
        if (previousPoll) {
            _this.load(previousPoll, true, true);
        } else {
            flash(transl("polls_noMoreFound") + " (3)");
        }
        _this.navigationButtons(previousPoll);
    });

    //var next = $("<button id='gameNext'><em style='height:15px'></em><span data-lang='next_symbol'>" + transl("next_symbol") + "</span></button>");
    var next = $("<a is='pushstate-anchor' class='button' id='gameNext'><em style='height:15px'></em><span>></span></a>");
    gameSwipeButtons.append(next);
    var anyone = true;
    next.on("click", function () {
        var nextPoll = _this.next(null, anyone);
        _this.load(nextPoll, true);
        console.log(nextPoll)
        _this.navigationButtons(nextPoll);
    });

    this.buttons.find(".votationButtons").append(gameSwipeButtons);
    this.buttons.find("#cancel").hide();

//    if (is_touch_device()) {
//        gameSwipeButtons.hide();
//    }
};

Polls.prototype.navigationButtons = function (poll) {
    var _this = this;

    //w8 button link pushstate url
    setTimeout(function () {
        if (!poll) {
            return;
        }

        var prefix = "";
        var gameDB = _this.gameDB();
        if (gameDB && gameDB.split("_").length > 1) {
            prefix = gameDB.split("_").pop() + "_";
        }

        var keysArr = _this.get.keysArray();
        var index = keysArr.indexOf("" + poll.id);
        if (!(index > -1)) {
            return;
        }

        if (index - 1 >= 0) {
            var keyBack = keysArr[index - 1];
            _this.buttons.find("#gameBack").attr("href", prefix + keyBack);
        }
        if (index + 1 < keysArr.length) {
            var keyNext = keysArr[index + 1];
            _this.buttons.find("#gameNext").attr("href", prefix + keyNext);
        }
    }, 1);
};

Polls.prototype.game_config = function () {
    //prevent multiple loads
    if (window.game_config_loaded) {
        return;
    }
    window.game_config_loaded = true;

    var window_name = "gamePoll_" + this.query.replace(/[^a-z]/gi, ''); //remove not alphanumeric
    window[window_name] = this;

    console.log("GamePoll.game_config");
    var _this = this;
    //this info needs to be in server to update all devices in realtime!
    var file = "game_config.json";
    if (Device.simpleRequest) {
        Device.simpleRequest(file, null, window_name + ".game_configCallback");
    } else {
        //$.post returns error:412 in ios with '.json' !!
        $.getJSON("core/" + file, function (data) {
            _this.game_configCallback(data);
        });
    }
};

Polls.prototype.next = function (idQ, anyone) {
    var poll = this.get.next(idQ, anyone);
    if (poll) {
        return poll;
    }

    //THEN LOAD NEW
    var storedPolls = window.gamePolls;
    this.pollsRequest = new PollsRequest(this, storedPolls).poll();
};

Polls.prototype.load = function (poll, individual, back) {
    if (!poll) {
        //can be: NO MORE POLLS IN SQL_SORT.PHP (not redirect)
        console.log("!poll");
//        if (this.get.idQ) {
//            hashManager.defaultPage();
//            notice("e_votationRemoved");
//        }
        return false;
    }
    if (!poll.id) {
        console.log("!poll.id: " + JSON.stringify(poll));
        return false;
    }

    var _this = this;
    console.log("loadGamePoll " + poll.id);

    //if already voted
    if ("undefined" != typeof poll.a && !individual) {
        console.log("load NEXT");
        var next = this.next(+poll.id);
        if (next) {
            poll = next;
        }
    }

    //this for device manipulation for browser share
    var obj = this.obj = {
        question: poll.q || "",
        options: [
            [0, poll.a0, poll.v0],
            [1, poll.a1, poll.v1]
        ],
        users: {}
    };

    //add own votes
    console.log(JSON.stringify(poll))
    if ("undefined" !== typeof poll.a) {
        obj.users[window.user.id] = [window.user.id, poll.a];
    }

    //stop previous timeouts
    if (window.gamePoll) {
        clearTimeout(gamePoll.updateOptionsTimeout);
    }

    var original = this.loadAnimation(back);
    original.attr("data-idQ", poll.id);

    var lang = this.gameDB().split("_").pop().toLowerCase();
    var key = lang + "_" + poll.id;
    var objPoll = {
        key: key,
        obj: obj
    };
    window.gameTable = this.gameTable = new FillTable(original, objPoll, null, function (option) {
        console.log("game option click " + option);
        _this.voted[poll.id] = true;
        if (!obj.users[window.user.id]) {
            obj.users[window.user.id] = getUserArray();
        }
        obj.users[window.user.id][1] = option;

        //remove last event fast:        
        _this.checkedEvent();

        var table = _this.gameDB();
        if (!table) {
            console.log("LANGUAGE GAME NOT FOUND");
            _this.reset();
            return;
        }

        //MIX (ON TRANSITION):
        table = _this.parseLang(table);

        var idQ = poll.id;
        //update locally - before to continue playing (after params set!)    
        _this.update(idQ, 'a', option);
        for (var i = 0; i < obj.options.length; i++) {
            _this.update(idQ, 'v' + obj.options[i][0], obj.options[i][2]);
        }

        //SAVE        
        new Save(objPoll, $(_this.query)).do(function (key) {
            //
        }, null, [option]);

        //Stars:
        _this.answers++;

        //TODO: save stars done
        var stars_done = localStorage.getItem("rate");
        if (!stars_done && window.stars_frequency && _this.answers > window.stars_frequency) {
//            if (Device.showStars) {
//                Device.showStars();
//            }
            if (Device) {
                $("<div>").appendTo("body").load("~commons/modules/rate/rate.html", function () {
                    new Rate();
                });
            }
        }

        if (window.interstitial_frequency && _this.answers % window.interstitial_frequency == window.interstitial_start) {
            console.log("Device.loadAd()");
            if (Device.loadAd) {
                Device.loadAd();
            }
        }

        //to prevent change votation on the fly:
        return false;
    });

    if (this.onFillTable) {
        this.onFillTable(poll);
    }

    //prevent reselect
    if ("undefined" != typeof poll.a) {
        this.checkedEvent();
    }
    //prevent fast vote change 
    if (this.voted[poll.id]) {
        original.find(".option").css("pointer-events", "none");
    }

    //DEPENDS ON GAME
    this.loadModules(original, poll);

    //SHARE
    this.votationButtons.$sendButton.off(".gameShare");
    this.votationButtons.$sendButton.on("click.gameShare", function () {
        _this.share(obj, poll.id);
    });

    if (!window.Device) {
        //add sharing in browser:
        shareIntent.checkShareEnvirontment(this.votationButtons.$sendButton, obj.options);
    }
};

Polls.prototype.loadModules = function (table, poll) {
    var _this = this;

//    // ENABLE WHEN GAME POLLS COMES FROM SERVER!! 
//    //LIKE
//    require(["text!~commons/modules/like/like.html"], function (html) {
//        poll.find(".like").remove();
//        poll.append(html);
//
//        var keyId = _this.lang + "_" + poll.id;
//        var like = new Like(keyId, "");
//        like.click(function (type) {
//
//        });
//    });

    //REPORT
    require(["text!~commons/modules/report/report.html"], function (html) {
        table.find(".report").remove();

        //w8 Report var initializes
        table.append(html);

        setTimeout(function () {
            var report = new Report();
            report.click(function (type) {
                if ("badGramar" == type) {
                    var nextPoll = _this.next(poll.id);
                    _this.load(nextPoll);
                }
                if ("vulgarWords" == type) {
                    window.gamePolls[poll.id] = null;
                    var nextPoll = _this.next(poll.id);
                    _this.load(nextPoll);
                }
            });
        }, 10);
    });
};

Polls.prototype.share = function (obj, idQ) {
    var _this = this;
    console.log(obj);

    var game_db = this.gameDB();
    var lang = game_db.split("_").pop().toLowerCase();

    _this.votationButtons.poll = {
        key: lang + "_" + idQ,
        obj: obj,
        divQuery: ".gameContainer"
    };

//    new Share(_this.votationButtons.poll, $("#pollsPage")).do(function () {
    new Share(_this.votationButtons.poll, $("#pollsPageContainer")).do(function () {
        if (!window.Device) {
            setTimeout(function () {
                $(_this.query).after($("#image"));
            }, 1);
        }

        _this.loaded("this.gameTable.votatioButtons.share");
    });
};

Polls.prototype.loadAnimation = function (back) {
    var _this = this;
    var width = $(document).width();

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
        if (width > 480) {
            $container.css("opacity", 0);
        }
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
                if (width > 480) {
                    $clone.css("opacity", 0);
                }
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
                clearTimeout(_this.gameTable.updateOptionsTimeout);
            });

        }, 1);
    }, 1);

    return $container;
};

Polls.prototype.updateTransform = function ($dom, val) {
    $dom.css({
        '-webkit-transform': "translate(" + val + ")",
        '-ms-transform': "translate(" + val + ")",
        'transform': "translate(" + val + ")"
    });
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

        var nextPoll = _this.next();
        _this.load(nextPoll);
    });
};

Polls.prototype.stored = function () {
    var table = this.parseTable();
    console.log("stored " + table);

    var json = localStorage.getItem(table);
    if (json) {
        return JSON.parse(json);
    } else {
        return {};
    }
};

Polls.prototype.update = function (id, pos, value) {
    if ("undefined" === typeof value) {
        console.log('"undefined" === typeof ' + value);
        return;
    }
    if (!window.gamePolls[id]) {
        console.log("!window.gamePolls[id]");
        return;
    }
    //console.log("update: " + id + " " + pos + " " + value);
    window.gamePolls[id][pos] = value;
    var table = this.parseTable();
    localStorage.setItem(table, JSON.stringify(window.gamePolls));
};

Polls.prototype.reset = function () {
    var _this = this;

    var table = this.gameDB();
    if (!table) {
        setTimeout(function () {
            console.log("waiting db..");
            _this.loading(null, "Polls.reset");
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
//    loading(this.query, true);
    loading(null, "Polls loading " + query);
};

Polls.prototype.loaded = function (where) {
    console.log(this.query + " .loading - loaded on " + where);
    //$(this.query + " .loading").remove(); //tthis not works with shareButtonLoading
    loaded(this.query, true); //all
};

Polls.prototype.gameDB = function () {
    //if overrided
    if (this.game_db) {
        return this.game_db;
    }

    var table = localStorage.getItem("game_db");

    //REPAIR OLD APP VERSIONS (DEPRECATED)
    if (table && table.indexOf("preguntas") > -1) {
        this.repairLocalStorage();
        table = this.repairTable(table);
    }

    return table;
};

Polls.prototype.parseLang = function (table) {
    //MIX (ON TRANSITION):
    table = this.repairTable(table);
    return table.split("_").pop(); //like q_es
};

Polls.prototype.parseTable = function (table) {
    if (!table) {
        var gameDB = this.gameDB();
        if (gameDB) {
            return "q_" + gameDB.split("_").pop().toLowerCase();
        }
        //
    }

    table = this.repairTable(table);
    return table;
};

//DEPRECATED
Polls.prototype.repairTable = function (table) {
    if (table && table.indexOf("preguntas") > -1) {
        var lang = table.split("preguntas").pop().toLowerCase();
        if (!lang) {
            lang = "es";
        }
        table = "q_" + lang;
    }
    return table;
};

//DEPRECATED
Polls.prototype.repairLocalStorage = function () {
    for (var key in localStorage) {
        if (key.indexOf("preguntas") > -1) {
            var keyArr = key.split("preguntas");
            var lang = keyArr[1].toLowerCase();
            if (!lang) {
                lang = "es";
            }
            localStorage[keyArr[0] + lang] = localStorage[key];
            localStorage.removeItem(key);
        }
    }
    var gameDB = localStorage.getItem("game_db");
    if (gameDB.indexOf("preguntas") > -1) {
        var lang = gameDB.split("preguntas").pop().toLowerCase();
        if (!lang) {
            lang = "es";
        }
        localStorage.setItem("game_db", "q_" + lang);
    }
};

