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
const Store = require('electron-store');
let openWindow = null;
let mainWindow = null;
let aboutWindow = null;
let i18n_app = null;

if (require('electron-squirrel-startup')) { app.quit(); }

///////////////////////////////
logger.transports.file.level = "info";
logger.transports.console.level = "silly";
autoUpdater.logger = logger;
///////////////////////////////

const isSecondInstance = app.makeSingleInstance((commandLine, workingDirectory) => {
    // Someone tried to run a second instance, we should focus our window.
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
ipcMain.on('async-create-project', (event, arg) => {
    logger.debug("async-create-project (at app.js)");
    var sending_back = createNewProject(arg);
    event.sender.send('async-create-project-reply', sending_back);
});

// NEEDS UPDATE
// delete project
ipcMain.on('async-delete-project', (event, arg) => {
    logger.debug("async-delete-project (at app.js)");
    event.sender.send('async-delete-project-reply', 'pong')
})

// import files to project folder
ipcMain.on('async-import-files', (event, arg) => {
    logger.debug("async-import-files (at app.js)");
    srcFiles2Proj(arg[0], event, arg[1]);
})

////////////////////////////////////////////////////////////


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

function createAppStructure() {
    logger.debug("createAppStructure");
    var apppath = app.getPath('userData');
    if (!fs.existsSync(path.join(apppath, 'app-configuration.json'))) {
        logger.info("No app configuration file found! Creating one with defaults...");
        var CA1_options = {
            defaults: {
                "app-lang": "en",
                "first-use": true,
                "safe-to-shutdown": true,
                "backup": {
                    "latest-project": null
                }
            },
            name: "app-configuration",
            cwd: apppath
        }
        const CA1_store = new Store(CA1_options);

    }
    if (!fs.existsSync(path.join(apppath, 'keywordlists\\keyword-config.json'))) {
        logger.info("No keyword configuration file found! Creating one with defaults...");
        fs.mkdirSync(path.join(apppath, 'keywordlists'));
        var CA2_options = {
            defaults: {
                "last-successful-update": null,
                "available-keywordlists": {},
                "local-keywordlists": {},
                "enabled-keywordlists": []
            },
            name: "keyword-config",
            cwd: path.join(apppath, 'keywordlists')
        }
        const CA2_store = new Store(CA2_options);
    }
}

// TEST
//fs.writeFileSync('log.txt', 'lisää ääkkösiä', encoding='utf-8');
//createNewProject("ää");

function createNewProject(proj_name) {
    var reason = [];
    logger.debug("createNewProject");
    var regex_filepath_val = /^[^\\/:\*\?"<>\|]+$/;
    var docpath = app.getPath('documents');

    if (proj_name === undefined) {
        // Projectname not defined
        reason.push(false, "No name defined!");
        return reason;
    }
    else if (proj_name.lenght === 0 || proj_name.lenght > 100) {
        // Projectname length 0 or over 100 characters
        reason.push(false, "Name should have 1-100 characters!");
        return reason;
    }
    else if (!regex_filepath_val.test(proj_name)) {
        // Projectname not allowed
        reason.push(false, 'Name should not contain <>:"/\|?*');
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
                        "notes": []
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

// NEEDS UPDATE
function removeProject(proj_name) {
    logger.debug("removeProject");
    if (proj_name.lenght === 0 || proj_name.lenght > 100) {
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
    var result = true;
    var filename = null;
    var rcounter = 0;
    var wcounter = 0;
    var check = false;

    if (fs.existsSync(dest_base)) {
        if (fs.existsSync(path.join(docpath, 'SLIPPS DECSV\\Projects\\' + proj_name))) {

            // Loop through the array of files to be imported
            for (var i = 0; i < files.length; i++) {
                source = files[i];
                filename = files[i].split('\\').pop();
                logger.debug("FILENAME: " + filename);
                logger.debug("ready_SRC: " + ready_src);
                // Check if file to be imported is already mentioned in project config file
                for (var k = 0; k < ready_src.length; k++){
                    if (ready_src[k] === filename) { check = true; break;}
                }
                logger.debug(check);
                if (check){ continue;}

                dest = path.join(dest_base, filename);
                logger.debug("DEST: "+dest);
                readStream = fs.createReadStream(source);
                writeStream = fs.createWriteStream(dest);

                readStream.once('error', (err) => {
                    logger.error("Error while reading source file!");
                    logger.error(err);
                    rcounter++;
                    result = false;
                });

                readStream.once('end', () => {
                    logger.info("Reading source file completed");
                    rcounter++;
                });

                writeStream.on('finish', function () {
                    logger.info("Writing source file completed");
                    wcounter++;
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
            // Project data .json not present!
        }
    }
    else {
        // project source folder or other folders not present!
    }
}


function handleclosing() {
    logger.debug("handleClosing");
    // do things needed before shutting down
    var CA3_options = {
        name: "app-configuration",
        cwd: app.getPath('userData')
    }
    const CA3_store = new Store(CA3_options);


    CA3_store.set("safe-to-shutdown", true)
    app.quit();
}
function createWin() {
    logger.debug("createWin");
    openWindow = new BrowserWindow({
        width: 300,
        height: 300,
        resizable: false,
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
        frame: false,
        backgroundColor: '#dadada',
        show: false
    });
    //mainWindow.toggleDevTools();
    mainWindowState.manage(mainWindow);

    let win2_url = url.format({
        protocol: 'file',
        slashes: true,
        pathname: path.join(__dirname, './assets/html/index.html')
    });
    mainWindow.loadURL(win2_url);

    //toggle dev tools when window opens
    //mainWindow.webContents.openDevTools();
    mainWindow.on('ready-to-show', function () {
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
        openWindow = null;
    });
}

app.on('window-all-closed', function () {
    logger.info("all windows closed");
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('ready', function () {
    if (process.platform === 'win32') {
        //
    }
    else if (process.platform === 'linux') {
        //
    }
    else if (process.platform === 'darwin'){
        //
    }
    else {
        //well then, you are fckd :x
    }
    logger.info('app ready');

    logger.debug("setupTranslations(app.js)");
    i18n_app = new (require('./assets/translations/i18n'))(true);
    app.showExitPrompt = true;

    createWin();
});

app.on('activate', function () {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    logger.info("app activated");
    if (mainWindow === null) {
        createWin();
    }
});

/* AUTOUPDATER */
//var updatePath = "http://testing-tyaisurm.c9users.io/update/win32/" + app.getVersion().toString();
//autoUpdater.setFeedURL(updatePath);

app.on('will-quit', function () {
    logger.info("application will quit...");
});
app.on('quit', function () {
    logger.info("quitting application...");
});

///////////////////

ipcMain.on("check-updates", (event, arg) => {

    autoUpdater.on('checking-for-update', function () {
    logger.info("Checking for updates...");
    logger.info("Current version: " + app.getVersion().toString());
    event.sender.send("check-updates-reply", 0);
});
autoUpdater.on('update-available', function (info) {
    logger.info("Update available!");
    logger.info(info);

    event.sender.send("check-updates-reply", 1);
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
});
autoUpdater.on('error', function (err) {
    logger.error("Error in autoUpdater! " + err.message);

    event.sender.send("check-updates-reply", 2);
    clearUpdaterListeners();
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
});
autoUpdater.on('update-not-available', function (info) {
    logger.info("Update not available!");
    logger.info(info);

    event.sender.send("check-updates-reply", 2);
    clearUpdaterListeners();
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
});

autoUpdater.on('update-downloaded', function (info){//ev, relNot, relNam, relDat, updUrl) {
    logger.info("Update has been downloaded!");
    logger.info(info);
    event.sender.send("check-updates-reply", 2);
    clearUpdaterListeners();
    var options = {
        type: 'info',
        title: "Update downloaded",
        message: "New version is ready to be installed",
        detail: "Would you like to close the application and update?",
        buttons: ["yes", "no"]
    };

    dialog.showMessageBox(options, function (index) {
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
    let log_message = "Download speed: " + progressObj.bytesPerSecond;
    log_message = log_message + ' - Downloaded ' + progressObj.percent + '%';
    log_message = log_message + ' (' + progressObj.transferred + "/" + progressObj.total + ')';
    logger.info(progressObj);
    logger.info(log_message);
   });
    logger.debug("CALLING CHECKFORUPDATES!!!");
   autoUpdater.checkForUpdates();
});

function clearUpdaterListeners() {
    autoUpdater.removeAllListeners('checking-for-update');
    autoUpdater.removeAllListeners('update-available');
    autoUpdater.removeAllListeners('error');
    autoUpdater.removeAllListeners('update-not-available');
    autoUpdater.removeAllListeners('update-downloaded');
    autoUpdater.removeAllListeners('download-progress');
}

global.createAboutWin = function () {
    if (aboutWindow === null) {
        logger.info("Opening about-window...");
        aboutWindow = new BrowserWindow({
            width: 500,
            height: 500,
            //resizable: false,
            minWidth: 500,
            minHeight: 500,
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
