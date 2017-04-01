
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

    //error(errorMmessage, arguments.callee.caller);
    error(err.stack, arguments.callee.caller);
};
// Only Chrome & Opera have an error attribute on the event.
window.addEventListener("error", function (e) {
    console.log(e.error.message, "from", e.error.stack);
});

function error(txt, f) {
    console.log(txt + " - in error function");
    //try transation

    //if number
    txt += "";

    var text = transl(txt).replace(/["']/g, "");
    notice("error: " + text, true);

    if ($("#loading:visible").length) {
        //console.log("load defaultPage after error");
        //hashManager.defaultPage();
    }

//    //add stack to Log
//    while (f) {
//        console.log("stack");
//        txt += ":: " + f.name + "; ";
//        f = f.caller;
//    }

    //send
    if (!Device.error) {
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

function pollsView() {
//    $("#body").addClass("pollsView");
//    $("#voteHeader").hide();
//    $("#pollsHeader").show();
//
//    //re-load
//    if (!$("#pollsPage > div").length) {
////        window.game = new GamePoll("#pollsPage", null, "game");
//    }
//    $("#loading").hide();
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
        hashManager.update("new"); //newPoll()
    });

    //first time app
    $("#firstOk").click(function () {
        if (Device.firstTimeOk) {
            Device.firstTimeOk();
        } else {
            hashManager.update("home");
        }
    });
    $("#firstCreate").click(function () {
        hashManager.update("home");
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
//        pollsView();
        hashManager.update("polls");
    });

    $("#newPoll").click(function () {
        hashManager.update("home");
    });

    if (is_touch_device()) {
        $(document).on("swiperight", function (e) {
//            hashManager.newPollView();
            hashManager.update("home");

        }).on("swipeleft", function () {
            if (!$("#p_menu").hasClass("p_show") && !$("#body").hasClass("swiping")) {
//                pollsView();
                hashManager.update("polls");
            }
        });
    }

});
