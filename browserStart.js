
// DEVICES REDIRECTION:
//this not works on "request desktop site" option!
var ua = navigator.userAgent.toLowerCase();
window.isAndroid = ua.indexOf("android") > -1; //&& ua.indexOf("mobile");
window.iPhone = ua.indexOf("iPhone") > -1 || ua.indexOf("iPod") > -1;

//if (window.isAndroid) {
//    console.log("isAndroid");
//    //WARN: THIS NOT WORK PROPERLY IF BROWSER APP ID NOT INITIALIZED
//
//    //var fallback_url = escape("javascript:alert('please, contact us if you see this message, and tell when it shows')");
//    //var fallback_url = "http://click-to-vote.at/prueba.html";
//
//    // WAY TO REDIRECT FROM TWITTER
//    var link = $("<a id='appLink'>");
//    $("body").append(link);
//
//    //not with location.host
//    var intentUrl = "intent://click-to-vote.at" + location.pathname + "/#Intent;";
//
//    detectAndroidIntent(intentUrl, function(intentLoads) {
//        var url;
//        if (!intentLoads) {
//            // NO REDIRECT, compatibilize twitter and normal
////        window.location.href = googlePlay;
//            window.unavailableIntent = true;
//
//            //when redirect to google play url, android asks if open in gogole play
//            url = "https://play.google.com/store/apps/details?id=" + window.package;
//
//        } else {
//            url = intentUrl
//                    + "scheme=http;"
//                    + "package=" + window.package + ";"
//                    //(empty or wrong code function) if twitter webview, this will redirect to app store but inside browser!
//                    //+ "S.browser_fallback_url=" + escape(fallback_url) + ";"
//                    + "end";
//
//            // NO REDIRECT, make compatibilize twitter and default mode
////        //redirect if intent! let people
////        if(!window.unavailableIntent){
////            //window.location.href = url;
////        };
//
//            //NOT ERMOVE LINK - BAD TWITTER USER EXPERIENCE on back
////        link.one("click", function () {
////            link.remove();
////        });
//        }
//        
//        link.attr("href", url);
//    });
//
//} else if (window.iPhone) {
//    console.log("TODO: iPhone");
//    //TODO: iPhone
//}

//http://stackoverflow.com/questions/6567881/how-can-i-detect-if-an-app-is-installed-on-an-android-device-from-within-a-web-p
//detect protocol works
AndroidIntent = function () {
    var _this = this;

    this.isAndroidIntent = null;
    this.ifr = document.createElement('iframe');
    document.body.appendChild(this.ifr);
    this.ifr.src = "";

    //if load: means intent protocol was not found //ONLY WILL WORK ON ANDROID DEVICE !!
    this.ifr.onload = function () {
        console.log("INTENT ONLOAD");
        _this.isAndroidIntent = false;

        console.log("iframe onload - intent protocol seems not work -> redirect (my 2.3 is exception?)");
//        document.body.removeChild(_this.ifr); // remove the iframe element        
    };

    //    var url = "intent://" + location.host + "/#Intent";
//    var url = "http://" + location.host + "/~share";
//    var url = "intent://" + location.host + "/~share/#Intent;"
//            + "scheme=http;"
//            + "package=" + window.package + ";"
//            + "end";
    var url = "http://would-you-rather_exists.info"
    //this.ifr.src = "";
    frames[0].window.location = url;
    console.log(this.ifr.src)

//    this.ifr.style.display = 'none'; //in some cases css load slower

//    $.post("intent://" + location.host + "/#Intent;end").done(function () {
//        console.log("INTENT LOAD !!!");
//    }).fail(function () {
//        console.log("INTENT FAIL !!!");
//    });
};

AndroidIntent.prototype.detect = function (callback) {
    console.log("androidIntent.detect event");

    var _this = this;
    this.callback = callback;

    //this calls multiple times anyway because timeout is needed
    if (null !== this.isAndroidIntent) {
        callback(this.isAndroidIntent);
        return;
    }

    // or timeout
    setTimeout(function () {
        if (null === _this.isAndroidIntent) {
            //document.body.removeChild(_this.ifr); // remove the iframe element
            _this.isAndroidIntent = true;
        }
        callback(_this.isAndroidIntent);
    }, 1500); //1 second
};

window.androidIntent = new AndroidIntent();
