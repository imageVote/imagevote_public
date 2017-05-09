
var TextFormat = function () {
    //
};

TextFormat.prototype.encode = function (txt) {
    return txt.replace(/<b>(.*?)<\/b>/, '**$1**');
};

TextFormat.prototype.decode = function (txt) {
    return txt.replace(/\*\*(.*?)\*\*/, "<b>$1</b>");
};
