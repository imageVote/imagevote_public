
var alternative = {
//    keysPath: "dl.dropboxusercontent.com/u/70345137/key/"
};

//from DEVICE
function resume() {
    stopFlash();
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
    console.log("getPathsFromKeyId " + keyId);
    if (!keyId) {
        keyId = location.pathname.split("/").pop();
        if (!keyId || keyId.indexOf('.') !== -1) {
            return false;
        }
    }

    var realPath = window.keysPath;

    var public = "false";
    var symbol = "-";
    var visible = "private";
    
    var prefix;
    var countryPath = "";
    
    var key = keyId;
    if (keyId.indexOf("-") > 0) {
        public = "true";
        visible = "public";
        var arr = keyId.split("-");
        prefix = arr.shift();
        countryPath = "~" + prefix + "/";
        realPath += countryPath;
        key = arr.join("-");
    }

    if (keyId.indexOf("$") > -1) {
        symbol = "$";
        visible = "";
        var arr = keyId.split("$");
        prefix = arr.shift();
        key = arr.join("$");
    }

    screenPoll.isPublic(public);
    if (visible == "public" || visible == "private") {
        realPath += visible + "/";
    }

    var res = {
        realPath: realPath,
        realKey: key,
        keyId: keyId,
        symbol: symbol,
        visible: visible,
        prefix: prefix,
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

function transl(txt) {
    if (!window.lang) {
        //$("#errorLog").append("<div>lang function missing with: '" + txt + "'</div>");
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
    $.getJSON(window.urlPath + "/core/orgs.json", function (orgs) {
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
$(window).on("swipe", function () {
    console.log("SWIPE")
    is_touch_device("true");
});
function is_touch_device(isTouch) {
//    return 'ontouchstart' in window        // works on most browsers 
//            || navigator.maxTouchPoints;       // works on IE10/11 and Surface
//            
//    var touch = Modernizr.touchevents;
//    console.log("TOUCH: " + touch)
//    return touch;
    if (isTouch) {
        localStorage.setItem("touch", isTouch);
        return;
    }

    var touch = localStorage.getItem("touch");
    if (!touch || "false" == touch || "undefined" == touch) {
        touch = false;
    }
    return touch;
}

//http://stackoverflow.com/questions/4770025/how-to-disable-scrolling-temporarily
//function preventDefault(e) {
//    e = e || window.event;
//    if (e.preventDefault)
//        e.preventDefault();
//    e.returnValue = false;
//}
//
//function preventDefaultForScrollKeys(e) {
//    var keys = {37: 1, 38: 1, 39: 1, 40: 1};
//
//    if (keys[e.keyCode]) {
//        preventDefault(e);
//        return false;
//    }
//}

function disableScroll() {
//    if (window.addEventListener) // older FF
//        window.addEventListener('DOMMouseScroll', preventDefault, false);
//    window.onwheel = preventDefault; // modern standard
//    window.onmousewheel = document.onmousewheel = preventDefault; // older browsers, IE
//    window.ontouchmove = preventDefault; // mobile
//    document.onkeydown = preventDefaultForScrollKeys;

    //mobile
    $('*').on('touchmove.disableScroll', function (e) {
        e.preventDefault()
    });
}

function enableScroll() {
//    if (window.removeEventListener)
//        window.removeEventListener('DOMMouseScroll', preventDefault, false);
//    window.onmousewheel = document.onmousewheel = null;
//    window.onwheel = null;
//    window.ontouchmove = null;
//    document.onkeydown = null;

    //mobile
    $('*').off('.disableScroll');
}
