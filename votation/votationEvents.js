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
    //window.originalLink = $("#externalLink").val();
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

    //checkShareEnvirontment("#save");
}

function checkShareEnvirontment(tag, optionsResult) {
    if (window.intentLoads) {
        shareIntents(window.intentLoads, tag, optionsResult);
        return;
    }

    //ANDROID BROWSER CASE (or TWITTER APP!)
    if (window.isAndroid && !window.Device && navigator.plugins.length == 0) {
        console.log("window.isAndroid && !window.Device " + tag);
        //http://stackoverflow.com/questions/6567881/how-can-i-detect-if-an-app-is-installed-on-an-android-device-from-within-a-web-p

        androidIntent.detect(function (intentLoads) {
            console.log("intentLoads: " + intentLoads);
            window.intentLoads = intentLoads;

            shareIntents(intentLoads, tag, optionsResult);
        });

    } else {
        window.intentLoads = false;
    }
}

function shareIntents(intentLoads, tag, optionsResult) {
    window.preventSendEvents = true;

    //if android detects intent url
    if (intentLoads) {

        var extra = "";
        if (optionsResult) {
            for (var n = 0; n < optionsResult.length; n++) {
                var votes = optionsResult[n][2];
                var option_number = $(tag).closest(".option").attr("class").split("_")[1];
                if (option_number == n) {
                    votes++;
                }
                extra += "_" + votes;
            }
        }

        var url = "intent://" + location.host + "/~share" + extra + location.pathname + "/#Intent;"
                + "scheme=http;"
                + "package=" + window.package + ";"
                //(empty or wrong code function) if twitter webview, this will redirect to app store but inside browser!
                //+ "S.browser_fallback_url=" + escape(fallback_url) + ";"
                + "end";
//        var url = "http://" + location.host + "/~share#" + extra;

//        var a = $("<a target='_blank' class='intentLink' href='" + url + "'>");
//        $(tag).wrap(a);

        $(tag).click(function () {
            setTimeout(function () {
                window.location = "#share";
            }, 25);
            window.location = url; //intent
        })

//        a.one("click", function (e) {
//            setTimeout(function () {
////               $("#image").hide();
//            }, 1);
//        });

    } else { //not detects any intent (not installed app)
        var link = "https://play.google.com/store/apps/details?id=" + window.package;

        $(tag).one("click", function () {
            modalBox("Usa la app para compartir la encuesta!",
                    "Descárgala completamente gratis. <br>No requiere de permisos especiales",
                    function () {
                        window.open(link, "_blank");
                    });
        });

        var err = notice(transl("notInApp"));
        err.click(function () {
            window.open(link, "_blank");
        });
    }
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