
var HashManager = function () {
    var _this = this;

    $(window).on('hashchange', function () {
        console.log("hashchange");
        _this.load(location.hash);
    });

    //
    this.list = {
//        'new': function () {
//            newPoll();
//        },
        'firstTime': function () {
            $("#mainPage > div").hide();
            $("#firstTime").show();
        },
        'home': function () {
            console.log("HOME");
            //else wrong/old hashes
            
            var poll = new LoadedPoll();

            var poll_div = $("#creator .options");
            if (!poll_div.html()) {
                new FillTable("#creator .votationBox", poll);
            }
            
            new VotationButtons(poll, $("#creator .buttons")).init();

            // PUBLIC CHECKBOX:
            _this.publicCheckbox();

            $("#cancel, #usersButton").hide();

            //headers
            //$("html").removeClass("withoutHeader");
            $("#pollsHeader").hide();
            $("#voteHeader").show();

            //view
            $("#mainPage > div").hide();
            $("#creator").show();

            $("#buttons").show();
            $("#showPolls").show();
            $("#stored").show();

            _this.newPollView();

            setTimeout(function () {
                fontSize();
            }, 1);
        }
    };

    //on start:
    $(document).ready(function () {
        if (!screenPoll.key) {
            //LOAD HASH after know is key or not to handle function calls
            if (location.hash) {
                console.log("lodHash() without key");
                _this.loadHashData();
            } else {
                //defaultPage on location.hash from java
                console.log("!key and !location.hash");
                _this.defaultPage();
            }
        }
    });
};

HashManager.prototype.newPollView = function () {
    console.log("HashManager.newPollView");
    if ($("#body").hasClass("pollsView")) {
        $("#body").removeClass("pollsView");
        $("#pollsHeader").hide();
        $("#voteHeader").show();

        $("#body").addClass("swiping");
        setTimeout(function () {
            $("#body").removeClass("swiping");
        }, 1);
    }
};

//prevent large urls and device url confusions
HashManager.prototype.update = function (hash, error) {
    console.log("loadHash: " + hash + " : " + error);
    //remove all loadings
    loaded();
    //remove loadKeyPoll CSS status
    $(".loadKeyPoll").removeClass("loadKeyPoll");

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
    if (!window.Device) {
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
        if (location.search) { // keep '?key' format from Device
            //location = location.origin + location.pathname + "#" + hash + error;
            location.hash = hash;
            return;
        }
        if (location.hash == "#" + hash + error) {
//            location.reload();
            //location.href = location.href + error;
            this.load(hash);
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

    if (hash.indexOf("key=") > -1) {
        screenPoll.key = hash.split("key=")[1];
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

HashManager.prototype.loadHashData = function () {
    console.log("loadHashData of: " + location.hash);
    var func = location.hash.split("#")[1];
    if (func && window[func]) {
        //if is funcion (like loading), prevent go #home
        window[func]();

    } else {
        this.load(location.hash);
        console.log(func + "() was not a function -> hashChanged()");
    }
};

HashManager.prototype.defaultPage = function () {
    this.update("home");
    $('html').removeClass('translucent');
};

//from DEVICE
HashManager.prototype.resume = function () {
    stopFlash();
    // only if loading
    if ($("#loading:visible").length && !$("html").hasClass("translucent")) {
        this.defaultPage();
    }
    $("#send").removeAttr("disabled");
};

//example: '#polls'
HashManager.prototype.href = function (url) {
    if (Device || "localhost" == location.hostname) {
        //keep pathname:
        location.href = this.deviceURL(url);
    } else {
        location.href = location.origin + "/" + url;
    }
};

HashManager.prototype.deviceURL = function (url) {
    //return location.href = location.origin + location.pathname + "?" + keyId;
    return location.origin + location.pathname + url;
};

HashManager.prototype.publicCheckbox = function () {
    var lang = localStorage.getItem("userLang");

    var ignore = ["en", "es", "fr", "de", "it", "pt"];
    if (lang && ignore.indexOf(lang.toLowerCase()) > -1) {
        return;
    }

    var makePublic = $("<div class='button publicCheckbox'>"
            + "<input type='checkbox'><span data-lang='MakePublic'>" + transl("MakePublic") + "</span>"
            + "</div>");
    $("#buttons .votationButtons").prepend(makePublic);
    makePublic.click(function () {
        var checkbox = $(this).parent().find("input");
        checkbox.prop("checked", !checkbox.prop("checked"));
        screenPoll._public = checkbox.prop("checked");
        checkbox.parent().toggleClass("publicCheck", screenPoll._public);
    });
};
