
var ModalBox = function () {
    //
};

//generic modal!
ModalBox.prototype.modal = function ($html, cancelCallback) {
    var _this = this;
    $("#modal_box").remove();

    var divBackground = $("<div id='modal_box'>");
    var divContainer = $("<div id='modal_box_note'>");
    divContainer.append($html);
    divBackground.append(divContainer);
    $("body").append(divBackground);

    setTimeout(function () {
        $(document).on("click.modal", function (e) {
            var target = $(e.target);
            if ("modal_box_note" != target.attr("id") && !target.closest("#modal_box_note").length) {
                _this.remove(divBackground);
                $(document).off(".modal");
                if (cancelCallback) {
                    cancelCallback();
                }
            }
            //else nothing!;
        });

        //animation
        setTimeout(function () {
            divBackground.css("opacity", 1);
            divContainer.css({
                '-webkit-transform': "translate(-50%, -64%)",
                '-ms-transform': "translate(-50%, -64%)",
                'transform': "translate(-50%, -64%)"
            });
        }, 100);
    }, 1);

    return divBackground;
};

ModalBox.prototype.ask = function (txt, comment, callback, cancelCallback) {
    var _this = this;
    
    var button = $("<button id='modal_ok'>" + transl("Ok") + "</button>");
    var $html = $("<div>");
    $html.append("<p>" + txt + "</p>");
    $html.append(button);
    $html.append("<br/>" + "<small>" + comment + "</small><br/>");

    var html_modal = this.modal($html, function () {
        cancelCallback();
    });

    button.click(function () {
        _this.remove(html_modal);
        callback();
    });
    
    return $html;
};

ModalBox.prototype.input = function (txt, nameValue, callback) {
    var _this = this;
    
    var divContainer = $("<div>");
    divContainer.append("<b style='line-height:50px; font-size: 18px;'>" + txt + "</b>");

    var input = $("<input style='width:100%; text-align: center;' type='text' data-placeholder='myName' />");
    if (nameValue) {
        input.attr("value", nameValue);
    }
    divContainer.append(input);

//    var button = $("<button style='width:100%'>");
    var button = $("<button>");
    button.text(transl("Ok"));
    divContainer.append(button);

    var html_modal = this.modal(divContainer);
    html_modal.addClass("modal_input");
    input.focus();

    button.click(function () {
        if (callback) {
            callback(input.val());
        }
        _this.remove(html_modal);
    });
};

ModalBox.prototype.remove = function (html) {
    var box = html.find("> div");
    html.css("opacity", 0);
    box.css({
        '-webkit-transform': "translate(-50%, -50%)",
        '-ms-transform': "translate(-50%, -50%)",
        'transform': "translate(-50%, -50%)"
    });

    setTimeout(function () {
        html.remove();
    }, 150);
};
