'use strict';

//////////////////////////////////// CUSTOM ERROR MESSAGE
process.on('uncaughtException', (err) => {
    
    const electron = require('electron');
    const uncaugetdia = electron.dialog ? electron.dialog : electron.remote.dialog;
    const app = electron.app ? electron.app : electron.remote.app;
    const shell = electron.shell;
    logger.error("Uncaught Exception!");
    logger.error(err);
    var uncaughtoptions = {
        type: 'error',
        title: "Uncaught Exception",
        message: "Unknown error occurred!",
        detail: "Something unexpected happened! Please check wiki-page if this is a known problem:\r\n#### ERROR #####\r\n" + err,
        buttons: ["Close application", "Open Wiki"],
        browserWindow: electron.remote.getCurrentWindow()
    };

    uncaugetdia.showMessageBox(uncaughtoptions, function (index) {
        // no need to deal with anything.... just notifying user
        if (index === 1) {
            //open wiki
            shell.openExternal("https://github.com/Tyaisurm/DECSV/wiki");
            logger.error("Closing application because of error....");
            app.exit();
        } else {
            // close, do nothing
            logger.error("Closing application because of error....");
            app.exit();
        }
    });
});
////////////////////////////////////

const electron = require('electron');
const remote = electron.remote;
const ipcRenderer = electron.ipcRenderer;
const BrowserWindow = remote.BrowserWindow;
const dialog = remote.dialog;
const firstWindow = remote.getCurrentWindow();
var fileWizard = null;
const fs = require('fs');
const autoUpdater = remote.autoUpdater;
const path = require('path');
const url = require('url');

const { Menu, MenuItem } = remote;

const menu = new Menu()
menu.append(new MenuItem({ label: 'Developer Tools', click() { firstWindow.toggleDevTools()} }))

window.addEventListener('contextmenu', (e) => {
    e.preventDefault()
    menu.popup({ window: firstWindow })
}, false);

//const Store = require('electron-config');
const Store = require("electron-store");

//import intUtils from './intUtils.js';
const intUtils = require(path.join(__dirname, './intUtils.js'));
const parseUtils = require(path.join(__dirname, './parseUtils.js'));

/* so that MAIN-process stuff can be outputted to console, too */
ipcRenderer.on('output-to-chrome-console', function (event, data) {
    console.log("#%#%#%#%#% OUTPUT_CHROME %#%#%%#%#%#%");
    console.log(data);
});

/* Someone opened file with this app! */
ipcRenderer.on("force-open-project", function (event, filepath) {
    // 
    logger.info("Called open project from main process!");
    logger.info("PATH: " + filepath);
    var forceprojres = openAndViewProject(filepath);
    if (forceprojres[0]) {
        logger.info("New project (PATH)'" + filepath + "' opened successfully!");
    }
    else {
        logger.error("Failed to open new project (PATH)'" + filepath + "'! Reason: " + forceprojres[1]);
        $("#proj-open-error").text(forceprojres[1]);

        $("#proj-open-error").before($("#proj-open-error").clone(true));
        $("[id='proj-open-error']" + ":last").remove();
    }
});

/*
  
 {
 "event_0": {
			"src-file": "lahdedata_1",
			"src-data":[],
			"a": "HTML GOES HERE",
			"b": "HTML GOES HERE",
			"c": "HTML GOES HERE",
			"country": "FI",
			"lang": "fi",
			"kw": [
				"basic-2",
				"basic-39"
			],
			"done": false
		}
 }
 
 */
ipcRenderer.on("import-wiz-import-result", function (event_in, args = {}) {
    logger.debug("import-wiz-import-result");
    console.log("############### RETURNED FROM IMPORT WINDOW #######################");
    console.log(args);// for testing to see how works

    // add new content into window variable, save temp file
    var window_json = window.currentFileContent;
    //var sourcef = window_json["src-files"];
    var projectf = window_json["project-files"];

    var eventname = "event_";
    var test = true;
    var nro = 0;
    var tempename = "";
    while (test) {
        tempename = eventname + nro;
        if (!projectf.hasOwnProperty(tempename)) { test = false; logger.debug("Name '" + tempename + "' first available!"); break;}
        nro++;
    }
    //var sourcename = "";
    var elang = window_json["lang-preset"];
    var ecountry = window_json["country-preset"];
    for (var id in args) {
        var event = args[id];
        event["lang"] = elang;
        event["country"] = ecountry;
        //sourcename = event["src-file"]
        tempename = eventname + nro;
        projectf[tempename] = {};
        projectf[tempename] = event;
        logger.debug("Added tempename: '"+tempename+"' to projectf");
        nro++;
    }
    //sourcef.push(sourcename);
    window_json["project-files"] = projectf;
    //window_json["src-files"] = sourcef;
    window.currentFileContent = window_json;

    if (window.currentEvent === undefined) {
        logger.info("No event open while importing! Saving only notes..");
        let notes = [];
        $("#proj-notes-ul li").each(function (i) {
            var text = $(this).ignore("span").text();
            notes.push(text);
        });
        saveProject(0, "", "", "", [], notes, "", "", "");//mode, dataA, dataB, dataC, kw, notes, done, country, lang
    } else {
        logger.info("Event open while importing! Saving all to window and backup...");
        var country = "";
        var lang = "";
        var done = false;
        $('#proj-files-ul li.w3-yellow').each(function (i) {
            done = ($(this).attr('data-done') === "true");
            country = $("#preview-event-country-select").val();
            lang = $("#preview-event-lang-select").val();
        });


        var dataA = $("#edit-A-orig-text").html();
        var dataB = $("#edit-B-orig-text").html();
        intUtils.sectionUtils.clearCsectionUI();
        var dataC = $("#edit-C-orig-text").html();
        var dataKW = [];

        $("#file-chosen-kw-ul li").each(function (i) {
            var value = $(this).attr("data-value").substring(3);//, test.length - 1);
            $(this).find('span').remove();
            dataKW.push(value);
        });

        let notes = [];
        $("#proj-notes-ul li").each(function (i) {
            var text = $(this).ignore("span").text();
            notes.push(text);
        });
        saveProject(0, dataA, dataB, dataC, dataKW, notes, done, country, lang);//mode, dataA, dataB, dataC, kw, notes, done, country, lang
    }

    // refresh filelist from window variable
    updateFileList();
});

/* Getting global functions.... */
let aboutCreatFunc = remote.getGlobal('createAboutWin');// does not take parameters
let createDummyDialog = remote.getGlobal('createDummyDialog');// takes in calling BrowserWindow-element as parameter

/* Global settings getter and setter */
var getSettings = remote.getGlobal('getSettings');
var setSettings = remote.getGlobal('setSettings');

logger.debug("Running init...");

// listeners for UI changes, when user makes changes to event selectors...
/*
 
Need to check  Save project when edits happen in edit views...


 */
$("#preview-event-lang-select").on("select2:select", function (e) {
    logger.debug("LANGUAGE select2:select");
    logger.debug(e.params.data);
    //return;
    // save project mode 0, take data from window variable....
    if (window.currentEvent != undefined) {
        intUtils.markPendingChanges(true, window.currentFile);
        var curEventId = window.currentEvent;
        var curEvent = window.currentFileContent["project-files"][curEventId];
        // make changes here...
        curEvent.lang = e.params.data.id;
        //
        saveProject(0, curEvent.a, curEvent.b, curEvent.c, curEvent.kw, window.currentFileContent["notes"], curEvent.done, curEvent.country, curEvent.lang);//mode, dataA, dataB, dataC, kw, notes, done, country, lang
    }
});
$("#preview-event-country-select").on("select2:select", function (e) {
    logger.debug("COUNTRY select2:select");
    logger.debug(e.params.data);
    //return;
    // save project mode 0, take data from window variable....  
    if (window.currentEvent != undefined) {
        intUtils.markPendingChanges(true, window.currentFile);
        var curEventId = window.currentEvent;
        var curEvent = window.currentFileContent["project-files"][curEventId];
        // make changes here...
        curEvent.country = e.params.data.id;
        //
        saveProject(0, curEvent.a, curEvent.b, curEvent.c, curEvent.kw, window.currentFileContent["notes"], curEvent.done, curEvent.country, curEvent.lang);//mode, dataA, dataB, dataC, kw, notes, done, country, lang
    }
});
$("#KW-selector").on("select2:select", function (e) { 
    logger.debug("KW select2:select");
    logger.debug(e.params.data);
    //return;
    // save project mode 0, take data from window variable....
    // only handling saving the info to window variable here... other function handles adding list items
    if (window.currentEvent != undefined) {
        intUtils.markPendingChanges(true, window.currentFile);
        var curEventId = window.currentEvent;
        var curEvent = window.currentFileContent["project-files"][curEventId];
        // make changes here...
        curEvent.kw.push(e.params.data.id.substring(3));
        //
        saveProject(0, curEvent.a, curEvent.b, curEvent.c, curEvent.kw, window.currentFileContent["notes"], curEvent.done, curEvent.country, curEvent.lang);//mode, dataA, dataB, dataC, kw, notes, done, country, lang
    }
});

///////////////////////////////////////////////////////// STARTUP FUNCTIONS
jquerySetup();

intUtils.selectUtils.setSettingsLoadedKW();

intUtils.selectUtils.setAppLang();

intUtils.updateSettingsUI();
//intUtils.selectUtils.setupEditKW();// Will be called after UI has been updated to get window.allsettings
intUtils.selectUtils.setCreateProjSelect();
intUtils.selectUtils.setEditSelects();

///////////////////////////////////////////////////////// 

////////////////////////////////////////////////////////////////////////////////////////////////// WINDOW CONTROL BUTTONS FUNCTIONALITY
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
    var country = "";
    var lang = "";
    var done = false;

    
    // checking if we have project and/or event open
    if (window.currentProject !== undefined) {
        logger.info("Project open while closing the main window! window.currentProject = '"+window.currentProject+"'");
        
    }
    else {
        logger.info("No open project while closing main window! Window.currentProject undefined!");
    }
    //ipcRenderer.send('set-project-status', null); 
    firstWindow.close();
}
document.getElementById('win-about-icon').onclick = function () {
    logger.debug("win-about icon/button");
    aboutCreatFunc();
}

document.getElementById("save-cur-edits-btn").onclick = function () {
    logger.debug("save current pending changes button");

    var country = "";
    var lang = "";
    var done = false;

    $('#proj-files-ul li.w3-yellow').each(function (i) {
        done = ($(this).attr('data-done') === "true");
        country = $("#preview-event-country-select").val();
        lang = $("#preview-event-lang-select").val();
    });

    // since we are closing, we need to clear the edit sections of the UI

    // clearing translations (no need to have them saved)
    $("#edit-A-orig-text .secA-Q").empty();
    $("#edit-B-orig-text .secB-Q").empty();
    for (var k = 1; k < 15; k++) {
        $("#edit-C-orig-text .secC-Q-" + k).empty();
    }

    // taking text to be saved
    var dataA = $("#edit-A-orig-text").html();
    var dataB = $("#edit-B-orig-text").html();
    intUtils.sectionUtils.clearCsectionUI();
    var dataC = $("#edit-C-orig-text").html();
    var dataKW = [];
    $("#file-chosen-kw-ul li").each(function (i) {
        var value = $(this).attr("data-value").substring(3);//, test.length - 1);
        //$(this).find('span').remove(); // no need to remove span, since we don't need text
        dataKW.push(value);
    });
    var notes = [];
    $("#proj-notes-ul li").each(function (i) {
        var text = $(this).ignore("span").text();
        notes.push(text);
    });


    // saving, because user wanted to click the button....
    saveProject(1, dataA, dataB, dataC, dataKW, notes, done, country, lang);//mode, dataA, dataB, dataC, kw, notes, done, country, lang

    // resetting UI...
    if (window.currentEvent != undefined) {
        $(".secA-Q").text(i18n.__("secA-Q"));
        $(".secB-Q").text(i18n.__("secB-Q"));
        for (var b = 1; b < 15; b++) {
            $(".secC-Q-" + b).text(i18n.__("secC-Q-" + b));
        }
        intUtils.sectionUtils.setupCsectionUI();
        intUtils.sectionUtils.updateCensoredList();
    }
}
//////////////////////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////////////////////// INPUT LISTENERS
/* Settings zoom slider value counter */
document.getElementById("settings-zoomslider").oninput = function () {
    var value = $("#settings-zoomslider").val();
    $("#settings-zoomvalue-2").text(value+"%");
}

/* Project note add button */
document.getElementById("proj-note-input-btn").onclick = function () {
    logger.debug("proj-note-input-btn button");
    if ($("#proj-note-input-field").val().trim().length < 1){
        //do nothing
    }
    else {
        logger.info("adding project note: " + $("#proj-note-input-field").val().trim());
        addProjNote($("#proj-note-input-field").val().trim());
        $("#proj-note-input-field").val("");
        intUtils.markPendingChanges(true, window.currentFile);
        var notes = [];
        $("#proj-notes-ul li").each(function (i) {
            var text = $(this).ignore("span").text();
            notes.push(text);
        });
        // saving, because user wanted to click the button....
        saveProject(0, "", "", "", [], notes);//mode, dataA, dataB, dataC, kw, notes, done, country, lang
    }
}
/* Follows input into project notes field */
document.getElementById("proj-note-input-field").onkeypress = function (e) {
    if (e.keyCode === 13) {
        logger.debug("proj-note-input-field ENTER PRESSED");
        if ($("#proj-note-input-field").val().trim().length < 1) {
            //do nothing
        }
        else {
            logger.info("adding project note: " + $("#proj-note-input-field").val().trim());
            addProjNote($("#proj-note-input-field").val().trim());
            $("#proj-note-input-field").val("");
            intUtils.markPendingChanges(true, window.currentFile);
            var notes = [];
            $("#proj-notes-ul li").each(function (i) {
                var text = $(this).ignore("span").text();
                notes.push(text);
            });
            // saving, because user wanted to click the button....
            saveProject(0, "", "", "", [], notes);//mode, dataA, dataB, dataC, kw, notes, done, country, lang
        }
    }
}

/* Follows if note is removed */
$("#proj-notes-ul").on("deleted", function (e) {
    logger.debug("notes onDeleted");
    logger.debug(e.params.data);

    intUtils.markPendingChanges(true, window.currentFile);
    var notes = [];
    var counter = 0;
    $("#proj-notes-ul li").each(function (i) {
        if (counter === e.params.data) {
            // need to skip this...
            logger.debug("skipping id: " + counter);
            counter++;
            return;
        }
        var text = $(this).ignore("span").text();
        notes.push(text);
        counter++;
    });
    // saving, because user deleted a note....
    saveProject(0, "", "", "", [], notes);//mode, dataA, dataB, dataC, kw, notes, done, country, lang
});

/* Follows if kw is removed from event selected list */
$("#file-chosen-kw-ul").on("deleted", function (e) {
    logger.debug("KW onDeleted");
    logger.debug(e.params.data);// en-basic-13

    intUtils.markPendingChanges(true, window.currentFile);
    var kwlist = [];
    $("#file-chosen-kw-ul li").each(function (i) {
        // check which kw element is this... need to skip it to prevent resaving
        //if ($(this).attr) { }
        var value = $(this).attr("data-value").substring(3);// basic-13
        if (value !== e.params.data.substring(3)) {
            kwlist.push(value);
        } else {
            logger.debug("skipping same kw...");
        }
    });

    // deleted should be triggered AFTER deletion..... u fokin idiot

    var curEventId = window.currentEvent;
    var curEvent = window.currentFileContent["project-files"][curEventId];
    // make changes here...

    //
    saveProject(0, curEvent.a, curEvent.b, curEvent.c, kwlist, window.currentFileContent["notes"], curEvent.done, curEvent.country, curEvent.lang);//mode, dataA, dataB, dataC, kw, notes, done, country, lang

    /*

            window_json["project-files"][current_event]["a"] = dataA;
            window_json["project-files"][current_event]["b"] = dataB;
            window_json["project-files"][current_event]["c"] = dataC;
            window_json["project-files"][current_event]["country"] = country;
            window_json["project-files"][current_event]["lang"] = lang;
            window_json["project-files"][current_event]["kw"] = kw;
     */

    // saving, because user deleted a kw from selected list....
    //saveProject(0, "", "", "", kwlist, notes);//mode, dataA, dataB, dataC, kw, notes, done, country, lang
});

/* Follows input into new project name field */
document.getElementById("new-proj-create-input").onkeypress = function (e) {//
    logger.debug("Pressed ENTER at CREATE PROJECT input")
    if (e.keyCode === 13) {
        logger.debug("proj-note-input-field KEY PRESSED");

        $("#footer-nav-btn3").trigger("click");

    }
}
//////////////////////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////////////////////// SETTINGS LISTENERS UPDATE BUTTONS
document.getElementById("check-app-updates-button").onclick = function () { //NEEDSTOBECHANGED
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
        logger.debug("RETURNED FROM APP: " + arg);//NEEDSTOBECHANGED
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
            var download_data = "Downloading " + (Math.round((progressObj.transferred / 1000000) * 100) / 100) + "MB/" + (Math.round((progressObj.total / 1000000) * 100) / 100) + "MB @ " + (Math.round((progressObj.bytesPerSecond / 1000) * 100) / 100) + " kBps";
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
            var download_data = "Update downloaded!";
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
//////////////////////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////////////////////// UPPER NAV BAR LISTENERS / BUTTONS
/* Import dropdown */
document.getElementById("addfiledropdownbutton").onclick = function () {
    logger.debug("addfile drowdown button");
    var x = document.getElementById("addfileddcont");
    if (x.className.indexOf("w3-show") == -1) {
        x.className += " w3-show";
    } else {
        x.className = x.className.replace(" w3-show", "");
    }
}
document.getElementById("addfilebuttonbypass").onclick = function () {
    logger.debug("addfile bypass button");
    addFilesPrompt(1);
    $("#addfiledropdownbutton").trigger("click");
}
document.getElementById("addfilebutton").onclick = function () {
    logger.debug("addfile button");
    addFilesPrompt(0);
    $("#addfiledropdownbutton").trigger("click");
}

document.getElementById("projinfobutton").onclick = function () {// NEEDSTOBECHANGED
    logger.debug("projinfo button");
    createDummyDialog(firstWindow);
    return;

    var value = $("#footer-nav-btn3").val();
    if (value === "information"){
        // do NOTHING
    }
    else {
        $("#proj-info-files-ul").empty();
        $("#proj-info-files-ul").html($("#proj-files-ul").html());
        $("#proj-info-files-ul li").removeAttr("onclick");
        $("#proj-info-files-ul li").removeAttr("style");
        $("#proj-info-files-ul li").removeAttr("data-temp");
        $("#proj-info-files-ul li").removeAttr("data-done");
        $("#proj-info-files-ul li").removeAttr("onmouseover");
        $("#proj-info-files-ul li").removeAttr("onmouseout");

        var docpath = remote.app.getPath('documents');
        var proj_base = path.join(docpath, 'SLIPPS Teacher Tool\\Projects\\' + window.currentProject + '\\');
        var options = {
            name: window.currentProject,
            cwd: proj_base
        }
        const store = new Store(options);//
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
        var tempUniq = []
        var check = false;
        var counter = 1;
        for (var i = 0; i < allkw.length; i++) {//&%&&%%&&¤&¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤
            var current = allkw[i];
            check = false;
            for (var t = 0; t < tempUniq.length; t++) {
                if (tempUniq[t][0] === current[0]) {
                    check = true;
                    tempUniq[t][2]++;
                }
            }
            if (!check) {
                current[2] = 1;
                tempUniq.push(current);
            }
            

        }
        logger.debug("tempUniq length: "+tempUniq.length);
        for (var w = 0; w < tempUniq.length; w++) {
            uniq[w] = [];
            uniq[w][0] = tempUniq[w][0];
            uniq[w][1] = tempUniq[w][1] + " x" + tempUniq[w][2];
            //logger.debug("asdasdadadsda " + toString(tempUniq[w][2]));
            //logger.debug("uniq w: "+uniq[w]);
            //logger.debug("uniq w 0: "+uniq[w][0]);
            //logger.debug("w: "+w);
            //logger.debug("tempUniq w 0: "+tempUniq[w][0]);
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
    intUtils.toggleViewMode(12);
    intUtils.toggleViewMode(10);
}

document.getElementById("projstartbutton").onclick = function () {//
    logger.debug("projectstart button");
    intUtils.toggleViewMode(1);
    intUtils.toggleViewMode(9);
}

/* ASYNC answers to EXPORT-window about the current project's name (IPC to file_export.js) */
ipcRenderer.on('get-project-data', function (event, fromWindowId) {
    logger.debug("RECEIVED REQUEST");
    logger.debug("fromwindowID: " + fromWindowId);
    var result = [];
    result.push(window.currentProject, window.currentFileContent);
    var fromWindow = BrowserWindow.fromId(fromWindowId);
    fromWindow.webContents.send('get-project-data-reply', JSON.stringify(result));
});

document.getElementById("exportprojbutton").onclick = function () {// NEEDSTOBECHANGED
    logger.debug("exportproject button");
    //createDummyDialog(firstWindow);
    //return;

    //export "done" marked project files 
    var options = {
        type: 'info',
        title: "Exporting files",
        message: "Events marked 'done' will now be exported.",
        detail: "Note: Only events that have 'permission for data to be used as part of SLIPPS' can be exported!",
        buttons: [i18n.__('conf-yes'), i18n.__('conf-no')]
    };

    /*
    ////////////////////////////////////////////////////////////////// Saving before exporting..... 
    var country = "";
    var lang = "";
    var done = false;

    if (window.currentProject !== undefined) {

    // going through yellow file list elements (as in currently opened/selected)
        $('#proj-files-ul li.w3-yellow').each(function (i) {
            done = ($(this).attr('data-done') === "true");
            country = $("#preview-event-country-select").val();
            lang = $("#preview-event-lang-select").val();
        });

    
        var dataA = $("#edit-A-orig-text").html();
        var dataB = $("#edit-B-orig-text").html();
        intUtils.sectionUtils.clearCsectionUI();
        var dataC = $("#edit-C-orig-text").html();
        var dataKW = [];

        $("#file-chosen-kw-ul li").each(function (i) {
            var value = $(this).attr("data-value").substring(3);//, test.length - 1);
            $(this).find('span').remove();
            dataKW.push(value);
        });

        var notes = [];
        $("#proj-notes-ul li").each(function (i) {
            var text = $(this).ignore("span").text();
            notes.push(text);
        });

        // saving, because we are about to export files. can't have them exported unsaved, right? :) (saving to backup files and window-variable)
        saveProject(0, dataA, dataB, dataC, dataKW, notes, done, country, lang);//mode, dataA, dataB, dataC, kw, notes, done, country, lang
    } else {
        logger.warn("No open project to be saved! Window.currentProject undefined!");
    }
    */

    dialog.showMessageBox(firstWindow, options, function (index) {
        if (index === 0) {
            //
            logger.debug("exporting.......");
            
            // need to disable ALL controls from user!!!
            var asdwin = new BrowserWindow({
                width: 450,
                height: 360,
                resizable: false,
                devTools: true,
                frame: false,
                backgroundColor: '#dadada',
                parent: firstWindow,
                modal: true,
                show: false
            });

            let winurl = url.format({
                protocol: 'file',
                slashes: true,
                pathname: path.join(__dirname, '../html/exporting.html') 
            });
            asdwin.on('ready-to-show', function () {
                asdwin.show();
            });
            asdwin.loadURL(winurl);
        }
    });
    
}

document.getElementById("closeprojbutton").onclick = function () {// NEEDSTOBECHANGED
    logger.debug("closeproject button");
    var options = {
        type: 'info',
        title: i18n.__('conf-title'),
        message: "Close project '" + window.currentProject+"'?",
        detail: "Are you sure you want to close this project?",
        buttons: [i18n.__('conf-yes'), i18n.__('conf-no')]
    };

    dialog.showMessageBox(firstWindow, options, function (index) {
        if (index === 0) {
            //save before closing, but only when prompted 
            //var country = "";
            //var lang = "";
            //var done = false;

            if (window.currentProject !== undefined) {
                var close_opt = {
                    name: "app-configuration",
                    cwd: remote.app.getPath('userData')
                }
                var close_store = new Store(close_opt);
                // testing if pending edits that need to be saved
                if (close_store.get("edits", [false, null])[0]) {
                    /*
                    $('#proj-files-ul li.w3-yellow').each(function (i) {
                        done = ($(this).attr('data-done') === "true");
                        //country = $(this).attr('data-country');
                        //lang = $(this).attr('data-lang');
                    });
                    */
                    $("#edit-A-orig-text .secA-Q").empty();
                    $("#edit-B-orig-text .secB-Q").empty();
                    for (var k = 1; k < 15; k++) {
                        $("#edit-C-orig-text .secC-Q-" + k).empty();
                    }
                    //var dataA = $("#edit-A-orig-text").html();
                    //var dataB = $("#edit-B-orig-text").html();
                    intUtils.sectionUtils.clearCsectionUI();
                    //var dataC = $("#edit-C-orig-text").html();
                    /*var dataKW = [];

                    $("#file-chosen-kw-ul li").each(function (i) {
                        var value = $(this).attr("data-value").substring(3);//, test.length - 1);
                        $(this).find('span').remove();
                        dataKW.push(value);
                    });

                    var notes = [];
                    $("#proj-notes-ul li").each(function (i) {
                        var text = $(this).ignore("span").text();
                        notes.push(text);
                    });
                    */

                    var options = {
                        type: 'info',
                        title: i18n.__("conf-title"),
                        message: i18n.__('conf-unsaved-title'),
                        detail: i18n.__('conf-unsaved-desc'),
                        buttons: [i18n.__('conf-yes'), i18n.__('conf-no')]
                    };

                    dialog.showMessageBox(firstWindow, options, function (index) {
                        if (index === 0) {
                            //save changes into file
                            // saving, because we are about to close the current project and return into start-view (only backup-file, but need to be prompted to save to file)

                            // get data from window here...
                            if (window.currentEvent != undefined) {
                                // only saving if currently event open...
                                var curEventId = window.currentEvent;
                                var curEvent = window.currentFileContent["project-files"][curEventId];
                                // make changes here...
                                //
                                saveProject(1, curEvent.a, curEvent.b, curEvent.c, curEvent.kw, window.currentFileContent["notes"], curEvent.done, curEvent.country, curEvent.lang);//mode, dataA, dataB, dataC, kw, notes, done, country, lang
                            } else {
                                logger.error("Can't save! There should have been EVENT open while closing project, since edits was marked 'true'!");
                            }
                        }
                        else {
                            //remove backup data
                            saveProject(2);
                        }
                        // Setting UI to start view (hiding edit-view preview-parts A, B and C away)
                        $("#preview-third-1").addClass("no-display");
                        $("#preview-third-2").addClass("no-display");
                        $("#preview-third-3").addClass("no-display");
                        $("#preview-third-start").removeClass("no-display");

                        // deleting window-variables that identify the current project
                        ipcRenderer.send('set-project-status', null);
                        window.currentProject = undefined;
                        window.currentFile = undefined;
                        window.currentFileContent = undefined;
                        window.currentEvent = undefined;

                        // Clearing section items and setting footer button mode. Also toggling proper view
                        intUtils.setFooterBtnMode("project-closed");
                        intUtils.sectionUtils.clearElements();
                        $("#titlebar-appname").text(i18n.__('app-name-1') + " " + i18n.__('app-name-2'));// {Alpha version " + remote.app.getVersion() + "}")
                        //$("#preview-cur-file-name").text("Current file: NONE");
                        //$("#preview-subid").text("Submission ID:");
                        //$("#preview-subdate").text("Submission Date:");
                        intUtils.toggleViewMode(0);
                        intUtils.toggleViewMode(10);
                    });
                } else {
                    // no edits to be saved
                    logger.info("No pending edits while closing project!");

                    // Setting UI to start view (hiding edit-view preview-parts A, B and C away)
                    $("#preview-third-1").addClass("no-display");
                    $("#preview-third-2").addClass("no-display");
                    $("#preview-third-3").addClass("no-display");
                    $("#preview-third-start").removeClass("no-display");

                    // deleting window-variables that identify the current project
                    ipcRenderer.send('set-project-status', null);
                    window.currentProject = undefined;
                    window.currentFile = undefined;
                    window.currentFileContent = undefined;
                    window.currentEvent = undefined;

                    // Clearing section items and setting footer button mode. Also toggling proper view
                    intUtils.setFooterBtnMode("project-closed");
                    intUtils.sectionUtils.clearElements();
                    $("#titlebar-appname").text(i18n.__('app-name-1') + " " + i18n.__('app-name-2'));// {Alpha version " + remote.app.getVersion() + "}")
                    //$("#preview-cur-file-name").text("Current file: NONE");
                    //$("#preview-subid").text("Submission ID:");
                    //$("#preview-subdate").text("Submission Date:");
                    intUtils.toggleViewMode(0);
                    intUtils.toggleViewMode(10);
                }
            } else {
                logger.warn("No open project to be saved! Window.currentProject undefined!");

                // Setting UI to start view (hiding edit-view preview-parts A, B and C away)
                $("#preview-third-1").addClass("no-display");
                $("#preview-third-2").addClass("no-display");
                $("#preview-third-3").addClass("no-display");
                $("#preview-third-start").removeClass("no-display");

                // deleting window-variables that identify the current project
                ipcRenderer.send('set-project-status', null);
                window.currentProject = undefined;
                window.currentFile = undefined;
                window.currentFileContent = undefined;
                window.currentEvent = undefined;

                // Clearing section items and setting footer button mode. Also toggling proper view
                intUtils.setFooterBtnMode("project-closed");
                intUtils.sectionUtils.clearElements();
                $("#titlebar-appname").text(i18n.__('app-name-1') + " " + i18n.__('app-name-2'));// {Alpha version " + remote.app.getVersion() + "}")
                //$("#preview-cur-file-name").text("Current file: NONE");
                //$("#preview-subid").text("Submission ID:");
                //$("#preview-subdate").text("Submission Date:");
                intUtils.toggleViewMode(0);
                intUtils.toggleViewMode(10);
            }
            // resetting UI to old state->
            $("#KW-selector").prop("disabled", true);
            $("#preview-event-country-select").prop("disabled", true);
            $("#preview-event-lang-select").prop("disabled", true);
            $("#preview-event-country-select").val(null).trigger("change");
            $("#preview-event-lang-select").val(null).trigger("change");
            $("#file-chosen-kw-ul").addClass("element-disabled");
        }
    });
}

document.getElementById("settingsbutton").onclick = function () {//NEEDSTOBECHANGED 
    logger.debug("settings button");
    if ($('#footer-nav-btn3').val() === "settings") {
        // do nothing. you are already at settings...
    }
    else {
        // CHECK SETTINGS FROM FILES > and update view like you wanted to
        $("#app-lang-selector").val(null).trigger("change");
        //$("#kw-list-available-choose").val(null).trigger("change");
        intUtils.updateSettingsUI();
    }
    intUtils.toggleViewMode(7);
    intUtils.toggleViewMode(10);
}

document.getElementById("back-to-start-button").onclick = function () {
    logger.debug("to start button");
    intUtils.toggleViewMode(0);
    intUtils.toggleViewMode(10);
}

document.getElementById("loginbutton").onclick = function () { // DISABLED FOR NOW NEEDSTOBECHANGED
    logger.debug("login button");
    /*

    if (($('#footer-nav-btn3').val() === "login") || ($('#footer-nav-btn3').val() === "register") || ($('#footer-nav-btn3').val() === "forgotPW")){
        // do nothing. already in login.
    }
    else {
        toggleViewMode(5);
        toggleViewMode(10);
    }
    */
}


/* Create Proj div */


/* Start div */

document.getElementById("create-proj-button").onclick = function () {
    logger.debug("create-proj-button");
    $("#create-proj-error").text("");
    $("#create-proj-country-select").val(null).trigger("change");
    $("#create-proj-language-select").val(null).trigger("change");
    intUtils.toggleViewMode(10);
    intUtils.toggleViewMode(13);
}

document.getElementById("open-proj-button").onclick = function () {
    logger.debug("open-proj-button");

    var docpath = remote.app.getPath('documents');
    if (fs.existsSync(path.join(docpath, "SLIPPS Teacher Tool\\Projects\\"))){
        var options = {
            title: i18n.__('open-project-prompt-window-title'),
            defaultPath: path.join(docpath, "SLIPPS Teacher Tool\\Projects\\"),
            filters: [
                { name: 'DECSV project file', extensions: ['decsv'] }
            ],
            properties: ['openFile'
            ]
        }// This need verifications!!!
        function callback(pname) {
            if (pname !== undefined) {
                var opened_res = openAndViewProject(pname[0]);
                var file_ext = pname[0].split('.').pop();
                var projname = pname[0].split('\\').pop();
                projname = projname.split(".");
                projname.pop();
                projname.join(".");
                logger.debug("PROJECT NAME: " + projname);
                //readFile(fileNames);
                if (opened_res[0]) {
                    logger.info("Successfully opened project '" + projname + "'!");
                    $("#proj-open-error").text(" ");
                }
                else {
                    logger.error("Failed to open existing project! Reason: "+opened_res[1]);
                    $("#proj-open-error").text(opened_res[1]);

                    $("#proj-open-error").before($("#proj-open-error").clone(true));
                    $("[id='proj-open-error']" + ":last").remove();
                }
                return;
            }
            logger.warn("No project chosen to be opened!");
        }
        dialog.showOpenDialog(firstWindow, options, callback);
    }
    else {
        $("#proj-open-error").text("Projects folder doesn't exists! Create new project or restart application.");

        $("#proj-open-error").before($("#proj-open-error").clone(true));
        $("[id='proj-open-error']" + ":last").remove();
    }
    //open dialog here to choose directory, or create directory if nothing is present. then recall function
}
//////////////////////////////////////////////////////////////////////////////////////////////////

/* Preview div */
/////////////////////////////////////////////////////////////////////////////////////////////// WINDOW LISTENERS FOR A,B and C SECTIONS
document.getElementById("secAmodetoggle").onclick = function () {
    logger.debug("secAmodetoggle button");
    console.log("toggle A");
    intUtils.toggleViewMode(2);
    intUtils.toggleViewMode(9);
}

document.getElementById("secBmodetoggle").onclick = function () {
    logger.debug("secBmodetoggle button");
    console.log("toggle B");
    intUtils.toggleViewMode(3);
    intUtils.toggleViewMode(9);
}

document.getElementById("secCmodetoggle").onclick = function () {
    logger.debug("secCmodetoggel button");
    console.log("toggle C");
    intUtils.toggleViewMode(4);
    intUtils.toggleViewMode(9);
}


/* Index div footer */
///////////////////////////////////////////////////////////////////////////////////////////// INDEX FOOTER WINDOW LISTENERS / BUTTONS
document.getElementById("footer-nav-btn1").onclick = function () {//
    var value = $(this).val();
    logger.debug("btn1: " + value);
    if (value === "preview"){
        //$(this).text("Previous file"); 
        logger.debug("Moving to previous file");
        var currentlyselected = null;
        var previous = null;
        $("#proj-files-ul li").each(function (i) {
            if ($(this).hasClass("w3-yellow")) {
                if (previous === null){
                    // already in first one
                    //logger.debug("ALREADY IN FIRST ONE!");
                    return false;
                }
                else {
                    $(previous).trigger('click');
                    //logger.debug("switching files...");
                    return false;
                }
            }
            else {
                //logger.debug("moving on...");
                previous = this;
            }
            // do sumthing
        });
    }
    //preview move to previous file
}
document.getElementById("footer-nav-btn2").onclick = function () {
    var value = $(this).val();
    logger.debug("btn2: " +value);
}

document.getElementById("footer-nav-btn3").onclick = function () {//
    var value = $(this).val();
    logger.debug("btn3: " + value);
    //create project createProjAsync();
    //save settings
    //edit ABC save
    if (value === "editA") {
        intUtils.toggleViewMode(1);
        intUtils.toggleViewMode(9);
        // save A edits and update preview
        let check = true;
        if ($("#edit-A-orig-text").html() === $("#edit-A-edit-text").html()) { check = false; }
        $("#edit-A-orig-text").html($("#edit-A-edit-text").html());
        intUtils.sectionUtils.updatePreview();
        intUtils.sectionUtils.updateCensoredList();
        //NEEDSTOBECHANGED save project to temp 
        if (window.currentEvent != undefined && check) {
            intUtils.markPendingChanges(true, window.currentFile);
            let curEventId = window.currentEvent;
            let curEvent = window.currentFileContent["project-files"][curEventId];
            // make changes here...
            curEvent.a = $("#edit-A-orig-text").html();
            //
            saveProject(0, curEvent.a, curEvent.b, curEvent.c, curEvent.kw, window.currentFileContent["notes"], curEvent.done, curEvent.country, curEvent.lang);//mode, dataA, dataB, dataC, kw, notes, done, country, lang
        }
        //
    }
    else if (value === "editB") {
        intUtils.toggleViewMode(1);
        intUtils.toggleViewMode(9);
        // save B edits and update preview
        let check = true;
        if ($("#edit-B-orig-text").html() === $("#edit-B-edit-text").html()) { check = false; }
        $("#edit-B-orig-text").html($("#edit-B-edit-text").html());
        intUtils.sectionUtils.updatePreview();
        intUtils.sectionUtils.updateCensoredList();
        //NEEDSTOBECHANGED save project to temp 
        if (window.currentEvent != undefined && check) {
            intUtils.markPendingChanges(true, window.currentFile);
            let curEventId = window.currentEvent;
            let curEvent = window.currentFileContent["project-files"][curEventId];
            // make changes here...
            curEvent.b = $("#edit-B-orig-text").html();
            //
            saveProject(0, curEvent.a, curEvent.b, curEvent.c, curEvent.kw, window.currentFileContent["notes"], curEvent.done, curEvent.country, curEvent.lang);//mode, dataA, dataB, dataC, kw, notes, done, country, lang
        }
        //
    }
    else if (value === "editC") {
        intUtils.toggleViewMode(1);
        intUtils.toggleViewMode(9);
        // save C edits and update preview
        let check = true;
        if ($("#edit-C-orig-text").html() === $("#edit-C-edit-text").html()) { check = false; }
        $("#edit-C-orig-text").html($("#edit-C-edit-text").html());
        intUtils.sectionUtils.updatePreview();
        intUtils.sectionUtils.updateCensoredList();
        //NEEDSTOBECHANGED save project to temp 
        if (window.currentEvent != undefined && check) {
            intUtils.markPendingChanges(true, window.currentFile);
            let curEventId = window.currentEvent;
            let curEvent = window.currentFileContent["project-files"][curEventId];
            // make changes here...
            curEvent.c = $("#edit-C-orig-text").html();
            //
            saveProject(0, curEvent.a, curEvent.b, curEvent.c, curEvent.kw, window.currentFileContent["notes"], curEvent.done, curEvent.country, curEvent.lang);//mode, dataA, dataB, dataC, kw, notes, done, country, lang
        }
        //
    }
    else if (value === "login") {
        //login
        logger.debug("Now we would try to log in...");
        logger.debug("Username: " + $("#login-username").val());
        logger.debug("Password: " + $("#login-pass").val());
    }
    else if (value === "register") {
        //register
        logger.debug("Now we would try to register...");
        logger.debug("Username: " + $("#register-username").val());
        logger.debug("Email: " + $("#register-email").val());
        logger.debug("Real name: " + $("#register-realname").val());
        logger.debug("Password: " + $("#register-pass").val());
        logger.debug("Retype Password: " + $("#register-retype-pass").val());
    }
    else if (value === "settings") {
        var options = {
            type: 'info',
            title: i18n.__('conf-title'),
            message: "Save these settings?",
            detail: "",
            buttons: [i18n.__('conf-yes'), i18n.__('conf-no')]
        };

        dialog.showMessageBox(firstWindow, options, function (index) {
            if (index === 0) {
                logger.info("Now attempting to save settings...");
                // collect settings from settings window and place them to this list
                var tobesent = collectSettings();

                setSettings(tobesent);
                //intUtils.updateSettingsUI(); 
                //intUtils.selectUtils.setupEditKW();
            }
            else {
                // no need to anything else
            }
        });
        //save settings
    }
    else if (value === "create-proj") {
        logger.debug("new-proj-create-button");
        var project_name = $("#new-proj-create-input").val();
        var project_country = $("#create-proj-country-select").val();
        var project_lang = $("#create-proj-language-select").val();
        createProjAsync(project_name, project_country, project_lang); 
        //create project
    }
    else if (value === "forgotPW") {
        //
        logger.debug("Now we would try to ask for password change...");
        logger.debug("Email: " + $("#forgot-email").val());
    }
}
document.getElementById("footer-nav-btn4").onclick = function () {
    var value = $(this).val();
    logger.debug("btn4: " + value);

    //cancel project creation
    //cancel settings
    //edit ABC cancel
    if (value === "editA") {
        intUtils.toggleViewMode(1);
        intUtils.toggleViewMode(9);
        // cancel editmode A
        $("#edit-A-edit-text").html($("#edit-A-orig-text").html());
        intUtils.sectionUtils.setupCensorSelect();
    }
    else if (value === "editB") {
        intUtils.toggleViewMode(1);
        intUtils.toggleViewMode(9);
        //cancel editmode B
        $("#edit-B-edit-text").html($("#edit-B-orig-text").html());
        intUtils.sectionUtils.setupCensorSelect();
    }
    else if (value === "editC") {
        intUtils.toggleViewMode(1);
        intUtils.toggleViewMode(9);
        //cancel editmode C
        $("#edit-C-edit-text").html($("#edit-C-orig-text").html());
        intUtils.sectionUtils.setupCensorSelect();
    }
    else if (value === "register") {
        intUtils.toggleViewMode(5);
        intUtils.toggleViewMode(10);
    }
    else if (value === "settings") { //NEEDSTOBECHANGED
        $("#app-lang-selector").val(null).trigger("change");
        //$("#kw-list-available-choose").val(null).trigger("change");
        intUtils.updateSettingsUI();
        // revert changes in settings
    }
    else if (value === "forgotPW") { 

        intUtils.toggleViewMode(5);
        intUtils.toggleViewMode(10);
    }
    
}

document.getElementById("footer-nav-btn5").onclick = function () {
    var value = $(this).val(); 
    logger.debug("btn5: " + value);

    if (value === "preview") {
        // Toggle done and not done
        var doneCheck = null;
        $('#proj-files-ul li.w3-yellow').each(function (i) {
            //
            if ($(this).attr("data-done") === "true") {
                $(this).attr({
                    "data-done": false
                });
                doneCheck = false;
            }
            else {
                $(this).attr({
                    "data-done": true
                });
                doneCheck = true;
            }
            intUtils.setFooterBtnMode("preview");
        });

        if (window.currentEvent != undefined) {
            if (doneCheck === null) {
                logger.error("While settings 'DONE' status with footer btn, there was no event open! Unable to save!");
            } else {
                intUtils.markPendingChanges(true, window.currentFile);
                var curEventId = window.currentEvent;
                var curEvent = window.currentFileContent["project-files"][curEventId];
                // make changes here...
                curEvent.done = doneCheck;
                //
                saveProject(0, curEvent.a, curEvent.b, curEvent.c, curEvent.kw, window.currentFileContent["notes"], curEvent.done, curEvent.country, curEvent.lang);//mode, dataA, dataB, dataC, kw, notes, done, country, lang
            }
        }
    }
    else if (value === "login") {
        intUtils.toggleViewMode(6);
        intUtils.toggleViewMode(10);
        // register view
    }
    
}
document.getElementById("footer-nav-btn6").onclick = function () {//
    var value = $(this).val();
    logger.debug("btn6: " + value);
    
    if (value === "preview") {
        logger.debug("Moving to next file");
        var currentlyselected = null;
        $("#proj-files-ul li").each(function (i) {
            if ($(this).hasClass("w3-yellow")) {
                currentlyselected = this;
                //logger.debug("FOUND CURRENT! moving on...");
            }
            else {
                if (currentlyselected === null) {
                    // moving on
                    //logger.debug("moving on...");
                }
                else{
                    $(this).trigger('click');
                    //logger.debug("switching files...");
                    return false;
                }
            }
            // do sumthing
        });
        // Move to next file
    }
    else if (value === "login") {
        intUtils.toggleViewMode(14);
        intUtils.toggleViewMode(10);
    }
}
/////////////////////////////////////////////////////////////////////////////////////////

/////////////////////////////////////////////////////////////// FUNCTIONS

/* collects settings from settings view and sends back new json object with these */
function collectSettings() {
    //
    logger.debug("collectSettings");
    var settings = getSettings();
    /*json1 = {
            "app-lang": "en",
            "first-use": false,
            "app-version": app.getVersion(),
          //  "demo-files": true,
            "latest-update-check": null,
            "latest-update-install": null,
            "zoom": 100,
            "edits": [
                false,
                null
            ],
            "enabled-keywordlists":[]
        };*/
    var applang = $("#app-lang-selector").select2('val');
    if ((applang !== null) && (applang !== undefined) && (applang !== "")) {
        settings.app["app-lang"] = applang;
    } else {
        logger.warn("Settings applang null, undefined or empty string!");
    }
    var zoomvalue = 100;
    try {
        zoomvalue = Number.parseInt($("#settings-zoomslider").val());
    } catch (err) {
        logger.error("Unable to parse settings zoomslider to Int");
        zoomvalue = 100;
    }
    settings.app["zoom"] = zoomvalue;
    /* json2 = {

            "last-successful-update": null,
            "available-keywordlists": {
                "en-basic": {
                    "date": "2018-06-25T13:05:48.801Z",
                    "name": "English - Basic"
                },
                "fi-basic": {
                    "date": "2018-06-25T13:05:48.801Z",
                    "name": "Suomi - Perus"
                }
            },
            "local-keywordlists": {
                "en-basic": {
                    "date": "2018-06-25T13:05:48.801Z",
                    "name": "English - Basic"
                },
                "fi-basic": {
                    "date": "2018-06-25T13:05:48.801Z",
                    "name": "Suomi - Perus"
                }
            },
            "enabled-keywordlists": [
                "en-basic"
            ]
        };*/
    var enabledarr = [];
    $("#settings-local-kw-lists .kw-list-enabled").each(function () {
        var langtag = $(this).attr("data-id");
        enabledarr.push(langtag);
        logger.debug(langtag);
    });
    if (enabledarr.length < 1) { enabledarr.push("en"); } else if (enabledarr.length > 1) { enabledarr = enabledarr[0]; }// allow only one for now...
    settings.app["enabled-keywordlists"] = enabledarr;

    return settings;
}

/* Creates new project ASYNC!! (IPC to app.js) */
function createProjAsync(project_name = "", project_country = "", project_lang = "") {


    if ($("#new-proj-create-input").val().trim().length < 1) {
        //do nothing
        $("#create-proj-error").text("Name should not be empty!");
        
        $("#create-proj-error").before($("#create-proj-error").clone(true));
        $("[id='create-proj-error']" + ":last").remove();
        return;
    }
    else if (project_country === null || project_country.length !== 2) {
        $("#create-proj-error").text("Select a country!");

        $("#create-proj-error").before($("#create-proj-error").clone(true));
        $("[id='create-proj-error']" + ":last").remove();
        return;
    }
    else if (project_lang === null || project_lang.length !== 2) {
        $("#create-proj-error").text("Select a language!");

        $("#create-proj-error").before($("#create-proj-error").clone(true));
        $("[id='create-proj-error']" + ":last").remove();
        return;
    }
    else {
        // OPEN DIALOG TO CONFIRM NAME!!!!!
        var options = {
            type: 'info',
            title: "Create new project",
            message: "Project name: '" + project_name + "'\r\nCountry: '" + project_country + "'\r\nLanguage: '" + project_lang+"'",
            detail: "Would you like to create project with these values?",
            buttons: [i18n.__('conf-yes'), i18n.__('conf-no')]
        };

        dialog.showMessageBox(firstWindow, options, function (index) {
            if (index === 0) {
                //continue

                logger.debug("createProjAsync");
                ipcRenderer.on('async-create-project-reply', (event, arg) => {
                    //console.log("RETURNED FROM APP: ");
                    //console.log(arg);
                    logger.debug("ASYNC RETURNED (CREATE PROJECT)");
                    if (arg[0]) {
                        var opened_res = openAndViewProject(arg[2]);

                        if (opened_res[0]) {
                            logger.debug("OPENED CREATED PROJECT");
                            logger.info("New project '" + project_name + "' opened successfully!");
                        }
                        else {
                            //logger.debug("FAILED TO OPEN CREATED PROJECT!");
                            //logger.debug("REASON: " + opened_res[1]);
                            logger.error("Failed to open new project '" + project_name + "'! Reason: " + opened_res[1]);
                            $("#create-proj-error").text(opened_res[1]);

                            $("#create-proj-error").before($("#create-proj-error").clone(true));
                            $("[id='create-proj-error']" + ":last").remove();
                        }
                    }
                    else {
                        var reason_id = arg[1];
                        var reason = i18n.__('create-proj-fail-'+reason_id);
                        logger.error("Unable to create new project '" + project_name + "'! Reason: " + reason);
                        $("#create-proj-error").text(reason);

                        $("#create-proj-error").before($("#create-proj-error").clone(true));
                        $("[id='create-proj-error']" + ":last").remove();
                    }
                    ipcRenderer.removeAllListeners('async-create-project-reply');
                })
                ipcRenderer.send('async-create-project', project_name, project_country, project_lang);
            }
            else {
                return;
            }
        });
    }
}

/* Reads through list of temp-files from proj_properties and then adds them to the EDIT-view filelist */
function updateFileList() {
    logger.debug("updateFileList");
    var proj_name = window.currentProject;
    var proj_content = window.currentFileContent;
    // no need to test window.currentFile, because why would we need to know project source file location?

    if ((proj_name === undefined) || (proj_content === undefined)) {
        logger.error("Can't update list of files! Window-variable for project name or content(JSON) is undefined!");
        return;
    }

    var tempfiles = proj_content["project-files"];

    $("#proj-files-ul").empty();
    for (var k in tempfiles) {
        //logger.debug("Looping through tempfiles...");
        if (tempfiles.hasOwnProperty(k)) {
            var filetemp = k;//event name in events list
            var filedone = tempfiles[k]["done"];
            //var filelang = tempfiles[k]["lang"];
            //var filecountry = tempfiles[k]["country"];
            var filepermission = tempfiles[k]["permission"];
            //logger.debug("FROM TEMP FILE IN UPDATEFILELIST");
            //logger.debug(filedone);
            //logger.debug(typeof(filedone));
            var fileArr = [];
            fileArr.push(filetemp, filedone, filepermission);// NEEDSTOBECHANGED
            addProjFile(fileArr);
        } else {
            logger.error("UpdateFileList tempfiles.hasOwnProperty(k) FALSE! Shouldn't happen...");
        }
    }
    ///////////////////////////////777
    $('#proj-files-ul li').off('click');
    $('#proj-files-ul li').on('click', function () {
        logger.debug('CLICKED FILE OBJECT!');
        logger.debug($(this).text());
        //var done = false;
        if ($(this).hasClass("w3-yellow")) {
            // do nothing
            logger.warn("Tried to open already showed event!");
        }
        else {
            logger.info("Switching files...");
            $('#proj-files-ul li.w3-yellow').each(function (i) {
                //done = ($(this).attr('data-done') === "true");
                $(this).removeClass('w3-yellow');
                if ($(this).attr('data-permission') === 'false') {
                    $(this).addClass('w3-red');
                }
                if ($(this).attr('data-done') === 'true') {
                    $(this).addClass('w3-green');
                }
                ///////////////////////////////////////////////////

                $("#edit-A-orig-text .secA-Q").empty();
                $("#edit-B-orig-text .secB-Q").empty();
                for (var k = 1; k < 15; k++) {
                    $("#edit-C-orig-text .secC-Q-" + k).empty();
                }
                var dataA = $("#edit-A-orig-text").html();
                var dataB = $("#edit-B-orig-text").html();
                intUtils.sectionUtils.clearCsectionUI();
                var dataC = $("#edit-C-orig-text").html();
                var dataKW = [];
                
                $("#file-chosen-kw-ul li").each(function (i) {
                    var value = $(this).attr("data-value").substring(3);//, test.length - 1);
                    $(this).find('span').remove();
                    //var name = $(this).text();
                    //logger.debug("THIS IS AFTER REMOVAL!!!!");
                    //logger.debug(name);

                    dataKW.push(value);
                });
                var notes = [];

                /*
                 * Removed this section, since we'd like to save WHEN EDITS ACTUALLY HAPPEN, not when shown event is switched...
                 * 
                $("#proj-notes-ul li").each(function (i) {
                    var text = $(this).ignore("span").text();
                    //logger.error("text_5: " + text);
                    notes.push(text);
                });
                var country = $("#preview-event-country-select").val();
                var lang = $("#preview-event-lang-select").val();
                var done = false;
                if ($(this).attr('data-done') === 'true') { done = true;}
                // triggering save project, because we are switching to different event
                saveProject(0, dataA, dataB, dataC, dataKW, notes, done, country, lang);//mode, dataA, dataB, dataC, kw, notes, done, country, lang
                */
                
            });
            // previous saved data, now looking at setting other....

            $(this).addClass('w3-yellow');
            $(this).removeClass('w3-green');
            $(this).removeClass('w3-red');

            // reset kw list and selector
            $("#file-chosen-kw-ul").empty();
            $("#KW-selector option").each(function (i) {
                if (this.hasAttribute("disabled")) {
                    $(this).removeAttr("disabled");
                }
            });
            $("#KW-selector").select2({
                placeholder: i18n.__('select2-kw-add-ph')
            });

            ////// reset countries etc.
            $("#preview-event-country-select").select2({
                placeholder: i18n.__('select2-event-country-ph')
            });

            $("#preview-event-lang-select").select2({
                placeholder: i18n.__('select2-event-lang-ph')
            });

            $("#preview-event-country-select").val(null).trigger("change");
            $("#preview-event-lang-select").val(null).trigger("change");
            //////
            openAndShowFile(this);
            //createDummyDialog(firstWindow);
        }
    });
    ///////////////////////////////////
    /*
    $("#edit-A-orig-text .secA-Q").empty();
    $("#edit-B-orig-text .secB-Q").empty();
    for (var s = 1; k < 15; s++) {
        $("#edit-C-orig-text .secC-Q-" + s).empty();
    }
    intUtils.sectionUtils.clearCsectionUI();
    $("#file-chosen-kw-ul").empty();
    $("#KW-selector option").each(function (i) {
        if (this.hasAttribute("disabled")) {
            $(this).removeAttr("disabled");
        }
    });
    $("#KW-selector").select2({
        placeholder: i18n.__('select2-kw-add-ph')
    });
    */
    //window.currentEvent = undefined;
    if (window.currentEvent === undefined) {
        //
    } else {
        $('#proj-files-ul li').find("[data-eventid='" + window.currentEvent + "']").addClass('w3-yellow');
    }
}

/* Called when project is opened */
function openAndViewProject(proj_location, backup_proj = false) {
    logger.debug("openAndViewProject");
    var file_ext = proj_location.split('.').pop();
    var proj_name = proj_location.split('\\').pop();

    proj_name = proj_name.split(".");
    proj_name.pop();
    proj_name.join(".");

    var regex_filepath_val = /^[^\\/:\*\?"<>\|]+$/;
    //var docpath = remote.app.getPath('documents');
    var reason = [];

    if (proj_location === undefined) {
        // Projectname not defined
        reason.push(false, "Project to be opened not defined!");
        return reason;
    }
    else if (file_ext !== 'decsv') {
        // Project extension is invalid!
        reason.push(false, "File not valid project file!");
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
    // testing if can be opened properly BEFORE it can be opened! -> .decsv file
    var read_file = "";
    try {
        read_file = fs.readFileSync(proj_location, 'utf8'); 
    } catch (err) {
        logger.error("Failed to open project file '"+proj_name+"."+file_ext+"'! Reason: " + err.message);
        reason.push(false, 'Unable to open project "'+proj_name+'"!');
        return reason;
    }
    // validate JSON form of file contents.......
    var json_file = {};
    try {
        json_file = JSON.parse(read_file);
    } catch (err) {
        logger.error("Read project file '" + proj_name + "." + file_ext+"' had invalid JSON! Reason: "+err.message);
        reason.push(false, 'Project file contents invalid!');
        return reason;
    }
    
    var validateJSONresult = parseUtils.validateProjectJSON(json_file);
    if (!validateJSONresult[0]) {
        // was NOT valid project file!
        logger.debug("Error code: "+validateJSONresult[1]);
        logger.error("Read project file '" + proj_name + "." + file_ext + "' JSON contents not in par with project template!");
        reason.push(false, "Project file contents invalid!");
        return reason;
    }
    else if (!parseUtils.validateVersion(json_file["version"])) {
        // was NOT valid version!
        logger.error("Read project file '" + proj_name + "." + file_ext + "' version not accepted!");
        reason.push(false, "Project file version invalid!");
        return reason;
    }

    // Saving temporary copy to application's userData folders...
    var apppath = remote.app.getPath('userData');
    if (!fs.existsSync(path.join(apppath, 'backup_files'))) {
        logger.warn("No project backup directory!");
        try {
            fs.mkdirSync(path.join(apppath, 'backup_files'));
        } catch (err) {
            logger.error("Error creating directory for project backups! Reason: " + err.message);
            reason.push(false, "Unable to create backup directory for projects!");
            return reason;
        }
    }
    else {
        var backup_dircheck = fs.statSync(path.join(apppath, 'backup_files'));
        if (backup_dircheck.isDirectory()) {
            logger.info("Project backup directory located!");
        }
        else {
            try {
                fs.mkdirSync(path.join(apppath, 'backup_files'));
            } catch (err) {
                logger.error("Error creating directory for project backups! Reason: " + err.message);
                reason.push(false, "Unable to create backup directory for projects!");
                return reason;
            }
        }
    }
    /*// THIS IS NOT NEEDED, BECAUSE WE DON'T YET HAVE ANY EDITS!
    var backup_opt = {
        name: proj_name,
        cwd: path.join(apppath, 'backup_files')
    }
    logger.info("Saving backup copy: "+path.join(apppath, proj_name+".json"));
    const backup_store = new Store(backup_opt);
    backup_store.store = json_file;
    */

    // Adding simple details to UI:
    //$("#titlebar-appname").text("SLIPPS Teacher Tool" + " - " + proj_name); // ONLY AFTER EVERYTHING HAS BEEN CHECKED!!!!!
    logger.debug("SHOULD NOT BE HERE");
    $("#titlebar-appname").text(i18n.__('app-name-1') + " " + i18n.__('app-name-2') + " - " + proj_name)

    //$("#proj-info-name").text("Project Name: \"" + proj_name + "\"");//NEEDSTOBECHANGED
    //$("#proj-info-created").text("Created: " + new Date(json_file["created"]));//NEEDSTOBECHANGED

    var proj_notes = json_file["notes"];
    //console.log("NOTES: ");
    //console.log(proj_notes);
    for (var i = 0; i < proj_notes.length; i++) {
        //console.log(i + "  " + proj_notes[i]);
        addProjNote(proj_notes[i]);
    }

    ipcRenderer.send('set-project-status', proj_name);
    window.currentProject = proj_name;
    window.currentFileContent = json_file;
    window.currentFile = proj_location;
    updateFileList();

    // OPENING "PROJECT START" VIEW
    intUtils.toggleViewMode(1);
    intUtils.toggleViewMode(9);
    intUtils.setFooterBtnMode("project-open");
    ////////////////////
    logger.info("Opened project " + proj_name + "...");
    reason.push(true);
    return reason;
}

/* Add given note into EDIT-view proj_notes ul-element */
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
        onclick: "var index = $(this.parentElement).index(); $(this.parentElement.parentElement).trigger({type: 'deleted',params:{data: index}});$(this.parentElement).remove();"
    });

    li_node.appendChild(span_node);

    $('#proj-notes-ul').append(li_node);

}

/* Add given filename + details into EDIT-view filelist ul-element */
//fileArr.push(filetemp, filedone, filepermission);
function addProjFile(fileArr) {// NEEDSTOBECHANGED
    logger.debug("addProjFile");
    //logger.debug(fileArr);
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
    //fileArr.push(filetemp, filedone, filepermission);
    var li_string = document.createTextNode(fileArr[0]);
    var li_symbol = "&#9888;";
    var li_p1 = document.createElement("p");
    var li_p2 = document.createElement("p");
    li_p1.appendChild(li_string);
    $(li_p1).attr({
        style: "margin: 0;overflow-wrap: normal;overflow-x: hidden;text-overflow: ellipsis;max-width: 80%;"
    });
    li_p2.innerHTML = li_symbol;
    $(li_p2).attr({
        style: "font-size: 30px;position: absolute;float: right;top: -7px;right: 7%;margin: 0;"
    });
    //console.log("####################################################");
    //console.log(li_string);
    var li_node = document.createElement("li");
    //console.log(li_node);
    //console.log(document.createElement("li"));
    var classes = "w3-display-container";
    li_node.appendChild(li_p1);
    if (fileArr[2] === false || fileArr[2] === "false") {
        li_node.appendChild(li_p2);
    }
    //logger.debug("BEFORE USAGE AT ADDPROJFILE");
    //logger.debug(fileArr[2]);
    //logger.debug(typeof (fileArr[2]));
    if (fileArr[2] === false || fileArr[2] === "false") {//permission
        classes = classes + " w3-red";
    }
    else if (fileArr[1] === true || fileArr[1] === "true") {//done
        classes = classes + " w3-green";
    }
    $(li_node).attr({
        style: "cursor:pointer;",
        class: classes,
        onmouseover: "$(this).addClass('w3-hover-blue');",
        onmouseout: "$(this).removeClass('w3-hover-blue');",
        "data-permission": fileArr[2],
        "data-eventid": fileArr[0],
        "data-done": fileArr[1]
    });
    $('#proj-files-ul').append(li_node);
}

/* Called when window.currentFileContent is modified. backup file is modified in the same time */
//saveProject(dataA, dataB, dataC, dataKW, notes, done); CUSTOM INPUT
// dataKW == array of value as in "basic-123" or "basic-65"

/* Mode:
 * 0 == save to window-variable and backup (set "edits" to true)
 * 1 == save to previous, but also to actual file (set "edits" to false)
 * 2 == discard changes. not saving to backup, not saving to file: just set "edits" to false/null, and remove backup file
 */
function saveProject(mode = 0, dataA = "", dataB = "", dataC = "", kw = [], notes = [], done = false, country = "", lang = "") { 

    // NEED TO CALL GETSETTINGS!!!! 
    logger.debug("saveProject");
    var file_source = window.currentFile;
    var proj_name = window.currentProject;
    var window_json = window.currentFileContent;
    var current_event = window.currentEvent;

    if ((file_source === undefined) || (proj_name === undefined) || (window_json === undefined)) {
        logger.error("Unable to save project, because current file, project name or file contents(JSON) is undefined!");
        return;
    }
    // just writing down if we have open event in the edit-view
    if (current_event === undefined) {
        logger.info("No event open in edit-view while saving...");
        // we can only save notes....
    }
    else {
        logger.info("Event '"+current_event+"' open in edit-view while saving...");
    }

    var backup_base = path.join(remote.app.getPath("userData"), "backup_files");
    // trying to create backup directory if not already existing
    try {
        if (!fs.existsSync(backup_base)) {
            fs.mkdirSync(backup_base);
        }
        else if (!fs.statSync(backup_base).isDirectory()) {
            // not directory
            logger.error("Backup location not a directory! Creating new...");
            fs.mkdirSync(backup_base);
        }
    } catch (err) {
        logger.error("Unable to create backup directory! Reason: " + err.message);
        return;
    }

    var config_opt = {
        name: "app-configuration",
        cwd: remote.app.getPath('userData')
    }
    //
    var config_store = new Store(config_opt);

    // discard backups. we are not saving any changes, nor are keeping backups
    if (mode === 2) {
        logger.info("Not saving changes! Removing backups without saving to file...");
        try {
            fs.unlinkSync(path.join(backup_base, proj_name + ".json"));
            config_store.set("edits", [false, null]);
            $("#save-cur-edits-btn").addClass("w3-disabled");
            $("#save-cur-edits-btn").attr('disabled', 'disabled');
            $("#preview-cur-edits-title").text("No pending changes");
            $("#preview-cur-edits-title").css("background-color", "lightgreen");
        } catch (err) {
            logger.error("Unable to remove backup file! Reason: " + err.message);
            return;
        }
        return;
    }

    var backup_opt = {
        defaults: window_json,
        name: proj_name,
        cwd: backup_base
    }
    var backup_store = new Store(backup_opt);

    // basics set up, now adding new data to window-variable....
    window_json["notes"] = notes; // saving notes, if nothing else can be saved
    if (current_event !== undefined) {
        logger.info("Because window.currentEvent is not undefined, now saving all data into window.currentFileContent");
        if (window_json["project-files"].hasOwnProperty(current_event)) {
            window_json["project-files"][current_event]["a"] = dataA;
            window_json["project-files"][current_event]["b"] = dataB;
            window_json["project-files"][current_event]["c"] = dataC;
            window_json["project-files"][current_event]["country"] = country;
            window_json["project-files"][current_event]["lang"] = lang;
            window_json["project-files"][current_event]["kw"] = kw;
            window_json["project-files"][current_event]["done"] = done;
        } else {
            //
            logger.error("Window.currentFileContent variable doesn't have 'current_event' property! Unable to save!");
        }
    } else {
        logger.warn("Current_event undefined! No event currently open!");
    }

    //intUtils.sectionUtils.clearCsectionUI(); // is this needed?

    // adding new json version into window-variable and backup
    window.currentFileContent = window_json;
    backup_store.store = window_json;
    logger.info("successfully saved new data into window-variable and backup file for project '" + proj_name + "'!");
    
    config_store.set("edits", [true, file_source])
    $("#save-cur-edits-btn").removeClass("w3-disabled");
    $("#save-cur-edits-btn").removeAttr('disabled', 'disabled');
    $("#preview-cur-edits-title").text("There are pending changes!");
    $("#preview-cur-edits-title").css("background-color", "yellow");
    //testing if mode 1 has beens set (write to actual file, and remove backup)
    if (mode === 1) {
        logger.info("Saving into actual project file '"+file_source+"'!");
        // need to write to the actual file... and set "edits" value to [false, null]

        try {
            //
            fs.writeFileSync(file_source, JSON.stringify(window_json), "utf8");
            fs.unlinkSync(path.join(backup_base, proj_name + ".json"));
            config_store.set("edits", [false, null]);
            $("#save-cur-edits-btn").addClass("w3-disabled");
            $("#save-cur-edits-btn").attr('disabled', 'disabled');
            $("#preview-cur-edits-title").text("No pending changes");
            $("#preview-cur-edits-title").css("background-color", "lightgreen");
        } catch (err) {
            logger.error("Unable to write new source file or remove backup file! Reason: " + err.message);
            return;
        }
        logger.info("Backup file successfully removed, and changes saved!");
    }
    
}

// NEEDS CHANGES!!!!!!
/* Retrieve data from a temp-file and show it on the window */
function openAndShowFile(fileObj) {// NEEDSTOBECHANGED 
    logger.debug("openAndShowFile");
    //window.currentFile = $(fileObj).text();
    //window.fileDoneStatus = ($(fileObj).attr("data-done") === "true");
    window.currentEvent = $(fileObj).data("eventid");
    //$("#preview-cur-file-name").text("Current file: NONE");
    $("#preview-third-1").removeClass("no-display");
    $("#preview-third-2").removeClass("no-display");
    $("#preview-third-3").removeClass("no-display");
    $("#preview-third-start").addClass("no-display");

    $("#footer-nav-btn1").removeClass("no-display");
    $("#footer-nav-btn5").removeClass("no-display");
    $("#footer-nav-btn6").removeClass("no-display");
    
    var eventJSON = window.currentFileContent["project-files"][window.currentEvent];
    $("#edit-A-edit-text").html(eventJSON.a);
    $("#edit-A-orig-text").html(eventJSON.a);
    $("#edit-B-edit-text").html(eventJSON.b);
    $("#edit-B-orig-text").html(eventJSON.b);
    $("#edit-C-edit-text").html(eventJSON.c);
    $("#edit-C-orig-text").html(eventJSON.c);

    /*
    HERE EDIT THE C SECTION TO SHOW PROPER ANSERWS FROM TRANSLATION FILE....


    */
    intUtils.sectionUtils.setupCsectionUI();



    //window.currentFileContent = store.get("src-data",[]);

    $(".secA-Q").text(i18n.__("secA-Q"));
    $(".secB-Q").text(i18n.__("secB-Q"));
    for (var k = 1; k < 15; k++) {
        $(".secC-Q-" + k).text(i18n.__("secC-Q-" + k));
        //logger.debug("round: secC-Q-" + k);
    }

    //$("#preview-subid").text("Submission ID: " + store.get("subID"));
    //$("#preview-subdate").text("Submission Date: " + store.get("subDATE"));

    // HERE, YOU CHECK AND SETUP KEYWORDS FOR THIS SPECIFIC FILE (and restart select2) remember to remove all "disabled" attr before adding them!
    // loop start
    var listofkw = eventJSON.kw;
    logger.debug("starting file-kwlist compare...");
    //logger.debug(listofkw);

    //$("#KW-selector").select2("destroy");

    for (var j = 0; j < listofkw.length; j++) {
        var kw_value = listofkw[j];// basic-13
        var kw_text = ""; // en-basic-13
        var kw_title = ""; // Name is This

        // would like to add "red" bgc if element does not exist in current kw-selector. currently only disables those already in there
        //logger.debug("3# VALUE: " + kw_value + " # TEXT: " + kw_text);
        //logger.debug($("#KW-selector option"));
        $("#KW-selector option").each(function (i) {
            if ($(this).val().substring(3, $(this).val().length) === kw_value) {
                //
                //logger.debug("YEEEEEEEEE :)");
                kw_text = $(this).val();
                kw_title = $(this).text();
                $(this).attr('disabled', 'disabled');
            }
        });

        //logger.debug("1# VALUE: " + kw_value + " # TEXT: " + kw_text);

        var li_string = document.createTextNode(kw_title);
        var li_node = document.createElement("li");
        var span_node = document.createElement("span");

        li_node.appendChild(li_string);
        span_node.innerHTML = "&times;";

        $(li_node).attr({
            class: "w3-display-container",
            "data-value": kw_text
        });

        $(span_node).attr({
            style: "height: 100%;",
            class: "w3-button w3-display-right",
            onmouseover: "$(this.parentElement).addClass('w3-hover-blue');",
            onmouseout: "$(this.parentElement).removeClass('w3-hover-blue');",
            onclick: "$(\"#KW-selector option\").each(function(i){if($(this).val().substring(3, $(this).val().length) === \"" + kw_value + "\"){$(this).removeAttr('disabled', 'disabled')}}); $(\"#KW-selector\").select2({placeholder: i18n.__('select2-kw-add-ph')}); $(this.parentElement.parentElement).trigger({type: 'deleted', params : {data: '" + kw_text + "'}}); $(this.parentElement).remove();"
        });
        //logger.debug("2# VALUE: " + kw_value + " # TEXT: " + kw_text);
        li_node.appendChild(span_node);

        $('#file-chosen-kw-ul').append(li_node); 

        //logger.debug("5# VALUE: " + kw_value + " # TEXT: " + kw_text);
    }
    // end loop, init element again
    $("#KW-selector").prop("disabled", false);
    $("#preview-event-country-select").prop("disabled", false);
    $("#preview-event-lang-select").prop("disabled", false);
    /*
     
     HERE, set proper event country and language to edit select2 elements! NEEDSTOBECHANGED
     
     
     */
    $("#KW-selector").select2({
        placeholder: i18n.__('select2-kw-add-ph')
    });
    $("#preview-event-country-select").val(eventJSON.country).trigger("change");
    $("#preview-event-lang-select").val(eventJSON.lang).trigger("change");
    
    $("#file-chosen-kw-ul").removeClass("element-disabled");
    //

    intUtils.sectionUtils.setupCensorSelect();
    intUtils.sectionUtils.updatePreview();
    intUtils.sectionUtils.updateCensoredList();
    intUtils.setFooterBtnMode("preview");
}


/* Show file import wizard so that new files may be imported into current project */
function addFilesPrompt(mode = -1) {
    logger.debug("addFilesPrompt");
    
    logger.debug("create import wizard");
    logger.info("Opening import wizard -window...");
    fileWizard = new BrowserWindow({
        width: 850,
        height: 710,
        resizable: true,
        minWidth: 850,
        minHeight: 710,
        devTools: true,
        frame: false,
        backgroundColor: '#dadada',
        show: false,
        modal: true,
        parent: firstWindow
    });

    let fileWizard_url = url.format({
        protocol: 'file',
        slashes: true,
        pathname: path.join(__dirname, '../html/importwizard.html')
    });
    fileWizard.loadURL(fileWizard_url);

    fileWizard.on('ready-to-show', function () {
        // check if need to automate...
        fileWizard.show();
        //return;
        if (mode === 1) {
            fileWizard.webContents.send("automate", true);
        } else { logger.warn("invalid mode in addFilesPrompt function!");}
    });

    fileWizard.on('closed', function () {
        logger.info("File Wizard window closed");
        fileWizard = null;
    });
}

/* THIS IS SETTING UP UI TRANSLATION */
function setupTranslations(applang = "en") {
    logger.debug("setupTranslations(init.js)");
    logger.info("Loading translations into UI (init)");

    // Set text to window here...
    if (window.currentProject === undefined) {
        $("#titlebar-appname").text(i18n.__('app-name-1') + " " + i18n.__('app-name-2'));
    } else {
        $("#titlebar-appname").text(i18n.__('app-name-1') + " " + i18n.__('app-name-2') + " - " + window.currentProject);
    }
}

electron.ipcRenderer.on('force-interface-update', (event, settings) => {
    logger.info("Received call to force interface update (init)");
    interfaceUpdate(settings);
});
/* update interface of this window */
function interfaceUpdate(settings = {}) {
    logger.debug("interfaceUpdate (init.js)");
    //logger.debug(settings.constructor);
    if (settings.constructor === {}.constructor) {
        if (Object.keys(settings).length !== 1) {
            //logger.debug("INT FAIL 1");
            settings = getSettings();
        } else if (!settings.hasOwnProperty("app")) {
            //logger.debug("INT FAIL 2");
            settings = getSettings();
        }
    } else if (!parseUtils.validateSettings(settings.app, 1)) {
        //logger.debug("INT FAIL 4");
        settings = getSettings();
    }
    /* setting current settings as window object (json) */
    window.allsettings = settings;

    /* only in main window! */
    $("body").css("zoom", settings.app.zoom / 100);

    /* Setting up UI texts */
    setupTranslations(settings.app["app-lang"]);
    intUtils.selectUtils.setupEditKW(settings);
    intUtils.updateSettingsUI();
}

function jquerySetup() {
    /* New function to make discarding <span> elements easier */
    $.fn.ignore = function (sel) {
        return this.clone().find(sel || ">*").remove().end();
    };
    
    var settings = getSettings();

    /* This sets up the language that ALL select2 select-fields will use */
    $.fn.select2.defaults.set('language', settings.app["app-lang"]);
}
interfaceUpdate();

/* If there was a backupfile mentioned in app properties */
if (window.allsettings.app.edits[0] === true || window.allsettings.app.edits[1] != null) {
    // there is unsaved backupfile available!
    logger.info("Unsaved backup mentioned in app properties! Asking if users wishes to open and edit it (App itself just launched)"); 
    //openAndViewProject(window.allsettings.app.edits[1], true, ___LOCATION_HERE______);
    //                     original_file_location
    // NEED TO TEST IF BACKUPFILE EXISTS, and send ITS LOCATION IN TOO
}
/* This is used to check if a file was opened with the application (to start it) */
else if (ipcRenderer.sendSync("get-ext-file-data","asd") !== null) {
    // there is something to be opened....
    logger.info("There is project that needs to be opened! (App itself just launched)");
    var ext_file_data = ipcRenderer.sendSync("get-ext-file-data", "asd");
    var forceprojres = openAndViewProject(ext_file_data);
    if (forceprojres[0]) {
        logger.info("New project (PATH)'" + ext_file_data + "' opened successfully!");
    }
    else {
        logger.error("Failed to open new project (PATH)'" + ext_file_data + "'! Reason: " + forceprojres[1]);
        $("#proj-open-error").text(forceprojres[1]);

        $("#proj-open-error").before($("#proj-open-error").clone(true));
        $("[id='proj-open-error']" + ":last").remove();
    }
}