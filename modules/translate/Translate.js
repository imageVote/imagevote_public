
window.languagePaths = {'~': 1};

var Translate = function () {
    this.loaded = [];
};

Translate.prototype.translateTags = function (refresh) {
    var _this = this;

    if (window.lang && !refresh) {
        console.log("!refresh translateTags");
        this.loadTranslations();
        return;
    }

    console.log("translateTags() " + obj_size(window.languagePaths));
    var loaded = 0;
    for (var path in window.languagePaths) {
        this.loadLanguage(path, null, function () {
            loaded++;
            console.log("loaded " + loaded);
            if (obj_size(window.languagePaths) == loaded) {
                _this.loadTranslations();
            }
        });
    }
};

Translate.prototype.loadLanguage = function (path, where, callback) {
    var _this = this;
    if (!window.lang) {
        window.lang = {};
    }
    window.languagePaths[path] = 1;

    var userLang = getUserLang().toLowerCase();
    console.log("userLang: " + userLang + " - " + path);

    if ("zh" == userLang) {
        userLang = "zh-cn";
    }

    var file = path + "lang/" + userLang + ".js";
    if (this.loaded.indexOf(file) > -1) {
        if (callback) {
            callback();
        }
        return;
    }

//    $.get(file).done(function () {
//        console.log("LANG LOADED");
//        _this.loadTranslations(where);
//        if (callback) {
//            callback();
//        }
//    }).fail(function () {
//        $.get(path + "lang/en.js", function () {
//            console.log("EN LANG LOADED");
//            _this.loadTranslations(where);
//            if (callback) {
//                callback();
//            }
//        });
//    });
    
    //NOT LOAD WITH JQUERY GET - NOT WORK ON ANDROID
    var head = document.getElementsByTagName("head")[0];
    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.onload = function () {
        console.log("LANG LOADED");
        _this.loadTranslations(where);
        if (callback) {
            callback();
        }
    };
    script.onerror = function () {
        var scriptEN = document.createElement('script');
        scriptEN.type = 'text/javascript';
        scriptEN.onload = function () {
            console.log("EN LANG LOADED");
            _this.loadTranslations(where);
            if (callback) {
                callback();
            }
        };
        scriptEN.src = path + "lang/en.js";
        head.appendChild(scriptEN);
    };
    script.src = file;
    head.appendChild(script);

    this.loaded.push(file);
};

Translate.prototype.loadTranslations = function (where) {
    console.log("loadTranslations() " + where);
    if (!where) {
        where = "";
    }

    if (!window.lang) {
        console.log("!window.lang");
        return;
    }

    var textFormat = new TextFormat();
    $(where + " [data-lang]").each(function () {
        var textKey = $(this).attr("data-lang");

        var translation = window.lang[textKey];
        if (translation) {
            $(this).html(textFormat.decode(translation));
        } else {
            $(this).html(textKey);
            console.log(textKey + " not have translation!");
        }
        //remove lang 4 prevent re-translate
        //$(this).removeAttr("data-lang");
    });

    $("[data-placeholder]").each(function () {
        var textKey = $(this).attr("data-placeholder");
        var translation = window.lang[textKey];
        if (translation) {
            $(this).attr("placeholder", translation);
        } else {
            $(this).attr("placeholder", translation);
            console.log(textKey + " not have translation!");
        }
        //remove lang 4 prevent re-translate
        $(this).removeAttr("data-placeholder");
    });
};
