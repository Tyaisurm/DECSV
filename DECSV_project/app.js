var electron = require('electron');
var app = electron.app;
var BrowserWindow = electron.BrowserWindow;
var mainWindow = null;
console.log('Hello console!');
app.on('window-all-closed', function () {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform != 'darwin') {
        app.quit();
    }
});
app.on('ready', function () {
    console.log("ready!");
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 780,
        frame: false,
        backgroundColor: '#999999'
    });
    console.log("made new window!!");
    var url = require('url').format({
        protocol: 'file',
        slashes: true,
        pathname: require('path').join(__dirname, 'main.html')
    });
    mainWindow.loadURL(url);
    mainWindow.webContents.openDevTools();
    mainWindow.on('closed', function () {
        mainWindow = null;
    });
});
//# sourceMappingURL=app.js.map