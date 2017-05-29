
var Share = function (poll, $imageDOM) {
    console.log("Share " + $imageDOM);
    this.poll = poll;
    this.$imageDOM = $imageDOM;

    this._ajaxKeyWaiting = 0;
};

Share.prototype.do = function (callback, forceShow) {
    var _this = this;

    var poll = this.poll;
    console.log(poll);
    loading(null, "Share");

    console.log("Share.do");
    if (!Device.share && !poll.key) {
        console.log("!Device.share && !poll.key");
        //if not seems respond
        if (this._ajaxKeyWaiting > 10) {
            this._ajaxKeyWaiting = 0;
            error("missingAjaxKey");
            return;
        }
        this._ajaxKeyWaiting++;

        setTimeout(function () {
            console.log("waiting ajax key..");
            _this.do(callback, forceShow);
        }, 700);
        return;
    }
    this._ajaxKeyWaiting = 0;

    console.log("country = " + poll.country);
    this.keyId = poll.key;

    this.$imageDOM.find("#image").remove();
    var image = $("<div class='image'>");
    this.$div = $("<div id='image'><hr/></div>");
    this.$div.append(image);
    if (this.$imageDOM) {
        this.$imageDOM.append(this.$div);
    }

    var type = "";
    if ($(poll.divQuery).hasClass("show") || forceShow) {
        type = "show";
    }

    var width = null;
    getCanvasImage(image, poll.obj, this.keyId, width, type, function (imgData) {
        _this.onCanvasImage(imgData, function(){
            loaded();
        });
    });
};

Share.prototype.onCanvasImage = function (imgData, callback) {
    console.log("onCanvasImage");
    loaded();
    if (!imgData) {
        error("!imgData on getCanvasImage");
        return;
    }
    if (Device.share) {
        this.$div.hide();
        var path = "";
        if (window.language) {
            path = language.shareUrl + "/";
        }
        votationEvents_deviceShare(imgData, this.keyId, path); //TODO: when not send default location?

    } else {
        $("#stored").addClass("hidden");
        this.$div.show();
        //votationEvents_saveImageLocally(this.keyId, imgData);
    }

    if (callback) {
        callback(true);
    }
};
