
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
        this.loadLanguage(path, function () {
            loaded++;
            console.log("loaded " + loaded);
            if (obj_size(window.languagePaths) == loaded) {
                _this.loadTranslations(refresh);
            }
        });
    }
};

Translate.prototype.loadLanguage = function (path, callback) {
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

    if (this.loaded.indexOf(path + "/" + userLang) > -1) {
        return;
    }
    $.get(path + "/" + userLang + ".js").done(function () {
        console.log("LANG LOADED");
        if (callback) {
            callback();
        }
        _this.loaded.push(path + "/" + userLang);

    }).fail(function () {
        $.get(path + "/en.js", function () {
            console.log("EN LANG LOADED");
            if (callback) {
                callback();
            }
        });
    });
};

Translate.prototype.loadTranslations = function (refresh) {
    console.log("loadTranslations() " + refresh)
    if (!window.lang) {
        console.log("!window.lang");
        return;
    }

    var textFormat = new TextFormat();
    $("[data-lang]").each(function () {
        var textKey = $(this).attr("data-lang");

        //prevent re-translate
        if ($(this).text() && !refresh && $(this).text() != textKey) {
            //console.log($(this).text() + " != " + textKey)
            return true; //continue
        }

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
