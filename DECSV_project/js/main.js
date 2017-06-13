/* This is the main js-file. most of the window/style related stuff happens here */

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

function focusWindow(input) {
    if (input) {
        //do stuff
    }
    else {
        //do stuff
    }
}

function updateContentStyle() {
    //modify content style depending on window size
}

window.onfocus = function () {
    console.log("focus");
    focusWindow(true);
}

window.onblur = function () {
    console.log("blur");
    focusWindow(false);
}

window.onresize = function () {
    console.log("resize");
    //updateContentStyle();
    const remote = require('electron').remote;
    const BrowserWindow = remote.BrowserWindow;
    const focused_win = BrowserWindow.getFocusedWindow();

    if (focused_win.isMaximized() && document.getElementById("win-maximize-restore-icon").src !== "./assets/appbar.window.restore.png") {
        document.getElementById("win-maximize-restore-icon").src = "./assets/appbar.window.restore.png";
    }
    else if (!focused_win.isMaximized() && document.getElementById("win-maximize-restore-icon").src !== "./assets/appbar.app.png") {
        document.getElementById("win-maximize-restore-icon").src = "./assets/appbar.app.png";
    }
    else {
        //something
    }
}

window.onload = function () {

    //////////////////////////////////////////////////////////////////////
    function getHighlightedWords() {
        var text = "";
        var activeEl = document.activeElement;
        var activeElTagName = activeEl ? activeEl.tagName.toLowerCase() : null;
        if (
            (activeElTagName == "textarea") || (activeElTagName == "input" &&
                /^(?:text|search|password|tel|url)$/i.test(activeEl.type)) &&
            (typeof activeEl.selectionStart == "number")
        ) {
            text = activeEl.value.slice(activeEl.selectionStart, activeEl.selectionEnd);
        } else if (window.getSelection) {
            text = window.getSelection().toString();
        }
        if (text.length !== 0) {
            console.log("TÄMÄ ON VALITTU: "+text);
        }
        else {
            //
        }
    }
    document.onmouseup = document.onkeyup = document.onselectionchange = function () {
        getHighlightedWords();
    };
    //////////////////////////////////////////////////////////////////////
    startTV();

    console.log("MAIN ONLOAD");

    const remote = require('electron').remote;
    const BrowserWindow = remote.BrowserWindow;
    const focused_win = BrowserWindow.getFocusedWindow();

    document.getElementById("win-minimize-icon").onclick = function () {
        focused_win.minimize();
    }
    document.getElementById("win-maximize-restore-icon").onclick = function () {
        if (focused_win.isMaximized()) {
            console.log("ASDASDSASADSADSAD");
            focused_win.unmaximize();
        }
        else {
            console.log("ASDASDSASADSADSAD");
            focused_win.maximize();
        }
    }
    document.getElementById("win-close-icon").onclick = function () {
        console.log("ASDASDSASADSADSAD");
        focused_win.close();
    }
}
