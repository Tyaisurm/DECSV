const remote = require('electron').remote;
const BrowserWindow = remote.BrowserWindow;
const dialog = remote.dialog;
const focused_win = BrowserWindow.getFocusedWindow();
const fs = require('fs');
const XLSX = require('xlsx');
const shell = remote.shell;

///////////////////////////////////////////////////////// VIEW UTILITES

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
    //focusWindow(true);
}

window.onblur = function () {
    console.log("blur");
    //focusWindow(false);
}

window.onresize = function () {
    console.log("resize");
    //updateContentStyle();
    //const remote = require('electron').remote;
    //BrowserWindow = remote.BrowserWindow;
    //focused_win = BrowserWindow.getFocusedWindow();

    if (focused_win.isMaximized() && document.getElementById("win-maximize-restore-icon").src !== "../ui_icons/appbar.window.restore.png") {
        document.getElementById("win-maximize-restore-icon").src = "../ui_icons/appbar.window.restore.png";
    }
    else if (!focused_win.isMaximized() && document.getElementById("win-maximize-restore-icon").src !== "../ui_icons/appbar.app.png") {
        document.getElementById("win-maximize-restore-icon").src = "../ui_icons/appbar.app.png";
    }
    else {
        //something
    }
}

//window.onload = function () {
    /*
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
            console.log("TÄMÄ ON VALITTU: " + text);
        }
        else {
            //
        }
    }
    document.onmouseup = document.onkeyup = document.onselectionchange = function () {
        getHighlightedWords();
    };
*/

    // Input "0" = toggle start-view away, replace with section A (and aside) being ONLY ONE visible (Clean beginning of view)
    // Input "1" = toggle sections away, replaced with ONLY start visible (Clean start)
    // Input "2" = toggle about section
    //////
function toggleViewMode(mode) {
    if (mode === 0) {
        $("#aside-section").addClass("is-shown");
        $("#secA").addClass("is-shown");

        $("#secB").removeClass("is-shown");
        $("#secC").removeClass("is-shown");
        $("#secFinal").removeClass("is-shown");
        $("#aboutDiv").removeClass("is-shown");
        $("#startSec").removeClass("is-shown");
    }
    else if (mode === 1) {
        $("#startSec").addClass("is-shown");

        $("#secB").removeClass("is-shown");
        $("#secC").removeClass("is-shown");
        $("#secFinal").removeClass("is-shown");
        $("#aboutDiv").removeClass("is-shown");
        $("#aside-section").removeClass("is-shown");
    }
    else if (mode === 2) {
        $("#aboutDiv").toggleClass("is-shown");
    }
    // Input "11" = toggle A-B
    // Input "12" = toggle B-C
    // Input "13" = toggle C-F
    else if (mode === 11) {
        $("#secA").toggleClass("is-shown");
        $("#secB").toggleClass("is-shown");
    }
    else if (mode === 12) {
        $("#secB").toggleClass("is-shown");
        $("#secC").toggleClass("is-shown");
    }
    else if (mode === 13) {
        $("#secB").toggleClass("is-shown");
        $("#secC").toggleClass("is-shown");
    }
    else {
        //
        logger.error("Error! Invalid parameter to toggleViewMode-function");
    }
}

////////////////////////////////////////////////////////////////////// WINDOW ELEMENT LISTENERS

    document.getElementById("win-minimize-icon").onclick = function () {
        focused_win.minimize();
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
        if (window.noPendingChanges === true) {
            focused_win.close();
        }
        else {
            //"Are you sure you want to quit?" PROMPT GOES HERE!!!
            focused_win.close();
        }
    }

document.getElementById('titlebar-window-about').onclick = function () {
    toggleViewMode(2);
}

/*
document.getElementById('').onclick = function () {
    //
    }
document.getElementById('').onclick = function () {
    //
}
*/

    /* setting listener for open file -button */
    document.getElementById('open-file-prompt').onclick = function () {
        //console.log("OPEN CLICKED");
        var options = {
            title: "Open file",
            //defaultPath: THIS MUST BE SET!
            filters: [
                { name: 'Spreadsheet', extensions: ['csv', 'xls', 'xlsx'] }
            ],
            properties: ['openFile',
                'multiSelections'
            ]
        }
        function callback(fileNames) {
            
            if (fileNames !== undefined){
                //console.log(fileNames);
                //readFile(fileNames); // THIS SHOULD BE TURNED ON IN ORDER TO WORK
                toggleViewMode(0);
                return;
            }
            logger.warn("No file(s) chosen to be opened!");
        }
        dialog.showOpenDialog(options, callback);
    }
    document.getElementById('portal-prompt').onclick = function () {
        //console.log("HUEHHUEHUHE");
        shell.openExternal('https://www.google.com',[], function (err) {
            if (!err) {
                //logger.error(err);

                logger.info("Opened external portal link");
                return;
            }
            logger.error("Failed to open link to the portal!");
        });
    }

document.getElementById('fromA2B').onclick = function () {
    toggleViewMode(11);
    }

document.getElementById('fromB2A').onclick = function () {
    toggleViewMode(11);
}

document.getElementById('fromB2C').onclick = function () {
    toggleViewMode(12);
}

document.getElementById('fromC2B').onclick = function () {
    toggleViewMode(12);
}

document.getElementById('fromC2F').onclick = function () {
    toggleViewMode(13);
}

document.getElementById('fromF2C').onclick = function () {
    toggleViewMode(13);
}

/* NOT NEEDED!!!!!
document.getElementById('save-file-prompt').onclick = function () {
    toggleViewMode();
}
*/

//}

////////////////////////////////////////////////////////// FUNCTIONS FOR READING (from files) AND SHOWING DATA (in webpages), AND SETTING UP UI TEXT (from translations)

/* From here, code will be about fileIO */

    function readFile(files, encoding) {

        /* check file-extension */
        var file = files[0];
        var rest_files = files.pop();
        window.fileQueue = rest_files;

        var file_ext = file.split('.').pop();
        //console.log("################################################");
        //console.log(file_ext);
        //console.log(file);



        /* file has .xlsx or .xls extension */
        if (file_ext === 'xlsx' || file_ext === 'xls') {

            /* xlsx-js */
            try {
                var workbook = XLSX.readFile(file);
            }
            catch (err) {
                logger.error("Unable to open .xlsx or .xls file '"+ file +"'!");
                return;
            }
            var first_sheet_name = workbook.SheetNames[0];
            var worksheet = workbook.Sheets[first_sheet_name];

            var csv_sheet = XLSX.utils.sheet_to_csv(worksheet);
            //console.log("EXCEL TO CSV");
            //console.log(JSON.stringify(csv_sheet));

            /* xlsx-js continue... */
            var newlines = ['\r\n', '\n'];
            var lines = csv_sheet.split(new RegExp(newlines.join('|'), 'g'));

            // Return array of string values, or NULL if CSV string not well formed.
            function CSVtoArray(text) {
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
            };

            var headers = CSVtoArray(lines[0]);
            var contents = CSVtoArray(lines[1]);
            //console.log(headers);
            //console.log(contents);

            var output_data = [];
            output_data[0] = headers;
            output_data[1] = contents;
            //console.log("setting data");
            //set_survey_data(output_data);//setting global variables.. oooh boy...
            window.currentFileContent = output_data;
            //console.log(output_data);

        }

        /* file has .csv extension */
        else if (file_ext === 'csv') {

            /*Node.js fs*/
            fs.readFile(file, 'utf8', function (err, data) {
                if (err) {
                    logger.error("Unable to open .csv file '"+ file +"'!");
                    return;
                }
                //console.log("DATA FROM READFILE");
                //console.log(JSON.stringify(data));
                //console.log(data);

                /* This function takes in raw data from read .csv file and turns it into arrays */
                function parseCSV2Array(csv) {

                    var separators = ['\"\",\"\"', ',\"\"', '\"\"'];
                    var newlines = ['\r\n', '\n'];

                    console.log(typeof (csv));
                    //var lines = csv.split("\n");
                    var lines = csv.split(new RegExp(newlines.join('|'), 'g'));
                    //console.log(JSON.stringify(lines[0]));

                    lines[0] = lines[0].substring(1, lines[0].length - 3);
                    //console.log(JSON.stringify(lines[0]));
                    lines[1] = lines[1].substring(1, lines[1].length - 3);
                    //console.log(JSON.stringify(lines[1]));

                    var headers = lines[0].split(new RegExp(separators.join('|'), 'g'));
                    var contents = lines[1].split(new RegExp(separators.join('|'), 'g'));
                    //console.log(">>>>>>>>>>>>>>>>>>>>>>>>HEADERS");
                    //console.log(headers);
                    //console.log(">>>>>>>>>>>>>>>>>>>>>>>>CONTENTS");
                    //console.log(contents);

                    var result = new Array(2);

                    for (var i = 0; i < 2; i++) {
                        result[i] = [];
                    }

                    //result[0][0] = headers[0];
                    for (var i = 0; i < headers.length; i++) {
                        result[0][i] = headers[i];
                    }
                    for (var i = 0; i < contents.length; i++) {
                        result[1][i] = contents[i];
                    }

                    return result;
                }
                //console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>OMAN TULOSTUS");
                var output_data = parseCSV2Array(data)
                //console.log("setting data");
                //set_survey_data(output_data);//setting global variables.. oooh boy...
                window.currentFileContent = output_data;
                //console.log(output_data);
            });

        }
        else {
            //what lies beyond this land...
        }

        /* This function parses data for textareas that are CURRENTLY USED
                => Will be changed */
        function showQuizData(data) {
            var data_0 = parseQuizArray(data, 0, 1);
            var data_A = parseQuizArray(data, 2, 2);
            var data_B = parseQuizArray(data, 3, 3);
            var data_C = parseQuizArray(data, 4, data[0].length - 1);

            if (data[2] === 'undefined') {
                logger.warn("Third line (keywords) is not available in current file!");
            };


            var text_0 = document.getElementById("text-area-0");
            text_0.innerHTML = data_0;
            var text_A = document.getElementById("text-area-A");
            text_A.innerHTML = data_A;
            var text_B = document.getElementById("text-area-B");
            text_B.innerHTML = data_B;
            var text_C = document.getElementById("text-area-C");
            text_C.innerHTML = data_C;
        }

        /* This function makes it so that the text will look sorted in textarea */
        function parseQuizArray(data, fromIX, toIX) {

            var res = "";
            for (var i = fromIX; i <= toIX; i++) {
                res = res + data[0][i] + "\n>>>";
                res = res + data[1][i] + "\n\n";
            }
            return res;
        }

                //showQuizData(output_data);

        //var HERE YOU TAKE DATA FROM WINDOW-NAMESPACE, AND SHOW IT IN THE APPLICATION RIGHTLY FORMATTED!!!

    }


/* THIS IS SETTING UP UI TRANSLATION */

function setupTranslations() {
    /* Start page */
    $("#open-file-prompt-text").text(i18n.__('open-files'));
    $("#portal-prompt-text").text(i18n.__('open-portal'));

    /* Section A */
    $("#fromA2Btext").text(i18n.__('A2B-prompt'));

    /* Section B */
    //

    /* Section C */
    //

    /* Final section */
    //

    /* About */
    //

    // OTHERS ->>>

    logger.info("Setting up translations finished!");
    }

setupTranslations();