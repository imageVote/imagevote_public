
function HashManager() {
    var _this = this;
    
    $(window).on('hashchange', function () {
        console.log("hashchange");
        _this.load(location.hash);
    });
    
    //
    this.list = {
        'new': function () {
            newPoll();
        },
        'firstTime': function () {
            $("#mainPage > div").hide();
            $("#firstTime").show();
        },
        'home': function () {
            console.log("HOME");
            //else wrong/old hashes
//        loadHash("home");

            VotationInterface_addButtons();
            $("#cancel, #usersButton").hide();

            //headers
            $("html").removeClass("withoutHeader");
            $("#pollsHeader").hide();
            $("#voteHeader").show();
            //view
            $("#mainPage > div").hide();
            $("#creator").show();

            $("#buttons").show();
            $("#showPolls").show();
            $("#stored").show();

            newPollView();
        }
    };
}

//prevent large urls and device url confusions
HashManager.prototype.update = function (hash, error) {
    console.log("loadHash: " + hash + " : " + error);
    //remove all loadings
    $(".loading").remove();

    //need trigger hashchange
    $(document).trigger("urlUpdate", [hash]);

    if (!hash) {
        hash = "";
    }
    hash = hash.replace("#", "");

    if (!error) {
        error = "";
    } else {
        error = "?" + error;
    }

    //REMOVE ALL TRICKI EVENTS
    //$("*").off(".temp");

    //prevent hashing after key url
    if (!Device) {
//        var arr = location.href.split("/");
//        arr.pop();
//        location.href = arr.join("/") + "/#" + hash + "?" + error;}
        if (location.hash == "#" + hash + error) {
            this.load(hash);
        } else {
            location.href = location.origin + location.pathname + "#" + hash + error;
        }
    } else {
        //keep complete url for assets
        if (location.search) {
            location = location.origin + location.pathname + "#" + hash + error;
            return;
        }
        if (location.hash == hash) {
//            location.reload();
            location.href = location.href + error;
            return;
        }
        location.hash = hash;
    }
};

//then, handle hash change
HashManager.prototype.load = function (hash) {
    hash = hash.replace("#", "").split("?")[0];
    console.log("hash changed to: " + hash);
    //need trigger hashchange

    if (!hash) {
        hash = "home";
    }

    if (hash.search(/^key=/i) > -1) {
        screenPoll.key = hash.split("=")[1];
        $("html").addClass("withoutHeader");
        window.keyPoll = new LoadKeyPoll(screenPoll);

    } else {
        console.log(this);
        console.log(hash);
        if (this.list[hash]) {
            this.list[hash]();
        }
    }

    var error = hash.split("?");
    if (error.length > 1) {
        notice(transl(error[1]));
    }
};
