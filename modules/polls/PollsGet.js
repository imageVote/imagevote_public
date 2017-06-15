
var PollsGet = function (game, id) {
    this.game = game;

    this.individual = false;
    if (id) {
        console.log("SHARED");
        this.individual = true;
    }

    var ids_arr = this.idsArray();

    if (!id) {
        var lang = this.gameLang();
        id = localStorage.getItem("id_" + lang);
        if (!id && ids_arr) {
            id = ids_arr[0];
        }
    }

    this.id = id;
    this.pollIndex = 0;
    if (ids_arr && id) {
        this.pollIndex = ids_arr.indexOf(id);
    }
    console.log("id: " + id);
};

PollsGet.prototype.this = function (id) {
    console.log("this(" + id + ")");
    var idsArray = this.idsArray();
    //var i = this.indexId(id) + 1;
    var i = 0;
    if (id) {
        console.log("id: " + id);
        i = this.indexId(id);
    }
    var this_id = idsArray[i];
    var poll = window.gamePolls[this_id];
    if ("object" !== typeof poll) {
        console.log('"object" !== typeof ' + JSON.stringify(poll) + " with id:" + this_id + "(" + i + ")");
        return this.next(this_id, true);
    }
    return poll;
};

PollsGet.prototype.next = function (id, anyone) {
//    throw new Error('sample');
    console.log("next() " + id + " " + anyone);
    var i = this.indexId(id);
    if (!i > -1) {
        i = this.pollIndex;
        anyone = false;
        console.log(anyone = false + " !i > -1")
    }
    i++;

    var storedPolls = window.gamePolls;
    var arr_ids = this.idsArray();

    for (; i < arr_ids.length; i++) {
        var id = arr_ids[i];
        var poll = storedPolls[id];
        if (null === poll || "undefined" === typeof poll) {
            continue;
        }

        if (this.blacklisted(poll)) {
            continue;
        }

        //get next poll
        var notVoted = "undefined" === typeof poll.a;
        if (anyone || notVoted) {
            this.pollIndex = i;
            this.id = +arr_ids[i];
            if (notVoted) {
                this.update_pollIndex(this.pollIndex);
                this.update_id(this.id);
            }
            return poll;
        }
    }

    //update new poll loaded on next()    
    flash(transl("polls_noMoreFound") + " (1)");
};

PollsGet.prototype.previous = function (id) {
    if (!id) {
        id = this.id;
        if (!id) {
            id = this.lastId();
        }
    }
    console.log("previous. attr id " + id);
    var storedPolls = window.gamePolls;

    var arr_ids = this.idsArray();
    if (!arr_ids) {
        console.log("!arr_ids");
        return;
    }

    var i = 0;
    if (id) {
        i = arr_ids.indexOf("" + id) - 1;
    }

    for (; i > -1; i--) {
        var prev_id = arr_ids[i];
        var poll = storedPolls[prev_id];
        if (!poll) {
            console.log("!poll: " + prev_id);
            continue;
        }

        if (this.blacklisted(poll)) {
            continue;
        }

        console.log(id + " to " + prev_id);
        this.pollIndex = i; //not save locally when 'previous'
        this.id = prev_id; //not save locally when 'previous'        
        return poll;
    }

};

//PollsGet.prototype.idsArray = function () {
//    var table = this.game.gameDB();
//    if (!table) {
//        console.log("!gameDB() in idsArray()");
//        return false;
//    }
//    var lang = table.split("_").pop().toLowerCase();
//    var local_key = "idsArray_" + lang;
//    var local_data = localStorage.getItem(local_key);
//
//    if (!local_data) {
//        loading(null, "idsArray !local_data"); //w8 poll from servers
//        console.log("!local_data in idsArray: " + local_key);
//        return [];
//    }
//
//    return local_data.split(",");
//};

PollsGet.prototype.idsArray = function () {
    var table = this.game.gameDB();
    if (!table) {
        console.log("!gameDB() in idsArray()");
        return false;
    }
    var lang = table.split("_").pop().toLowerCase();
    var local_data = localStorage.getItem("idsArray_" + lang);

    if (!local_data) {
        loading(null, "idsArray !local_data"); //w8 poll from servers
        console.log("!local_data in idsArray: idsArray_" + lang);
        return [];
    }

    return local_data.split(",");
};

PollsGet.prototype.indexId = function (id) {
    if (!id) {
        id = this.id;
    }
    var ids_array = this.idsArray();
    if (!ids_array) {
        return;
    }
    return ids_array.indexOf("" + id);
};

PollsGet.prototype.add = function (arr) {
    //check is correct data FIRST:
    for (var i = 0; i < arr.length; i++) {
        if (isNaN(arr[i])) {
            console.log("WRONG NUMBER ON SORT ARRAY WITH: " + arr[i]);
            return;
        }
    }

    var idsArray = [];
    var existingArrayPolls = this.idsArray();
    if (existingArrayPolls) {
        idsArray = existingArrayPolls;
    }

    //CONCAT:
    for (var i = 0; i < arr.length; i++) {
        var id = arr[i];
        if (idsArray.indexOf(id) == -1) {
            idsArray.push(id);
        }
    }

    var table = this.game.gameDB();
    var lang = table.split("_").pop().toLowerCase();
    localStorage.setItem("idsArray_" + lang, idsArray);
};

PollsGet.prototype.lastId = function () {
    var ids_array = this.idsArray();
    return ids_array[ids_array.length - 1];
};

PollsGet.prototype.update_pollIndex = function (index) {
    console.log("local pollIndex changed to " + index);
    var lang = this.gameLang();
    if (!this.individual) {
        localStorage.setItem("pollIndex_" + lang, index);
    }
};

PollsGet.prototype.update_id = function (id) {
    var lang = this.gameLang();
    if (!this.individual) {
        localStorage.setItem("id_" + lang, id);
    }
};

PollsGet.prototype.gameLang = function () {
    var gameDB = this.game.gameDB();
    if (gameDB) {
        return gameDB.split("_").pop();
    }
};

PollsGet.prototype.blacklisted = function (poll) {
    var blacklist = this.game.blacklist;
    for (var i = 0; i < blacklist.length; i++) {
        var exp = new RegExp("\\b" + blacklist[i].toLowerCase() + "\\b");
        if (exp.test((poll.a0 + " " + poll.a1).toLowerCase())) {
            console.log("blacklisted!");
            return true;
        }
    }
}
