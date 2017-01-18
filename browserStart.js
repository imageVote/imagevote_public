
// DEVICES REDIRECTION:
var ua = navigator.userAgent.toLowerCase();
isAndroid = ua.indexOf("android") > -1; //&& ua.indexOf("mobile");
iPhone = ua.indexOf("iPhone") > -1 || ua.indexOf("iPod") > -1;

//if (isAndroid) {
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
//            url = "https://play.google.com/store/apps/details?id=at.clicktovote";
//
//        } else {
//            url = intentUrl
//                    + "scheme=http;"
//                    + "package=at.clicktovote;"
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
//} else if (iPhone) {
//    console.log("TODO: iPhone");
//    //TODO: iPhone
//}

//http://stackoverflow.com/questions/6567881/how-can-i-detect-if-an-app-is-installed-on-an-android-device-from-within-a-web-p
//detect protocol works
function detectAndroidIntent(intentUrl, callback, time) {    
    var ifr = document.createElement('iframe');
    ifr.src = intentUrl;
    //if load: means intent protocol was not found
    ifr.onload = function() {
        clearTimeout(timeout);

        console.log("iframe onload - intent protocol seems not work -> redirect (my 2.3 is exception?)");
        callback(false); //intent error on load
        document.body.removeChild(ifr); // remove the iframe element        
    };
    ifr.style.display = 'none'; //in some cases css load slower
    document.body.appendChild(ifr);

    //remove
    if (!time) {
        time = 1000;  // 100ms. timeout failed - but protocol intent shouldn't have internet times problems
    }
    //timeout
    clearTimeout(timeout);
    var timeout = setTimeout(function() {
        document.body.removeChild(ifr); // remove the iframe element
        callback(true); //intent loads
    }, time);
}
