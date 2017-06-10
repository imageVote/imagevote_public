//Draw.js

function getCanvasImage(divQuery, obj, keyId, width, type, callback) {
    console.log("getCanvasImage: " + divQuery + " " + JSON.stringify(obj));
    //var url = settings.appPath + "/" + keyId;
    var url = language.shareUrl + "/" + keyId.toLowerCase();

    var country = "";
    if ("undefined" !== typeof obj.style && obj.style) {
        country = obj.style.country;
    }

    if (!width) {
        width = 506; //twitter width
    }

    var show = false;
    if ("show" == type) {
        show = true;
    }

    //let debug on console
    var drawPoll = new DrawPoll({
        width: width,
        obj: obj,
        url: url,
        country: country,
        show: show
    }); //draw image
    window.drawPoll = drawPoll;

    $(divQuery).addClass("image");

    if ("list" != type) {
        var container = $("<div class='link'>link: </div>");
        var a = $("<a>" + url + "</a>");
        container.append(a);
        $(divQuery).append(container);

        a.click(function () {
            loading(null, "getCanvasImage click");
            if (window.Device) {
                //prevent hash works
                //location.href = location.origin + location.pathname + "?" + keyId;
                location.href = hashManager.deviceURL("?" + keyId);
            } else {
                //location.href = "http://"+settings.appPath+"/" + keyId + "#translucent";
                location.href = "http://" + settings.appPath + "/" + keyId;
            }
        });
    }

    drawPoll.drawCanvas(function (canvas) {
        //convert to image to let copy on any device
        var dom_image = drawPoll.draw.canvasImg(canvas);
        $(divQuery).prepend(dom_image);

        if (callback) {
            try {
                //w8 canvas footer images..
                callback(canvas.toDataURL());
            } catch (e) {
                console.log(callback.toString());
                //let throw error:
                callback(canvas.toDataURL());
            }
        }
    });
}

//PIXEL RATIO:
window.PIXEL_RATIO = (function () {
    var ctx = document.createElement("canvas").getContext("2d"),
            dpr = window.devicePixelRatio || 1,
            bsr = ctx.webkitBackingStorePixelRatio ||
            ctx.mozBackingStorePixelRatio ||
            ctx.msBackingStorePixelRatio ||
            ctx.oBackingStorePixelRatio ||
            ctx.backingStorePixelRatio || 1;

    return dpr / bsr;
})();

////////////////////////////////////////////////////////////////////////////
//DRAW CANVAS //////////////////////////////////////////////////////////////

function Draw(width) {
    this.canvas = this.newCanvas(width);
    this.ctx = this.canvas.getContext("2d");
    this.width = this.canvas.width;
    this.height = this.canvas.height;
}

Draw.prototype.newCanvas = function (width) {
    var PIXEL_RATIO = window.PIXEL_RATIO;
    var w = width * PIXEL_RATIO;

    var canvas = document.createElement("canvas");
    canvas.width = w;
    //canvas.height = w / 2;
    canvas.height = w / 2.39;

    //canvas.style.maxWidth = "100%"; //case when scroll appears and modifies screen width
    //let max-width 100% (2.3 bug)
    canvas.style.width = width + "px"; //case when scroll appears and modifies screen width
    canvas.getContext("2d").setTransform(PIXEL_RATIO, 0, 0, PIXEL_RATIO, 0, 0);

    return canvas;
};

Draw.prototype.canvasImg = function () {
    var canvas = this.canvas;
    var d = canvas.toDataURL("image/png");
    var image = $("<img src='" + d + "'/>");
    image.css({
        width: $(canvas).width() + "px"
    });
    return image;
};

Draw.prototype.background = function (color) {
    var ctx = this.ctx;
    var canvas = this.ctx.canvas;

    //BACKGROUND COLOR
    ctx.fillStyle = "rgb(" + color + ")";
    ctx.rect(0, 0, canvas.width, canvas.height);
    ctx.fill();
};

Draw.prototype.title = function (txt, left, top, color) {
    var ctx = this.ctx;
    left = parseInt(left);
    top = parseInt(top);

    //http://stackoverflow.com/questions/8952909/letter-spacing-in-canvas-element
    var title = txt.split("").join(String.fromCharCode(8202)); //add space between letters
    if ("0,0,0" != color) {
        ctx.fillStyle = "rgb(0,0,0)";
        ctx.fillText(title, left + 1, top + 1);
    }
    ctx.fillStyle = "rgb(" + color + ")";
    ctx.fillText(title, left, top);
};

Draw.prototype.optionSquare = function (x, y, width_all, height_all, color) {
    var ctx = this.ctx;
    x = parseInt(x);
    y = parseInt(y);
    width_all = parseInt(width_all);
    height_all = parseInt(height_all);

    ctx.beginPath();
    ctx.fillStyle = "rgb(" + color + ")";
    ctx.rect(x, y, width_all, height_all);
    ctx.fill();

    ctx.beginPath();
    var grd = ctx.createLinearGradient(x, y, x + width_all, y + width_all);
    grd.addColorStop(0, "rgba(255,255,255, 0)");
    grd.addColorStop(1, "rgba(255,255,255, 0.35)");
    ctx.fillStyle = grd;
    ctx.rect(x, y, width_all, height_all);
    ctx.fill();

    //BORDERS:
    ctx.beginPath();
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.rect(x + 1, y + 1, width_all - 1, 1);
    ctx.rect(x + 1, y + 1, 1, height_all - 1);
    ctx.fill();

    ctx.beginPath();
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.rect(x, y + height_all, width_all, 1);
    ctx.rect(x + width_all, y, 1, height_all);
    ctx.fill();
};

Draw.prototype.option = function (optionName, left, top, color1, maxWidth) {
    var ctx = this.ctx;
    left = parseInt(left);
    top = parseInt(top);
    maxWidth = parseInt(maxWidth);

    var lines = this.wrapText(ctx, optionName, left, 0, maxWidth, lineHeight, true);
    console.log("lines: " + lines);

    var lineHeight = this.width / 16;
    console.log("lineHeight: " + lineHeight);
    var h = top - lines * lineHeight / 2;

    ctx.textAlign = "left";
    if (maxWidth) {
        ctx.textAlign = "center";
    }
    ctx.textBaseline = "middle";

    ctx.fillStyle = "black"; //black shadow
    this.wrapText(ctx, optionName, +left + 1, +h + 1, maxWidth, +lineHeight);
    ctx.fillStyle = "rgb(" + color1 + ")";
    this.wrapText(ctx, optionName, +left, +h, maxWidth, +lineHeight);

    return ctx.measureText(optionName).width;
};

Draw.prototype.percentage = function (percent, left, top, color1) {
    var ctx = this.ctx;
    left = parseInt(left);
    top = parseInt(top);

    var perc = Math.round(percent * 100) + "%";
    ctx.textBaseline = "bottom";

    ctx.fillStyle = "black"; //black shadow
    ctx.fillText(perc, left + 1, top + 1);
    ctx.fillStyle = "rgb(" + color1 + ")";
    ctx.fillText(perc, left, top);
};

Draw.prototype.votes = function (textValue, left, top, color1) {
    var ctx = this.ctx;
    ctx.beginPath();
    left = parseInt(left);
    top = parseInt(top);

    if (left < 0) {
        left = this.width + left;
        ctx.textAlign = "right";
    } else {
        ctx.textAlign = "center";
    }

    //votes number    
    textValue = textValue.split("").join(String.fromCharCode(8202));

    ctx.fillStyle = "black"; //black shadow
    ctx.fillText(textValue, left + 1, parseInt(top) + 1);
    ctx.fillStyle = color1;
    ctx.fillText(textValue, left, parseInt(top));
};

Draw.prototype.footer = function (url, left, bottom, country, callback) {
    var ctx = this.ctx;
    ctx.beginPath();
    var w = this.width;
    var footerHeight = this.height - bottom;

    //link
    if (url) {
        ctx.textAlign = "left";
//        ctx.fillStyle = "rgba(" + this.style.questionColor.toString() + ",0.4)";
        ctx.fillStyle = "rgba(0,0,0,0.4)";
        ctx.font = parseInt(w / 37) + "px Verdana";
        ctx.fillText(url, left, footerHeight);
    }

    //date
    var date = new Date();
    var day = ("0" + date.getDate()).slice(-2);
    var month = ("0" + (date.getMonth() + 1)).slice(-2);
    var year = date.getFullYear();
    var string = year + '-' + month + '-' + day;

    ctx.textAlign = "right";
//    ctx.fillStyle = "rgba(" + this.style.questionColor.toString() + ",0.45)";
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.font = parseInt(w / 38) + "px Verdana";
    ctx.fillText(string, w - left, footerHeight);

    callback();
};

Draw.prototype.owner = function (owner, top, questionColor) {
    if (empty(owner)) {
        return;
    }

    var ctx = this.ctx;
    var w = this.width;
    var margin = w / 60;

    //like footer link
    var by = "by: ";
    ctx.textAlign = "left";
    ctx.fillStyle = "rgba(" + questionColor + ",0.5)";
    ctx.font = parseInt(w / 44) + "px Verdana";
    ctx.fillText("by: ", margin, top);

    var byWidth = ctx.measureText(by).width;
    ctx.fillStyle = "rgba(" + questionColor + ",0.65)";
    ctx.font = parseInt(w / 38) + "px Verdana";
    owner = decode_uri(owner);
    ctx.fillText(owner, margin + byWidth, top);
};

Draw.prototype.gradient = function (percent, x, y, width, height, color, direction) {
    var ctx = this.ctx;
    ctx.beginPath();

    var option_top = height - (height * percent);
    var option_left = width - (width * percent);

    var left = x;
    var top = y;
    var gradientWidth = width;
    var gradientHeight = height;

    var grd;
    if (!direction) {
        var top = y + option_top;
        grd = ctx.createLinearGradient(0, top, 0, y + height);
        var gradientHeight = height - option_top;

        grd.addColorStop(0, "rgba(" + color + ",0.16)");
        grd.addColorStop(1, "rgba(" + color + ",0.05)");

    } else {
        grd = ctx.createLinearGradient(left, 0, x + width, 0);
        var gradientWidth = width - option_left;

        grd.addColorStop(1, "rgba(" + color + ",0.46)");
        grd.addColorStop(0, "rgba(" + color + ",0.05)");
    }
    ctx.fillStyle = grd;

    ctx.fillRect(left, top, gradientWidth, gradientHeight);
};

Draw.prototype.wrapText = function (context, text, x, y, maxWidth, lineHeight, info_only) {
    var lines = 1;
    var words = text.split(' ');
    var line = '';

    for (var n = 0; n < words.length; n++) {
        var testLine = line + words[n] + ' ';
        var metrics = context.measureText(testLine);
        var testWidth = metrics.width;
        if (testWidth > maxWidth && n > 0) {
            if (!info_only) {
                context.fillText(line, x, y);
            }
            line = words[n] + ' ';
            y += lineHeight;
            lines++;
        } else {
            line = testLine;
        }
    }
    if (!info_only) {
        context.fillText(line, x, y);
    }
    console.log(y + ", " + lineHeight);

    return lines;
};

Draw.prototype.clickHere = function (family) {
    var txt = transl("ClickTheLink");
    var string1, string2;

    var index;
    var mid = parseInt(txt.length / 2) + 1;
    for (var i = 0; i < mid; i++) {
        index = mid + i;
        if (" " == txt[index]) {
            break;
        }
        index = mid - i;
        if (" " == txt[index]) {
            break;
        }
    }

    string1 = txt.substring(0, index);
    string2 = txt.substring(index, txt.length);
    var marginTop = this.y_all;

    var ctx = this.ctx;
    ctx.font = parseInt(this.width / 13) + "px " + family;
    ctx.rotate(-0.1);

    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.fillStyle = "black";
//    ctx.fillStyle = "black";
    ctx.fillText(string1, parseInt(this.width * 0.49) + 1, parseInt(marginTop + this.width * 0.31) + 1);
    ctx.fillText(string2, parseInt(this.width * 0.49) + 1, parseInt(marginTop + this.width * 0.39) + 1);
    ctx.fillStyle = "rgba(0,0,0,0.9)";
    ctx.fillStyle = "rgb(255, 215, 0)";
//    ctx.fillStyle = "yellow";
    ctx.fillText(string1, parseInt(this.width * 0.49), parseInt(marginTop + this.width * 0.31));
    ctx.fillText(string2, parseInt(this.width * 0.49), parseInt(marginTop + this.width * 0.39));
    ctx.rotate(0.1);

    ctx.lineWidth = 1;

    var oX = parseInt(this.width * 0.089);
    var oY = parseInt(marginTop + this.width * 0.36);
    var f1X = parseInt(this.width * 0.079);
    var f1Y = parseInt(marginTop + this.width * 0.325);
    var f2X = parseInt(this.width * 0.123);
    var f2Y = parseInt(marginTop + this.width * 0.34);
    var l1 = parseInt(this.width * 0.119);
    var l2 = parseInt(marginTop + this.width * 0.256);
    var l3 = parseInt(this.width * 0.198);
    var l4 = parseInt(marginTop + this.width * 0.285);
    var l5 = parseInt(this.width * 0.306);
    var l6 = parseInt(marginTop + this.width * 0.275);

    ctx.strokeStyle = "rgba(255,255,255,0.5)";
    ctx.strokeStyle = "black";
    ctx.beginPath();
    ctx.moveTo(oX + 1, oY + 1);
    ctx.bezierCurveTo(l1 + 1, l2 + 1, l3 + 1, l4 + 1, l5 + 1, l6 + 1);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(oX + 1, oY + 1);
    ctx.lineTo(f1X + 1, f1Y + 1);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(oX + 1, oY + 1);
    ctx.lineTo(f2X + 1, f2Y + 1);
    ctx.stroke();

    ctx.strokeStyle = "rgba(0,0,0,0.9)";
    ctx.strokeStyle = "rgb(255, 215, 0)";
    ctx.beginPath();
    ctx.moveTo(oX, oY);
    ctx.bezierCurveTo(l1, l2, l3, l4, l5, l6);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(oX, oY);
    ctx.lineTo(f1X, f1Y);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(oX, oY);
    ctx.lineTo(f2X, f2Y);
    ctx.stroke();
};
