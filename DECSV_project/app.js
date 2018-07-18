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
    if (mainWindow === null) {
        uncaughtoptions = {
            type: 'error',
            title: "Uncaught Exception",
            message: "Unknown error occurred!",
            detail: "Something unexpected happened! Please check wiki-page if this is a known problem:\r\n#### ERROR #####\r\n" + err,
            buttons: ["Close application", "Open Wiki"]
        }
    } else {
        uncaughtoptions = {
            type: 'error',
            title: "Uncaught Exception",
            message: "Unknown error occurred!",
            detail: "Something unexpected happened! Please check wiki-page if this is a known problem:\r\n#### ERROR #####\r\n" + err,
            buttons: ["Close application", "Open Wiki"],
            BrowserWindow: mainWindow
        }
    }
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
const charDetector = require('charset-detector');
const iconv = require('iconv-lite');
let openWindow = null;
let mainWindow = null;
let aboutWindow = null;
let i18n_app = null;

var demostatus = false;
var current_project = null;
var pre_project = null;
var showExitPrompt = true;

const parseUtils = require("./assets/js/parseUtils.js");

if (require('electron-squirrel-startup')) { app.quit(); }

/////////////////////////////// SETTING LOGGER LEVELS
logger.transports.file.level = "verbose";
logger.transports.console.level = "silly";
//logger.transports.file.appName = 'SLIPPS Teacher Tool';
///////////////////////////////
autoUpdater.logger = logger;


const isSecondInstance = app.makeSingleInstance((commandLine, workingDirectory) => {
    // Someone tried to run a second instance, we should focus our window
    if (mainWindow !== null) {
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
        if (process.platform == 'win32' && process.argv.length >= 2) {
            var openFilePath = process.argv[1];
            if (current_project !== null) {
                // there is a project open
                logger.warn("Tried to open new project, while old one still exits!");
                logger.info("# Old: " + current_projet);
                logger.info("# New: " + openFilePath);
                // create dialog and notify to exit current project before opening new projects...
                var options = {
                    type: 'info',
                    title: "Project open",
                    message: "Unable to open new project while there is one open!",
                    detail: "Please close the current project, and try opening again.",
                    buttons: [i18n_app.__('conf-ok', true)]
                };
                dialog.showMessageBox(options, function (index) {
                    // no need to deal with anything.... just notifying user
                    if (index === 1) {
                        //
                    } else {
                        // close, do nothing
                    }
                });
            } else {
                //no project exist... need to force opening
                ipcMain.send("force-open-project", openFilePath);
            }

        } else {
            // do nothing
        }
    } else {
        // no mainwindow! if we are opening project, we are settings this variable just in case
        if (process.platform == 'win32' && process.argv.length >= 2) {
            pre_project = process.argv[1];
        }
    }
});

if (isSecondInstance) {
    logger.debug("Tried to create second instance!");
    app.quit()
} else {
    logger.debug("This instance is first one!");
}

/* Handle opening files in program (while not open before; that is above in the makeSingleInstance callback) */
app.on('will-finish-launching', function () {
    app.on('open-file', function (ev, path) { // this works when called on MacOS
        event.preventDefault();
        if (process.platform == 'darwin') {
            var fileLocation = path;

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
        "app": {},
        "kw": {}
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
    //
    var config2 = {
        name: "keyword-config",
        cwd: path.join(apppath, 'keywordlists')
    }
    const store2 = new Store(config2);
    var json2 = store2.store;
    try {
        json2 = JSON.stringify(json2);
        json2 = JSON.parse(json2);
    } catch (err) {
        json2 = {};
    }
    //
    if (parseUtils.validateSettings(json1,1)) {
        // settings valid; giving them out
        //returnable.push(json1);
    } else {
        // settings invalid; need to give out defaults
        json1 = {
            "app-lang": "en",
            "first-use": false,
            "app-version": app.getVersion(),
            "demo-files": true,
            "latest-update-check": null,
            "latest-update-install": null,
            "zoom": 100,
            "edits": [
                false,
                null
            ]
        }
        //returnable.push(json1);
        };
    
    if (parseUtils.validateSettings(json2, 2)) {
        // settings valid; giving them out
        //returnable.push(json2);
    } else {
        // settings invalid; need to give out defaults 
        json2 = {
            
            "last-local-update": null,
            "last-availability-check": null,
                "available-keywordlists": {
                "en-basic": {
                    "date": "2018-06-25T13:05:48.801Z",
                        "name": "English - Basic"
                },
                "fi-basic": {
                    "date": "2018-06-25T13:05:48.801Z",
                        "name": "Suomi - Perus"
                }
            },
            "local-keywordlists": {
                "en-basic": {
                    "date": "2018-06-25T13:05:48.801Z",
                        "name": "English - Basic"
                },
                "fi-basic": {
                    "date": "2018-06-25T13:05:48.801Z",
                        "name": "Suomi - Perus"
                }
            },
            "enabled-keywordlists": [
                "en-basic"
            ]
        }
        //returnable.push(JSONjson2);
    }

    returnable.app = json1;
    returnable.kw = json2;
    
    return returnable;

};
/* Allows windows to set settings from single place */
/* 0 is settings for application, 1 is settings for keywords */
global.setSettings = function (settings = {}) {
    logger.debug("setSettings");
    //logger.debug(settings);
    var json1 = {};
    var json2 = {};
    if (!(settings.constructor === {}.constructor)) {
        //settings is not an json object
        return [false,1];
    }
    else if (Object.keys(settings).length !== 2) {
        //settings keys not size of 2
        return [false,2];
    }
    if (!settings.hasOwnProperty("app") || !settings.hasOwnProperty("kw")) {
        // no app or kw object in settings object
        return [false, 3];
    }
    json1 = settings.app;
    json2 = settings.kw;
    
    //
    if (parseUtils.validateSettings(json1,1)) {
        // settings valid - now we can save them
    } else {
        // settings invalid; saving default settings
        json1 = {
            "app-lang": "en",
            "first-use": false,
            "app-version": app.getVersion(),
            "demo-files": true,
            "latest-update-check": null,
            "latest-update-install": null,
            "zoom": 100,
            "edits": [
                false,
                null
            ]
        };
    }
    if (parseUtils.validateSettings(json2, 2)) {
        // settings valid; giving them out
    } else {
        // settings invalid; need to give out defaults
        json2 = {

            "last-local-update": null,
            "last-availability-check": null,
            "available-keywordlists": {
                "en-basic": {
                    "date": "2018-06-25T13:05:48.801Z",
                    "name": "English - Basic"
                },
                "fi-basic": {
                    "date": "2018-06-25T13:05:48.801Z",
                    "name": "Suomi - Perus"
                }
            },
            "local-keywordlists": {
                "en-basic": {
                    "date": "2018-06-25T13:05:48.801Z",
                    "name": "English - Basic"
                },
                "fi-basic": {
                    "date": "2018-06-25T13:05:48.801Z",
                    "name": "Suomi - Perus"
                }
            },
            "enabled-keywordlists": [
                "en-basic"
            ]
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
    var config2 = {
        name: "keyword-config",
        cwd: path.join(apppath, 'keywordlists')
    }
    const store2 = new Store(config2);
    store2.store = json2;

    /* CALL FORCE UPDATE TO ALL WINDOWS HERE!!!!!!!! */

    forceInterfaceUpdate(json1, json2)

};

/* sends info to all webContents with proper  */
function forceInterfaceUpdate(intset1 = {}, intset2 = {}) {
    logger.debug("forceInterfaceUpdate (app.js)");
    //logger.debug(intset1);
    //logger.debug(intset2);
    if (!parseUtils.validateSettings(intset1,1)) {
        //
        //logger.debug("FAIL 1");
        return false;
    }
    else if (!parseUtils.validateSettings(intset2,2)) {
        //logger.debug("FAIL 2");
        return false;
    }
    var webconts = electron.webContents.getAllWebContents();

    var tobesent = {
        "app": intset1,
        "kw": intset2
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
const { ipcMain } = require('electron')


ipcMain.on('import-wiz-return', function (event, arg) {
    //
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

////////////////////////////////////////////////////////////

/* Creates application's folders into user's Documents-folder */
function createDocStructure() {
    logger.debug("createDocStructure");
    var docpath = app.getPath('documents');
    try {
        if (!fs.existsSync(path.join(docpath, 'SLIPPS DECSV'))) {
            logger.info("No app documents folder found! Creating one...");
            fs.mkdirSync(path.join(docpath, 'SLIPPS DECSV'));
        }
        if (!fs.existsSync(path.join(docpath, 'SLIPPS DECSV\\Projects'))) {
            logger.info("No app PROJECTS folder found! Creating one...");
            fs.mkdirSync(path.join(docpath, 'SLIPPS DECSV\\Projects'));
        }
        if (!fs.existsSync(path.join(docpath, 'SLIPPS DECSV\\Output'))) {
            logger.info("No app OUTPUT folder found! Creating one...");
            fs.mkdirSync(path.join(docpath, 'SLIPPS DECSV\\Output'));
        }
    } catch (err) {
        logger.error("Unable to create file structure into user's documents! Reason: " + err.message);
    }
}

/* Creates application's folders and settings-files into user's AppData-folder */
function createAppStructure() { //NEEDSTOBECHANGED
    logger.debug("createAppStructure");
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
        var CA1_options = {
            defaults: {
                "app-lang": "en",
                "first-use": true,
                "latest-update-check": null,
                "latest-update-install": null,
                "zoom":100,
                "app-version": app.getVersion(),
                "demo-files": demostatus,
                "edits": [false,null]
            },
            name: "app-configuration",
            cwd: apppath
        }
        const CA1_store = new Store(CA1_options);

        if (demostatus) {
            // is true, meaning that demofiles have been created before
            logger.info("Demofiles created before!");
        } else {
            CA1_store.set("demo-files", true)
            logger.info("Demofiles not created before! Creating now...");
            // is false, no demofiles have been done yet
        }
    }
    else {
        logger.info("App configuration file found! Checking version...");
        var CA1_options = {
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
        var appdemos = CA1_store.get("demo-files", false);
        var appedits = CA1_store.get("edits", [false,null]);

        //logger.info("Current ver.: " + app.getVersion() + " Ver. in file: " + appver);
        var appvercheck = parseUtils.validateVersion(appver);
        if (!appvercheck) {
            logger.info("Config major version not same as application major version! Overwriting...");
            CA1_store.clear();
            CA1_store.set("app-lang", applang);

            CA1_store.set("latest-update-check", appupcheck);
            CA1_store.set("latest-update-install", appupinst);
            CA1_store.set("zoom", appzoom);

            CA1_store.set("first-use", appfirst);
            CA1_store.set("app-version", app.getVersion());
            CA1_store.set("demo-files", appdemos)
            CA1_store.set("edits", appedits)
        } else {
            logger.info("Application config major version same or newer as application version!");
        }
        if (typeof(appdemos) !== typeof(true)) {
            appdemos = false;
        }
        demostatus = appdemos;
        if (demostatus) {
            // is true, meaning that demofiles have been created befor
            logger.info("Demofiles created before!");
        } else {
            CA1_store.set("demo-files", true)
            logger.info("Demofiles not created before! Need to create now...");
            // is false, no demofiles have been done yet
        }

        // check if consistent with this version, if not, remove and rebuild
    }
    var keyword_file_check = true;
    logger.debug(keyword_file_check);
    // checking if keyword-config file exists, and if it is file or directory
    if (fs.existsSync(path.join(apppath, 'keywordlists\\keyword-config.json'))) {
        if (fs.statSync(path.join(apppath, 'keywordlists\\keyword-config.json')).isDirectory()) {
            keyword_file_check = false;
        }
    }
    else {
        keyword_file_check = false;
    }
    logger.debug(keyword_file_check);
    if (!keyword_file_check || !demostatus) {
        logger.info("No keyword configuration file found! Creating one with defaults...");
        try {
            if (!fs.existsSync(path.join(apppath, 'keywordlists'))) {
                fs.mkdirSync(path.join(apppath, 'keywordlists'));
            }
            else if (!fs.statSync(path.join(apppath, 'keywordlists')).isDirectory()) {
                fs.mkdirSync(path.join(apppath, 'keywordlists'));
            }
        } catch (err) {
            logger.error("Unable to create keywordlist directory! Reason: " + err.message);
        }
        logger.info("Creating demo keyword files...");
        // #################################################################
        //      SETTING DEMO FILES - BELOW IS ORIGINAL, FURTHER BELOW CURRENT.....
        /*
        var CA2_options = {
            defaults: {
                "last-successful-update": "----",
                "available-keywordlists": {},
                "local-keywordlists": {},
                "enabled-keywordlists": []
            },
            name: "keyword-config",
            cwd: path.join(apppath, 'keywordlists')
        }
        */
        try {
            var CA2_options = {
                defaults: {
                    "last-local-update": null,
                    "last-availability-check": null,
                    "available-keywordlists": {
                        "en-basic": {
                            "date": new Date().toISOString(),
                            "name": "English - Basic"
                        },
                        "fi-basic": {
                            "date": new Date().toISOString(),
                            "name": "Suomi - Perus"
                        }
                    },
                    "local-keywordlists": {
                        "en-basic": {
                            "date": new Date().toISOString(),
                            "name": "English - Basic"
                        },
                        "fi-basic": {
                            "date": new Date().toISOString(),
                            "name": "Suomi - Perus"
                        }
                    },
                    "enabled-keywordlists": ["en-basic"]
                },
                name: "keyword-config",
                cwd: path.join(apppath, 'keywordlists')
            }
            const CA2_store = new Store(CA2_options);
            //

            var source_demo_1 = path.join(__dirname, './demo_files/en-basic.json');
            var source_demo_2 = path.join(__dirname, './demo_files/fi-basic.json');
            var destination_demo_1 = path.join(apppath, 'keywordlists/en-basic.json')
            var destination_demo_2 = path.join(apppath, 'keywordlists/fi-basic.json')
            var content_1 = fs.readFileSync(source_demo_1, 'utf8');
            var content_2 = fs.readFileSync(source_demo_2, 'utf8');
            fs.writeFileSync(destination_demo_1, content_1, 'utf8');
            fs.writeFileSync(destination_demo_2, content_2, 'utf8');
        }
        catch (err) {
            logger.error("Failed to copy demo files! Reason: " + err.message);
        }
    } else {
        logger.info("Demofiles have been made before (we think), and keyword settings file is present (unsure about contents)");
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
    else if (fs.existsSync(path.join(docpath, 'SLIPPS DECSV'))) {
        if (fs.existsSync(path.join(docpath, 'SLIPPS DECSV\\Projects'))) {
            // testing if directory just in case....
            var project_dircheck = fs.statSync(path.join(docpath, 'SLIPPS DECSV\\Projects')); 
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
                fs.accessSync(path.join(docpath, 'SLIPPS DECSV\\Projects\\' + proj_name + '.decsv'));
                // if we get past this, project exits...
                var projFileCheck = fs.statSync(path.join(docpath, 'SLIPPS DECSV\\Projects\\' + proj_name + '.decsv'));
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
                "____INFO____": "THIS IS PROJECT FILE FOR DECSV APPLICATION, USED AS PART OF THE SLIPPS EU PROJECT",
                "created": new Date().toISOString(),
                "src-files": [],
                "project-files": {},
                "notes": [],
                "lang-preset": proj_lang,
                "country-preset": proj_country,
                "version": app.getVersion()
            });
            //const CA3_store = new Store(CA3_options);
            try {
                fs.writeFileSync(path.join(docpath, 'SLIPPS DECSV\\Projects\\' + proj_name + '.decsv'), project_data_template, 'utf-8');
            } catch (err) {
                logger.error("Failed to write new project file '" + proj_name + ".decsv'! Reason: " + err.message);
                reason.push(false, 8);
                return reason;
            }
            
            logger.info("Created project '" + proj_name + "'!");
            reason.push(true, 11, path.join(docpath, 'SLIPPS DECSV\\Projects\\' + proj_name + '.decsv'));
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
            message: "There are unsaved changes!",
            detail: "Do you wish to save these changes?",
            buttons: [i18n_app.__('conf-yes', true), i18n_app.__('conf-no', true)]
        };

        dialog.showMessageBox(dial_options, function (index) {
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
        callback(0);
    } else { callback(1);}
}

/* Creates opening window (with logo) and main window */
function createWin() {// NEEDSTOBECHANGED
    setTimeout(function () {
    logger.debug("createWin");
    openWindow = new BrowserWindow({
        width: 300,
        height: 300,
        resizable: false,
        devTools: true,
        frame: false,
        backgroundColor: '#dadada',
    });

    let win1_url = url.format({
        protocol: 'file',
        slashes: true,
        pathname: path.join(__dirname, './assets/html/opening.html')
    });
    openWindow.loadURL(win1_url);

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
        mainWindow.show();
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
                        logger.debug("from handleclosing: '"+i+"'");
                        logger.debug("calling quit inside callback");
                        if (aboutWindow !== null) {
                            logger.info("Re-closing main window....");
                            aboutWindow.close();// closing about-window, if it is open
                        } else {
                            logger.warn("Tried to re-close main window, but it was NULL!");
                        }

                        app.quit();// should we? need to think about darwin options....

                    });
                    logger.debug("after handleclosing");
                }
            });
        }
    });

    mainWindow.on('closed', function () {
        mainWindow = null;
    });
    mainWindow.on('unresponsive', function () { });
    mainWindow.on('responsive', function () { });
    openWindow.on('closed', function () {
        //logger.debug("%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%");
        openWindow = null;
    });
    }, 0)
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
    /*
    var options = {
        type: 'info',
        title: "Update available",
        message: "Update found to be available",
        detail: "Update will be tried to be downloaded automatically",
        buttons: ["ok"]
    };

    dialog.showMessageBox(options, function (index) {
        //
    });
    */
});
    autoUpdater.on('error', function (err) {
        logger.error("Failed to get updates! Full error message logged before!");
        logger.error(err.message);
    var arr = [];
    arr.push(3);
    event.sender.send("check-updates-reply", arr);
    clearUpdaterListeners();
    /*
    var options = {
        type: 'info',
        title: "Error",
        message: "Error while updating",
        detail: "Unable to check for updates!",
        buttons: ["ok"]
    };

    dialog.showMessageBox(options, function (index) {
        //
    });
    */
});
autoUpdater.on('update-not-available', function (info) {
    logger.info("Update not available!");
    logger.info(info);
    var arr = [];
    arr.push(2);
    event.sender.send("check-updates-reply", arr);
    clearUpdaterListeners();
    /*
    var options = {
        type: 'info',
        title: "No update",
        message: "Update not available",
        detail: "You have the latest version",
        buttons: ["ok"]
    };

    dialog.showMessageBox(options, function (index) {
        //
    });
    */
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
    });

autoUpdater.on('download-progress', function (progressObj) {
    var arr = [];
    arr.push(4, progressObj);
    event.sender.send("check-updates-reply", arr);
   });
    logger.debug("CALLING CHECKFORUPDATES!!!");
   autoUpdater.checkForUpdates();
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
        title: "Not Implemented",
        message: "This functionality is not yet implemented!",
        detail: "Click 'ok' to close this notification.",
        buttons: [i18n_app.__('conf-ok', true)]
    };

    dialog.showMessageBox(callingWindow, options, function (index) {
        // no need to deal with anything.... just notifying user
    });
}

// NEEDS TO BE REWORKED TO CHANGE READ DATA INTO JSON FORMAT (to be saved into new .decsv file!!)
//
/* Creates temp-files from source files within the project's folders */
function readAndParseSource(proj_name, event, ) { // CUSTOM INPUTNEEDSTOBECHANGED
    logger.debug("transformSrc2Temp");
    var docpath = app.getPath('documents');
    var src_base = path.join(docpath, 'SLIPPS DECSV\\Projects\\' + proj_name + '\\source\\');
    var temp_base = path.join(docpath, 'SLIPPS DECSV\\Projects\\' + proj_name + '\\temp\\');
    var proj_base = path.join(docpath, 'SLIPPS DECSV\\Projects\\' + proj_name + '\\');
    var proj_prop = path.join(docpath, 'SLIPPS DECSV\\Projects\\' + proj_name + '\\' + proj_name + '.json');
    if (fs.existsSync(src_base)) {
        if (fs.existsSync(temp_base)) {
            if (fs.existsSync(proj_prop)) {
                // do shitz
                var s2t_options = {
                    name: proj_name,
                    cwd: proj_base
                }
                //logger.debug("proj_name and proj_base: "+proj_name+" & "+proj_base);
                const s2t_store = new Store(s2t_options);//

                var sourceF = s2t_store.get('source-files', []);
                var tempF = s2t_store.get('temp-files', {});
                var tempLang = s2t_store.get('lang',null);
                var tempCountry = s2t_store.get('country',null);
                var newtempF = tempF;
                var test_name_base = "event_";
                var testvalue = false;
                var testvalue_nro = 0;
                //logger.debug("SOURCEF AND TEMPF");
                //logger.debug(sourceF);
                //logger.debug(tempF);
                var fileT = "";
                var fileS = "";
                var secChtml = "";
                var failArray = [];
                var successArray = [];
                var proj_options = {
                    name: proj_name,
                    cwd: proj_base
                }
                const proj_store = new Store(proj_options);//
                while (!testvalue) {
                    if (proj_store.has(test_name_base + testvalue_nro.toString())) {
                        // do nothing
                        testvalue_nro++;
                    }
                    else {
                        testvalue = true;
                    }
                }
                for (var i = 0; i < sourceF.length; i++){// looping array of project's source file array
                    //logger.debug("sourceF length: " + sourceF.length);
                    //logger.debug("loop nro: "+i);
                    fileS = sourceF[i];
                    //logger.debug("FILES ORIG: " + fileS);

                    //////////////////////////////////////////////////////////////////////////////////////   USELESS   ////////////////////////
                    for (var k in tempF) {// looping through project's temp file json object
                        //console.log("1: ");
                        //console.log(k); // source file name
                        //logger.debug("FILET SOURCE: " + k);
                        if (tempF.hasOwnProperty(k)) { //checking if has subvalues
                            //logger.debug("TEMPF had own property!");
                            //console.log(tempF[k].file); // temp file name
                            fileT = tempF[k].file;
                            //logger.debug("FILET TEMP: "+fileT);
                        }
                        if (fileT.toString() === fileS.toString()) { //if current source filename is same as existing tempfile source
                            //logger.debug("FILE EXISTS!!!");
                            //logger.debug(fileT.toString() + " and " + fileS.toString());
                            break;
                        }
                    }
                    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

                    if (fileT.toString() === fileS.toString()) { // if any existing temp-file has this source-file as "source"
                        failArray.push(fileS);
                        logger.debug(">>>>>>>>>>>>>>>>>>continue_1");
                        continue;
                    }
                    else {

                        if (fs.existsSync(path.join(src_base, fileS))) {// testing if source file exists at project's source folder

                            //logger.debug("before reading");
                            var returnArr = readSourceFile(path.join(src_base, fileS)); // CUSTOM INPUT NEEDSTOBECHANGED
                            logger.debug("AFTER reading");

                            mainWindow.webContents.send("output-to-chrome-console", returnArr);

                            var dataArray = returnArr[1];
                            if (returnArr[0]) {
                                //
                            }
                            else { //there was error with reading the source file
                                failArray.push(fileS);
                                logger.debug(">>>>>>>>>>>>>>>>>>continue_2");
                                continue;
                            }
                        }
                        else { // source-file not present at the current project's source folder
                            failArray.push(fileS);
                            logger.debug(">>>>>>>>>>>>>>>>>>continue_3");
                            continue;
                        }
                        logger.debug("EVERYTHING OK. creating file...");
                        // source file at project's source folder! looping through answers within.....

                        var temporaryArr = [];
                        var temporary_counter = 0;
                        function testfunction(currentValue) { return currentValue === undefined }


                        for (var p = 1; p < dataArray.length; p++) {
                            if (dataArray[p].every(testfunction)) {
                                temporary_counter++;
                            }
                            else if (temporary_counter < 2) {
                                temporaryArr.push(dataArray[p]);
                            }
                        }
                        mainWindow.webContents.send("output-to-chrome-console", temporaryArr);//testing the array. works now (gives proper answers)


                        // ##############################################################################################################
                        // ############################################################################################################## LOOP TO CREATE MULTIPLE FILES from source array
                        for (var q = 0; q < temporaryArr.length; q++) {
                            /*
                                NEEDS A LOT OF WORK!
                             */
                            var currentDataArr = temporaryArr[q];
                            //var tempNameBase = "event_";
                            var temp_finalname = test_name_base + testvalue_nro.toString();
                            var temp_options = {
                                defaults: {
                                    "src": fileS.toString(),
                                    "src-data": [],
                                    "subID": 0,
                                    "subDATE": new Date().toISOString(),
                                    "a": "",
                                    "b": "",
                                    "c": "",
                                    "kw": [],
                                    "done": false,
                                    "lang": tempLang,
                                    "country": tempCountry,
                                    "version": app.getVersion()
                                },
                                name: "temp#" + temp_finalname,
                                cwd: temp_base
                            }
                            logger.debug("CREATING TEMP FILE: " + "temp#" + temp_finalname);
                            const temp_store = new Store(temp_options);//

                            //temp_store.set("subID", dataArray[1][0]); // Setting identifier
                            //temp_store.set("subDATE", dataArray[1][1]); // Setting create date

                            secChtml = '<div class="secC-Q-allA">';
                            var elemtextA = '<p class="w3-blue w3-container secA-Q" style="width:100%;"></p>';// no text here, because it will be placed in UI, not in file
                            elemtextA = elemtextA + '<p class="secA-Q-allA">';
                            var elemtextB = '<p class="w3-blue w3-container secB-Q" style="width:100%;"></p>';// no text here, because it will be placed in UI, not in file
                            elemtextB = elemtextB + '<p class="secB-Q-allA">';

                            
                            elemtextA = elemtextA + currentDataArr[1]/*.replace(/&/g, "&amp;")
                                .replace(/"/g, "&quot;")
                                .replace(/'/g, "&#039;")*/
                                .replace(/</g, "&lt;")
                                .replace(/>/g, "&gt;")
                                .replace(/[^ -\s +\!.":><'?!/\\]+/g, '<span class="word">$&</span>');///\b(\w+?)\b/g
                            elemtextB = elemtextB + currentDataArr[2]/*.replace(/&/g, "&amp;")
                                .replace(/"/g, "&quot;")
                                .replace(/'/g, "&#039;")*/
                                .replace(/</g, "&lt;")
                                .replace(/>/g, "&gt;")
                                .replace(/[^ -\s +\!.":><'?!/\\]+/g, '<span class="word">$&</span>');
                            
                            //var elemA = "<p>" + elemtextA + "</p>";
                            //var elemB = "<p>" + elemtextB + "</p>";

                            ////////////////////////////////////////////////////////////////////////////////////////////
                            // Creating C section from here on....
                            var j = 1;
                            var temp_c_list = [];
                            for (var line = 3; line < currentDataArr.length; line++) {
                                
                                var questID = "secC-Q-" + j;
                                var elemCQ = '<p class="w3-blue w3-container ' + questID + '" style="width:100%;"></p>'; // no text here, because it will be placed in UI, not in file
                                var ansID = "secC-Q-" + j + "-cont";
                                var ansText = "";
                                var elemCA = '';

                                if (line === 3 || line === 5 || line === 6 || line === 7 || line === 8 || line === 29 || line === 30 || line === 32) {// integer answers. 30 & 32 ARE OPTIONAL!!!!
                                    // add data
                                    var datareal = "";
                                    if (currentDataArr[line] !== undefined) {
                                        datareal = currentDataArr[line].toString();
                                    }
                                    //mainWindow.webContents.send("output-to-chrome-console", "line at integer: "+line);
                                    //mainWindow.webContents.send("output-to-chrome-console", currentDataArr[line]);
                                    elemCA = '<p class="w3-light-blue ' + ansID + '" data-real="' + datareal + '" style="display:inline;padding:3px;">' + ansText + '</p>';
                                    secChtml = secChtml + elemCQ + elemCA;
                                    j++;
                                }
                                else if (line === 4 || line === 9 || line === 28 || line === 31 || line === 33) {// open string answers
                                    if (currentDataArr[line] !== undefined) {
                                        
                                        ansText = currentDataArr[line]/*.replace(/&/g, "&amp;")
                                            .replace(/"/g, "&quot;")
                                            .replace(/'/g, "&#039;")*/
                                            .replace(/</g, "&lt;")
                                            .replace(/>/g, "&gt;")
                                            .replace(/[^ -\s +\!.":><'?!/\\]+/g, '<span class="word">$&</span>');
                                        
                                    }
                                    else {
                                        ansText = "";
                                    }
                                    elemCA = '<p class="' + ansID + '">' + ansText + '</p>';
                                    secChtml = secChtml + elemCQ + elemCA;
                                    j++;
                                }
                                else if (line >= 10 && line <= 27) {
                                    if (currentDataArr[line] !== undefined) {
                                        temp_c_list.push(parseInt(currentDataArr[line]));
                                    }
                                    else {
                                        //do nothing
                                    }
                                    if (line !== 27) {
                                        continue;
                                    }
                                    elemCA = "<p class='w3-light-blue " + ansID + "' data-real='" + JSON.stringify(temp_c_list) + "' style='display:inline;padding:3px;'>" + ansText + "</p>";
                                    secChtml = secChtml + elemCQ + elemCA;
                                    j++;
                                }
                            }
                            ////////////////////////////////////////////////////////////////////////////////////////////
                            secChtml = secChtml + '</div>';
                            logger.debug("created question lines for C section");
                            //console.log(secChtml);
                            // REMEMBER TO TURN \" and \' into regular " and ' when showing the data!!!!!!
                            temp_store.set("a", elemtextA);
                            temp_store.set("b", elemtextB);
                            temp_store.set("c", secChtml);
                            temp_store.set("src-data", currentDataArr); // just putting in all instead of [1]
                            //logger.debug("DATAAAAAAAAAAAAAAAAAAAAAAAAAAA:");
                            //logger.debug(dataArray);
                            //logger.debug(temp_store.get("c","WAS EMPTY"));
                            logger.debug("file section setted for A, B and C");

                            /*
                            ////////////////////////////////////////////////////////// THIS IS USELESS
                            if (dataArray[2] === undefined) {
                                logger.warn("Third line (keywords) is not available in convertable source file '" + fileS + "'!");
                            }
                            else {
                                logger.debug("KEYWORDS WITHIN THE SOURCE FILE: '" + fileS + "'!");
                                logger.debug(dataArray[2]);
                                //check if keywords in proper format, else, don't add anything... NOT USED ATM!!!
                            }
                            //////////////////////////////////////////////////////////
                            */

                            logger.debug("done! continuing to next");
                            var currentprojkw = proj_store.get("kw-per-file", {});
                            currentprojkw["temp#" + temp_finalname + ".json"] = [];
                            proj_store.set('kw-per-file', currentprojkw);//currently and empty array. would be [ [listID, term], [listID_2, term2], [listID_3, term3],... ]
                            newtempF["temp#" + temp_finalname + ".json"] = {};
                            newtempF["temp#" + temp_finalname + ".json"]["file"] = fileS;
                            newtempF["temp#" + temp_finalname + ".json"]["done"] = false;
                            //logger.debug("TESTING TYPEOF: " + typeof (newtempF["temp#" + fileS + ".json"]["done"]))
                            proj_store.set('temp-files', newtempF);
                            //logger.debug(proj_store.get('temp-files', {})["temp#" + fileS + ".json"]);
                            //logger.debug(proj_store.get('temp-files', {})["temp#" + fileS + ".json"]["done"]);
                            //logger.debug(typeof(proj_store.get('temp-files', {})["temp#" + fileS + ".json"]["done"]));
                            var successFile = [];
                            successFile.push(fileS, "temp#" + temp_finalname + ".json", false);
                            successArray.push(successFile);
                            testvalue_nro++;
                        }
                        // ##############################################################################################################
       // ##############################################################################################################
                    }
                }
               
                logger.debug(">>>>>>>DONE WITH LOOP");
                //logger.debug(i);
                var sendArray = [];
                sendArray.push(true);
                sendArray.push(successArray);
                sendArray.push(failArray);
                event.sender.send('async-transform-files-reply', sendArray);
            }
            else {
                logger.error("No project properties file while converting to temp files!");
                var sendArray = [];
                sendArray.push(false);
                event.sender.send('async-transform-files-reply', sendArray);
                // no properties file
            }
        }
        else {
            logger.error("No temp folder found while converting to temp files!");
            var sendArray = [];
            sendArray.push(false);
            event.sender.send('async-transform-files-reply', sendArray);
            // no temp folder
        }
    }
    else {
        logger.error("No source folder found while converting to temp files!");
        // no source folder
    }
}

// NEEDS const XLSX = require('xlsx');
/* Reads source file, CSV or XLS or XLSX format into array */
function readSourceFile(file, lert_tool) {//NEEDSTOBECHANGED
    logger.debug("readFile");
    logger.debug(file);
    /* check file-extension and name */
    var result = [];
    logger.debug(result);
    var output_data = [];
    var file_ext = file.split('.').pop();
    var file_name = file.split('\\').pop();

    //console.log("################################################");
    //console.log(file_ext);
    //console.log(file);



    /* file has .xlsx or .xls extension */
    if (file_ext === 'xlsx' || file_ext === 'xls') {
        logger.debug("file was EXCEL FORMAT");
        logger.debug("Ignoring....");
        /*

        // xlsx-js 
        try {
            var workbook = XLSX.readFile(file);
        }
        catch (err) {
            logger.error("Error opening .xlsx or .xls file: " + err.message);
            result.push(false);
            return result;
        }
        var first_sheet_name = workbook.SheetNames[0];
        var worksheet = workbook.Sheets[first_sheet_name];

        var csv_sheet = XLSX.utils.sheet_to_csv(worksheet);
        //console.log("EXCEL TO CSV");
        //console.log(JSON.stringify(csv_sheet));

        // xlsx-js continue... 
        var newlines = ['\r\n', '\n'];
        var lines = csv_sheet.split(new RegExp(newlines.join('|'), 'g'));

        var headers = CSVtoArray(lines[0]);
        var contents = CSVtoArray(lines[1]);

        var keys = null;

        output_data[0] = headers;
        output_data[1] = contents;

        if (lines[2].length !== 0) {
            keys = CSVtoArray(lines[2]);
            output_data[2] = keys;
        }
        result.push(true);
        result.push(output_data);
        return result;
        //console.log(headers);
        //console.log(contents);

        //console.log("setting data");
        //window.currentFileContent = output_data;

        //keys = showQuizData(output_data); // ALERT!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
        //setupKeywordSelect(output_data[1].length, keys);// ALERT!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
        */
    }

    /* file has .csv extension */
    if (file_ext === 'csv') {
        logger.debug("file was CSV FORMAT");
        /*Node.js fs*/
        logger.debug("starting reading...");
        var data = "";
        try {
            data = fs.readFileSync(file, 'utf8');//, 'utf8'
        }
        catch (err) {
            logger.error("Error opening file '"+file_name+"': " + err.message);
            result.push(false);
            result.push("Couldn't open .csv file!");
            return result;
        }
        //logger.debug("%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%");
        //logger.debug(charDetector(data));//iconv-lite, iconv
        //mainWindow.webContents.send("output-to-chrome-console", charDetector(data));
        //logger.debug("%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%");
        var detectRes = charDetector(data);
        if (detectRes.length > 0) {
            logger.info("Encoding found");
            if (iconv.encodingExists(detectRes[0].charsetName)) {
                logger.info("encoding EXISTS: " + detectRes[0].charsetName);
                data = iconv.decode(data, detectRes[0].charsetName);
            }
            else {
                logger.warn("Encoding does not exist! Defaulting to UTF-8...");
                data = data.toString('utf8'); 
            }
        }
        else {
            logger.warn("No hits for encoding found! Defaulting to UTF-8...");
            data = data.toString('utf8'); 
        }
            //console.log("DATA FROM READFILE");
            //console.log(JSON.stringify(data));
            //console.log(data);


            //console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>OMAN TULOSTUS");
        logger.debug("############ PARSE FILES NOW (in readFile).....");

        var parseResult = parseUtils.validateAndParseCSV(data, lert_tool);// NEEDSTOBECHANGED
        //logger.debug("outputdata>>>>>>>>");
        //logger.debug(output_data);
            //console.log("setting data");
            //window.currentFileContent = output_data;
        if (!parseResult[0]) {
            result.push(false);
            result.push(parseResult[1]); // reason for failure
            return result;
        }
        result.push(true);
        result.push(parseResult);
        logger.debug("readFile RETURNING VALUES");
        logger.info("File '"+file_name+"' content successfully loaded and parsed!");
        return result;
            //var keys = null;
            //keys = showQuizData(output_data); // ALERT!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
            //setupKeywordSelect(output_data[1].length, keys); // ALERT!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    }
    else {
        //what lies beyond this land... prob not right file for some reason :D
        result.push(false);
        result.push("File invalid! Need to be .csv!");
        return result;
    }
}

//%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
// Return array of string values, or NULL if CSV string not well formed. Checks valid form (ONLY WITH EXCEL-FORMATS!!!!!)
/*
function CSVtoArray(text) {
    logger.debug("CSVtoArray");
    //logger.debug(text);
    var re_valid = /^\s*(?:'[^'\\]*(?:\\[\S\s][^'\\]*)*'|"[^"\\]*(?:\\[\S\s][^"\\]*)*"|[^,'"\s\\]*(?:\s+[^,'"\s\\]+)*)\s*(?:,\s*(?:'[^'\\]*(?:\\[\S\s][^'\\]*)*'|"[^"\\]*(?:\\[\S\s][^"\\]*)*"|[^,'"\s\\]*(?:\s+[^,'"\s\\]+)*)\s*)*$/;
    var re_value = /(?!\s*$)\s*(?:'([^'\\]*(?:\\[\S\s][^'\\]*)*)'|"([^"\\]*(?:\\[\S\s][^"\\]*)*)"|([^,'"\s\\]*(?:\s+[^,'"\s\\]+)*))\s*(?:,|$)/g;
    // Return NULL if input string is not well formed CSV string.
    if (!re_valid.test(text)) {
        return null;
    }
    var arr = [];                     // Initialize array to receive values.
    text.replace(re_value, // "Walk" the string using replace with callback.
        function (m0, m1, m2, m3) {
            // Remove backslash from \' in single quoted values.
            if (m1 !== undefined) arr.push(m1.replace(/\\'/g, "'"));
            // Remove backslash from \" in double quoted values.
            else if (m2 !== undefined) {
                arr.push(m2.replace(/\\"/g, '"'));
            }
            else if (m3 !== undefined) {
                arr.push(m3);
            }
            return ''; // Return empty string.
        });
    // Handle special case of empty last value.
    if (/,\s*$/.test(text)) {
        arr.push('');
    }
    return arr;
}*/