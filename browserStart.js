//
//// DEVICES REDIRECTION:
////this not works on "request desktop site" option!
//var ua = navigator.userAgent.toLowerCase();
//window.isAndroid = ua.indexOf("android") > -1; //&& ua.indexOf("mobile");
//window.iPhone = ua.indexOf("iPhone") > -1 || ua.indexOf("iPod") > -1;
//
////http://stackoverflow.com/questions/6567881/how-can-i-detect-if-an-app-is-installed-on-an-android-device-from-within-a-web-p
////detect protocol works
//AndroidIntent = function () {
//    var _this = this;
//
//    this.isAndroidIntent = null;
//    this.ifr = document.createElement('iframe');
//    document.body.appendChild(this.ifr);
////    this.ifr.src = "";
//
//    //if load: means intent protocol was not found //ONLY WILL WORK ON ANDROID DEVICE !!
//    this.ifr.onload = function () {
//        console.log("INTENT ONLOAD");
////        _this.isAndroidIntent = false;
//
//        console.log("iframe onload - intent protocol seems not work -> redirect (my 2.3 is exception?)");
////        document.body.removeChild(_this.ifr); // remove the iframe element        
//    };
//
//    //    var url = "intent://" + location.host + "/#Intent";
////    var url = "http://" + location.host + "/~share";
//    var url = "intent://" + location.host + "/~share/#Intent;"
//            + "scheme=http;"
//            + "package=" + settings.app_package + ";"
//            + "end";
////    var url = "http://would-you-rather-exists.info"
//    var url = "http://keys.wouldyourather.co";
//
//    this.ifr.src = url;
////    this.ifr.src = "about:blank";
////    frames[0].window.location = url;
//    console.log(this.ifr.src)
//
//    this.ifr.style.display = 'none'; //in some cases css load slower
//
////    $.post("intent://" + location.host + "/#Intent;end").done(function () {
////        console.log("INTENT LOAD !!!");
////    }).fail(function () {
////        console.log("INTENT FAIL !!!");
////    });
//};
//
//AndroidIntent.prototype.detect = function (callback) {
//    console.log("androidIntent.detect event");
//
//    var _this = this;
//    this.callback = callback;
//
//    //this calls multiple times anyway because timeout is needed
//    if (null !== this.isAndroidIntent) {
//        callback(this.isAndroidIntent);
//        return;
//    }
//
//    // or timeout
//    setTimeout(function () {
//        if (null === _this.isAndroidIntent) {
//            //document.body.removeChild(_this.ifr); // remove the iframe element
//            _this.isAndroidIntent = true;
//        }
//        callback(_this.isAndroidIntent);
//    }, 1500); //1 second
//};
//
//window.androidIntent = new AndroidIntent();
