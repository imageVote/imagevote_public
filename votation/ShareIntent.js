//index_commons class load

var ShareIntent = function () {
    this.log_div_query = "#errorLog";

    //remove once
    localStorage.setItem("not_installed", "");
    localStorage.setItem("app", "");
};

ShareIntent.prototype.checkShareEnvirontment = function (tag, optionsResult) {
    if (window.isAndroid) {
        console.log(tag);
        this.intent(tag, optionsResult);

    } else if (window.iPhone) {
        console.log("iPhone ShareIntent.checkShareEnvirontment");
        $("#linksLink").remove();
        var a = $("<div id='linksLink' class='clickable' style='margin: 7px 0 20px 10px;'>" + transl("downloadAppStore")
                + "<a href='" + settings.iosURL + "' id=links class='hide' style='margin-top:5px;'>"
                //+ "<img src='~commons/img/appstore.png' style='max-width:200px;'/>"
                + "<img src='~commons/img/appstore_comming.png' style='max-width:200px; opacity:0.7'/>"
                + "</a>"
                + "</div>");
        $(this.log_div_query).append(a);
        $(this.log_div_query).show();

        a.click(function () {
            $(document).off(".links");
            $("#links").toggleClass("hide");

            setTimeout(function () {
                $(document).one("click.links", function (e) {
                    if (!$(e.target).closest("#links").length && $(e.target).attr("id") != "links") {
                        $("#links").addClass("hide");
                    }
                });
            }, 1);
        });
    } else {
        console.log("!checkShareEnvirontment");
    }
};

ShareIntent.prototype.intent = function (tag, optionsResult) {
    var _this = this;
    if (this.notAskAppIntent) {
        console.log("notAskAppIntent");
        return;
    }

    console.log("intent init");
    tag.off(".intent")
            .on("click.intent", function () {
                console.log("click.intent");

                //needs paralelly prevent at least 1 empty message here!
                if ($(".option_text .text:empty").length) {
                    console.log("!option_text");
                    return;
                }

                var extra = "";
                if (optionsResult) {
                    for (var n = 0; n < optionsResult.length; n++) {
                        var votes = optionsResult[n][2];
                        var option = tag.closest(".option");
                        if (option.length) {
                            var option_number = option.attr("class").split("_")[1];
                            if (option_number == n) {
                                votes++;
                            }
                        }
                        extra += "_" + votes;
                    }
                }

                $("body").addClass("no_image");
                var url = _this.getUrl(extra);
                var timeout = 0;
                if (url) {
                    //check app choose interference:
                    localStorage.setItem("timeIntent", (new Date()).getTime());
                    window.open(url); //'http://share.' or 'intent://'
                    timeout = 2000; //second waiting share page load
                }

                setTimeout(function () {
                    //var myCookie = getCookie("installed");
                    var not_installed = localStorage.getItem("not_installed");
                    var app = localStorage.getItem("app");
                    console.log("not_installed: '" + not_installed + "', app: '" + app + "'");

                    if (not_installed && !app) {
                        var popularWebview = _this.isPopularWebview();
                        //if (appWebview) {
                        //location.href = _this.intentUrl("");
                        //}
                        _this.askAppInstall(popularWebview);

                    } else if (app) { //but user opened as web
                        //flash("App in Device")                
                        var i = 0;
                        var interval = setInterval(function () {
                            not_installed = localStorage.getItem("not_installed");
                            if (not_installed) {
                                // user not want open app (w8 interval)
                                clearTimeout(interval);
                                _this.disableIntent("not_installed interval");
                            }
                            //be sure user open app:
                            if (i > 20) { //10 seconds
                                clearTimeout(interval);
                            }
                            i++;
                        }, 500);

                    } else { //else user open app or cancel on choose -> redirect to intent app
                        _this.getUrl = function (extra) {
                            return _this.intentUrl(extra);
                        };
                    }

                }, timeout);
            });
};

ShareIntent.prototype.intentUrl = function (extra) {
    var url = "intent://" + location.host + "/share" + extra + location.pathname + "#Intent;"
            + "scheme=http;"
            + "package=" + settings.app_package + ";"
            + "end";
    console.log("intent: " + url);
    return url;
};

ShareIntent.prototype.getUrl = function (extra) {
    //prevent mutiple options share checks
    if (this.shareCheckCalled) {
        console.log("getUrl already called");
        return false;
    }
    this.shareCheckCalled = true;

    var shareUrl = "http://share." + location.host + "#" + extra + location.pathname;
    if ("localhost" == location.hostname) {
        var path = location.pathname.split("/");
        path.pop();
        shareUrl = location.origin + path.join("/") + "/~share#" + extra + location.pathname;
    }
    return shareUrl;
};

ShareIntent.prototype.askAppInstall = function (appWebview) {
    var _this = this;
    //not ask twice in same session
//    if (this.appIntallAsked) {
//        return;
//    }
//    this.appIntallAsked = true;

    var link = "";
    if (window.isAndroid) {
        link = settings.androidURL;
    }
    if (window.iPhone) {
        link = settings.iosURL;
    }

    if (link) {
        //not override asking name modalBox:
        if ($("#modal_box").length) {
            return;
        }
        var $modalBox = modalBox.ask(transl("installApp"), transl("installAppComments"), function () {
            window.open(link, "_blank");
            
        }, function () {
            //never disable last install question, only browser is neves user friendly!
//            if (!appWebview) {
//                _this.disableIntent("from modalBox");
//            }
        });

        //allow "have the app"
        var haveApp = $("<a href='" + _this.intentUrl("") + "'><button>" + transl("haveApp") + "</button></a>");
        $("#modal_ok").after(haveApp);
        $("#modal_ok").after("<br/>");
        haveApp.click(function () {
            $("#modal_box").remove();
        });

        //if hide by something don't ask!
        this.toBackground(function (bool) {
            console.log("toBackground " + bool);
            $modalBox.remove();
        });

    } else {
        if (!appWebview) {
            this.disableIntent("!link");
        }
    }
};

ShareIntent.prototype.disableIntent = function (why) {
    $("*").off(".intent");
    console.log("disableIntent(): " + why);
    $(".no_image").removeClass("no_image");
    this.notAskAppIntent = true;
};

//https://medium.com/@_alastair/sharing-in-the-world-of-the-in-app-web-view-c54bfa40cdd4
ShareIntent.prototype.isPopularWebview = function () {
    var app = null;
    if (/\/FBIOS/i.test(navigator.userAgent) === true) {
        app = 'facebook';
    }
    if (/Twitter for/i.test(navigator.userAgent) === true) {
        app = 'twitter';
    }
    if (/Pinterest\//.test(navigator.userAgent) === true) {
        app = 'pinterest';
    }
    if (/\/\/t.co\//i.test(document.referrer) === true && /Safari\//.test(navigator.userAgent) === false) {
        app = 'twitter';
    }
    if (/tumblr.com\//i.test(document.referrer) === true && /Safari\//.test(navigator.userAgent) === false) {
        app = 'tumblr';
    }

    console.log("app: " + app);
    return app;
};

//not seems to work :(
ShareIntent.prototype.toBackground = function (callback) {
    console.log("toBackground()");

//    //https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API
//    var hidden, visibilityChange;
//    hidden = "hidden";
//    visibilityChange = "visibilitychange";
//    if (typeof document.hidden !== "undefined") { // Opera 12.10 and Firefox 18 and later support 
//        hidden = "hidden";
//        visibilityChange = "visibilitychange";
//    } else if (typeof document.msHidden !== "undefined") {
//        hidden = "msHidden";
//        visibilityChange = "msvisibilitychange";
//    } else if (typeof document.webkitHidden !== "undefined") {
//        hidden = "webkitHidden";
//        visibilityChange = "webkitvisibilitychange";
//    }
//
//    // Warn if the browser doesn't support addEventListener or the Page Visibility API
//    if (typeof document.addEventListener === "undefined" || typeof document[hidden] === "undefined") {
//        console.log("WARNING: visibility handle not works in this browser!");
//        return;
//    }
//
//    // Handle page visibility change        
//    document.addEventListener(visibilityChange, function () {
//        console.log("visibilityChange: " + document[hidden]);
//        if (document[hidden]) {
//            callback();
//        }
//    }, false);
//
//    //or already hide
//    if (document[hidden]) {
//        callback();
//    }


    // BROWSER PREFIX (browserPrefix):
    var hiddenPropertyName = "";
    var browserPrefix = "";

    var browserPrefixes = ['moz', 'ms', 'o', 'webkit'];
    for (var i = 0; i < browserPrefixes.length; i++) {
        var hidden = (browserPrefixes[i] ? browserPrefixes[i] + "Hidden" : "hidden");
        if (hidden in document) {
            // vendor prefix
            hiddenPropertyName = hidden;
            browserPrefix = browserPrefixes[i];
            break;
        }
    }

    var visibilityEventName = (browserPrefix ? browserPrefix : '') + 'visibilitychange';

    document.addEventListener(visibilityEventName, function () {
        callback(document[hiddenPropertyName]);
    }, false);
    // extra event listeners for better behaviour
    document.addEventListener('focus', function () {
        callback(true);
    }, false);
    document.addEventListener('blur', function () {
        callback(false);
    }, false);
    window.addEventListener('focus', function () {
        callback(true);
    }, false);
    window.addEventListener('blur', function () {
        callback(false);
    }, false);

    //w8
    setTimeout(function () {
        console.log(hiddenPropertyName + ": " + document[hiddenPropertyName]);
        if (document[hiddenPropertyName]) {
            callback(true);
        }
    }, 1);
};
