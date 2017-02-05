
function translateTags() {
    var userLang = getUserLang();
    console.log("language: " + userLang);

    $.getScript("~lang/" + userLang + ".js", function () {
        window.lang = window["lang_" + userLang];
        if (window.lang) {
            loadTranslations();
        } else {
            $.getScript("~lang/en.js", function () {
                window.lang = window.lang_en;
                loadTranslations();
            });
        }
    });
}

function loadTranslations() {
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
            + "<img src='~img/googleplay.png'"
            + " onclick=\"location.href = 'https://play.google.com/store/apps/details?id=" + window.package + "'\"/>"
            + "</div>"
            + "<div>"
            + "<img src='~img/appstore.png' class='disabled'/>"
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

function askPhone(callback, cancelCallback) {
    if (window.phoneAlreadyAsked) {
        error("e_phoneValidationNotWork");
    }

    $("#needPhone").remove();
    var needPhone = $("<div id='needPhone'><div id='needPhoneNote'>"
            + "<p>" + transl("needsPhone") + "</p>"
            + "<button id='phoneOk'>" + transl("Ok") + "</button><br/>"
            + "<small>" + transl("needsPhoneComment") + "</small><br/>"
            + "</div></div>");
    $("#body").append(needPhone);

    setTimeout(function () {
        $(document).on("click.needPhone", function (e) {
            var target = $(e.target);

            if ("phoneOk" == target.attr("id")) {
                console.log("click ok")
                window.phoneAlreadyAsked = true;

                needPhone.remove();
                $(document).off(".needPhone");

                //let phone popup remove - apps resume looks clear after
                setTimeout(function () {
                    Device.askPhone(callback);
                }, 1);

            } else if ("needPhoneNote" != target.attr("id") && !target.closest("#needPhoneNote").length) {
                needPhone.remove();
                $(document).off(".needPhone");
                if (cancelCallback) {
                    cancelCallback();
                }
            }
            //else nothing;
        });
    }, 1);
}
