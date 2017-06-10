
window.languagePaths = {'~': "body"};

var Translate = function () {
    this.loaded = [];

    this.textFormat = new TextFormat();
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
        var where = window.languagePaths[path];
        this.loadLanguage(path, where, function () {
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
    window.languagePaths[path] = where;

    var userLang = getUserLang().toLowerCase();
    console.log("userLang: " + userLang + " - " + path);

    //INIT
    if (!window["lang_" + userLang]) {
        window["lang_" + userLang] = {};
    }

    if ("zh" == userLang || "cn" == userLang || "tw" == userLang) {
        userLang = "zh-cn";
    }

    var file = path + "lang/" + userLang + ".js";

    try {
        require([file], function () {
            if (callback) {
                callback();
            }
        });
    } catch (e) {
        //english if fail
        require([path + "lang/en.js"], function () {
            if (callback) {
                callback();
            }
        });
    }

    this.loaded.push(file);
};

Translate.prototype.loadTranslations = function (where) {
    console.log("loadTranslations() " + where);
    var _this = this;

    if (!where || !window.lang) {
        console.log("!!where || window.lang");
        return;
    }

    $(where + " [data-lang]").each(function () {
        var textKey = $(this).attr("data-lang");

        var translation = window.lang[textKey];
        if (translation) {
            $(this).html(_this.textFormat.decode(translation));
        } else {
            $(this).html(textKey);
            console.log(textKey + " not have translation!");
        }
        //remove lang 4 prevent re-translate
        //$(this).removeAttr("data-lang");
    });

    $(where + " [data-placeholder]").each(function () {
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
