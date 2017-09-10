
var Tutorial = function (actions, where) {
    this.helperPosition = 0;
    this.helps = actions;
    this.where = where;
    this.start();
};

Tutorial.prototype.start = function () {
    var _this = this;

    var helpStop = $("<div id='helpStop'>").appendTo(this.where);
    var stop = $("<span style='display:inline-block' data-lang='helpStop'>" + transl("helpStop") + "</span>").appendTo(helpStop);   
    var left = $("<div style='float:left;padding: 0 25px'><</div>").appendTo(helpStop);
    left.click(function (e) {
        e.stopPropagation();
        _this.helperPosition--;
        console.log("_this.helperPosition: " + _this.helperPosition);
        if (_this.helperPosition < 0) {
            _this.helperPosition = 0;
            return;
        }

        var helper = _this.helps[_this.helperPosition];
        var func = helper[3];
        if (func) {
            func();
        }
        _this.nextHelp();
    });

    var right = $("<div style='float:right;padding: 0 25px'>></div>").appendTo(helpStop);
    right.click(function (e) {
        e.stopPropagation();
        _this.helperPosition++;
        if (_this.helperPosition < 0) {
            _this.helperPosition = 0;
            return;
        }

        var func = _this.helps[_this.helperPosition - 1][3];
        if (func) {
            func();
        }
        _this.nextHelp();
    });

    stop.on("tap", function () {
        _this.stop();
    });

    $("body").addClass("tutorial_unselectable");
    $("#body").addClass("tutorial_unselectable");
    _this.nextHelp();
};

Tutorial.prototype.done = function () {
    console.log("tutorial done");
    this.stop();
    //flash("help_done");
};

Tutorial.prototype.stop = function () {
    $(".tutorial_unselectable").removeClass("tutorial_unselectable");
    $("#helpStop").remove();
    $("#tutorial_helpFilter").remove();
    clearInterval(this.helperCheckInterval);
    clearInterval(this.helpMoveInterval);
    clearInterval(this.eventInterval);
};

Tutorial.prototype.locateHelper = function (queryDiv, value, target, func, extra_html) {
    var text = transl(value);
    if (!extra_html) {
        extra_html = "";
    }

    var help = $("<div class='tutorial_helpDiv tutorial_selectable'><div><div data-lang='" + value + "'>" + text + "</div>" + extra_html + "</div></div>");
    var helpContainer = $("<div id='tutorial_helpFilter'>");
    helpContainer.append(help);

    //text = text.replace(/\. /g, '.<br/><br/>').replace(/! /g, '.<br/><br/>');
    //help.html(text);

    $("#tutorial_helpFilter").remove();
    
    $(this.where).append(helpContainer);
    this.placeHelper(queryDiv);

    this.targetEvent(target, help, func);
};

Tutorial.prototype.targetEvent = function (target, help, func) {
    var $this = this;

    if (target) {
        if (typeof target != "function") {
            $("*").off(".help");
            var canClick = true;

            $(target)
                    //.addClass("smltown_userSelectable")
                    .on("click.help", function (e) {
                        e.preventDefault();

                        console.log("click")
                        if (!canClick) {
                            return;
                        }

                        //w8 interval for click again
                        canClick = false;
                        setTimeout(function () {
                            canClick = true;
                        }, 500);

                        $("#tutorial_helpFilter").remove();
                        console.log("CLICK TARGET");

                        //before next
                        if (func) {
                            func(e);
                        }

                        $this.helperPosition++;
                        $this.nextHelp();
                    });
            //
        } else {
            target(function (e) {
                $("#tutorial_helpFilter").remove();

                //before next
                if (func) {
                    func(e);
                }

                $this.helperPosition++;
                $this.nextHelp();
            });
        }

    } else {
        $("#tutorial_helpFilter").addClass("tutorial_filter");
        var button = $("<button>next</button>");
        help.append(button);
        button.on("click", function () {
            $("#tutorial_helpFilter").remove();

            //before next
            if (func) {
                func();
            }

            $this.helperPosition++;
            $this.nextHelp();
        });
    }
};

Tutorial.prototype.placeHelper = function (queryDiv, callback) {
    var $this = this;

    var pos = null;
    if (queryDiv) {
        pos = $(queryDiv).offset();
    }

    //w8 appear div offset
    if ("undefined" == typeof pos) {
        console.log("undefined div");
        setTimeout(function () {
            $this.placeHelper(queryDiv, callback);
        }, 500);
        return;
    }

    if (callback) {
        callback();
    }

    var help = $(".tutorial_helpDiv");

    if (!pos) {
        help.addClass("tutorial_center");
        return;
    }

    var height = $(".wrapper").height();
    var width = $(".wrapper").width();

    var x = pos.left;
    var y = pos.top;
    var divWidth = $(queryDiv).outerWidth();
    var divHeight = $(queryDiv).outerHeight();

    if (x + divWidth / 2 <= width / 2) {
        help.css("left", x + 5);
        help.addClass("tutorial_left");
    } else {
        help.css("right", width - x - divWidth - 5);
        help.addClass("tutorial_right");
    }

//    if (y + divHeight / 2 <= height / 2) {
    if (!divHeight) {
        divHeight = 20;
    }
    help.css("top", y + divHeight + 10);
    help.addClass("tutorial_top");
//    } else {
//    //BOTTOM CAUSES BAD MOVES ON WINDOW RESIZE
//        help.css("bottom", height - y + 10);
//        help.addClass("tutorial_bottom");
//    }

    this.divAd(queryDiv);
    //$(".tutorial_selectable").removeClass("tutorial_selectable");
    $(queryDiv).addClass("tutorial_selectable");
};

//color advice div
Tutorial.prototype.divAd = function (queryDiv) {
    //console.log(queryDiv);
    var ad = $("#tutorial_helpFilter .tutorial_helpAd");
    if (!ad.length) {
        ad = $("<div class='tutorial_helpAd'>");
        $("#tutorial_helpFilter").append(ad);
    }
    var div = $(queryDiv);
    var pos = div.offset();

    var time = 0;
    var adInterval = setInterval(function () {
        clearInterval(adInterval);

        ad.css({
            left: pos.left,
            top: pos.top,
            width: div.outerWidth(),
            height: div.outerHeight()
        });

        time = 500;
    }, time);
};

Tutorial.prototype.nextHelp = function () {
    clearInterval(this.helperCheckInterval);
    clearInterval(this.helpMoveInterval);
    console.log("helperPosition = " + this.helperPosition);
    if (this.helperPosition < 0) {
        this.helperPosition = 0;
    }

    $("#tutorial_helpFilter").remove();

    //if helper ends
    var help = this.helps[this.helperPosition];
    if (!help) {
        //tutorial done
        this.done();
        return;
    }

    this.locateHelper(help[0], help[1], help[2], help[3], help[4]);
};
