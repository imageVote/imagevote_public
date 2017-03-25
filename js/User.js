
var User = function (voting, callback) {
    console.log("new User()");
    //NOT VOTING ANYMORE (IN WOULD-YOU-RATHER)
//    if (window.public && window.publicId) {
//        if (window.user) {
//            phoneId = window.user.id;
//        }
//        this.id = window.publicId;
//    }
//    this.vt = "";
//    if (voting) {
//        this.vt = 0;
//    }

    //only for web index.html redirection requests! not 4 APP
    if (!window.Device) {
        this.userIP(function (this_user) {
            if (callback) {
                callback(this_user);
            }
        });
    } else {
        if (!this.id && window.user) {
            this.id = window.user.id;
        }
        if (callback) {
            callback(this);
        }
    }
};

User.prototype.userIP = function (callback) {
    var _this = this;
    console.log("addUserIP: " + window.userIp);

    //prevent ajax if already stored userIp
    if (window.userIp) {
        this.id = window.userIp;
        if (callback) {
            callback(this);
        }
        return;
    }

    $.ajax({
        url: window.urlPath + "/core/getIP.php"
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
        _this.id = id;
        _this.country = country;

        if (callback) {
            callback(_this);
        }

        window.userIp = id;

    }).error(function () {
        console.log("getIP.php not found");
        var id = "local";
        localStorage.setItem("userId", id);
        _this.id = id;
        //if debug
        if (callback) {
            callback(_this);
        }
    });
};

function getUserLang() {
    var local_lang = localStorage.getItem("userLang");
    if (local_lang) {
        return local_lang;
    }
    var language = navigator.language || navigator.userLanguage;
    return language.split("-")[0];
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


//DEVICE function only!! - global User already exists (providing id, etc..)
// every time something in Android user updates (Digits, etc..)
function addUser(id, country) {
    console.log("addUser start '" + id + "'");
    if (!id) {
        console.log("not valid id");
        return;
    }

    //don't override userId localStorage userId ???
    updateUserId(id);

    var name = localStorage.getItem("userName");
    updateUserName(name);

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
}

function updateUserId(id) {
    if (!window.user) {
        window.user = new User();
    }
    
    window.user.id = id;
    localStorage.setItem("userId", id);
}

function updateUserName(name) {
    if (!window.user) {
        window.user = new User();
    }
    
    window.user.nm = name;
    localStorage.setItem("userName", name);
    $("#username input").val(name);
}
