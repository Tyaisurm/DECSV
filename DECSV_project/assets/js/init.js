const remote = require('electron').remote;
const dialog = remote.dialog;
const firstWindow = remote.getCurrentWindow();
const fs = require('fs');
const XLSX = require('xlsx');
const http = require("http");
const shell = remote.shell;
const autoUpdater = remote.autoUpdater;

/* FAST DEBUG - toggles everything that is not titlebar */
const enable_onclicks = false;
logger.debug("Running init...");

///////////////////////////////////////////////////////// VIEW UTILITES
if (firstWindow.isMaximized()) { document.getElementById("win-maximize-restore-icon").src = "../ui_icons/appbar.window.restore.png"; } // just to make sure when opening 
firstWindow.on('focus', function () { $("html").css("opacity", "1");});
firstWindow.on('blur', function () { $("html").css("opacity", "0.5");});
firstWindow.on('maximize', function () { document.getElementById("win-maximize-restore-icon").src = "../ui_icons/appbar.window.restore.png";});
firstWindow.on('unmaximize', function () { document.getElementById("win-maximize-restore-icon").src = "../ui_icons/appbar.app.png"; });

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
    logger.debug("toggled viewing mode:"+mode);
    if (mode === 0) {
        $("#secA").addClass("is-shown");

        $("#keywordsSec").removeClass("is-shown");
        $("#secB").removeClass("is-shown");
        $("#secC").removeClass("is-shown");
        $("#secFinal").removeClass("is-shown");
        $("#aboutDiv").removeClass("is-shown");
        $("#startSec").removeClass("is-shown");
    }
    else if (mode === 1) {
        $("#startSec").addClass("is-shown");

        $("#keywordsSec").removeClass("is-shown");
        $("#secB").removeClass("is-shown");
        $("#secC").removeClass("is-shown");
        $("#secFinal").removeClass("is-shown");
        $("#aboutDiv").removeClass("is-shown");
    }
    else if (mode === 2) {
        $("#aboutDiv").toggleClass("is-shown");
    }
    // Input "11" = toggle A-B
    // Input "12" = toggle B-C
    // Input "13" = toggle C-K
    // Input "14" = toggle K-F
    else if (mode === 11) {
        $("#secA").toggleClass("is-shown");
        $("#secB").toggleClass("is-shown");
    }
    else if (mode === 12) {
        $("#secB").toggleClass("is-shown");
        $("#secC").toggleClass("is-shown");
    }
    else if (mode === 13) {
        $("#secC").toggleClass("is-shown");
        $("#keywordsSec").toggleClass("is-shown");
    }
    else if (mode === 14) {
        $("#keywordsSec").toggleClass("is-shown");
        $("#secFinal").toggleClass("is-shown");
    }
    else {
        // If you end up here, blame the incompetent programmer
        logger.error("Error! Invalid parameter to toggleViewMode-function");
    }
}

function continueQueue() {
    var files_left = window.fileQueue.length;
    if (files_left >= 1) {
        toggleViewMode(0);
        clearElements();
        readFile(window.fileQueue);
    }
    else if (files_left === 0) {

        var options = {
            type: 'info',
            title: window.i18n.__('queue-empty-conf-title'),
            message: window.i18n.__('queue-empty-conf-cont'),
            buttons: [window.i18n.__('conf-ok')]
        };

        dialog.showMessageBox(firstWindow, options, function (index) {
            clearElements();
            toggleViewMode(1);
        });
    }
    else {
        logger.error("Unable to continue into the next file in queue!");
    }
}

function clearElements() {
    $("#secAcontent").empty();
    $("#secBcontent").empty();
    $("#aside-key-list").empty();
    $("#final-censoredwords-list").empty();

    for (var i = 1; i < 15; i++) {
        var name = "secC-Q"+i+"-cont";
        $(name).empty();
    }

    $("#aside-subID-value").empty();
    $("#aside-subTIME-value").empty();
}

////////////////////////////////////////////////////////////////////// WINDOW ELEMENT LISTENERS

    document.getElementById("win-minimize-icon").onclick = function () {
        firstWindow.minimize();
    }
    document.getElementById("win-maximize-restore-icon").onclick = function () {
        if (firstWindow.isMaximized()) {
            firstWindow.unmaximize();
        }
        else {
            firstWindow.maximize();
        }
    }

    if (enable_onclicks){
    document.getElementById("update-prompt").onclick = function () {
        autoUpdater.checkForUpdates();
        }
     }

    document.getElementById("win-close-icon").onclick = function () {
        firstWindow.close();
    }


document.getElementById('win-about-icon').onclick = function () {
    // HERE YOU OPEN NEW WINDOW
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
if (enable_onclicks) {
    document.getElementById('open-file-prompt').onclick = function () {
        //console.log("OPEN CLICKED");
        var options = {
            title: window.i18n.__('open-file-prompt-window-title'),
            //defaultPath: THIS MUST BE SET!
            filters: [
                { name: 'Spreadsheet', extensions: ['csv', 'xls', 'xlsx'] }
            ],
            properties: ['openFile',
                'multiSelections'
            ]
        }
        function callback(fileNames) {

            if (fileNames !== undefined) {
                //console.log(fileNames);
                readFile(fileNames);
                toggleViewMode(0);
                return;
            }
            logger.warn("No file(s) chosen to be opened!");
        }
        dialog.showOpenDialog(firstWindow, options, callback);
    }
}
if (enable_onclicks) {
    document.getElementById('portal-prompt').onclick = function () {
        //console.log("HUEHHUEHUHE");
        shell.openExternal('https://www.google.com', [], function (err) {
            if (!err) {
                //logger.error(err);

                logger.info("Opened external portal link");
                return;
            }
            logger.error("Failed to open link to the portal!");
        });
    }
}

/* setting listener for save file -button. This hanles both saving file, and moving to next file in queue */
if (enable_onclicks) {
    document.getElementById("save-file-prompt").onclick = function () {
        //console.log("SAVE CLICKED");
        var options = {
            title: window.i18n.__('save-prompt-window-title'),
            //defaultPath: THIS MUST BE SET
            filters: [
                { name: 'CSV spreadsheet', extensions: ['csv'] }
            ]
        }
        function callback(fileName) {
            if (fileName !== undefined) {
                var encoding = "utf8";
                removeCensored();
                var content = parse_content2Array();
                //console.log(content);
                writeFile_csv(fileName, content, encoding);
                continueQueue();
                return;
            }
            logger.warn("No file chosen to be saved!");

        }
        dialog.showSaveDialog(firstWindow, options, callback);
    }
}

if (enable_onclicks) {
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

    document.getElementById('fromC2K').onclick = function () {
        toggleViewMode(13);
    }

    document.getElementById('fromK2C').onclick = function () {
        toggleViewMode(13);
    }

    document.getElementById('fromF2K').onclick = function () {
        toggleViewMode(14);
    }

    document.getElementById('fromK2F').onclick = function () {
        toggleViewMode(14);
    }
}


//}

////////////////////////////////////////////////////////// FUNCTIONS FOR READING (from files) AND SHOWING DATA (in webpages), AND SETTING UP UI TEXT (from translations)

function updateFileQueue(files) {
    //console.log(files);
    var filename = null;
    if (files.length > 0) {
        filename = files.pop();
        window.fileQueue = files;
        //console.log("ASD 1");
        $("#file-queue-counter-value").text(window.fileQueue.length);
    }
    else {
        //console.log("ASD 2");
        $("#file-queue-counter-value").text(window.fileQueue.length);
    }
    return filename;
}

/* Turns .word with .censored class into " **** " */
function removeCensored() {
    //Section A
    $("#secAcontent .censored").each(function (i) {
        $(this).text("*****");
    });
    //Section B
    $("#secBcontent .censored").each(function (i) {
        $(this).text("*****");
    });
    //Section C

    $("#secCtext-content .censored").each(function (i) {
        $(this).text("*****");
    });

}

/* From here, code will be about fileIO */

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
}

    function readFile(files) { //does this need this? , encoding

        /* check file-extension */
        var file = updateFileQueue(files);
        var output_data = [];

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

            var headers = CSVtoArray(lines[0]);
            var contents = CSVtoArray(lines[1]);

            var keys = null;

            if (lines[2].length !== 0){
                keys = CSVtoArray(lines[2]);
                output_data[2] = keys;
            }
            //console.log(headers);
            //console.log(contents);

            output_data[0] = headers;
            output_data[1] = contents;
            //console.log("setting data");
            window.currentFileContent = output_data;
            
            keys = showQuizData(output_data);
            setupKeywordSelect(output_data[1].length, keys);

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
                    //console.log("RAW CSV DATA IN");
                    //console.log(csv);
                    var separators = ['\"\",\"\"', ',\"\"', '\"\"'];
                    var newlines = ['\r\n', '\n'];

                    //console.log(typeof (csv));
                    //var lines = csv.split("\n");
                    var lines = csv.split(new RegExp(newlines.join('|'), 'g'));
                    //console.log(JSON.stringify(lines[0]));

                    lines[0] = lines[0].substring(1, lines[0].length - 3);
                    //console.log(JSON.stringify(lines[0]));
                    lines[1] = lines[1].substring(1, lines[1].length - 3);
                    //console.log(JSON.stringify(lines[1]));
                    if (lines[2].length !== 0) {
                        lines[2] = lines[2].substring(1, lines[2].length - 3);
                    }

                    var headers = lines[0].split(new RegExp(separators.join('|'), 'g'));
                    var contents = lines[1].split(new RegExp(separators.join('|'), 'g'));
                    if (lines[2].length !== 0) {
                        var keys = lines[2].split(new RegExp(separators.join('|'), 'g'));
                    }
                    //console.log(">>>>>>>>>>>>>>>>>>>>>>>>HEADERS");
                    //console.log(headers);
                    //console.log(">>>>>>>>>>>>>>>>>>>>>>>>CONTENTS");
                    //console.log(contents);

                    var result = new Array(); //was Array(2)
                    var i = 0;
                    for (i = 0; i < 2; i++) {
                        result[i] = [];
                    }
                    if (lines[2].length !== 0) {
                        result[2] = [];
                    }

                    //result[0][0] = headers[0];
                    for (i = 0; i < headers.length; i++) {
                        result[0][i] = headers[i];
                    }
                    for (i = 0; i < contents.length; i++) {
                        result[1][i] = contents[i];
                    }
                    if (lines[2].length !== 0) {
                        for (i = 0; i < keys.length; i++) {
                            result[2][i] = keys[i];
                        }
                    }

                    return result;
                }
                //console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>OMAN TULOSTUS");
                var output_data = parseCSV2Array(data);
                //console.log("setting data");
                window.currentFileContent = output_data;
                var keys = null;
                keys = showQuizData(output_data);
                setupKeywordSelect(output_data[1].length, keys);
            });

        }
        else {
            //what lies beyond this land...
        }

        /* This function parses data for textareas that are CURRENTLY USED
                => Will be changed */
        function showQuizData(data) {
            //console.log("INSIDE SHOW QUIZ DATA");
            showCsecData(data); //, 4, data[0].length - 1);
            var result = [];
            if (data[2] === undefined) {
                //console.log(data[2]);
                logger.warn("Third line (keywords) is not available in current file!");
            }
            else {
                result = data[2];
            }

            var data_A = data[1][2];
            var data_B = data[1][3];
            $("#secAcontent").text(data_A);
            $("#secBcontent").text(data_B);

            $("#aside-subID-value").text(data[1][0]);
            $("#aside-subTIME-value").text(data[1][1]);

            return result;
        }

        /* This function puts C section answers into right places */
        function showCsecData(section_data) {
            //console.log("#############");
            var line = 1;
            for (var i = 4; i < section_data[1].length - 1; i++){
                //console.log(section_data[1][i]);
                var lineId = "#secC-Q" + line + "-cont";
                $(lineId).text(section_data[1][i]);
                line++;
            }
        }

        /* This function shows pre-selected words from the file */
        function loadKeyWords(keys) {
            for (var i = 0; i < keys.length; i++){
                var to_appended = '<li class="list-keys-elem">' + keys[i] + '</li>';
                $("#aside-key-list").append(to_appended);
                paintEmAll(keys[i], 0);
            }
            updateKeywordsList();
        }

        function updateKeywordsList() {
            var elements = [];
            $("#aside-key-list li").each(function (i) {
                elements.push($(this).text());
            });
            elements.sort();
            $("#aside-key-list").empty();

            for (var i = 0; i < elements.length; i++) {
                var to_appended = '<li class="list-keys-elem">' + elements[i] + '</li>';
                $("#aside-key-list").append(to_appended);
            }
        }

        function updateCensoredList() {
            $("#final-censoredwords-list").empty();
            //Section A
            $("#secAcontent .censored").each(function (i) {
                var to_appended = '<li class="list-censored-elem">' + $(this).text() + '</li>';
                $("#final-censoredwords-list").append(to_appended);
            });
            //Section B
            $("#secBcontent .censored").each(function (i) {
                var to_appended = '<li class="list-censored-elem">' + $(this).text() + '</li>';
                $("#final-censoredwords-list").append(to_appended);
            });
            //Section C

            $("#secCtext-content .censored").each(function (i) {
                var to_appended = '<li class="list-censored-elem">' + $(this).text() + '</li>';
                $("#final-censoredwords-list").append(to_appended);
            });
        }

        /* True if is found, false otherwise */
        function testKeywordList(word) {

            var found = false;

            $("#aside-key-list li").each(function (i) {
                //var index = $(this).index();
                var text_cont = $(this).text();
                if (text_cont === word) {
                    found = true;
                }
            });
            return found;
        }

        // mode 0 = paint all words as "keys"; mode 1 = remove "keys" marks from words
        function paintEmAll(word, mode) {
            //Section A
            $("#secAcontent .word").each(function (i) {
                var current_w = $(this).text();
                if ((current_w.toLowerCase() === word.toLowerCase()) && !($(this).hasClass("censored"))) {
                    if (mode === 0) { $(this).addClass("underlined"); }
                    if (mode === 1) { $(this).removeClass("underlined"); }
                }
            });
            //Section B
            $("#secBcontent .word").each(function (i) {
                var current_w = $(this).text();
                if ((current_w.toLowerCase() === word.toLowerCase()) && !($(this).hasClass("censored"))) {
                    if (mode === 0) { $(this).addClass("underlined"); }
                    if (mode === 1) { $(this).removeClass("underlined"); }
                }
            });
            //Section C

            $("#secCtext-content .word").each(function (i) {
                var current_w = $(this).text();
                if ((current_w.toLowerCase() === word.toLowerCase()) && !($(this).hasClass("censored"))) {
                    if (mode === 0) { $(this).addClass("underlined"); }
                    if (mode === 1) { $(this).removeClass("underlined"); }
                }
            });

        }
        
        // SETTING UP SELECTING KEYWORDS
        function setupKeywordSelect(arr_l, keys_arr) {
            $("#secAcontent").html(function (index, oldHtml) {
                return oldHtml.replace(/\b(\w+?)\b/g, '<span class="word">$1</span>');
            });
            $("#secBcontent").html(function (index, oldHtml) {
                return oldHtml.replace(/\b(\w+?)\b/g, '<span class="word">$1</span>');
            });
            for (var i = 1; i < (arr_l - 2); i++) {
                var lineId = "#secC-Q" + i + "-cont";
                //console.log(lineId);
                $(lineId).html(function (index, oldHtml) {
                    return oldHtml.replace(/\b(\w+?)\b/g, '<span class="word">$1</span>');
                });
            }

            $(".word").on("click", function () {
                //console.log($("#secBcontent").text());
                var clicked = "";
                if ($(this).hasClass("underlined")) {
                    $(this).toggleClass("underlined");
                    $(this).toggleClass("censored");
                    updateCensoredList();
                    paintEmAll($(this).text(), 1);
                    clicked = $(this).text().toLowerCase();
                    $("#aside-key-list li").each(function (i) {
                        //var index = $(this).index();

                        var text_cont = $(this).text();
                        if (text_cont === clicked) {
                            $(this).remove();
                        }

                    });

                }
                else if ($(this).hasClass("censored")) {
                    $(this).removeClass("censored");
                    updateCensoredList();
                    //go through list that is at the side->
                    if (testKeywordList($(this).text())) { paintEmAll($(this).text(), 0); }
                }
                else {
                    $(this).addClass("underlined");
                    paintEmAll($(this).text(), 0);
                    clicked = $(this).text().toLowerCase();
                    var found = testKeywordList(clicked);
                    console.log(found);
                    console.log(clicked);


                    if (!found) {
                        var to_appended = '<li class="list-keys-elem">' + clicked + '</li>';
                        $("#aside-key-list").append(to_appended);
                        updateKeywordsList();
                    }
                }
            });
            if (keys_arr !== null) {
                loadKeyWords(keys_arr);
            }
        }
    }


/* THIS IS SETTING UP UI TRANSLATION */

function setupTranslations() {
    logger.info("Loading translations into UI...");
    /* Start page */
    $("#open-file-prompt-text").text(i18n.__('open-files'));
    $("#portal-prompt-text").text(i18n.__('open-portal'));
    $("#update-prompt-text").text(i18n.__('update-prompt'));

    /* Section A */
    $("#secAtitle").text(i18n.__('secAtitle'));
    $("#fromA2Btext").text(i18n.__('A2B-prompt'));
    $("#secAquestion").text(i18n.__('secA-Q'));

    /* Section B */
    $("#secBtitle").text(i18n.__('secBtitle'));
    $("#fromB2Atext").text(i18n.__('B2A-prompt'));
    $("#fromB2Ctext").text(i18n.__('B2C-prompt'));
    $("#secBquestion").text(i18n.__('secB-Q'));

    /* Section C */
    $("#secCtitle").text(i18n.__('secCtitle'));
    $("#fromC2Btext").text(i18n.__('C2B-prompt'));
    $("#fromC2Ktext").text(i18n.__('C2K-prompt'));

    /* Tagging section */
    $("#keywordsSecTitle").text(i18n.__('secKtitle'));
    $("#fromK2Ctext").text(i18n.__('K2C-prompt'));
    $("#fromK2Ftext").text(i18n.__('K2F-prompt'));

    for (var i = 1; i < 15; i++){
        var name = "#secC-Q" + i + "-t";
        var translation = "secC-Q-" + i;
        $(name).text(i18n.__(translation));
    }

    /* Final section */
    $("#secFtitle").text(i18n.__('secFtitle'));
    $("#fromF2Ktext").text(i18n.__('F2K-prompt'));
    $("#fromF2Savetext").text(i18n.__('save-next-prompt'));
    $("#final-censoredwords-title").text(i18n.__('current-censored'));

    /* About */
    //

    /* Titlebar */
    $("#file-queue-counter-text").text(i18n.__('fileQtitle'));
    $("#aside-subID-title").text(i18n.__('subID'));
    $("#aside-subTIME-title").text(i18n.__('subTIME'));
    $("#aside-chosenkeys-title").text(i18n.__('current-keys'));
    $("#update-prompt-text").text(i18n.__('update-prompt'));

    logger.info("Setting up translations finished!");
    }

setupTranslations();

//////////////////////////////////////////////////////////// FUNCTIONS FOR WRITING DATA INTO FILES

/* This function takes in data that is in arrays, and then parses and writes it
into new .csv files */
function writeFile_csv(file, dataArray, encoding) {
    //writing... Array[0-1][0-x]

    //console.log("Parsing content for saving...");
    logger.info("Starting to parse array into proper csv-format...");

    var temp = "";

    //parse arrays to be like .csv file's content
    for (var i = 0; i < dataArray.length; i++) {
        if ((dataArray[2].length !== 0) && (i === 2)) {//
            temp = temp + "\"\"";//
        }//
        else {//
            temp = temp + "\"";
        }//
        //console.log(i);
        //console.log(temp);
        for (var j = 0; j < dataArray[i].length; j++) {
            //console.log(j);
            //console.log(temp);
            if (j === 0) {
                if ((dataArray[2].length !== 0) && (i === 2)){//
                    temp = temp + dataArray[i][j] + "\"\"";//
                }//
                else {//
                    temp = temp + dataArray[i][j];
                }//

            }
            else {
                var input = dataArray[i][j];
                temp = temp + ",\"\"" + input + "\"\"";
            }
        }
        temp = temp + "\"\r\n";
    }

    //testlogs...
    //console.log(file);
    //console.log(encoding);
    //console.log(temp);
    content = temp;

    //overwriting if same name at the moment!... naah. fs-dialog prompts about this before we even GET here :P
    fs.writeFile(file, content, encoding, function (msg) {
        if (!msg) {
            //console.log(msg);
            //console.log("The file has been successfully saved");
            logger.info("File successfully saved!");
            return;
        }

        logger.error("Error while trying to save a new file!");
    });
}

// make array that will be then used to make new csv file
function parse_content2Array() {

    var orig_data = window.currentFileContent;

    var sectionA_text = $("#secAcontent").text();
    var sectionB_text = $("#secBcontent").text();
    var sectionC_arr;
    var keywords = [];
    $("#aside-key-list li").each(function (i) {
        keywords.push($(this).text());
    });

    $("#secC-Q1-cont___secC-Q14-cont").each(function (i) {
        keywords.push($(this).text());
    });

    var finalData = orig_data;
    finalData[1][2] = sectionA_text;
    finalData[1][3] = sectionB_text;

    for (var i = 1; i < 15; i++){

        finalData[1][i+3] = $("#secC-Q"+i+"-cont").text();
    }

    finalData[2] = keywords;

    return finalData;
}