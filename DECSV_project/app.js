const electron = require('electron');
const app = electron.app;
const logger = require('electron-log');
const BrowserWindow = electron.BrowserWindow; 
const path = require('path');
const url = require('url');
const fs = require('fs');
let mainWindow = null;

function createWin() {
    mainWindow = new BrowserWindow({
        width: 900,
        height: 700,
        frame: false,
        backgroundColor: '#999999'
    });

    let win_url = url.format({
        protocol: 'file',
        slashes: true,
        pathname: path.join(__dirname, './assets/html/index.html')
    });
    mainWindow.loadURL(win_url);

    //toggle dev tools when window opens
    mainWindow.webContents.openDevTools();

    mainWindow.on('closed', function () {
        mainWindow = null;
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
        /*

        fs.access(asdfile, (err) => {
            if (!err) {
                console.log("file exists!!");

                return;
            }
            //console.log("file does not exists!");
        });

        */

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

app.on('will-quit', function () {
    logger.info("quitting application...");
});
