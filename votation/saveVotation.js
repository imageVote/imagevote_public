
// CONNECTIVITY

VotationButtons.prototype.saveAjax = function(action, json, callback) {
    if ("true" == this.poll.isPublic) {
        //but let share!
        //error("Vote on public polls whithout APP is forbidden.");
        error("PublicOnlyFromApp");
        return;
    }

    $.ajax({
        url: settings.corePath + "update.php",
        method: "POST",
        cache: false,
        data: {
            action: action,
            id: window.user.id,
            key: this.poll.key,
            value: json
        }
    }).done(function (res) {
        console.log(res);
        if (!res) {
            error("errorAjaxResponse");
            //TODO ERROR ?
            return;
        }
        if (callback) {
            callback(res);
        }

    }).error(function (res) {
        console.log(res);
        console.log("can't connect with ajax");
        error("votationNotSaved");

        //debug
        saveToShare();
        this.poll.key = " ";
    });
}

VotationButtons.prototype.saveDevice = function(action, callback) {
    var _this = this;
    
    var json = this.poll.json;
    var isPublic = "" + this.poll.isPublic;
    var country = this.poll.country;
    var key = this.poll.key;
    
    if(!this.keyWaiting){
        this.keyWaiting = 0;
    }
    
    //FORCE WAIT KEY
    if (!key && !isPublic && "create" == action) { //check external key!
        if (this.keyWaiting > 8) {
            flash(transl("waitingKeyExpired"));
            return;
        }

        //wait 4 key arrive
        setTimeout(function () {
            _this.saveDevice(action, callback);
        }, 700);

        console.log("looking for new key");
        this.keyWaiting++;
        return;
    }
    this.keyWaiting = 0;

    //localStorage.setItem("unusedKey", "");
    var realKey = "";
    if (key) {
        var urlParts = getPathsFromKeyId(key);
        realKey = this.poll.realKey = urlParts.realKey;
    }

    //key value is only added on create()
    if (!window.lastKeyAsk) {
        window.lastKeyAsk = 0;
    }
    console.log("callback: " + callback);
    Device.save(action, json, window.lastKeyAsk, realKey, isPublic, country, callback);
};

function saveLocally(key, data) {
    //console.log(data);
    if (key) { //check is correct stores query
        var time = (new Date()).getTime();
        localStorage.setItem("key_" + key, JSON.stringify([time, data]));
    } else {
        console.log("WRONG KEY TO STORE: " + key);
    }
}
