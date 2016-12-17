
function wrapText(context, text, x, y, maxWidth, lineHeight, info_only) {
    var lines = 1;
    var words = text.split(' ');
    var line = '';

    for (var n = 0; n < words.length; n++) {
        var testLine = line + words[n] + ' ';
        var metrics = context.measureText(testLine);
        var testWidth = metrics.width;
        if (testWidth > maxWidth && n > 0) {
            context.fillText(line, x, y);
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

    return lines;
}
