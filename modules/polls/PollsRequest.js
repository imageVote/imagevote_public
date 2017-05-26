
//polls game request
var PollsRequest = function (game, gamePolls) {
    this.game = game;
    this.gamePolls = gamePolls;
    this.file = 1;

    //update class index
    if (!window.pollRequest_index) {
        window.pollRequest_index = 0;
    }
    window.pollRequest_index++;
    this.pollRequest_index = window.pollRequest_index;

    //save globally
    window["pollsRequest_" + this.pollRequest_index] = this;

    console.log("PollsRequest " + this.pollRequest_index);
};

PollsRequest.prototype.poll = function (idQ, individual) {
    loading(null, "PollsRequest.poll");
    console.log("idQ: " + idQ + ", individual: " + individual);

    var _this = this;
    var table = this.game.gameDB();

    if (!table) {
        console.log("wrong params: " + table);
        this.game.reset();
        return false;
    }

    if (!individual) {
        this._getSortedPolls(table);
        return;
    }
    
    //INDIVIDUAL POLL ONLY
    var params = "table=" + table + "&id=" + idQ;
    this.game.idQ = idQ;

    console.log("post select " + params);
    this.game.loading();
    
    loading(null, "PollsRequest.poll2");
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

    loading(null, "PollsRequest._getSortedPolls");
    var call = "sql_sort.php";
    if (Device.simpleRequest) {
        Device.simpleRequest(call, params, this.game.window_name + ".request._pollsByKeys");
    } else {
        $.post("core/" + call, params, function (json) {
            _this._pollsByKeys(json);
        });
    }
};

PollsRequest.prototype._pollsByKeys = function (json_arr) {
    console.log("requests()");
    var table = this.game.gameDB();

    var arr = json_arr.split(",").filter(String);

    //IF YET DOWNLOADED KEY, REMOVE FROM LIST
    var response_length = arr.length;
    for (var key in this.gamePolls) {
        var index = arr.indexOf(this.gamePolls[key].id);
        if (index > -1) {
            arr.split(index, 1);
            continue;
        }
    }

    //IF NOT NEW KEYS, GET NEXT FILE KEYS
    if (!arr.length) {
        loaded();
        //if request was under 100, "no more polls"
        if (response_length < 99) {
            return false;
        }
        //next sort request
        this._getSortedPolls(table);
        return;
    }

    //STORE KEYS ARRAY (PollsGet.php)
    this.game.get.add(arr);

    //REQUEST NEW ARRAY POLLS
    var lang = table.split("_").pop();
    var params = "table=" + lang + "&arrIds=" + arr.join(",");
    
    loading(null, "PollsRequest._pollsByKeys");
    var _this = this;
    var pathRequest = this.game.coreSelect;
    if (Device.parseSelect) {
//        var func = this.window_name + ".requestCallback"; //prevent object not exists error
//        Device.parseSelect(table, "", idQ, "if(window." + func + ") " + func); //prevent server usage for parse!
        Device.simpleRequest(pathRequest, params, "pollsRequest_" + this.pollRequest_index + ".requestCallback");
    } else {
        $.post("core/" + pathRequest, params, function (json) {
            _this.requestCallback(json);
        });
    }
};

//from Device:
PollsRequest.prototype.requestCallback = function (json) {
    loaded();
    //check is last request
    if (this.pollRequest_index != window.pollRequest_index) {
        console.log("requestCallback: " + this.pollRequest_index + " != " + window.pollRequest_index);        
        return;
    }

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

    var polls = this.game.parsePolls(obj); //from GamePoll || ServerPoll
    this._loadRequest(polls);
};

PollsRequest.prototype._loadRequest = function (polls) {
    var game_db = this.game.gameDB();
    var polls_idQ = localStorage.getItem("idQ_" + game_db);
    if (null === polls_idQ) { //if not idQ saved, get first loaded poll idQ
        polls_idQ = 0;
    }

    console.log(polls);
    for (var i = 0; i < polls.length; i++) {
        var idQ = polls[i].id;

        //get votes:
        var userVotes = null;
        if (this.gamePolls[idQ]) {
            userVotes = this.gamePolls[idQ].a;
        }

        this.gamePolls[idQ] = polls[i];
        //put own votes:
        if (userVotes) {
            this.gamePolls[idQ].a = userVotes;
        }
    }

    var table = this.game.gameDB();
    if (table.indexOf("preguntas") > -1) {
        table = this._parseTable(table);
    }
    localStorage.setItem(table, JSON.stringify(this.gamePolls));

    var idQ = this.game.idQ;
    if (this.game.individual) {
        this.game.load(this.gamePolls[idQ]);
        return;
    }
    
    var nextPoll = this.game.get.this(idQ);
    if (!nextPoll) {
        var previous = this.game.get.previous(idQ);
        if (previous && idQ !== previous[1]) {
            console.log("previous: " + JSON.stringify(previous))
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
