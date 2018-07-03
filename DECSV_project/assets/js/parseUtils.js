const remote = require('electron').remote;

function CSVtoArray(strData, strDelimiter) {
    logger.debug("CSVtoArray");
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
function parseCSV2Array(csv) {
    logger.debug("parseCSV2Array");
    //logger.debug(csv);
    //console.log("RAW CSV DATA IN");
    //console.log(csv);

    var separators = ['\"\",\"\"', ',\"\"', '\"\"'];
    //var separators_NEW = ['\";\"']; // the second " at the start and the end of the line need to be removed seperately (this->" something ";" something 2 "<-this)
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

    var headers = lines[0].split(new RegExp(separators_NEW.join('|'), 'g'));
    var contents = lines[1].split(new RegExp(separators_NEW.join('|'), 'g'));
    if (lines[2].length !== 0) {
        var keys = lines[2].split(new RegExp(separators_NEW.join('|'), 'g'));
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
// NOT DONE
/* check if the csv form is valid, and call proper function based on given tool name */
function validateAndParseCSV(csv_data, lert_tool) {
    if (lert_tool !== undefined && csv_data) {
        //
    }

    // return [status, reason, parsed_data]
    return [false, "THIS IS DUMMY RESPONSE"];
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
            if (json_data.hasOwnProperty("src-files")) {// this could need validation for filename....
                if (typeof json_data["src-files"] !== "object") {
                    console.log("src-files is not object");
                    return [false, 3];
                }
                if (!(json_data["src-files"] instanceof Array)) {
                    console.log("src-files not an array");
                    return [false, 4];
                }
                if (json_data["src-files"].length > 0) {
                    for (var src_i = 0; src_i < json_data["src-files"].length; src_i++) {
                        if (typeof json_data["src-files"][src_i] !== "string") {
                            console.log("src-files[] not a string");
                            return [false, 5];
                        }
                    }
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
                                                                //console.log("file done not a boolean");
                                                                //console.log(file);
                                                                //console.log(file["done"]);
                                                                //console.log();
                                                                return [false, 18];
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
                console.log("src-files does not exist");
                return [false, 43];
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

    var prog_ver_1 = version.split(".");
    var prog_ver_2 = remote.app.getVersion().split(".");
    logger.info("Comparing versions from file...");
    logger.info("Current app version is '" + remote.app.getVersion() + "', current file version is '" + version + "'");

    // changing version numbers into integers
    for (var pr1 = 0; pr1 < prog_ver_1.length; pr1++) {
        prog_ver_1[pr1] = parseInt(prog_ver_1[pr1])
    }
    for (var pr2 = 0; pr2 < prog_ver_2.length; pr2++) {
        prog_ver_2[pr2] = parseInt(prog_ver_2[pr2])
    }

    // testing if project version is higher (major version eg. "2.x.x") than file
    if (prog_ver_1[0] < prog_ver_2[0]) {
        // project version is lower than application version
        return false;
    }
    else {
        // project version is same or higher than application version
        return true;
    }
}

// first is json object od settings, second is mode 1 = application settings, 2 = keyword list settings, -1 = default nothing
function validateSettings(settings = {}, mode = -1) {
    //
    if (mode === -1 || (mode != 1 && mode != 2)) {
        // mode invalid
        return false;
    }
    if (!(Object.keys(settings).length === 0 && settings.constructor === Object)) {
        //settings object invalid
        return false;
    }

    if (mode === 1) {
        // app settings
        /*"app-lang": "en",
            "first-use": false,
            "app-version": app.getVersion(),
            "demo-files": true,
            "latest-update-check": null,
            "latest-update-install": null,
            "zoom": 1,
            "edits": [
                false,
                null
            ]*/
        if (settings.hasOwnProperty("app-lang")) {
            if (typeof (settings["app-lang"]) !== "string") {
                // app-lang not a string
                return false;
            }
            if (settings.hasOwnProperty("first-use")) {
                //
                if (typeof (settings["first-use"]) !== typeof (true)) {
                    // first-use is not boolean
                    return false;
                }
                if (settings.hasOwnProperty("app-version")) {
                    if (typeof settings["version"] !== "string") {
                        //console.log("version is not a string");
                        //return [false, 35];
                        return false;
                    }
                    var ver_test = settings["version"].split(".");
                    if (ver_test.length !== 3) {
                        //console.log("version number array is not length 3");
                        //return [false, 36];
                        return false;
                    }
                    var ver_1 = parseInt(ver_test[0], 10);
                    var ver_2 = parseInt(ver_test[1], 10);
                    var ver_3 = parseInt(ver_test[2], 10);
                    if (Number.isNaN(ver_1) || Number.isNaN(ver_2) || Number.isNaN(ver_3)) {
                        //console.log("version number array one to three are Nan");
                        //return [false, 37];
                        return false;
                    }

                    if (settings.hasOwnProperty("demo-files")) {
                        if (typeof (settings["demo-files"]) === typeof (true)) {
                            if (settings.hasOwnProperty("zoom")) {
                                if (typeof (settings["zoom"]) === typeof (1)) {
                                    var zoommax = 1.5;
                                    var zoommin = 0.5;
                                    if (settings["zoom"] >= zoommin && settings["zoom"] <= zoommax) {
                                        if (settings.hasOwnProperty("edits")) {
                                            if (settings["edits"] instanceof Array) {
                                                if (settings["edits"].length === 2) {
                                                    if (typeof (settings["edits"][0]) === typeof (true)) {
                                                        if (settings["edits"][1] === null || typeof (settings["edits"][1]) === "string") {
                                                            if (settings.hasOwnProperty("latest-update-check") && settings.hasOwnProperty("latest-update-install")) {
                                                                if (settings["latest-update-check"] === null || !Number.isNaN(Date.parse(settings["latest-update-check"]))) {
                                                                    if (settings["latest-update-install"] === null || !Number.isNaN(Date.parse(settings["latest-update-install"]))) {
                                                                        // app config OK!
                                                                        return true;
                                                                    } else {
                                                                        // latest-update-install not null or date
                                                                        return false;
                                                                    }
                                                                } else {
                                                                    // latest-update-check not null or date
                                                                    return false;
                                                                }
                                                            } else {
                                                                //no latest-update-install or latest-update-check
                                                                return false;
                                                            }
                                                        } else {
                                                            // edits second not null or string
                                                            return false;
                                                        }
                                                    } else {
                                                        // edits array first not boolean
                                                        return false;
                                                    }
                                                } else {
                                                    //edits not length 2
                                                    return false;
                                                }
                                            } else {
                                                //edits is not array
                                                return false;
                                            }
                                        } else {
                                            // no edits
                                            return false;
                                        }
                                    } else {
                                        //zoom invalid
                                        return false;
                                    }
                                } else {
                                    //zoom invalid
                                    return false;
                                }
                            } else {
                                // no zoom
                                return false;
                            }
                        } else {
                            // demo-files not boolean
                        }
                    } else {
                        // no demo-files
                        return false
                    }
                } else {
                    // no app-version
                    return false;
                }
            } else {
                // no first-use
                return false;
            }
        } else {
            // no app-lang in settings
            return false;
        }
    } else if (mode === 2) {
        // keyword settings
        /*"last-successful-update": null,
            "available-keywordlists": {
                "en-basic": {
                    "date": "2018-06-25T13:05:48.801Z",
                    "name": "English - Basic"
                },
                "fi-basic": {
                    "date": "2018-06-25T13:05:48.801Z",
                    "name": "Suomi - Perus"
                }
            },
            "local-keywordlists": {
                "en-basic": {
                    "date": "2018-06-25T13:05:48.801Z",
                    "name": "English - Basic"
                },
                "fi-basic": {
                    "date": "2018-06-25T13:05:48.801Z",
                    "name": "Suomi - Perus"
                }
            },
            "enabled-keywordlists": [
                "en-basic"
            ]*/
        /*
        asd.constructor === qwe["asdasd"].constructor
        true
        qwe["asdasd"] instanceof Object
        true
        typeof(qwe["asdasd"]) === "object"
        true
         */
        if (settings.hasOwnProperty["last-successful-update"]) {
            if (settings["last-successful-update"] === null || !Number.isNaN(Date.parse(settings["last-successful-update"]))) {
                if (settings.hasOwnProperty("available-keywordlists")) {
                    if (settings["available-keywordlists"].constructor === {}.constructor) {
                        // validate all and loop
                        var avkwo = {};
                        for (var avkw in settings["available-keywordlists"]) {
                            avkwo = settings["available-keywordlists"][avkw];
                            if ((avkwo.constructor === {}.constructor) && (typeof (avkw) !== "string")) {
                                if (avkwo.hasOwnProperty("date")) {
                                    if (!Number.isNaN(Date.parse(settings["date"]))) {
                                        if (avkwo.hasOwnProperty("name")) {
                                            if (typeof (avkwo["name"]) === "string") {
                                                // everything ok. proceed...
                                            } else {
                                                // name not string
                                                return false;
                                            }
                                        } else {
                                            // no name field
                                            return false;
                                        }
                                    } else {
                                        // invalid date field
                                        return false;
                                    }
                                } else {
                                    // no date field on available kw
                                    return false;
                                }
                            } else {
                                // content not json object, or it's key is not string
                                return false;
                            }
                        }
                        if (settings.hasOwnProperty("local-keywordlists")) {
                            if (settings["local-keywordlists"].constructor === {}.constructor) {
                                // validate all and loop
                                var lkwo = {};
                                for (var lkw in settings["local-keywordlists"]) {
                                    lkwo = settings["local-keywordlists"][lkw];
                                    if ((lkwo.constructor === {}.constructor) && (typeof (lkw) !== "string")) {
                                        if (lkwo.hasOwnProperty("date")) {
                                            if (!Number.isNaN(Date.parse(settings["date"]))) {
                                                if (lkwo.hasOwnProperty("name")) {
                                                    if (typeof (lkwo["name"]) === "string") {
                                                        // everything ok. proceed...
                                                    } else {
                                                        // name not string
                                                        return false;
                                                    }
                                                } else {
                                                    // no name field
                                                    return false;
                                                }
                                            } else {
                                                // invalid date field
                                                return false;
                                            }
                                        } else {
                                            // no date field on available kw
                                            return false;
                                        }
                                    } else {
                                        // content not json object, or it's key is not string
                                        return false;
                                    }
                                }
                                //

                                if (settings.hasOwnProperty("enabled-keywordlists")) {
                                    if (settings["enabled-keywordlists"] instanceof Array) {
                                        for (var enkw = 0; enkw < settings["enabled-keywordlists"].length; enkw++) {
                                            if (typeof (settings["enabled-keywordlists"][enkw]) === "string") {
                                                //was string, everything ok
                                            } else {
                                                //found something else than string
                                                return false;
                                            }
                                        }
                                        //nothing to be tested anymore
                                        return true;
                                    } else {
                                        //not array
                                        return false;
                                    }
                                } else {
                                    // no enabled-keywordlists
                                    return false;
                                }
                            } else {
                                // not an json object
                                return false;
                            }
                        } else {
                            // no local-keywordlists
                            return false;
                        }
                    } else {
                        // not an json object
                        return false;
                    }
                } else {
                    // no available-keywordlists
                    return false;
                }
                ///////

                ////////

                ////////
            } else {
                // last-successful-update is not null or valid date
                return false;
            }
        } else {
            // no last-successfull-update
            return false;
        }

    }
    //if (settings instanceof Array) { }
}

module.exports = {
    validateAndParseCSV: validateAndParseCSV,
    validateProjectJSON: validateProjectJSON,
    validateVersion: validateVersion,
    validateSettings: validateSettings
}