
var Language = function (languages, query) {
    this.languages = languages;
    this.query = query;

    this.html();
};

Language.prototype.html = function () {
    $("#languages").remove();
    $(this.query).append("<div id='languages'>");
    
    for (var i = 0; i < this.languages.length; i++) {
        var language = this.languages[i];
        var lang_div = $("<div><div class='img'>"
                + "<img src='~commons/img/flags/48/" + language[1] + ".png'>"
                + "</div><div class='text'>" + language[2] + "</div></div>");
        $("#languages").append(lang_div);
        (function () {
            var lang = language;
            lang_div.click(function () {
                localStorage.setItem("userLang", lang[0].toLowerCase());
                localStorage.setItem("game_db", lang[3]);
                translateTags(true);
                
                setTimeout(function(){
                    $("#languages").remove();
                }, 300);                
            });
        })();
    }
};
