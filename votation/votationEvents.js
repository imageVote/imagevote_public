// GLOBAL EVENTS

function showVotation(users) {
    $("#mainPage > div").hide();
    $("#votation").show();

    //public is defined on load html
    new VotationButtons();
    $("#send").hide();

    var style = screenPoll.style;
    if (style && style.extraValues) {
        for (var i = 0; i < style.extraValues.length; i++) {
            if ("nm" == style.extraValues[i]) {
                var nameIndex = 2 + i;
                var someName = false;

                if (users) {
                    for (var id in users) {
                        var user = users[id];
                        if (user[nameIndex] && (user[1] || 0 === user[1])) {
                            console.log("some name exists: " + user[nameIndex] + " , " + user[1]);
                            someName = true;
                            break;
                        }
                    }
                }

                if (!someName) {
                    console.log("any 'nm' in obj.users - disable button");
                    $('#usersButton').addClass("disabled");
                }
                //break 'nm' value search
                break;
            }
        }
    }

    $("#send").removeAttr("disabled");

    //if private, add name input
    //new AskUserName();
}

function backVotation() {
    $("#mainPage > div").hide();
    $("#votation").show();
    $("#buttons").show();
}

// VOTATION EVENTS

function saveDefaultValues(votes) {
    if (!votes) {
        votes = [];
    }
    //window.originalVotes = votes.toString();

    window.originalPublic = $("#p_makePublic input").is(':checked');
    window.originalCountry = $("#countrySelect select").val();
}

function saveToShare() {
    if ($("#send").hasClass("saveAndShare")) {
        //not change if first time
        return;
    }

    if (!$("#send").hasClass("share") && !$("#send").hasClass("saveAndShare")) {
        $("#send").removeAttr("disabled");
    }
    $("#send").attr("class", "share");
    $("#send span").text(lang["Share"]);

    //hide public options to show share image?
    $("#publicMessage").hide();
}

function checkShareEnvirontment(tag, optionsResult) {
    if (window.isAndroid || window.iPhone) {
        shareIntents(tag, optionsResult);
    }
}

function shareIntents(tag) {
    if (window.notAskAppIntent) {
        return;
    }
    window.preventSendEvents = true;

//    var url = "http://share." + location.host + "#" + location.pathname;
    var url = "http://" + location.host + "/~share#" + location.pathname;

    //remove
    localStorage.setItem("not_installed", "");
    localStorage.setItem("app", "");

    $(tag).on("click.intent", function () {
        $("body").addClass("no_image");
        window.open(url); //intent

        setTimeout(function () {
            //var myCookie = getCookie("installed");
            var not_installed = localStorage.getItem("not_installed");
            var app = localStorage.getItem("app");

            if (not_installed && !app) {
                //flash("App not installed")                
                askAppInstall();

            } else {
                //flash("App in Device")
                var i = 0;
                var interval = setInterval(function () {
                    not_installed = localStorage.getItem("not_installed");
                    if (not_installed) {
                        // user not want open app (w8 interval)                        
                        clearTimeout(interval);
                        disableIntent();
                    }
                    //be sure user open app:
                    if (i > 20) { //10 seconds
                        clearTimeout(interval);
                    }
                    i++;
                }, 500);
            }
        }, 1500); //second waiting share page load
    });
}

function askAppInstall() {
    var link = "https://play.google.com/store/apps/details?id=" + window.package;

    modalBox("Usa la app para compartir la encuesta!",
            "Descárgala completamente gratis. <br>No requiere de permisos especiales"
            , function () {
                window.open(link, "_blank");
            }, function () {
        disableIntent();
    });
}

function disableIntent() {
    console.log("disableIntent()");
    $(".no_image").removeClass("no_image");
    $("*").off(".intent");
    window.notAskAppIntent = true;
}

function shareToSave() {
    if ($("#send").hasClass("saveAndShare")) {
        //not change if first time
        return;
    }

    $("#send").removeAttr("disabled");
    $("#send").removeClass();
    $("#send span").text(lang["Save"]);
}

//ADD functionality
function AskUserName() {
    var _this = this;

    //FORCE enter name to prevent poll problems with troll random url voters
    var votes = null;
    var obj = screenPoll.obj;
    if (obj.users && obj.users[user.id]) {
        votes = obj.users[user.id][1];
    }

    //get value: name attr
    var nameValue = "";
    if (window.user && user.nm) {
        var name = decode_uri(user.nm);
        nameValue = "value='" + name + "'";
    } else {
        var savedName = localStorage.getItem("userName");
        if (savedName) {
            nameValue = "value='" + savedName + "'";
        }
    }

    //add input
    $("#userNamePoll").remove();
    var userName = $("<div id='modal_background'><input id='userNamePoll' type='text' data-placeholder='myName' " + nameValue + " /></div>");
    $("#votationButtons").prepend(userName);

    //if public poll
    if (screenPoll.public) {
        _this.no_requiredName();
    }

    //on public change
    $(document).on("public", function () {
        _this.no_requiredName();
    });
    $(document).on("private", function () {
        _this.requiredName();
    });
}

AskUserName.prototype.requiredName = function () {
    $("#modal_input").removeClass("hideHeight");
    $("#send").off(".requiredName"); //clean

    $("#send").on("click.requiredName", function (e) {
        var votes = screenPoll.obj.users[user.id][1];
        if (!$("#userNamePoll").val()
                && (votes || 0 === votes)) {
            $("#userNamePoll").focus();
        }
    });
};
AskUserName.prototype.no_requiredName = function () {
    $("#modal_input").addClass("hideHeight");
    $("#send").off(".requiredName");
};

//http://stackoverflow.com/questions/5968196/check-cookie-if-cookie-exists
function getCookie(name) {
    var dc = document.cookie;
    var prefix = name + "=";
    var begin = dc.indexOf("; " + prefix);
    if (begin == -1) {
        begin = dc.indexOf(prefix);
        if (begin != 0)
            return null;
    } else
    {
        begin += 2;
        var end = document.cookie.indexOf(";", begin);
        if (end == -1) {
            end = dc.length;
        }
    }
    // because unescape has been deprecated, replaced with decodeURI
    //return unescape(dc.substring(begin + prefix.length, end));
    return decodeURI(dc.substring(begin + prefix.length, end));
}

