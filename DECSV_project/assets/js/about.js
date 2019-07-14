'use strict';
//////////////////////////////////// CUSTOM ERROR MESSAGE
process.on('uncaughtException', function (err) {
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
        buttons: ["Close application", "Open Wiki"]
    };

    uncaugetdia.showMessageBox(electron.remote.getCurrentWindow(), uncaughtoptions, function (index) {
        // no need to deal with anything.... just notifying user
        if (index === 1) {
            //open wiki
            shell.openExternal("https://github.com/Tyaisurm/DECSV/wiki");
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
const shell = electron.shell;
const fs = require('fs');
const path = require('path');
const dialog = remote.dialog;
const thiswindow = remote.getCurrentWindow();
var cdtimer = -10;
const getSettings = remote.getGlobal("getSettings");
const parseUtils = require(path.join(__dirname, "parseUtils.js"));

///////////////////////////////////////////////////////////////////////////////// SCREEN LISTENERS
thiswindow.on('focus', function () { $("html").css("opacity", "1"); });
thiswindow.on('blur', function () { $("html").css("opacity", "0.5"); });
document.getElementById("win-close-icon").onclick = function () {
    thiswindow.close();
}

document.getElementById("wiki-button").onclick = function () {
    logger.debug("wiki-button");
    shell.openExternal("https://github.com/Tyaisurm/DECSV/wiki");
}
document.getElementById("logs-button").onclick = function () {
    logger.debug("logs-button");
    if (cdtimer !== -10) {
        // timer not done
        return -1;
    } else {
        $("#logs-button").addClass("w3-disabled");
        timer();
    }

    // create new directory to user's desktop (or overwrite)
    // copy log file from application directory to that folder (overwrite if needed)
    // update text!
    var desktop = remote.app.getPath('desktop');
    try {
        if (!fs.existsSync(path.join(desktop, 'Logs'))) {
            logger.debug("not exists");
            fs.mkdirSync(path.join(desktop, 'Logs'));
            logger.info("Logs directory created to user's desktop!");
        } else if (!fs.statSync(path.join(desktop, 'Logs')).isDirectory()) {
            logger.debug("not directory");
            fs.mkdirSync(path.join(desktop, 'Logs'));
            fs.mkdirSync(path.join(desktop, 'Logs'));
            logger.info("Logs directory created to user's desktop!");
        }
        var logname = "Logs\\log_" + new Date().toDateString()+".log";
        var data = "";
        var appdata = remote.app.getPath("userData");
        //logger.debug(path.join(appdata, "log.log"));
        //logger.debug(fs.accessSync(path.join(appdata, "log.log")));

        fs.accessSync(path.join(appdata, "log.log")); // if fails, throws error

        if (!fs.statSync(path.join(appdata, "log.log")).isDirectory()) {
            //logger.debug("second check");
            data = fs.readFileSync(path.join(appdata, "log.log"), 'utf8');
        } else {
            //logger.debug("fail 2");
        }
        
        fs.writeFileSync(path.join(desktop, logname), data, 'utf-8');

    } catch (err) {
        //
        logger.error("Error while creating logfile!");
        logger.error(err.message);
    }
}
/////////////////////////////////////////////////////////////////////////////////

function timer() {
    logger.debug("timer");
    cdtimer = 5;
    var timer = setInterval(function () {
        //document.getElementById('safeTimerDisplay').innerHTML = '00:' + sec;
        cdtimer--;
        if (cdtimer < 0) {
            clearInterval(timer);
            cdtimer = -10;
            $("#logs-button").removeClass("w3-disabled");
        }
    }, 1000);
}

/* THIS IS SETTING UP UI TRANSLATION */
function setupTranslations(applang = "en") {
    logger.debug("setupTranslations (about)");
    logger.info("Loading translations into UI (about)");
    // Set window texts here
    $("#about-version").text(i18n.__('about-window-version') + ": " +remote.app.getVersion());
    $("#titlebar-appname").text(i18n.__('about-window-title'));
    $("#app-name-1").text(i18n.__('app-name-1'));
    $("#app-name-2").text(i18n.__('app-name-2'));
    $("#wiki-button").text(i18n.__('about-window-wiki-btn'));
    $("#logs-button").text(i18n.__('about-window-collect-logs-btn'));
}

electron.ipcRenderer.on('force-interface-update', (event, settings) => {
    logger.info("Received call to force interface update (about)");
    interfaceUpdate(settings);
});
/* update interface of this window */
function interfaceUpdate(settings = {}) {
    logger.debug("interfaceUpdate (about.js)");
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
interfaceUpdate();