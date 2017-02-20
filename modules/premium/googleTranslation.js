
function queryTranslation(query, txt) {
    translate(txt, null, function (txt) {
        console.log("txt = " + txt + ", query = " + query);
        if (txt) {
            $(query).text(txt);
        }
    });
}

//google translate
function translate(text, lang, callback) {
    if (!text) {
        return;
    }

    lang = "en";
    if (userLanguage == lang) {
        callback(text);
        return;
    }

    var obj = {
        text: text,
        lang: lang,
        callback: callback
    };

    translationList.push(obj);
    if (translationList.length > 1) {
        return;
    }
    translationCall();
}

function translationCall() {
    var obj = translationList[0];
    console.log(JSON.stringify(translationList));
    var newScript = document.createElement('script');
    newScript.type = 'text/javascript';

    var extra = "";
    if (!obj.lang) {
        extra += "/detect";
    }

    // WARNING: be aware that YOUR-API-KEY inside html is viewable by all your users.
    // Restrict your key to designated domains or use a proxy to hide your key
    // to avoid misusage by other party.
    var script = 'https://www.googleapis.com/language/translate/v2' + extra
            + '?key=AIzaSyAahU9zv0h12rHkXRuPINHahQ-iuVNrwUc';
    if (obj.lang) {
        script += '&source=' + obj.lang;
    }
    script += '&target=' + userLanguage
            + '&callback=responseTranslation'
            + '&q=' + obj.text;
    newScript.src = script;

    // When we add this script to the head, the request is sent off.
    document.getElementsByTagName('head')[0].appendChild(newScript);
}

function responseTranslation(response) {
    console.log(response);
    var done = translationList.shift();

    if (response.error) {
        console.log(done.text);
        if (done.text) {
            done.callback(done.text);
        } else {
            done.callback("");
        }
        return;
    }

    done.callback(response);

    if (translationList.length) {
        translationCall();
    }
}
