
function translateTags(refresh) {
    if (window.lang && !refresh) {
        loadTranslations();
        return;
    }

    var loaded = 0;
    for (var i = 0; i < window.languagePaths.length; i++) {
        var path = window.languagePaths[i];
        loadLanguage(path, function () {
            loaded++;
            if (window.languagePaths.length == loaded) {
                loadTranslations(refresh);
            }
        });
    }
//    loadLanguage("~lang", function () {
//        loadTranslations(refresh);
//    });
}

window.languagePaths = {'~lang': 1};
function loadLanguage(path, callback) {
    if (!window.lang) {
        window.lang = {};
    }

    window.languagePaths[path] = 1;

    var userLang = getUserLang();
    console.log("userLang: " + userLang + " - " + path);

//    $.getScript(path + "/" + userLang + ".js", function () {
//        if (callback) {
//            callback();
//        }
//
//    }).fail(function () {
//        console.log(path + " lang failed!");
//        $.getScript(path + "/en.js", function () {
//            if (callback) {
//                callback();
//            }
//        });
//    });

    //http://papaparse.com/
    var first = true;
    var pos = 1;
    requirejs(["text!" + path + "/lang.csv"], function (data) {
        if(!data){
            console.log("NOT DATA IN " + path + "/lang.csv");
            return;
        }
        //console.log(data)
        Papa.parse(data, {
            step: function (results) {
                if (first) {
                    for (var i = 1; i < results.data[0].length; i++) {
                        if (userLang.toLowerCase() == results.data[0][i].toLowerCase()) {
                            pos = i;
                            break;
                        }
                    }
                    first = false;
                    return;
                }

                var key = results.data[0][0];
                if (key && key[0] !== "/") {
                    var result = results.data[0][pos];
                    //english[1] if not found language:
                    if (!result) {
                        result = results.data[0][1];
                    }
                    lang[key] = result;
                }
            },
            complete: function () {
                if (callback) {
                    callback();
                }
            }
        });
    });
}

function loadTranslations(refresh) {
    if (!window.lang) {
        return;
    }
    $("[data-lang]").each(function () {
        var textKey = $(this).attr("data-lang");

        //prevent re-translate
        if ($(this).text() && !refresh && $(this).text() != textKey) {
            //console.log($(this).text() + " != " + textKey)
            return true; //continue
        }


        var translation = window.lang[textKey];
        if (translation) {
            $(this).html(translation);
        } else {
            $(this).html(textKey);
            console.log(textKey + " not have translation!");
        }
        //remove lang 4 prevent re-translate
        //$(this).removeAttr("data-lang");
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

function flash(text, persist, callback) {
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
        stopFlash(callback);
    }, 500 + text.length * 50);

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
    if (callback) {
        callback();
    }
    $("#flash").remove();
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
