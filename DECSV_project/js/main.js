function updateImageUrl(image_id, new_image_url) {
    var image = document.getElementById(image_id);
    if (image)
        image.src = new_image_url;
}

function createImage(image_id, image_url) {
    var image = document.createElement("img");
    image.setAttribute("id", image_id);
    image.src = image_url;
    return image;
}

window.onfocus = function () {
    console.log("focus");
    //focusWindow(true);
}

window.onblur = function () {
    console.log("blur");
    //focusWindow(false);
}

window.onresize = function () {
    console.log("resize");
    //updateContentStyle();
    const remote = require('electron').remote;
    const BrowserWindow = remote.BrowserWindow;
    const focused_win = BrowserWindow.getFocusedWindow();

    if (focused_win.isMaximized() && document.getElementById("win-maximize-restore-icon").src != "./assets/appbar.window.restore.png") {
        document.getElementById("win-maximize-restore-icon").src = "./assets/appbar.window.restore.png";
    }
    else if (!focused_win.isMaximized() && document.getElementById("win-maximize-restore-icon").src != "./assets/appbar.app.png") {
        document.getElementById("win-maximize-restore-icon").src = "./assets/appbar.app.png";
    }
    else {
        //
    }
}

window.onload = function () {
    console.log("window loaded");

    const remote = require('electron').remote;
    const BrowserWindow = remote.BrowserWindow;
    const focused_win = BrowserWindow.getFocusedWindow();

    document.getElementById("win-minimize-icon").onclick = function () {
        focused_win.minimize();
        focused_win
    }
    document.getElementById("win-maximize-restore-icon").onclick = function () {
        if (focused_win.isMaximized()) {
            focused_win.unmaximize();
        }
        else {
            focused_win.maximize();
        }
    }
    document.getElementById("win-close-icon").onclick = function () {
        focused_win.close();
    }
}
