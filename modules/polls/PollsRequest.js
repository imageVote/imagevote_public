
var PollsRequest = function (game, gamePolls) {
    this.game = game;
    this.gamePolls = gamePolls;
    this.file = 1;
};

PollsRequest.prototype.poll = function (idQ, individual) {
    console.log("idQ: " + idQ + ", individual: " + individual);
    if ("undefined" == typeof idQ || isNaN(idQ)) {
        console.log("!request.poll() " + idQ);
        return;
    }

    var _this = this;
    var table = this.game.gameDB();

    if ("undefined" == typeof idQ || !table) {
        console.log("wrong params: " + idQ + " " + table);
        this.game.reset();
        return false;
    }

    if (!individual) {
        this.getSortedPolls(table);
        return;
    }

    var params = "table=" + table + "&id=" + idQ;
    this.game.idQ = idQ;

    console.log("post select " + params);
    this.game.loading();

    if (Device.parseSelect) {
        //var func = this.window_name + ".requestCallback"; //prevent object not exists error
        //Device.parseSelect(table, "", idQ, "if(window." + func + ") " + func); //prevent server usage for parse!
        Device.simpleRequest(this.game.coreSelect, params, this.window_name + ".requestCallback");
    } else {
        $.post("core/" + this.game.coreSelect, params, function (json) {
            _this.requestCallback(json);
        });
    }
};

PollsRequest.prototype._getSortedPolls = function (table) {
    console.log("_getSortedPolls() ");
    var _this = this;

    if (["q_en", "q_es", "q_it", "q_de", "q_fr", "q_pt"].indexOf(table) > -1) {
        table = this._parseTable(table);
    } else {
        table = table.split("_").pop();
    }

    var params = "table=" + table;
    if (this.file > 1) {
        params += "&file=" + this.file;
    }
    this.file++;

    var call = "sql_sort.php";
    if (Device.simpleRequest) {
        Device.simpleRequest(call, params, this.game.window_name + ".request._polls");
    } else {
        $.post("core/" + call, params, function (json) {
            _this._polls(json);
        });
    }
};

PollsRequest.prototype._polls = function (json_arr) {
    console.log("requests()");

    var arr = json_arr.split(",").filter(String);
    var length = arr.length;
    for (var key in this.gamePolls) {
        var index = arr.indexOf(this.gamePolls[key].id);
        if (index > -1) {
            arr.split(index, 1);
            continue;
        }
    }

    var table = this.game.gameDB();

    //get next file keys
    if (!arr.length) {
        if (length < 99) {
            return false;
        }

        this._getSortedPolls(table);
        return;
    }

    //request
    table = table.split("_").pop();
    var params = "table=" + table + "&arrIds=" + arr.join(",");
//    var params = "table=" + table + "&arrIds=" + encodeURIComponent(arr.join(","));

    var _this = this;
    var pathRequest = this.game.coreSelect;
    if (Device.parseSelect) {
//        var func = this.window_name + ".requestCallback"; //prevent object not exists error
//        Device.parseSelect(table, "", idQ, "if(window." + func + ") " + func); //prevent server usage for parse!
        Device.simpleRequest(pathRequest, params, this.window_name + ".requestCallback");
    } else {
        $.post("core/" + pathRequest, params, function (json) {
            _this.requestCallback(json);
        });
    }
};

//from Device:
PollsRequest.prototype.requestCallback = function (json) {
    //console.log(json);
    this.game.loaded("requestCallback");
    if (!json) {
        flash(transl("polls_noMoreFound"));
        var idQ = this.game.lastIdQ();
        this.game.load(this.gamePolls[idQ], null, false);
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

    var polls = this.game.parsePolls(obj); //GamePoll || ServerPoll

    //SAVE AS FALSE UNEXISTING POLLS, ALLOW NULL's TO NOT YET LOADED POLLS
//    for (var i = 0; i < polls.length; i++) {
//        var poll = polls[i];
//        this.gamePolls[poll.id] = poll;
//    }
    var game_db = this.game.gameDB();
    var polls_idQ = localStorage.getItem("idQ_" + game_db);
    if (null === polls_idQ) { //if not idQ saved, get first loaded poll idQ
        //polls_idQ = polls[0][1]; //this auses bug on loaded polls not starting in idQ == 1 (it)
        polls_idQ = 0;
    }

    console.log(polls);
    for (var i = 0; i < polls.length; i++) {
        var idQ = polls[i].id;
        this.gamePolls[idQ] = polls[i];
    }

    var table = this.game.gameDB();
    if (table.indexOf("preguntas") > -1) {
        table = this._parseTable(table);
    }
    localStorage.setItem(table, JSON.stringify(this.gamePolls));

//    var next_idQ = this.idQ + 1;
//    if (this.individual) {
//    var next_idQ = this.idQ;
//    }
    var idQ = this.game.idQ;
    if (this.game.individual) {
        this.game.load(this.gamePolls[idQ]);
        return;
    }

    var nextPoll = this.game.next(idQ);
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
        var previous = this.game.previous(idQ);
        console.log("previous: " + JSON.stringify(previous))
        if (idQ !== previous[1]) {
            this.game.load(previous, true, false); //FALSE totally removes animation
        }
        return;
    }
    this.game.load(nextPoll);
};

PollsRequest.prototype._parseTable = function (table) {
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
