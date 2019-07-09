'use strict';

const electron = require('electron');
const remote = electron.remote;
const ipcRenderer = electron.ipcRenderer;
const thisWindow = remote.getCurrentWindow();
const getSettings = remote.getGlobal("getSettings");

/////////////////7

jquerySetup();

///////////////

/* THIS IS SETTING UP UI TRANSLATION */
function setupTranslations(applang = "en") {
    logger.debug("setupTranslations(init.js)");
    logger.info("Loading translations into UI (init)");

    // Set text to window here...

    $("#open-update-text").text("");
    $("#open-tool-name-1").text(i18n.__('app-name-1'));
    $("#open-tool-name-2").text(i18n.__('app-name-2'));
}

ipcRenderer.on('force-interface-update', (event, settings) => {
    logger.info("Received call to force interface update (openwin)");
    interfaceUpdate(settings);
});

ipcRenderer.on('open-update-setup', (event, args) => {
    ipcRenderer.send("check-updates", "");
});
/* update interface of this window */
function interfaceUpdate(settings = {}) {
    logger.debug("interfaceUpdate (openwin.js)");
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
    //$("body").css("zoom", settings.app.zoom / 100);

    /* Setting up UI texts */
    setupTranslations(settings.app["app-lang"]);
}

function jquerySetup() {
    /* New function to make discarding <span> elements easier */
    $.fn.ignore = function (sel) {
        return this.clone().find(sel || ">*").remove().end();
    };

    //var settings = getSettings();
    /* This sets up the language that ALL select2 select-fields will use */
    //$.fn.select2.defaults.set('language', settings.app["app-lang"]);
}
interfaceUpdate();

// returned values from auto-updater listeners->
// 0 = checking
// 1 = update found
// 2 = no update available
// 3 = error
// 4 = downloading %
// 5 = downloaded
//     arr.push(5, ver, relDat, relNote); downloaded & available
/*
 "open-update-search": "Checking for updates...",
  "open-update-found": "Update found!",
  "open-update-downloading": "Downloading ",
  "open-update-restarting": "Installing and restarting...",
  "open-update-error": "Failed to check for updates!",
  "open-update-nothing": "No updates available!",
  "open-update-finish": "Update downloaded!",
 */
ipcRenderer.on('check-updates-reply', (event, arg) => {
    logger.debug("RETURNED FROM APP: " + arg);
    if (arg[0] === 0) {
        // checking...
        $("#open-update-text").text(i18n.__('open-update-search'));
    }
    else if (arg[0] === 1) {
        $("#open-update-text").text(i18n.__('open-update-found'));
        //ipcRenderer.send("async-creat-mainwindow", "");
        //arg[1];
        //arg[2];
        //arg[3];
        // update found
    }
    else if (arg[0] === 2) {
        // no update available
        $("#open-update-text").text(i18n.__('open-update-nothing'));
        ipcRenderer.send("async-creat-mainwindow", "");
    }
    else if (arg[0] === 3) {
        // error
        $("#open-update-text").text(i18n.__('open-update-error'));
        ipcRenderer.send("async-creat-mainwindow", "");
    }
    else if (arg[0] === 4) {
        // downloading...
        var progressObj = arg[1];
        var download_data = i18n.__("open-update-downloading") + (Math.round((progressObj.transferred / 1000000) * 100) / 100) + "MB/" + (Math.round((progressObj.total / 1000000) * 100) / 100) + "MB @ " + (Math.round((progressObj.bytesPerSecond / 1000) * 100) / 100) + " kBps";
        var download_percent = progressObj.percent;

        if (arg[1] = 100) {
            //completed download
            $("#open-update-text").text('open-update-finish');
        } else {
            $("#open-update-text").text(download_data);
        }
    }
    else if (arg[0] === 5) {
        // mark download progress as 100%
        //var download_percent = 100;
        $("#open-update-text").text('open-update-restarting');
        var ver = arg[1];
        var relDat = arg[2];
        var relNote = arg[3];
        //
        // downloaded
    }
});