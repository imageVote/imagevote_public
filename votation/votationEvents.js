// GLOBAL EVENTS

function showVotation(users) {
    $("#mainPage > div").hide();
    $("#votation").show();

    //public is defined on load html
    window.screenPoll.buttons = new VotationButtons(screenPoll);
    window.screenPoll.buttons.init();
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
//    if (!votes) {
//        votes = [];
//    }
//    window.originalVotes = votes.toString();

    window.originalPublic = $("#p_makePublic input").is(':checked');
    window.originalCountry = $("#countrySelect select").val();
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
    if (screenPoll._public) {
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

//device function too !
var votationEvents_deviceShare = function (imgData, keyId, path) {
    //Device.share(imgData.replace("data:image/png;base64,", ""), keyId);
    if (!path) {
        path = "";
    }
    return Device.share(imgData.substring(22), keyId, path);
}
