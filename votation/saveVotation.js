
// CONNECTIVITY

function saveAjax(action, json, callback) {
    if ("true" == screenPoll.public) {
        //but let share!
        //error("Vote on public polls whithout APP is forbidden.");
        error("PublicOnlyFromApp");
        return;
    }

    $.ajax({
        url: window.urlPath + "/core/update.php",
        method: "POST",
        cache: false,
        data: {
            action: action,
            id: user.id,
            key: screenPoll.key,
            value: json
        }
    }).done(function(res) {
        console.log(res);
        if (!res) {
            error("errorAjaxResponse");
            //TODO ERROR ?
            return;
        }
        screenPoll.key = res;

        if (callback) {
            callback();
        }
    }).error(function(res) {
        console.log(res);
        console.log("can't connect with ajax");
        error("votationNotSaved");

        //debug
        saveToShare();
        screenPoll.key = " ";
    });
}

var keyWaiting = 0;
function saveDevice(action, json, public, country, callback) {
    var _args = arguments;
    var key = screenPoll.key;
    //FORCE WAIT KEY
    if (!key && !public && "create" == action) { //check external key!
        //4 prevent repeat work on timeout
        if (!sending) {
            flash(lang["waitingKey"], true);
            sending = true;
        }
        
        if(window.keyWaiting > 8){
            flash(lang["waitingKeyExpired"]);
            return;
        }

        //wait 4 key arrive
        setTimeout(function() {            
            saveDevice.apply(this, _args);
        }, 700);
        
        console.log("looking for new key");
        window.keyWaiting++;
        return;
    }
    window.keyWaiting = 0;

    //localStorage.setItem("unusedKey", "");
    var realKey = "";
    if (key) {
        var urlParts = getPathsFromKeyId(key);
        realKey = screenPoll.realKey =urlParts.realKey;
    }
    
    //key value is only added on create()
    if(!window.lastKeyAsk){
        window.lastKeyAsk = 0;
    }    
    console.log("callback: " + callback);
    Device.save(action, json, lastKeyAsk, realKey, public, country, "" + callback);
}

function saveLocally(key, data) {
    //console.log(data);
    if (key) { //check is correct stores query
        var time = (new Date()).getTime();
        localStorage.setItem("key_" + key, JSON.stringify([time, data]));
    } else {
        console.log("WRONG KEY TO STORE: " + key);
    }
}

