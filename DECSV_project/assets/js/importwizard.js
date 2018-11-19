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
const path = require('path');
const remote = electron.remote;
const shell = electron.shell;
const dialog = remote.dialog;
const thiswindow = remote.getCurrentWindow();
const getSettings = remote.getGlobal("getSettings");
const intUtils = require(path.join(__dirname, './intUtils.js'));
const ipcRenderer = electron.ipcRenderer;

var operating = false;
window.import_ready = false;

const { Menu, MenuItem } = remote;

const menu = new Menu()
menu.append(new MenuItem({ label: 'Developer Tools', click() { thiswindow.toggleDevTools() } }))

window.addEventListener('contextmenu', (e) => {
    e.preventDefault()
    menu.popup({ window: thiswindow })
}, false);

///////////////////////////////////////////////////////////////////////////////// SCREEN LISTENERS
thiswindow.on('focus', function () { $("html").css("opacity", "1"); });
thiswindow.on('blur', function () { $("html").css("opacity", "0.5"); });
document.getElementById("win-close-icon").onclick = function () {
    thiswindow.close();
}

document.getElementById("import-add-file-btn").onclick = function () {
    logger.debug("import-add-file-btn clicked");
    // show dialog to select file path
    // set delimiter to default value
    // check if survey tool is chosen; IF NOT CHOSEN, show error and ask to choose it
    // send filepath, tool and delimiter values to 
    // open file dialog
    var docpath = remote.app.getPath('documents');

    var options = {
        title: i18n.__('open-file-prompt-window-title'),
        defaultPath: docpath,
        filters: [
            { name: 'Spreadsheet', extensions: ['csv'] },
            { name: 'Excel document', extensions: ['xlsx', 'xls'] }
        ],
        properties: ['openFile'
        ]
    }//'multiSelections'<<<<--- because we need to ask where is this file from
    function callback(fileNames) {

        if (fileNames !== undefined) {
            // set this to window element
            $("#import-file-name").text(fileNames[0]);
            $("#import-file-name").attr("data-file", fileNames[0]);
            logger.info("Selected file: '" + fileNames[0] + "'");
            window.import_ready = false;
            collectData();
            return;
        }
        logger.warn("No file(s) chosen to be opened!");
    }
    dialog.showOpenDialog(thiswindow, options, callback);
}
document.getElementById("import-reload-file-btn").onclick = function () {
    window.import_ready = false;
    collectData();
    return;
}
document.getElementById("import-select-all-btn").onclick = function () {
    logger.debug("import-select-all-btn clicked");// iterate through "#import-preview-list" and set all object to have class "importable-2", if they have "importable-1"
    //console.log($("#import-preview-list .importable-1"));
    $("#import-preview-list .importable-1").each(function (index) {
        $(this).find("span").trigger("click");
    });
}

document.getElementById("import-select-none-btn").onclick = function () {
    logger.debug("import-select-none-btn clicked");
    console.log($("#import-preview-list .importable-2"))
    $("#import-preview-list .importable-2").each(function (index) {
        $(this).find("span").trigger("click");
    });
    // iterate through "#import-preview-list" and set all object to have class "importable-1", if they have "importable-2"
}

document.getElementById("import-confirm-btn").onclick = function () {
    logger.debug("import-confirm-btn clicked");
    // collect selected lines and send them to main window->
    if (window.import_ready) {
        // ready for import....
        logger.info("Ready for import!");
        try {
            //
            var chosenArr = [];
            var filepath = $("#import-file-name").attr("data-file");
            $("#import-preview-list .importable-2").each(function () {
                var currentArr = $(this).attr("data-real");
                chosenArr.push(JSON.parse(currentArr));
            });
            var tool = $("#import-select-tool").select2("val");
            var survey_version = $("#import-select-survey-ver").select2("val");
            if (tool === null || tool === "" || tool === undefined) {
                // no tool chosen
                logger.error("No tool chosen when importing!");
                $("#import-error-text").text(i18n.__('import-data-fail-1'));
                $("#import-error-text").before($("#import-error-text").clone(true));
                $("[id='import-error-text']" + ":last").remove();
                return 1;
            } else if (chosenArr.length === 0) {
                logger.error("Can't import; no arrays chosen for import!");

                $("#import-error-text").text(i18n.__('import-data-fail-5'));
                $("#import-error-text").before($("#import-error-text").clone(true));
                $("[id='import-error-text']" + ":last").remove();
                return 1;
            } else if (survey_version === null || survey_version === "" || survey_version === undefined) {
                // no tool chosen
                logger.error("No survey version chosen when importing!");
                $("#import-error-text").text(i18n.__('import-data-fail-6'));
                $("#import-error-text").before($("#import-error-text").clone(true));
                $("[id='import-error-text']" + ":last").remove();
                return 1;
            } else {
                try {
                    //
                    survey_version = Number.parseInt(survey_version);
                    tool = Number.parseInt(tool);
                } catch (err) {
                    logger.error("Error while parsing import wizard select parameters!");
                    logger.error(err.message);
                    tool = 0;
                    survey_version = 0;
                }

                // JUST TO PREVENT NEEDLESS FUNCTIONALITY NEEDSTOBECHANGED
                if (tool != 1) {
                    //not Google Forms output
                    logger.error("Not implemented! Need to be Google Forms file!");
                    $("#import-error-text").text(i18n.__('dummy-dia-2'));
                    $("#import-error-text").before($("#import-error-text").clone(true));
                    $("[id='import-error-text']" + ":last").remove();
                    return 1;
                }
                ///////////////////

                if (!operating) {
                    operating = true;
                    timer();
                    console.log("############### Chosen Array ########################");
                    console.log(chosenArr)
                    ipcRenderer.send("import-wiz-return", [[tool, chosenArr, filepath, survey_version], 1]);// sends data to main process to be processed
                } else {
                    logger.error("Unable to send chosen arrays to main process! Already operating!");
                }
            }
        } catch (err) {
            logger.error(err.message);
            logger.error("Error while parsing data-real when trying to import!");

            $("#import-error-text").text(i18n.__('import-error-data-parsing'));
            $("#import-error-text").before($("#import-error-text").clone(true));
            $("[id='import-error-text']" + ":last").remove();
        }
    } else {
        logger.warn("Unable to import! Parameters not ready for import!");
        $("#import-error-text").text(i18n.__('import-error-ready'));
        $("#import-error-text").before($("#import-error-text").clone(true));
        $("[id='import-error-text']" + ":last").remove();
    }
}

//////////////////////////////////////////////// STARTUP FUNCTIONS

jquerySetup();


intUtils.selectUtils.setImportSelect();// settings up select for survey tools
//var testArray = [["lorem", "ipsum", "delores", 2, 4, 123, 124], ["lorem", "ipsum", "delores", 2, 4, 123, 124], ["lorem", "ipsum", "delores", 2, 4, 123, 124], ["lorem", "ipsum", "delores", 2, 4, 123, 124]];
// ipcRenderer.send("import-wiz-return",[import_tool,import_delimeter,import_file]);
intUtils.setImportPreview();//testArray);

//import-wiz-reply
/* data from main process... read arrays of file */
ipcRenderer.on("import-wiz-reply", function (event, arg) {// should be [boolean, statusNUM, arr]
    logger.debug("import-wiz-reply (mimport wiz)");
    //import_ready = false;
    var bool = arg[0];
    var status = arg[1];
    var arr = arg[2];
    //console.log(arr);
    if (bool === null || status === null || arr === null) {
        // reply gave out null!
        logger.error("Import reply to import wizard was NULL!");
    } else if (!bool) {
        // was failure
        if (typeof status != typeof 123) {
            // statusnum not number
        } else {
            // checking error code and giving out response...
            $("#import-error-text").text(i18n.__('file-import-error-' + status));
            $("#import-error-text").before($("#import-error-text").clone(true));
            $("[id='import-error-text']" + ":last").remove();
        }
    } else {
        // was ok
        if (arr instanceof Array) {
            var arrcheck = true;
            for (var t = 0; t < arr.length; t++) {
                if (!(arr[t] instanceof Array)) {
                    arrcheck = false;
                }
            }
            if (arrcheck) {
                console.log("############### ARRAY #############################");
                console.log(arr)
                intUtils.setImportPreview(arr);
                window.import_ready = true;
            } else {
                $("#import-error-text").text(i18n.__('file-import-error-arr-2'));
                $("#import-error-text").before($("#import-error-text").clone(true));
                $("[id='import-error-text']" + ":last").remove();
            }
        } else {
            intUtils.setImportPreview();
            $("#import-error-text").text(i18n.__('file-import-error-arr-1'));
            $("#import-error-text").before($("#import-error-text").clone(true));
            $("[id='import-error-text']" + ":last").remove();
        }
    }
    operating = false;
});

/* Returned from main window with result to importing */
ipcRenderer.on("import-wiz-result", function (event, arg) {
    // [true, 0, jsonobjstring]
    logger.debug("import-wiz-result (import wizard)");
    //logger.debug(arg);
    if (arg[0]) {
        logger.info("Exporting successful! Closing import wizard...");
        try {
            var htmljson = JSON.parse(arg[2]);
            thiswindow.getParentWindow().webContents.send("import-wiz-import-result", htmljson);
            thiswindow.close();
        } catch (err) {
            logger.error(err.message);
            logger.error("Exporting failed because of JSON parsing!");
            //$("#import-wiz-err-text").text(i18n.__('import-import-fail-'+arg[1]));
            $("#import-error-text").text(i18n.__('import-error-parse-1'));
            $("#import-error-text").before($("#import-error-text").clone(true));
            $("[id='import-error-text']" + ":last").remove();
        }
    } else {
        logger.error("Exporting NOT successful! Reason: "+arg[1]);
        //$("#import-wiz-err-text").text(i18n.__('import-import-fail-'+arg[1]));
        $("#import-error-text").text(i18n.__('import-error-parse-1'));
        $("#import-error-text").before($("#import-error-text").clone(true));
        $("[id='import-error-text']" + ":last").remove();
    }
    operating = false;
});

/* Collect filepath, delimiter, */
function collectData() {
    logger.debug("collectData")
    var tool = $("#import-select-tool").select2("val");
    var delimiter = $("#import-select-delimiter").select2("val");
    var filepath = $("#import-file-name").attr("data-file");
    var encoding = $("#import-select-encoding").select2("val");
    try {
        if (tool != null) {
            tool = Number.parseInt(tool);
        }
        if (delimiter != null) {
            delimiter = Number.parseInt(delimiter);
        }
        if (encoding != null) {
            encoding = Number.parseInt(encoding);
        }
    } catch (err) {
        logger.error("Error while parsing import wizard select parameters!");
        logger.error(err.message);
        tool = 0;
        delimiter = 0;
        encoding = 0;
    }

    if (delimiter === null || delimiter === "" || delimiter === undefined) {
        //no delimiter chosen
        $("#import-select-encoding").val("0").trigger("change");
        $("#import-error-text").text(i18n.__('import-data-fail-3'));
        $("#import-error-text").before($("#import-error-text").clone(true));
        $("[id='import-error-text']" + ":last").remove();
        return 1;
    }
    if (encoding === null || encoding === "" || encoding === undefined) {
        //no encoding chosen
        $("#import-select-delimiter").val("0").trigger("change");
        $("#import-error-text").text(i18n.__('import-data-fail-4'));
        $("#import-error-text").before($("#import-error-text").clone(true));
        $("[id='import-error-text']" + ":last").remove();
        return 1;
    }

    if (filepath === "" || filepath === undefined || filepath === null) {
        // no file chosen
        $("#import-error-text").text(i18n.__('import-data-fail-2'));
        $("#import-error-text").before($("#import-error-text").clone(true));
        $("[id='import-error-text']" + ":last").remove();
        return 1;
    } else if (tool === null || tool === "" || tool === undefined) {
        // no tool chosen
        $("#import-error-text").text(i18n.__('import-data-fail-1'));
        $("#import-error-text").before($("#import-error-text").clone(true));
        $("[id='import-error-text']" + ":last").remove();
        return 1;
    } else {
        logger.debug(3);
        $("#import-error-text").text(" ");

        logger.debug("Data: " + [tool, delimiter, encoding, filepath]);
        if (!operating) {
            operating = true;
            timer();
            logger.debug("SENDING PARAMETERS FROM WIZARD");
            logger.debug(tool);
            logger.debug(delimiter);
            logger.debug(encoding);
            ipcRenderer.send("import-wiz-return", [[tool, delimiter, encoding, filepath],0]);// sends data to main process to be processed
            return 0;
        } else {
            logger.warn("Already operating! Unable to collect data... (importWiz)");
            return 1;
        }
    }
}

function timer() {
    logger.debug("timer");
    // disable all buttons, and UI elements!!!
    $("#main-div").css("opacity", 0.5);
    $("#top-titlebar").css("opacity", 0.5);
    $("#top-header").css("opacity", 0.5);
    $("#import-busy-notif").css("display", "flex");

    var timerObj = setInterval(function () {
        if (!operating) {
            clearInterval(timerObj);
            // enable buttons, and UI elements, again
            $("#main-div").css("opacity", 1);
            $("#top-titlebar").css("opacity", 1);
            $("#top-header").css("opacity", 1);
            $("#import-busy-notif").css("display", "none");
        }
    }, 1000);
}

/* Checks filename if valid */
function checkFileName(filepath = "") {
    logger.debug("checkFilePath");
    var regex_filepath_val = /^[^\\/:\*\?"<>\|]+$/;
    if (filepath === "" || filepath === null || filepath === undefined) {
        // filepath empty
        return false;
    } else if (!regex_filepath_val.test(filepath.split("\\").pop())) {
        // invalid filepath characters
        return false;
    } else if (filepath.split(".").pop() !== "csv" && filepath.split(".").pop() !== "xlsx" && filepath.split(".").pop() !== "xls") {
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

    $("#titlebar-appname").text(i18n.__('import-title-name'));

    $("#import-error-text").text(" ");

    $("#import-confirm-btn").text(i18n.__('import-confirm-import'));
    $("#import-select-all-btn").text(i18n.__('import-select-all'));
    $("#import-select-none-btn").text(i18n.__('import-select-none'));
    $("#import-add-file-text").text(i18n.__('import-add-file'));

    $("#import-tip-1").text(i18n.__('import-tip-1'));
    $("#import-tip-2").text(i18n.__('import-tip-2'));
    $("#import-tip-3").text(i18n.__('import-tip-3'));

    $("#import-tool-text").text(i18n.__('import-tool-tip'));
    $("#import-delimiter-text").text(i18n.__('import-delimiter-tip'));
    $("#import-encoding-text").text(i18n.__('import-encoding-tip'));
    $("#import-survey-ver-text").text(i18n.__('import-survey-version-tip'));

    $("#import-file-name").text(i18n.__('import-file-name-base'));
    $("#import-reload-file-text").text(i18n.__('import-reload-file'));
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