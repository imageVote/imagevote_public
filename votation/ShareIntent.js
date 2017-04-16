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
    tag.on("click.intent", function () {
        console.log("click.intent");
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
            window.open(url); //intent
            timeout = 2500; //second waiting share page load
        }        

        setTimeout(function () {
            //var myCookie = getCookie("installed");
            var not_installed = localStorage.getItem("not_installed");
            var app = localStorage.getItem("app");
            console.log("not_installed: '" + not_installed + "', app: '" + app + "'");

            if (not_installed && !app) {
                //flash("App not installed")
                _this.askAppInstall();

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

            } else { //else user open app or cancel on choose - redirect to intent app
                _this.getUrl = function (extra) {
                    var url = "intent://" + location.host + "/share" + extra + location.pathname + "#Intent;"
                            + "scheme=http;"
                            + "package=" + settings.app_package + ";"
                            + "end";
                    console.log("intent " + url);
                    return url;
                };
            }

        }, timeout);
    });
};

ShareIntent.prototype.getUrl = function (extra) {
    //prevent mutiple options share checks
    if (this.shareCheckCalled) {
        console.log("getUrl already called");
        return false;
    }
    this.shareCheckCalled = true;

    var url = "http://share." + location.host + "#" + extra + location.pathname;
    if ("localhost" == location.hostname) {
        var path = location.pathname.split("/");
        path.pop();
        url = location.origin + path.join("/") + "/~share#" + extra + location.pathname;
    }
    return url;
};

ShareIntent.prototype.askAppInstall = function () {
    var _this = this;

    var link = "";
    if (window.isAndroid) {
        link = settings.androidURL;
    }
    if (window.iPhone) {
        link = settings.iosURL;
    }

    if (link) {
        modalBox("Usa la app para compartir la encuesta!",
                "Descárgala completamente gratis. <br>No requiere de permisos especiales"
                , function () {
                    window.open(link, "_blank");
                }, function () {
            _this.disableIntent("from modalBox");
        });
    } else {
        this.disableIntent("!link");
    }
};

ShareIntent.prototype.disableIntent = function (why) {
    $("*").off(".intent");
    console.log("disableIntent(): " + why);
    $(".no_image").removeClass("no_image");
    this.notAskAppIntent = true;
};
