
var Config = function (debug) {
    var _this = this;
    if (debug) {
        this.debug();
    }

    //SAVE GLOBAL
    var global = "config";
    window[global] = this;

    translate.loadLanguage("~commons/modules/config/", null, function () {
        //REQUEST
        var file = "config.json";
        if (Device.simpleRequest) {
            Device.simpleRequest(file, null, global + ".callback");
        } else {
            //$.post returns error:412 in ios with '.json' !!
            $.getJSON("core/" + file, function (data) {
                _this.callback(data);
            });
        }
    });
};

Config.prototype.callback = function (json) {
    var config;
    if ("object" == typeof json) {
        config = json;
    } else {
        try {
            config = JSON.parse(json);
        } catch (e) {
            console.log("error parsing config: " + json);
            return;
        }
    }

    this.appVersion(config);
};

Config.prototype.appVersion = function (config) {
    if (!Device.version || !config.last_working_version_android) {
        return;
    }

    if (window.isAndroid) {
        var lastWorkingVersion = config.last_working_version_android;
        var currentVersion = Device.version();

        if (currentVersion && lastWorkingVersion > currentVersion) {
            modalBox.ask(transl("updateApp"), transl("updateApp_comment"), function () {
                window.open("http://play.google.com/store/apps/details?id=" + settings.app_package);
            }, function () {
                //on cancel
            });
        }
    }
};

Config.prototype.debug = function () {
    Device = {};
    Device.version = function () {
        return 0;
    };
};
