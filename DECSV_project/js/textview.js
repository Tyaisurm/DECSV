const remote = require('electron').remote;

const dialog = remote.dialog;
const fs = require('fs');

function startTV() {
    console.log("TEXTVIEW START");
    document.getElementById('open-file-icon').onclick = function () {
        console.log("OPEN CLICKED");

        var options = {
            title: "Open file",
            //defaultPath:
            filters: [
                { name: 'Spreadsheet', extensions: ['csv','xls', 'xlsx'] }
            ],
            properties: ['openFile']

        }
        function callback(fileNames) {
            readFile(fileNames);
        }
        dialog.showOpenDialog(options, callback);
    }

    document.getElementById("save-file-icon").onclick = function () {
        console.log("SAVE CLICKED");
        var options = {
            title: "Save file",
            //defaultPath:
            filters: [
                { name: 'CSV spreadsheet', extensions: ['csv'] }
            ]
        }
        function callback(fileName) {
            if (fileName === undefined) {
                alert("You didn't save the file!");//POISTETTAVA
                return;
            }
            var content = "testi_content_on_tässä_:D"//document.getElementById('content').value;
            var encoding = "utf8";

            writeFile(fileName, content, encoding);
        }
        dialog.showSaveDialog(options, callback);
    }
}

function readFile(files, encoding) {
    //reading...
}

function writeFile(file, content, encoding) {
    //writing...

    //ylikirjoitetaan tarkistamatta
    fs.writeFile(file, content, encoding, function (msg) {
        if (msg) {
            console.log(msg);
            alert("The file has been successfully saved");
        }
    });
}
