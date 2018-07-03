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
const shell = require('electron').shell;
const dialog = remote.dialog;
const thiswindow = remote.getCurrentWindow();

///////////////////////////////////////////////////////////////////////////////// SCREEN LISTENERS
thiswindow.on('focus', function () { $("html").css("opacity", "1"); });
thiswindow.on('blur', function () { $("html").css("opacity", "0.5"); });
document.getElementById("win-close-icon").onclick = function () {
    thiswindow.close();
}

document.getElementById("wiki-button").onclick = function () {
    shell.openExternal("https://github.com/Tyaisurm/DECSV/wiki");
}
document.getElementById("logs-button").onclick = function () {
    // create new directory to user's desktop (or overwrite)
    // copy log file from application directory to that folder (overwrite if needed)
    // update text!
    $("#about-log-info").text("Logs Collected!");
}
/////////////////////////////////////////////////////////////////////////////////

$("#about-version").text("Version: Alpha " + remote.app.getVersion());

/* THIS IS SETTING UP UI TRANSLATION */
function setupTranslations() {
    //logger.info("ABOUT-WINDOW Loading translations into UI...");
    // Set window texts here
}
setupTranslations();