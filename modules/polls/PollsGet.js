
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
    console.log("this(" + idQ + ")");
    var keysArray = this.keysArray();
    //var i = this.indexKey(idQ) + 1;
    var i = 0;
    if (idQ) {
        console.log("idQ: " + idQ);
        i = this.indexKey(idQ);
    }
    var key = keysArray[i];
    var poll = window.gamePolls[key];
    if ("object" !== typeof poll) {
        console.log('"object" !== typeof ' + JSON.stringify(poll) + " with key:" + key + "(" + i + ")");
        return this.next(key, true);
    }
    return poll;
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
        var idQ = arr_keys[i];
        var poll = storedPolls[idQ];
        if (null === poll || "undefined" === typeof poll) {
            continue;
        }

        //get next poll
        var notVoted = "undefined" === typeof poll.a;
        if (anyone || notVoted) {
            this.pollIndex = i;
            this.idQ = +arr_keys[i];
            if (notVoted) {
                this.update_pollIndex(this.pollIndex);
                this.update_idQ(this.idQ);
            }
            return poll;
        }
    }

    //update new poll loaded on next()    
    flash(transl("polls_noMoreFound") + " (1)");
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
        console.log("!arr_keys");
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
    var lang = table.split("_").pop().toLowerCase();
    var local_key = "keysArray_" + lang;
    var local_data = localStorage.getItem(local_key);

    if (!local_data) {
        loading(null, "keysArray !local_data"); //w8 poll from servers
        console.log("!local_data in keysArray: " + local_key);
        return [];
    }

    return local_data.split(",");
};

PollsGet.prototype.indexKey = function (idQ) {
    if (!idQ) {
        idQ = this.idQ;
    }
    var keys = this.keysArray();
    if (!keys) {
        return;
    }
    return keys.indexOf("" + idQ);
};

PollsGet.prototype.add = function (arr) {
    //check is correct data FIRST:
    for (var i = 0; i < arr.length; i++) {
        if (isNaN(arr[i])) {
            console.log("WRONG NUMBER ON SORT ARRAY WITH: " + arr[i]);
            return;
        }
    }

    var keysArray = [];
    var existingArrayPolls = this.keysArray();
    if (existingArrayPolls) {
        keysArray = existingArrayPolls;
    }

    //CONCAT:
    for (var i = 0; i < arr.length; i++) {
        var key = arr[i];
        if (keysArray.indexOf(key) == -1) {
            keysArray.push(key);
        }
    }

    var table = this.game.gameDB();
    var lang = table.split("_").pop().toLowerCase();
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
