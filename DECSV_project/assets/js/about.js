const remote = require('electron').remote;
const dialog = remote.dialog;
const thiswindow = remote.getCurrentWindow();

setupTranslations();

thiswindow.on('focus', function () { $("html").css("opacity", "1"); });
thiswindow.on('blur', function () { $("html").css("opacity", "0.5"); });
document.getElementById("win-close-icon").onclick = function () {
    thiswindow.close();
}

/* THIS IS SETTING UP UI TRANSLATION */
function setupTranslations() {
    logger.info("ABOUT-WINDOW Loading translations into UI...");

    //About
    //
}