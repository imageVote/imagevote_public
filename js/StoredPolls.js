//init storedPolls functions:
storedPolls_init();

//wait html loads
$(document).ready(function () {
    for (var storedKey in localStorage) {
        var arrayKey = storedKey.split("key_");
        if (arrayKey.length == 2 && arrayKey[1]) {
            console.log("exists stored polls");
            //if some poll exists
            return;
        }
    }
    console.log("hide #showPolls");
    $("#showPolls").hide();
});

//show stored votations
function loadStoredPolls() {
    var stored = $("#stored .list");
    stored.html("");

    for (var storedKey in localStorage) {
        var arrayKey = storedKey.split("key_");

        //not key stored OR whitespace in -> cause divQuery bug
        if (arrayKey.length != 2 || storedKey.indexOf(' ') != -1) {
            continue;
        }
        try {
            $(storedKey).length;
        } catch (e) {
            console.log("ERROR stored key: " + storedKey);
            continue;
        }

        console.log("storedKey = '" + storedKey + "'");
        var keyId = arrayKey[1];

        //console.log(localStorage[storedKey])
        var obj;
        try {
            obj = JSON.parse(localStorage.getItem(storedKey));
        } catch (e) {
            console.log("can't parse " + storedKey);
            continue;
        }
        var id = "stored_" + keyId.replace(/([^\w\s])/g, '\$1');
        var div = $("<div class='votation' id='" + id + "'>");

        var query = "#" + id;

        console.log(obj);
        //remove wrong parse        
        if (!obj) {
            $(query + " .loader").text(lang["error"]);
            localStorage.removeItem(storedKey);
            continue;
        }
        if(!obj.options || !obj.options[0][1] || !obj.options[1][1]){
            continue;
        }

        //add only if I vote it
//        var userVote = obj.users[window.user.id];
//        if ("undefined" === typeof userVote || "" === userVote) {
//            continue;
//        }

        //all ok:
        stored.append(div);        
        window.storedTable = new FillTable(query, obj, {removable: true});
        StoredPolls._events(keyId); //swipe events

        //TRY LOAD NOW FROM INTERNET
        //StoredPolls._loadWebPoll(keyId); //load from internet ??
        $("#stored_" + keyId + " .loader").hide();

        fontSize(query);
    }
}

function storedPolls_init() {
    window.StoredPolls = {};

    StoredPolls._loadWebPoll = function (keyId) {
        var _this = this;
        console.log("StoredPolls._loadWebPoll");

//        var urlParts = getPathsFromKeyId(keyId);
//        var realPath = urlParts.realPath;
//        var realKey = urlParts.realKey;

        loadAjaxKey(keyId, function (obj) {
//        loadAjaxKey(realPath + realKey, "", function (obj) {
            var query = "#stored_" + keyId;
            $("#stored_" + keyId + " .loader").hide();

            if (!obj) {
                console.log("error retrieving data");
//                var div = $(query);
//                div.off(".poll");
//                div.removeClass("votation clickable");
//                div.off("click");
//                div.css("opacity", 0.5);
//                div.prepend("<small class='error'>" + transl("e_retrievingData") + "</small>");
                console.log(query);
                $(query).hide();

                return;
            }

            //update new!            
//            var obj = parseData(data, true);

            saveLocally(keyId, obj);

            window.storedTable = new FillTable(query, obj, {removable: true});
            _this._events(keyId);
            $(query + " .loader").hide();

            fontSize(query);
        });
    };

    StoredPolls._events = function (keyId) {
        var _this = this;
        var query = "#stored_" + keyId;

        var $div = $(query + " .stored");
        var remove = $(query + " .removeInfo");

        //enable close button on no-touch disaply
        var closeButton = true;
        $div.on("mousemove", function () {
            if (closeButton && !$div.find(".close").length) {
                var close = $("<div class='close'"
                        + " style='position:absolute; top:-3px; right:-7px; width: 20px; height: 20px; background:red; border-radius:99px; border: 1px solid gainsboro; text-align:center; line-height:18px;'>x</div>")
                $div.append(close);
                close.click(function (e) {
                    //e.preventDefault();
                    e.stopPropagation(); //prevent open votation
                    _this._remove($div);
                });
            }
            $div.one("mouseleave", function () {
                $div.find(".close").remove();
            });
        });

        $div.on("mousedown touchstart", function (e) {
            //prevents pages swipe event bugs:
            e.stopPropagation();

            console.log("touchstart");
            e = getEvent(e);

            var w = $div.width();
            var left = e.clientX;
            var top = e.clientY;
            var leftMove, topMove, p = 0;

            $(document).on("mousemove.stored touchmove.stored", function (e) {
                closeButton = false;
                e = getEvent(e);

                leftMove = e.clientX - left;
                topMove = e.clientY - top;

                //console.log(leftMove + " > " + 10 + " && " + Math.abs(leftMove) + " > " + Math.abs(topMove))
                if (leftMove > 10 && Math.abs(leftMove) > Math.abs(topMove)) {
                    leftMove = leftMove - Math.abs(topMove);
                    p = leftMove / w;
                    //e.preventDefault();
                    $div.css({
                        '-webkit-transform': "translateX(" + leftMove + "px)",
                        '-ms-transform': "translateX(" + leftMove + "px)",
                        'transform': "translateX(" + leftMove + "px)",
                        'opacity': 1 - p
                    });
                    if (p > 0.4) {
                        remove.css("color", "red");
                    } else {
                        remove.css("color", "grey");
                    }

                    $(query).removeClass("clickable");

                } else {
                    $div.css({
                        '-webkit-transform': "translateX(0)",
                        '-ms-transform': "translateX(0)",
                        'transform': "translateX(0)",
                        opacity: 1
                    });
                }
            });

            $(document).one("mouseup.stored touchend.stored", function (e) {
                closeButton = true;
                //e.stopPropagation();
                $(document).off(".stored");
                if (p > 0.4) {
                    _this._remove($div);

                } else {
                    $div.css({
                        '-webkit-transform': "translateX(0)",
                        '-ms-transform': "translateX(0)",
                        'transform': "translateX(0)",
                        'opacity': 1
                    });
                    //clickablePoll(query);
                }

                setTimeout(function () {
                    $(query).addClass("clickable");
                }, 1);
            });
        });

        clickablePoll(query, keyId); //click
    };

    StoredPolls._remove = function ($div) {
        //needs animate
        $div.animate({
            opacity: 0,
            left: $div.width()
        }, 300, function () {
            $div.css("transform", "translateX(0)");
            var stored = $div.parent();

            console.log("StoredPolls._remove")
            stored.removeClass("clickable");

            //$("#undo").remove();
            stored.find(".undo").remove();
            var undo = $("<div class='undo' class='hoverUnderline'>" + lang["UNDO"] + "</div>");
            stored.append(undo);

            $(document).off(".undo");
            $(document).one("mousedown.undo touchstart.undo", function (e) {

                e.preventDefault();
                if ($(e.target).hasClass("undo")) {
                    $("#stored .undo").remove();
                    $("#stored .stored").animate({
                        left: 0,
                        opacity: 1,
//                    height: 'auto'
                    }, 300);
                    $("#stored .stored").addClass("clickable");

                } else {
                    //$("#stored .undo").parent().css("height", stored.height() + "px");

                    var $undos = $("#stored .undo");
                    for (var i = 0; i < $undos.length; i++) {
                        (function () {
                            var $div = $($undos[i]).parent();
                            var keyId = $div.attr("id").split("_")[1];
                            localStorage.removeItem("key_" + keyId);

                            setTimeout(function () {
                                $div.remove();
                            }, 300);
                        })();
                    }
                }
            });
        });
    };

}

function clickablePoll(query, keyId, url) {
    var div = $(query);
    div.addClass("clickable");

    //if is in polls list page:
    if (div.closest("#polls").hasClass("reduced")) {
        div.addClass("hidden");
        //var height = $(query).height() + 2;
        var reducedHeight = $(query).width() * 0.314;
        div.css("max-height", reducedHeight);
    }

    //events
    div.off(".event");
    div.on("click.event", function (e) {
        //find again from query:
        if (!$(query).hasClass("clickable")) {
            return;
        }

        //setTimeout: let last hidePollEvent call first        
        setTimeout(function () {
            //if is canvas
            if (div.hasClass("hidden")) {
                //complete height
                div.css("max-height", (div.find("canvas, img").height() + 50) + "px");
                div.removeClass("hidden");

                hidePollEvent(query, reducedHeight);
                return;
            }

            //link
            var link = "http://" + settings.appPath + "/" + keyId;
            if (window.Device && !window.localhost) {
                //needs remove all after 'index.html'
                link = location.href.split("#")[0].split("?")[0] + "#key=" + keyId;
            }

//            if (!Device) {
//                if (url) {
//                    link = url;
//                }                
//            }
            location.href = link;
        }, 1);
    });
}
