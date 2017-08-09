const electron = require('electron');
const app = electron.app;
const logger = require('electron-log');
const BrowserWindow = electron.BrowserWindow; 
const path = require('path');
const url = require('url');
const fs = require('fs');
const autoUpdater = electron.autoUpdater;
const dialog = electron.dialog;
const windowStateKeeper = require('electron-window-state');
const Store = require('electron-store');
let openWindow = null;
let mainWindow = null;
let aboutWindow = null;
let i18n_app = null;

if (require('electron-squirrel-startup')) app.quit();

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
                "last-successfull-update": null,
                "available-keywordlists": {},
                "local-keywordlists": {},
                "enabled-keywordlists": {}
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
    logger.debug("createNewProject");
    var regex_filepath_val = /^[^\\/:\*\?"<>\|]+$/;
    var docpath = app.getPath('documents');

    if (proj_name === undefined) {
        // Projectname not defined
        return false;
    }
    else if (proj_name.lenght === 0 || proj_name.lenght > 100) {
        // Projectname length 0 or over 100 characters
        return false;
    }
    else if (!regex_filepath_val.test(proj_name)) {
        // Projectname not allowed
        return false;
    }
    else if (fs.existsSync(path.join(docpath, 'SLIPPS DECSV'))) {
        if (fs.existsSync(path.join(docpath, 'SLIPPS DECSV\\Projects'))) {
            if (!fs.existsSync(path.join(docpath, 'SLIPPS DECSV\\Projects\\' + proj_name))) {
                fs.mkdirSync(path.join(docpath, 'SLIPPS DECSV\\Projects\\' + proj_name), 'utf8');

                var CA3_options = {
                    defaults: {
                        "created-on": null,
                        "source-files": {},
                        "temp-files": {},
                        "kw-per-file": {},
                        "notes": []
                    },
                    name: proj_name,
                    cwd: path.join(docpath, 'SLIPPS DECSV\\Projects\\' + proj_name)
                }
                const CA3_store = new Store(CA3_options);
                logger.info("Created project " + proj_name + "...");
                return true;
            }
            else {
                // Project with same name exists!
                return false;
            }
        }
        else {
            // Projects-folder not present!
            createDocStructure();
            return false;
        }
    }
    else {
        // Application-folder (at Documents) not present!
        createDocStructure();
        return false;
    }
}

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

function openProject() {
    //
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
    logger.transports.file.level = "info";
    logger.transports.console.level = "silly";
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
var updatePath = "http://testing-tyaisurm.c9users.io/update/win32/" + app.getVersion().toString();
autoUpdater.setFeedURL(updatePath);

app.on('will-quit', function () {
    logger.info("application will quit...");
});
app.on('quit', function () {
    logger.info("quitting application...");
});

autoUpdater.on('checking-for-update', function () {
    logger.info("Checking for updates...");


    var options = {
        type: 'info',
        title: "Checking for updates",
        message: app.getVersion().toString() + " is the current version",
        buttons: ["ok"]
    };

    dialog.showMessageBox(options, function (index) {
        //
    });
});
autoUpdater.on('update-available', function () {
    logger.info("Update available!");
    var options = {
        type: 'info',
        title: "Update available",
        message: "Update found to be available",
        detail: "Update will be downloaded automatically if possible",
        buttons: ["ok"]
    };

    dialog.showMessageBox(options, function (index) {
        //
    });
});
autoUpdater.on('error', function (err) {
    logger.error("Error in autoUpdater! " + err.message);
    var options = {
        type: 'info',
        title: "ERRORR!",
        message: "Error has happened in AutoUpdater",
        detail: "This was the Error:\r\n" + err.message,
        buttons: ["ok"]
    };

    dialog.showMessageBox(options, function (index) {
        //
    });
});
autoUpdater.on('update-not-available', function () {
    logger.info("Update not available!");
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

autoUpdater.on('update-downloaded', function (ev, relNot, relNam, relDat, updUrl) {
    logger.info("Update has been downloaded!");
    console.log(ev);
    console.log(relNot);
    console.log(relNam);
    console.log(relDat);
    console.log(updUrl);
    var options = {
        type: 'info',
        title: "Update ready to install",
        message: "Install the downloaded update?",
        detail: "Information:\r\nev: " + ev + "\r\nrelNot: " + relNot + "\r\nrelNam: " + relNam + "\r\nrelDat: " + relDat + "\r\nupdUrl: " + updUrl,
        buttons: ["yes", "no"]
    };

    dialog.showMessageBox(options, function (index) {
        if (index === 0) {
            autoUpdater.quitAndInstall();
        }
        else {
            //nothing
        }
    });
});



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
