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
/////////////////////////////////////////////////////////////////////////////////

$("#about-version").text("Version: Alpha " + remote.app.getVersion());

/* THIS IS SETTING UP UI TRANSLATION */
function setupTranslations() {
    //logger.info("ABOUT-WINDOW Loading translations into UI...");
    // Set window texts here
}
setupTranslations();