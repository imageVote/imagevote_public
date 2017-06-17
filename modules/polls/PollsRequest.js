
//polls game request
var PollsRequest = function (game, gamePolls) {
    this.game = game;
    this.gamePolls = gamePolls;
    this.file = 1;
};

PollsRequest.prototype.poll = function (id, individual) {
    loading(null, "PollsRequest.poll");
    console.log("id: " + id + ", individual: " + individual);

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

    var lang = table.split(/(_|-)/).pop().toLowerCase();

    //INDIVIDUAL POLL ONLY
    var params = "table=" + lang + "&id=" + id;
    this.game.id = id;

    console.log("post select " + params);
    this.game.loading();

    loading(null, "PollsRequest.poll2");
    if (Device.parseSelect) {
        var global = "pollsRequest_" + this.uniqueIndex();
        window[global] = this;
        Device.simpleRequest(this.game.coreSelect, params, global + ".requestCallback");
    } else {
        $.post(settings.corePath + this.game.coreSelect, params, function (json) {
            _this.requestCallback(json);
        });
    }
};

PollsRequest.prototype._getSortedPolls = function (table) {
    console.log("_getSortedPolls() ");
    var _this = this;
    table = table.split("_").pop();

    var params = "table=" + table.toLowerCase();
    if (this.file > 1) {
        params += "&file=" + this.file;
    }
    this.file++;

    loading(null, "PollsRequest._getSortedPolls");
    var call = "sql_sort.php";
    if (Device.simpleRequest) {
        var global = "gameRequests_" + table;
        window[global] = this;
        Device.simpleRequest(call, params, global + "._pollsByKeys");
    } else {
        $.post(settings.corePath + call, params, function (json) {
            _this._pollsByKeys(json);
        });
    }
};

PollsRequest.prototype._pollsByKeys = function (json_arr) {
    console.log("requests()");
    var table = this.game.gameDB();

    var arr = json_arr.split(",").filter(String);
    console.log("ARR");
    console.log(arr);

    //SOLVE ANY BUG WITH MISSING idsArray()
    if (!this.game.get.idsArray().length) {
        console.log("reparing bug: add idsArray in _pollsByKeys");
        this.game.get.add(json_arr.split(",").filter(String));
    }
    
    //IF YET DOWNLOADED KEY, REMOVE FROM LIST
    var response_length = arr.length;
    for (var key in this.gamePolls) {
        var index = arr.indexOf(key);
        if (index > -1) {
            arr.splice(index, 1);
            continue;
        }
    }
    
    //IF NOT NEW KEYS, GET NEXT FILE KEYS
    if (!arr.length) {
        console.log("!arr.length");
        loaded();
        //if request was under 100, "no more polls"
        if (!response_length) {
            //NOT POLLS WITH THIS PARAMETERS:
            var styles = "position:absolute; text-align:center; top:10px; width:100%";
            $(this.game.query).find(".polls_emptyLanguage").remove();
            $(this.game.query).append("<p class='polls_emptyLanguage' style='" + styles + "'>" + transl("polls_emptyLanguage") + "</p>");
            return false;

        } else if (response_length < 99) {
            console.log("response_length < 99 (" + response_length + ")");
            return false;
        }
        //next sort request
        this._getSortedPolls(table);
        return;
    }
    
    //STORE KEYS ARRAY (PollsGet.php)
    this.game.get.add(arr);
    
    //REQUEST NEW ARRAY POLLS
    var lang = table.split("_").pop().toLowerCase();
    var params = "table=" + lang + "&arrIds=" + arr.join(",");

    loading(null, "PollsRequest._pollsByKeys");
    var _this = this;
    var pathRequest = this.game.coreSelect;
    if (Device.parseSelect) {
        var global = "pollsRequest_" + this.uniqueIndex();
        window[global] = this;
        Device.simpleRequest(pathRequest, params, global + ".requestCallback");
    } else {
        $.post(settings.corePath + pathRequest, params, function (json) {
            _this.requestCallback(json);
        });
    }
};

//from Device:
PollsRequest.prototype.requestCallback = function (json) {
    loaded();
    //check is last request
    if (this.pollRequest_index != window.pollRequest_index) { //if not last requested
        console.log("requestCallback: " + this.pollRequest_index + " != " + window.pollRequest_index);
        return;
    }

    //console.log(json);
    this.game.loaded("requestCallback");
    if (!json) {
        flash(transl("polls_noMoreFound") + " (2)");
        var id = this.game.get.lastId();
        this.game.load(this.gamePolls[id], null, false);
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

    var polls = this.game.parsePolls(obj); //from GamePoll
    this._loadRequest(polls);
};

PollsRequest.prototype._loadRequest = function (polls) {
    console.log(JSON.stringify(polls));
    for (var i = 0; i < polls.length; i++) {
        var id = polls[i].id;

        //get votes:
        var userVotes = null;
        if (this.gamePolls[id]) {
            userVotes = this.gamePolls[id].a;
        }

        this.gamePolls[id] = polls[i];
        //put own votes:
        if (userVotes || 0 === userVotes) {
            this.gamePolls[id].a = userVotes;
        }
    }
    //DEPRECATED!
    window.gamePolls = this.gamePolls;

    var table = this.game.parseTable(table);
    console.log("saving " + table);
    localStorage.setItem(table, JSON.stringify(this.gamePolls));

    var id = this.game.id;
    var nextPoll = this.game.get.this(id);
    if (!nextPoll) {
        var previous = this.game.get.previous(id);
        if (previous && id !== previous[1]) {
            console.log("previous: " + JSON.stringify(previous));
            this.game.load(previous, true, false); //FALSE must totally removes animation
        }
        //console.log(JSON.stringify(this.gamePolls));
        console.log("!nextPoll " + id);
        return;
    }
    this.game.load(nextPoll);
};

PollsRequest.prototype.uniqueIndex = function () {
    if (!window.pollRequest_index) {
        window.pollRequest_index = 0;
    }
    window.pollRequest_index++;
    this.pollRequest_index = window.pollRequest_index;
};
