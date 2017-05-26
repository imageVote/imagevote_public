
var Polls = function () {
    //EMPTY! ONLT FOR PROTOTYPE EXTENDS CLASS
};

Polls.prototype.construct = function (query, idQ, window_name, lang) {
    //not load if sharing!
    if (location.href.indexOf("share=") > -1) {
        console.log('location.hash.indexOf("share=")');
        loading();
        return;
    }
    console.log("new Poll " + idQ + " " + lang);

    //default (in case server data failed)
    window.interstitial_start = window.interstitial_start || 2;
    window.interstitial_frequency = window.interstitial_frequency || 4;
    window.stars_frequency = window.stars_frequency || 8;

    this.get = new PollsGet(this, idQ);
    this.query = query; //#pollsPageContainer
    this.window_name = window_name;

    this.answers = 0;
    this.voted = {};
    $(this.query).html("<div class='gameContainer'><div class='game'></div></div>");

    //header
    $("#voteHeader").hide();
    $("#pollsHeader").show();

    //share button
    this.buttons = $("<div id='gameButtons'>");
    $(this.query).append(this.buttons);
    this.votationButtons = new VotationButtons(screenPoll, this.buttons);
    this.votationButtons.$usersButton.remove();

    this.navigationEvents();

    translate.loadLanguage("~commons/modules/polls/", "#pollsPage", function () {
        translate.translateTags();
        fontSize(); //TODO: stydy where call this
    });

    if (!window.gamePolls) {
        console.log("get stored " + lang);
        window.gamePolls = this.stored();
    }

    this.game_config();

    this.nextPoll = window.gamePolls[this.get.idQ];
    if (this.nextPoll) {
        this.load(this.nextPoll, this.get.individual);
    } else {
        console.log("request.poll " + this.get.idQ);
        //this.request.poll(this.idQ, this.individual, lang);
        new PollsRequest(this, window.gamePolls).poll(this.get.idQ, this.get.individual);
    }
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

    var back = $("<button id='gameBack'><em style='height:15px'></em><span data-lang='back_symbol'></span></button>");
    gameSwipeButtons.append(back);
    back.on("click", function () {
        var previousPoll = _this.get.previous();
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
        var nextPoll = _this.next(null, anyone);
        _this.load(nextPoll, true);
    });

    this.buttons.find(".votationButtons").append(gameSwipeButtons);
    this.buttons.find("#cancel").hide();

//    if (is_touch_device()) {
//        gameSwipeButtons.hide();
//    }
};

Polls.prototype.game_config = function () {
    //prevent multiple loads
    if (window.game_config_loaded) {
        return;
    }
    window.game_config_loaded = true;

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

Polls.prototype.next = function (idQ, anyone) {
    var poll = this.get.next(idQ, anyone);
    if (poll) {
        return poll;
    }

    //THEN LOAD NEW
    var storedPolls = window.gamePolls;
    new PollsRequest(this, storedPolls).poll();
};

Polls.prototype.load = function (poll, individual, back) {
    if (!poll) {
        console.log("!poll");
        if (this.get.idQ) {
            hashManager.defaultPage();
            notice("e_votationRemoved");
        }
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
        question: "",
        options: [
            [0, poll.a0, poll.v0],
            [1, poll.a1, poll.v1]
        ],
        users: {}
    };

    //add own votes
    if ("undefined" !== typeof poll.a) {
        obj.users[window.user.id] = [window.user.id, poll.a];
    }

    //stop previous timeouts
    if (window.gamePoll) {
        clearTimeout(gamePoll.updateOptionsTimeout);
    }

    var original = this.loadAnimation(back);
    original.attr("data-idQ", poll.id);

    window.gamePoll = this.gamePoll = new FillTable(original, obj, null, function (option) {
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

        //decrease: (poll.a can be 0!)
        if ("undefined" != typeof poll.a && option != poll.a) {
            //update locally (after params set!)
            _this.update(idQ, 'v' + poll.a, +poll['v' + poll.a] + 1);
        }

        //update locally - before to continue playing (after params set!)    
        _this.update(idQ, 'a', option);
        _this.update(idQ, 'v' + option, +poll['v' + option] + 1);

        //SAVE
        var keyId = _this.gameDB().split("_").pop() + "_" + poll.id
        new Save({key: keyId, obj: obj}, $(_this.query)).do(function (key) {
            //
        }, null, [option], [poll.a]);

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

    // ENABLE WHEN GAME POLLS COMES FROM SERVER!! 
//    //LIKE
//    require(["text!~commons/modules/like/like.html"], function (html) {
//        original.find(".like").remove();
//        original.append(html);
//
//        var keyId = _this.lang + "_" + poll.id;
//        var like = new Like(keyId, "");
//        like.click(function (type) {
//
//        });
//    });

    //REPORT
    require(["text!~commons/modules/report/report.html"], function (html) {
        original.find(".report").remove();

        //w8 Report var initializes
        original.append(html);

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

Polls.prototype.share = function (obj, idQ) {
    var _this = this;
    console.log(obj);

    var game_db = this.gameDB();
    var lang = game_db.split("_").pop();

    _this.votationButtons.poll = {
        key: lang + "_" + idQ,
        obj: obj,
        divQuery: ".gameContainer"
    };

    new Share(_this.votationButtons.poll, $("#pollsPage")).do(function () {
        if (!window.Device) {
            setTimeout(function () {
                $(_this.query).after($("#image"));
            }, 1);
        }

        _this.loaded("this.gamePoll.votatioButtons.share");
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
    var table = this.gameDB();
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
    console.log("update: " + id + " " + pos + " " + value);
    window.gamePolls[id][pos] = value;
    var table = this.gameDB();
    localStorage.setItem(table, JSON.stringify(window.gamePolls));
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
//    loading(this.query, true);
    loading();
};

Polls.prototype.loaded = function (where) {
    console.log(this.query + " .loading - loaded on " + where);
    //$(this.query + " .loading").remove(); //tthis not works with shareButtonLoading
    loaded(this.query, true); //all
};

Polls.prototype.gameDB = function () {
    var table = localStorage.getItem("game_db");
//    if (this.request_db) {
//        table = this.request_db;
//    }

//    //repare: only on transition!
//    if(table.indexOf("preguntas") > -1){
//        table = table.replace("preguntas", "");
//        if(!table){
//            table = "es";
//        }
//    }

    console.log("gameDB: " + table);
    return table;
};

Polls.prototype.parseLang = function (table) {
    //MIX (ON TRANSITION):
    if (table.indexOf("preguntas") > -1) {
        var lang = table.replace("preguntas", "");
        if (!lang) {
            lang = "es";
        }
        //table = "q_" + lang.toLowerCase();
        table = lang.toLowerCase();
    }
    return table.split("_").pop(); //like q_es
};
