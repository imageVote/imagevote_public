
var PollsGet = function (game, idQ) {
    this.game = game;

    this.individual = false;
    if (idQ) {
        console.log("SHARED");
        this.individual = true;
    }

    var keys_arr = this.keysArray();

    if (!idQ) {
        var lang = this.gameLang();
        idQ = localStorage.getItem("idQ_" + lang);
        if (!idQ && keys_arr) {
            idQ = keys_arr[0];
        }
    }

    this.idQ = idQ;
    this.pollIndex = 0;
    if (keys_arr && idQ) {
        this.pollIndex = keys_arr.indexOf(idQ);
    }
    console.log("idQ: " + idQ);
};

PollsGet.prototype.this = function (idQ) {
    var keysArray = this.keysArray();
    var i = this.indexKey(idQ) + 1;
    var key = keysArray[i];
    return window.gamePolls[key];
};

PollsGet.prototype.next = function (idQ, anyone) {
    console.log("next() " + idQ + " " + anyone);
    var i = this.indexKey(idQ);
    if (!i > -1) {
        i = this.pollIndex;
    }
    i++;

    var storedPolls = window.gamePolls;
    var arr_keys = this.keysArray();

    for (; i < arr_keys.length; i++) {
        this.pollIndex = i;
        this.idQ = +arr_keys[i];

        var poll = storedPolls[this.idQ];
        if (null === poll || "undefined" === typeof poll) {
            continue;
        }

        //get next poll
        var notVoted = "undefined" === typeof poll.a;
        if (anyone || notVoted) {
            if (notVoted) {
                this.update_pollIndex(this.pollIndex);
                this.update_idQ(this.idQ);
            }
            return poll;
        }
    }

    //update new poll loaded on next()    
    flash(transl("polls_noMoreFound"));
};

PollsGet.prototype.previous = function (idQ) {
    if (!idQ) {
        idQ = this.idQ;
        if (!idQ) {
            idQ = this.lastIdQ();
        }
    }
    console.log("previous. attr idQ " + idQ);
    var storedPolls = window.gamePolls;

    var arr_keys = this.keysArray();
    if (!arr_keys) {
        return;
    }

    var i = 0;
    if (idQ) {
        i = arr_keys.indexOf("" + idQ) - 1;
    }

    for (; i > -1; i--) {
        var key = arr_keys[i];
        var poll = storedPolls[key];
        if (!poll) {
            console.log("!poll: " + key);
            continue;
        }

        console.log(idQ + " to " + key);
        this.pollIndex = i; //not save locally when 'previous'
        this.idQ = key; //not save locally when 'previous'        
        return poll;
    }

};

PollsGet.prototype.keysArray = function () {
    var table = this.game.gameDB();
    if (!table) {
        console.log("!gameDB() in keysArray()");
        return false;
    }
    var lang = table.split("_").pop();
    var local_data = localStorage.getItem("keysArray_" + lang);
    if (!local_data) {
        console.log("!local_data in keysArray");
        return false;
    }
    return local_data.split(",");
};

PollsGet.prototype.indexKey = function (idQ) {
    if (!idQ) {
        idQ = this.idQ;
    }
    return this.keysArray().indexOf("" + idQ);
};

PollsGet.prototype.add = function (arr) {
    var previous_arr = [];
    var existingArrayPolls = this.keysArray();
    if (existingArrayPolls) {
        previous_arr = existingArrayPolls;
    }

    var keysArray = previous_arr.concat(arr);
    var table = this.game.gameDB();
    var lang = table.split("_").pop();
    localStorage.setItem("keysArray_" + lang, keysArray);
};

PollsGet.prototype.lastIdQ = function () {
    var keys = this.keysArray();
    return keys[keys.length - 1];
};

PollsGet.prototype.update_pollIndex = function (index) {
    console.log("local pollIndex changed to " + index);
    var lang = this.gameLang();
    if (!this.individual) {
        localStorage.setItem("pollIndex_" + lang, index);
    }
};

PollsGet.prototype.update_idQ = function (idQ) {
    var lang = this.gameLang();
    if (!this.individual) {
        localStorage.setItem("idQ_" + lang, idQ);
    }
};

PollsGet.prototype.gameLang = function () {
    var gameDB = this.game.gameDB();
    if (gameDB) {
        return gameDB.split("_").pop();
    }
};
