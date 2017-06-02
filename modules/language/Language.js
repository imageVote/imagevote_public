
var Language = function (query) {
    console.log("new Language() load");
    if (!query) {
        query = "body";
    }
    this.query = query;

    //data
    this.languages = {
        'en': ["en", "GB", "English", "preguntasEN"],
        'es': ["es", "ES", "Español", "preguntas"],
        'de': ["de", "DE", "Deutsch", "preguntasDE"],
        'fr': ["fr", "FR", "Français", "preguntasFR"],
        'it': ["it", "IT", "Italiano", "preguntasIT"],
        'pt': ["pt", "PT", "Português", "preguntasPT"]
    };

    this.languages = $.extend(this.languages, window.languages);

    //urls:
    this.languageURL = {
        'en': "WouldYouRather.co",
//        'es': "QuePrefieres.online",
//        'de': "WurdestDuLieber.online",
//        'fr': "TuPreferes.online",
//        'it': "TuCosaPreferiresti.online",
//        'pt': "VocePrefere.online"
    };
    this.shareUrl = this.languageURL['en'];

    //load stored
    var userLang = this.userLang();
    if (userLang) {
        if (this.languageURL[userLang]) {
            this.shareUrl = this.languageURL[userLang];
        }

        if ("localhost" == location.hostname) {
            this.shareUrl = settings.appPath;
        }
        return;
    }

    //filter by loaded url
    for (var key in this.languageURL) {
        var lang_url = this.languageURL[key];
        if (location.hostname.indexOf(lang_url) > -1) {
            var lang_array = this.languages[key];
            this.loadLanguage(lang_array);
            this.shareUrl = lang_url;
            return;
        }
    }

    this.loadHtml();
};

Language.prototype.loadHtml = function (callback) {
    var _this = this;
    this.callback = callback;

    //remove other
    $("#languages").remove();

    this.$lang_dom = $("<div id='languages'>");
    $(this.query).append(this.$lang_dom);

    this.languages = this.sortLanguages(this.languages);

    for (var key in this.languages) {
        var language = this.languages[key];
        var lang_div = $("<div class='lang_" + language[0] + "'><div class='img'>"
                + "<img src='~commons/img/flags/48/" + language[1] + ".png'>"
                + "</div><div class='text'>" + language[2] + "</div></div>");
        if (language[0] == this.userLang()) {
            lang_div.css("background", "rgba(255,255,255,0.15)");
        }
        this.$lang_dom.append(lang_div);

        (function () {
            var lang = language;
            lang_div.click(function () {
                _this.loadLanguage(lang);
            });
        })();
    }

    //put first user language:
    var userLang = navigator.language || navigator.userLanguage;
    var langDiv = this.$lang_dom.find(".lang_" + userLang);
    this.$lang_dom.prepend(langDiv);
    langDiv.addClass("preselect");
};

Language.prototype.sortLanguages = function (languages) {
    //LANGUAGES SORT:
    var langs = [];
    for (var k in languages) {
        if ("en" == k) {
            continue;
        }
        langs.push(languages[k][2]);
    }
    langs.sort();

    var sorted = {
        en: languages.en
    };
    for (var i = 0; i < langs.length; i++) {
        for (var key in languages) {
            if (langs[i] == languages[key][2]) {
                sorted[key] = languages[key];
                continue;
            }
        }
    }
    return sorted;
};

Language.prototype.loadLanguage = function (lang) {
    var userLang = lang[0].toLowerCase();

    //if selected same
    if (this.userLang() == userLang) {
        this.remove();
        this.redirection();
        return;
    }

    localStorage.setItem("userLang", lang[0].toLowerCase());
    //localStorage.setItem("game_db", lang[3]);
    localStorage.setItem("game_db", "q_" + lang[0]);
    translate.translateTags(true);

    this.remove();
    if (this.callback) {
        this.callback();
    }

    //update url
    if (this.languageURL[userLang]) {
        this.shareUrl = this.languageURL[userLang];
    }

    this.redirection();
};

Language.prototype.redirection = function () {
    //FORCE GAME RELOAD ??
    if (location.pathname && "/" != location.pathname && (!location.hash || "polls" == location.hash)) {
        hashManager.href("#polls");
    }
};

Language.prototype.userLang = function () {
    return localStorage.getItem("userLang");
};

Language.prototype.remove = function () {
    var _this = this;
    setTimeout(function () {
        if (_this.$lang_dom) {
            _this.$lang_dom.remove();
        }
    }, 100);
};
