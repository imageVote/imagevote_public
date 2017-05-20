
var Polls = function () {

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
//    this.$sendButton = $("<button id='gameShare'><em style='height:15px'></em><span data-lang='Share'></span></button>");
//    this.buttons.append(this.share);
    $(this.query).append(this.buttons);
    //window.screenPoll.buttons = this.votationButtons = new VotationButtons(screenPoll, this.buttons); //game can't be screenPoll ???
    this.votationButtons = new VotationButtons(screenPoll, this.buttons);
    this.votationButtons.$usersButton.remove();

    this.navigationEvents();

    translate.loadLanguage("~commons/modules/polls/lang", function () {
        translate.translateTags();
        fontSize(); //TODO: stydy where call this
    });

    if (!window.gamePolls) {
        console.log("get stored " + lang);
        window.gamePolls = this.stored();
    }

    this.individual = false;
    if (!idQ) {
        var table = this.gameDB();
        idQ = localStorage.getItem("idQ_" + table);
    } else {
        console.log("SHARED");
        this.individual = true;
    }
    //if !idQ stored: 
    if (!idQ || "undefined" == idQ) {
        idQ = 0;
    }
    if (gamePolls[idQ]) {
        this.nextPoll = gamePolls[idQ];
    }

    //this info needs to be in server to update all devices in realtime!
    this.idQ = +idQ;
    this.game_config();

    if (this.nextPoll) {
        this.load(this.nextPoll, this.individual);
    } else {
        console.log("request " + this.idQ);
        this.request(this.idQ, this.individual, lang);
    }
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
        var nextPoll = _this.next(+_this.idQ + 1, anyone);
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
        var nextPoll = _this.next(+_this.idQ + 1, anyone);
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

Polls.prototype.request = function (idQ, individual) {
    console.log("idQ: " + idQ + ", individual: " + individual);
    if ("undefined" == typeof idQ || isNaN(idQ)) {
        console.log("!request() " + idQ);
        return;
    }

    //prevent loop requests
    if (idQ == this.request_idQ) {
        return;
    }
    this.request_idQ = idQ;
    var _this = this;
    var table = this.gameDB();

    if ("undefined" == typeof idQ || !table) {
        console.log("wrong params: " + idQ + " " + table);
        this.reset();
        return false;
    }

    if (!individual) {
        this.getSortedPolls(table);
        return;
    }

    var params = "table=" + table + "&id=" + idQ;
    this.idQ = idQ;

    console.log("post select " + params);
    this.loading();

    if (Device.parseSelect) {
        var func = this.window_name + ".requestCallback"; //prevent object not exists error
        Device.parseSelect(table, "", idQ, "if(window." + func + ") " + func); //prevent server usage for parse!
    } else {
        $.post(this.coreSelect, params, function (json) {
            _this.requestCallback(json);
        });
    }
};

Polls.prototype.getSortedPolls = function (table, file) {
    if (["q_en", "q_es", "q_it", "q_de", "q_fr", "q_pt"].indexOf(table) > -1) {
        table = this.parseTable(table);
    }else{
        table = table.split("_").pop(); 
    }

    var _this = this;
    var params = "table=" + table;
    if (file > 1) {
        params += "&file=" + file;
    }
    $.post("core/sql_sort.php", params, function (json) {
        _this.requests(json);
    });
};

Polls.prototype.requests = function (json_arr) {
    var arr = json_arr.split(",").filter(String);
    var length = arr.length;
    for (var key in gamePolls) {
        var index = arr.indexOf(gamePolls[key].id);
        if (index > -1) {
            arr.split(index, 1);
            continue;
        }
    }

    var table = this.gameDB();

    //get next file keys
    if (!arr.length) {
        if (length < 99) {
            return false;
        }
        if (!this.file) {
            this.file = 1;
        }
        this.file++;
        getSortedPolls(table, this.file);
        return;
    }

    //request
    table = table.split("_").pop();
    var params = "table=" + table + "&arrIds=" + arr.join(",");

    var _this = this;
    if (Device.parseSelect) {
        var func = this.window_name + ".requestCallback"; //prevent object not exists error
        Device.parseSelect(table, "", idQ, "if(window." + func + ") " + func); //prevent server usage for parse!
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
//        gamePolls[poll.id] = poll;
//    }
    var game_db = this.gameDB();
    var polls_idQ = localStorage.getItem("idQ_" + game_db);
    if (null === polls_idQ) { //if not idQ saved, get first loaded poll idQ
        //polls_idQ = polls[0][1]; //this auses bug on loaded polls not starting in idQ == 1 (it)
        polls_idQ = 0;
    }

    console.log(polls);
    for (var i = 0; i < polls.length; i++) {
        var idQ = polls[i].id;
        gamePolls[idQ] = polls[i];
    }

    var table = this.gameDB();
    if (table.indexOf("preguntas") > -1) {
        table = this.parseTable(table);
    }
    localStorage.setItem(table, JSON.stringify(gamePolls));

//    var next_idQ = this.idQ + 1;
//    if (this.individual) {
    var next_idQ = this.idQ;
//    }
    var nextPoll = this.next(next_idQ);
    if (!nextPoll) {

//        //PREVENT LAT idQ LOOP
//        var table = this.gameDB();
//        var request = table + "_" + idQ;
//        if (request === this.last_request) {
//            console.log("stop request loop " + request);
//            flash(transl("polls_noMoreFound"));
//            //reset request
//            this.last_request = false;
//            return;
//        }
//        this.last_request = request;

        console.log("no poll!");
        var previous = this.previous(next_idQ);
        console.log("previous: " + JSON.stringify(previous))
        if (this.idQ !== previous[1]) {
            this.load(previous, true, false); //FALSE totally removes animation
        }
        return;
    }
    this.load(nextPoll);
};

Polls.prototype.next = function (idQ, anyone) {
    var storedPolls = gamePolls;
    //console.log(storedPolls);

    var lastIdQ = this.lastIdQ(storedPolls);
    var i = +idQ;
    console.log("next " + idQ + " of " + lastIdQ + "(" + anyone + ")");

    while (i <= lastIdQ) {
        console.log("looking for poll " + i);
        var poll = storedPolls[i];
        if (null === poll || "undefined" === typeof poll) {
            i++;
            continue;
        }

        this.idQ = i;
        this.update_idQ(i);
        if ("undefined" === typeof poll.a || anyone) {
            return storedPolls[i];
        }
        i++;
    }

    console.log("NO MORE STORED POLLS");
    if (lastIdQ) {
        flash(transl("polls_noMoreFound"));
    }

    var request_idQ;
    if (!$.isEmptyObject(storedPolls)) {
        request_idQ = Object.keys(storedPolls).reduce(function (a, b) {
            a = +a;
            b = +b;
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

    //get previous polls
    if (idQ > 10) {
        this.request(idQ - 100);
        return;
    }

    return false;
};

Polls.prototype.load = function (poll, individual, back) {
    if (!poll) {
//        this.request(poll.id);
        return false;
    }

    var _this = this;
    console.log("loadGamePoll " + poll.id);

    //if already voted
    if ("undefined" != typeof poll.a && !individual) {
        console.log("load NEXT");
        var idQ = +poll.id;
        var next = this.next(+idQ + 1);
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
            this.reset();
            return;
        }

        //MIX (ON TRANSITION):
        table = _this.parseLang(table);

        var idQ = poll.id;
        var options = JSON.stringify([option]);
        var params = "table=" + table + "&id=" + poll.key + "&add=" + options + "&idQ=" + idQ + "&userId=" + window.user.id + "&data=" + options;
        //decrease: (poll.a can be 0!)
        if ("undefined" != typeof poll.a && option != poll.a) {
            params += "&sub=" + JSON.stringify([poll.a]);

            //update locally (after params set!)
            _this.update(idQ, 'v' + poll.a, +poll['v' + poll.a] + 1);
        }
        console.log(params);

        //update locally - before to continue playing (after params set!)    
        _this.update(idQ, 'a', option);
        console.log(JSON.stringify(poll))
        _this.update(idQ, 'v' + option, +poll['v' + option] + 1);

        _this.update_idQ(idQ + 1);

        //if (window.update_frequency && Math.random() * window.update_frequency < 1) {
        //console.log("post update " + window.update_frequency);
        if (Device.parseUpdate) {
            //Device.simpleRequest("parseUpdate.php", params, _this.window_name + ".updateCallback");
            Device.parseUpdate(table, poll.key, option, poll.key, idQ, _this.window_name + ".updateCallback");
        } else {
            $.post(_this.coreUpdate, params, function (json) {
                _this.updateCallback(json);
            });
        }
        //}

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
                    console.log(12345)
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
        _this.checkedEvent();
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
                    var nextPoll = _this.next(+poll.id + 1);
                    _this.load(nextPoll);
                }
                if ("vulgarWords" == type) {
                    gamePolls[poll.id] = null;
                    var nextPoll = _this.next(+poll.id + 1);
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
    var lang = game_db.split("preguntas").pop();

    _this.votationButtons.poll = {
        key: lang + "_" + idQ,
        obj: obj,
        divQuery: ".gameContainer"
    };

    var share = new Share(_this.votationButtons.poll);
    share.do(function () {
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

Polls.prototype.updateCallback = function (json) {
    console.log("updateCallback " + json);
    this.loaded("updateCallback");

    if (json.indexOf("error") != -1) {
        notice(json);
        return;
    }

    var data;
    try {
        data = JSON.parse(json);
    } catch (e) {
        return; //update if callback only
    }

    this.update(data.idQ, 'v0', data.first_nvotes);
    this.update(data.idQ, 'v1', data.second_nvotes);
    this.update(data.idQ, 'a', data.add);
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

        var nextPoll = _this.next(+_this.idQ + 1);
        console.log(888);
        _this.load(nextPoll);
    });
};

Polls.prototype.stored = function () {
    var table = this.gameDB();
    console.log("stored: " + table);

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

Polls.prototype.lastIdQ = function (polls) {
    if (!polls) {
        polls = gamePolls;
    }
    if (!polls) {
        return 0;
    }

    var max = 0;
    Object.keys(polls).forEach(function (key) {
        max = key > max ? +key : max; //force int '+'
    });
    return max;
};

Polls.prototype.parseTable = function (table) {
    var lang_arr = table.split("_");
    if (lang_arr.length == 2) {
        var lang = lang_arr[1];
        if ("es" == lang) {
            lang = "";
        }
        table = "preguntas" + lang.toUpperCase();
    }

    return table;
};

Polls.prototype.parseLang = function (table) {
    //MIX (ON TRANSITION):
    if (table.indexOf("preguntas") > -1) {
        var lang = table.replace("preguntas", "");
        if (!lang) {
            lang = "es";
        }
        table = "q_" + lang.toLowerCase();
    }
    return table;
};
