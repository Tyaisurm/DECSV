﻿'use strict';
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
const shell = require('electron').shell;
const fs = require('fs');
const path = require('path');
const dialog = remote.dialog;
const thiswindow = remote.getCurrentWindow();
var cdtimer = -10;

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
        if (!fs.existsSync(path.join(desktop, 'logs'))) {
            logger.debug("not exists");
            fs.mkdirSync(path.join(desktop, 'logs'));
        } else if (!fs.statSync(path.join(desktop, 'logs')).isDirectory()) {
            logger.debug("not directory");
            fs.mkdirSync(path.join(desktop, 'logs'));
        }
        var logname = "logs\\log_" + new Date().toDateString()+".log";
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
function setupTranslations() {
    logger.debug("setupTranslations (about)");
    //logger.info("ABOUT-WINDOW Loading translations into UI...");
    // Set window texts here
    $("#about-version").text("Version: Alpha " + remote.app.getVersion());
}
setupTranslations();