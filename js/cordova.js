//https://github.com/cranberrygame/cordova-plugin-ad-chartboost

var appId = "59979fc3f6cd457ba4048bac";
var appSignature = "2be7df706ea80cce7d9d165c463d73d070b70bde";
/*
 var appId;
 var appSignature;
 //android
 if (navigator.userAgent.match(/Android/i)) {
 appId = "REPLACE_THIS_WITH_YOUR_APP_ID";
 appSignature = "REPLACE_THIS_WITH_YOUR_APP_SIGNATURE";
 }
 //ios
 else if (navigator.userAgent.match(/iPhone/i) || navigator.userAgent.match(/iPad/i)) {
 appId = "REPLACE_THIS_WITH_YOUR_APP_ID";
 appSignature = "REPLACE_THIS_WITH_YOUR_APP_SIGNATURE";
 }
 */

document.addEventListener("deviceready", function () {
    //if no license key, 2% ad traffic share for dev support.
    //you can get paid license key: https://cranberrygame.github.io/request_cordova_ad_plugin_paid_license_key
    //window.chartboost.setLicenseKey("yourEmailId@yourEmaildDamin.com", "yourLicenseKey");

    window.chartboost.setUp(appId, appSignature);

    //
    window.chartboost.onInterstitialAdPreloaded = function (location) {
        console.log('onInterstitialAdPreloaded: ' + location);
    };
    window.chartboost.onInterstitialAdLoaded = function (location) {
        console.log('onInterstitialAdLoaded: ' + location);
    };
    window.chartboost.onInterstitialAdShown = function (location) {
        console.log('onInterstitialAdShown: ' + location);
    };
    window.chartboost.onInterstitialAdHidden = function (location) {
        console.log('onInterstitialAdHidden: ' + location);
    };
    //
    window.chartboost.onMoreAppsAdPreloaded = function (location) {
        console.log('onMoreAppsAdPreloaded: ' + location);
    };
    window.chartboost.onMoreAppsAdLoaded = function (location) {
        console.log('onMoreAppsAdLoaded: ' + location);
    };
    window.chartboost.onMoreAppsAdShown = function (location) {
        console.log('onMoreAppsAdShown: ' + location);
    };
    window.chartboost.onMoreAppsAdHidden = function (location) {
        console.log('onMoreAppsAdHidden: ' + location);
    };
    //
    window.chartboost.onRewardedVideoAdPreloaded = function (location) {
        console.log('onRewardedVideoAdPreloaded: ' + location);
    };
    window.chartboost.onRewardedVideoAdLoaded = function (location) {
        console.log('onRewardedVideoAdLoaded: ' + location);
    };
    window.chartboost.onRewardedVideoAdShown = function (location) {
        console.log('onRewardedVideoAdShown: ' + location);
    };
    window.chartboost.onRewardedVideoAdHidden = function (location) {
        console.log('onRewardedVideoAdHidden: ' + location);
    };
    window.chartboost.onRewardedVideoAdCompleted = function (location) {
        console.log('onRewardedVideoAdCompleted: ' + location);
    };
}, false);

/*
 location parameter:
 'Default' - Supports legacy applications that only have one "Default" location
 'Startup' - Initial startup of game.
 'Home Screen' - Home screen the player first sees.
 'Main Menu' - Menu that provides game options.
 'Game Screen' - Game screen where all the magic happens.
 'Achievements' - Screen with list of achievements in the game.
 'Quests' - Quest, missions or goals screen describing things for a player to do.
 'Pause' - Pause screen.
 'Level Start' - Start of the level.
 'Level Complete' - Completion of the level
 'Turn Complete' - Finishing a turn in a game.
 'IAP Store' - The store where the player pays real money for currency or items.
 'Item Store' - The store where a player buys virtual goods.
 'Game Over' - The game over screen after a player is finished playing.
 'Leaderboard' - List of leaders in the game.
 'Settings' - Screen where player can change settings such as sound.
 'Quit' - Screen displayed right before the player exits a game.		
 */

//static interstitial, video interstial
//window.chartboost.preloadInterstitialAd('Default');//option, download ad previously for fast show
//window.chartboost.showInterstitialAd('Default');
//
//window.chartboost.preloadMoreAppsAd('Default');//option, download ad previously for fast show
//window.chartboost.showMoreAppsAd('Default');
//
//window.chartboost.preloadRewardedVideoAd('Default');//option, download ad previously for fast show
//window.chartboost.showRewardedVideoAd('Default');
//
//alert(window.chartboost.loadedInterstitialAd());//boolean: true or false
//alert(window.chartboost.loadedMoreAppsAd());//boolean: true or false
//alert(window.chartboost.loadedRewardedVideoAd());//boolean: true or false
//
//alert(window.chartboost.isShowingInterstitialAd());//boolean: true or false
//alert(window.chartboost.isShowingMoreAppsAd());//boolean: true or false
//alert(window.chartboost.isShowingRewardedVideoAd());//boolean: true or false
