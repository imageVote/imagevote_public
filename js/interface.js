
function translateTags() {
    var userLang = getUserLang();
    console.log("language: " + userLang);
    if (window.lang) {
        loadTranslations();
        return;
    }

    $.getScript("~lang/" + userLang + ".js", function () {
        window.lang = window["lang_" + userLang];
        if (window.lang) {
            loadTranslations();
        } else {
            $.getScript("~lang/en.js", function () {
                window.lang = window.lang_en;
                if (window.lang) {
                    loadTranslations();
                }
            });
        }
    });
}

function loadTranslations() {
    if(!window.lang){
        return;
    }
    $("[data-lang]").each(function () {
        var textKey = $(this).attr("data-lang");
        var translation = window.lang[textKey];
        if (translation) {
            $(this).html(translation);
        } else {
            $(this).html(textKey);
            console.log(textKey + " not have translation!");
        }
        //remove lang 4 prevent re-translate
        $(this).removeAttr("data-lang");
    });
    $("[data-placeholder]").each(function () {
        var textKey = $(this).attr("data-placeholder");
        var translation = window.lang[textKey];
        if (translation) {
            $(this).attr("placeholder", translation);
        } else {
            $(this).attr("placeholder", translation);
            console.log(textKey + " not have translation!");
        }
        //remove lang 4 prevent re-translate
        $(this).removeAttr("data-placeholder");
    });
}

function flash(text, persist) {
    $(document).off(".search");
    text += ""; //text.length not work eith numbers

    stopFlash();
    var div = $("<flash id='flash'>" + text + "</flash>"); //flash = prevent global div hide
    $("body").append(div);

    if (persist) {
        return;
    }

    clearTimeout(window.flashTimeout);
    window.flashTimeout = setTimeout(function () {
        stopFlash();
    }, 500 + text.length * 50);

    setTimeout(function () {
        $(document).one("click.search", function () {
            clearTimeout(window.flashTimeout);
            stopFlash();
        });
        $(".absoluteLoading").remove();
    }, 1);
    console.log("flash: " + text);
}

function stopFlash() {
    $("#flash").remove();
}

//if public poll, add options
function noticePublic() {
    $("#linksLink").remove();
    var a = $("<div id='linksLink' class='clickable'>" + lang["PublicOnlyFromApp"] + "</u></div>");
    $("#errorLog").append(a);
    $("#errorLog").show();

    var appsLinks = "<div id=links class='hide'>"
            + "<div>"
            + "<img src='~commons/img/googleplay.png'"
            + " onclick=\"location.href = 'https://play.google.com/store/apps/details?id=" + window.package + "'\"/>"
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
    if (screenPoll.obj.style && screenPoll.obj.style.onlyDevice && !screenPoll.public) {
        disableVotation();
        notice(lang["onlyDevice"]);
    }
}

function modalInput(txt, nameValue, callback) {
    var divBackground = $("<div id='modal_input'>");
    var divContainer = $("<div>");
    divContainer.append("<b style='line-height:50px; font-size: 18px;'>" + txt + "</b>");

    var input = $("<input style='width:100%; text-align: center;' type='text' data-placeholder='myName' />");
    if (nameValue) {
        input.attr("value", nameValue);
    }
    divContainer.append(input);

    var button = $("<button style='width:100%'>");
    button.text(transl("Ok"));
    button.click(function () {
        if (callback) {
            callback(input.val());
        }
        divBackground.remove();
    });
    divContainer.append(button);

    divBackground.append(divContainer);

    //animation
    setTimeout(function () {
        divBackground.css("opacity", 1);
        divContainer.css("transform", "translate(-50%, -64%)");
    }, 100);

    $("body").append(divBackground);
    input.focus();
}

function modalBox(txt, comment, callback, cancelCallback) {
    $("#modal_box").remove();
    var divBackground = $("<div id='modal_box'>");
    var divContainer = $("<div id='modal_box_note'>"
            + "<p>" + txt + "</p>"
            + "<button id='modal_ok'>" + transl("Ok") + "</button><br/>"
            + "<small>" + comment + "</small><br/>"
            + "</div>");
    divBackground.append(divContainer);
    $("body").append(divBackground);

    setTimeout(function () {
        $(document).on("click.modal", function (e) {
            var target = $(e.target);

            if ("modal_ok" == target.attr("id")) {
                divBackground.remove();
                $(document).off(".modal");

                //let phone popup remove - apps resume looks clear after
                if (callback) {
                    callback();
                }

            } else if ("modal_box_note" != target.attr("id") && !target.closest("#modal_box_note").length) {
                divBackground.remove();
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
            divContainer.css("transform", "translate(-50%, -64%)");
        }, 100);
    }, 1);
}

//
function askPhone(callback_device) {
    if (window.phoneAlreadyAsked) {
        error("e_phoneValidationNotWork");
    }
    modalBox(transl("needsPhone"), transl("needsPhoneComment"), function () {
        window.phoneAlreadyAsked = true;
        setTimeout(function () {
            Device.askPhone(callback_device);
        }, 1);
    });
}
