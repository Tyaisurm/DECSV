const electron = require('electron');
const app = electron.app;
const logger = require('electron-log');
const BrowserWindow = electron.BrowserWindow; 
const path = require('path');
const url = require('url');
const fs = require('fs');
const autoUpdater = electron.autoUpdater;
const dialog = electron.dialog;
let openWindow = null;
let mainWindow = null;

if (require('electron-squirrel-startup')) return;

function createWin() {
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

    mainWindow = new BrowserWindow({
        width: 1200,
        height: 840,
        frame: false,
        backgroundColor: '#dadada',
        show: false
    });

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
    mainWindow.on('closed', function () {
        mainWindow = null;
    });
    openWindow.on('closed', function () {
        openWindow = null;
    });
}

app.on('window-all-closed', function () {
    logger.info("all windows closed");
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform != 'darwin') {
        app.quit();
    }
});

app.on('ready', function () {
    logger.transports.file.level = "info";
    logger.transports.console.level = "silly";
    if (process.platform == 'win32') {
        //
    }
    else if (process.platform == 'linux') {
        //
    }
    else if (process.platform == 'darwin'){
        //
    }
    else {
        //well then, you are fckd :x
    }
    logger.info('app ready');
    
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
var updatePath = "http://testing-tyaisurm.c9users.io/update/win64/" + app.getVersion().toString();
autoUpdater.setFeedURL(updatePath);

app.on('will-quit', function () {
    logger.info("quitting application...");
});

autoUpdater.on('checking-for-update', function () {
    logger.info("Checking for updates...");


    var options = {
        type: 'info',
        title: "CHECKING!!!!",
        message: app.getVersion().toString(),
        buttons: ["Yes :)", "Naah :c"]
    };

    dialog.showMessageBox(options, function (index) {
        if (index === 0) {
           //
        }
        else {
            //nothing
        }
    });
});
autoUpdater.on('update-available', function () {
    logger.info("Update available!");
    var options = {
        type: 'info',
        title: "UPDATE AVAILABLE :D",
        message: "DOWNLOADING!",
        buttons: ["Yes :)", "Naah :c"]
    };

    dialog.showMessageBox(options, function (index) {
        if (index === 0) {
           //
        }
        else {
            //nothing
        }
    });
});
autoUpdater.on('error', function (err) {
    logger.error("Error in autoUpdater!");
    logger.error(err.message);
    var options = {
        type: 'info',
        title: "ERRORR!!!!",
        message: updatePath + "##################" + err.toString(),
        buttons: ["Yes :)", "Naah :c"]
    };

    dialog.showMessageBox(options, function (index) {
        if (index === 0) {
            //
        }
        else {
            //nothing
        }
    });
});
autoUpdater.on('update-not-available', function () {
    logger.info("Update NOT available!");
    var options = {
        type: 'info',
        title: "NO UPDATE",
        message: "UPDATE NO ACAILABLE",
        buttons: ["Yes :)", "Naah :c"]
    };

    dialog.showMessageBox(options, function (index) {
        if (index === 0) {
            
        }
        else {
            //nothing
        }
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
        title: "UPDATE READY",
        message: "INSTALL?",
        buttons: ["Yes :)", "Naah :c"]
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