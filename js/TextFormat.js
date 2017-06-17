
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
//    return txt
//            .replace("</ b>", "</b>")
//            .replace("<B>", "<b>")
//            .replace("</ B>", "</b>");
    txt = this.replaceAll(txt, "</ b>", "</b>");
    txt = this.replaceAll(txt, "<B>", "<b>");
    txt = this.replaceAll(txt, "</ B>", "</b>");
    return txt;
};

TextFormat.prototype.replaceAll = function (str, find, replace) {
    var find_escape = find.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
    return str.replace(new RegExp(find_escape, 'g'), replace);
};
