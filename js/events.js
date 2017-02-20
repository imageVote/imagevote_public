
//if (Device) {
//    //2.3 production
//    window.console = {
//        log: function(txt) {
//            Device.log("" + txt);
//        }
//    };
//}

// Only Chrome & Opera pass the error object.
window.onerror = function (msg, url, line, col, err) {
    var extra = !col ? '' : '\ncolumn: ' + col;
    extra += !err ? '' : '\nerror: ' + err;
    var errorMmessage = "; Error: " + msg + "\nurl: " + url + "\nline: " + line + extra + "; ";

    //this workd for android
    console.log(errorMmessage, "from", err.stack);

    error(errorMmessage, arguments.callee.caller);
};
// Only Chrome & Opera have an error attribute on the event.
window.addEventListener("error", function (e) {
    console.log(e.error.message, "from", e.error.stack);
});

function error(txt, f) {
    //try transation

    //if number
    txt += "";

    var text = transl(txt).replace(/["']/g, "");
    notice("error: " + text, true);

    if ($("#loading:visible").length) {
        //console.log("load defaultPage after error");
        //defaultPage();
    }

    //add stack to Log
    while (f) {
        console.log("stack");
        txt += ":: " + f.name + "; ";
        f = f.caller;
    }

    //send
    if (!Device) {
        $.post(window.urlPath + "/core/error.php", {
            error: text
        });
    } else {
        Device.error(text);
    }
}

function notice(text, isError) {
    $("#errorLog").show();
    if (!text) {
        text = "unknown error";
    }
    var err = $("<div data-lang='" + text + "'>" + text + "</div>");
    $("#errorLog").append(err);
    return err;
}

//prevent large urls and device url confusions
function loadHash(hash, error) {
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
            hashChanged(hash);
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
}

//then, handle hash change
function hashChanged(hash) {
    hash = hash.replace("#", "").split("?")[0];
    console.log("hash changed to: " + hash)
    //need trigger hashchange

    if (hash.search(/^key=/i) > -1) {
        screenPoll.key = hash.split("=")[1];
        $("html").addClass("withoutHeader");
        loadKeyPoll();

    } else if ("new" == hash) {
        newPoll();

    } else if ("firstTime" == hash) {
        $("#mainPage > div").hide();
        $("#firstTime").show();

    } else if ("polls" == hash) {
        $("html").removeClass("withoutHeader");
        $("#pollsHeader").hide();
        $("#voteHeader").show();

        pollsView();

    } else { //and home
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

    var error = hash.split("?");
    if (error.length > 1) {
        notice(transl(error[1]));
    }
}

function newPollView() {
    if ($("#body").hasClass("pollsView")) {
        $("#body").removeClass("pollsView");
        $("#pollsHeader").hide();
        $("#voteHeader").show();

        $("#body").addClass("swiping");
        setTimeout(function () {
            $("#body").removeClass("swiping");
        }, 1);
    }
}

function pollsView() {
    $("#body").addClass("pollsView");
    $("#voteHeader").hide();
    $("#pollsHeader").show();

    //re-load
    if (!$("#pollsPage > div").length) {
        new GamePoll("#pollsPage");

        if (status == "error") {
            flash(lang["notLoadingPolls"]);
            return;
        }
    }
    $("#loading").hide();
}

$(document).ready(function () {

    window.lastKeyAsk = 0;
    $("#create").click(function () {
        console.log("CREATE");
        $("#errorLog").html("");

        if (!$("#options").val()) {
            flash(transl("min1Option"));
            return;
        }

        if (!checkConnection()) {
            console.log("!checkConnection");
            return;
        }

        //load by hash change
        window.lastKeyAsk++; //first, to be the same after
        window.fromCreateFunction = true; //prevents new polls when click back button or similar
        loadHash("new"); //newPoll()                
    });

    //first time app
    $("#firstOk").click(function () {
        if (Device) {
            Device.firstTimeOk();
        } else {
            loadHash("home");
        }
    });
    $("#firstCreate").click(function () {
        loadHash("home");
    });
    //

    //resize
    textareaHeight = $(document).height() / 2 - 180;
    var rows = Math.max(Math.floor(textareaHeight / 20), 3);
    $("#options").attr("rows", rows);
    var maxRows = $("#options").attr('rows');
    var rowsOverflow = false;
    $("#options").keydown(function (e) {

        if (rowsOverflow) {
            var len = $(this).val().split("\n").length;
            if (len <= maxRows) {
                rowsOverflow = false;
                $("#errorLog").html("");
            }
        }

        if (e.keyCode == 13) {
            var len = $(this).val().split("\n").length;
            if (len > maxRows) {
                console.log(len + " > " + maxRows)
                rowsOverflow = true;
                $("#errorLog").html(lang["onlyMostVotedShows"]).show();
            }
        }

    });

    $('#question').keydown(function (e) {
        var lines = $(this).attr("rows");
        var newLines = $(this).val().split("\n").length;
        if (e.keyCode == 13 && newLines >= lines) {
            return false;
        }
    });

    var storedHeight;
    $("#showPolls").on("tap", function (e) {
        var _this = $(this);
        e.preventDefault();

        $("#stored").toggleClass("hidden");

        //if to hide
        if ($("#stored").hasClass("hidden")) {
            _this.text(lang["showYourPolls"]);
            return;
        }

        //first time show
        if (!storedHeight) {
            loadStoredPolls();
            //way to get height and animate:
            $("#stored").hide();
            $("#stored").css("height", "auto");
            storedHeight = $("#stored").height(); //get height before put to 0
            $("#stored").css("height", 0); //height 0 after first time show!
            $("#stored").show();
        }

        //if to show
        setTimeout(function () {
            $("#stored").css("height", storedHeight + "px");
        }, 1);

        setTimeout(function () {
            _this.text(lang["hidePolls"]);
            $("#stored").css("height", "auto");
            $("#stored").css("height", $("#stored").css("height"));
        }, 300);
        $("#stored").show();
    });

    $("#toPolls").click(function () {
//        if ($("#polls").length) {
//            $("#body").addClass("pollsView");
//            $("#voteHeader").hide();
//            $("#pollsHeader").show();
//
//            var arr = location.href.split("/");
//            arr.pop();
//            location.href = arr.join("/") + "/#polls";
//            return;
//        }
//
//        console.log("to polls click");
//        loadHash("polls");

        pollsView();
//        loadHash("polls");
    });

    $("#newPoll").click(function () {
        $("#header").removeClass("search");
        loadHash("home");
    });

    if (is_touch_device()) {
        $(document).on("swiperight", function (e) {
            newPollView();

        }).on("swipeleft", function () {
            if (!$("#p_menu").hasClass("p_show") && !$("#body").hasClass("swiping")) {
                pollsView();
            }
        });
    }

});
