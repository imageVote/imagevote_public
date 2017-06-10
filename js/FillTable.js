
function FillTable(divQuery, poll, conf, callback) {
    console.log(this);
    console.log("fill table " + divQuery);
    console.log(JSON.stringify(poll));
    this.$div = $(divQuery);
    this.callback = callback;
    var obj = this.obj = poll.obj;

    //usefull on next poll game
    this.$div.removeClass("show");

    //ADD HTML
    this.$div.html("");

    var options_container = $("<div class='options_container'>");    
    
    var question = $("<div class='question'>");
    options_container.append(question);
    
    var options = $("<div class='options'>");
    options_container.append(options);

    //$(divQuery).attr("class", 'votation').append(options_container);
    this.$div.append(options_container);

    //EXTRAS
    if (conf) {
        if (conf.removable) { //swipe list remove
            var parent = this.$div.parent();
            var container = $("<div>");

            container.append(this.$div);
            container.attr("id", this.$div.attr("id"));

            var forget = transl("forgetPoll");
            container.append("<div class='removeInfo'>" + forget + "</div>");
            container.append("<div class='loader'><img src='~commons/img/ajax-loader.gif'/></div>");

            this.$div.attr("id", "");
            this.$div.addClass("stored");
            parent.append(container);
        }
    }

    //
    if (!obj || $.isEmptyObject(obj)) {
        this.emptyPoll();
        return;
    }

    //FILL TABLE WITH RESULTS
    question.text(obj.question);
    //title.text("titleResult");
    
    var optionsResult = obj.options;

    for (var i = 0; i < optionsResult.length; i++) {
        var option = optionsResult[i];
        var n = option[0];
        var text = option[1];
        var votes = option[2];

        var answer = this.addCell(n, text, votes);
        options.append(answer);

//        if (window.queryTranslation) {
//            var query = this.$div.find(".option_" + n + " .option_text .text");
//            var decodeOption = decode_uri(text);
//            queryTranslation(query, decodeOption);
//        }

        this.trEvents(answer, n);
    }

    styles.cssColors(divQuery, obj.style);
    //translate.translateTags();

    //wait dom positioning
    var _this = this;
    setTimeout(function () {
        fontSize();
        console.log(_this);
        _this.addUserVotes();
        loaded();
    }, 1);
}

FillTable.prototype.addUserVotes = function (votes) {
    console.log("addUserVotes() " + votes);
    if ("undefined" == typeof votes || null === votes) {
        votes = this.userVotes();
    } else {
        this.userVotes(votes);
    }

    if ("undefined" !== typeof votes && null !== votes && "" !== votes) {
        var arr = voteArray(votes);
        console.log(arr)
        this.$div.find(".checked").removeClass("checked");
        for (var i = 0; i < arr.length; i++) {
            var votedOption = arr[i];
            console.log(".option_" + votedOption);
            var cell = this.$div.find(".option_" + votedOption);
            cell.addClass("checked");
        }

        var _this = this;
        clearTimeout(this.updateOptionsTimeout);
        this.updateOptionsTimeout = setTimeout(function () {
            _this.updateOptions();
        }, 300);
    }
};

FillTable.prototype.trEvents = function (option_div, option) {
    var _this = this;

    //make numbers arrays (not necessari now but secured)
    option = +option;

    //click table to prevent :hover bugs in device click:
    option_div.on("click.filltable", function () {
        if ($(this).hasClass("checked")) {
            console.log("already checked!");
            return;
        }
        console.log("click " + option);

        //remove user votes
        var obj = _this.obj;
        var unVote = [];
        if (!obj.style || !obj.style.multipleChoice) {
            var votes = _this.userVotes();
            unVote = voteArray(votes);
            console.log("arr = " + JSON.stringify(unVote));
            _this.unCheckOptions();
            for (var i = 0; i < unVote.length; i++) {
                _this.unSelectOption(unVote[i]);
            }
        }

        //add to userId votes
        _this.selectOption(option);
        _this.updateOptions(); //before callback return

        if (_this.callback) {
            setTimeout(function () {
                var event = _this.callback(option);
                if (false === event) {
                    var all_options = _this.$div.find(".option");
                    all_options.off(".filltable");
                    all_options.removeClass("clickable");
                }
            }, 300);
            return;
        }

        setTimeout(function () {
            loading(null, "trEvents");
        }, 250);

        //w8 finish animation
        setTimeout(function () {
            var poll = _this.poll;
            var share = new Share(poll, _this.$div.parent());

            console.log(poll.buttons);
            var adds = [option];
            if (!adds.equals(unVote)) {
                var andShare = poll.buttons.$sendButton.hasClass("saveAndShare");
                poll.buttons.save.do(function () {
                    //poll.buttons.share();                        
                    share.do();
                }, andShare, adds);

            } else {
                //poll.buttons.share();
                share.do();
            }
        }, 300);

    });
};

FillTable.prototype.selectOption = function (option) {
    console.log("selectOption " + option);
    var element = this.userVotes();
    console.log("userVotes() element: " + JSON.stringify(element));

    if (Object.prototype.toString.call(element) === '[object Array]') { //array
        element.push(option);
        element.sort();
    } else if (element || 0 === element) {
        element = [element, option];
        element.sort();
    } else {
        element = option;
    }

    this.addUserVotes(element);

    var cell = this.$div.find(".option_" + option);
    var votes = cell.find(".votes");
    //var value = parseInt(votes.text().replace(".", "") || 0) + 1;
    this.obj.options[option][2]++;
    var value = this.obj.options[option][2];

    var text_value = formatNumber(value);
    if (value < 0 || isNaN(value)) {
        text_value = "";
    }
    votes.text(text_value);

    this.$div.addClass("show");
    return element;
};

FillTable.prototype.unCheckOptions = function () {
    this.$div.find(".checked").removeClass("checked");
};

//unselect option table
FillTable.prototype.unSelectOption = function (string) {
    console.log("unSelectOption " + string);
    //parse int for indexOf recognition
    var option = +string;
    this.removeVote(option); //visual

    var option_div = this.$div.find(".option_" + option);
    option_div.removeClass("checked");

    var value = this.obj.options[option][2];
    value--;
    this.obj.options[option][2] = value;

    var text_value = formatNumber(value);
    if (value < 0 || isNaN(value)) {
        text_value = ""; //empty value on error!
    }
    option_div.find(".votes").text(text_value);
};

FillTable.prototype.updateOptions = function () {
    console.log(this.obj.options);
//    var options = this.$div.find(".option");
    var options = this.obj.options;
    for (var i = 0; i < options.length; i++) {
        this.updateOption(options[i]);
    }
    this.$div.addClass("show");
};

FillTable.prototype.updateOption = function (option) {
    var value = option[2];

    var perc = 0;
    var votes = this.countVotes();
    if (votes) {
        console.log("perc: " + value + " / " + votes);
        perc = Math.round(value / votes * 100);
        //prevent show perc. errors
        if (perc > 100 || perc < 0) {
            perc = "??";
        }

    } else {
        this.$div.removeClass("show");
    }

    this.updateOptionStyle(option, perc);
};

FillTable.prototype.updateOptionStyle = function (option, perc) {
    var option_div = this.$div.find(".option_" + option[0]);
    option_div.find(".percentage").text(perc);
    option_div.find(".background").css("height", perc + "%");
};

FillTable.prototype.removeVote = function (option) {
    var votes = this.userVotes();
    console.log("remove " + option + " from " + votes);

    //remove
    if ("object" == typeof votes && null != votes) { //array
        //loop to remove duplicate votes bug if needed
        for (var i = votes.length - 1; i >= 0; i--) {
            if (votes[i] == option) {
                votes.splice(i, 1);
            }
        }

        //convert
        if (votes.length == 1) {
            votes = votes[0];
        }

    } else if (votes === option || votes === "" + option) {
        votes = "";
    }

    this.addUserVotes(votes);
};

FillTable.prototype.countVotes = function () {
    var total = 0;
    var options = this.obj.options;
    for (var i = 0; i < options.length; i++) {
        total += +options[i][2];
    }
    return total;
};

FillTable.prototype.emptyPoll = function () {
    console.log("empty poll");

    var answer1 = this.addCell(0);
    answer1.find(".option_text .text").attr("contenteditable", "true");
    this.$div.find(".options").append(answer1);

    var answer2 = this.addCell(1);
    answer2.find(".option_text .text").attr("contenteditable", "true");
    this.$div.find(".options").append(answer2);

    this.$div.find(".option").click(function () {
        $(this).find(".text").focus();
    });

    //try to prevent scroll move on focus:
    this.$div.find(".option_text").on('focusin focus', function (e) {
        e.preventDefault();
    });

};

FillTable.prototype.addCell = function (i, text, votes) {
    console.log("addCell " + i + " " + text + " " + votes);
    if (!text) {
        text = "";
    }
    if (!votes) {
        votes = 0;
    }

    var text_votes = formatNumber(votes);
    if (votes < 0 || isNaN(votes)) {
        text_votes = "";
    }

    var answer = $("<div class='option option_" + i + " clickable'>"
            + "<table>"
            + "<tr style='height:100%'><td class='option_text'><div><div class='text'>" + decode_uri(text) + "</div></div></td></tr>"
            + "<tr><td class='results percentage_container'>"
            + "<span class='percentage'>0</span>%"
            + "</td></tr>"
            + "<tr><td class='results votes_container'>"
            + "<span data-lang='Votes'>" + transl("Votes") + "</span>: <span class='votes'>" + text_votes + "</span>"
            + "</td></tr>"
            + "</table>"
            + "<div class='background'></div>"
            + "</div>");
    return answer;
};

FillTable.prototype.userVotes = function (votes) {
    console.log("userVotes() " + votes);
    var user = this.obj.users[window.user.id];
    if (!user) {
        console.log("!user")
        this.obj.users[window.user.id] = getUserArray();
    }
    if ("undefined" != typeof votes && null !== votes) { //can be empty string!
        this.obj.users[window.user.id][1] = votes;
    }
    console.log(JSON.stringify(this.obj.users[window.user.id][1]));
    return this.obj.users[window.user.id][1];
};
