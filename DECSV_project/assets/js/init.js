const remote = require('electron').remote;
const { ipcRenderer } = require('electron')
const BrowserWindow = remote.BrowserWindow;
const dialog = remote.dialog;
const firstWindow = remote.getCurrentWindow();
const fs = require('fs');
const http = require("http");
const shell = remote.shell;
const autoUpdater = remote.autoUpdater;
const path = require('path');
const url = require('url');
const select2 = require('select2');
const Store = require('electron-store');


/* This sets up the language that ALL select2 select-fields will use */
$.fn.select2.amd.define('select2/i18n/current_lang', [], function () {
    // Current language $("#open-file-prompt-text").text(i18n.__('open-files'));
    return {
        errorLoading: function () {
            return i18n.__('select2-cannot-load');
        },
        inputTooLong: function (args) {
            var overChars = args.input.length - args.maximum;
            var message = i18n.__('select2-del-char-p1') + overChars;
            if (overChars < 2){
                message += i18n.__('select2-del-char-p2-1')
            }
            else if (overChars >= 2) {
                message += i18n.__('select2-del-char-p2-2');
            }
            return message;
        },
        inputTooShort: function (args) {
            var remainingChars = args.minimum - args.input.length;

            var message = i18n.__('select2-add-char-p1') + remainingChars + i18n.__('select2-add-char-p2');

            return message;
        },
        loadingMore: function () {
            return i18n.__('select2-loading-more');
        },
        maximumSelected: function (args) {
            var message = i18n.__('select2-select-p1') + e.maximum;

            if (args.maximum < 2) {
                message += i18n.__('select2-select-p2-1');
            }
            else if (args.maximum >= 2){
                message += i18n.__('select2-select-p2-2');
            }

            return message;
        },
        noResults: function () {
            return i18n.__('select2-no-results');
        },
        searching: function () {
            return i18n.__('select2-searching');
        }
    };
});

let aboutCreatFunc = remote.getGlobal('createAboutWin');

const enable_onclicks = false; // NEEDS TO BE DELETED AT SOME POINT
logger.debug("Running init...");

///////////////////////////////////////////////////////// STARTUP FUNCTIONS
setupTranslations();
set_KW_choose_selector();
set_app_lang_selector();
set_kw_list_available_select();
updateSettingsUI();
setupKWSelector();
///////////////////////////////////////////////////////// WINDOW CONTROL BUTTONS FUNCTIONALITY
if (firstWindow.isMaximized()) { document.getElementById("win-maximize-restore-icon").src = "../ui_icons/appbar.window.restore.png"; } // just to make sure when opening 
firstWindow.on('focus', function () { $("html").css("opacity", "1");});
firstWindow.on('blur', function () { $("html").css("opacity", "0.5");});
firstWindow.on('maximize', function () { document.getElementById("win-maximize-restore-icon").src = "../ui_icons/appbar.window.restore.png";});
firstWindow.on('unmaximize', function () { document.getElementById("win-maximize-restore-icon").src = "../ui_icons/appbar.app.png"; });

document.getElementById("win-minimize-icon").onclick = function () {
    logger.debug("win-minimize icon/button");
    firstWindow.minimize();
}
document.getElementById("win-maximize-restore-icon").onclick = function () {
    logger.debug("win-maximize-restore icon/button");
    if (firstWindow.isMaximized()) {
        firstWindow.unmaximize();
    }
    else {
        firstWindow.maximize();
    }
}
document.getElementById("win-close-icon").onclick = function () {
    logger.debug("win-close icon/button");
    $('#proj-files-ul li.w3-yellow').each(function (i) {
        var done = ($(this).attr('data-done') === "true");

        $("#edit-A-orig-text .secA-Q").empty();
        $("#edit-B-orig-text .secB-Q").empty();
        for (var k = 1; k < 15; k++) {
            $("#edit-C-orig-text .secC-Q-" + k).empty();
        }
        var dataA = $("#edit-A-orig-text").html();
        var dataB = $("#edit-B-orig-text").html();
        var dataC = $("#edit-C-orig-text").html();
        var dataKW = [];

        $("#file-chosen-kw-ul li").each(function (i) {
            var value = $(this).attr("data-value");
            $(this).find('span').remove();
            var name = $(this).text();
            dataKW.push([value, name]);
        });

        var notes = [];
        $("#proj-notes-ul li").each(function (i) {
            var text = $(this).text();
            notes.push(text);
        });

        saveProject(window.currentFile, window.currentProject, dataA, dataB, dataC, dataKW, notes, done);
    });
    firstWindow.close();
}
document.getElementById('win-about-icon').onclick = function () {
    logger.debug("win-about icon/button");
    aboutCreatFunc();
}
/////////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////// WINDOW VIEW BUTTONS FUNCTIONALITY

/* Top navigation bar */

document.getElementById("check-app-updates-button").onclick = function () {
    logger.debug("check-app-updates button");
    $("#check-app-updates-button").addClass("element-disabled");
    $("#update-download-progress").css("width", "0%");
    $("#update-download-progress").removeClass("w3-red");
    $("#update-download-progress").removeClass("w3-green");
    $("#update-download-progress").addClass("w3-blue");

    // returned values from auto-updater listeners->
    // 0 = checking
    // 1 = update found
    // 2 = no update available
    // 3 = error
    // 4 = downloading %
    // 5 = downloaded
    //     arr.push(5, ver, relDat, relNote); downloaded & available
    ipcRenderer.on('check-updates-reply', (event, arg) => {
        logger.debug("RETURNED FROM APP: " + arg);
        if (arg[0] === 0) {
            // checking...
            var download_data = "Checking for updates...";
            $("#settings-update-text").text(download_data);
        }
        else if (arg[0] === 1) {
            $("#update-download-progress").removeClass("w3-red");
            $("#update-download-progress").removeClass("w3-green");
            $("#update-download-progress").addClass("w3-blue");
            //arg[1];
            //arg[2];
            //arg[3];
            // update found
        }
        else if (arg[0] === 2){
           // no update available
            $("#check-app-updates-button").removeClass("element-disabled");
            var download_data = "No updates available!";
            $("#update-download-progress").css("width", "100%");
            $("#settings-update-text").text(download_data);
            $("#update-download-progress").removeClass("w3-red");
            $("#update-download-progress").addClass("w3-green");
            $("#update-download-progress").removeClass("w3-blue");
            ipcRenderer.removeAllListeners('check-updates-reply');
        }
        else if (arg[0] === 3){
            // error
            $("#check-app-updates-button").removeClass("element-disabled");
            $("#update-download-progress").css("width", "100%");
            var download_data = "Failed to check for updates!";
            $("#settings-update-text").text(download_data);
            $("#update-download-progress").addClass("w3-red");
            $("#update-download-progress").removeClass("w3-green");
            $("#update-download-progress").removeClass("w3-blue");
            ipcRenderer.removeAllListeners('check-updates-reply');
        }
        else if (arg[0] === 4) {
            // downloading...
            var progressObj = arg[1];
            var download_data = "Downloading "+progressObj.transferred + "/" + progressObj.total + " at " + (progressObj.bytesPerSecond / 1000) + " kbps";
            var download_percent = progressObj.percent;

            if (arg[1] = 100) {
                //completed download
            }
            $("#settings-update-text").text(download_data);
            $("#update-download-progress").css("width",download_percent+"%");
        }
        else if (arg[0] === 5){
            // mark download progress as 100%
            //var download_percent = 100;
            $("#check-app-updates-button").removeClass("element-disabled");
            var download_data = "Finished downloading!";
            $("#update-download-progress").css("width", "100%");
            $("#settings-update-text").text(download_data);
            $("#update-download-progress").removeClass("w3-red");
            $("#update-download-progress").addClass("w3-green");
            $("#update-download-progress").removeClass("w3-blue");
            var ver = arg[1];
            var relDat = arg[2];
            var relNote = arg[3];
            //
            // downloaded
            ipcRenderer.removeAllListeners('check-updates-reply');
        }
    });
    ipcRenderer.send("check-updates", "");
}

document.getElementById("downloadandupdatekeywords").onclick = function () {
    logger.debug("downloadandupdatekeywords button");
    var loadable_kw_lists = $("#kw-list-available-choose").val();
    logger.debug("WOULD be downloading: " + loadable_kw_lists);

    var local_kw_lists = [];
    $("#settings-local-kw-lists li").each(function (i) {
        local_kw_lists.push($(this).attr("data-id"));
    });
    logger.debug("WOULD be updating: " + local_kw_lists);
    
    //checkAndUpdateKWLists();
    // REMEMBER TO SET "NAME" TO KW LISTS properties-file FROM THE FIRST ELEMENT within the .json file, when you have downloaded them!!!!!!
}

document.getElementById("addfilebutton").onclick = function () {
    logger.debug("addfile button");
    //
    var proj_name = window.currentProject;
    addFilesPrompt(proj_name);
}

document.getElementById("projinfobutton").onclick = function () {
    logger.debug("projinfo button");
    $("#proj-info-files-ul").empty();
    $("#proj-info-files-ul").html($("#proj-files-ul").html());
    $("#proj-info-files-ul li").removeAttr("onclick");
    $("#proj-info-files-ul li").removeAttr("style");
    $("#proj-info-files-ul li").removeAttr("data-temp");
    $("#proj-info-files-ul li").removeAttr("data-done");
    $("#proj-info-files-ul li").removeAttr("onmouseover");
    $("#proj-info-files-ul li").removeAttr("onmouseout");
    var value = $("#footer-nav-btn4").val();
    if (value === "information"){
        // do NOTHING
    }
    else {
        var docpath = remote.app.getPath('documents');
        var proj_base = path.join(docpath, 'SLIPPS DECSV\\Projects\\' + window.currentProject + '\\');
        var options = {
            name: window.currentProject,
            cwd: proj_base
        }
        const store = new Store(options);
        var obj = store.get('kw-per-file', {});
        var allkw = [];
        for (var k in obj) {
            if (obj.hasOwnProperty(k)) {
                //logger.debug("KW FILE OBJ HAS OWN PROPERTY");
                var fileArr = obj[k];
                //logger.debug(fileArr);
                //logger.debug(fileArr.length);
                for (var h = 0; h < fileArr.length; h++){
                    var keyW = fileArr[h];
                    var kw_id = fileArr[h][0];
                    var kw_actual = fileArr[h][1];
                    //logger.debug("### KW ARRAY");
                    //logger.debug(keyW);
                    allkw.push([kw_id,kw_actual]);
                }
            }
        }
        ////////
        $('#proj-info-kw-ul').empty();
        var uniq = [];
        var check = false;
        for (i = 0; i < allkw.length; i++) {
            check = false;
            //logger.debug("COMPARING ARRAYS");
            //logger.debug(allkw[i]);
            var current = allkw[i];
            
            for (var t = 0; t < uniq.length; t++){
                if (uniq[t][0] === current[0]){
                    check = true;
                    break;
                }
            }

            if (!check) {
                uniq.push(current);
            }
        }
        for (var j = 0; j < uniq.length; j++){
            //logger.debug("CREATING LIST OT PROJ SUMMARY");
            var li_string = document.createTextNode(uniq[j][1]);
            var li_node = document.createElement("li");
            //logger.debug(uniq[j][1]);
            li_node.appendChild(li_string);

            $(li_node).attr({
                class: "w3-display-container",
                "data-id": uniq[j][0]
            });

            $('#proj-info-kw-ul').append(li_node);
        }
        
    }
    toggleViewMode(12);
    toggleViewMode(10);
}

document.getElementById("projstartbutton").onclick = function () {
    logger.debug("projectstart button");
    toggleViewMode(1);
    toggleViewMode(9);
}

document.getElementById("saveprojbutton").onclick = function () {
    logger.debug("saveproject button");
    //save project
}

document.getElementById("closeprojbutton").onclick = function () {
    logger.debug("closeproject button");
    var options = {
        type: 'info',
        title: "Confirmation",
        message: "Close project " + window.currentProject+"?",
        detail: "Are you sure you want to close this project?",
        buttons: [i18n.__('conf-yes', true), i18n.__('conf-no', true)]
    };

    dialog.showMessageBox(firstWindow, options, function (index) {
        if (index === 0) {
            //save before closing
            $('#proj-files-ul li.w3-yellow').each(function (i) {
                var done = ($(this).attr('data-done') === "true");

                $("#edit-A-orig-text .secA-Q").empty();
                $("#edit-B-orig-text .secB-Q").empty();
                for (var k = 1; k < 15; k++) {
                    $("#edit-C-orig-text .secC-Q-" + k).empty();
                }
                var dataA = $("#edit-A-orig-text").html();
                var dataB = $("#edit-B-orig-text").html();
                var dataC = $("#edit-C-orig-text").html();
                var dataKW = [];

                $("#file-chosen-kw-ul li").each(function (i) {
                    var value = $(this).attr("data-value");
                    $(this).find('span').remove();
                    var name = $(this).text();
                    dataKW.push([value, name]);
                });

                var notes = [];
                $("#proj-notes-ul li").each(function (i) {
                    var text = $(this).text();
                    notes.push(text);
                });
                $("#preview-third-1").addClass("no-display");
                $("#preview-third-2").addClass("no-display");
                $("#preview-third-3").addClass("no-display");
                $("#preview-third-start").removeClass("no-display");
                saveProject(window.currentFile, window.currentProject, dataA, dataB, dataC, dataKW, notes, done);
            });
            //
            window.currentProject = undefined;
            window.currentFile = undefined;
            window.currentFileContent = undefined;
            setViewButtonSets("project-closed");
            clearElements();
            $("#titlebar-appname").text("DECSV {Alpha version " + remote.app.getVersion() + "}")
            $("#preview-cur-file-name").text("Current file: NONE");
            $("#preview-subid").text("Submission ID:");
            $("#preview-subdate").text("Submission Date:");
            toggleViewMode(0);
            toggleViewMode(10);
        }
    });
}

document.getElementById("settingsbutton").onclick = function () {
    logger.debug("settings button");
    if ($('#footer-nav-btn3').val() === "settings") {
        // do nothing. you are already at settings...
    }
    else {
        // CHECK SETTINGS FROM FILES > and update view like you wanted to
        $("#app-lang-selector").val(null).trigger("change");
        $("#kw-list-available-choose").val(null).trigger("change");
        updateSettingsUI();
    }
    toggleViewMode(7);
    toggleViewMode(10);
}

document.getElementById("back-to-start-button").onclick = function () {
    logger.debug("to start button");
    toggleViewMode(0);
    toggleViewMode(10);
}

document.getElementById("loginbutton").onclick = function () {
    logger.debug("login button");
    toggleViewMode(5);
    toggleViewMode(10);
}


/* Create Proj div */


/* Start div */

document.getElementById("create-proj-button").onclick = function () {
    logger.debug("create-proj-button");
    toggleViewMode(10);
    toggleViewMode(13);
}

document.getElementById("open-proj-button").onclick = function () {
    logger.debug("open-proj-button");

    var docpath = remote.app.getPath('documents');
    if (fs.existsSync(path.join(docpath, "SLIPPS DECSV\\Projects\\"))){
        var options = {
            title: i18n.__('open-project-prompt-window-title'),
            defaultPath: path.join(docpath, "SLIPPS DECSV\\Projects\\"), //This need verifications!!!
            properties: ['openDirectory'
            ]
        }
        function callback(pname) {

            if (pname !== undefined) {
                var projname = pname[0].split("\\").pop();
                logger.debug("PROJECT NAME: " + projname);
                var opened_res = openAndViewProject(projname);
                //readFile(fileNames);
                if (opened_res[0]) {
                    logger.debug("OPENED EXISTING PROJECT");
                }
                else {
                    logger.debug("FAILED TO OPEN EXISTING PROJECT!");
                    logger.debug("REASON: " + opened_res[1]);
                    $("#proj-open-error").text(open_res[1]);
                }
                return;
            }
            logger.warn("No project chosen to be opened!");
        }
        dialog.showOpenDialog(firstWindow, options, callback);
    }
    else {
        $("#proj-open-error").text("Projects folder doesn't exists! Create new project or restart application.");
    }
    //open dialog here to choose directory, or create directory if nothing is present. then recall function
}

/* Preview div */
document.getElementById("secAmodetoggle").onclick = function () {
    logger.debug("secAmodetoggle button");
    console.log("toggle A");
    toggleViewMode(2);
    toggleViewMode(9);
}

document.getElementById("secBmodetoggle").onclick = function () {
    logger.debug("secBmodetoggle button");
    console.log("toggle B");
    toggleViewMode(3);
    toggleViewMode(9);
}

document.getElementById("secCmodetoggle").onclick = function () {
    logger.debug("secCmodetoggel button");
    console.log("toggle C");
    toggleViewMode(4);
    toggleViewMode(9);
}

/* Login/Register div */
//

//window.onload = function () {
    /*
    function getHighlightedWords() {
        var text = "";
        var activeEl = document.activeElement;
        var activeElTagName = activeEl ? activeEl.tagName.toLowerCase() : null;
        if (
            (activeElTagName == "textarea") || (activeElTagName == "input" &&
                /^(?:text|search|password|tel|url)$/i.test(activeEl.type)) &&
            (typeof activeEl.selec



tionStart == "number")
        ) {
            text = activeEl.value.slice(activeEl.selectionStart, activeEl.selectionEnd);
        } else if (window.getSelection) {
            text = window.getSelection().toString();
        }
        if (text.length !== 0) {
            console.log("TÄMÄ ON VALITTU: " + text);
        }
        else {
            //
        }
    }
    document.onmouseup = document.onkeyup = document.onselectionchange = function () {
        getHighlightedWords();
    };
*/

/* Index div footer */

document.getElementById("footer-nav-btn1").onclick = function () {
    var value = $(this).val();
    logger.debug("btn1: " + value);
    if (value === "preview"){
        $(this).text("Previous file");
    }
    //preview move to previous file
}
document.getElementById("footer-nav-btn2").onclick = function () {
    var value = $(this).val();
    logger.debug("btn2: " +value);
}

document.getElementById("footer-nav-btn3").onclick = function () {
    var value = $(this).val();
    logger.debug("btn3: " + value);
    //create project createProjAsync();
    //save settings
    //edit ABC save
    if (value === "editA") {
        toggleViewMode(1);
        toggleViewMode(9);
        // save A edits and update preview
        $("#edit-A-orig-text").html($("#edit-A-edit-text").html());
        updatePreview();
        updateCensoredList();
    }
    else if (value === "editB") {
        toggleViewMode(1);
        toggleViewMode(9);
        // save B edits and update preview
        $("#edit-B-orig-text").html($("#edit-B-edit-text").html());
        updatePreview();
        updateCensoredList();
    }
    else if (value === "editC") {
        toggleViewMode(1);
        toggleViewMode(9);
        // save C edits and update preview
        $("#edit-C-orig-text").html($("#edit-C-edit-text").html());
        updatePreview();
        updateCensoredList();
    }
    else if (value === "login") {
        //login
    }
    else if (value === "register") {
        //register
    }
    else if (value === "settings") {
        var options = {
            type: 'info',
            title: "Confirmation",
            message: "Save these settings?",
            detail: "If you set language, it will take effect on next startup.",
            buttons: [i18n.__('conf-yes', true), i18n.__('conf-no', true)]
        };

        dialog.showMessageBox(firstWindow, options, function (index) {
            if (index === 0) {
                saveSettings();
            }
            else {
            }
        });
        //save settings
s    }
    else if (value === "create-proj") {
        logger.debug("new-proj-create-button");
        var project_name = $("#new-proj-create-input").val();
        createProjAsync(project_name);
        //create project
    }
    else if (value === "forgotPW") {
        //
    }
}
document.getElementById("footer-nav-btn4").onclick = function () {
    var value = $(this).val();
    logger.debug("btn4: " + value);

    //cancel project creation
    //cancel settings
    //edit ABC cancel
    if (value === "editA") {
        toggleViewMode(1);
        toggleViewMode(9);
        // cancel editmode A
        $("#edit-A-edit-text").html($("#edit-A-orig-text").html());
        setupCensorSelect();
    }
    else if (value === "editB") {
        toggleViewMode(1);
        toggleViewMode(9);
        //cancel editmode B
        $("#edit-B-edit-text").html($("#edit-B-orig-text").html());
        setupCensorSelect();
    }
    else if (value === "editC") {
        toggleViewMode(1);
        toggleViewMode(9);
        //cancel editmode C
        $("#edit-C-edit-text").html($("#edit-C-orig-text").html());
        setupCensorSelect();
    }
    else if (value === "register") {
        toggleViewMode(5);
        toggleViewMode(10);
    }
    else if (value === "settings") {
        $("#app-lang-selector").val(null).trigger("change");
        $("#kw-list-available-choose").val(null).trigger("change");
        updateSettingsUI();
        // revert changes in settings
    }
    else if (value === "forgotPW") {

        toggleViewMode(5);
        toggleViewMode(10);
    }
    
}

document.getElementById("footer-nav-btn5").onclick = function () {
    var value = $(this).val();
    logger.debug("btn5: " + value);

    if (value === "preview") {
        // Toggle done and not done
        $('#proj-files-ul li.w3-yellow').each(function (i) {
            //
            if ($(this).attr("data-done") === "true") {
                $(this).attr({
                    "data-done": false
                });
            }
            else {
                $(this).attr({
                    "data-done": true
                });
            }
            setViewButtonSets("preview");
        });
    }
    else if (value === "login") {
        toggleViewMode(6);
        toggleViewMode(10);
        // register view
    }
    
}
document.getElementById("footer-nav-btn6").onclick = function () {
    var value = $(this).val();
    logger.debug("btn6: " + value);
    
    if (value === "preview") {
        // Move to next file
    }
    else if (value === "login") {
        toggleViewMode(14);
        toggleViewMode(10);
    }
}

function setFooterBtnValue(value) {
    logger.debug("setFooterBtnValue");
    logger.debug("Value: "+value);
    $("#footer-nav-btn1").val(value);
    $("#footer-nav-btn2").val(value);
    $("#footer-nav-btn3").val(value);
    $("#footer-nav-btn4").val(value);
    $("#footer-nav-btn5").val(value);
    $("#footer-nav-btn6").val(value);
}

function setViewButtonSets(view) {
    logger.debug("setViewButtonSets");
    logger.debug("View: "+view);
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

        if (window.currentFile === undefined) {
            $("#footer-nav-btn1").addClass("no-display");
            $("#footer-nav-btn5").addClass("no-display");
            $("#footer-nav-btn6").addClass("no-display");
        }
    }
    else if (view === "login"){
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
    else if (view === "register"){
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
        $("#saveprojbutton").removeClass("no-display");
        $("#closeprojbutton").removeClass("no-display");
        $("#back-to-start-button").addClass("no-display");
    }
    else if (view === "project-closed") {
        $("#addfilebutton").addClass("no-display");
        $("#projinfobutton").addClass("no-display");
        $("#projstartbutton").addClass("no-display");
        $("#saveprojbutton").addClass("no-display");
        $("#closeprojbutton").addClass("no-display");
        $("#back-to-start-button").removeClass("no-display");
    }
    else if (view === "forgotPW"){
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
        logger.error("Invalid input in setViewButtonSets!");
    }
}

/* Index div right side */

//

/* Index div left side */

//

/* Settings div */

//

/* Info div */

//

///////////////////////////////////////////////////////////////

/////////////////////////////////////////////////////////////// FUNCTIONS
function createProjAsync(project_name) {
    logger.debug("createProjAsync");
    ipcRenderer.on('async-create-project-reply', (event, arg) => {
        //console.log("RETURNED FROM APP: ");
        //console.log(arg);
        logger.debug("ASYNC RETURNED (CREATE PROJECT)");
        if (arg[0]){
            var opened_res = openAndViewProject(project_name);

            if (opened_res[0]) {
                logger.debug("OPENED CREATED PROJECT");
            }
            else {
                logger.debug("FAILED TO OPEN CREATED PROJECT!");
                logger.debug("REASON: " + opened_res[1]);
                $("#create-proj-error").text(opened_res[1]);
            }
        }
        else {
            var reason = arg[1];
            logger.debug("FAILED TO CREATE NEW PROJECT!! REASON: " + reason);
            $("#create-proj-error").text(reason);
        }
        ipcRenderer.removeAllListeners('async-create-project-reply');
    })
    ipcRenderer.send('async-create-project', project_name);
}

function sourceFiles2ProjAsync(files) { // Last object of "files" will be name of the project where files will be added to
    logger.debug("sourceFiles2ProjAsync");
    var proj_name = files[files.length - 1];
    var docpath = remote.app.getPath('documents');

    var f2p_options = {
        name: proj_name,
        cwd: path.join(docpath, 'SLIPPS DECSV\\Projects\\' + proj_name + '\\')
    }
    const f2p_store = new Store(f2p_options);
    var pre_dirfiles = f2p_store.get('source-files', []);
    logger.debug(pre_dirfiles);

    ipcRenderer.on('async-import-files-reply', (event, arg) => {
        logger.debug("BACK FROM APP - import files into project");
        var dirfiles = fs.readdirSync(path.join(docpath, 'SLIPPS DECSV\\Projects\\' + proj_name + '\\source\\'));
        logger.debug(docpath);
        logger.debug(dirfiles);
        //console.log("RETURNED FROM APP: ");
        //console.log(arg);
        if (arg[0]) {
            // do something if importing was successful
            logger.debug("DONE IMPORTING SOURCE FILES!");
        }
        else {
            logger.debug("ERROR WHILE IMPORTING!");
            var reason = arg[1];
            // SHOW REASON TO USER!
        }       
        logger.debug("STORE SOURCE: "+f2p_store.get("source-files","NONE!!!!"));
        f2p_store.set("source-files", dirfiles);
        ipcRenderer.removeAllListeners('async-import-files-reply');

        ipcRenderer.on('async-transform-files-reply', (event, arg) => {
            logger.debug("BACK FROM APP - returned from transforming src files to temp");
            if (arg[0]) {
                logger.info("SRC to TEMP conversion success!");
                // successfully ended the temp conversion
                logger.debug("SUCCESS AND FAIL ARRAYS");
                logger.debug(arg[1]);//success array
                logger.debug(arg[2]);//fail array
                // filearr 0 = fileoriginal, 1 = filetemp, 2 = filedonestatus

                // fileS,"temp#"+fileS+".json",false
                for (var a = 0; a < arg[1].length; a++) {
                    var fileArr = [];
                    fileArr.push(arg[1][a][0], arg[1][a][1],arg[1][a][2]);
                    addProjFile(fileArr);
                }
            }
            else {
                logger.error("SRC to TEMP conversion failed!");
                //folders missing
            }
            var testing_opt = {
                name: "temp#"+arg[1][0],
                cwd: path.join(docpath, 'SLIPPS DECSV\\Projects\\' + proj_name + '\\temp\\')
            }
            /*
            const testing_store = new Store(testing_opt);
            var teststring = testing_store.get("c","AHAHAHAHAHAHAHAH");
            //THIS IS FOR TESTING
            $("#edita-div").addClass("is-shown");
            $("#edit-A-edit-text").html(teststring);
            */

            //updateFileList(proj_name);
            ipcRenderer.removeAllListeners('async-transform-files-reply');
        });
        ipcRenderer.send('async-transform-files', proj_name);
    });
    logger.debug("SENDING ASYNC TO MAIN APP!");
    var send_arg = [];
    send_arg.push(files);
    send_arg.push(pre_dirfiles);
    logger.debug("########### LISTING FILELIST GOING TO BE SENT");
    logger.debug(files);
    logger.debug(pre_dirfiles);
    ipcRenderer.send('async-import-files', send_arg);
}

function updateFileList(proj_name) {
    logger.debug("updateFilesList");
    var docpath = remote.app.getPath('documents');
    var filelist_options = {
        name: proj_name,
        cwd: path.join(docpath, 'SLIPPS DECSV\\Projects\\' + proj_name + '\\')
    }
    const fl_store = new Store(filelist_options);
    var tempfiles = fl_store.get("temp-files", {});
    try {
        $("#proj-files-ul").empty();
        for (var k in tempfiles) {
            //logger.debug("Looping through tempfiles...");
            if (tempfiles.hasOwnProperty(k)) {
                var filetemp = k;
                var fileorig = tempfiles[k]["file"];
                var filedone = tempfiles[k]["done"];
                //logger.debug("FROM TEMP FILE IN UPDATEFILELIST");
                //logger.debug(filedone);
                //logger.debug(typeof(filedone));
                var fileArr = [];
                fileArr.push(fileorig, filetemp, filedone);
                // filearr 0 = fileoriginal, 1 = filetemp, 2 = filedonestatus
                addProjFile(fileArr);
            }
        }
    }
    catch (err){
        //
        logger.error("Error trying to read list of temp files (updating list)!");
        logger.error(err.message);
    }
}

function openAndViewProject(proj_name) {
    logger.debug("openAndViewProject");

    var regex_filepath_val = /^[^\\/:\*\?"<>\|]+$/;
    var docpath = remote.app.getPath('documents');
    var reason = [];

    if (proj_name === undefined) {
        // Projectname not defined
        reason.push(false, "Project name not defined!");
        return reason;
    }
    else if (proj_name.length === 0 || proj_name.length > 100) {
        // Projectname length 0 or over 100 characters
        reason.push(false, "Name should have 1-100 characters!");
        return reason;
    }
    else if (!regex_filepath_val.test(proj_name)) {
        // Projectname not allowed
        reason.push(false, 'Name should not contain <>:"/\\|?*');
        return reason;
    }
    else if (fs.existsSync(path.join(docpath, 'SLIPPS DECSV'))) {
        if (fs.existsSync(path.join(docpath, 'SLIPPS DECSV\\Projects'))) {
            if (fs.existsSync(path.join(docpath, 'SLIPPS DECSV\\Projects\\' + proj_name))) {
                if (fs.existsSync(path.join(docpath, 'SLIPPS DECSV\\Projects\\' + proj_name + '\\source'))) {
                    if (fs.existsSync(path.join(docpath, 'SLIPPS DECSV\\Projects\\' + proj_name + '\\temp'))) {
                        if (fs.existsSync(path.join(docpath, 'SLIPPS DECSV\\Projects\\' + proj_name + '\\' + proj_name + '.json'))) {

                            $("#titlebar-appname").text("DECSV {Alpha version " + remote.app.getVersion() + "}" + " - " + proj_name);
                            var open_options = {
                                name: proj_name,
                                cwd: path.join(docpath, 'SLIPPS DECSV\\Projects\\' + proj_name)
                            }
                            const open_store = new Store(open_options);

                            var created_on = new Date(open_store.get("created-on", null));
                            console.log(created_on);
                            $("#proj-info-name").text("Project Name: " + proj_name);
                            $("#proj-info-created").text("Created: " + created_on);

                            var source_files = open_store.get("source-files", null);
                            console.log(source_files);

                            for (var i = 0; i < source_files.length; i++) {
                                console.log(i + "  " + source_files[i]);
                            }

                            var temp_files = open_store.get("temp-files", {});
                            console.log(temp_files);

                            for (var k in temp_files) {
                                console.log("1: ");
                                console.log(k);
                                if (temp_files.hasOwnProperty(k)) {
                                    console.log("2: ");
                                    console.log(temp_files[k]);
                                    console.log(temp_files[k].file);
                                }
                            }

                            var kw_per_file = open_store.get("kw-per-file", null);
                            console.log(kw_per_file);


                            for (var k in kw_per_file) {
                                console.log("#1: ");
                                console.log(k);
                                if (kw_per_file.hasOwnProperty(k)) {
                                    console.log("#2: ");
                                    console.log(kw_per_file[k]);
                                }
                            }

                            var proj_notes = open_store.get("notes", null);
                            console.log("NOTES: ");
                            console.log(proj_notes);
                            for (var i = 0; i < proj_notes.length; i++) {
                                console.log(i + "  " + proj_notes[i]);
                                addProjNote(proj_notes[i]);
                            }
                            window.currentProject = proj_name;
                            updateFileList(proj_name);
                            /*
                            // TESTING
                            open_store.set("temp-files.source1.file", "temp#source1.json");
                            open_store.set("kw-per-file.source1", [["en-basic-1", "Confidentiality"], ["en-basic-2", "Checking"], ["en-basic-3", "Verification"]]);

                            open_store.set("notes", ["note_1","note_2","note_14","note_3","note_4"]);

                            // TESTING STORE FOR TEMP FILES TO BE JSON
                            var temp_options1 = {
                                name: "temp#source1",
                                cwd: path.join(docpath, 'SLIPPS DECSV\\Projects\\' + proj_name + '\\temp\\')
                            }
                            //JOKAINEN " tulee korvata \"
                            const temp_store1 = new Store(temp_options1);
                            temp_store1.set("src", "source1.csv");
                            temp_store1.set("a", "Lorem Ipsum on testiteksti");
                            temp_store1.set("b", "ASD ASD ASD ASDASD");
                            temp_store1.set("c", "Tämä tässä on vain testauksen vuoksi");
                            temp_store1.set("kw", [["en-basic-1", "Confidentiality"], ["en-basic-2", "Checking"], ["en-basic-3", "Verification"]]);
                            */


                            // OPENING "PROJECT START" VIEW
                            toggleViewMode(1);
                            toggleViewMode(9);
                            setViewButtonSets("project-open");
                            ////////////////////
                            logger.info("Opened project " + proj_name + "...");
                            reason.push(true);
                            return reason;
                        }
                        else {
                            // No project properties file!
                            reason.push(false, "Project properties file missing!");
                            return reason;
                        }
                    }
                    else {
                        // No temp folder!
                        reason.push(false, "Temp-folder missing!");
                        return reason;
                    }
                }
                else {
                    // No source folder!
                    reason.push(false, "Source-folder missing!");
                    return reason;
                }
            }
            else {
                // Project does not exist!
                reason.push(false, "Project does not exist!");
                return reason;
            }
        }
        else {
            // Projects-folder not present!
            reason.push(false, "Projects-older missing!");
            return reason;
        }
    }
    else {
        // Application-folder (at Documents) not present!
        reason.push(false, "Application-folder missing!");
        return reason;
    }
}

// Add given note into ul element
function addProjNote(note) {
    //
    var li_string = document.createTextNode(note);
    var li_node = document.createElement("li");
    var span_node = document.createElement("span");

    li_node.appendChild(li_string);
    span_node.innerHTML = "&times;";

    $(li_node).attr({
        class: "w3-display-container"
    });

    $(span_node).attr({
        style: "height: 100%;",
        class: "w3-button w3-display-right",
        onmouseover: "$(this.parentElement).addClass('w3-hover-blue');",
        onmouseout: "$(this.parentElement).removeClass('w3-hover-blue');",
        onclick: "$(this.parentElement).remove();"
    });

    li_node.appendChild(span_node);

    $('#proj-notes-ul').append(li_node);
}

// Add given filename + details into ul element
function addProjFile(fileArr) {
    logger.debug("addProjFile");
    logger.debug(fileArr);
    /*
    <li class="w3-green w3-hover-blue w3-display-container">File1.csv</li>
        <li class="w3-green w3-hover-blue w3-display-container">File2.csv</li>
        <li class="w3-green w3-hover-blue w3-display-container">File3.csv</li>
        <li class="w3-yellow w3-hover-blue w3-display-container">File4.csv</li>
        <li class="w3-hover-blue w3-display-container">File5.csv</li>
        <li class="w3-hover-blue w3-display-container">File6.csv</li>
        <li class="w3-hover-blue w3-display-container">File7.csv</li>
        <li class="w3-hover-blue w3-display-container">File8.csv</li>
        <li class="w3-hover-blue w3-display-container">File9.csv</li>
    */
    // filearr 0 = fileoriginal, 1 = filetemp, 2 = filedonestatus
    var li_string = document.createTextNode(fileArr[0]);
    //console.log("####################################################");
    //console.log(li_string);
    var li_node = document.createElement("li");
    //console.log(li_node);
    //console.log(document.createElement("li"));
    var classes = "w3-display-container";
    li_node.appendChild(li_string);
    //logger.debug("BEFORE USAGE AT ADDPROJFILE");
    //logger.debug(fileArr[2]);
    //logger.debug(typeof (fileArr[2]));
    if (fileArr[2]){
        classes = classes + " w3-green";
    }
    $(li_node).attr({
        style: "cursor:pointer;",
        class: classes,
        onmouseover: "$(this).addClass('w3-hover-blue');",
        onmouseout: "$(this).removeClass('w3-hover-blue');",
        "data-temp": fileArr[1],
        "data-done": fileArr[2]
    });
    $('#proj-files-ul').append(li_node);
    $('#proj-files-ul li').off('click');
    $('#proj-files-ul li').on('click', function () {
        logger.debug('CLICKED FILE :DDD');
        var done = "";
        if ($(this).hasClass("w3-yellow")) {
            // do nothing
            logger.info("Tried to open already showed file!");
        }
        else {
            logger.info("Switching files...");
            $('#proj-files-ul li.w3-yellow').each(function (i) {
                done = ($(this).attr('data-done') === "true");
                $(this).removeClass('w3-yellow');
            if ($(this).attr('data-done') === 'true') {
                $(this).addClass('w3-green');
            }
            $("#edit-A-orig-text .secA-Q").empty();
            $("#edit-B-orig-text .secB-Q").empty();
    for (var k=1;k<15 ; k++) {
        $("#edit-C-orig-text .secC-Q-" + k).empty();
    }
    var dataA = $("#edit-A-orig-text").html();
    var dataB = $("#edit-B-orig-text").html();
    var dataC = $("#edit-C-orig-text").html();
    var dataKW = [];
    $("#file-chosen-kw-ul li").each(function (i) {
        var value = $(this).attr("data-value");
        $(this).find('span').remove();
        var name = $(this).text();
        //logger.debug("THIS IS AFTER REMOVAL!!!!");
        //logger.debug(name);

        dataKW.push([value, name]);
    });
    var notes = [];
    $("#proj-notes-ul li").each(function (i) {
        var text = $(this).text();
        notes.push(text);
    });

    saveProject(window.currentFile, window.currentProject, dataA, dataB, dataC, dataKW, notes, done);
        });
        $(this).addClass('w3-yellow');
        $(this).removeClass('w3-green');
        $("#file-chosen-kw-ul").empty();
        $("#KW-selector option").each(function (i) {
            //
            if (this.hasAttribute("disabled")) {
                $(this).removeAttr("disabled");
            }
        });
        $("#KW-selector").select2({
            language: "current_lang",
            placeholder: i18n.__('select2-kw-add-ph')
        });
        openAndShowFile(this);
    }
    });
}

function saveProject(file_name, proj_name, dataA, dataB, dataC, dataKW, notes, done) {
    logger.debug("saveProject");
    if ((file_name !== undefined) && (proj_name !== undefined)) {
        logger.info("Starting saving data to temp and project files...");
        //
        var docpath = remote.app.getPath('documents');
        // store for project properties
        var options1 = {
            name: proj_name,
            cwd: path.join(docpath, 'SLIPPS DECSV\\Projects\\' + proj_name)
        }
        const store1 = new Store(options1);
        // store for project temp file
        var options2 = {
            name: 'temp#'+file_name,
            cwd: path.join(docpath, 'SLIPPS DECSV\\Projects\\' + proj_name + '\\temp\\')
        }
        const store2 = new Store(options2);

        store2.set('a', dataA);
        store2.set('b', dataB);
        store2.set('c', dataC);
        store2.set('kw', dataKW);
        store2.set('done', done);

        var origobj = store1.get('kw-per-file', {});
        var filestatus = store1.get('temp-files', {})
        filestatus['temp#' + file_name + '.json']['done'] = done;
        origobj['temp#' + file_name + '.json'] = dataKW;
        store1.set('temp-files', filestatus)
        store1.set('kw-per-file', origobj);
        store1.set('notes', notes);

        logger.info("Saved data to temp-file 'temp#"+file_name+".json' and project '"+proj_name+"' properties file");
    }
    else {
        logger.error("Tried to save file/project, when 'file_name' or 'proj_name' is undefined!");
    }
}
function openAndShowFile(fileObj) {
    logger.debug("openAndShowFile");
    window.currentFile = $(fileObj).text();
    window.fileDoneStatus = ($(fileObj).attr("data-done") === "true");
    
    $("#preview-cur-file-name").text("Current file: "+currentFile);
    $("#preview-third-1").removeClass("no-display");
    $("#preview-third-2").removeClass("no-display");
    $("#preview-third-3").removeClass("no-display");
    $("#preview-third-start").addClass("no-display");

    $("#footer-nav-btn1").removeClass("no-display");
    $("#footer-nav-btn5").removeClass("no-display");
    $("#footer-nav-btn6").removeClass("no-display");

    var docpath = remote.app.getPath('documents');
    var temp_base = path.join(docpath, 'SLIPPS DECSV\\Projects\\' + window.currentProject + '\\temp\\');
    var options = {
        name: "temp#" + $(fileObj).text(),
        cwd: temp_base
    }
    const store = new Store(options);

    $("#edit-A-edit-text").html(store.get("a",""));
    $("#edit-A-orig-text").html(store.get("a",""));
    $("#edit-B-edit-text").html(store.get("b",""));
    $("#edit-B-orig-text").html(store.get("b",""));
    $("#edit-C-edit-text").html(store.get("c",""));
    $("#edit-C-orig-text").html(store.get("c",""));

    window.currentFileContent = store.get("src-data",[]);

    $(".secA-Q").text(i18n.__("secA-Q"));
    $(".secB-Q").text(i18n.__("secB-Q"));
    for (var k = 1; k < 15; k++) {
        $(".secC-Q-" + k).text(i18n.__("secC-Q-" + k));
        //logger.debug("round: secC-Q-" + k);
    }

    $("#preview-subid").text("Submission ID: " + store.get("subID"));
    $("#preview-subdate").text("Submission Date: " + store.get("subDATE"));

    // HERE, YOU CHECK AND SETUP KEYWORDS FOR THIS SPECIFIC FILE (and restart select2) remember to remove all "disabled" attr before adding them!
    // loop start
    var listofkw = store.get("kw", []);
    logger.debug("starting file-kwlist compare...");
    //logger.debug(listofkw);

    //$("#KW-selector").select2("destroy");

    for (var j = 0; j < listofkw.length; j++) {
        var kw_value = listofkw[j][0];
        var kw_text = listofkw[j][1];

        //logger.debug("1# VALUE: " + kw_value + " # TEXT: " + kw_text);

        var li_string = document.createTextNode(kw_text);
        var li_node = document.createElement("li");
        var span_node = document.createElement("span");

        li_node.appendChild(li_string);
        span_node.innerHTML = "&times;";

        $(li_node).attr({
            class: "w3-display-container",
            "data-value": kw_value
        });

        $(span_node).attr({
            style: "height: 100%;",
            class: "w3-button w3-display-right",
            onmouseover: "$(this.parentElement).addClass('w3-hover-blue');",
            onmouseout: "$(this.parentElement).removeClass('w3-hover-blue');",
            onclick: "$(\"#KW-selector option[value = '" + kw_value + "']\").removeAttr('disabled', 'disabled'); $(this.parentElement).remove(); $(\"#KW-selector\").select2({language: \"current_lang\",placeholder: i18n.__('select2-kw-add-ph')});"
        });
        //logger.debug("2# VALUE: " + kw_value + " # TEXT: " + kw_text);
        li_node.appendChild(span_node);

        $('#file-chosen-kw-ul').append(li_node);

        // would like to add "red" bgc if element does not exist in current kw-selector. currently only disables those already in there
        //logger.debug("3# VALUE: " + kw_value + " # TEXT: " + kw_text);
        //logger.debug($("#KW-selector option"));
        $("#KW-selector option").each(function (i) {
            if ($(this).val() === kw_value){
                //
                //logger.debug("YEEEEEEEEE :)");
                $(this).attr('disabled','disabled');
                return false;
            }
            else {
                //
                //logger.debug("Nuuuuuuuuu :c");
            }
            
        });

        //logger.debug("5# VALUE: " + kw_value + " # TEXT: " + kw_text);
    }
    // end loop, init element again
    $("#KW-selector").prop("disabled", false);
    
    $("#KW-selector").select2({
        language: "current_lang",
        placeholder: i18n.__('select2-kw-add-ph')
    });
    
    $("#file-chosen-kw-ul").removeClass("element-disabled");
    //

    setupCensorSelect();
    updatePreview();
    updateCensoredList();
    setViewButtonSets("preview");
}

function updatePreview() {
    logger.debug("updatePreview");
    //
    $("#preview-preview-A").html($("#edit-A-orig-text").html());
    $("#preview-preview-B").html($("#edit-B-orig-text").html());
    $("#preview-preview-C").html($("#edit-C-orig-text").html());
    removeCensored();
    $("#preview-preview-A .secA-Q-allA").text($("#preview-preview-A .secA-Q-allA").text());
    $("#preview-preview-B .secB-Q-allA").text($("#preview-preview-B .secB-Q-allA").text());

    for (var i = 1; i < 15; i++) {
        $("#preview-preview-C .secC-Q-allA .secC-Q-" + i + "-cont").text($("#preview-preview-C .secC-Q-allA .secC-Q-" + i + "-cont").text());
    }
}

function updateSettingsUI() {
    logger.debug("updateSettingsUI");
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

    var applang = store1.get("app-lang", "en");
    $("#settings-app-lang-name").text("Current language: " + getFullLangName(applang));

    var kw_update_latest = store2.get("last-successful-update", "----");
    var kw_local_list = store2.get("local-keywordlists", {});
    var kw_available_list = store2.get("available-keywordlists", {});
    var enabled_kw_list = store2.get("enabled-keywordlists", []);
    var kw_update_date = store2.get("last-successful-update", "----");
    if ((kw_update_date !== null) && (kw_update_date !== "----")){
        kw_update_date = new Date(kw_update_date);
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
    for (var k in kw_local_list) { // var i = 0; i < enabled_kw_list.length; i++
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

        li_node.appendChild(li_string);
        logger.debug("is the local KW list within the 'enabled' list?");
        logger.debug(enabled_kw_list);
        logger.debug(list_id);
        if (enabled_kw_list.indexOf(list_id) > -1) {
            logger.debug("yes");
            span_node.innerHTML = '&radic;';
            $(span_node).attr({
                onmouseover: "$(this.parentElement).addClass('w3-hover-blue');",
                onmouseout: "$(this.parentElement).removeClass('w3-hover-blue');",
                class: "mark_enabled w3-green w3-button w3-display-right",
                onclick: "$(this.parentElement).toggleClass('kw-list-enabled'); $(this).toggleClass('w3-red'); $(this).toggleClass('w3-green'); $(this).toggleClass('mark_enabled'); if ($(this).hasClass('mark_enabled')) { this.innerHTML = '&radic;'; } else { this.innerHTML = '&times;'; }; "
            });
            $(li_node).attr({
                "data-id": list_id,
                class: "w3-display-container kw-list-enabled"
            });
        }
        else {
            logger.debug("no");
            span_node.innerHTML = '&times;';
            $(span_node).attr({
                onmouseover: "$(this.parentElement).addClass('w3-hover-blue');",
                onmouseout: "$(this.parentElement).removeClass('w3-hover-blue');",
                class: "w3-red w3-button w3-display-right",
                onclick: "$(this.parentElement).toggleClass('kw-list-enabled'); $(this).toggleClass('w3-red'); $(this).toggleClass('w3-green'); $(this).toggleClass('mark_enabled'); if ($(this).hasClass('mark_enabled')) { this.innerHTML = '&radic;'; } else { this.innerHTML = '&times;'; }; "
            });
            $(li_node).attr({
                "data-id": list_id,
                class: "w3-display-container"
            });
        }

        li_node.appendChild(span_node);

        logger.debug("settings local list elemnt into list....");
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

        if (localsArr.indexOf(list_id) > -1){
            logger.warn("The list '" + list_id + "' is already loaded/local!");
            continue;
        }
        else {
            logger.info("The list '" + list_id + "' is not loaded/local!");
            if (lang_groups.indexOf(lang) > -1) {
                //logger.debug("already have a GROUP in kw list: " + lang);
                //logger.debug("creating option-element: " + langlast);
                var option_elem = document.createElement("option");
                var option_string = document.createTextNode(langlast);
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
                var option_elem = document.createElement("option");
                var option_string = document.createTextNode(langlast);
                $(option_elem).append(option_string);

                $("#kw-list-available-choose optgroup[label='" + lang + "']").append(option_elem);

            }
        }
    }

    //
    set_kw_list_available_select();
    set_app_lang_selector();
}

function saveSettings() {
    logger.debug("saveSettings");
    var applang = $("#app-lang-selector").val();
    var apppath = remote.app.getPath('userData');
    var enabledKW = [];
    var options1 = {
        name: "app-configuration",
        cwd: apppath
    }
    const store1 = new Store(options1);
    if (applang !== "") {
        store1.set("app-lang", applang);
    }
    else {
        logger.info("No language chosen in settings...");
    }

    var options2 = {
        name: "keyword-config",
        cwd: path.join(apppath, 'keywordlists')
    }
    const store2 = new Store(options2);
    logger.debug("getting enabled local lists...");
    $("#settings-local-kw-lists .kw-list-enabled").each(function (i) {
        var kw_list_id = $(this).attr("data-id");
        enabledKW.push(kw_list_id);
        //logger.debug("ADDED: " + kw_list_id);
    });
    store2.set("enabled-keywordlists", enabledKW);

    setupKWSelector();
}

function setupKWSelector() {
    var enabledKW = [];
    var apppath = remote.app.getPath('userData');

    $("#KW-selector").empty();
    $("#KW-selector").append(document.createElement("option"));

    logger.debug("getting enabled local lists...");
    $("#settings-local-kw-lists .kw-list-enabled").each(function (i) {
        var kw_list_id = $(this).attr("data-id");
        enabledKW.push(kw_list_id);
        //logger.debug("ADDED: " + kw_list_id);
    });

    var kw_base = path.join(apppath, 'keywordlists');
    var kw_groups = [];
    var kw_current_group = "";
    logger.debug("GOING TO LOOP enabledKW now....");
    for (var i = 0; i < enabledKW.length; i++) {
        //logger.debug("Round: " + i);

        let loadedlist = [];
        if (fs.existsSync(path.join(kw_base, enabledKW[i] + '.json'))) {
            logger.info("KW file '" + enabledKW[i] + "' located!");
            try {
                //logger.debug("TRYING TO GET KW FILE CONTENTS AND LOOP 'EM");
                loadedlist = require(path.join(kw_base, enabledKW[i] + '.json'));
                for (var k in loadedlist) {
                    //logger.debug("in loop now. current: " + k);
                    if (loadedlist.hasOwnProperty(k)) {
                        var kw_tag = k;
                        var kw_itself = loadedlist[k];
                        if (Object.keys(loadedlist).indexOf(k) === 0) {//loadedlist.indexof(k) === 0) {// skipping 0, because that is the name
                            //logger.debug(kw_itself);
                            kw_current_group = kw_itself;//.substring(kw_itself.split(' - ')[0].length + 3, kw_itself.length);
                            //logger.debug("First line! taking name...: " + kw_current_group);
                            continue;
                        }
                        if (kw_groups.indexOf(kw_current_group) > -1) {
                            //logger.debug("Group seems to exist: " + kw_current_group);
                            var option_elem = document.createElement("option");
                            var option_text = document.createTextNode(kw_itself);
                            //logger.debug("KW ITSELF: " + kw_itself);
                            //logger.debug("KW TAG: " + kw_tag);
                            $(option_elem).attr({
                                value: kw_tag
                            });
                            $(option_elem).append(option_text);
                            $("#KW-selector optgroup[label='" + kw_current_group + "']").append(option_elem);
                            //logger.debug("#KW-selector optgroup[label='" + kw_current_group + "']");
                        }
                        else {
                            //logger.debug("Group seems to NOT exist: " + kw_current_group);
                            kw_groups.push(kw_current_group);
                            var optgroup_elem = document.createElement("optgroup");
                            $(optgroup_elem).attr({
                                label: kw_current_group
                            });
                            $("#KW-selector").append(optgroup_elem);

                            var option_elem = document.createElement("option");
                            var option_text = document.createTextNode(kw_itself);
                            //logger.debug("KW ITSELF: " + kw_itself);
                            //logger.debug("KW TAG: " + kw_tag);
                            $(option_elem).attr({
                                value: kw_tag
                            });
                            $(option_elem).append(option_text);
                            $("#KW-selector optgroup[label='" + kw_current_group + "']").append(option_elem);
                            //logger.debug("#KW-selector optgroup[label='" + kw_current_group + "']");
                        }
                    }
                }
            } catch (err) {
                logger.error("Failed to load '" + enabledKW[i] + ".json' KW file...");
                logger.error(err.message);
                $("#settings-local-kw-lists li['data-id'='" + enabledKW[i] + "'] span").trigger("click");
            }
        }
        else {
            logger.warn("No desired KW-file found in keywords directory!");
            $("#settings-local-kw-lists li[data-id='" + enabledKW[i] + "'] span").trigger("click");
        }
    }
    // here you update kw-selector in case of same words in current file
    $("#file-chosen-kw-ul li").each(function (i) {//"#KW-selector"
        logger.debug("TESTING IF THE CURRENT FILE SELECTED KW ARE PRESENT IN SELECT-LIST");
        var kw_identificator = $(this).attr("data-value");
        $("#KW-selector option").each(function (i) {
            // FRIENDSHIP IS MAGIC!
            if ($(this).attr("") === kw_identificator) {
                // same and nice :3
                $(this).attr("disabled", "disabled");
            }
        });
    });
    $("#KW-selector").select2({
        language: "current_lang",
        placeholder: i18n.__('select2-kw-add-ph')
    });
}

// nEEDS UPDATE
function sortListElem(list) {  // REPLACED BY LIST.JS!!!!!!!!!! NPM
    //
}

/* These set up SELECT boxes :) */
function set_KW_choose_selector() {
    logger.debug("set_KW_choose_selector");
    $("#KW-selector").select2({
        language: "current_lang",
        placeholder: i18n.__('select2-kw-add-ph')
    });
    $('#KW-selector').on("select2:select", function (e) {
        //console.log(e);
        //console.log(this);
        var kw_value = e.params.data.id;
        var kw_text = e.params.data.text;
        //logger.debug("VALUE: "+kw_value + " # TEXT: " + kw_text);
        $('#KW-selector').val(null).trigger("change");
        $("#KW-selector option[value='" + kw_value + "']").attr('disabled', 'disabled');

        var li_string = document.createTextNode(kw_text);
        var li_node = document.createElement("li");
        var span_node = document.createElement("span");

        li_node.appendChild(li_string);
        span_node.innerHTML = "&times;";

        $(li_node).attr({
            class: "w3-display-container",
            "data-value": kw_value
        });

        $(span_node).attr({
            style: "height: 100%;",
            class: "w3-button w3-display-right",
            onmouseover: "$(this.parentElement).addClass('w3-hover-blue');",
            onmouseout: "$(this.parentElement).removeClass('w3-hover-blue');",
            onclick: "$(\"#KW-selector option[value = '" + kw_value + "']\").removeAttr('disabled', 'disabled'); $(this.parentElement).remove(); $(\"#KW-selector\").select2({language: \"current_lang\",placeholder: i18n.__('select2-kw-add-ph')});"
        });

        li_node.appendChild(span_node);

        $('#file-chosen-kw-ul').append(li_node);

        $("#KW-selector").select2({
            language: "current_lang",
            placeholder: i18n.__('select2-kw-add-ph')
        });
    });
    $('#KW-selector').prop("disabled", true);
}
function set_app_lang_selector() {
    logger.debug("set_app_lang_selector");
    fs.readdirSync(path.join(__dirname,"..\\translations")).forEach(file => {
        if (file.split('.').pop() === "js") { return; }
        var lang = getFullLangName(file.split('.')[0]);
        if (lang === null) {
            logger.warn("Requested language not defined in getFullLangName function!! Using placeholder 'NOT_DEFINED'...");
            lang = "NOT_DEFINED";
        }
        $("#app-lang-selector").append('<option value="' + file.split('.')[0] + '">' + lang + '</option>');
    });

    $("#app-lang-selector").select2({
        language: "current_lang",
        placeholder: i18n.__('select2-app-lang-ph'),
        minimumResultsForSearch: Infinity
    });
    ///////////////////////////// BECAUSE NOT YET WORKING
    $("#app-lang-selector").prop("disabled", true);
    ////////////////////////////
}
function getFullLangName(lang_short) {
    logger.debug("getFullLangName");
    var lang_full = null;

    switch (lang_short) {
        case "en":
            lang_full = "English";
            break;
        case "fi":
            lang_full = "Suomi";
            break;
        default:
            //
    } 
    return lang_full;
}
function set_kw_list_available_select() { 
    logger.debug("set_kw_list_available_select");
    $("#kw-list-available-choose").select2({
        language: "current_lang",
        placeholder: i18n.__('select2-kw-list-ph')
    });
}

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
    logger.debug("toggleViewMode: "+mode);
    if (mode === 0) {
        setFooterBtnValue("start");
        setViewButtonSets("start");

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
        setViewButtonSets("preview");

        $("#addfilebutton").removeClass("element-disabled");
        $("#saveprojbutton").removeClass("element-disabled");

        $("#closeprojbutton").removeClass("element-disabled");
        $("#projinfobutton").removeClass("element-disabled");
        $("#loginbutton").removeClass("element-disabled");
        $("#settingsbutton").removeClass("element-disabled");
        $("#projstartbutton").removeClass("element-disabled");

        if (window.currentFile === undefined) {
            //$("#proj-files-ul").addClass("element-disabled");
            $("#file-chosen-kw-ul").addClass("element-disabled");
        }
        else {
            $("#proj-files-ul").removeClass("element-disabled");
            $("#file-chosen-kw-ul").addClass("element-disabled");
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
        setViewButtonSets("editA");

        $("#addfilebutton").addClass("element-disabled");
        $("#saveprojbutton").addClass("element-disabled");

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
        setViewButtonSets("editB");

        $("#addfilebutton").addClass("element-disabled");
        $("#saveprojbutton").addClass("element-disabled");

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
        setViewButtonSets("editC");

        $("#addfilebutton").addClass("element-disabled");
        $("#saveprojbutton").addClass("element-disabled");

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
        setViewButtonSets("login");

        $("#addfilebutton").addClass("element-disabled");
        $("#saveprojbutton").addClass("element-disabled");

        $("#start-div").removeClass("is-shown");
        $("#preview-div").removeClass("is-shown");
        $("#edita-div").removeClass("is-shown");
        $("#editb-div").removeClass("is-shown");
        $("#editc-div").removeClass("is-shown");
        $("#logreg-div").addClass("is-shown");
        $("#settings-div").removeClass("is-shown");
        $("#information-div").removeClass("is-shown");
        $("#create-proj-div").removeClass("is-shown");

        $("#loginchoices_1").removeClass("no-display");
        $("#loginchoices_2").removeClass("no-display");
        $("#registerchoices_1").addClass("no-display");
        $("#registerchoices_2").addClass("no-display");

        $("#login-username").val("");
        $("#login-pass").val("");
        $("#login-register-title").text("Login");

        $("#forgot_password_choices").addClass("no-display");
    }
    else if (mode === 6) {
        setFooterBtnValue("register");
        setViewButtonSets("register");

        $("#addfilebutton").addClass("element-disabled");
        $("#saveprojbutton").addClass("element-disabled");

        $("#start-div").removeClass("is-shown");
        $("#preview-div").removeClass("is-shown");
        $("#edita-div").removeClass("is-shown");
        $("#editb-div").removeClass("is-shown");
        $("#editc-div").removeClass("is-shown");
        $("#logreg-div").addClass("is-shown");
        $("#settings-div").removeClass("is-shown");
        $("#information-div").removeClass("is-shown");
        $("#create-proj-div").removeClass("is-shown");

        $("#loginchoices_1").addClass("no-display");
        $("#loginchoices_2").removeClass("no-display");
        $("#registerchoices_1").removeClass("no-display");
        $("#registerchoices_2").removeClass("no-display");

        $("#register-username").val("");
        $("#register-email").val("");
        $("#register-realname").val("");
        $("#login-pass").val("");
        $("#register-retype-pass").val("");
        $("#login-register-title").text("Register");

        $("#forgot_password_choices").addClass("no-display");
    }
    else if (mode === 7) {
        setFooterBtnValue("settings");
        setViewButtonSets("settings");

        $("#addfilebutton").addClass("element-disabled");
        $("#saveprojbutton").addClass("element-disabled");

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
        //$("#subB9").toggleClass("element-disabled");// just because, well, you'd be stuck :D
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
        setViewButtonSets("information");

        $("#addfilebutton").addClass("element-disabled");
        $("#saveprojbutton").addClass("element-disabled");

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
        setViewButtonSets("create-proj");

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
    else if (mode === 14){
        //forgot password
        setFooterBtnValue("forgotPW");
        setViewButtonSets("forgotPW");

        $("#addfilebutton").addClass("element-disabled");
        $("#saveprojbutton").addClass("element-disabled");

        $("#start-div").removeClass("is-shown");
        $("#preview-div").removeClass("is-shown");
        $("#edita-div").removeClass("is-shown");
        $("#editb-div").removeClass("is-shown");
        $("#editc-div").removeClass("is-shown");
        $("#logreg-div").addClass("is-shown");
        $("#settings-div").removeClass("is-shown");
        $("#information-div").removeClass("is-shown");
        $("#create-proj-div").removeClass("is-shown");

        $("#loginchoices_1").addClass("no-display");
        $("#loginchoices_2").addClass("no-display");
        $("#registerchoices_1").addClass("no-display");
        $("#registerchoices_2").addClass("no-display");

        $("#forgot_password_choices").removeClass("no-display");
        $("#forgot-email").val("");
        $("#login-register-title").text("Forgot Password?");
    }
    else {
        // If you end up here, blame the incompetent programmer
        logger.error("Error! Invalid parameter to toggleViewMode-function");
    }
}

/*
function continueQueue() {
    var files_left = window.fileQueue.length;
    if (files_left >= 1) {
        toggleViewMode(0);
        clearElements();
        readFile(window.fileQueue);
    }
    else if (files_left === 0) {

        var options = {
            type: 'info',
            title: window.i18n.__('queue-empty-conf-title'),
            message: window.i18n.__('queue-empty-conf-cont'),
            buttons: [window.i18n.__('conf-ok')]
        };

        dialog.showMessageBox(firstWindow, options, function (index) {
            clearElements();
            toggleViewMode(1);
        });
    }
    else {
        logger.error("Unable to continue into the next file in queue!");
    }
}
*/

/*
function updateFileQueue(files) {
    //console.log(files);
    var filename = null;
    if (files.length > 0) {
        filename = files.pop();
        window.fileQueue = files;
        //console.log("ASD 1");
        $("#file-queue-counter-value").text(window.fileQueue.length);
    }
    else {
        //console.log("ASD 2");
        $("#file-queue-counter-value").text(window.fileQueue.length);
    }
    return filename;
}
*/

function clearElements() {
    logger.debug("clearElements");
    $("#proj-files-ul").empty();
    $("#proj-notes-ul").empty();
    $("#file-chosen-kw-ul").empty();
    $("#proj-info-kw-ul").empty();
    $("#proj-info-files-ul").empty();

    $("#preview-preview-A").empty();
    $("#preview-preview-B").empty();
    $("#preview-preview-C").empty();

    $("#edit-A-edit-text").empty();
    $("#edit-A-orig-text").empty();
    $("#edit-B-edit-text").empty();
    $("#edit-B-orig-text").empty();
    $("#edit-C-edit-text").empty();
    $("#edit-C-orig-text").empty();

    $("#file-censored-A-ul").empty();
    $("#file-censored-B-ul").empty();
    $("#file-censored-C-ul").empty();
}

function addFilesPrompt(project_name) {
    logger.debug("addFilesPrompt");
    var docpath = remote.app.getPath('documents');
    var options = {
        title: i18n.__('open-file-prompt-window-title'),
        defaultPath: docpath,
        filters: [
            { name: 'Spreadsheet', extensions: ['csv', 'xls', 'xlsx'] }
        ],
        properties: ['openFile',
            'multiSelections'
        ]
    }
    function callback(fileNames) {

        if (fileNames !== undefined) {
            //console.log(fileNames);
            //readFile(fileNames);
            fileNames.push(project_name);
            sourceFiles2ProjAsync(fileNames);
            return;
        }
        logger.warn("No file(s) chosen to be opened!");
    }
    dialog.showOpenDialog(firstWindow, options, callback);
}

///NEEDS UPDATE
if (enable_onclicks) {
    document.getElementById("save-file-prompt").onclick = function () {
        //console.log("SAVE CLICKED");
        var options = {
            title: window.i18n.__('save-prompt-window-title'),
            //defaultPath: THIS MUST BE SET
            filters: [
                { name: 'CSV spreadsheet', extensions: ['csv'] }
            ]
        }
        function callback(fileName) {
            if (fileName !== undefined) {
                removeCensored();
                var content = parse_content2Array();
                //console.log(content);
                writeFile_csv(fileName, content);
                continueQueue();
                return;
            }
            logger.warn("No file chosen to be saved!");

        }
        dialog.showSaveDialog(firstWindow, options, callback);
    }
}

/* Turns .word with .censored class into " **** " */
function removeCensored() {
    logger.debug("removeCensored");
    //Section A
    $("#preview-preview-A .secA-Q-allA .censored").each(function (i) {
        $(this).text("*****");
    });
    //Section B
    $("#preview-preview-B .secB-Q-allA .censored").each(function (i) {
        $(this).text("*****");
    });
    //Section C

    $("#preview-preview-C .secC-Q-allA .censored").each(function (i) {
        $(this).text("*****");
    });

}

///NEEDS UPDATE
/* This function parses data for textareas that are CURRENTLY USED
        => Will be changed */
function showQuizData(data) {
    //console.log("INSIDE SHOW QUIZ DATA");
    showCsecData(data); //, 4, data[0].length - 1);
    var result = [];
    if (data[2] === undefined) {
        //console.log(data[2]);
        logger.warn("Third line (keywords) is not available in current file!");
    }
    else {
        result = data[2];
    }

    var data_A = data[1][2];
    var data_B = data[1][3];
    $("#secAcontent").text(data_A);
    $("#secBcontent").text(data_B);

    $("#aside-subID-value").text(data[1][0]);
    $("#aside-subTIME-value").text(data[1][1]);

    return result;
}

///NEEDS UPDATE
/* This function puts C section answers into right places */
function showCsecData(section_data) {
    //console.log("#############");
    var line = 1;
    for (var i = 4; i < section_data[1].length - 1; i++) {
        //console.log(section_data[1][i]);
        var lineId = "#secC-Q" + line + "-cont";
        $(lineId).text(section_data[1][i]);
        line++;
    }
}

///NEEDS UPDATE
/* This function shows pre-selected words from the file */
function loadKeyWords(keys) {
    for (var i = 0; i < keys.length; i++) {
        var to_appended = '<li class="list-keys-elem">' + keys[i] + '</li>';
        $("#aside-key-list").append(to_appended);
        paintEmAll(keys[i], 0);
    }
    updateKeywordsList();
}

///NEEDS UPDATE
function updateKeywordsList() {
    var elements = [];
    $("#aside-key-list li").each(function (i) {
        elements.push($(this).text());
    });
    elements.sort();
    $("#aside-key-list").empty();

    for (var i = 0; i < elements.length; i++) {
        var to_appended = '<li class="list-keys-elem">' + elements[i] + '</li>';
        $("#aside-key-list").append(to_appended);
    }
}

function updateCensoredList() {
    logger.debug("updateCensoredList");
    $("#file-censored-A-ul").empty();
    $("#file-censored-B-ul").empty();
    $("#file-censored-C-ul").empty();
    //Section A
    $("#edit-A-orig-text .censored").each(function (i) {
        var to_appended = '<li class="w3-display-container">' + $(this).text() + '</li>';
        $("#file-censored-A-ul").append(to_appended);
    });
    //Section B
    $("#edit-B-orig-text .censored").each(function (i) {
        var to_appended = '<li class="w3-display-container">' + $(this).text() + '</li>';
        $("#file-censored-B-ul").append(to_appended);
    });
    //Section C
    $("#edit-C-orig-text .censored").each(function (i) {
        var to_appended = '<li class="w3-display-container">' + $(this).text() + '</li>';
        $("#file-censored-C-ul").append(to_appended);
    });
}

///NEEDS UPDATE
/* True if is found, false otherwise */
function testKeywordList(word) {

    var found = false;

    $("#aside-key-list li").each(function (i) {
        //var index = $(this).index();
        var text_cont = $(this).text();
        if (text_cont === word) {
            found = true;
        }
    });
    return found;
}

///NEEDS UPDATE
// mode 0 = paint all words as "keys"; mode 1 = remove "keys" marks from words
function paintEmAll(word, mode) {
    //Section A
    $("#secAcontent .word").each(function (i) {
        var current_w = $(this).text();
        if ((current_w.toLowerCase() === word.toLowerCase()) && !($(this).hasClass("censored"))) {
            if (mode === 0) { $(this).addClass("underlined"); }
            if (mode === 1) { $(this).removeClass("underlined"); }
        }
    });
    //Section B
    $("#secBcontent .word").each(function (i) {
        var current_w = $(this).text();
        if ((current_w.toLowerCase() === word.toLowerCase()) && !($(this).hasClass("censored"))) {
            if (mode === 0) { $(this).addClass("underlined"); }
            if (mode === 1) { $(this).removeClass("underlined"); }
        }
    });
    //Section C

    $("#secCtext-content .word").each(function (i) {
        var current_w = $(this).text();
        if ((current_w.toLowerCase() === word.toLowerCase()) && !($(this).hasClass("censored"))) {
            if (mode === 0) { $(this).addClass("underlined"); }
            if (mode === 1) { $(this).removeClass("underlined"); }
        }
    });

}

// SETTING UP SELECTING WORDS
function setupCensorSelect() {
    logger.debug("setupCensorSelect");

    $("#edit-A-edit-text .word").on("click", function () {
        //console.log($("#secBcontent").text());
        var clicked = $(this).text();
        logger.debug("CLIECKED: "+clicked);
        if ($(this).hasClass("censored")) {
            $(this).removeClass("censored");
            logger.debug("REMOVE censored");
        }
        else {
            $(this).addClass("censored");
            logger.debug("ADDING censored");
        }
    });
    $("#edit-B-edit-text .word").on("click", function () {
        //console.log($("#secBcontent").text());
        var clicked = $(this).text();
        logger.debug("CLIECKED: " + clicked);
        if ($(this).hasClass("censored")) {
            $(this).removeClass("censored");
            logger.debug("REMOVE censored");
        }
        else {
            $(this).addClass("censored");
            logger.debug("ADDING censored");
        }
    });
    $("#edit-C-edit-text .word").on("click", function () {
        //console.log($("#secBcontent").text());
        var clicked = $(this).text();
        logger.debug("CLIECKED: " + clicked);
        if ($(this).hasClass("censored")) {
            $(this).removeClass("censored");
            logger.debug("REMOVE censored");
        }
        else {
            $(this).addClass("censored");
            logger.debug("ADDING censored");
        }
    });
        }

///NEEDS UPDATE
// make array that will be then used to make new csv file
function parse_content2Array() {
    logger.debug("parse_content2Array");
    var orig_data = window.currentFileContent;

    var sectionA_text = $("#secAcontent").text();
    var sectionB_text = $("#secBcontent").text();
    var sectionC_arr;
    var keywords = [];
    $("#aside-key-list li").each(function (i) {
        keywords.push($(this).text());
    });

    $("#secC-Q1-cont___secC-Q14-cont").each(function (i) {
        keywords.push($(this).text());
    });

    var finalData = orig_data;
    finalData[1][2] = sectionA_text;
    finalData[1][3] = sectionB_text;

    for (var i = 1; i < 15; i++) {

        finalData[1][i + 3] = $("#secC-Q" + i + "-cont").text();
    }

    finalData[2] = keywords;

    return finalData;
}

///NEEDS UPDATE
/* THIS IS SETTING UP UI TRANSLATION */
function setupTranslations() {
    logger.debug("setupTranslations(init.js)");
    logger.info("Loading translations into UI...");
    /* Start */
    //

    /* Login */
    //

    /* Main-window */
    $("#titlebar-appname").text("DECSV {Alpha version " + remote.app.getVersion() + "}");
}