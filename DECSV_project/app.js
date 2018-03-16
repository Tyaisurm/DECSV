﻿const electron = require('electron');
const app = electron.app;
const logger = require('electron-log');
const BrowserWindow = electron.BrowserWindow; 
const path = require('path');
const url = require('url');
const fs = require('fs');
const autoUpdater = require("electron-updater").autoUpdater;
const dialog = electron.dialog;
const windowStateKeeper = require('electron-window-state');
const Store = require('electron-store');
const XLSX = require('xlsx');
const charDetector = require('charset-detector');
const iconv = require('iconv-lite');
let openWindow = null;
let mainWindow = null;
let aboutWindow = null;
let i18n_app = null;

var demostatus = false;

if (require('electron-squirrel-startup')) { app.quit(); }

/////////////////////////////// SETTING LOGGER LEVELS
logger.transports.file.level = "info";
logger.transports.console.level = "silly";
autoUpdater.logger = logger;
///////////////////////////////

const isSecondInstance = app.makeSingleInstance((commandLine, workingDirectory) => {
    // Someone tried to run a second instance, we should focus our window
    if (mainWindow) {
        if (mainWindow.isMinimized()) {
            mainWindow.restore();
        }
        mainWindow.focus();
    }
});

if (isSecondInstance) {
    logger.debug("Tried to create second instance!");
    app.quit()
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

// create project
ipcMain.on('async-create-project', (event, project_name, project_country, project_lang) => {
    logger.debug("async-create-project (at app.js)");
    var sending_back = createNewProject(project_name, project_country, project_lang);
    event.sender.send('async-create-project-reply', sending_back);
});

// NEEDS UPDATE - NOT USED AT THE MOMENT (rimraf)
// delete project
ipcMain.on('async-delete-project', (event, arg) => {
    logger.debug("async-delete-project (at app.js)");
})

// import files to project folder
ipcMain.on('async-import-files', (event, arg) => {
    logger.debug("async-import-files (at app.js)");
    srcFiles2Proj(arg[0], event, arg[1]);
})

// transform source-folder files into temp files :)
ipcMain.on('async-transform-files', (event, arg) => {
    logger.debug("async-transform-files (at app.js)");
    transformSrc2Temp(arg, event);
})

// NEEDS UPDATE
// save chosen temp-files into CSV files (aka. output)
ipcMain.on('async-create-output', (event, arg) => {
    logger.debug("async-create-output (at app.js)");
})

////////////////////////////////////////////////////////////

/* Creates application's folders into user's Documents-folder */
function createDocStructure() {
    logger.debug("createDocStructure");
    var docpath = app.getPath('documents');
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
}

/* Creates application's folders and settings-files into user's AppData-folder */
function createAppStructure() {
    logger.debug("createAppStructure");
    var apppath = app.getPath('userData');
    if (!fs.existsSync(path.join(apppath, 'app-configuration.json'))) {
        logger.info("No app configuration file found! Creating one with defaults...");
        var CA1_options = {
            defaults: {
                "app-lang": "en",
                "first-use": true,
                "app-version": app.getVersion(),
                "demo-files": demostatus
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
        var appfirst = CA1_store.get("first-use", true);
        var appdemos = CA1_store.get("demo-files", false)

        logger.info("Current ver.: " + app.getVersion() + " Ver. in file: " + appver);
        if (appver !== app.getVersion()){
            logger.info("Config version old! Overwriting..."); 
            CA1_store.clear();
            CA1_store.set("app-lang", applang);
            CA1_store.set("first-use", appfirst);
            CA1_store.set("app-version", app.getVersion());
            CA1_store.set("demo-files", appdemos)
        }
        demostatus = appdemos;
        if (demostatus) {
            // is true, meaning that demofiles have been created befor
            logger.info("Demofiles created before!");
        } else {
            CA1_store.set("demo-files", true)
            logger.info("Demofiles not created before! Creating now...");
            // is false, no demofiles have been done yet
        }

        // check if consistent with this version, if not, remove and rebuild
    }
    if (!fs.existsSync(path.join(apppath, 'keywordlists\\keyword-config.json')) || !demostatus) {
        logger.info("No keyword configuration file found! Creating one with defaults...");
        if (!fs.existsSync(path.join(apppath, 'keywordlists'))){ fs.mkdirSync(path.join(apppath, 'keywordlists')); }// just because error when trying to create already existing
        logger.info("CREATING DEMO FILES TO SHOW FUNCTIONALITY WITH KEYWORDS!");
        // #################################################################
        //      SETTING DEMO FILES - BELOW IS ORIGINAL.....
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
        var CA2_options = {
            defaults: {
                "last-successful-update": "----",
                "available-keywordlists": {
                    "en-basic": {
                        "date": "2017-08-11T15:47:34.847Z",
                        "name": "English - Basic"
                    },
                    "fi-basic": {
                        "date": "2017-08-11T15:47:34.847Z",
                        "name": "Suomi - Perus"
                    }
                },
                "local-keywordlists": {
                    "en-basic": {
                        "date": "2017-08-11T15:47:34.847Z",
                        "name": "English - Basic"
                    },
                    "fi-basic": {
                        "date": "2017-08-11T15:47:34.847Z",
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
        try {
            var source_demo_1 = path.join(__dirname, './demo_files/en-basic.json');
            var source_demo_2 = path.join(__dirname, './demo_files/fi-basic.json');
            var destination_demo_1 = path.join(apppath, 'keywordlists/en-basic.json')
            var destination_demo_2 = path.join(apppath, 'keywordlists/fi-basic.json')
            var content_1 = fs.readFileSync(source_demo_1, 'utf-8');
            var content_2 = fs.readFileSync(source_demo_2, 'utf-8');
            fs.writeFileSync(destination_demo_1, content_1, 'utf-8');
            fs.writeFileSync(destination_demo_2, content_2, 'utf-8');
        }
        catch (err) {
            logger.error("Failed to copy demo files!");
            logger.error(err.message);
        }
    }
}

/* Creates new project with a given name into Documents-folder */
function createNewProject(proj_name, proj_country, proj_lang) {// %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%% Test if country and language given!!!!
    var reason = [];
    logger.debug("createNewProject");
    logger.debug(proj_name);
    logger.debug(proj_name.length);
    var regex_filepath_val = /^[^\\/:\*\?"<>\|]+$/;
    var docpath = app.getPath('documents');

    if (proj_name === undefined) {
        // Projectname not defined
        reason.push(false, "No name defined!");
        return reason;
    }
    else if (proj_name.length === 0 || proj_name.length > 100) {
        // Projectname length 0 or over 100 characters
        reason.push(false, "Name should have 1-100 characters!");
        return reason;
    }
    else if (!regex_filepath_val.test(proj_name)) {
        // Projectname not allowed
        reason.push(false, 'Name should not contain <>:"/\\|?*');
        return reason;
    }
    else if (fs.existsSync(path.join(docpath, 'SLIPPS DECSV'))) {
        if (fs.existsSync(path.join(docpath, 'SLIPPS DECSV\\Projects'))) {
            if (!fs.existsSync(path.join(docpath, 'SLIPPS DECSV\\Projects\\' + proj_name))) {
                fs.mkdirSync(path.join(docpath, 'SLIPPS DECSV\\Projects\\' + proj_name));

                var today = new Date();

                var CA3_options = {
                    defaults: {
                        "created-on": today,
                        "source-files": [],
                        "temp-files": {},
                        "kw-per-file": {},
                        "notes": [],
                        "country": proj_country,
                        "lang": proj_lang,
                        "version": app.getVersion()
                    },
                    name: proj_name,
                    cwd: path.join(docpath, 'SLIPPS DECSV\\Projects\\' + proj_name)
                }
                const CA3_store = new Store(CA3_options);

                if (!fs.existsSync(path.join(docpath, 'SLIPPS DECSV\\Projects\\' + proj_name + '\\source'))) {
                    fs.mkdirSync(path.join(docpath, 'SLIPPS DECSV\\Projects\\' + proj_name + '\\source'));
                }
                if (!fs.existsSync(path.join(docpath, 'SLIPPS DECSV\\Projects\\' + proj_name + '\\temp'))) {
                    fs.mkdirSync(path.join(docpath, 'SLIPPS DECSV\\Projects\\' + proj_name + '\\temp'));
                }
                logger.info("Created project " + proj_name + "...");
                reason.push(true);
                return reason;
            }
            else {
                // Project with same name exists!
                reason.push(false, "Project with same name exits!");
                return reason;
            }
        }
        else {
            // Projects-folder not present!
            createDocStructure();
            reason.push(false, "Projects-older missing! Try again.");
            return reason;
        }
    }
    else {
        // Application-folder (at Documents) not present!
        createDocStructure();
        reason.push(false, "Application-folder missing! Try again.");
        return reason;
    }
}

// NEEDS UPDATE - NOT CURRENTLY USED
/* This deletes project directory with given name */
function removeProject(proj_name) {
    logger.debug("removeProject");
    if (proj_name.length === 0 || proj_name.length > 100) {
        // Projectname length 0 or over 100 characters
        return false;
    }
    else if (fs.existsSync(path.join(docpath, 'SLIPPS DECSV'))){
        if (fs.existsSync(path.join(docpath, 'SLIPPS DECSV\\Projects'))){
            if (fs.existsSync(path.join(docpath, 'SLIPPS DECSV\\Projects\\' + proj_name))) {

                //  REMOVE PROJECT DIRECTORY HERE!!!!!!

            }
            else {
                // No project with given name found!
                return false;
            }
        }
        else {
            // Projects-folder not present!
            return false;
        }
    }
    else {
        // No Application-folder (at Documents) not present!
        return false;
    }


}

// NOT CURRENTLY USED
/* This function checks and compares temp folder contents of project with it's properties file "temp-files" list */
function checkTempFiles(proj_name) {
    //
    var docpath = app.getPath('documents');
    var proj_base = path.join(docpath, 'SLIPPS DECSV\\Projects\\' + proj_name + '\\');

    if (fs.existsSync(path.join(docpath, 'SLIPPS DECSV'))) {
        if (fs.existsSync(path.join(docpath, 'SLIPPS DECSV\\Projects'))) {
            if (fs.existsSync(path.join(docpath, 'SLIPPS DECSV\\Projects\\' + proj_name + '\\temp'))) {
                if (fs.existsSync(path.join(docpath, 'SLIPPS DECSV\\Projects\\' + proj_name + '.json'))) {
                    var temp_files = [];
                    fs.readdirSync(path.join(docpath, 'SLIPPS DECSV\\Projects\\' + proj_name + '\\temp'), (err, files) => {
                        temp_files = files;
                    });

                    var check_options = {
                        name: proj_name,
                        cwd: proj_base
                    }
                    //logger.debug("proj_name and proj_base: "+proj_name+" & "+proj_base);
                    const check_store = new Store(check_options);

                    var sourceF = check_store.get('source-files', []);
                    var tempF = check_store.get('temp-files', {});
                    var tempLang = check_store.get('lang', null);
                    var tempCountry = check_store.get('country', null);
                    var proj_ver = check_store.get("version", null);

                    // compare dir contents with proj properties contents, and either add new (valid) files into properties, or remove non-existing from properties

                    for (var proj_f in tempF) {
                        //
                    }
                    ///////////////////////////////////////////////////////////////////////////////
                    /*
                    var temp_options = {
                        defaults: {
                            "src": fileS.toString(),
                            "src-data": [],
                            "subID": 0,
                            "subDATE": new Date(),
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
                    const temp_store = new Store(temp_options);
                    if (temp_store.get("version", null) !== null) {
                        // checking version found inside...
                    }
                    else {
                        // no version. too old.
                    }
                    */
                    ///////////////////////////////////////////////////////////////////////////////


                }
                else {
                    // No project properties file
                    return false;
                }

            }
            else {
                // No project with given name or tempfolder found!
                return false;
            }
        }
        else {
            // Projects-folder not present!
            return false;
        }
    }
    else {
        // No Application-folder (at Documents) not present!
        return false;
    }
}

/* Imports source files into the project folders */
function srcFiles2Proj(files,event,ready_src) {
    logger.debug("srcFiles2Proj");
    var docpath = app.getPath('documents');
    var proj_name = files.pop();

    /* This still needs verifications about folders if they exists */

    var source = null;
    var dest = null;
    var dest_base = path.join(docpath, 'SLIPPS DECSV\\Projects\\' + proj_name + '\\source\\');
    var readStream = null;
    var writeStream = null;
    var result = [];
    result[0] = true;
    var filename = null;
    var rcounter = 0;
    var wcounter = 0;
    var check = false;

    if (fs.existsSync(path.join(docpath, 'SLIPPS DECSV\\Projects\\' + proj_name))) {
        if (fs.existsSync(dest_base)) {

            // Loop through the array of files to be imported
            for (var i = 0; i < files.length; i++) {
                source = files[i];
                filename = files[i].split('\\').pop();
                logger.debug("FILENAME: " + filename);
                logger.debug("ready_SRC: " + ready_src);
                // Check if file to be imported is already mentioned in project config file
                for (var k = 0; k < ready_src.length; k++){
                    logger.debug("testing ready_src: "+k);
                    if (ready_src[k] === filename) { check = true; break;}
                }
                logger.debug(check);
                if (check) {
                    check = false;
                    rcounter++;
                    logger.warn("Tried to import file with same name as already existing '"+filename+"'. Skipping file import...");
                    continue;
                }

                dest = path.join(dest_base, filename);
                logger.debug("DEST: "+dest);
                readStream = fs.createReadStream(source);
                writeStream = fs.createWriteStream(dest);

                readStream.once('error', (err) => {
                    logger.error("Error while reading source file while importing!");
                    logger.error(err.message);
                    rcounter++;
                    result[0] = false;
                    result.push("Error reading source file while importing '"+filename+"'");
                });

                readStream.once('end', () => {
                    logger.info("Reading source file completed");
                    rcounter++;
                });

                writeStream.on('error', function () {
                    logger.info("Error while writing source file while importing!");
                    result[0] = false;
                    result.push("Error writing to target file while importing '" + filename + "'");
                });

                writeStream.on('finish', function () {
                    logger.info("Writing source file completed while importing");
                    wcounter++;
                    logger.debug("WCOUNTER and RCOUNTER");
                    logger.debug(wcounter);
                    logger.debug(rcounter);
                    logger.debug("FILES LENGTH: " + files.length);
                    if (rcounter === files.length) {
                        logger.debug("sending back now");
                        event.sender.send('async-import-files-reply', result);
                    }
                });
                logger.debug("Before reading and writing...");
                readStream.pipe(writeStream);
            }
        }
        else {
            logger.error();
            result[0] = false;
            result.push("Project source-folder does not exist!");
            event.sender.send('async-import-files-reply', result);
            // Project data .json not present!
        }
    }
    else {
        logger.error();
        result[0] = false;
        result.push("Project's folder does not exist!");
        event.sender.send('async-import-files-reply', result);
        // project source folder or other folders not present!
    }
}

/* Handles needed stuff when application is going to be closed */
function handleclosing() {
    logger.debug("handleClosing");
    // do things needed before shutting down
    var CA3_options = {
        name: "app-configuration",
        cwd: app.getPath('userData')
    }
    const CA3_store = new Store(CA3_options);


    //CA3_store.set("safe-to-shutdown", true)
    app.quit();
}

/* Creates opening window (with logo) and main window */
function createWin() {
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
    //mainWindow.toggleDevTools();//ENABLED

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
        openWindow.hide();
        mainWindow.show();
        openWindow.close();
    });

    mainWindow.on('close', (e) => {

        if (app.showExitPrompt) {
            e.preventDefault();

            var options = {
                type: 'info',
                title: i18n_app.__('quit-conf-title', true),
                message: i18n_app.__('quit-conf-message', true),
                detail: i18n_app.__('quit-conf-detail', true),
                buttons: [i18n_app.__('conf-yes', true), i18n_app.__('conf-no', true)]
            };

            dialog.showMessageBox(mainWindow, options, function (index) {
                if (index === 0) {
                    app.showExitPrompt = false;
                    handleclosing();
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
}

/* Called when all windows are closed */
app.on('window-all-closed', function () {
    logger.info("all windows closed");
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
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
        app.showExitPrompt = true;

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
ipcMain.on("check-updates", (event, arg) => {

autoUpdater.on('checking-for-update', function () {
    logger.info("Current version: " + app.getVersion().toString());
    //console.log(event);
    var arr = [];
    arr.push(0);
    event.sender.send("check-updates-reply", arr);
});
autoUpdater.on('update-available', function (info) {
    logger.info("Update available!");
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
        logger.error("Failed to get updates!");
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

autoUpdater.on('update-downloaded', function (info){//ev, relNot, relNam, relDat, updUrl) {
    logger.info("Update has been downloaded!");
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
        message: "New version "+ver+" is ready to be installed",
        detail: "Would you like to close the application and update?\r\n\r\nVersion: " + ver ,
        buttons: [i18n_app.__('conf-yes', true), i18n_app.__('conf-no', true)]
    }; // DATE NEED TO BE REFORMATTED, AND RELNOTE SHOULD BE PARSED (CONTAINS HTML)
    // + "\r\nRelease date: " + new Date(relDat) +"\r\n"+relNote,

    dialog.showMessageBox(mainWindow, options, function (index) {
        if (index === 0) {
            app.showExitPrompt = false;
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
function clearUpdaterListeners() {
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
            devTools: true,
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
        logger.debug("Refocus about-window...");
        aboutWindow.focus();
    }
}

/* Creates temp-files from source files within the project's folders */
function transformSrc2Temp(proj_name, event) {
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
                const s2t_store = new Store(s2t_options);

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
                const proj_store = new Store(proj_options);
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
                            var returnArr = readFile(path.join(src_base, fileS), function () {// reading source file from project's source folder
                                //
                            });
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
                                    "subDATE": new Date(),
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
                            const temp_store = new Store(temp_options);

                            //temp_store.set("subID", dataArray[1][0]); // Setting identifier
                            //temp_store.set("subDATE", dataArray[1][1]); // Setting create date

                            secChtml = '<div class="secC-Q-allA">';
                            var elemtextA = '<p class="w3-blue w3-container secA-Q" style="width:100%;"></p>';// no text here, because it will be placed in UI, not in file
                            elemtextA = elemtextA + '<p class="secA-Q-allA">';
                            var elemtextB = '<p class="w3-blue w3-container secB-Q" style="width:100%;"></p>';// no text here, because it will be placed in UI, not in file
                            elemtextB = elemtextB + '<p class="secB-Q-allA">';

                            elemtextA = elemtextA + currentDataArr[1].replace(/&/g, "&amp;")
                                .replace(/</g, "&lt;")
                                .replace(/>/g, "&gt;")
                                .replace(/"/g, "&quot;")
                                .replace(/'/g, "&#039;")
                                .replace(/\b(\w+?)\b/g, '<span class="word">$1</span>');
                            elemtextB = elemtextB + currentDataArr[2].replace(/&/g, "&amp;")
                                .replace(/</g, "&lt;")
                                .replace(/>/g, "&gt;")
                                .replace(/"/g, "&quot;")
                                .replace(/'/g, "&#039;")
                                .replace(/\b(\w+?)\b/g, '<span class="word">$1</span>');
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
                                        ansText = currentDataArr[line].replace(/&/g, "&amp;")
                                            .replace(/</g, "&lt;")
                                            .replace(/>/g, "&gt;")
                                            .replace(/"/g, "&quot;")
                                            .replace(/'/g, "&#039;")
                                            .replace(/\b(\w+?)\b/g, '<span class="word">$1</span>');
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
function readFile(file) {
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
    else if (file_ext === 'csv') {
        logger.debug("file was CSV FORMAT");
        /*Node.js fs*/
        logger.debug("starting reading...");
        var data = "";
        try {
            data = fs.readFileSync(file);//, 'utf8'
        }
        catch (err) {
            logger.error("Error opening .csv file: " + err.message);
            result.push(false);
            return result;
        }
        //logger.debug("%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%");
        //logger.debug(charDetector(data));//iconv-lite, iconv
        //mainWindow.webContents.send("output-to-chrome-console", charDetector(data));
        //logger.debug("%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%");
        var detectRes = charDetector(data);
        if (detectRes.length > 0) {
            logger.info("FOUND HITS FOR ENCODING....");
            if (iconv.encodingExists(detectRes[0].charsetName)) {
                logger.info("encoding EXISTS!");
                data = iconv.decode(data, detectRes[0].charsetName);
            }
            else {
                logger.warn("encoding DOES NOT EXISTS! Defaulting to UTF-8...");
                data = data.toString('utf8'); 
            }
        }
        else {
            logger.warn("NO HITS FOR ENCODING!!! Defaulting to UTF-8...");
            data = data.toString('utf8'); 
        }
            //console.log("DATA FROM READFILE");
            //console.log(JSON.stringify(data));
            //console.log(data);


            //console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>OMAN TULOSTUS");
       logger.debug("readFile before parsing data to arrays");
       var output_data = CSVtoArray(data);
       //logger.debug("outputdata>>>>>>>>");
       //logger.debug(output_data);
            //console.log("setting data");
            //window.currentFileContent = output_data;
       result.push(true);
       result.push(output_data);
       logger.debug("readFile RETURNING VALUES");
       return result;
            //var keys = null;
            //keys = showQuizData(output_data); // ALERT!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
            //setupKeywordSelect(output_data[1].length, keys); // ALERT!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    }
    else {
        //what lies beyond this land... prob not right file for some reason :D
        result.push(false);
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
function CSVtoArray(strData, strDelimiter) {
    logger.debug("CSVtoArray");
    // Check to see if the delimiter is defined. If not,
    // then default to comma.
    strDelimiter = (strDelimiter || ";");

    // Create a regular expression to parse the CSV values.
    var objPattern = new RegExp(
        (
            // Delimiters.
            "(\\" + strDelimiter + "|\\r?\\n|\\r|^)" +

            // Quoted fields.
            "(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +

            // Standard fields.
            "([^\"\\" + strDelimiter + "\\r\\n]*))"
        ),
        "gi"
    );


    // Create an array to hold our data. Give the array
    // a default empty first row.
    var arrData = [[]];

    // Create an array to hold our individual pattern
    // matching groups.
    var arrMatches = null;


    // Keep looping over the regular expression matches
    // until we can no longer find a match.
    while (arrMatches = objPattern.exec(strData)) {

        // Get the delimiter that was found.
        var strMatchedDelimiter = arrMatches[1];

        // Check to see if the given delimiter has a length
        // (is not the start of string) and if it matches
        // field delimiter. If id does not, then we know
        // that this delimiter is a row delimiter.
        if (
            strMatchedDelimiter.length &&
            strMatchedDelimiter !== strDelimiter
        ) {

            // Since we have reached a new row of data,
            // add an empty row to our data array.
            arrData.push([]);

        }

        var strMatchedValue;

        // Now that we have our delimiter out of the way,
        // let's check to see which kind of value we
        // captured (quoted or unquoted).
        if (arrMatches[2]) {

            // We found a quoted value. When we capture
            // this value, unescape any double quotes.
            strMatchedValue = arrMatches[2].replace(
                new RegExp("\"\"", "g"),
                "\""
            );

        } else {

            // We found a non-quoted value.
            strMatchedValue = arrMatches[3];

        }


        // Now that we have our value string, let's add
        // it to the data array.
        arrData[arrData.length - 1].push(strMatchedValue);
    }

    // Return the parsed data.
    return (arrData);
}


/* This function takes in raw data from read .csv file and turns it into arrays (ONLY CSV FORMATS!!!) */
function parseCSV2Array(csv) {
    logger.debug("parseCSV2Array");
    //logger.debug(csv);
    //console.log("RAW CSV DATA IN");
    //console.log(csv);

    var separators = ['\"\",\"\"', ',\"\"', '\"\"'];
    //var separators_NEW = ['\";\"']; // the second " at the start and the end of the line need to be removed seperately (this->" something ";" something 2 "<-this)
    var newlines = ['\r\n', '\n']; //<- so that no weird stuff happens... hopefully

    //console.log(typeof (csv));
    //var lines = csv.split("\n");
    var lines = csv.split(new RegExp(newlines.join('|'), 'g'));
    //console.log(JSON.stringify(lines[0]));


    //var temptemp = CSVtoArray(csv);
    //mainWindow.webContents.send("output-to-chrome-console", temptemp);
    //mainWindow.webContents.send("output-to-chrome-console", lines);

    lines[0] = lines[0].substring(1, lines[0].length - 3);
    //console.log(JSON.stringify(lines[0]));
    lines[1] = lines[1].substring(1, lines[1].length - 3);
    //console.log(JSON.stringify(lines[1]));
    if (lines[2].length !== 0) {
        lines[2] = lines[2].substring(1, lines[2].length - 3);
    }

    var headers = lines[0].split(new RegExp(separators_NEW.join('|'), 'g'));
    var contents = lines[1].split(new RegExp(separators_NEW.join('|'), 'g'));
    if (lines[2].length !== 0) {
        var keys = lines[2].split(new RegExp(separators_NEW.join('|'), 'g'));
    }
    //console.log(">>>>>>>>>>>>>>>>>>>>>>>>HEADERS");
    //console.log(headers);
    //console.log(">>>>>>>>>>>>>>>>>>>>>>>>CONTENTS");
    //console.log(contents);

    var result = new Array(); //was Array(2)
    var i = 0;
    for (i = 0; i < 2; i++) {
        result[i] = [];
    }
    if (lines[2].length !== 0) {
        result[2] = [];
    }

    //result[0][0] = headers[0];
    for (i = 0; i < headers.length; i++) {
        result[0][i] = headers[i];
    }
    for (i = 0; i < contents.length; i++) {
        result[1][i] = contents[i];
    }
    if (lines[2].length !== 0) {
        for (i = 0; i < keys.length; i++) {
            result[2][i] = keys[i];
        }
    }

    return result;
}