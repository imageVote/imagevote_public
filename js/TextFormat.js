
var TextFormat = function () {
    //
};

TextFormat.prototype.encode = function (txt) {
//    if (!txt) {
    return txt;
//    }
//    return txt.replace(/<b>(.*?)<\/b>/g, '**$1**');
};

TextFormat.prototype.decode = function (txt) {
    if (!txt) {
        return txt;
    }
//    return txt.replace(/\*\*(.*?)\*\*/g, "<b>$1</b>");
    //GOOGLE TRANSLATOR ISSUES
    return txt
            .replace("</ b>", "</b>")
            .replace("<B>", "<b>")
            .replace("</ B>", "</b>");
};
