storedPolls_init();

//wait html loads
$(document).ready(function() {
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
        stored.append("<div id='stored_" + keyId + "'>");

        var obj = parseData(arrayTimeData[1]);
        console.log(obj);
        //remove wrong parse
        if (!obj) {
            $("#stored_" + keyId + " .loader").text(lang["error"]);
            localStorage.removeItem(storedKey);
            continue;
        }

        new fillTable("#stored_" + keyId, obj, {removable: true});
        StoredPolls._events(keyId); //swipe
        //LOAD NOW FROM INTERNET
        StoredPolls._loadWebPoll(keyId);
    }
}

function storedPolls_init() {
    window.StoredPolls = {};

    StoredPolls._loadWebPoll = function(keyId) {
        console.log("StoredPolls._loadWebPoll");
        var urlParts = getPathsFromKeyId(keyId);
        var realPath = urlParts.realPath;
        var realKey = urlParts.realKey;

        var cache = true;
        loadAjaxKey(realPath + realKey + "?", function(data) {
            $("#stored_" + keyId + " .loader").hide();
            if (!data) {
                console.log("error retrieving data");
                var div = $("#stored_" + keyId);
                div.off(".poll");
                div.removeClass("clickable");
                div.off("click");
                div.css("opacity", 0.5);
                div.prepend("<small class='error'>" + transl("e_retrievingData") + "</small>");
                return;
            }

            //update new!
            var time = (new Date()).getTime();
            localStorage.setItem("key_" + keyId, JSON.stringify([time, data]));
            var obj = parseData(data);

            new fillTable("#stored_" + keyId, obj, {removable: true});
            StoredPolls._events(keyId);
            $("#stored_" + keyId + " .loader").hide();

        }, cache);
    };

    StoredPolls._events = function(keyId) {
        var query = "#stored_" + keyId;

        var div = $(query + " .votation");
        var remove = $(query + " .removeInfo");

        $(div).on("mousedown touchstart", function(e) {
            //console.log(div)
            e = getEvent(e);

            var w = div.width();
            var left = e.clientX;
            var top = e.clientY;
            var leftMove, topMove, p = 0;

            $(document).on("mousemove.stored touchmove.stored", function(e) {
                e = getEvent(e);

                leftMove = e.clientX - left;
                topMove = e.clientY - top;

                if (leftMove > 10 && Math.abs(leftMove) > Math.abs(topMove)) {
                    leftMove = leftMove - Math.abs(topMove);
                    p = leftMove / w;
                    //e.preventDefault();
                    div.css({
                        transform: "translateX(" + leftMove + "px)",
                        opacity: 1 - p
                    });
                    if (p > 0.4) {
                        remove.css("color", "red");
                    } else {
                        remove.css("color", "grey");
                    }

                    $(div).addClass("moving");

                } else {
                    div.css({
                        transform: "translateX(0)",
                        opacity: 1
                    });
                }
            });

            $(document).one("mouseup.stored touchend.stored", function(e) {
                //e.stopPropagation();
                $(document).off(".stored");
                if (p > 0.4) {
                    div.animate({
                        opacity: 0,
                        'margin-left': w,
                        height: '40px'
                    }, 300, function() {
                        div.css("transform", "translateX(0)");
                        StoredPolls._remove(div.parent());
                    });

                } else {
                    div.css({
                        transform: "translateX(0)",
                        opacity: 1
                    });
                    //clickablePoll(query);
                }

                setTimeout(function() {
                    $(div).removeClass("moving");
                }, 1);
            });
        });

        clickablePoll(query, keyId); //click
    };

    StoredPolls._remove = function(stored) {
        console.log("StoredPolls._remove")
        stored.removeClass("clickable");

        $("#undo").remove();
        var undo = $("<div id='undo' class='hoverUnderline'>" + lang["UNDO"] + "</div>");
        stored.append(undo);

        $(document).one("mousedown touchstart", function(e) {
            e.preventDefault();
            if ($(e.target).attr("id") == "undo") {
                undo.remove();
                stored.find(".votation").animate({
                    'margin-left': 0,
                    opacity: 1,
                    height: 'auto'
                }, 300);
                stored.addClass("clickable");

            } else {
                stored.css("height", stored.height() + "px");
                setTimeout(function() {
                    stored.css({
                        height: 0,
                        margin: 0
                    });
                }, 1);

                setTimeout(function() {
                    stored.remove();
                }, 300);

                var keyId = stored.attr("id").split("_")[1];
                localStorage.removeItem("key_" + keyId);
            }
        });
    };

}
            
