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

        //not key stored OR whitespace in -> cause divQuery error
        if (arrayKey.length != 2 || storedKey.indexOf(' ') != -1) {
            continue;
        }

        console.log("storedKey = '" + storedKey + "'");
        var keyId = arrayKey[1];

        //console.log(localStorage[storedKey])
        var arrayTimeData = JSON.parse(localStorage[storedKey]);
        var query = "#stored_" + keyId.replace(/([^\w\s])/g, '\$1');
        var div = $("<div class='votation' id='" + query + "'>");

        var obj = parseData(arrayTimeData[1]);
        console.log(obj);
        //remove wrong parse        
        if (!obj) {
            $(query + " .loader").text(lang["error"]);
            localStorage.removeItem(storedKey);
            continue;
        }

        //add only if I vote it
        var user = obj.users[window.user.id];
        if (!user || "undefined" === typeof (user[1]) || "" === user[1]) {
            continue;
        }

        //all ok:
        stored.append(div);
        window.storedTable = new FillTable(query, obj, {removable: true});
        StoredPolls._events(keyId); //swipe events

        //TRY LOAD NOW FROM INTERNET
        StoredPolls._loadWebPoll(keyId);

        fontSize(query);
    }
}

function storedPolls_init() {
    window.StoredPolls = {};

    StoredPolls._loadWebPoll = function (keyId) {
        console.log("StoredPolls._loadWebPoll");
        var urlParts = getPathsFromKeyId(keyId);
        var realPath = urlParts.realPath;
        var realKey = urlParts.realKey;

        var cache = true;
        loadAjaxKey(realPath + realKey + "?", function (data) {
            var query = "#stored_" + keyId;
            $("#stored_" + keyId + " .loader").hide();

            if (!data) {
                console.log("error retrieving data");
                var div = $(query);
                div.off(".poll");
                div.removeClass("votation clickable");
                div.off("click");
                div.css("opacity", 0.5);
                div.prepend("<small class='error'>" + transl("e_retrievingData") + "</small>");
                return;
            }

            //update new!
            saveLocally(keyId, data);
            var obj = parseData(data);

            window.storedTable = new FillTable(query, obj, {removable: true});
            StoredPolls._events(keyId);
            $(query + " .loader").hide();

            fontSize(query);
        }, cache);
    };

    StoredPolls._events = function (keyId) {
        var query = "#stored_" + keyId;

        var $div = $(query + " .votation");
        var remove = $(query + " .removeInfo");

        $div.on("mousedown touchstart", function (e) {
            //prevents pages swipe event bugs:
            e.stopPropagation();
            //console.log(div)
            e = getEvent(e);

            var w = $div.width();
            var left = e.clientX;
            var top = e.clientY;
            var leftMove, topMove, p = 0;

            $(document).on("mousemove.stored touchmove.stored", function (e) {
                e = getEvent(e);

                leftMove = e.clientX - left;
                topMove = e.clientY - top;

                //console.log(leftMove + " > " + 10 + " && " + Math.abs(leftMove) + " > " + Math.abs(topMove))
                if (leftMove > 10 && Math.abs(leftMove) > Math.abs(topMove)) {
                    leftMove = leftMove - Math.abs(topMove);
                    p = leftMove / w;
                    //e.preventDefault();
                    $div.css({
                        transform: "translateX(" + leftMove + "px)",
                        opacity: 1 - p
                    });
                    if (p > 0.4) {
                        remove.css("color", "red");
                    } else {
                        remove.css("color", "grey");
                    }

                    $(query).removeClass("clickable");

                } else {
                    $div.css({
                        transform: "translateX(0)",
                        opacity: 1
                    });
                }
            });

            $(document).one("mouseup.stored touchend.stored", function (e) {
                //e.stopPropagation();
                $(document).off(".stored");
                if (p > 0.4) {
                    //needs animate
                    $div.animate({
                        opacity: 0,
                        left: w,
//                        transform: "translateX(" + w + "px)"
//                        height: '40px'
                    }, 300, function () {
                        $div.css("transform", "translateX(0)");
                        StoredPolls._remove($div.parent());
                    });

                } else {
                    $div.css({
                        transform: "translateX(0)",
                        opacity: 1
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

    StoredPolls._remove = function (stored) {
        console.log("StoredPolls._remove")
        stored.removeClass("clickable");

        $("#undo").remove();
        var undo = $("<div id='undo' class='hoverUnderline'>" + lang["UNDO"] + "</div>");
        stored.append(undo);

        $(document).one("mousedown.undo touchstart.undo", function (e) {
            $(document).off(".undo"); //prevent double event (mousedown + touchstart)
            
            e.preventDefault();
            if ($(e.target).attr("id") == "undo") {
                undo.remove();
                stored.find(".votation").animate({
                    left: 0,
                    opacity: 1,
//                    height: 'auto'
                }, 300);
                stored.addClass("clickable");

            } else {
                stored.css("height", stored.height() + "px");
                setTimeout(function () {
                    stored.css({
                        height: 0,
                        margin: 0
                    });
                }, 1);

                setTimeout(function () {
                    stored.remove();
                }, 300);

                var keyId = stored.attr("id").split("_")[1];
                localStorage.removeItem("key_" + keyId);
            }
        });
    };

}

