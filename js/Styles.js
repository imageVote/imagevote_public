
var Styles = function () {
    this.cssColors();

    //pre-load canvas fonts
    //http://stackoverflow.com/questions/2756575/drawing-text-to-canvas-with-font-face-does-not-work-at-the-first-time
    var div = $("<div style='font-family:Hand; color:rgba(0,0,0,0)'>.</div>"); //add transparent text
    $("body").append(div);
};

Styles.prototype.cssColors = function (query, style) {
    if (!query) {
        query = "";
    }
    //screen votation case
    if (query == "#votation .votationBox") {
        query = "#votation";
    }

    if ('object' === typeof style) {
        //fill undefined styles
        for (var key in window.defaultStyle) {
            if (!style[key]) {
                style[key] = window.defaultStyle[key];
            }
        }
    } else {
        style = window.defaultStyle;
        if (!style) {
            console.log("!defaultStyle");
            return;
        }
        if (screenPoll && screenPoll.style) {
            for (var key in screenPoll.style) {
                style[key] = screenPoll.style[key];
            }
        }
    }

    var css = document.createElement("style");
    css.type = "text/css";
    css.innerHTML = "";

    css.innerHTML += query + " .creator_title{"
            + " color: rgb(" + style.questionColor.toString() + ");"
            + "}";
    css.innerHTML += query + " .option_text{"
            + " color: rgb(" + style.textColor.toString() + ");"
            + "}";
    css.innerHTML += query + " .option_0{"
            + this.gradient(style.color1, 0)
            + "}";
    css.innerHTML += query + " .option_1{"
            + this.gradient(style.color2, 1)
            + "}";
    css.innerHTML += query + " .percentage_container > div{"
            + " background: rgb(" + style.percent.toString() + ");"
            + "}";
    css.innerHTML += query + " #votationOwner {"
            + " color: rgba(" + style.questionColor.toString() + ", 0.65);"
            + "}";
    //allow transparency:
//    if (!window.isTranslucent) {
//        css.innerHTML += query + "{"
//                + " background: rgb(" + style.backgroundColor.toString() + ");"
//                + "}";
//    }

    document.body.appendChild(css);
};

Styles.prototype.gradient = function (rgbColor, i) {
    var r = parseInt(rgbColor[0] + (255 - rgbColor[0]) * 0.45);
    var g = parseInt(rgbColor[1] + (255 - rgbColor[1]) * 0.45);
    var b = parseInt(rgbColor[2] + (255 - rgbColor[2]) * 0.45);

    var dir1 = "left top";
    var dir2 = "bottom right";
    if (i % 2) {
        dir1 = "bottom right";
        dir2 = "left top";
    }

    return "background: rgb(" + rgbColor.toString() + ");"
            + "background: -webkit-linear-gradient(" + dir1 + ", rgb(" + rgbColor.toString() + "), rgb(" + r + "," + g + "," + b + "));"
            + "background: -o-linear-gradient(" + dir2 + ", rgb(" + rgbColor.toString() + "), rgb(" + r + "," + g + "," + b + "));"
            + "background: -moz-linear-gradient(" + dir2 + ", rgb(" + rgbColor.toString() + "), rgb(" + r + "," + g + "," + b + "));"
            + "background: linear-gradient(to " + dir2 + ", rgb(" + rgbColor.toString() + "), rgb(" + r + "," + g + "," + b + "));";
};
        