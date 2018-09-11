const remote = require("electron").remote;
const Store = require("electron-store");
const path = require('path');

const selectUtils = require("./selectUtils.js")
const sectionUtils = require("./sectionUtils.js")

/* Global settings getter and setter */
var getSettings = remote.getGlobal('getSettings');
var setSettings = remote.getGlobal('setSettings');

// Input "0" =  "start" view
// Input "1" =  "preview" view
// Input "2" =  "edit A" view
// Input "3" =  "edit B" view
// Input "4" =  "edit C" view
// Input "5" =  "login" view
// Input "6" =  "register" view
// Input "7" =  "settings" view
// Input "8" =  "confirmation(disabled)" view
// Input "12" = "information" view
// Input "13" = "create project" view
// Input "14" = "forgot password" view

// Input "9" = enable sidepanels (under toppanel) and toppanel (under navbar)
// Input "10" = disable sidepanels (under toppanel) and toppanel (under navbar)
// Input "11" = toggle footer NOT USED!!!!!!
function toggleViewMode(mode) {
    logger.debug("toggleViewMode: " + mode);
    if (mode === 0) {
        setFooterBtnValue("start");
        setFooterBtnMode("start");

        $("#start-div").addClass("is-shown");
        $("#preview-div").removeClass("is-shown");
        $("#edita-div").removeClass("is-shown");
        $("#editb-div").removeClass("is-shown");
        $("#editc-div").removeClass("is-shown");
        $("#logreg-div").removeClass("is-shown");
        $("#settings-div").removeClass("is-shown");
        $("#information-div").removeClass("is-shown");
        $("#create-proj-div").removeClass("is-shown");

        $("#proj-open-error").text("");
    }
    else if (mode === 1) {
        setFooterBtnValue("preview");
        setFooterBtnMode("preview");

        $("#addfilebutton").removeClass("element-disabled");
        $("#exportprojbutton").removeClass("element-disabled");

        $("#closeprojbutton").removeClass("element-disabled");
        $("#projinfobutton").removeClass("element-disabled");
        $("#loginbutton").removeClass("element-disabled");
        $("#settingsbutton").removeClass("element-disabled");
        $("#projstartbutton").removeClass("element-disabled");

        if (window.currentEvent === undefined) {
            //$("#proj-files-ul").addClass("element-disabled");
            $("#file-chosen-kw-ul").addClass("element-disabled");
        }
        else {
            $("#proj-files-ul").removeClass("element-disabled");
            $("#file-chosen-kw-ul").removeClass("element-disabled");
        }

        $("#start-div").removeClass("is-shown");
        $("#preview-div").addClass("is-shown");
        $("#edita-div").removeClass("is-shown");
        $("#editb-div").removeClass("is-shown");
        $("#editc-div").removeClass("is-shown");
        $("#logreg-div").removeClass("is-shown");
        $("#settings-div").removeClass("is-shown");
        $("#information-div").removeClass("is-shown");
        $("#create-proj-div").removeClass("is-shown");

        $('#a-censored-words').removeClass('no-display');
        $('#b-censored-words').removeClass('no-display');
        $('#c-censored-words').removeClass('no-display');
    }
    else if (mode === 2) {
        setFooterBtnValue("editA");
        setFooterBtnMode("editA");

        $("#addfilebutton").addClass("element-disabled");
        $("#exportprojbutton").addClass("element-disabled");

        $("#closeprojbutton").addClass("element-disabled");
        $("#projinfobutton").addClass("element-disabled");
        $("#loginbutton").addClass("element-disabled");
        $("#settingsbutton").addClass("element-disabled");
        $("#projstartbutton").addClass("element-disabled");

        $("#proj-files-ul").addClass("element-disabled");
        //$("#file-chosen-kw-ul").addClass("element-disabled");

        $("#start-div").removeClass("is-shown");
        $("#preview-div").removeClass("is-shown");
        $("#edita-div").addClass("is-shown");
        $("#editb-div").removeClass("is-shown");
        $("#editc-div").removeClass("is-shown");
        $("#logreg-div").removeClass("is-shown");
        $("#settings-div").removeClass("is-shown");
        $("#information-div").removeClass("is-shown");
        $("#create-proj-div").removeClass("is-shown");

        $('#a-censored-words').removeClass('no-display');
        $('#b-censored-words').addClass('no-display');
        $('#c-censored-words').addClass('no-display');
    }
    else if (mode === 3) {
        setFooterBtnValue("editB");
        setFooterBtnMode("editB");

        $("#addfilebutton").addClass("element-disabled");
        $("#exportprojbutton").addClass("element-disabled");

        $("#closeprojbutton").addClass("element-disabled");
        $("#projinfobutton").addClass("element-disabled");
        $("#loginbutton").addClass("element-disabled");
        $("#settingsbutton").addClass("element-disabled");
        $("#projstartbutton").addClass("element-disabled");

        $("#proj-files-ul").addClass("element-disabled");
        //$("#file-chosen-kw-ul").addClass("element-disabled");

        $("#start-div").removeClass("is-shown");
        $("#preview-div").removeClass("is-shown");
        $("#edita-div").removeClass("is-shown");
        $("#editb-div").addClass("is-shown");
        $("#editc-div").removeClass("is-shown");
        $("#logreg-div").removeClass("is-shown");
        $("#settings-div").removeClass("is-shown");
        $("#information-div").removeClass("is-shown");
        $("#create-proj-div").removeClass("is-shown");

        $('#a-censored-words').addClass('no-display');
        $('#b-censored-words').removeClass('no-display');
        $('#c-censored-words').addClass('no-display');
    }
    else if (mode === 4) {
        setFooterBtnValue("editC");
        setFooterBtnMode("editC");

        $("#addfilebutton").addClass("element-disabled");
        $("#exportprojbutton").addClass("element-disabled");

        $("#closeprojbutton").addClass("element-disabled");
        $("#projinfobutton").addClass("element-disabled");
        $("#loginbutton").addClass("element-disabled");
        $("#settingsbutton").addClass("element-disabled");
        $("#projstartbutton").addClass("element-disabled");

        $("#proj-files-ul").addClass("element-disabled");
        //$("#file-chosen-kw-ul").addClass("element-disabled");

        $("#start-div").removeClass("is-shown");
        $("#preview-div").removeClass("is-shown");
        $("#edita-div").removeClass("is-shown");
        $("#editb-div").removeClass("is-shown");
        $("#editc-div").addClass("is-shown");
        $("#logreg-div").removeClass("is-shown");
        $("#settings-div").removeClass("is-shown");
        $("#information-div").removeClass("is-shown");
        $("#create-proj-div").removeClass("is-shown");

        $('#a-censored-words').addClass('no-display');
        $('#b-censored-words').addClass('no-display');
        $('#c-censored-words').removeClass('no-display');
    }
    else if (mode === 5) {
        setFooterBtnValue("login");
        setFooterBtnMode("login");

        $("#addfilebutton").addClass("element-disabled");
        $("#exportprojbutton").addClass("element-disabled");

        $("#start-div").removeClass("is-shown");
        $("#preview-div").removeClass("is-shown");
        $("#edita-div").removeClass("is-shown");
        $("#editb-div").removeClass("is-shown");
        $("#editc-div").removeClass("is-shown");
        $("#logreg-div").addClass("is-shown");
        $("#settings-div").removeClass("is-shown");
        $("#information-div").removeClass("is-shown");
        $("#create-proj-div").removeClass("is-shown");

        $("#loginchoices").removeClass("no-display");
        $("#registerchoices").addClass("no-display");

        $("#login-username").val("");
        $("#login-pass").val("");
        $("#login-register-title").text("Login");

        $("#forgot_password_choices").addClass("no-display");
    }
    else if (mode === 6) {
        setFooterBtnValue("register");
        setFooterBtnMode("register");

        $("#addfilebutton").addClass("element-disabled");
        $("#exportprojbutton").addClass("element-disabled");

        $("#start-div").removeClass("is-shown");
        $("#preview-div").removeClass("is-shown");
        $("#edita-div").removeClass("is-shown");
        $("#editb-div").removeClass("is-shown");
        $("#editc-div").removeClass("is-shown");
        $("#logreg-div").addClass("is-shown");
        $("#settings-div").removeClass("is-shown");
        $("#information-div").removeClass("is-shown");
        $("#create-proj-div").removeClass("is-shown");

        $("#loginchoices").addClass("no-display");
        $("#registerchoices").removeClass("no-display");

        $("#register-username").val("");
        $("#register-email").val("");
        $("#register-realname").val("");
        $("#register-pass").val("");
        $("#register-retype-pass").val("");
        $("#login-register-title").text("Register");

        $("#forgot_password_choices").addClass("no-display");
    }
    else if (mode === 7) {
        setFooterBtnValue("settings");
        setFooterBtnMode("settings");

        $("#addfilebutton").addClass("element-disabled");
        $("#exportprojbutton").addClass("element-disabled");

        $("#start-div").removeClass("is-shown");
        $("#preview-div").removeClass("is-shown");
        $("#edita-div").removeClass("is-shown");
        $("#editb-div").removeClass("is-shown");
        $("#editc-div").removeClass("is-shown");
        $("#logreg-div").removeClass("is-shown");
        $("#settings-div").addClass("is-shown");
        $("#information-div").removeClass("is-shown");
        $("#create-proj-div").removeClass("is-shown");
    }
    else if (mode === 8) { //CURRENTLY NOT USED!
        $(".w3-button").toggleClass("element-disabled");
        $("ul").toggleClass("element-disabled");
        $(".select2").toggleClass("element-disabled");
        //$("#subB9").toggleClass("element-disabled");// just because, well, you'd be stuck :'D
    }
    else if (mode === 9) {
        $("#leftsection").removeClass("no-display");
        $("#rightsection").removeClass("no-display");
        $("#middleheader").removeClass("no-display");
    }
    else if (mode === 10) {
        $("#leftsection").addClass("no-display");
        $("#rightsection").addClass("no-display");
        $("#middleheader").addClass("no-display");
    }
    else if (mode === 11) {
        //$("#window-footer").toggleClass("no-display");
    }
    else if (mode === 12) {
        setFooterBtnValue("information");
        setFooterBtnMode("information");

        $("#addfilebutton").addClass("element-disabled");
        $("#exportprojbutton").addClass("element-disabled");

        $("#start-div").removeClass("is-shown");
        $("#preview-div").removeClass("is-shown");
        $("#edita-div").removeClass("is-shown");
        $("#editb-div").removeClass("is-shown");
        $("#editc-div").removeClass("is-shown");
        $("#logreg-div").removeClass("is-shown");
        $("#settings-div").removeClass("is-shown");
        $("#information-div").addClass("is-shown");
        $("#create-proj-div").removeClass("is-shown");
    }
    else if (mode === 13) {
        setFooterBtnValue("create-proj");
        setFooterBtnMode("create-proj");

        $("#start-div").removeClass("is-shown");
        $("#preview-div").removeClass("is-shown");
        $("#edita-div").removeClass("is-shown");
        $("#editb-div").removeClass("is-shown");
        $("#editc-div").removeClass("is-shown");
        $("#logreg-div").removeClass("is-shown");
        $("#settings-div").removeClass("is-shown");
        $("#information-div").removeClass("is-shown");
        $("#create-proj-div").addClass("is-shown");

        $("#new-proj-create-input").val("");
        $("#create-proj-error").val("");
    }
    else if (mode === 14) {
        //forgot password
        setFooterBtnValue("forgotPW");
        setFooterBtnMode("forgotPW");

        $("#addfilebutton").addClass("element-disabled");
        $("#exportprojbutton").addClass("element-disabled");

        $("#start-div").removeClass("is-shown");
        $("#preview-div").removeClass("is-shown");
        $("#edita-div").removeClass("is-shown");
        $("#editb-div").removeClass("is-shown");
        $("#editc-div").removeClass("is-shown");
        $("#logreg-div").addClass("is-shown");
        $("#settings-div").removeClass("is-shown");
        $("#information-div").removeClass("is-shown");
        $("#create-proj-div").removeClass("is-shown");

        $("#loginchoices").addClass("no-display");
        $("#registerchoices").addClass("no-display");

        $("#forgot_password_choices").removeClass("no-display");
        $("#forgot-email").val("");
        $("#login-register-title").text("Forgot Password?");
    }
    else {
        // If you end up here, blame the incompetent programmer
        logger.error("Error! Invalid parameter to toggleViewMode-function");
    }
}

/* Set value of footer (bottom) buttons */
function setFooterBtnValue(value) {
    logger.debug("setFooterBtnValue");
    logger.debug("Value: " + value);
    $("#footer-nav-btn1").val(value);
    $("#footer-nav-btn2").val(value);
    $("#footer-nav-btn3").val(value);
    $("#footer-nav-btn4").val(value);
    $("#footer-nav-btn5").val(value);
    $("#footer-nav-btn6").val(value);
}

/* Set visibility of various UI buttons (mainly footer) */
function setFooterBtnMode(view) {
    logger.debug("setFooterBtnMode");
    logger.debug("View: " + view);
    if (view === "preview") {
        $("#footer-nav-btn1").removeClass("no-display");
        $("#footer-nav-btn2").addClass("no-display");
        $("#footer-nav-btn3").addClass("no-display");
        $("#footer-nav-btn4").addClass("no-display");
        $("#footer-nav-btn5").removeClass("no-display");
        $("#footer-nav-btn6").removeClass("no-display");

        $("#footer-nav-btn1").text("Previous file");
        $("#footer-nav-btn6").text("Next file");

        $('#proj-files-ul li.w3-yellow').each(function (i) {
            if ($(this).attr("data-done") === "true") {
                $("#footer-nav-btn5").text("Mark as Not Done");
            }
            else {
                $("#footer-nav-btn5").text("Mark as Done");
            }
        });

        if (window.currentEvent === undefined) {
            $("#footer-nav-btn1").addClass("no-display");
            $("#footer-nav-btn5").addClass("no-display");
            $("#footer-nav-btn6").addClass("no-display");
        }
    }
    else if (view === "login") {
        $("#footer-nav-btn1").addClass("no-display");
        $("#footer-nav-btn2").addClass("no-display");
        $("#footer-nav-btn3").removeClass("no-display");
        $("#footer-nav-btn4").addClass("no-display");
        $("#footer-nav-btn5").removeClass("no-display");
        $("#footer-nav-btn6").removeClass("no-display");

        $("#footer-nav-btn3").text("Login");
        $("#footer-nav-btn5").text("Register");
        $("#footer-nav-btn6").text("Forgot Password?");
    }
    else if (view === "register") {
        $("#footer-nav-btn1").addClass("no-display");
        $("#footer-nav-btn2").addClass("no-display");
        $("#footer-nav-btn3").removeClass("no-display");
        $("#footer-nav-btn4").removeClass("no-display");
        $("#footer-nav-btn5").addClass("no-display");
        $("#footer-nav-btn6").addClass("no-display");

        $("#footer-nav-btn3").text("Register");
        $("#footer-nav-btn4").text("Cancel");
    }
    else if (view === "editA") {
        $("#footer-nav-btn1").addClass("no-display");
        $("#footer-nav-btn2").addClass("no-display");
        $("#footer-nav-btn3").removeClass("no-display");
        $("#footer-nav-btn4").removeClass("no-display");
        $("#footer-nav-btn5").addClass("no-display");
        $("#footer-nav-btn6").addClass("no-display");

        $("#footer-nav-btn3").text("Save");
        $("#footer-nav-btn4").text("Cancel");
    }
    else if (view === "editB") {
        $("#footer-nav-btn1").addClass("no-display");
        $("#footer-nav-btn2").addClass("no-display");
        $("#footer-nav-btn3").removeClass("no-display");
        $("#footer-nav-btn4").removeClass("no-display");
        $("#footer-nav-btn5").addClass("no-display");
        $("#footer-nav-btn6").addClass("no-display");

        $("#footer-nav-btn3").text("Save");
        $("#footer-nav-btn4").text("Cancel");
    }
    else if (view === "editC") {
        $("#footer-nav-btn1").addClass("no-display");
        $("#footer-nav-btn2").addClass("no-display");
        $("#footer-nav-btn3").removeClass("no-display");
        $("#footer-nav-btn4").removeClass("no-display");
        $("#footer-nav-btn5").addClass("no-display");
        $("#footer-nav-btn6").addClass("no-display");

        $("#footer-nav-btn3").text("Save");
        $("#footer-nav-btn4").text("Cancel");
    }
    else if (view === "create-proj") {
        $("#footer-nav-btn1").addClass("no-display");
        $("#footer-nav-btn2").addClass("no-display");
        $("#footer-nav-btn3").removeClass("no-display");
        $("#footer-nav-btn4").addClass("no-display");
        $("#footer-nav-btn5").addClass("no-display");
        $("#footer-nav-btn6").addClass("no-display");

        $("#footer-nav-btn3").text("Create project");
    }
    else if (view === "start") {
        $("#footer-nav-btn1").addClass("no-display");
        $("#footer-nav-btn2").addClass("no-display");
        $("#footer-nav-btn3").addClass("no-display");
        $("#footer-nav-btn4").addClass("no-display");
        $("#footer-nav-btn5").addClass("no-display");
        $("#footer-nav-btn6").addClass("no-display");
    }
    else if (view === "information") {
        $("#footer-nav-btn1").addClass("no-display");
        $("#footer-nav-btn2").addClass("no-display");
        $("#footer-nav-btn3").addClass("no-display");
        $("#footer-nav-btn4").addClass("no-display");
        $("#footer-nav-btn5").addClass("no-display");
        $("#footer-nav-btn6").addClass("no-display");
    }
    else if (view === "settings") {
        $("#footer-nav-btn1").addClass("no-display");
        $("#footer-nav-btn2").addClass("no-display");
        $("#footer-nav-btn3").removeClass("no-display");
        $("#footer-nav-btn4").removeClass("no-display");
        $("#footer-nav-btn5").addClass("no-display");
        $("#footer-nav-btn6").addClass("no-display");

        $("#footer-nav-btn3").text("Save");
        $("#footer-nav-btn4").text("Cancel");
    }
    else if (view === "project-open") {
        $("#addfilebutton").removeClass("no-display");
        $("#projinfobutton").removeClass("no-display");
        $("#projstartbutton").removeClass("no-display");
        $("#exportprojbutton").removeClass("no-display");
        $("#closeprojbutton").removeClass("no-display");
        $("#back-to-start-button").addClass("no-display");
    }
    else if (view === "project-closed") {
        $("#addfilebutton").addClass("no-display");
        $("#projinfobutton").addClass("no-display");
        $("#projstartbutton").addClass("no-display");
        $("#exportprojbutton").addClass("no-display");
        $("#closeprojbutton").addClass("no-display");
        $("#back-to-start-button").removeClass("no-display");
    }
    else if (view === "forgotPW") {
        $("#footer-nav-btn1").addClass("no-display");
        $("#footer-nav-btn2").addClass("no-display");
        $("#footer-nav-btn3").removeClass("no-display");
        $("#footer-nav-btn4").removeClass("no-display");
        $("#footer-nav-btn5").addClass("no-display");
        $("#footer-nav-btn6").addClass("no-display");

        $("#footer-nav-btn3").text("Request reset");
        $("#footer-nav-btn4").text("Cancel");
    }
    else {
        logger.error("Invalid input in setFooterBtnMode!");
    }
}

function updateSettingsUI() { // FOR SOME REASON NOT PROPERLY USED!!!!!!
    // NEED TO CALL "GETSETTINGS" FIRST IN ORDER TO CORRECTLY INITIALIZE
    //
    //NEEDSTOBECHANGED
    var settingsJSON = getSettings();
    var store1 = {};
    var store2 = {};
    try {
        store1 = settingsJSON.app;
        store2 = settingsJSON.kw;
    } catch (err) {
        //
        logger.error("Unable to update settings UI");
        logger.error(err.message);
        return;
        //throw "Unable to update settings UI";
    }
    var apppath = remote.app.getPath('userData');
    logger.debug("updateSettingsUI");
    /*
    var apppath = remote.app.getPath('userData');
    var options1 = {
        name: "app-configuration",
        cwd: apppath
    }
    const store1 = new Store(options1);

    var options2 = {
        name: "keyword-config",
        cwd: path.join(apppath, 'keywordlists')
    }
    const store2 = new Store(options2);
    */

    var applang = store1["app-lang"];
    var zoomvalue = store1["zoom"];
    /*
     "latest-update-check": null,
     "latest-update-install": null,
     */
    $("#settings-app-lang-name").text("Current language: " + selectUtils.getFullLangName(applang));

    var kw_update_latest = store2["last-successful-update"];
    var kw_local_list = store2["local-keywordlists"];
    var kw_available_list = store2["available-keywordlists"];
    var enabled_kw_list = store2["enabled-keywordlists"];
    var kw_update_date = store2["last-successful-update"];
    if ((kw_update_date !== null) && !isNaN(Date.parse(kw_update_date))) {
        kw_update_date = new Date(kw_update_date).toISOString();
    }
    else {
        kw_update_date = "----";
    }
    $("#settings-kw-update-date").text("Latest successfull update: " + kw_update_date);
    $("#kw-list-available-choose").empty();
    $("#kw-list-available-choose").append(document.createElement("option"));
    $('#settings-local-kw-lists').empty();

    var localsArr = [];

    //start loop (local lists)
    for (var k in kw_local_list) { // var i = 0; i < enabled_kw_list.length; i++sadasdasd
        let list_id = "";
        let list_name = "";
        let lang = "";
        if (kw_local_list.hasOwnProperty(k)) {
            list_id = k;// list's filename/identification
            list_name = kw_local_list[k]["name"];// list's name from row 0 (within the file. actual, showable name)
            lang = list_name.split(' - ')[0];
            localsArr.push(k);
            //list_date = new Date(kw_local_list[k]["date"]); // list's update date
        }

        var li_string = document.createTextNode(list_name);
        var li_node = document.createElement("li");
        var span_node = document.createElement("span");
        var div1 = document.createElement('div');
        var div2 = document.createElement('div');

        logger.debug("is the local KW list within the 'enabled' list?");
        logger.debug(enabled_kw_list);
        logger.debug(list_id);

        if (enabled_kw_list.indexOf(list_id) > -1) {
            logger.debug("yes");
            span_node.innerHTML = '&radic;';
            $(span_node).attr({
                onmouseover: "$(this.parentElement.parentElement).addClass('w3-hover-blue');",
                onmouseout: "$(this.parentElement.parentElement).removeClass('w3-hover-blue');",
                class: "mark_enabled w3-green w3-button w3-display-left",
                onclick: "$(this.parentElement.parentElement).toggleClass('kw-list-enabled'); $(this.parentElement.parentElement).toggleClass('importable-1'); $(this.parentElement.parentElement).toggleClass('importable-2'); $(this).toggleClass('w3-red'); $(this).toggleClass('w3-green'); $(this).toggleClass('mark_enabled'); if ($(this).hasClass('mark_enabled')) { this.innerHTML = '&radic;'; } else { this.innerHTML = '&times;'; }; "
            });
            $(li_node).attr({
                "data-id": list_id,
                class: "w3-display-container kw-list-enabled importable-2"
            });
            $(div2).attr({
                style: "text-align: left; margin-left: 40px; white-space: nowrap; text-overflow: ellipsis; overflow-x: hidden;"
            });
        }
        else {
            logger.debug("no");
            span_node.innerHTML = '&times;';
            $(span_node).attr({
                onmouseover: "$(this.parentElement.parentElement).addClass('w3-hover-blue');",
                onmouseout: "$(this.parentElement.parentElement).removeClass('w3-hover-blue');",
                class: "w3-red w3-button w3-display-left",
                onclick: "$(this.parentElement.parentElement).toggleClass('kw-list-enabled'); $(this.parentElement.parentElement).toggleClass('importable-1'); $(this.parentElement.parentElement).toggleClass('importable-2'); $(this).toggleClass('w3-red'); $(this).toggleClass('w3-green'); $(this).toggleClass('mark_enabled'); if ($(this).hasClass('mark_enabled')) { this.innerHTML = '&radic;'; } else { this.innerHTML = '&times;'; }; "
            });
            $(li_node).attr({
                "data-id": list_id,
                class: "w3-display-container importable-1"
            });
            $(div2).attr({
                style: "text-align: left; margin-left: 40px; white-space: nowrap; text-overflow: ellipsis; overflow-x: hidden;"
            });
        }
        div2.appendChild(li_string);
        div1.appendChild(span_node);
        li_node.appendChild(div1);
        li_node.appendChild(div2);

        logger.debug("settings local list element into list....");
        $('#settings-local-kw-lists').append(li_node);
    }
    //<li class="w3-hover-blue w3-display-container kw-list-enabled">list 3<span onclick="$(this.parentElement).toggleClass('kw-list-enabled');$(this).toggleClass('w3-red');$(this).toggleClass('w3-green'); $(this).toggleClass('mark_enabled'); if ($(this).hasClass('mark_enabled')) { $(this).text('&radic;'); } else { $(this).text('&times;');};" class="mark_enabled w3-green w3-button w3-display-right">&radic;</span></li>
    //<li class="w3-hover-blue w3-display-container">list 4<span onclick="$(this.parentElement).toggleClass('kw-list-enabled');$(this).toggleClass('w3-red');$(this).toggleClass('w3-green'); $(this).toggleClass('mark_enabled'); if ($(this).hasClass('mark_enabled')) { $(this).text('&radic;'); } else { $(this).text('&times;');};" class="w3-red w3-button w3-display-right">&times;</span></li>
    //end loop
    var lang_groups = [];
    for (var j in kw_available_list) {
        let list_id = "";
        let list_name = "";
        let lang = "";
        let langlast = "";

        if (kw_available_list.hasOwnProperty(j)) {
            list_id = j;// list's filename/identification
            list_name = kw_local_list[j]["name"];// list's name from row 0 (within the file. actual, showable name)
            lang = list_name.split(' - ')[0];
            langlast = list_name.substring(lang.length + 3, list_name.length);
            //logger.debug("list_id: "+list_id);
            //list_date = new Date(kw_local_list[k]["date"]); // list's update date
        }

        if (localsArr.indexOf(list_id) > -1) {
            logger.warn("The list '" + list_id + "' is already loaded/local!");
            continue;
        }
        else {
            logger.info("The list '" + list_id + "' is not loaded/local!");
            if (lang_groups.indexOf(lang) > -1) {
                //logger.debug("already have a GROUP in kw list: " + lang);
                //logger.debug("creating option-element: " + langlast);
                let option_elem = document.createElement("option");
                let option_string = document.createTextNode(langlast);
                $(option_elem).append(option_string);

                $("#kw-list-available-choose optgroup[label='" + lang + "']").append(option_elem);
            }
            else {
                //logger.debug("GROUP will be added to kw list: " + lang);
                //logger.debug("creating optgroup-element: " + lang);
                var optgroup_elem = document.createElement("optgroup");
                $(optgroup_elem).attr({
                    label: lang
                });
                $("#kw-list-available-choose").append(optgroup_elem);

                //logger.debug("creating option-element: " + langlast);
                let option_elem = document.createElement("option");
                let option_string = document.createTextNode(langlast);
                $(option_elem).append(option_string);

                $("#kw-list-available-choose optgroup[label='" + lang + "']").append(option_elem);

            }
        }
    }

    $("#settings-zoomslider").val(zoomvalue);
    $("#settings-zoomslider").trigger("input");
    //
    selectUtils.setKWListAvailable();
    selectUtils.setAppLang();
}

function markPendingChanges(value = false, file_source) {
    logger.debug("markPendingChanges");
    if (file_source === undefined) {
        return;
    }
    var config_opt = {
        name: "app-configuration",
        cwd: remote.app.getPath('userData')
    }
    var config_store = new Store(config_opt);//NEEDSTOBECHANGED 
    if (value) {
        config_store.set("edits", [true, file_source])
        $("#save-cur-edits-btn").removeClass("w3-disabled");
        $("#save-cur-edits-btn").removeAttr('disabled', 'disabled');
        $("#preview-cur-edits-title").text("There are pending changes!");
        $("#preview-cur-edits-title").css("background-color", "yellow");
    } else {
        config_store.set("edits", [false, null]);
        $("#save-cur-edits-btn").addClass("w3-disabled");
        $("#save-cur-edits-btn").attr('disabled', 'disabled');
        $("#preview-cur-edits-title").text("No pending changes");
        $("#preview-cur-edits-title").css("background-color", "lightgreen");
    }
}

function setImportPreview(arr = null) {
    logger.debug("setImportPreview");

    $('#import-preview-list').empty();

    var li_string = null;
    var li_node = null;
    var span_node = null;
    var div1 = null;
    var div2 = null;
    var arrText = "";
    var check = false;

    if (arr === null) {
        check = false;
        logger.info("Import preview array was null! Using temp array...");
        arr = [[window.i18n.__('import-file-cont-nothing')]];
    } else {
        check = true;
        //verify array
        if (arr instanceof Array) {
            // is array
            if (arr.length >= 1) {
                // array has minimum of 1 element
                for (var atest = 0; atest < arr.length; atest++) {
                    if (arr[atest] instanceof Array) {
                        // was array
                    } else {
                        logger.info("Import preview array element was not array! Using temp array...");
                        arr = [[window.i18n.__('import-file-cont-nothing')]];
                        break;
                    }
                }
            } else {
                logger.info("Import preview array didn't have anything! Using temp array...");
                arr = [[window.i18n.__('import-file-cont-nothing')]];
            }
        } else {
            //not array
            logger.info("Import preview array was not array! Using temp array...");
            arr = [[window.i18n.__('import-file-cont-nothing')]];
        }
    }
    //
    if (check) {
        for (var k = 0; k < arr.length; k++) {
            arrText = JSON.stringify(arr[k]);


            li_string = document.createTextNode(arrText);
            li_node = document.createElement("li");
            span_node = document.createElement("span");
            div1 = document.createElement("div");
            div2 = document.createElement("div");

            span_node.innerHTML = '&times;';
            $(span_node).attr({
                onmouseover: "$(this.parentElement.parentElement).addClass('w3-hover-blue');",
                onmouseout: "$(this.parentElement.parentElement).removeClass('w3-hover-blue');",
                class: "w3-red w3-button w3-display-left",
                onclick: "$(this.parentElement.parentElement).toggleClass('importable-1'); $(this.parentElement.parentElement).toggleClass('importable-2'); $(this).toggleClass('w3-red'); $(this).toggleClass('w3-green'); $(this).toggleClass('mark_enabled'); if ($(this).hasClass('mark_enabled')) { this.innerHTML = '&radic;'; } else { this.innerHTML = '&times;'; }; "
            });
            $(li_node).attr({
                "data-id": k,
                "data-real": arrText,
                class: "w3-display-container importable-1"
            });
            $(div2).attr({
                style: "text-align: left; margin-left: 40px; white-space: nowrap; text-overflow: ellipsis; overflow-x: hidden;"
            });

            div2.appendChild(li_string);
            div1.appendChild(span_node);
            li_node.appendChild(div1);
            li_node.appendChild(div2);

            $('#import-preview-list').append(li_node);
        }
    } else {
        li_string = document.createTextNode(window.i18n.__('import-file-cont-nothing'));
        li_node = document.createElement("li");
        span_node = document.createElement("span");
        div1 = document.createElement("div");
        div2 = document.createElement("div");

        span_node.innerHTML = '&times;';
        $(span_node).attr({
            class: "w3-blue w3-button w3-display-left"
        });
        $(li_node).attr({
            class: "w3-display-container importable-0"
        });
        $(div2).attr({
            style: "text-align: left; margin-left: 40px; white-space: nowrap; text-overflow: ellipsis; overflow-x: hidden;"
        });

        div2.appendChild(li_string);
        div1.appendChild(span_node);
        li_node.appendChild(div1);
        li_node.appendChild(div2);

        $('#import-preview-list').append(li_node);
    }
}

/* ONLY IN CHROME 61+!!!!!! JS modules do not work!
export default {
    toggleViewMode: toggleViewMode
}
*/
module.exports = {
    toggleViewMode: toggleViewMode,
    setFooterBtnMode: setFooterBtnMode,
    setFooterBtnValue: setFooterBtnValue,
    updateSettingsUI: updateSettingsUI,
    selectUtils: selectUtils,
    sectionUtils: sectionUtils,
    markPendingChanges: markPendingChanges,
    setImportPreview: setImportPreview
}