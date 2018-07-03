'use strict';
//////////////////////////////////// CUSTOM ERROR MESSAGE
process.on('uncaughtException', function (err) {
    const electron = require('electron');
    const uncaugetdia = electron.dialog ? electron.dialog : electron.remote.dialog;
    const shell = electron.shell;
    logger.error("Uncaught Exception!");
    logger.error(err.message);
    var uncaughtoptions = {
        type: 'error',
        title: "Uncaught Exception",
        message: "Unknown error!",
        detail: "Something unexpected happened! Please check wiki-page if this is a known problem:\r\nERROR: " + err.message,
        buttons: ["Close notification", "Open Wiki"]
    };

    uncaugetdia.showMessageBox(uncaughtoptions, function (index) {
        // no need to deal with anything.... just notifying user
        if (index === 1) {
            //open wiki
            shell.openExternal("https://github.com/Tyaisurm/DECSV/wiki");
        } else {
            // close, do nothing
        }
    });
});
////////////////////////////////////

const remote = require('electron').remote;
const { ipcRenderer } = require('electron')
const BrowserWindow = remote.BrowserWindow;
const dialog = remote.dialog;
const firstWindow = remote.getCurrentWindow();
const fs = require('fs');
const autoUpdater = remote.autoUpdater;
const path = require('path');
const url = require('url');

//const Store = require('electron-config');
const Store = require("electron-store");

//import intUtils from './intUtils.js';
const intUtils = require(path.join(__dirname, './intUtils.js'));
const parseUtils = require(path.join(__dirname,'./parseUtils.js'));

ipcRenderer.on('output-to-chrome-console', function (event, data) {
    console.log("#%#%#%#%#% OUTPUT_CHROME %#%#%%#%#%#%");
    console.log(data);
});



/* New function to make discarding <span> elements easier */
$.fn.ignore = function (sel) {
    return this.clone().find(sel || ">*").remove().end();
};

var langopt_123 = {
    name: "app-configuration",
    cwd: remote.app.getPath('userData')
}
var langstore_123 = new Store(langopt_123);
/* This sets up the language that ALL select2 select-fields will use */
$.fn.select2.defaults.set('language', langstore_123.get("app-lang","en"));
/*
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
*/

/* Getting global functions.... */
let aboutCreatFunc = remote.getGlobal('createAboutWin');// does not take parameters
let createDummyDialog = remote.getGlobal('createDummyDialog');// takes in calling BrowserWindow-element as parameter

/* Global settings getter and setter */
var getSettings = remote.getGlobal('getSettings');
var setSettings = remote.getGlobal('setSettings');

logger.debug("Running init...");

///////////////////////////////////////////////////////// STARTUP FUNCTIONS
setupTranslations();
intUtils.selectUtils.setSettingsLoadedKW();

intUtils.selectUtils.setAppLang();
intUtils.selectUtils.setKWListAvailable();

intUtils.updateSettingsUI();
intUtils.selectUtils.setupEditKW();
intUtils.selectUtils.setCreateProjSelect();
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

    // going through yellow file list elements (as in currently opened/selected)
        $('#proj-files-ul li.w3-yellow').each(function (i) {
            done = ($(this).attr('data-done') === "true");
            country = $(this).attr('data-country');
            country = $(this).attr('data-lang');
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
            var value = $(this).attr("data-value").substring(3, test.length - 1);
            //$(this).find('span').remove(); // no need to remove span, since we don't need text
            dataKW.push(value);
        });
        var notes = [];
        $("#proj-notes-ul li").each(function (i) {
            var text = $(this).ignore("span").text();
            notes.push(text);
        });

        // saving these to window-variable and backup, but since we are closing, but NO into actual file (no need to promp, because handleClosing() deals with it)
        saveProject(0, dataA, dataB, dataC, dataKW, notes, done, country, lang);//mode, dataA, dataB, dataC, kw, notes, done, country, lang
    }
    else {
        logger.warn("No open project to be saved! Window.currentProject undefined!");
    }
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
        country = $(this).attr('data-country');
        country = $(this).attr('data-lang');
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
        var value = $(this).attr("data-value").substring(3, test.length - 1);
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
}
//////////////////////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////////////////////// INPUT LISTENERS
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
            var download_data = "Downloading " + (Math.round((progressObj.transferred / 1000000) * 100) / 100) + "MB/" + (Math.round((progressObj.total / 1000000) * 100) / 100) + "MB at " + (Math.round((progressObj.bytesPerSecond / 1000) * 100) / 100) + " kBps";
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

document.getElementById("downloadandupdatekeywords").onclick = function () {//NEEDSTOBECHANGED
    logger.debug("downloadandupdatekeywords button");
    createDummyDialog(firstWindow);
    /*
    var loadable_kw_lists = $("#kw-list-available-choose").val();
    logger.debug("WOULD be downloading: " + loadable_kw_lists);

    var local_kw_lists = [];
    $("#settings-local-kw-lists li").each(function (i) {
        local_kw_lists.push($(this).attr("data-id"));
    });
    logger.debug("WOULD be updating: " + local_kw_lists);
    
    //checkAndUpdateKWLists();
    // REMEMBER TO SET "NAME" TO KW LISTS properties-file FROM THE FIRST ELEMENT within the .json file, when you have downloaded them!!!!!!
    */
}
//////////////////////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////////////////////// UPPER NAV BAR LISTENERS / BUTTONS
document.getElementById("addfilebutton").onclick = function () {
    logger.debug("addfile button");
    createDummyDialog(firstWindow);
    return;
    //
    addFilesPrompt(); //NEEDSTOBECHANGED
}

document.getElementById("projinfobutton").onclick = function () {// NEEDSTOBECHANGED
    logger.debug("projinfo button");
    
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
        var proj_base = path.join(docpath, 'SLIPPS DECSV\\Projects\\' + window.currentProject + '\\');
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
        for (i = 0; i < allkw.length; i++) {//&%&&%%&&¤&¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤
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
    logger.debug("RECEIVED REQUESST");
    logger.debug("fromwindowID: " + fromWindowId);
    var result = [];
    result.push(window.currentProject, window.currentFileContent);
    var fromWindow = BrowserWindow.fromId(fromWindowId);
    fromWindow.webContents.send('get-project-data-reply', result);
});

document.getElementById("exportprojbutton").onclick = function () {// NEEDSTOBECHANGED
    logger.debug("exportproject button");
    createDummyDialog(firstWindow);
    return;

    //export "done" marked project files 
    var options = {
        type: 'info',
        title: "Exporting files",
        message: "Files marked 'DONE' will be exported!",
        detail: "Exporting files into csv-format. Editing will be disabled until export is finished.",
        buttons: [i18n.__('conf-yes'), i18n.__('conf-no')]
    };

    ////////////////////////////////////////////////////////////////// Saving before exporting..... 
    var country = "";
    var lang = "";
    var done = false;

    if (window.currentProject !== undefined) {

    // going through yellow file list elements (as in currently opened/selected)
        $('#proj-files-ul li.w3-yellow').each(function (i) {
            done = ($(this).attr('data-done') === "true");
            country = $(this).attr('data-country');
            lang = $(this).attr('data-lang');
        });

    
        var dataA = $("#edit-A-orig-text").html();
        var dataB = $("#edit-B-orig-text").html();
        intUtils.sectionUtils.clearCsectionUI();
        var dataC = $("#edit-C-orig-text").html();
        var dataKW = [];

        $("#file-chosen-kw-ul li").each(function (i) {
            var value = $(this).attr("data-value").substring(3, test.length - 1);
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

    dialog.showMessageBox(firstWindow, options, function (index) {
        if (index === 0) {
            //
            logger.debug("exporting.......");
            
            // need to disable ALL controls from user!!!
            var asdwin = new BrowserWindow({
                width: 500,
                height: 400,
                resizable: true,
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

document.getElementById("closeprojbutton").onclick = function () {
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
            var country = "";
            var lang = "";
            var done = false;

            if (window.currentProject !== undefined) {
                var close_opt = {
                    name: "app-configuration",
                    cwd: remote.app.getPath('userData')
                }
                var close_store = new Store(close_opt)
                // testing if pending edits that need to be saved
                if (close_store.get("edits", [false, null])[0]) {

                    $('#proj-files-ul li.w3-yellow').each(function (i) {
                        done = ($(this).attr('data-done') === "true");
                        country = $(this).attr('data-country');
                        lang = $(this).attr('data-lang');
                    });

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
                        var value = $(this).attr("data-value").substring(3, test.length - 1);
                        $(this).find('span').remove();
                        dataKW.push(value);
                    });

                    var notes = [];
                    $("#proj-notes-ul li").each(function (i) {
                        var text = $(this).ignore("span").text();
                        notes.push(text);
                    });


                    var options = {
                        type: 'info',
                        title: i18n.__("conf-title"),
                        message: "There are pending changes!",
                        detail: "Do you wish to save these changes?",
                        buttons: [i18n.__('conf-yes'), i18n.__('conf-no')]
                    };

                    dialog.showMessageBox(firstWindow, options, function (index) {
                        if (index === 0) {
                            //save changes into file
                            // saving, because we are about to close the current project and return into start-view (only backup-file, but need to be prompted to save to file)
                            saveProject(1, dataA, dataB, dataC, dataKW, notes, done, country, lang);//mode, dataA, dataB, dataC, kw, notes, done, country, lang
                        }
                        else {
                            //remove backup data
                            saveProject(2);
                        }
                    });
                }
            } else {
                logger.warn("No open project to be saved! Window.currentProject undefined!");
            }

            // Setting UI to start view (hiding edit-view preview-parts A, B and C away)
            $("#preview-third-1").addClass("no-display");
            $("#preview-third-2").addClass("no-display");
            $("#preview-third-3").addClass("no-display");
            $("#preview-third-start").removeClass("no-display");

            // deleting window-variables that identify the current project
            window.currentProject = undefined;
            window.currentFile = undefined;
            window.currentFileContent = undefined;
            window.currentEvent = undefined;

            // Clearing section items and setting footer button mode. Also toggling proper view
            intUtils.setFooterBtnMode("project-closed");
            intUtils.sectionUtils.clearElements();
            $("#titlebar-appname").text("SLIPPS Teacher Tool");// {Alpha version " + remote.app.getVersion() + "}")
            //$("#preview-cur-file-name").text("Current file: NONE");
            //$("#preview-subid").text("Submission ID:");
            //$("#preview-subdate").text("Submission Date:");
            intUtils.toggleViewMode(0);
            intUtils.toggleViewMode(10);
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
        $("#kw-list-available-choose").val(null).trigger("change");
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
    if (fs.existsSync(path.join(docpath, "SLIPPS DECSV\\Projects\\"))){
        var options = {
            title: i18n.__('open-project-prompt-window-title'),
            defaultPath: path.join(docpath, "SLIPPS DECSV\\Projects\\"),
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
                    logger.info("Successfully opened project '"+projname+"'!");
                }
                else {
                    logger.error("Failed to open existing project! Reason: "+opened_res[1]);
                    $("#proj-open-error").text(opened_res[1]);
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
//////////////////////////////////////////////////////////////////////////////////////////////
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
        $("#edit-A-orig-text").html($("#edit-A-edit-text").html());
        intUtils.sectionUtils.updatePreview();
        intUtils.sectionUtils.updateCensoredList();
        //NEEDSTOBECHANGED save project to temp
    }
    else if (value === "editB") {
        intUtils.toggleViewMode(1);
        intUtils.toggleViewMode(9);
        // save B edits and update preview
        $("#edit-B-orig-text").html($("#edit-B-edit-text").html());
        intUtils.sectionUtils.updatePreview();
        intUtils.sectionUtils.updateCensoredList();
        //NEEDSTOBECHANGED save project to temp
    }
    else if (value === "editC") {
        intUtils.toggleViewMode(1);
        intUtils.toggleViewMode(9);
        // save C edits and update preview
        $("#edit-C-orig-text").html($("#edit-C-edit-text").html());
        intUtils.sectionUtils.updatePreview();
        intUtils.sectionUtils.updateCensoredList();
        //NEEDSTOBECHANGED save project to temp
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
            detail: "If you set language, it will take effect on next startup.",
            buttons: [i18n.__('conf-yes'), i18n.__('conf-no')]
        };

        dialog.showMessageBox(firstWindow, options, function (index) {
            if (index === 0) {
                saveSettings();
            }
            else {
                //
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
        $("#kw-list-available-choose").val(null).trigger("change");
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
            intUtils.setFooterBtnMode("preview");
        });
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


///////////////////////////////////////////////////////////////

/////////////////////////////////////////////////////////////// FUNCTIONS

/* Creates new project ASYNC!! (IPC to app.js) */
function createProjAsync(project_name = "", project_country = "", project_lang = "") {
    if ($("#new-proj-create-input").val().trim().length < 1) {
        //do nothing
        $("#create-proj-error").text("Name should not be empty!");
        return;
    }
    else if (project_country === null || project_country.length !== 2) {
        $("#create-proj-error").text("Select a country!");
        return;
    }
    else if (project_lang === null || project_lang.length !== 2) {
        $("#create-proj-error").text("Select a language!");
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
                        }
                    }
                    else {
                        var reason_id = arg[1];
                        var reason = i18n.__('create-proj-fail-'+reason_id);
                        logger.error("Unable to create new project '" + project_name + "'! Reason: " + reason);
                        $("#create-proj-error").text(reason);
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

/* NEED TO BE DEACTIVATED!!! */
/* Handles moving source files into project folder and generating temp-files ASYNC!! (IPC to app.js) */
function sourceFiles2ProjAsync(files) { // Last object of "files" will be name of the project where files will be added to NEEDSTOBECHANGED
    logger.debug("sourceFiles2ProjAsync");
    var proj_name = files[files.length - 1];
    var docpath = remote.app.getPath('documents');

    var f2p_options = {
        name: proj_name,
        cwd: path.join(docpath, 'SLIPPS DECSV\\Projects\\' + proj_name + '\\')
    }
    const f2p_store = new Store(f2p_options);//
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
            var reason1 = arg[1];
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
                    fileArr.push(arg[1][a][0], arg[1][a][1],arg[1][a][2]); // NEEDS UPDATE!!!!!! CUSTOM INPUT
                    addProjFile(fileArr);
                }
            }
            else {
                logger.error("SRC to TEMP conversion failed!");
                var reason2 = arg[1];
                // SHOW REASON TO USER!

                //folders missing
            }
            //var testing_opt = {
            //    name: "temp#"+arg[1][0],
            //    cwd: path.join(docpath, 'SLIPPS DECSV\\Projects\\' + proj_name + '\\temp\\')
            //}
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
            var filetemp = k;
            var fileorig = tempfiles[k]["src-file"];
            var filedone = tempfiles[k]["done"];
            var filelang = tempfiles[k]["lang"];
            var filecountry = tempfiles[k]["country"];
            //logger.debug("FROM TEMP FILE IN UPDATEFILELIST");
            //logger.debug(filedone);
            //logger.debug(typeof(filedone));
            var fileArr = [];
            fileArr.push(fileorig, filetemp, filedone, filelang, filecountry);// NEEDSTOBECHANGED
            addProjFile(fileArr);
        }
    }
}

/* Called when project is opened */
function openAndViewProject(proj_location) {
    logger.debug("openAndViewProject");
    var file_ext = proj_location.split('.').pop();
    var proj_name = proj_location.split('\\').pop();
    proj_name = proj_name.split(".");
    proj_name.pop();
    proj_name.join(".");

    var regex_filepath_val = /^[^\\/:\*\?"<>\|]+$/;
    var docpath = remote.app.getPath('documents');
    var reason = [];

    if (proj_location === undefined) {
        // Projectname not defined
        reason.push(false, "Project to be opened not defined!");
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

    $("#titlebar-appname").text("SLIPPS Teacher Tool" + " - " + proj_name); // ONLY AFTER EVERYTHING HAS BEEN CHECKED!!!!!
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

    var backup_opt = {
        name: proj_name,
        cwd: path.join(apppath, 'backup_files')
    }
    logger.info("Saving backup copy: "+path.join(apppath, proj_name+".json"));
    const backup_store = new Store(backup_opt);
    backup_store.store = json_file;

    // Adding simple details to UI:
    $("#proj-info-name").text("Project Name: \"" + proj_name + "\"");
    $("#proj-info-created").text("Created: " + new Date(json_file["created"]));//NEEDSTOBECHANGED

    //var source_files = open_store.get("source-files", null);
    //console.log(source_files);


    //var temp_files = open_store.get("temp-files", {});
    //console.log(temp_files);
    /*
    for (var k in temp_files) {
        console.log("1: ");
        console.log(k);
        if (temp_files.hasOwnProperty(k)) {
            console.log("2: ");
            console.log(temp_files[k]);
            console.log(temp_files[k].file);
        }
    }
    */

    //var kw_per_file = open_store.get("kw-per-file", null);
    //console.log(kw_per_file);

    /*
    for (var k in kw_per_file) {
        console.log("#1: ");
        console.log(k);
        if (kw_per_file.hasOwnProperty(k)) {
            console.log("#2: ");
            console.log(kw_per_file[k]);
        }
    }
    */

    var proj_notes = json_file["notes"];
    //console.log("NOTES: ");
    //console.log(proj_notes);
    for (var i = 0; i < proj_notes.length; i++) {
        //console.log(i + "  " + proj_notes[i]);
        addProjNote(proj_notes[i]);
    }
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
        onclick: "$(this.parentElement).remove();intUtils.markPendingChanges(true, window.currentFile);"
    });// NEEDSTOBECHANGED

    li_node.appendChild(span_node);

    $('#proj-notes-ul').append(li_node);

}

/* Add given filename + details into EDIT-view filelist ul-element */
//fileArr.push(fileorig, filetemp, filedone, filelang, filecountry);
function addProjFile(fileArr) {
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
    // filearr 0 = fileoriginal, 1 = filetemp / name, 2 = filedonestatus, 3 = filelanguage, 4 = filecountry
    var li_string = document.createTextNode(fileArr[1]);
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
    if (fileArr[2]) {
        classes = classes + " w3-green";
    }
    $(li_node).attr({
        style: "cursor:pointer;",
        class: classes,
        onmouseover: "$(this).addClass('w3-hover-blue');",
        onmouseout: "$(this).removeClass('w3-hover-blue');",
        "data-orig": fileArr[0],
        "data-temp": fileArr[1],
        "data-done": fileArr[2],
        "data-lang": fileArr[3],
        "data-country": fileArr[4]
    });
    $('#proj-files-ul').append(li_node);
    $('#proj-files-ul li').off('click');
    $('#proj-files-ul li').on('click', function () {
        logger.debug('CLICKED FILE OBJECT!');
        logger.debug($(this).text());
        var done = false;
        if ($(this).hasClass("w3-yellow")) {
            // do nothing
            logger.warn("Tried to open already showed event!");
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
                for (var k = 1; k < 15; k++) {
                    $("#edit-C-orig-text .secC-Q-" + k).empty();
                }
                var dataA = $("#edit-A-orig-text").html();
                var dataB = $("#edit-B-orig-text").html();
                intUtils.sectionUtils.clearCsectionUI();
                var dataC = $("#edit-C-orig-text").html();
                var dataKW = [];
                $("#file-chosen-kw-ul li").each(function (i) {
                    var value = $(this).attr("data-value").substring(3, test.length - 1);
                    $(this).find('span').remove();
                    //var name = $(this).text();
                    //logger.debug("THIS IS AFTER REMOVAL!!!!");
                    //logger.debug(name);

                    dataKW.push(value);
                });
                var notes = [];
                $("#proj-notes-ul li").each(function (i) {
                    var text = $(this).ignore("span").text();
                    //logger.error("text_5: " + text);
                    notes.push(text);
                });
                // triggering save project, because we are switching to different event
                saveProject(dataA, dataB, dataC, dataKW, notes, done);//mode, dataA, dataB, dataC, kw, notes, done, country, lang
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
                placeholder: i18n.__('select2-kw-add-ph')
            });
            openAndShowFile(this);
        }
    });
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
    if (current_event !== undefined) {
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
        }
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
    window.currentEvent = $(fileObj).text();

    //$("#preview-cur-file-name").text("Current file: NONE");
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
        name: 'temp#'+$(fileObj).text(),
        cwd: temp_base
    }
    const store = new Store(options);//

    $("#edit-A-edit-text").html(store.get("a",""));
    $("#edit-A-orig-text").html(store.get("a",""));
    $("#edit-B-edit-text").html(store.get("b",""));
    $("#edit-B-orig-text").html(store.get("b",""));
    $("#edit-C-edit-text").html(store.get("c",""));
    $("#edit-C-orig-text").html(store.get("c", ""));

    /*
    HERE EDIT THE C SECTION TO SHOW PROPER ANSERWS FROM TRANSLATION FILE....


    */
    intUtils.sectionUtils.setupCsectionUI();



    window.currentFileContent = store.get("src-data",[]);

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
            onclick: "$(\"#KW-selector option\").each(function(i){if($(this).val().substring(3, $(this).val().length) === \"" + kw_value.substring(3, kw_value.length) + "\"){$(this).removeAttr('disabled', 'disabled')}}); $(this.parentElement).remove(); $(\"#KW-selector\").select2({placeholder: i18n.__('select2-kw-add-ph')});"
        });
        //logger.debug("2# VALUE: " + kw_value + " # TEXT: " + kw_text);
        li_node.appendChild(span_node);

        $('#file-chosen-kw-ul').append(li_node); 


        // would like to add "red" bgc if element does not exist in current kw-selector. currently only disables those already in there
        //logger.debug("3# VALUE: " + kw_value + " # TEXT: " + kw_text);
        //logger.debug($("#KW-selector option"));
        $("#KW-selector option").each(function (i) {
            if ($(this).val().substring(3, $(this).val().length) === kw_value.substring(3, kw_value.length)){
                //
                //logger.debug("YEEEEEEEEE :)");
                $(this).attr('disabled','disabled');
            }
        });

        //logger.debug("5# VALUE: " + kw_value + " # TEXT: " + kw_text);
    }
    // end loop, init element again
    $("#KW-selector").prop("disabled", false);
    
    $("#KW-selector").select2({
        placeholder: i18n.__('select2-kw-add-ph')
    });
    
    $("#file-chosen-kw-ul").removeClass("element-disabled");
    //

    intUtils.sectionUtils.setupCensorSelect();
    intUtils.sectionUtils.updatePreview();
    intUtils.sectionUtils.updateCensoredList();
    intUtils.setFooterBtnMode("preview");
}


// NEEDS CHANGES!!!! NEEDSTOBECHANGED 
/* Called when settings on SETTINGS-view are saved */
function saveSettings() {
    // okay, we need to create json here, that will be sent to main setSettings(json) function.....
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
        logger.debug("ADDED KW LIS: " + kw_list_id);
    });
    store2.set("enabled-keywordlists", enabledKW);

    intUtils.selectUtils.setupEditKW();
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

// NEEDS UPDATES!!!!!!NEEDSTOBECHANGED
/* Show file browser so that new files may be imported into current project */
function addFilesPrompt() {
    logger.debug("addFilesPrompt");
    var project_name = window.currentProject;

    var docpath = remote.app.getPath('documents');
    var options = {
        title: i18n.__('open-file-prompt-window-title'),
        defaultPath: docpath,
        filters: [
            { name: 'Spreadsheet', extensions: ['csv'] }
        ],
        properties: ['openFile'
        ]
    }//, 'xls', 'xlsx', 'multiSelections'<<<<--- because we need to ask where is this file from
    function callback(fileNames) {

        if (fileNames !== undefined) {
            fileNames.push(project_name);
            sourceFiles2ProjAsync(fileNames);// NEEDSTOBECHANGED
            return;
        }
        logger.warn("No file(s) chosen to be opened!");
    }
    dialog.showOpenDialog(firstWindow, options, callback);
}

///NEEDS UPDATE
/* This function parses data for textareas that are CURRENTLY USED
        => Will be changed */
/*
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
*/

///NEEDS UPDATE
/* This function puts C section answers into right places */
/*
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
*/

///NEEDS UPDATE
/* This function shows pre-selected words from the file */
/*
function loadKeyWords(keys) {
    for (var i = 0; i < keys.length; i++) {
        var to_appended = '<li class="list-keys-elem">' + keys[i] + '</li>';
        $("#aside-key-list").append(to_appended);
        paintEmAll(keys[i], 0);
    }
    updateKeywordsList();
}
*/

///NEEDS UPDATE
/*
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
*/
//%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%5


///NEEDS UPDATE
/* True if is found, false otherwise */
/*
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
*/

///NEEDS UPDATE
// mode 0 = paint all words as "keys"; mode 1 = remove "keys" marks from words
/*
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
*/

/* THIS IS SETTING UP UI TRANSLATION */
function setupTranslations() {
    logger.debug("setupTranslations(init.js)");
    logger.info("Loading translations into UI...");

    // Set text to window here...

    $("#titlebar-appname").text("SLIPPS Teacher Tool");// {Alpha version " + remote.app.getVersion() + "}");
}