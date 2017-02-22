
var lastValue = null;
$("#search .button").on("click.polls", function () {
    //exit search event
    $(document).off(".headerSearch");
    $(document).on("click.headerSearch", function (e) {
        if (!$(e.target).closest("#header").length && $(e.target).attr("id") != "header") {
            hideSearchInput();
            $(document).off(".headerSearch");
        }
        //ESC key press
    }).on("keypress.headerSearch", function (e) {
        if (e.keyCode == 27) {
            hideSearchInput();
            $(document).off(".headerSearch");
        }
    });

    //only focus
    if (!$("#header").hasClass("search")) {
        $("#header").addClass("search");
        $("#search input").focus();
        return;
    }

    //prevent re-search if nothing happends
    if (lastValue == "" && $("#search input").val() == "") {
        $("#header").removeClass("search");
        return;
    }

    //search
    searchAction();
});

$("#search .input form").submit(function () {
    searchAction();
    return false;
});

var lastValue = "";
function searchAction() {
    $("body").append("<img from='searchAction' class='loading absoluteLoading' src='~img/loader.gif'/>");

    var value = $("#search input").val();
    lastValue = value;

    if (!value) {
        $("#header").removeClass("search");
        loadDefault(function () {
            $(".absoluteLoading").remove();
        });
        return;
    }

    var loaded = 0;
    var ISOS = [null, userCountry];

    for (var i = 0; i < ISOS.length; i++) {
        getIndexSearch(ISOS[i], value, function () {
            loaded++;
            console.log("loaded: " + loaded);
            if (ISOS.length == loaded) {
                search();
                $(".absoluteLoading").remove();
            }
        });
    }
}

function hideSearchInput() {
    $("#header").removeClass("search");
    $("#search input").val("");
}

function search() {
    var someFound = false;

    //SEARCH
    var found = 0;
    for (var ISO in searchIndex) {
        for (var id in searchIndex[ISO]) {
            if (!id) {
                continue;
            }

            //reset polls page on first find:
            if (!someFound) {
                someFound = true;
                $("#polls").html("");
            }

            var url = window.keysPath + "public/";

            //for multiple values
            if ("0" == ISO) {
                ISO = false;
            }

            if (ISO) {
                url += "~" + ISO + "/";
            }

            var poll = [id, null, null, url, ISO];
            getJson(poll);
            found++;
        }
    }

    if (!found) {
        flash(transl("noPollsFound"));
    }
}

var searchIndex = {};
function getIndexSearch(ISO, string, callback) {
    var url = "public/_index.txt";
    if (ISO) {
        url = "public/~" + ISO.toLowerCase() + "/_index.txt";
    } else {
        ISO = 0;
    }

    if (searchIndex[ISO]) {
        callback();
        return;
    }

    $.post(window.urlPath + "/core/find.php", {
        url: window.keysPath + url,
        string: string.replace(" ", ",")
    }, function (files) {
        if (files) {
            searchIndex[ISO] = files.split(",");
        }
        callback();

    }).fail(function (xhr, status, error) {
        console.log("getIndexSearch error on " + url);
        callback(false);
    });
}
