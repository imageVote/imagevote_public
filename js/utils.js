
var appPath = "click-to-vote.at";
var keysPath = "http://keys." + appPath + "/";

var alternative = {
//    keysPath: "dl.dropboxusercontent.com/u/70345137/key/"
};

function newUser(voting) {
    if (window.public && window.publicId) {
        phoneId = window.userId;
        userId = publicId;
    }
    var user = {
        id: userId,
        vt: ""
    };
    if (voting) {
        user.vt = 0;
    }
    return user;
}

function myIP() {
    console.log("myIp");

    $.ajax({
        url: "../imageVote/getIP.php"
    }).success(function (ipData) {
        console.log(ipData);

        var data = null;
        try {
            data = JSON.parse(ipData);
        } catch (e) {
            console.log("wrong ip data");
            return;
        }

        //not update ID if exists in localStorage
        var id = localStorage.getItem("userId");
        if (!id) {
            id = data[0];
        }
        var country = data[1];

        localStorage.setItem("userId", id);
        addUser(id, "", country); //name = null

    }).error(function () {
        console.log("getIP.php not found");
        var id = "local";
        localStorage.setItem("userId", id);
        addUser(id); //name = null
        //if debug
//        if (!Device && callback) {
//            callback();
//        }
    });
}

//from device too!!
function addUser(id, name, country, pubId) {
    //var userLoading = $("<img class='loading absoluteLoading' src='~img/loader.gif'/>");
    //$("body").append(userLoading);
    console.log("addUser start");

    if (!id) {
        console.log("not valid id");
        return;
    }

    userId = id;
    //don't override userId localStorage userId !
    if (pubId) {
        publicId = pubId;
        localStorage.setItem("publicId", pubId);
    }

    console.log("public id = '" + pubId + "' in addUser; ");
    //not set true, addUser works on start app
    var voting = false;

    //not sure if this works any time
    var storedVotes = false;
    if (window.user && user.vt) {
        storedVotes = user.vt;
    }
    var usr = newUser(voting); //false
    if (storedVotes) {
        usr.vt = storedVotes;
    }

    if (name) {
        usr.nm = name;
        $("#username input").val(name);
    }

    if (country) {
        userCountry = country;
        localStorage.setItem("userCountry", userCountry);
        //at least get country by language
    } else {
        userCountry = navigator.language || navigator.userLanguage;
        if (userCountry.indexOf("-") != -1) { //like 'en-US' case
            userCountry = userCountry.split("-").pop();
        }
    }

    window.user = usr;
}

var sending = false;
//from DEVICE
function resume() {
    stopFlash();
    sending = false;
    // only if loading
    if ($("#loading:visible").length && !$("html").hasClass("translucent")) {
        defaultPage();
    }
    $("#send").removeAttr("disabled");
}

var userLanguage = window.navigator.userLanguage || window.navigator.language;

function getEvent(e) {
    if (!e) {
        return;
    }
    if (e.originalEvent.touches) {
        return e.originalEvent.touches[0];
    } else {
        return e;
    }
}

function getPathsFromKeyId(keyId) {
    var realPath = keysPath;
    var public = "";
    if (keyId[0] !== "-") {
        public = "true";
    }
    screenPoll.isPublic(public);
    var visible;
    if (screenPoll.public) {
        visible = "public";
    } else {
        visible = "private";
    }
    realPath += visible + "/";

    var countryPath = "";
    var key = keyId;
    if (keyId.indexOf("-") > 0) {
        var arr = keyId.split("-");
        var country = arr.shift();
        countryPath = "~" + country + "/";
        realPath += countryPath;
        key = arr.join("-");
    }
    var res = {
        realPath: realPath,
//        simplePath: appPath + "/" + keyId,
        realKey: key,
        keyId: keyId,
        visible: visible,
        countryPath: countryPath
    };
    return res;
}

function getPathsFromRealKey(key, public, country) {
    var realPath = appPath + "/";
    var keyId = key;

    if (public) {
        realPath += "public/";
    } else {
        realPath += "private/";
    }
    if (country) {
        realPath += "~" + country.toLowerCase() + "/";
        keyId = country.toLowerCase() + "-" + key;
    }

    var res = {
        realPath: realPath,
//        simplePath: appPath + "/" + keyId,
        keyId: keyId,
        key: key
    };
    return res;
}

function getUserLang() {
    var language = navigator.language || navigator.userLanguage;
    return language.split("-")[0];
}

function transl(txt) {
    if (!window.lang) {
        //warn: error function trigge lang again
        $("#errorLog").append("<div>lang function missing with: '" + txt + "'</div>");
        return txt;
    }
    var res = lang[txt];
    if (!res) {
        res = txt;
    }
    return res;
}

//COUNTRY

function getCountryArray(callback) {
    if (window.userCountryArray) {
        callback();
        return;
    }

    var arr = [];
    if (window.userCountry) {
        arr = window.userCountry.split(new RegExp("&| ", 'g'));
    }

    //remove empty values
    var arr = arr.filter(function (n) {
        return typeof n != "undefined";
    });
    var country = arr[arr.length - 1];
    if (country) {
        country = country.toUpperCase();
    }

    //add organizations
    $.getJSON("../imageVote/orgs.json", function (orgs) {
        for (var org in orgs) {
            var list = orgs[org];
            for (var ISO in list) {
                if (country == ISO) { //get last -> COUNTRY
                    arr.push(org);
                }
            }
        }

        window.userCountryArray = arr;
        callback();
    });

}

function isUserCountry(country) {
    var is = false;
    //not callback function
    if (!window.userCountryArray) {
        return false;
    }
    for (var i = 0; i < userCountryArray.length; i++) {
        if (userCountryArray[i].toUpperCase() == country.toUpperCase()) {
            is = true;
            break;
        }
    }
    return is;
}

function formatNumber(number) {
    var reverseValue = ("" + number).split("").reverse().join(""); // reverse
    var formatedNumber = '';
    for (var i = 0; i < reverseValue.length; i++) {
        if (i % 3 == 0 && i != 0) {
            formatedNumber += '.';
        }
        formatedNumber += reverseValue[i];
    }
    return formatedNumber.split("").reverse().join("");
}

function isEmpty(obj) {
    for (var prop in obj) {
        if (obj.hasOwnProperty(prop))
            return false;
    }
    return true;
}

function checkConnection() {
    if (!navigator.onLine) {
        flash(transl("e_connection"));
        return false;
    }
    return true;
}

function getUrlCache(url) {
    var startCacheTime = localStorage.getItem(url);
    if (startCacheTime) {
        //no cache yet
        if (startCacheTime > (new Date()).getTime()) {
            // every minute cache in millis
            return (new Date()).getTime() / 60000 | 0;
        }
        localStorage.removeItem(url);
    }
    // 1 day cache in millis
    return ((new Date()).getTime() / 86400000) | 0;
}

function isUrl(url) {
    //before '.' needs to be double '\\'
    //before ']' needs to be double '\\'
    var strRegex = "^((https|http):\/\/|)" //http://
            + "([0-9a-z_]*\\.)*" // www. || pre.post.
            + "([0-9a-z\-]{0,61}\\.[a-z]{2,6})" // first level domain- .com or .museum
            + "(:[0-9]{1,4}|)" // :80
            + "(" //subdomain regex
            + "[\/?#]" //start subdomain
            + "([0-9a-z\/\-[\\]._~:?#@!$&'()*+,;=%]*)" //and subdomain (can be empty)
            + "|)"//or nothig
            + "$"; //end

    var re = new RegExp(strRegex);
    return re.test(url);
}

//http://stackoverflow.com/questions/29999515/get-final-size-of-background-image
function getBackgroundSize(elem) {
    // This:
    //       * Gets elem computed styles:
    //             - CSS background-size
    //             - element's width and height
    //       * Extracts background URL
    var computedStyle = getComputedStyle(elem),
            image = new Image(),
            src = computedStyle.backgroundImage.replace(/url\((['"])?(.*?)\1\)/gi, '$2'),
            cssSize = computedStyle.backgroundSize,
            elemW = parseInt(computedStyle.width.replace('px', ''), 10),
            elemH = parseInt(computedStyle.height.replace('px', ''), 10),
            elemDim = [elemW, elemH],
            computedDim = [],
            ratio;
    // Load the image with the extracted URL.
    // Should be in cache already.
    image.src = src;
    // Determine the 'ratio'
    ratio = image.width > image.height ? image.width / image.height : image.height / image.width;
    // Split background-size properties into array
    cssSize = cssSize.split(' ');
    // First property is width. It is always set to something.
    computedDim[0] = cssSize[0];
    // If height not set, set it to auto
    computedDim[1] = cssSize.length > 1 ? cssSize[1] : 'auto';
    if (cssSize[0] === 'cover') {
        // Width is greater than height
        if (elemDim[0] > elemDim[1]) {
            // Elem's ratio greater than or equal to img ratio
            if (elemDim[0] / elemDim[1] >= ratio) {
                computedDim[0] = elemDim[0];
                computedDim[1] = 'auto';
            } else {
                computedDim[0] = 'auto';
                computedDim[1] = elemDim[1];
            }
        } else {
            computedDim[0] = 'auto';
            computedDim[1] = elemDim[1];
        }
    } else if (cssSize[0] === 'contain') {
        // Width is less than height
        if (elemDim[0] < elemDim[1]) {
            computedDim[0] = elemDim[0];
            computedDim[1] = 'auto';
        } else {
            // elem's ratio is greater than or equal to img ratio
            if (elemDim[0] / elemDim[1] >= ratio) {
                computedDim[0] = 'auto';
                computedDim[1] = elemDim[1];
            } else {
                computedDim[1] = 'auto';
                computedDim[0] = elemDim[0];
            }
        }
    } else {
        // If not 'cover' or 'contain', loop through the values
        for (var i = cssSize.length; i--; ) {
            // Check if values are in pixels or in percentage
            if (cssSize[i].indexOf('px') > -1) {
                // If in pixels, just remove the 'px' to get the value
                computedDim[i] = cssSize[i].replace('px', '');
            } else if (cssSize[i].indexOf('%') > -1) {
                // If percentage, get percentage of elem's dimension
                // and assign it to the computed dimension
                computedDim[i] = elemDim[i] * (cssSize[i].replace('%', '') / 100);
            }
        }
    }
    // If both values are set to auto, return image's 
    // original width and height
    if (computedDim[0] === 'auto' && computedDim[1] === 'auto') {
        computedDim[0] = image.width;
        computedDim[1] = image.height;
    } else {
        // Depending on whether width or height is auto,
        // calculate the value in pixels of auto.
        // ratio in here is just getting proportions.
        ratio = computedDim[0] === 'auto' ? image.height / computedDim[1] : image.width / computedDim[0];
        computedDim[0] = computedDim[0] === 'auto' ? image.width / ratio : computedDim[0];
        computedDim[1] = computedDim[1] === 'auto' ? image.height / ratio : computedDim[1];
    }
    // Finally, return an object with the width and height of the
    // background image.
    return {
        width: computedDim[0],
        height: computedDim[1]
    };
}


function encode_uri(s) {
    return unescape(encodeURIComponent(s));
}

function decode_uri(s) {
    try {
        s = decodeURIComponent(escape(s));
    } catch (e) {
        //console.log("cant decode: " + s);
    }
    return s;
}

function browser() {
    var ua = navigator.userAgent, tem,
            M = ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];
    if (/trident/i.test(M[1])) {
        tem = /\brv[ :]+(\d+)/g.exec(ua) || [];
        return 'IE ' + (tem[1] || '');
    }
    if (M[1] === 'Chrome') {
        tem = ua.match(/\b(OPR|Edge)\/(\d+)/);
        if (tem != null)
            return tem.slice(1).join(' ').replace('OPR', 'Opera');
    }
    M = M[2] ? [M[1]] : [navigator.appName];
    if ((tem = ua.match(/version\/(\d+)/i)) != null)
        M.splice(1, 1, tem[1]);
    return M[0].toLowerCase();
}

//http://stackoverflow.com/questions/4817029/whats-the-best-way-to-detect-a-touch-screen-device-using-javascript
function is_touch_device() {
  return 'ontouchstart' in window        // works on most browsers 
      || navigator.maxTouchPoints;       // works on IE10/11 and Surface
};
