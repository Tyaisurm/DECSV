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
        buttons: ["Close application", "Open Wiki"],
        browserWindow: electron.remote.getCurrentWindow()
    };

    uncaugetdia.showMessageBox(uncaughtoptions, function (index) {
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
const path = require('path');
const remote = electron.remote;
const shell = electron.shell;
const dialog = remote.dialog;
const thiswindow = remote.getCurrentWindow();
const getSettings = remote.getGlobal("getSettings");
const intUtils = require(path.join(__dirname, './intUtils.js'));
const ipcRenderer = electron.ipcRenderer;

///////////////////////////////////////////////////////////////////////////////// SCREEN LISTENERS
thiswindow.on('focus', function () { $("html").css("opacity", "1"); });
thiswindow.on('blur', function () { $("html").css("opacity", "0.5"); });
document.getElementById("win-close-icon").onclick = function () {
    thiswindow.close();
}
document.getElementById("import-wiz-file-btn").onclick = function () {
    // open file dialog
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
            // set this to window element
            $("#import-wiz-file-name").text(fileNames[0]);
            $("#import-wiz-file-name").attr("data-file",fileNames[0]);
            logger.info("Selected file: '"+fileNames[0]+"'");
            return;
        }
        logger.warn("No file(s) chosen to be opened!");
    }
    dialog.showOpenDialog(thiswindow, options, callback);
    
}
document.getElementById("import-wiz-import-btn").onclick = function () {
    // test if fields are filled, validate file (name only), and send result to init.js as ipcRenderer argument
    logger.debug("PRESSED IMPORT BUTTON (need to check input)");
    var import_tool = $("#file-import-tool").select2('val');
    var import_file = $("#import-wiz-file-name").attr("data-file");
    var filenamecheck = checkFilePath(import_file);

    if (import_tool === "" || import_tool === null || import_tool === undefined) {
        // no tool defined
        logger.info("No survey tool defined! Can't import!");
        $("#import-wiz-err-text").text("No survey tool defined!");
    } else if (!filenamecheck) {
        // invalid file path
        logger.info("Filepath invalid! Can't import!");
        $("#import-wiz-err-text").text("Invalid file path!");
    } else {
        // importing...
        logger.info("Trying to import file '"+import_file.split("\\").pop()+"' to project...");
        $("#import-wiz-err-text").text("");
        $("#import-wiz-import-btn").attr("disabled", "disabled");
        $("#import-wiz-file-btn").attr("disabled", "disabled");
        //thiswindow.getParentWindow().webContents.send("import-wiz-return",[import_tool,import_file]);
    }
}
//////////////////////////////////////////////// STARTUP FUNCTIONS

jquerySetup();
intUtils.selectUtils.setImportSelect();// settings up select for survey tools

/* Returned from main window with result to importing */
ipcRenderer.on("import-result", function (event, arg) {
    // [status, errorcode]
    if (arg[0]) {
        logger.info("Exporting successful! Closing import wizard...");
        thiswindow.close();
    } else {
        logger.warn("Exporting NOT successful!");
        $("#import-wiz-err-text").text(arg[1]);
        $("#import-wiz-import-btn").removeAttr("disabled");
        $("#import-wiz-file-btn").removeAttr("disabled");
    }
});

/* Cheks filepath if valid */
function checkFilePath(filepath = "") {
    logger.debug("checkFilePath");
    var regex_filepath_val = /^[^\\/:\*\?"<>\|]+$/;
    if (filepath === "" || filepath === null || filepath === undefined) {
        // filepath empty
        return false;
    } else if (!regex_filepath_val.test(filepath.split("\\").pop())) {
        // invalid filepath characters
        return false;
    } else if (filepath.split(".").pop() !== "csv") {
        // invalid file extension
        return false;
    } else {
        return true;
    }
}

/* THIS IS SETTING UP UI TRANSLATION */
function setupTranslations(applang = "en") {
    logger.info("Loading translations into UI (importwizard)");
    // Set text here
}
electron.ipcRenderer.on('force-interface-update', (event, settings) => {
    logger.info("Received call to force interface update (importwizard)");
    interfaceUpdate(settings);
});
/* update interface of this window */
function interfaceUpdate(settings = {}) {
    logger.debug("interfaceUpdate (importwizard.js)");
    //logger.debug(settings.constructor);
    if (settings.constructor === {}.constructor) {
        if (Object.keys(settings).length !== 2) {
            //logger.debug("INT FAIL 1");
            settings = getSettings();
        } else if (!settings.hasOwnProperty("app") || !settings.hasOwnProperty("kw")) {
            //logger.debug("INT FAIL 2");
            settings = getSettings();
        }
    } else if (!parseUtils.validateSettings(settings.app, 1)) {
        //logger.debug("INT FAIL 4");
        settings = getSettings();
    } else if (!parseUtils.validateSettings(settings.kw, 2)) {
        //logger.debug("INT FAIL 5");
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

    var settings = getSettings();

    /* This sets up the language that ALL select2 select-fields will use */
    $.fn.select2.defaults.set('language', settings.app["app-lang"]);
}
interfaceUpdate();