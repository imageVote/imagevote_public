
//globals
var canvas, ctx;

var defaultStyle = {
    questionColor: [0, 0, 0],
    textColor: [0, 0, 0],
    backgroundColor: [255, 255, 255],
    gradientBackground: [240, 240, 240],
    color1: [200, 215, 220],
    color2: [140, 180, 210],
    extraValues: ["nm", "from"]
};

//ON CREATE ONLY!
function getUserArray(user) {
    console.log("user: " + JSON.stringify(user));
    if(!user){
        return [];
    }
    
    var arr = [user.id, user.vt];
    //like name on private polls    
    //needs to be defined in defaultStyle because is array type stored (not by attr)
    var style = screenPoll.style;
    if (style && style.extraValues) {
        for (var i = 0; i < style.extraValues.length; i++) {
            var key = style.extraValues[i];
            if (user[key]) {
                arr.push(user[key]);
            } else {
                arr.push("");
            }
        }
    }

    return arr;
}

function toArray(obj) {
    var style = screenPoll.style;
    if (!obj.style) {
        obj.style = style;

        //add color styles if changed
    } else {
        for (var key in style) {
            if (!obj.style[key]) {
                obj.style[key] = style[key];
            }
        }
    }

    var arr = [obj.question, obj.options, obj.style, getUserArray(user)];
    return arr;
}

function toJson(arr) {
    return JSON.stringify(arr).slice(0, -1);
}

function parseData(value) {
    //data errors
    if (!value) {
        error("e_votationRemoved");
        reset();
        return;
    }
    //not tested rule
    else if ("null" == value) {
        error("e_connectionLost");
        reset();
        return;
    }

    var arr;
    try {
        arr = JSON.parse(value += "]");
    } catch (e) {
        console.log(e + " on " + value);
        //error("e_votationWithErrors", true);
        return false;
    }

    return toObject(arr);
}

function toObject(arr) {
    if (!$.isArray(arr)) {
        console.log("NOT ARRAY on " + JSON.stringify(arr));
        return false;
    }

    var question = arr.shift();
    var options = arr.shift();
    if (!options || !options.length) {
        return false;
    }
    var style = arr.shift();

    var users = {};
    for (var i = 0; i < arr.length; i++) {
        if (arr && arr[i]) {
            users[arr[i][0]] = arr[i];
        }
    }

    var obj = {
        question: question,
        options: options,
        style: style,
        users: users
    };
    //console.log(obj);
    return obj;
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
    div.on("click.temp", function (e) {
        if(!div.hasClass("clickable")){
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
            var link = "http://" + appPath + "/" + keyId;
            if (Device || localhost) {
                //prevent hash change event
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

function hidePollEvent(query, reducedHeight) {
    //let polls hide first
    setTimeout(function () {
        //ONE
        $(document).one("click", function (e) {
            if (!$(e.target).closest(query).length) {
                $(query).addClass("hidden");
                $("#polls .image").css("max-height", reducedHeight);
            }
        });
    }, 1);
}

function parseOptions(obj) { 
    var usrs = obj.users;
    var opts = obj.options;

    //STORE VALID OPTIONS
    var optionsResult = [];
    for (var i = 0; i < opts.length; i++) {
        if (!opts[i]) {
            break;
        }
        optionsResult.push([
            i, //position
            opts[i], //value
            0 //value
        ]);
    }

    //server pre calculated
    if (usrs && usrs[1] && "done" == usrs[1]["calc"]) {
        for (var i = 0; i < optionsResult.length; i++) {
            var res = usrs[1][i];
            if (!res) {
                res = 0;
            }
            optionsResult[i][2] = res;
        }
        if (usrs[1]["vt"]) {
            obj.users[window.userId] = usrs[1]["vt"];
        }

    } else {
        //COUNT VOTES
        for (var id in usrs) {
            if (!usrs[id][1] && 0 !== usrs[id][1]) {
                console.log(usrs[id]);
                continue;
            }

            var arr = voteArray(usrs[id][1]);
            for (var i = 0; i < arr.length; i++) {
                var option = arr[i];
                //if invalid option
                if (!optionsResult[option]) {
                    continue;
                }
                optionsResult[option][2]++;

                //if only alows 1 vote, break after 1st vote
                if (!obj.style || !obj.style.multipleChoice) {
                    break;
                }
            }
        }
    }

    //SORT
    //if (optionsResult.length > 2) { //more than 2 options // WHY? (how to bold highter option?)
    //optionsResult = sortOptions(optionsResult);
    //}
    //console.log(optionsResult)
    return optionsResult;
}

function sortOptions(optionsResult) {
    optionsResult.sort(function (a, b) {
        //if not value difference, sort by original creator position! 
        return b[2] - a[2] || a[0] - b[0];
    });
    //}
    //console.log(optionsResult)
    return optionsResult;
}

function voteArray(arr) {
    if ("object" != typeof arr) {
        if (arr || 0 === arr) {
            arr = [arr];
        } else {
            arr = [];
        }
    }
    return arr;
}
