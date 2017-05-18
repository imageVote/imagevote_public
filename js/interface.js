
function obj_size(obj) {
    var size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key))
            size++;
    }
    return size;
}

function flash(text, persist, callback) {
    $(document).off(".search");
    text += ""; //text.length not work eith numbers

    if ($("#flash").length) {
        stopFlash();
    }

    var div = $("<flash id='flash'>" + text + "</flash>"); //flash = prevent global div hide
    $("body").append(div);
    setTimeout(function () {
        div.css({opacity: 1, top: "30%"});
    }, 1);

    if (persist) {
        return;
    }

    clearTimeout(window.flashTimeout);
    window.flashTimeout = setTimeout(function () {
        stopFlash(callback);
    }, 800 + text.length * 50);

    setTimeout(function () {
        $(document).one("mousedown.search touchstart.search", function (e) {
            e.stopPropagation();
            e.preventDefault();

            clearTimeout(window.flashTimeout);
            stopFlash(callback);
        });
        loaded();
    }, 1);
    console.log("flash: " + text);
}

function stopFlash(callback) {
    var flash = $("#flash");
    flash.css({opacity: 0, top: "35%"});
    setTimeout(function () {
        flash.remove();
        if (callback) {
            callback();
        }
    }, 175);
}

//if public poll, add options
function noticePublic() {
    $("#linksLink").remove();
    var a = $("<div id='linksLink' class='clickable'>" + transl("PublicOnlyFromApp") + "</u></div>");
    $("#errorLog").append(a);
    $("#errorLog").show();

    var appsLinks = "<div id=links class='hide'>"
            + "<div>"
            + "<img src='~commons/img/googleplay.png'"
            + " onclick=\"location.href = '" + settings.androidURL + "'\"/>"
            + "</div>"
            + "<div>"
            + "<img src='~commons/img/appstore.png' class='disabled'/>"
            + "</div>"
            + "</div>";
    $("#linksLink").append(appsLinks);

    a.click(function (e) {
        $(document).off(".links");
        $("#links").toggleClass("hide");

        setTimeout(function () {
            $(document).on("click.links", function (e) {
                if (!$(e.target).closest("#links").length && $(e.target).attr("id") != "links") {
                    $(document).off(".links");
                    $("#links").addClass("hide");
                }
            });
        }, 1);
    });
}

function noticeBrowser() {
    //not backend security - not rly important
    if (screenPoll.obj.style && screenPoll.obj.style.onlyDevice && !screenPoll._public) {
        disableVotation();
        notice(lang["onlyDevice"]);
    }
}

//
function askPhone(callback_device) {
    if (window.phoneAlreadyAsked) {
        error("e_phoneValidationNotWork");
    }
    modalBox.ask(transl("needsPhone"), transl("needsPhoneComment"), function () {
        window.phoneAlreadyAsked = true;
        setTimeout(function () {
            if (Device.askPhone) {
                Device.askPhone(callback_device);
            } else {
                flash(transl("deprecatedVersion"));
            }
        }, 1);
    });
}
