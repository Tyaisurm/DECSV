const electron = require('electron');
const app = electron.app;
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
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 780,
        frame: false,
        backgroundColor: '#2e2c29'
    });
    let url = require('url').format({
        protocol: 'file',
        slashes: true,
        pathname: require('path').join(__dirname, 'main.html')
    });
    mainWindow.loadURL(url);

    mainWindow.on('closed', function () {
        mainWindow = null;
    });
});

