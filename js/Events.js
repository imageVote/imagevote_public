
//$(document).ready(function () {
//    new Events();
//});

var Events = function () {
    this.headerEvents();
    this.homeEvents();
    //this.pollsEvents();
    this.errorEvents();
};

Events.prototype.headerEvents = function () {

    $("#newPoll")
            .off(".global")
            .on("click.global", function () {
                hashManager.update("home");
            });

    $("#toPolls")
            .off(".global")
            .on("click.global", function () {
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

    //SWIPE:
    if (is_touch_device() && !$(".translucent").length) {
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

};

Events.prototype.homeEvents = function () {

    var storedHeight;
    $("#showPolls")
            .off(".global")
            .on("tap.global", function (e) {
                console.log("showPolls event");
                var _this = $(this);
                e.preventDefault();

                $("#stored").toggleClass("hidden");

                //if to hide
                if ($("#stored").hasClass("hidden")) {
                    _this.text(transl("showYourPolls"));
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
                    _this.text(transl("hidePolls"));
                    $("#stored").css("height", "auto");
                    $("#stored").css("height", $("#stored").css("height"));
                }, 300);
                $("#stored").show();
            });

    //    window.lastKeyAsk = 0;
//    $("#create").click(function () {
//        console.log("CREATE");
//        $("#errorLog").html("");
//
//        if (!$("#options").val()) {
//            flash(transl("min1Option"));
//            return;
//        }
//
//        if (!checkConnection()) {
//            console.log("!checkConnection");
//            return;
//        }
//
//        //load by hash change
//        window.lastKeyAsk++; //first, to be the same after
//        window.fromCreateFunction = true; //prevents new polls when click back button or similar
//        hashManager.update("new"); //newPoll()
//    });
//
//
//    $('#question').keydown(function (e) {
//        var lines = $(this).attr("rows");
//        var newLines = $(this).val().split("\n").length;
//        if (e.keyCode == 13 && newLines >= lines) {
//            return false;
//        }
//    });
//
//    //resize
//    var textareaHeight = $(document).height() / 2 - 180;
//    var rows = Math.max(Math.floor(textareaHeight / 20), 3);
//    $("#options").attr("rows", rows);
//    var maxRows = $("#options").attr('rows');
//    var rowsOverflow = false;
//    $("#options").keydown(function (e) {
//        if (rowsOverflow) {
//            var len = $(this).val().split("\n").length;
//            if (len <= maxRows) {
//                rowsOverflow = false;
//                $("#errorLog").html("");
//            }
//        }
//
//        if (e.keyCode == 13) {
//            var len = $(this).val().split("\n").length;
//            if (len > maxRows) {
//                console.log(len + " > " + maxRows)
//                rowsOverflow = true;
//                $("#errorLog").html(lang["onlyMostVotedShows"]).show();
//            }
//        }
//    });
};

Events.prototype.pollsEvents = function () {
//    //NOT USED / DEPRECATED IN WOULD-YOU-RATHER
//    function pollsView() {
//        $("#body").addClass("pollsView");
//        $("#voteHeader").hide();
//        $("#pollsHeader").show();
//
//        //re-load
//        if (!$("#pollsPage > div").length) {
////        window.game = new GamePoll("#pollsPage", null, "game");
//        }
//        $("#loading").hide();
//    }
};

Events.prototype.errorEvents = function () {

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

    window.error = function (txt, f) {
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
            $.post(settings.corePath + "error.php", {
                error: text
            });
        } else {
            Device.error(text);
        }
    };

    window.notice = function (text, isError) {
        $("#errorLog").show();
        if (!text) {
            text = "unknown error";
        }
        var err = $("<div data-lang='" + text + "'>" + text + "</div>");
        $("#errorLog").append(err);
        return err;
    };
};
