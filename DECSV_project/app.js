'use strict';
//////////////////////////////////// CUSTOM ERROR MESSAGE
process.on('uncaughtException', function (err) {
    //process.exit(1);
    const electron = require('electron');
    const uncaugetdia = electron.dialog ? electron.dialog : electron.remote.dialog;
    const app = electron.app ? electron.app : electron.remote.app;
    const shell = electron.shell;
    logger.error("Uncaught Exception!");
    logger.error(err);
    var uncaughtoptions = {};
        uncaughtoptions = {
            type: 'error',
            title: "Uncaught Exception",
            message: "Unknown error occurred!",
            detail: "Something unexpected happened! Please check wiki-page if this is a known problem:\r\n#### ERROR #####\r\n" + err,
            buttons: ["Close application", "Open Wiki"]
        }
    if (mainWindow === null) {
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
    } else {
        uncaugetdia.showMessageBox(mainWindow, uncaughtoptions, function (index) {
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
    }
});
////////////////////////////////////

let openWindow = null;
let mainWindow = null;
let aboutWindow = null;
let i18n_app = null;

const electron = require('electron');
const ipcMain = electron.ipcMain;
const app = electron.app;
const logger = require('electron-log');
const BrowserWindow = electron.BrowserWindow; 
const path = require('path');
const url = require('url');
const fs = require('fs');
const autoUpdater = require("electron-updater").autoUpdater;
const dialog = electron.dialog;
const windowStateKeeper = require('electron-window-state');
//const Store = require('electron-config');
const Store = require("electron-store");
const XLSX = require('xlsx');
const charDetector = require('chardet');
const charDetector123 = require('charset-detector');
const Iconv = require('iconv').Iconv;

var current_project = null;
var pre_project = null;
var showExitPrompt = true;

const parseUtils = require("./assets/js/parseUtils.js");

///////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////

if (require('electron-squirrel-startup')) { app.quit(); }

/////////////////////////////// SETTING LOGGER LEVELS
logger.transports.file.level = "verbose";
logger.transports.console.level = "silly";
//logger.transports.file.appName = 'SLIPPS Teacher Tool';
///////////////////////////////

autoUpdater.logger = logger;

//autoUpdater.allowPrerelease = true; // flag for beta....
//autoUpdater.autoDownload = false; // flag for handling updating manually, instead of automatically testing...

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
    logger.info("Was unable to get a single instance lock! Quitting application...");
    app.quit();
} else {
    app.on('second-instance', (event, commandLine, workingDirectory) => {
        logger.info("Tried to create second instance!");
        // Someone tried to run a second instance, we should focus our window.
        if (mainWindow !== null) {
            logger.info("Main maindow was not null! Restoring and focusing...");
            if (mainWindow.isMinimized()) {
                mainWindow.restore();
            }
            mainWindow.focus();

            // here take [1] command line arg (calling location / opened file) and try to open
            // HOWEVER, if there is a file open atm, show notification that current needs to be closed...
            // if nothing is wrong, let's try 1) switch to "open project"-view, 2) try to open arg[1] file, 3) notify if worked or not
            // THIS ABOVE NEEDS TO BE IN >win32< 
            //
            // otherwise, you need to listen event in MacOS 'open-file' with event.preventDefault()
            // in windows parse process.argv
            logger.info("Testing if we need to open a new project...");
            if (process.platform == 'win32' && commandLine.length >= 2) {
                var openFilePath = commandLine[1];
                if (current_project !== null) {
                    // there is a project open
                    logger.warn("Tried to open new project, while old one still exits!");
                    logger.info("# Old: " + current_project);
                    logger.info("# New: " + openFilePath);
                    // create dialog and notify to exit current project before opening new projects...
                    var options = {
                        type: 'info',
                        title: "Project open",
                        message: "Unable to open new project while there is one open!",
                        detail: "Please close the current project, and try opening again.",
                        buttons: [i18n_app.__('conf-ok', true)]
                    };
                    dialog.showMessageBox(mainWindow, options, function (index) {
                        // no need to deal with anything.... just notifying user
                        if (index === 1) {
                            //
                        } else {
                            // close, do nothing
                        }
                    });
                } else {
                    //no project exist... need to force opening
                    logger.info("No project exists! Need to force open new project at mainWindow...");
                    mainWindow.webContents.send("force-open-project", openFilePath);
                }

            } else {
                // do nothing
                logger.warn("Platform is not win32, or argv.length is not >=2!");
            }
        } else {
            // no mainwindow! if we are opening project, we are settings this variable just in case
            logger.info("No main window exists! Setting variable just in case...");
            if (process.platform == 'win32' && commandLine.length >= 2) {
                pre_project = commandLine[1];
                logger.info("[SECOND INSTANCE] Settings main process pre_project variable(win32): " + pre_project);
            } else {
                logger.warn("[SECOND INSTANCE] Platform is not win32, or argv.length is not >=2!");
            }
            /*
            if (process.platform == 'darwin') {
                logger.info("Platform was 'darwin'! Opening new mainWindow...");
                createMainWindow();
            }
            */

        }
    });

    // saving command line parameter (file to be opened...)
    if (process.platform == 'win32' && process.argv.length >= 2) {
        if (process.argv[1] !== "--updated") { pre_project = process.argv[1]; }// since this is put here after updating
        logger.info("[FIRST INSTANCE] Settings main process pre_project variable(win32): " + pre_project);
    } else {
        logger.warn("[FIRST INSTANCE] Platform is not win32, or argv.length is not >=2!");
    }

    /* Called when application has finished loading */
    app.on('ready', () => {
        //setTimeout(function () {
        if (process.platform === 'win32') {
            //
        }
        else if (process.platform === 'linux') {
            //
        }
        else if (process.platform === 'darwin') {
            //
        }
        else {
            //well then, you are done for :x
        }
        logger.info('app ready');

        logger.debug("setupTranslations(app.js)");
        i18n_app = new (require('./assets/translations/i18n'))(true);
        showExitPrompt = true;

        logger.debug("checking first usage...");
        var options = {
            name: "app-configuration",
            cwd: app.getPath('userData')
        }
        const store = new Store(options);
        var firstuse = store.get('first-use');
        //logger.debug(firstuse);
        //logger.debug(typeof(firstuse));

        // Checking if the app json data file shows that the program has been opened before
        if (firstuse) {
            logger.info("######################################################");
            logger.info("WELCOME! This app is now started for the first time :)");
            logger.info("######################################################");
            store.set('first-use', false);
        }
        else {
            logger.info("App has been started before!");
        }
        createWin();
        //}, 0)
    });
}

/* Handle opening files in program (while not open before; that is above in the makeSingleInstance callback) */
app.on('will-finish-launching', function () {
    app.on('open-file', function (ev, path) { // this works when called on MacOS
        event.preventDefault();
        if (process.platform == 'darwin') {
            pre_project = path;
            logger.info("Settings main process pre_project variable(darwin): " + pre_project);

        } else {
            // nothing
            logger.info("Open-file event fired, but platform was not 'darwin'!");
            logger.info("FILE: " + path);
        }
    });
    app.on('open-url', function (event, url) {// yea.... we don't need this that much.. need to have for MacOS though
        event.preventDefault();
        logger.info("Open-url event fired! Ignoring...");
        //log("open-url event: " + url)

        // handle if argument is proper file or not
        var sourcelink = url;
        logger.info("LINK: " + url);

        //dialog.showErrorBox('open-url', `You arrived from: ${url}`)
    });
});

/* These settings are here, so we can control what settings components get and to validate saved settings */
/* Allows windows fetch settings from one place*/
/* Returns array, where there is 2 stringify-ed JSONs */
global.getSettings = function () {
    logger.debug("getSettings");
    var apppath = app.getPath('userData');
    var returnable = {
        "app": {}
    };
    var config1 = {
        name: "app-configuration",
        cwd: apppath
    }
    var store1 = new Store(config1);
    var json1 = store1.store;
    try {
        json1 = JSON.stringify(json1);
        json1 = JSON.parse(json1);
    } catch (err) {
        json1 = {};
    }
    
    if (parseUtils.validateSettings(json1,1)) {
        // settings valid; giving them out
        //returnable.push(json1);
    } else {
        // settings invalid; need to give out defaults
        logger.warn("GetSettings() app settings invalid!");
        json1 = {
            "app-lang": "en",
            "first-use": false,
            "app-version": app.getVersion(),
            "latest-update-check": null,
            "latest-update-install": null,
            "zoom": 100,
            "edits": [
                false,
                null
            ],
            "enabled-keywordlists": ["en"]
        };
        //returnable.push(json1);
        }

    returnable.app = json1;
    
    return returnable;

};
/* Allows windows to set settings from single place */
/* 0 is settings for application, 1 is settings for keywords */
global.setSettings = function (settings = {}) {
    logger.debug("setSettings");
    //logger.debug(settings);
    var json1 = {};
    //var json2 = {};
    if (!(settings.constructor === {}.constructor)) {
        //settings is not an json object
        return [false,1];
    }
    else if (Object.keys(settings).length !== 1) {
        //settings keys not size of {1}<< 2
        return [false,2];
    }
    if (!settings.hasOwnProperty("app")) {// || !settings.hasOwnProperty("kw")) {
        // no app or kw object in settings object
        return [false, 3];
    }
    json1 = settings.app;
    //json2 = settings.kw;
    
    //
    if (parseUtils.validateSettings(json1,1)) {
        // settings valid - now we can save them
    } else {
        // settings invalid; saving default settings
        logger.warn("SetSettings() app settings invalid!");
        json1 = {
            "app-lang": "en",
            "first-use": false,
            "app-version": app.getVersion(),
            "latest-update-check": null,
            "latest-update-install": null,
            "zoom": 100,
            "edits": [
                false,
                null
            ],
            "enabled-keywordlists": []
        };
    }

    var apppath = app.getPath('userData');
    var config1 = {
        name: "app-configuration",
        cwd: apppath
    }
    var store1 = new Store(config1);
    store1.store = json1;
    //

    /* CALL FORCE UPDATE TO ALL WINDOWS HERE!!!!!!!! */

    forceInterfaceUpdate(json1);//, json2)

};

/* sends info to all webContents with proper  */
function forceInterfaceUpdate(intset1 = {}) {//, intset2 = {}) {
    logger.debug("forceInterfaceUpdate (app.js)");

    if (!parseUtils.validateSettings(intset1, 1)) {
        //
        //logger.debug("FAIL 1");
        return false;
    }

    var webconts = electron.webContents.getAllWebContents();

    var tobesent = {
        "app": intset1
    }
    //logger.debug(webconts);
    //logger.debug(webconts.length);
    for (var id = 0; id < webconts.length; id++) {
        // send current settings to each renderer process (they need listener for this!!!)
        webconts[id].send('force-interface-update', tobesent);
    }
    return true;
}

/*
Logger logs are on %AppData%\Roaming\*package: productName*\log.log (or "old" version of the same) by default on windows systems.
The app itself will be installed into %AppData%\Local\*package: name*.

electron-store will save data as JSON into app.getPath(userData), which should be %AppData%\Roaming\*package: productName*
*/

///////////////////// Create directories to user's Documents-folder, and set up some files and directories in applications AppData/Roaming folder
createDocStructure();
createAppStructure();
/////////////////////

//////////////////////////////////////////////////////////// IPC MAIN LISTENERS

ipcMain.on('import-wiz-return', function (event, arg) {
    logger.debug("import-wiz-return");
    var mode = arg[1];
    arg = arg[0];
    if (mode === 0) {
        // received importable file!
        if (!(arg instanceof Array)) {// not array
            logger.error("Main process file import array not instanceof Array!");
            arg = [null, null, null, null]
        }
        if (arg.length !== 4) {// array not length of 3
            logger.error("Main process file import array not length of 3");
            arg = [null, null, null, null]
        }
        //logger.debug(arg[0] + " - "+typeof(arg[0]));
        //logger.debug(arg[1] + " - " + typeof (arg[1]));

        //                                      [tool, delimiter, encoding, filepath]
        var processeddata = readSourceFile(arg[0], arg[1], arg[2], arg[3]); // will be [false/true, status_code, result_array]

        if (mainWindow !== null) {
            //
            logger.info("Sending file import raw array to import wizard...");
            event.sender.send("import-wiz-reply", processeddata);
        } else {
            logger.error("MainWindow not open, but we tried to import file!");
            event.sender.send("import-wiz-reply", [null, null, null]);
            //do nothing
        }
    } else if (mode === 1) {
        //received selected lines to be imported.... parsing to proper form...
        //mainWindow.webContents.send("output-to-chrome-console", arg[1]);
        var completearr = parseUtils.parseArray(arg[0], arg[1], arg[3]);// [tool, arr, survey_version] // returns [boolean, statuscode, arr] CURRENTLY USING PLACEHOLDERS!
        if (completearr[0]) {
            //mainWindow.webContents.send("output-to-chrome-console", completearr[2]);

            // logger.error("DENIED! UNABLE TO USE BECAUSE NOT IMPLEMENTED!");
            //event.sender.send("import-wiz-result", [false, completearr[1], "{}"]);
            //return;

            try {
                var htmljson = parseUtils.readAndParseSource(completearr[2],arg[2]);
                var htmlstring = JSON.stringify(htmljson);
                event.sender.send("import-wiz-result", [true, 0, htmlstring]);
            } catch (err) {
                logger.error(err);
                logger.error("Failed to parse import event JSON into string at import-wiz-return!");
                event.sender.send("import-wiz-result", [false, -1, "{}"]);
            }
        } else {
            logger.error("Unable to parse import! Reason: " + completearr[1]);
            event.sender.send("import-wiz-result", [false, completearr[1], "{}"]);
        }
    } else {
        logger.error("Invalid mode '"+mode+"' in ipcMain import-wiz-return");
    }
});

/* This is called to get the file that was tried to use with the application NEEDSTOBECHANGED */
ipcMain.on('get-ext-file-data', function (event, arg) {// This is used to "ask" what the current file / process argument[1] was. "null" is returned default
    event.returnValue = pre_project;
});
/* This is used to "update" variable here to keep track if project is open or not */
ipcMain.on('set-project-status', function (event, arg) {
    current_project = arg;
});

// create project
ipcMain.on('async-create-project', (event, project_name, project_country, project_lang) => {
    logger.debug("async-create-project (at app.js)");
    var results = createNewProject(project_name, project_country, project_lang);
    event.sender.send('async-create-project-reply', results);
});

/* create main window (called from openWindow) */
ipcMain.on('async-creat-mainwindow', (event, arg) => {
    setTimeout(function () { createMainWindow(); }, 2000);
});

////////////////////////////////////////////////////////////

/* Creates application's folders into user's Documents-folder */
function createDocStructure() {
    logger.debug("createDocStructure");
    var docpath = app.getPath('documents');
    try {
        if (!fs.existsSync(path.join(docpath, 'SLIPPS Teacher Tool'))) {
            logger.info("No app documents folder found! Creating one...");
            fs.mkdirSync(path.join(docpath, 'SLIPPS Teacher Tool'));
        }
        if (!fs.existsSync(path.join(docpath, 'SLIPPS Teacher Tool\\Projects'))) {
            logger.info("No app PROJECTS folder found! Creating one...");
            fs.mkdirSync(path.join(docpath, 'SLIPPS Teacher Tool\\Projects'));
        }
        if (!fs.existsSync(path.join(docpath, 'SLIPPS Teacher Tool\\Output'))) {
            logger.info("No app OUTPUT folder found! Creating one...");
            fs.mkdirSync(path.join(docpath, 'SLIPPS Teacher Tool\\Output'));
        }
    } catch (err) {
        logger.error("Unable to create file structure into user's documents! Reason: " + err.message);
    }
}

/* Creates application's folders and settings-files into user's AppData-folder */
function createAppStructure(mode = 0) {
    logger.debug("createAppStructure");
    
    //var demostatus = false;
    var apppath = app.getPath('userData');
    var appconfigcheck = false;
    if (fs.existsSync(path.join(apppath, 'app-configuration.json'))) {
        try {
            appconfigcheck = !fs.statSync(path.join(apppath, 'app-configuration.json')).isDirectory()
        } catch (err) {
            logger.error("Error while using statSync! Reason: " + err.message);
        }
    }

    if (!appconfigcheck) {
        logger.info("No app configuration file found! Creating one with defaults...");
        let CA1_options = {
            defaults: {
                "app-lang": "en",
                "first-use": true,
                "latest-update-check": null,
                "latest-update-install": null,
                "zoom":100,
                "app-version": app.getVersion(),
                "edits": [false, null],
                "enabled-keywordlists": ["en"]
            },
            name: "app-configuration",
            cwd: apppath
        }
        const CA1_store = new Store(CA1_options);
    }
    else {
        logger.info("App configuration file found! Checking version...");
        let CA1_options = {
            name: "app-configuration",
            cwd: apppath
        }
        const CA1_store = new Store(CA1_options);
        var appver = CA1_store.get("app-version", "0.0.0");
        var applang = CA1_store.get("app-lang", "en");

        var appupcheck = CA1_store.get("latest-update-check", null);
        var appupinst = CA1_store.get("latest-update-install", null);
        var appzoom = CA1_store.get("zoom", 100);

        var appfirst = CA1_store.get("first-use", true);
        var appedits = CA1_store.get("edits", [false, null]);
        var enabledkwlists = CA1_store.get("enabled-keywordlists", ["en"]);

        //logger.info("Current ver.: " + app.getVersion() + " Ver. in file: " + appver);
        var appvercheck = parseUtils.validateVersion(appver);
        if (!appvercheck) {
            logger.info("Config major version not same as application major version! updating...");
            CA1_store.clear();
            CA1_store.set("app-lang", applang);

            CA1_store.set("latest-update-check", appupcheck);
            CA1_store.set("latest-update-install", appupinst);
            CA1_store.set("zoom", appzoom);

            CA1_store.set("first-use", appfirst);
            CA1_store.set("app-version", app.getVersion());
            CA1_store.set("edits", appedits)
            CA1_store.set("enabled-keywordlists", enabledkwlists);
        } else {
            logger.info("Application config major version same or newer as application version! Not updating...");
        }
        // check if consistent with this version, if not, remove and rebuild
    }
    
}

/* Creates new project with a given name into Documents-folder */
function createNewProject(proj_name, proj_country, proj_lang) {//
    var reason = [];
    logger.debug("createNewProject");
    logger.debug(proj_name);
    logger.debug(proj_name.length);
    var regex_filepath_val = /^[^\\/:\*\?"<>\|]+$/;
    var docpath = app.getPath('documents');

    if (proj_name === undefined) {
        // Projectname not defined
        reason.push(false, 1);
        return reason;
    }
    else if (proj_name.length === 0 || proj_name.length > 100) {
        // Projectname length 0 or over 100 characters
        reason.push(false, 2);
        return reason;
    }
    else if (!regex_filepath_val.test(proj_name)) {
        // Projectname not allowed
        reason.push(false, 3);
        return reason;
    }
    else if (proj_country === undefined) {
        // Project country not defined
        reason.push(false, 4);
        return reason;
    }
    else if (proj_lang === undefined) {
        // Project language not defined
        reason.push(false, 5);
        return reason;
    }
    else if (fs.existsSync(path.join(docpath, 'SLIPPS Teacher Tool'))) {
        if (fs.existsSync(path.join(docpath, 'SLIPPS Teacher Tool\\Projects'))) {
            // testing if directory just in case....
            var project_dircheck = fs.statSync(path.join(docpath, 'SLIPPS Teacher Tool\\Projects')); 
            if (project_dircheck.isDirectory()) {
                logger.info("Projects directory in user's documents located!");
            }
            else {
                // Projects-folder not present!
                createDocStructure();
                reason.push(false, 6);
                return reason;
            }

            try {
                fs.accessSync(path.join(docpath, 'SLIPPS Teacher Tool\\Projects\\' + proj_name + '.decsv'));
                // if we get past this, project exits...
                var projFileCheck = fs.statSync(path.join(docpath, 'SLIPPS Teacher Tool\\Projects\\' + proj_name + '.decsv'));
                if (projFileCheck.isDirectory()) {
                    throw "Tested project was directory, not file!";
                }

                reason.push(false, 7);
                return reason;
            } catch (err) {
                // project does not exist!
                logger.info("Project with name'"+proj_name+"' does not exits! Creating....");
            }

            //logger.debug("Creating new properties file.....");
            var project_data_template = JSON.stringify({
                "____INFO____": "THIS IS PROJECT FILE FOR DECSV/SLIPPS Teacher Tool APPLICATION, USED AS PART OF THE SLIPPS EU PROJECT",
                "created": new Date().toISOString(),
                "project-files": {},
                "notes": [],
                "lang-preset": proj_lang,
                "country-preset": proj_country,
                "version": app.getVersion()
            });
            //const CA3_store = new Store(CA3_options);
            try {
                fs.writeFileSync(path.join(docpath, 'SLIPPS Teacher Tool\\Projects\\' + proj_name + '.decsv'), project_data_template, 'utf-8');
            } catch (err) {
                logger.error("Failed to write new project file '" + proj_name + ".decsv'! Reason: " + err.message);
                reason.push(false, 8);
                return reason;
            }
            
            logger.info("Created project '" + proj_name + "'!");
            reason.push(true, 11, path.join(docpath, 'SLIPPS Teacher Tool\\Projects\\' + proj_name + '.decsv'));
            return reason;
        }
        else {
            // Projects-folder not present!
            createDocStructure();
            reason.push(false, 9);
            return reason;
        }
    }
    else {
        // Application-folder (at Documents) not present!
        createDocStructure();
        reason.push(false, 10);
        return reason;
    }
}

/* Handles needed stuff when application is going to be closed */
function handleclosing(callback = function (i) { return i;}) {
    logger.debug("handleClosing");
    logger.info("Handling things before closing...");
    // do things needed before shutting down
    var CA3_options = {
        name: "app-configuration",
        cwd: app.getPath('userData')
    }
    const CA3_store = new Store(CA3_options);

    var edit_check = CA3_store.get("edits", [false, null]);

    var dial_options_2 = {//app.quit()
        type: 'info',
        title: "Saved",
        message: "Changes were saved!",
        detail: "Press ok to continue",
        buttons: [i18n_app.__('conf-ok', true)]
    }

    if (edit_check[0] && (edit_check[1] !== null)) {
        logger.info("Unsaved changes possible! Asking user what to do...");
        logger.debug(edit_check[0] + " - " + edit_check[1]);
        // ask if want to save changes, or not
        var file_ext = edit_check[1].split('.').pop();
        var proj_name = edit_check[1].split('\\').pop();
        proj_name = proj_name.split(".");
        proj_name.pop();
        proj_name.join(".");
        var dial_options = {
            type: 'info',
            title: i18n_app.__('conf-title', true),
            message: i18n_app.__('conf-unsaved-title', true),
            detail: i18n_app.__('conf-unsaved-desc', true),
            buttons: [i18n_app.__('conf-yes', true), i18n_app.__('conf-no', true)]
        };

        dialog.showMessageBox(mainWindow, dial_options, function (index) {
            if (index === 0) {
                logger.info("User decided to save backup! Saving to file '" + edit_check[1] + "'");
                var backup_options = {
                    name: proj_name,
                    cwd: path.join(app.getPath('userData'), "backup_files")
                }
                const backup_store = new Store(backup_options);
                var backup_content = backup_store.store;

                CA3_store.set("edits", [false, null]);

                try {
                    fs.writeFileSync(edit_check[1], JSON.stringify(backup_content), "utf8");
                    fs.unlinkSync(path.join(app.getPath("userData"), "backup_files\\" + proj_name + ".json"));
                } catch (err) {
                    logger.error("Error while writing '" + edit_check[1] + "' or removing backup for it! Reason: " + err.message);
                }
                //logger.info("callback_1")
                callback(0);
            } else {
                //
                CA3_store.set("edits", [false, null]);

                logger.info("User decided not to save backup! Removing...");
                try {
                    fs.unlinkSync(path.join(app.getPath("userData"), "backup_files\\" + proj_name + ".json"));
                } catch (err) {
                    logger.error("Unable to unlink backup file for '" + edit_check[1] + "'!");
                }
                //logger.info("callback_2")
                callback(0);
            }
        });
        
    }
    else if (edit_check[1] !== null) {
        logger.info("Unsaved backup possible, even though it was not mentioned! Trying to remove...");
        try {
            fs.unlinkSync(path.join(app.getPath("userData"), "backup_files\\" + proj_name + ".json"));
        } catch (err) {
            logger.error("Unable to unlink backup file for '" + edit_check[1] + "'!");
        }
        //logger.info("callback_3")
        callback(0);
    } else { callback(1);}
}

/* Creates opening window (with logo) and main window */
function createWin() {
    setTimeout(function () {
        logger.debug("createWin");
        openWindow = new BrowserWindow({
            width: 320,
            height: 320,
            resizable: false,
            devTools: true,
            frame: false,
            backgroundColor: '#dadada',
            show: false
        });

        let win1_url = url.format({
            protocol: 'file',
            slashes: true,
            pathname: path.join(__dirname, './assets/html/opening.html')
        });
        openWindow.loadURL(win1_url);

        openWindow.on('ready-to-show', function () {
            //
            openWindow.show();
            openWindow.webContents.send("open-update-setup");
        });

        openWindow.on('closed', function () {
            if (mainWindow !== null) {
                mainWindow.show();
            }
            openWindow = null;
        });
    }, 0)
}

function createMainWindow() {
    logger.debug("createMainWindow");
    logger.info("Creating main window...");
    let mainWindowState = windowStateKeeper({
        defaultWidth: 1200,
        defaultHeight: 840
    });

    mainWindow = new BrowserWindow({
        x: mainWindowState.x,
        y: mainWindowState.y,
        width: mainWindowState.width,
        height: mainWindowState.height,
        devTools: true,
        frame: false,
        backgroundColor: '#dadada',
        show: false
    });
    //mainWindow.toggleDevTools();//ENABLED NEEDSTOBECHANGED

    let win2_url = url.format({
        protocol: 'file',
        slashes: true,
        pathname: path.join(__dirname, './assets/html/index.html')
    });
    mainWindow.loadURL(win2_url);

    //toggle dev tools when window opens
    //mainWindow.webContents.openDevTools();
    mainWindow.on('ready-to-show', function () {
        //logger.debug("%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%");
        mainWindowState.manage(mainWindow);
        // because testing
        //mainWindow.show();
        logger.debug("Hiding and closing start window");
        openWindow.hide();
        openWindow.close();
    });

    mainWindow.on('close', (e) => {
        logger.debug("called close");

        if (showExitPrompt) {
            e.preventDefault();
            logger.info("Mainwindow closed... prevented app exit!");

            var options = {
                type: 'info',
                title: i18n_app.__('conf-title', true),
                message: i18n_app.__('quit-conf-message', true),
                detail: i18n_app.__('quit-conf-detail', true),
                buttons: [i18n_app.__('conf-yes', true), i18n_app.__('conf-no', true)]
            };

            dialog.showMessageBox(mainWindow, options, function (index) {
                if (index === 0) {
                    handleclosing(function (i) {
                        showExitPrompt = false;//
                        logger.debug("from handleclosing: '" + i + "'");
                        logger.info("Inside handleclosing callback! Returnvalue: "+i);
                        if (aboutWindow !== null) {
                            logger.info("Re-closing main window....");
                            aboutWindow.close();// closing about-window, if it is open
                        } else {
                            logger.warn("Tried to re-close main window, but it was NULL!");
                        }

                        app.quit();// should we? need to think about darwin/macos options....

                    });
                    logger.debug("after handleclosing");
                }
            });
        }
    });

    mainWindow.on('closed', function () {
        mainWindow = null;
        current_project = null;
    });
    mainWindow.on('unresponsive', function () {
        logger.error("MainWindow unresponsive!");
        // create dialog and show that app jammed! clicking ok reloads the page
        var options = {
            type: 'error',
            title: "Status",
            message: "Application unresponsive!",
            detail: "Application stopped responding! Would you like to reload app, or wait for it to become responsive again?",
            buttons: ["Reload", "Wait"],
            BrowserWindow: mainWindow
        }
        dialog.showMessageBox(options, function (index) {
            //
            if (index === 0) {
                //open wiki
                logger.warn("Reloading app...");
                mainWindow.reload();
            } else {
                // close, do nothing
                logger.warn("User wanted to >wait< for app to become responsive again!");
            }
        });
    });
    mainWindow.on('responsive', function () {
        // nothing...
        logger.info("MainWindow responsive!");
    });
}

/* Called when all windows are closed */
app.on('window-all-closed', function () {
    logger.info("all windows closed");
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') { // this needs more control!
        app.quit();
    }
});

/* Called when activating application window */
app.on('activate', function () {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    logger.info("app activated");
    if (mainWindow === null) {
        createWin();
    }
});

/* AUTOUPDATER */
// WARN DO NOT USE THESE! var updatePath = "http://testing-tyaisurm.c9users.io/update/win32/" + app.getVersion().toString();
//autoUpdater.setFeedURL(updatePath);

/* These are quit-handlers for the application */
app.on('will-quit', function () {
    logger.info("application will quit...");
});
app.on('quit', function () {
    logger.info("quitting application...");
});

///////////////////////////////////////////////////////////////////////////////// UPDATER HANDLERS
    // 0 = checking
    // 1 = update found
    // 2 = no update available
    // 3 = error
    // 4 = downloading %
    // 5 = downloaded
/* Called from init.js (or somewhere else) when wanted to check updates */
ipcMain.on("check-updates", (event, arg) => { // CREATING LISTENERS IN FUNCTION ONLY SO THAT THE "event"-object CAN BE SAVED
    logger.debug("check-updates here!");
autoUpdater.on('checking-for-update', function () {
    logger.info("Current version: " + app.getVersion().toString());
    var chekcupdatesettings = getSettings();
    chekcupdatesettings.app["latest-update-check"] = new Date().toISOString();
    setSettings(chekcupdatesettings);
    //console.log(event);
    var arr = [];
    arr.push(0);
    event.sender.send("check-updates-reply", arr);
});
    autoUpdater.on('update-available', function (info) {//NEEDSTOBECHANGED
        logger.info("Update available!");
        logger.info(info);
    var ver = info.version;
    var relDat = info.releaseDate;
    var relNote = info.releaseNotes;
    var arr = [];
    arr.push(1, ver, relDat, relNote);
    event.sender.send("check-updates-reply", 1);
});
    autoUpdater.on('error', function (err) {
        logger.error("Failed to get updates!");
        //logger.error(err.message);
    var arr = [];
    arr.push(3);
    event.sender.send("check-updates-reply", arr);
    clearUpdaterListeners();
});
autoUpdater.on('update-not-available', function (info) {
    logger.info("Update not available!");
    logger.info(info);
    var arr = [];
    arr.push(2);
    event.sender.send("check-updates-reply", arr);
    clearUpdaterListeners();
});

    autoUpdater.on('update-downloaded', function (info) {//ev, relNot, relNam, relDat, updUrl) {NEEDSTOBECHANGED
        logger.info("Update has been downloaded!");

        var updatedownloadedsettings = getSettings();
        updatedownloadedsettings.app["latest-update-install"] = new Date().toISOString();
        setSettings(updatedownloadedsettings);

        var ver = info.version;
        var relDat = info.releaseDate;
        var relNote = info.releaseNotes;
        var arr = [];
        arr.push(5, ver, relDat, relNote);
        event.sender.send("check-updates-reply", arr);
        clearUpdaterListeners();
        if (mainWindow !== null) {
            var options = {
                type: 'info',
                title: "Update downloaded",
                message: "New version " + ver + " is ready to be installed",
                detail: "Would you like to close the application and update now? By default, update will be done when the application gets closed.\r\n\r\nVersion: " + ver,
                buttons: [i18n_app.__('conf-yes', true), i18n_app.__('conf-no', true)]
            }; // DATE NEED TO BE REFORMATTED, AND RELNOTE SHOULD BE PARSED (CONTAINS HTML)
            // + "\r\nRelease date: " + new Date(relDat) +"\r\n"+relNote,

            dialog.showMessageBox(mainWindow, options, function (index) {
                if (index === 0) {
                    showExitPrompt = false;
                    autoUpdater.quitAndInstall();
                }
                else {
                    //nothing
                }
            });
        } else {
            setTimeout(function () { showExitPrompt = false; autoUpdater.quitAndInstall(); }, 2000);
        }
    });

autoUpdater.on('download-progress', function (progressObj) {
    var arr = [];
    arr.push(4, progressObj);
    event.sender.send("check-updates-reply", arr);
   });
    //logger.debug("CALLING CHECKFORUPDATES!!!");
    autoUpdater.checkForUpdates().then(
        function (val) {
            logger.info('Promise fulfilled!');
        }).catch(
            function (reason) {
                logger.warn('Rejected promise handler...');
            });
});

/* Clears away all listeners after updates have been checked - prevents listener-dublicates */
function clearUpdaterListeners() { // THIS IS ONLY HERE SO THAT listeners wont get stacked up because of being called multiple times
    logger.debug("clearUpdaterListeners");
    autoUpdater.removeAllListeners('checking-for-update');
    autoUpdater.removeAllListeners('update-available');
    autoUpdater.removeAllListeners('error');
    autoUpdater.removeAllListeners('update-not-available');
    autoUpdater.removeAllListeners('update-downloaded');
    autoUpdater.removeAllListeners('download-progress');
}

/* Global function that opens up the ABOUT-window */
global.createAboutWin = function () {
    if (aboutWindow === null) {
        logger.debug("createAboutWindow");
        logger.info("Opening about-window...");
        aboutWindow = new BrowserWindow({
            width: 500,
            height: 500,
            resizable: false,
            minWidth: 500,
            minHeight: 500,
            devTools: false,
            frame: false,
            backgroundColor: '#dadada',
            show: false
        });

        let about_url = url.format({
            protocol: 'file',
            slashes: true,
            pathname: path.join(__dirname, './assets/html/about.html')
        });
        aboutWindow.loadURL(about_url);

        aboutWindow.on('ready-to-show', function () {
            aboutWindow.show();
        });

        aboutWindow.on('closed', function () {
            logger.info("About-window closed");
            aboutWindow = null;
        });
    }
    else {
        logger.info("Refocus about-window...");
        aboutWindow.focus();
    }
}
/* Global function that creates dummy "not implemented" dialog with "OK" button */
global.createDummyDialog = function (callingWindow) {
    var options = {
        type: 'info',
        title: i18n_app.__('dummy-dia-1', true),
        message: i18n_app.__('dummy-dia-2', true),
        detail: i18n_app.__('dummy-dia-3', true),
        buttons: [i18n_app.__('conf-ok', true)]
    };

    dialog.showMessageBox(callingWindow, options, function (index) {
        // no need to deal with anything.... just notifying user
    });
}

// NEEDS const XLSX = require('xlsx');
/* Reads source file, CSV or XLS or XLSX format into array */
function readSourceFile(lert_tool = null, lert_delimiter = null, lert_encoding = null, file = null) {//[tool, delimiter, encoding, filepath] NEEDSTOBECHANGED
    logger.debug("readFile");

    /* check file-extension and name */
    var result = [];
    var output_data = [];
    var file_ext = file.split('.').pop();
    var file_name = file.split('\\').pop();

    //console.log("################################################");
    //console.log(file_ext);
    //console.log(file);



    /* file has .xlsx or .xls extension */
    if (file_ext === 'xlsx' || file_ext === 'xls') {
        logger.info("Parsing XLSX or XLS file... NOT ENABLED");
        /*
        // xlsx-js 
        try {
            var workbook = XLSX.readFile(file);
        }
        catch (err) {
            logger.error("Error opening .xlsx or .xls file: " + err.message);
            result.push(false);
            result.push(1); //xlsx opening failed!
            result.push([]);
            return result;
        }
        var first_sheet_name = workbook.SheetNames[0];
        var worksheet = workbook.Sheets[first_sheet_name];

        var csv_sheet = XLSX.utils.sheet_to_csv(worksheet);

        var parseResult = parseUtils.validateAndParseCSV(csv_sheet, lert_tool, lert_delimiter);
        logger.info("Parse & validate result: ["+parseResult[0]+", "+parseResult[1]+", *PARSED DATA*]");
        if (parseResult[0]) {
            result.push(true);
            result.push(0); //xlsx parsin ok
            result.push(parseResult[2]);
            return result;
        } else {
            result.push(false);
            result.push(2); // parsing failed
            result.push([]);
            return result;
        }
        */
    } else if (file_ext === 'csv') {
        logger.info("Parsing CSV file...");
        /*Node.js fs*/
        var data = "";
        try {
            //mainWindow.webContents.send("output-to-chrome-console", "PARSING DATAAAAAAAAAAAAAAAAAAAAAAAA  ORIGINAL     aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
            data = fs.readFileSync(file, null);
        }
        catch (err) {
            logger.error("Error opening file '"+file_name+"': " + err.message);
            result.push(false);
            result.push(1);// couldn't open csv file!
            result.push([]);
            return result;
        }
        //////////////

        //var chardet1 = charDetector.detectAll(data);
        //var chardet2 = charDetector123(data);

        //////////////////////////////////////////
        var detectRes = charDetector.detectAll(data);

        var encodings = {};
        var tempencodings = [];
        try {
            tempencodings = JSON.parse(fs.readFileSync(path.join(__dirname, "./assets/select2/encodings.json"), "utf8"));
            if (!(tempencodings instanceof Array)) {
                logger.warn("Encodings from file not array!");
                encodings = {}
            } else {
                for (var sew = 0; sew < tempencodings.length; sew++) {
                    encodings[sew] = tempencodings[sew].name;
                }
            }
        }
        catch (err) {
            logger.error("Error opening encodings file: " + err.message);
            encodings = {}
        }
        if (encodings.hasOwnProperty(lert_encoding) && lert_encoding !== 0) {
            lert_encoding = encodings[lert_encoding];
        } else {
            logger.error("Chosen encoding does not exist in file, or encoding was default! Value: " + lert_encoding);
            lert_encoding = null;
        }



        /////////////////////////////////////////////////////////////////////
        var data_rdy = "";
        if (detectRes.length > 0) {
            var encresstr = "";
            try {
                encresstr = JSON.stringify(detectRes[0]);
                //logger.debug(encresstr);
            } catch (err) {
                logger.error("Error while encoding check stringify!");
                logger.error(err.message);
                encresstr = detectRes[0];
            }

            logger.info("Encoding found: " + encresstr);
            logger.info("Trying to convert to UTF-8...");

            //logger.debug(JSON.parse(detectRes));
            var iconv_csv = null;
            //mainWindow.webContents.send("output-to-chrome-console", data);
            try {
                logger.debug("Source encoding: " + detectRes[0].name);
                if (lert_encoding === null) {
                    logger.info("Lert_encoding was null! Using default...");
                    iconv_csv = new Iconv(detectRes[0].name, 'UTF-8//TRANSLIT');
                } else {
                    logger.info("Lert_encoding defined! Using it...");
                    iconv_csv = new Iconv(lert_encoding, 'UTF-8//TRANSLIT');
                }
                data_rdy = iconv_csv.convert(data).toString();           
            } catch (err) {
                logger.error(err)
                logger.error("Encoding failed! Failed to set source encoding: " + detectRes[0].name);
                logger.info("Trying second encoding option...");
                try {
                    logger.debug("Source encoding: " + detectRes[2].name);
                    if (lert_encoding === null) {
                        logger.info("Lert_encoding was null! Using default...");
                        iconv_csv = new Iconv(detectRes[1].name, 'UTF-8//TRANSLIT');
                    } else {
                        logger.info("Lert_encoding defined! Using it...");
                        iconv_csv = new Iconv(detectRes[0].name, 'UTF-8//TRANSLIT');
                    }
                    data_rdy = iconv_csv.convert(data).toString();
                } catch (err) {
                    logger.error(err)
                    logger.error("Encoding failed! Failed to set source encoding: " + detectRes[0].name);
                    logger.info("Trying final encoding option...");
                    try {
                        if (lert_encoding === null) {
                            logger.info("Lert_encoding was null! Not retrying...");
                            throw "Last file import data encoding attempt failed!";
                        } else {
                            logger.info("Lert_encoding defined! Using it...");
                            iconv_csv = new Iconv(detectRes[1].name, 'UTF-8//TRANSLIT');
                        }
                        data_rdy = iconv_csv.convert(data).toString();
                    } catch (err) {
                        logger.error(err)
                        logger.error("Encoding failed! Failed to set source encoding: " + detectRes[0].name);
                        logger.warn("Defaulting toString() UTF-8...");
                        data_rdy = data.toString('utf8');
                    }
                }
            }
        }
        else {
            logger.warn("No hits for encoding found!");
            logger.warn("Defaulting toString() UTF-8...");
            data_rdy = data.toString('utf8'); 
        }
        ////////////////////////////////////////////
        var parseResult = parseUtils.validateAndParseCSV(data_rdy, lert_tool, lert_delimiter);
        

        if (!parseResult[0]) {
            result.push(false);
            result.push(2); // parsing failed!
            result.push([]);
            return result;
        }
        result.push(true);
        result.push(0); // parsing successful
        result.push(parseResult[2]);
        logger.info("File '" + file_name + "' content successfully loaded and parsed!");
        return result;
    }
    else {
        //what lies beyond this land... prob not right file for some reason :D
        logger.warn("Tried to open invalid file! Wrong extension: " + file_ext);
        result.push(false);
        result.push(3);// File invalid
        result.push([]);
        return result;
    }
}