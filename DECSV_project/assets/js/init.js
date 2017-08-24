const remote = require('electron').remote;
const { ipcRenderer } = require('electron')
const BrowserWindow = remote.BrowserWindow;
const dialog = remote.dialog;
const firstWindow = remote.getCurrentWindow();
const fs = require('fs');
const XLSX = require('xlsx');
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

document.getElementById("addfilebutton").onclick = function () {
    logger.debug("addfile button");
    //
    var proj_name = window.currentProject;
    addFilesPrompt(proj_name);
}

document.getElementById("projinfobutton").onclick = function () {
    logger.debug("projinfo button");
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
    //confirmation, saving etc.
    window.currentProject = undefined;
    setViewButtonSets("project-closed");
    clearElements();
    $("#titlebar-appname").text("DECSV {Alpha version " + remote.app.getVersion() + "}")
    toggleViewMode(0);
    toggleViewMode(10);
}

document.getElementById("settingsbutton").onclick = function () {
    logger.debug("settings button");
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
    }
    else if (value === "editB") {
        toggleViewMode(1);
        toggleViewMode(9);
        // save B edits and update preview
    }
    else if (value === "editC") {
        toggleViewMode(1);
        toggleViewMode(9);
        // save C edits and update preview
    }
    else if (value === "login") {
        //login
    }
    else if (value === "register") {
        //register
    }
    else if (value === "settings") {
        //save
    }
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
    }
    else if (value === "editB") {
        toggleViewMode(1);
        toggleViewMode(9);
        //cancel editmode B
    }
    else if (value === "editC") {
        toggleViewMode(1);
        toggleViewMode(9);
        //cancel editmode C
    }
    else if (value === "register") {
        toggleViewMode(5);
        toggleViewMode(10);
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
        $("#footer-nav-btn5").text("Mark as Done / Not Done");
        $("#footer-nav-btn6").text("Next file");
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
        $("#footer-nav-btn4").addClass("no-display");
        $("#footer-nav-btn5").addClass("no-display");
        $("#footer-nav-btn6").addClass("no-display");

        $("#footer-nav-btn3").text("Save");
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
        logger.debug("BACK FROM APP");
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
        
        f2p_store.set("source-files", dirfiles);

        ipcRenderer.removeAllListeners('async-import-files-reply');
    });
    logger.debug("SENDING ASYNC TO MAIN APP!");
    var send_arg = [];
    send_arg.push(files);
    send_arg.push(pre_dirfiles);
    logger.debug("##################################");
    logger.debug(files);
    logger.debug(pre_dirfiles);
    ipcRenderer.send('async-import-files', send_arg);
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

                            var temp_files = open_store.get("temp-files", null);
                            console.log(temp_files);

                            for (var k in temp_files) {
                                console.log("1: " + k);
                                if (temp_files.hasOwnProperty(k)) {
                                    console.log("2: " + temp_files[k]);
                                }
                            }

                            var kw_per_file = open_store.get("kw-per-file", null);
                            console.log(kw_per_file);


                            for (var k in kw_per_file) {
                                console.log("#1: " + k);
                                if (kw_per_file.hasOwnProperty(k)) {
                                    console.log("#2: " + kw_per_file[k]);

                                    for (var j in kw_per_file[k]) {
                                        console.log("#3: " + j);
                                        if (kw_per_file[k].hasOwnProperty(j)) {
                                            console.log("#4: " + kw_per_file[k][j]);
                                        }
                                    }


                                }
                            }

                            var proj_notes = open_store.get("notes", null);
                            console.log("NOTES: " + proj_notes);
                            for (var i = 0; i < proj_notes.length; i++) {
                                console.log(i + "  " + proj_notes[i]);
                                addProjNote(proj_notes[i]);
                            }
                            window.currentProject = proj_name;
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

// NEEDS UPDATE
// Add given filename + details into ul element
function addProjFile(file) {
    //
}

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
        logger.debug("VALUE: "+kw_value + " # TEXT: " + kw_text);
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

        $("#start-div").removeClass("is-shown");
        $("#preview-div").removeClass("is-shown");
        $("#edita-div").removeClass("is-shown");
        $("#editb-div").removeClass("is-shown");
        $("#editc-div").removeClass("is-shown");
        $("#logreg-div").removeClass("is-shown");
        $("#settings-div").addClass("is-shown");
        $("#information-div").removeClass("is-shown");
        $("#create-proj-div").removeClass("is-shown");

        $("#app-lang-selector").val(null).trigger("change");
        $("#kw-list-available-choose").val(null).trigger("change");
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
    }
    else if (mode === 14){
        //forgot password
        setFooterBtnValue("forgotPW");
        setViewButtonSets("forgotPW");

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

///NEEDS UPDATE
/* Turns .word with .censored class into " **** " */
function removeCensored() {
    //Section A
    $("#secAcontent .censored").each(function (i) {
        $(this).text("*****");
    });
    //Section B
    $("#secBcontent .censored").each(function (i) {
        $(this).text("*****");
    });
    //Section C

    $("#secCtext-content .censored").each(function (i) {
        $(this).text("*****");
    });

}

// Return array of string values, or NULL if CSV string not well formed.
function CSVtoArray(text) {
    var re_valid = /^\s*(?:'[^'\\]*(?:\\[\S\s][^'\\]*)*'|"[^"\\]*(?:\\[\S\s][^"\\]*)*"|[^,'"\s\\]*(?:\s+[^,'"\s\\]+)*)\s*(?:,\s*(?:'[^'\\]*(?:\\[\S\s][^'\\]*)*'|"[^"\\]*(?:\\[\S\s][^"\\]*)*"|[^,'"\s\\]*(?:\s+[^,'"\s\\]+)*)\s*)*$/;
    var re_value = /(?!\s*$)\s*(?:'([^'\\]*(?:\\[\S\s][^'\\]*)*)'|"([^"\\]*(?:\\[\S\s][^"\\]*)*)"|([^,'"\s\\]*(?:\s+[^,'"\s\\]+)*))\s*(?:,|$)/g;
    // Return NULL if input string is not well formed CSV string.
    if (!re_valid.test(text)) {
        return null;
    }
    var arr = [];                     // Initialize array to receive values.
    text.replace(re_value, // "Walk" the string using replace with callback.
        function (m0, m1, m2, m3) {
            // Remove backslash from \' in single quoted values.
            if (m1 !== undefined) arr.push(m1.replace(/\\'/g, "'"));
            // Remove backslash from \" in double quoted values.
            else if (m2 !== undefined) {
                arr.push(m2.replace(/\\"/g, '"'));
            }
            else if (m3 !== undefined) {
                arr.push(m3);
            }
            return ''; // Return empty string.
        });
    // Handle special case of empty last value.
    if (/,\s*$/.test(text)) {
        arr.push('');
    }
    return arr;
}

/* This function takes in raw data from read .csv file and turns it into arrays */
function parseCSV2Array(csv) {
    //console.log("RAW CSV DATA IN");
    //console.log(csv);
    var separators = ['\"\",\"\"', ',\"\"', '\"\"'];
    var newlines = ['\r\n', '\n'];

    //console.log(typeof (csv));
    //var lines = csv.split("\n");
    var lines = csv.split(new RegExp(newlines.join('|'), 'g'));
    //console.log(JSON.stringify(lines[0]));

    lines[0] = lines[0].substring(1, lines[0].length - 3);
    //console.log(JSON.stringify(lines[0]));
    lines[1] = lines[1].substring(1, lines[1].length - 3);
    //console.log(JSON.stringify(lines[1]));
    if (lines[2].length !== 0) {
        lines[2] = lines[2].substring(1, lines[2].length - 3);
    }

    var headers = lines[0].split(new RegExp(separators.join('|'), 'g'));
    var contents = lines[1].split(new RegExp(separators.join('|'), 'g'));
    if (lines[2].length !== 0) {
        var keys = lines[2].split(new RegExp(separators.join('|'), 'g'));
    }
    //console.log(">>>>>>>>>>>>>>>>>>>>>>>>HEADERS");
    //console.log(headers);
    //console.log(">>>>>>>>>>>>>>>>>>>>>>>>CONTENTS");
    //console.log(contents);

    var result = new Array(); //was Array(2)
    var i = 0;
    for (i = 0; i < 2; i++) {
        result[i] = [];
    }
    if (lines[2].length !== 0) {
        result[2] = [];
    }

    //result[0][0] = headers[0];
    for (i = 0; i < headers.length; i++) {
        result[0][i] = headers[i];
    }
    for (i = 0; i < contents.length; i++) {
        result[1][i] = contents[i];
    }
    if (lines[2].length !== 0) {
        for (i = 0; i < keys.length; i++) {
            result[2][i] = keys[i];
        }
    }

    return result;
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

///NEEDS UPDATE
function updateCensoredList() {
    $("#final-censoredwords-list").empty();
    //Section A
    $("#secAcontent .censored").each(function (i) {
        var to_appended = '<li class="list-censored-elem">' + $(this).text() + '</li>';
        $("#final-censoredwords-list").append(to_appended);
    });
    //Section B
    $("#secBcontent .censored").each(function (i) {
        var to_appended = '<li class="list-censored-elem">' + $(this).text() + '</li>';
        $("#final-censoredwords-list").append(to_appended);
    });
    //Section C

    $("#secCtext-content .censored").each(function (i) {
        var to_appended = '<li class="list-censored-elem">' + $(this).text() + '</li>';
        $("#final-censoredwords-list").append(to_appended);
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

///NEEDS UPDATE
// SETTING UP SELECTING KEYWORDS
function setupKeywordSelect(arr_l, keys_arr) {
    $("#secAcontent").html(function (index, oldHtml) {
        return oldHtml.replace(/\b(\w+?)\b/g, '<span class="word">$1</span>');
    });
    $("#secBcontent").html(function (index, oldHtml) {
        return oldHtml.replace(/\b(\w+?)\b/g, '<span class="word">$1</span>');
    });
    for (var i = 1; i < (arr_l - 2); i++) {
        var lineId = "#secC-Q" + i + "-cont";
        //console.log(lineId);
        $(lineId).html(function (index, oldHtml) {
            return oldHtml.replace(/\b(\w+?)\b/g, '<span class="word">$1</span>');
        });
    }

    $(".word").on("click", function () {
        //console.log($("#secBcontent").text());
        var clicked = "";
        if ($(this).hasClass("underlined")) {
            $(this).toggleClass("underlined");
            $(this).toggleClass("censored");
            updateCensoredList();
            paintEmAll($(this).text(), 1);
            clicked = $(this).text().toLowerCase();
            $("#aside-key-list li").each(function (i) {
                //var index = $(this).index();

                var text_cont = $(this).text();
                if (text_cont === clicked) {
                    $(this).remove();
                }

            });

        }
        else if ($(this).hasClass("censored")) {
            $(this).removeClass("censored");
            updateCensoredList();
            //go through list that is at the side->
            if (testKeywordList($(this).text())) { paintEmAll($(this).text(), 0); }
        }
        else {
            $(this).addClass("underlined");
            paintEmAll($(this).text(), 0);
            clicked = $(this).text().toLowerCase();
            var found = testKeywordList(clicked);
            console.log(found);
            console.log(clicked);


            if (!found) {
                var to_appended = '<li class="list-keys-elem">' + clicked + '</li>';
                $("#aside-key-list").append(to_appended);
                updateKeywordsList();
            }
        }
    });
    if (keys_arr !== null) {
        loadKeyWords(keys_arr);
    }
}

///NEEDS UPDATE
// make array that will be then used to make new csv file
function parse_content2Array() {

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

///NEEDS UPDATE
function readFile(file) {

    /* check file-extension and name */
    var output_data = [];
    var file_ext = file.split('.').pop();
    var file_name = file.split('/').pop(); //THIS IS WRONG!!!! \\ is right

    //console.log("################################################");
    //console.log(file_ext);
    //console.log(file);



    /* file has .xlsx or .xls extension */
    if (file_ext === 'xlsx' || file_ext === 'xls') {

        /* xlsx-js */
        try {
            var workbook = XLSX.readFile(file);
        }
        catch (err) {
            logger.error("Error opening .xlsx or .xls file: "+ err.message);
            return;
        }
        var first_sheet_name = workbook.SheetNames[0];
        var worksheet = workbook.Sheets[first_sheet_name];

        var csv_sheet = XLSX.utils.sheet_to_csv(worksheet);
        //console.log("EXCEL TO CSV");
        //console.log(JSON.stringify(csv_sheet));

        /* xlsx-js continue... */
        var newlines = ['\r\n', '\n'];
        var lines = csv_sheet.split(new RegExp(newlines.join('|'), 'g'));

        var headers = CSVtoArray(lines[0]);
        var contents = CSVtoArray(lines[1]);

        var keys = null;

        if (lines[2].length !== 0){
            keys = CSVtoArray(lines[2]);
            output_data[2] = keys;
        }
        //console.log(headers);
        //console.log(contents);

        output_data[0] = headers;
        output_data[1] = contents;
        //console.log("setting data");
        window.currentFileContent = output_data;
            
        keys = showQuizData(output_data); // ALERT!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
        setupKeywordSelect(output_data[1].length, keys);// ALERT!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

    }

    /* file has .csv extension */
    else if (file_ext === 'csv') {

        /*Node.js fs*/
        fs.readFile(file, 'utf8', function (err, data) {
            if (err) {
                logger.error("Error opening .csv file: "+ err.message);
                return;
            }
            //console.log("DATA FROM READFILE");
            //console.log(JSON.stringify(data));
            //console.log(data);

            
            //console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>OMAN TULOSTUS");
            var output_data = parseCSV2Array(data);
            //console.log("setting data");
            window.currentFileContent = output_data;
            var keys = null;
            keys = showQuizData(output_data); // ALERT!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
            setupKeywordSelect(output_data[1].length, keys); // ALERT!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
        });

    }
    else {
        //what lies beyond this land...
    }
}

//////////////////////////////////////////////////////////// FUNCTIONS FOR WRITING DATA INTO FILES

/* This function takes in data that is in arrays, and then parses and writes it
into new .csv files */
function writeFile_csv(file, dataArray) {
    //writing... Array[0-1][0-x]

    //console.log("Parsing content for saving...");
    logger.info("Starting to parse array into proper csv-format...");

    var temp = "";

    //parse arrays to be like .csv file's content
    for (var i = 0; i < dataArray.length; i++) {
        if ((dataArray[2].length !== 0) && (i === 2)) {//
            temp = temp + "\"\"";//
        }//
        else {//
            temp = temp + "\"";
        }//
        //console.log(i);
        //console.log(temp);
        for (var j = 0; j < dataArray[i].length; j++) {
            //console.log(j);
            //console.log(temp);
            if (j === 0) {
                if ((dataArray[2].length !== 0) && (i === 2)){//
                    temp = temp + dataArray[i][j] + "\"\"";//
                }//
                else {//
                    temp = temp + dataArray[i][j];
                }//

            }
            else {
                var input = dataArray[i][j];
                temp = temp + ",\"\"" + input + "\"\"";
            }
        }
        temp = temp + "\"\r\n";
    }

    //testlogs...
    //console.log(file);
    //console.log(encoding);
    //console.log(temp);
    content = temp;

    //overwriting if same name at the moment!... naah. fs-dialog prompts about this before we even GET here :P
    fs.writeFile(file, content, "utf8", function (msg) {
        if (!msg) {
            //console.log(msg);
            //console.log("The file has been successfully saved");
            logger.info("File successfully saved!");
            return;
        }

        logger.error("Error while trying to save a new file!");
    });
}