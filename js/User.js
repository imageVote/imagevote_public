
var User = function (voting, callback) {
    console.log("new User(" + voting + ")");
    if (window.public && window.publicId) {
        phoneId = window.user.id;
        this.id = window.publicId;
    }
    this.vt = "";
    if (voting) {
        this.vt = 0;
    }

    //only for web index.html redirection requests! not 4 APP
    if (!window.Device) {
        this.userIP(function (this_user) {
            if (callback) {
                callback(this_user);
            }
        });
    } else {
        Device.loadProfile(); //will load window.user after
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
        //addUser(id, "", country); //name = null
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
        //addUser(id); //name = null
        _this.id = id;
        //if debug
        if (callback) {
            callback(_this);
        }
    });
};

function getUserLang() {
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


//DEVICE function!! - global User already exists (providing id, etc..)
function addUser(id, name, country, pubId) {
    console.log("addUser start");

    if (!id) {
        console.log("not valid id");
        return;
    }

    //don't override userId localStorage userId !
    if (pubId) {
        window.publicId = pubId;
        localStorage.setItem("publicId", pubId);
    }
    console.log("public id = '" + pubId + "' in addUser; ");
    window.user.id = id;

    if (name) {
        window.user.nm = name;
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
}

function saveUserName(name) {
    localStorage.setItem("userName", name);
}
