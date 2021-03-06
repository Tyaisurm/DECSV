﻿const electron = require('electron');
const remote = electron.remote;
const fs = require('fs');
const path = require('path');
const pars050 = require(path.join(__dirname, './parsing/0.5.0.js'));
const pars100 = require(path.join(__dirname, './parsing/1.0.0.js'));

const logger = require("electron-log");

function CSVtoArrayBOS(strData, strDelimiter) {
    logger.debug("CSVtoArrayBOS");
    // Check to see if the delimiter is defined. If not,
    // then default to comma.
    strDelimiter = (strDelimiter || ";");

    // Create a regular expression to parse the CSV values.
    var objPattern = new RegExp(
        (
            // Delimiters.
            "(\\" + strDelimiter + "|\\r?\\n|\\r|^)" +

            // Quoted fields.
            "(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +

            // Standard fields.
            "([^\"\\" + strDelimiter + "\\r\\n]*))"
        ),
        "gi"
    );// here is a bug in the regex: "([^\"\\" should be "([^\\". 


    // Create an array to hold our data. Give the array
    // a default empty first row.
    var arrData = [[]];

    // Create an array to hold our individual pattern
    // matching groups.
    var arrMatches = null;


    // Keep looping over the regular expression matches
    // until we can no longer find a match.
    while (arrMatches = objPattern.exec(strData)) {

        // Get the delimiter that was found.
        var strMatchedDelimiter = arrMatches[1];

        // Check to see if the given delimiter has a length
        // (is not the start of string) and if it matches
        // field delimiter. If id does not, then we know
        // that this delimiter is a row delimiter.
        if (
            strMatchedDelimiter.length &&
            strMatchedDelimiter !== strDelimiter
        ) {

            // Since we have reached a new row of data,
            // add an empty row to our data array.
            arrData.push([]);

        }

        var strMatchedValue;

        // Now that we have our delimiter out of the way,
        // let's check to see which kind of value we
        // captured (quoted or unquoted).
        if (arrMatches[2]) {

            // We found a quoted value. When we capture
            // this value, unescape any double quotes.
            strMatchedValue = arrMatches[2].replace(
                new RegExp("\"\"", "g"),
                "\""
            );

        } else {

            // We found a non-quoted value.
            strMatchedValue = arrMatches[3];

        }


        // Now that we have our value string, let's add
        // it to the data array.
        arrData[arrData.length - 1].push(strMatchedValue);
    }

    // Return the parsed data.
    return (arrData);
}


/* This function takes in raw data from read .csv file and turns it into arrays (ONLY CSV FORMATS!!!) */
function CSVtoArrayWebpro(csv, separator = ";") {
    logger.debug("parseCSV2Array");
    //logger.debug(csv);
    //console.log("RAW CSV DATA IN");
    //console.log(csv);

    var separators = ['\"\",\"\"', ',\"\"', '\"\"'];
    //var separators = ['\";\"', '\";', ]; // the second " at the start and the end of the line need to be removed seperately (this->" something ";" something 2 "<-this)
    var newlines = ['\r\n', '\n']; //<- so that no weird stuff happens... hopefully

    //console.log(typeof (csv));
    //var lines = csv.split("\n");
    var lines = csv.split(new RegExp(newlines.join('|'), 'g'));
    //console.log(JSON.stringify(lines[0]));


    //var temptemp = CSVtoArray(csv);
    //mainWindow.webContents.send("output-to-chrome-console", temptemp);
    //mainWindow.webContents.send("output-to-chrome-console", lines);

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

/* for excel files */
function CSVtoArrayExcel(text) {
    logger.debug("CSVtoArray");
    //logger.debug(text);
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

// NOT DONE NEEDSTOBECHANGED
/* check if the csv form is valid, and call proper function based on given tool name */
function validateAndParseCSV(csv_data = null, lert_tool = null, lert_delimiter = null) {
    logger.debug("validateAndParseCSV");
    logger.info("Validating and parsing CSV string...");
    // check incoming values....
    if (csv_data === null || lert_tool === null || lert_delimiter === null) {
        logger.error("CSV data, survey tool, or delimiter was null!");
        return [false, 1, []];
    } else if (typeof lert_tool != typeof 123) {
        logger.error("Survey tool was not a numeric value!");
        return [false, 2, []];
    } else if (typeof lert_delimiter != typeof 123) {
        logger.error("Delimiter was not a numeric value!");
        return [false, 3, []];
    } else if (typeof csv_data != typeof "asd") {
        logger.error("CSV data was not string!");
        return [false, 4, []];
    }
    logger.info("Variables ok!");
    var delimiters = {};
    var tempdelimiters = [];

    try {
        logger.info("Reading delimiters file...");
        tempdelimiters = JSON.parse(fs.readFileSync(path.join(__dirname, "../select2/delimiters.json"), "utf8"));
        if (!(tempdelimiters instanceof Array)) {
            logger.warn("Delimiters from file not array!");
            delimiters = {}
        } else {
            for (var s = 0; s < tempdelimiters.length; s++) {
                delimiters[s] = tempdelimiters[s].name;
            }
        }
    }
    catch (err) {
        logger.error("Error opening delimiters file: " + err.message);
        delimiters = {}
    }
    if (delimiters.hasOwnProperty(lert_delimiter) && lert_delimiter !== 0) {
        logger.info("Delimiters had searched delimiter value!");
        lert_delimiter = delimiters[lert_delimiter];
    } else {
        logger.error("Chosen delimiter does not exist in file, or was default! Value: " + lert_delimiter);
        lert_delimiter = null;
    }
    logger.debug("DELIMITER: " + lert_delimiter);

    if (lert_delimiter === null) {// this means that we need to define this based on lert_tool... 
        logger.info("Delimeter null! Needs to be defined by lert_tool value: " + lert_tool);
        switch (lert_tool) {
            case 0:
                //GF
                logger.debug("case GF");
                lert_delimiter = ",";
                break;
            default:
                //unknown
                logger.debug("case unknown");
                lert_delimiter = ",";
        }
    }

    var parsed = CSVtoArrayBOS(csv_data, lert_delimiter);
    //parsed[3][10] = CSVtoArrayBOS(parsed[3][10], ";");
    // we need to validate array here before sending it... so that we have proper amount of lines available based on lert_tool value
    // for example, the right amount of lines for BOS result is 24
    // these results need to be parsed into PROPER internal format before sending...
    return [true,0,parsed];
}

/* Parses array from csv->array conversion to wanted form */
function parseArray(tool = -1, arr = [], survey_ver = -1) {// returns [boolean, statuscode, arr]  
    logger.debug("parseArray");
    logger.info("Selecting and parsing based on survey tool: " + tool);
    //logger.debug(typeof (tool));
    //logger.error("PARSEARRAY FUNCTION NOT IMPLEMENTED YET!");
    //return [false, 1, []];
    
    switch (survey_ver) {
        case -1:
            logger.info("No survey_ver defined!");
            return [false, 1, []];
            break;
        case 0:
            // 1.0.0
            logger.info("Survey version 1.0.0");
            var arr100 = pars100.parseHandler(arr, tool, CSVtoArrayBOS, validateParsedArray);//pars100
            return arr100;
            break;
        default:
            //
            logger.error("Unknown survey_ver defined!");
            return [false, 2, []];
    }
}

/* Validate file contents (proper data exits inside JSON file) */
function validateProjectJSON(json_data = {}) {// NEEDSTOBECHANGED errors give out error code
    var retres = [];
    // check if is JSON file, check all keys, check type of values, check values inside (if exist...)
    if (json_data.hasOwnProperty("____INFO____")) {
        if (typeof json_data["____INFO____"] !== "string") {
            console.log("___INFO___ is not string");
            return [false,0];
        }
        if (json_data.hasOwnProperty("created")) {
            if (typeof json_data["created"] !== "string") {
                console.log("created is not string");
                return [false, 1];
            }
            if (Number.isNaN(Date.parse(json_data["created"]))) {
                console.log("created is NaN");
                return [false, 2];
            }
                if (json_data.hasOwnProperty("project-files")) {// need to be done!!!!!
                    if (typeof json_data["project-files"] !== "object") {
                        console.log("project-files not an object");
                        return [false, 6];
                    }
                    for (var file in json_data["project-files"]) {
                        //console.log(file);
                        file = json_data["project-files"][file];
                        //console.log(file.hasOwnProperty("src-file"));
                        if (file.hasOwnProperty("src-file")) {
                            if (typeof file["src-file"] !== "string") {
                                console.log("file src-file not a string");
                                return [false, 7];
                            }
                            if (file.hasOwnProperty("src-data")) {// STILL NEED TO BE WORKED WITH >CUSTOM INPUT
                                if (typeof file["src-data"] !== "object") {
                                    console.log("file src-data not an object");
                                    return [false, 8];
                                }
                                if (!(file["src-data"] instanceof Array)) {
                                    console.log("fine src-data not an array");
                                    return [false, 9];
                                }
                                if (file.hasOwnProperty("a")) {
                                    if (typeof file["a"] !== "string") {
                                        console.log("file a not a string");
                                        return [false, 10];
                                    }
                                    if (file.hasOwnProperty("b")) {
                                        if (typeof file["b"] !== "string") {
                                            console.log("file b not a string");
                                            return [false, 11];
                                        }
                                        if (file.hasOwnProperty("c")) {
                                            if (typeof file["c"] !== "string") {
                                                console.log("file c not a string");
                                                return [false, 11];
                                            }
                                            if (file.hasOwnProperty("country")) {
                                                if (typeof file["country"] !== "string") {
                                                    console.log("file country not a string");
                                                    return [false, 11];
                                                }
                                                if (file["country"].length !== 2) {
                                                    console.log("file string not length 2");
                                                    return [false, 12];
                                                }
                                                if (file.hasOwnProperty("lang")) {
                                                    if (typeof file["lang"] !== "string") {
                                                        console.log("file land not a string");
                                                        return [false, 13];
                                                    }
                                                    if (file["lang"].length !== 2) {
                                                        console.log("file lang not length 2");
                                                        return [false, 14];
                                                    }
                                                    if (file.hasOwnProperty("kw")) {
                                                        if (typeof file["kw"] !== "object") {
                                                            console.log("file kw not an object");
                                                            return [false, 15];
                                                        }
                                                        if (!(file["kw"] instanceof Array)) {
                                                            console.log("file kw not an array");
                                                            return [false, 16];
                                                        }
                                                        if (file["kw"].length > 0) {
                                                            for (var kw_i = 0; kw_i < file["kw"].length; kw_i++) {
                                                                if (typeof file["kw"][kw_i] !== "string") {
                                                                    console.log("file kw[] not a string");
                                                                    return [false, 17];
                                                                }
                                                            }
                                                        }
                                                        if (file.hasOwnProperty("done")) {
                                                            if (typeof file["done"] !== "boolean") {
                                                                console.log("file done not a boolean");
                                                                //console.log(file);
                                                                //console.log(file["done"]);
                                                                //console.log();
                                                                return [false, 18];
                                                            } else {
                                                                //
                                                            }
                                                            if (file.hasOwnProperty("permission")) {
                                                                if (typeof file["permission"] !== "boolean") {
                                                                    console.log("file permission not boolean");
                                                                    return [false, 46];
                                                                } else {
                                                                    if (file.hasOwnProperty("timestamp")) {
                                                                        if (typeof file["timestamp"] !== "string") {
                                                                            console.log("file timestamp not string!");
                                                                            return [false, 49];
                                                                        } else {
                                                                            // all done checking
                                                                        }
                                                                    } else {
                                                                        console.log("file timestamp doesn't exist");
                                                                        return [false, 48];
                                                                    }
                                                                }
                                                            } else {
                                                                console.log("file permission doesn not exist");
                                                                return [false, 47];
                                                            }
                                                        } else {
                                                            console.log("file done does not exits");
                                                            return [false, 19];
                                                        }
                                                    } else {
                                                        console.log("file kw does not exist");
                                                        return [false, 20];
                                                    }
                                                } else {
                                                    console.log("file lang does not exist");
                                                    return [false, 21];
                                                }
                                            } else {
                                                console.log("file country does not exist");
                                                return [false, 22];
                                            }
                                        } else {
                                            console.log("file c does not exist");
                                            return [false, 23];
                                        }
                                    } else {
                                        console.log("file b does not exist");
                                        return [false, 24];
                                    }
                                } else {
                                    console.log("file a does not exist");
                                    return [false, 25];
                                }
                            } else {
                                console.log("file src-data does not exist");
                                return [false, 26];
                            }
                        } else {
                            console.log("file src-file does not exist");
                            return [false, 27];
                        }

                    }
                    if (json_data.hasOwnProperty("notes")) {
                        if (typeof json_data["notes"] !== "object") {
                            console.log("notes is not an object");
                            return [false, 28];
                        }
                        if (!(json_data["notes"] instanceof Array)) {
                            console.log("notes is not an array");
                            return [false, 29];
                        }
                        if (json_data["notes"].length > 0) {
                            for (var n_i = 0; n_i < json_data["notes"].length; n_i++) {
                                if (typeof json_data["notes"][n_i] !== "string") {
                                    console.log("notes[] is not a string");
                                    return [false, 30];
                                }
                            }
                        }
                        if (json_data.hasOwnProperty("lang-preset")) {
                            if (typeof json_data["lang-preset"] !== "string") {
                                console.log("lang-preset is not a string");
                                return [false, 31];
                            }
                            if (json_data["lang-preset"].length !== 2) {
                                console.log("lang-preset length is not 2");
                                return [false, 32];
                            }
                            if (json_data.hasOwnProperty("country-preset")) {
                                if (typeof json_data["country-preset"] !== "string") {
                                    console.log("country-preset is not a string");
                                    return [false, 33];
                                }
                                if (json_data["country-preset"].length !== 2) {
                                    console.log("country-preset length is not 2");
                                    return [false, 34];
                                }
                                if (json_data.hasOwnProperty("version")) {
                                    if (typeof json_data["version"] !== "string") {
                                        console.log("version is not a string");
                                        return [false, 35];
                                    }
                                    var ver_test = json_data["version"].split(".");
                                    if (ver_test.length !== 3) {
                                        console.log("version number array is not length 3");
                                        return [false, 36];
                                    }
                                    var ver_1 = parseInt(ver_test[0], 10);
                                    var ver_2 = parseInt(ver_test[1], 10);
                                    var ver_3 = parseInt(ver_test[2], 10);
                                    if (Number.isNaN(ver_1) || Number.isNaN(ver_2) || Number.isNaN(ver_3)) {
                                        console.log("version number array one to three are Nan");
                                        return [false, 37];
                                    }
                                    // EVERYTHING CHECKED>>>>>>>>>>>>>>>>>>>>>>>>><
                                    console.log("Everything checked.....");
                                    return [true, -1];
                                } else {
                                    console.log("version does not exist");
                                    return [false, 38];
                                }
                            } else {
                                console.log("country-preset does not exist");
                                return [false, 39];
                            }
                        } else {
                            console.log("lang-preset does not exist");
                            return [false, 40];
                        }
                    } else {
                        console.log("notes does not exist");
                        return [false, 41];
                    }
                } else {
                    console.log("project-files does not exist");
                    return [false, 42];
                }
        } else {
            console.log("created does not exist");
            return [false, 44];
        }
    } else {
        console.log("____INFO____ does not exist");
        return [false, 45];
    }
}

function validateVersion(version = "0.0.0") {
    logger.debug("validateVersion");
    var verregex = /[\d]+/g;
    const app = electron.app ? electron.app : electron.remote.app;
    var prog_ver_1 = version.match(verregex);
    var prog_ver_2 = app.getVersion().match(verregex);
    logger.info("Comparing versions from file...");
    logger.info("Current app version is '" + app.getVersion() + "', current file version is '" + version + "'");

    if (!(prog_ver_1.length === 3)) {
        // version number not length 3! invalid!
        logger.error("Tested version variable doesn't have 3 values!");
        return false;
    }

    // changing version numbers into integers
    for (var pr1 = 0; pr1 < prog_ver_1.length; pr1++) {
        prog_ver_1[pr1] = parseInt(prog_ver_1[pr1], 10)
    }
    for (var pr2 = 0; pr2 < prog_ver_2.length; pr2++) {
        prog_ver_2[pr2] = parseInt(prog_ver_2[pr2], 10)
    }

    // testing if project version is higher (major version eg. "2.x.x") than file
    if (prog_ver_1[0] < prog_ver_2[0]) {
        // project version is lower than application version
        logger.warn("Tested version lower than application version!");
        return false;
    }
    else {
        // project version is same or higher than application version
        return true;
    }
}

// first is json object od settings, second is mode 1 = application settings, -1 = default nothing
function validateSettings(settings = {}, mode = -1) {
    logger.debug("validateSettings");
    if (mode === -1 || mode !== 1) {
        // mode invalid
        logger.debug("FAIL 0");
        return false;
    }
    if ((settings.constructor !== {}.constructor) && (typeof (settings) !== typeof ({}))) {
        //settings object not json object
        logger.debug("FAIL 1");
        return false;
    }
    if (Object.keys(settings).length === 0) {
        //settings length 0
        logger.debug("FAIL 2");
        return false;
    }

    if (mode === 1) {
        logger.debug("MODE 1");
        if (settings.hasOwnProperty("app-lang")) {
            if (typeof (settings["app-lang"]) !== "string") {
                // app-lang not a string
                logger.debug("FAIL 3");
                return false;
            }
            if (settings.hasOwnProperty("first-use")) {
                //
                if (typeof (settings["first-use"]) !== typeof (true)) {
                    // first-use is not boolean
                    logger.debug("FAIL 4");
                    return false;
                }
                if (settings.hasOwnProperty("app-version")) {
                    if (typeof (settings["app-version"]) !== "string") {
                        //console.log("version is not a string");
                        //return [false, 35];
                        logger.debug("FAIL 5");
                        return false;
                    }
                    var verregex = /[\d]+/g;
                    var ver_test = settings["app-version"].match(verregex);

                    if (ver_test.length !== 3) {
                        //console.log("version number array is not length 3");
                        //return [false, 36];
                        logger.debug("FAIL 6");
                        return false;
                    }
                    var ver_1 = parseInt(ver_test[0], 10);
                    var ver_2 = parseInt(ver_test[1], 10);
                    var ver_3 = parseInt(ver_test[2], 10);
                    if (Number.isNaN(ver_1) || Number.isNaN(ver_2) || Number.isNaN(ver_3)) {
                        //console.log("version number array one to three are Nan");
                        //return [false, 37];
                        logger.debug("FAIL 7");
                        return false;
                    }

                    //if (settings.hasOwnProperty("demo-files")) {
                        //if (typeof (settings["demo-files"]) === typeof (true)) {
                            if (settings.hasOwnProperty("zoom")) {
                                if (typeof (settings["zoom"]) === typeof (1)) {
                                    var zoommax = 150;
                                    var zoommin = 50;
                                    if (settings["zoom"] >= zoommin && settings["zoom"] <= zoommax) {
                                        if (settings.hasOwnProperty("edits")) {
                                            if (settings["edits"] instanceof Array) {
                                                if (settings["edits"].length === 2) {
                                                    if (typeof (settings["edits"][0]) === typeof (true)) {
                                                        if (settings["edits"][1] === null || typeof (settings["edits"][1]) === "string") {
                                                            if (settings.hasOwnProperty("latest-update-check") && settings.hasOwnProperty("latest-update-install")) {
                                                                if (settings["latest-update-check"] === null || !Number.isNaN(Date.parse(settings["latest-update-check"]))) {
                                                                    if (settings["latest-update-install"] === null || !Number.isNaN(Date.parse(settings["latest-update-install"]))) {
                                                                                if (settings.hasOwnProperty("enabled-keywordlists")) {
                                                                                    if (settings["enabled-keywordlists"] instanceof Array) {
                                                                                        for (var enkw = 0; enkw < settings["enabled-keywordlists"].length; enkw++) {
                                                                                            if (typeof (settings["enabled-keywordlists"][enkw]) === "string") {
                                                                                                //was string, everything ok
                                                                                            } else {
                                                                                                //found something else than string
                                                                                                logger.debug("FAIL 34");
                                                                                                return false;
                                                                                            }
                                                                                        }
                                                                                        //nothing to be tested anymore
                                                                                        // app config OK!
                                                                                        logger.debug("SUCCESS");
                                                                                        return true;
                                                                                    } else {
                                                                                        //not array
                                                                                        logger.debug("FAIL 35");
                                                                                        return false;
                                                                                    }
                                                                                } else {
                                                                                    // no enabled-keywordlists
                                                                                    logger.debug("FAIL 36");
                                                                                    return false;
                                                                                }
                                                                    } else {
                                                                        // latest-update-install not null or date
                                                                        logger.debug("FAIL 8");
                                                                        return false;
                                                                    }
                                                                } else {
                                                                    // latest-update-check not null or date
                                                                    logger.debug("FAIL 9");
                                                                    return false;
                                                                }
                                                            } else {
                                                                //no latest-update-install or latest-update-check
                                                                logger.debug("FAIL 10");
                                                                return false;
                                                            }
                                                        } else {
                                                            // edits second not null or string
                                                            logger.debug("FAIL 11");
                                                            return false;
                                                        }
                                                    } else {
                                                        // edits array first not boolean
                                                        logger.debug("FAIL 12");
                                                        return false;
                                                    }
                                                } else {
                                                    //edits not length 2
                                                    logger.debug("FAIL 13");
                                                    return false;
                                                }
                                            } else {
                                                //edits is not array
                                                logger.debug("FAIL 14");
                                                return false;
                                            }
                                        } else {
                                            // no edits
                                            logger.debug("FAIL 15");
                                            return false;
                                        }
                                    } else {
                                        //zoom invalid
                                        logger.debug("FAIL 16");
                                        return false;
                                    }
                                } else {
                                    //zoom invalid
                                    logger.debug("FAIL 17");
                                    return false;
                                }
                            } else {
                                // no zoom
                                logger.debug("FAIL 18");
                                return false;
                            }
                        //} else {
                        //    // demo-files not boolean
                        //    logger.debug("FAIL 19");
                        //    return false;
                        //}
                    //} 
                } else {
                    // no app-version
                    logger.debug("FAIL 21");
                    return false;
                }
            } else {
                // no first-use
                logger.debug("FAIL 22");
                return false;
            }
        } else {
            // no app-lang in settings
            logger.debug("FAIL 23");
            return false;
        }
    } 
    //if (settings instanceof Array) { }
}

/* 
 "event_0": {
			"src-file": "lahdedata_1",
			"src-data":[],
			"a": "HTML GOES HERE",
			"b": "HTML GOES HERE",
			"c": "HTML GOES HERE",
			"country": "FI",
			"lang": "fi",
			"kw": [
				"basic-2",
				"basic-39"
			],
			"done": false,
            "permission": false
		},
 */

// the element above (which is also tested here in parseutils) should propably need "allowed use" field for answers where people don't want data to be used with SLIPPS

/* Creates temp-files from source files within the project's folders */
function readAndParseSource(sourcearr = [], path = "") { //receives array of arrays that have raw import data... NEEDSTOBECHANGED
    logger.debug("readAndParseSource");
    logger.debug(path);
    //logger.debug(sourcearr);
    if (!(sourcearr instanceof Array)) {
        logger.error("ReadAndParseSource file was not instanceof Array!");
        sourcearr = [];
    } else if (sourcearr.length === 0) {
        logger.error("Can't parse source array with length of 0!");
        throw "Source array length 0!";
    }
    //var processeddata = readSourceFile(arg[0], arg[1], arg[2]); // will be [false/true, status_code, result_array]
    //mainWindow.webContents.send("output-to-chrome-console", processeddata)
    
    /*
     
     [ "event-desc", "event-relevancy", #profession-INT, "profession-other", #age-INT, #gender-INT, #yearinprog-INT, #eventplacement-INT, 
     eventplacement-other", [#eventrelated-INT], "eventrelated-other", #typeofevent-INT, #reportedsystem-INT, "ifnotwhy", #reportedfiles-INT, "ifnotwhy", permission ]
     
     */

    // ##############################################################################################################
    // ############################################################################################################## LOOP TO CREATE MULTIPLE FILES from source array  
    var files_to_return = {};
    for (var q = 0; q < sourcearr.length; q++) {// loop specific events

        var currentArr = sourcearr[q];

        if (currentArr.length != 18) {
            logger.error("Can't parse source array for import! Length not 18!");
        }
        var permissionbool = false;
        if (currentArr[16] === 0) {
            permissionbool = true;
        }

        var curTimestamp = currentArr.pop(); // taking and removing last item

        var event_base = {
            "src-file": path,
            "src-data": currentArr,
            "a": "",
            "b": "",
            "c": "",
            "country": null,
            "lang": null,
            "kw": [],
            "done": false,
            "permission": permissionbool,
            "timestamp": curTimestamp
        }

        var secChtml = '<div class="secC-Q-allA">';
        var elemtextA = '<p class="w3-blue w3-container secA-Q" style="width:100%;"></p>';// no text here, because it will be placed in UI, not in file
        elemtextA = elemtextA + '<p class="secA-Q-allA">';
        var elemtextB = '<p class="w3-blue w3-container secB-Q" style="width:100%;"></p>';// no text here, because it will be placed in UI, not in file
        elemtextB = elemtextB + '<p class="secB-Q-allA">';


        elemtextA = elemtextA + currentArr[0]/*.replace(/&/g, "&amp;")
                                .replace(/"/g, "&quot;")
                                .replace(/'/g, "&#039;")*/
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/[^ -\s +\!.":><'?!/\\]+/g, '<span class="word">$&</span>') + '</p>';///\b(\w+?)\b/g
        elemtextB = elemtextB + currentArr[1]/*.replace(/&/g, "&amp;")
                                .replace(/"/g, "&quot;")
                                .replace(/'/g, "&#039;")*/
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/[^ -\s +\!.":><'?!/\\]+/g, '<span class="word">$&</span>') + '</p>';

        ////////////////////////////////////////////////////////////////////////////////////////////
        // Creating C section from here on....
        var j = 1;
        var temp_c_list = [];
        for (var line = 2; line < currentArr.length-1; line++) {

            /*
     ["event-desc"0, "event-relevancy"1, #profession - INT2, "profession-other"3, #age - INT4, #gender - INT5, #yearinprog - INT6, #eventplacement - INT7,
    eventplacement - other"8, [#eventrelated-INT]9, "eventrelated - other"10, #typeofevent-INT11, #reportedsystem-INT12, "ifnotwhy"13, #reportedfiles-INT14, "ifnotwhy"15, permission16 ]
     */
            // INT 2 4 5 6 7 11 12* 14* (16)
            // STRING 3 8 10 13* 15*
            // INT ARRAY 9

            var questID = "secC-Q-" + j;
            var elemCQ = '<p class="w3-blue w3-container ' + questID + '" style="width:100%;"></p>'; // no text here, because it will be placed in UI, not in file
            var ansID = "secC-Q-" + j + "-cont";
            var ansText = "";
            var elemCA = '';

            if (line === 2 || line === 4 || line === 5 || line === 6 || line === 7 || line === 11) {// integer answers
                // add data
                let datareal = currentArr[line].toString();

                //mainWindow.webContents.send("output-to-chrome-console", "line at integer: "+line);
                //mainWindow.webContents.send("output-to-chrome-console", currentDataArr[line]);
                elemCA = '<p class="w3-light-blue ' + ansID + '" data-real="' + datareal + '" style="display:inline;padding:3px;">' + ansText + '</p>';
                secChtml = secChtml + elemCQ + elemCA;
                j++;
            }
            else if (line === 12 || line === 14) {// integer answers UNSTABLE
                // add data
                let datareal = "";
                if (currentArr[line] != null) {
                    datareal = currentArr[line].toString();
                }

                elemCA = '<p class="w3-light-blue ' + ansID + '" data-real="' + datareal + '" style="display:inline;padding:3px;">' + ansText + '</p>';
                secChtml = secChtml + elemCQ + elemCA;
                j++;
            }
            else if (line === 3 || line === 8 || line === 10) {// open string answers
                if (!!currentArr[line]) {

                    ansText = currentArr[line]/*.replace(/&/g, "&amp;")
                                            .replace(/"/g, "&quot;")
                                            .replace(/'/g, "&#039;")*/
                        .replace(/</g, "&lt;")
                        .replace(/>/g, "&gt;")
                        .replace(/[^ -\s +\!.":><'?!/\\]+/g, '<span class="word">$&</span>');

                }
                else {
                    ansText = "";
                }
                elemCA = '<p class="' + ansID + '">' + ansText + '</p>';
                secChtml = secChtml + elemCQ + elemCA;
                j++;
            }
            else if (line === 13 || line === 15) {// open string answers UNSTABLE
                if (!!currentArr[line]) {

                    ansText = currentArr[line]/*.replace(/&/g, "&amp;")
                                            .replace(/"/g, "&quot;")
                                            .replace(/'/g, "&#039;")*/
                        .replace(/</g, "&lt;")
                        .replace(/>/g, "&gt;")
                        .replace(/[^ -\s +\!.":><'?!/\\]+/g, '<span class="word">$&</span>');

                }
                else {
                    ansText = "";
                }
                elemCA = '<p class="' + ansID + '">' + ansText + '</p>';
                secChtml = secChtml + elemCQ + elemCA;
                j++;
            } else if (line === 9) {// integer ARRAY
                temp_c_list = currentArr[line];
                
                elemCA = "<p class='w3-light-blue " + ansID + "' data-real='" + JSON.stringify(temp_c_list) + "' style='display:inline;padding:3px;'>" + ansText + "</p>";
                secChtml = secChtml + elemCQ + elemCA;
                j++;
            }
            else {
                logger.error("Unknown line number '"+line+"' while generating HTML for section C!");
            }
        }
        ////////////////////////////////////////////////////////////////////////////////////////////
        secChtml = secChtml + '</div>';
        logger.debug("created question lines for C section");
        event_base["a"] = elemtextA;
        event_base["b"] = elemtextB;
        event_base["c"] = secChtml;
        logger.debug("file section setted for A, B and C");

        logger.debug("done! continuing to next");

        files_to_return[q] = event_base;
    }
    // ##############################################################################################################
    // ##############################################################################################################


    return files_to_return;

}
/* Validates parsed Google Forms array */
/*
["event-desc"0, "event-relevancy"1, #profession - INT2, "profession-other"3, #age - INT4, #gender - INT5, #yearinprog - INT6, #eventplacement - INT7,
    eventplacement - other"8, [#eventrelated-INT]9, "eventrelated - other"10, #typeofevent-INT11, #reportedsystem-INT12, "ifnotwhy"13, #reportedfiles-INT14, "ifnotwhy"15, permission16 ]
    */
function validateParsedArray(arr) {
    logger.debug("validateGoogleArr");
    if (arr.length === 0) {
        return false;
    } else {
        for (var k = 0; k < arr.length; k++) {
            if (arr[k].length != 18) {
                return false;
            }
            if (typeof arr[k][0] === "string") {
                if (typeof arr[k][1] === "string") {
                    if (typeof arr[k][2] === "number") {
                        if (typeof arr[k][3] === "string") {
                            if (typeof arr[k][4] === "number") {
                                if (typeof arr[k][5] === "number") {
                                    if (typeof arr[k][6] === "number") {
                                        if (typeof arr[k][7] === "number") {
                                            if (typeof arr[k][8] === "string") {
                                                if (typeof arr[k][9] === "object") {
                                                    // CHECK ARRAY CONTENTS
                                                    if (typeof arr[k][10] === "string") {
                                                        if (typeof arr[k][11] === "number") {
                                                            //starting REPORT and IFNOTWHY x2
                                                            if (typeof arr[k][12] === "number") {
                                                                // was number, OK
                                                            } else {
                                                                // reportedsystem not number
                                                                if (arr[k][12] === null) {
                                                                    // was null, OK
                                                                } else {
                                                                    // FAIL!
                                                                    return false;
                                                                }
                                                            }
                                                            if (typeof arr[k][14] === "number") {
                                                                // was number, OK
                                                            } else {
                                                                // reportedfiles not number
                                                                if (arr[k][14] === null) {
                                                                    // was null, OK
                                                                } else {
                                                                    // FAIL!
                                                                    return false;
                                                                }
                                                            }
                                                            if (typeof arr[k][13] === "string") {
                                                                // was string, OK
                                                            } else {
                                                                if (arr[k][13] === null) {
                                                                    //was null, OK
                                                                } else {
                                                                    //FAIL!
                                                                    return false;
                                                                }
                                                            }
                                                            if (typeof arr[k][15] === "string") {
                                                                // was string, OK
                                                            } else {
                                                                if (arr[k][15] === null) {
                                                                    //was null, OK
                                                                } else {
                                                                    //FAIL!
                                                                    return false;
                                                                }
                                                            }
                                                            //final part
                                                            if (typeof arr[k][16] === "number") {
                                                                if (typeof arr[k][17] === "string") {
                                                                    // EVERYTHING CHECKED! OK!
                                                                    return true;
                                                                } else {
                                                                    return false;
                                                                }
                                                            } else {
                                                                // permission not number
                                                                return false;
                                                            }
                                                        } else {
                                                            // type of event not number
                                                            return false;
                                                        }
                                                    } else {
                                                        // event related OTHER not string
                                                        return false;
                                                    }
                                                } else {
                                                    // event related not object (should be array)
                                                    return false;
                                                }
                                            } else {
                                                // event placement OTHER not string
                                                return false;
                                            }
                                        } else {
                                            // event placement not number
                                            return false;
                                        }
                                    } else {
                                        // year in program not number
                                        return false;
                                    }
                                } else {
                                    //gender not number
                                    return false;
                                }
                            } else {
                                // age not number
                                return false;
                            }
                        } else {
                            // profession OTHER not string
                            return false;
                        }
                    } else {
                        // profession not number
                        return false;
                    }
                } else {
                    // B not string
                    return false;
                }
            } else {
                // A not string
                return false;
            }
        }
    }
}

module.exports = {
    validateAndParseCSV: validateAndParseCSV,
    validateProjectJSON: validateProjectJSON,
    validateVersion: validateVersion,
    validateSettings: validateSettings,
    parseArray: parseArray,
    readAndParseSource: readAndParseSource,
    validateParsedArray: validateParsedArray
}