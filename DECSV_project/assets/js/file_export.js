﻿'use strict';
//////////////////////////////////// CUSTOM ERROR MESSAGE
process.on('uncaughtException', function (err) {
    const electron = require('electron');
    const uncaugetdia = electron.dialog ? electron.dialog : electron.remote.dialog;
    const app = electron.app ? electron.app : electron.remote.app;
    const shell = electron.shell;
    logger.error("Uncaught Exception!");
    logger.error(err);
    var uncaughtoptions = {
        type: 'error',
        title: "Uncaught Exception",
        message: "Unknown error occurred!",
        detail: "Something unexpected happened! Please check wiki-page if this is a known problem:\r\n#### ERROR #####\r\n" + err,
        buttons: ["Close application", "Open Wiki"],
        browserWindow: electron.remote.getCurrentWindow()
    };

    uncaugetdia.showMessageBox(uncaughtoptions, function (index) {
        // no need to deal with anything.... just notifying user
        if (index === 1) {
            //open wiki
            shell.openExternal("https://github.com/Tyaisurm/DECSV/wiki");
            logger.error("Closing application because of error....");
            app.exit();
        } else {
            // close, do nothing
            logger.error("Closing application because of error....");
            app.exit();
        }
    });
});
////////////////////////////////////

const remote = require('electron').remote;
const app = remote.app;
const dialog = remote.dialog;
const thiswindow = remote.getCurrentWindow();
const path = require('path');
const fs = require('fs');
//const Store = require('electron-config');
const Store = require("electron-store");
const htmlParser = require('html-parse-stringify2');
const shell = remote.shell;
const parentwindow = thiswindow.getParentWindow();
const getSettings = remote.getGlobal("getSettings");
const ipcRenderer = require('electron').ipcRenderer;

//var projectname = "";
//var projectJSON = {};
var file_version = "v3.0.0";// upped from 1.0.0!

/* This is about retrieving project's name from another window */
$(document).ready(setTimeout(function () { 
    $("#exportlist").empty();
    ipcRenderer.on('get-project-data-reply', function (event, output) {
        output = JSON.parse(output);
        logger.debug("Project name received: " + output[0]);

        var projectname = output[0];
        var projectJSON = output[1];
        var docpath = remote.app.getPath('documents');
        var outputPath = path.join(docpath, 'SLIPPS Teacher Tool\\Output\\' + projectname + '.csv');

        if (projectname !== undefined) {
            var result = parseDoneFiles(projectname, projectJSON);

            //notesOutput(projectname, projectJSON); // Needed?
            //console.log(result);

            var dialogOptions = {
                title: i18n.__('export-target-prompt-window-title'),
                defaultPath: outputPath,
                filters: [
                    { name: 'Comma Separated Values', extensions: ['csv'] }
                ]
            }
            function callback(targetFile) {
                if (targetFile !== undefined) {
                    writeFile_csv(result, targetFile);
                    return;
                }
                logger.warn("No export targer file chosen!");
                thiswindow.close();
            }
            if (result[1].length === 0) {
                logger.warn("Nothing to export!");
                // show status...
                $("#export-status-text").text(i18n.__('export-status-error-no-cont'));
            } else {
                dialog.showSaveDialog(thiswindow, dialogOptions, callback);
            }

        } else { logger.error("Undefined project name! Can't export..."); $("#export-status-text").text(i18n.__('export-status-error'));}
    });
    parentwindow.webContents.send('get-project-data', thiswindow.id);
}, 0));


/////////////////////////////////////////////////////////////////////// SCREEN LISTENERS
thiswindow.on('focus', function () { $("html").css("opacity", "1"); });
thiswindow.on('blur', function () { $("html").css("opacity", "0.5"); });
document.getElementById("win-close-icon").onclick = function () {
    thiswindow.close();
}

$("#ok-button").on("click", function () {
    //
    thiswindow.close();
});
/*
$("#view-button").on("click", function () {
    //
    var docpath = app.getPath('documents');
    var out_base = path.join(docpath, 'SLIPPS Teacher Tool\\Output\\' + projectname);
    shell.openItem(out_base);
    thiswindow.close();
});
*/
///////////////////////////////////////////////////////////////////////////////

// NEEDS MODIFICATION
/* This function takes in an array filled with data, and then writes a csv-file based on it */

// [proj_name, [data_arr_1, data_arr_2,...] ]
function writeFile_csv(dataArray, targetFile) {// NEEDSTOBECHANGED
    logger.debug("writeFile_csv");
    var proj_name = dataArray[0];//project name
    dataArray = dataArray[1];//contents to be exported

    // check where want to save...

    ///////////////////////
    /*
    out_base = path.join(docpath, 'SLIPPS Teacher Tool\\Output\\' + proj_name);
    console.log(out_base);
    if (!fs.existsSync(out_base)){
        logger.info("No project OUTPUT folder found! Creating one...");
        fs.mkdirSync(out_base);
    }
    if (dataArray[1].length === 0) {
        logger.error("No valid filename to be written to!");
        return 1;
    }
    else {
        //
    }
    var file = path.join(out_base, "out_"+dataArray[10]+".csv");
    //writing... Array[0-1][0-x]
    */

    // One item in array "dataArray"
    //[new Date(), currentEvent.country, currentEvent.lang, done_a, done_b, done_c, currentEvent.kw, currentEvent.timestamp]

    logger.info("Starting to parse array into proper csv-format...");
    var finArr = [];
    //finArr[0] = []; //metadata [output_version, output_date]
    //finArr[1] = []; //data [timestamp, lang, country, DATA, kw_list]

    var temp = "";
    var export_date = new Date().toISOString();
    //finArr[0].push(file_version, export_date); // version of survey, survey timestamp
    temp = temp + file_version + "," + export_date + "\r\n";

    //////////////////////////////////////////////////////////////////////////////////////
    //finArr[1].push(dataArray[2], dataArray[3], dataArray[5], dataArray[6]);

    //for (var z = 0; z < dataArray[7].length; z++){
    //    finArr[1].push(dataArray[7][z]);
    //}
    //for (var v = 0; v < finArr[1].length; v++) {
    //    finArr[0].push(v + 1);
    //}
    /*
    for (var x = 0; x < dataArray[4].length; x++){
        finArr[2].push(dataArray[4][x][0]);
    }
    */
    //console.log("FINAL PRODUCT (ALMOST)");
    //console.log(finArr);
    //////////////////////////////////////////////////////////////////////////////////////


    //parse arrays to be like .csv file's content

    for (var z = 0; z < dataArray.length; z++) {
        var currentString = "";
        // single event data
        //[currentEvent.country, currentEvent.lang, done_a, done_b, done_c, currentEvent.kw, currentEvent.timestamp]

        currentString = currentString + dataArray[z].pop(); //removing timestamp from end...
        currentString = currentString + "," + dataArray[z][0];
        currentString = currentString + "," + dataArray[z][1]; // now is-> timestamp,FI,fi

        /*.replace(/&/g, "&amp;")
                                .replace(/"/g, "&quot;")
                                .replace(/'/g, "&#039;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")*/

        currentString = currentString + ",\"" + dataArray[z][2] + "\"";// a string
        currentString = currentString + ",\"" + dataArray[z][3] + "\""; // b string

        // now is-> timestamp,FI,fi,"string_a","string_b"

        // now adding data...
        var currentKW = dataArray[z].pop();// removing currentKW
        var done_c = dataArray[z].pop(); // done_c array

        for (var i = 0; i < done_c.length; i++) {
            if (done_c[i] === null || done_c[i] === undefined) {
                currentString = currentString + ",";
            } else if (typeof (done_c[i]) === "string") {
                if (done_c[i].length === 0) {
                    currentString = currentString + "\"" + "\"" + ",";
                } else {
                    currentString = currentString + "\"" + done_c[i] + "\"" + ",";
                }
            } else {
                // must be number...
                currentString = currentString + done_c[i].toString() + ",";
            }
        }

        if (currentKW.length === 0) {
            currentString = currentString + "\r\n"; // no KWs, adding newline
        } else {
            // KWs, adding them before newline
            var kwString = "";

            for (var q = 0; q < currentKW.length; q++) {
                kwString = kwString + currentKW[q] + ";";
            }
            currentString = currentString + kwString.substring(0, kwString.length - 1) + "\r\n";//removing last ";" frmo kwString
            currentString = currentString.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">"); // innerHTML/own formatting made these, so reverting... 
        }

        //currentString = currentString.substring(0, currentString.length - 1);// remove last "," from string...
        //currentString = currentString + "\r\n";
        finArr.push(currentString);
    }
    //return;

    // creating final string for file....
    for (var a = 0; a < finArr.length; a++) {
        temp = temp + finArr[a];
    }

    /* Overwriting if same name at the moment! */
    
    fs.writeFile(targetFile, temp, "utf8", function (msg) {
        if (!msg) {
            logger.info("File '" + targetFile + "' successfully saved!");
            $("#export-status-text").text(i18n.__('export-status-complete'));
            return;
        }
        logger.error("Error while trying to save a new file!");
        logger.error(msg.message);
        $("#export-status-text").text(i18n.__('export-status-error-write'));
    });
    
}
// status: 0=success 1=failure, file=name
/* This function adds files into the EXPORT-window list based on their status */
/*
function addFile2List(file, status) {
    logger.debug("addFile2List");
    //
    var statustext = ""
    if (status === 0) {
        statustext = i18n.__('app-success');
    }
    else {
        statustext = i18n.__('app-failure');
    }

    var li_string = document.createTextNode(file+" - "+statustext);
    var li_node = document.createElement("li");

    li_node.appendChild(li_string);
    var color = "green";
    if (status === 1) { color = "red";}
    
    var classes = "w3-display-container w3-" + color;
    $(li_node).attr({
        class: classes
    });

    $('#exportlist').append(li_node);
    // SORT LIST?
}
*/

/* Make array from temp-files that will be then used to make new csv files */

// uses html-parse-stringify2
// line-endings with "\r\n
// line starts with "
// object delimiter "" and "",""
// .parse(htmlString, options)
// .stringify(AST) AbstractSyntaxTree    htmlParser

// NEEEEEDS MODIFICATION

function parseDoneFiles(proj_name, proj_json) {
    logger.debug("parseDoneFiles: " + proj_name);
    var projFiles = proj_json["project-files"];
    var doneFiles = [];
    var finalArr = [];

    for (var k in projFiles) {
        if ((projFiles[k].done === true || projFiles[k].done === "true") && (projFiles[k].permission === true || projFiles[k].permission === "true")) {
            doneFiles.push(projFiles[k]);
            logger.debug("taking: "+k);
        } else {
            // skipping this one...
            logger.debug("skipping: "+k);
        }
    }

    for (var i = 0; i < doneFiles.length; i++) {
        var currentEvent = doneFiles[i];
        console.log("current event",currentEvent);

        var tf_a = htmlParser.parse(currentEvent.a);
        var tf_b = htmlParser.parse(currentEvent.b);
        var tf_c = htmlParser.parse(currentEvent.c);

        var done_a = ""; // string for A
        var done_b = ""; // string for B
        var done_c = []; // array for C

        // FIRST PART A
        for (var obj_o in tf_a[1].children) {
            var obj = tf_a[1].children[obj_o];
            if (obj.type !== "text") {
                var check = false;
                var test_arr = obj.attrs.class.split(" ");
                for (var q = 0; q < test_arr.length; q++) {
                    if (test_arr[q] === "censored") {
                        check = true;
                    }
                }
                if (!check) {
                    done_a += obj.children[0].content;
                } else {
                    done_a += "*****";
                }
            } else {
                done_a += obj.content;
            }
        }

        // SECOND PART B
        for (var obj_ob in tf_b[1].children) {
            var objb = tf_b[1].children[obj_ob];
            if (objb.type !== "text") {
                var checkb = false;
                var test_arrb = objb.attrs.class.split(" ");
                for (var kb = 0; kb < test_arrb.length; kb++) {
                    if (test_arrb[kb] === "censored") {
                        checkb = true;
                    }
                }
                if (!checkb) {
                    done_b += objb.children[0].content;
                } else {
                    done_b += "*****";
                }
            } else {
                done_b += objb.content;
            }
        }

        // THIRD PART C
        var ccounter = 0;
        var obj_string = "";
        for (var obj_oc in tf_c[0].children) {
            obj_string = "";
            if (ccounter === 0) {
                ccounter++;
                continue;
            }
            else {
                ccounter = 0;
            }

            var objc = tf_c[0].children[obj_oc];
            //console.log("OBJECT");
            //console.log(objc);
            var checkc = false;
            if (objc.children.length !== 0) {
                for (var kc = 0; kc < objc.children.length; kc++) {
                    if (objc.children[kc].type === "text") {
                        obj_string += objc.children[kc].content;
                        continue;
                    }
                    var test_arrc = objc.children[kc].attrs.class.split(" ");
                    for (var ic = 0; ic < test_arrc.length; ic++) {
                        if (test_arrc[ic] === "censored") {
                            checkc = true; // singular "word" has a class 'censored' attached to it
                        }
                    }
                    if (!checkc) {
                        obj_string += objc.children[kc].children[0].content;
                    } else {
                        obj_string += "*****";
                    }

                }
                //console.log("DONE_C PUSH_1: " + obj_string);
                //console.log("what CLASS: " + obj.attrs.class);
                //console.log(done_c);
                done_c.push(obj_string);
            } else {
                // no children.... testing realdata
                if (objc.attrs.hasOwnProperty("data-real")) {
                    //console.log("¤¤¤%¤%%¤¤%%¤¤%¤%¤%¤%%¤%¤%¤%¤%¤%¤¤%¤%¤%¤%%¤%¤%¤%¤%¤%¤%¤%¤%¤%¤%¤%¤%¤%¤%¤%¤%¤%¤%¤");
                    //console.log(obj.attrs["data-real"]);
                    //console.log(obj.attrs.hasOwnProperty("data-real"));
                    //console.log(obj.attrs["data-real"].length);
                    if (objc.attrs["data-real"].length !== 0) {
                        var rex = /&quot;/g;
                        var string_src = objc.attrs["data-real"];
                        var result_1 = JSON.parse(string_src.replace(rex, "\""));
                        //console.log("!_!_!_!_!_!_!_!_!_!_!_!_!");
                        //console.log();
                        //console.log(result_1);
                        //console.log(typeof (result_1));
                        //console.log(result_1[0]);
                        //console.log(typeof (result_1[0]));
                        if (result_1.constructor === Array) { // is array
                            //console.log("DONE_C PUSH_2: " + result_1);
                            //console.log("what CLASS: " + obj.attrs.class);
                            //console.log(done_c);
                            done_c.push(result_1);
                        }
                        else {// is not array
                            //console.log("DONE_C PUSH_3: " + result_1);
                            //console.log("what CLASS: " + obj.attrs.class);
                            //console.log(done_c);
                            done_c.push(result_1);
                        }
                    }
                    else {
                        done_c.push(null);// -1
                    }
                }
                else {
                    //console.log("DONE_C PUSH_4: " + obj_string);
                    //console.log("what CLASS: " + obj.attrs.class);
                    //console.log(done_c);
                    done_c.push(obj_string);
                }
            }
        }
        var resultArr = [currentEvent.country, currentEvent.lang, done_a, done_b, done_c, currentEvent.kw, currentEvent.timestamp];
        finalArr.push(resultArr);
    }


    //console.log("11111111111");
    //console.log(tf_c);
    //console.log();
    
    //var finishedArr = [];
    //resultArr.push(proj_name, file_store.get("src", ""), file_store.get("subID", 0), file_store.get("subDATE", new Date()), file_store.get("kw", []), done_a, done_b, done_c, file_store.get("lang", ""), file_store.get("country", ""), tempFileName.substring(5, tempFileName.length - 5));
    var finishedArr = [];
    finishedArr.push(proj_name, finalArr);

    logger.info("Parsing temp files completed!");
    //console.log("FINALARRAY!!!!!!!!!!!!!!!!!!!11111111111111111111111111111111111");
    //console.log(finishedArr);
    //console.log(finishedArr[0][7]);
    return finishedArr;
}

// NEEDS MODIFICATION
/*
function notesOutput(proj_name) {// NEEDSTOBECHANGED
    logger.debug("notesOutput");
    var docpath = app.getPath('documents');
    var proj_prop = path.join(docpath, 'SLIPPS Teacher Tool\\Projects\\' + proj_name + '\\' + proj_name + '.json');
    var proj_base = path.join(docpath, 'SLIPPS Teacher Tool\\Projects\\' + proj_name + '\\');
    var out_base = path.join(docpath, 'SLIPPS Teacher Tool\\Output\\' + proj_name);

    //var docpath = app.getPath('documents');
    //var out_base = path.join(docpath, 'SLIPPS DECSV\\Output\\' + proj_name);
    //console.log(out_base);
    if (!fs.existsSync(out_base)) {
        logger.info("No project OUTPUT folder found! Creating one...");
        fs.mkdirSync(out_base);
    }

    if (fs.existsSync(proj_prop)) {
        if (fs.existsSync(out_base)) {

            var proj_options = {
                name: proj_name,
                cwd: proj_base
            }
            const proj_store = new Store(proj_options);//
            var notes = proj_store.get("notes", []);
            var basestring = "####### SLIPPS Teacher Tool (version " + remote.app.getVersion() + "), project '"+proj_name+"' notefile #######\r\n";
            basestring = basestring +"############### START ###############\r\n";

            for (var i = 0; i < notes.length; i++) {
                basestring = basestring + "> "+notes[i] + "\r\n"
            }

            basestring = basestring + "################ END ################\r\n"
            var file = path.join(out_base, "out_NOTES_" + proj_name + ".txt");

            fs.writeFile(file, basestring, "utf8", function (msg) {
                if (!msg) {
                    logger.info("Project '" + proj_name + "' notes successfully exported!");
                    addFile2List("Project NOTES", 0);
                    return;
                }

                logger.error("Error while trying to save project notes!");
                addFile2List("Project NOTES", 1);
            });
        }
        else {
            // no output-folder....
        }
    }
    else {
        // no properties file...
    }
}
*/

/* THIS IS SETTING UP UI TRANSLATION */
function setupTranslations(applang = "en") {
    logger.info("Loading translations into UI (file_export)");
    $("#export-status-text").text(i18n.__('export-status-wait'));
    $("#titlebar-appname").text(i18n.__('export-window-title'));
    $("#ok-button").text(i18n.__('conf-ok'));
    // Set text here
}
ipcRenderer.on('force-interface-update', (event, settings) => {
    logger.info("Received call to force interface update (about)");
    interfaceUpdate(settings);
});
/* update interface of this window */
function interfaceUpdate(settings = {}) {
    logger.debug("interfaceUpdate (file_export.js)");
    //logger.debug(settings.constructor);
    if (settings.constructor === {}.constructor) {
        if (Object.keys(settings).length !== 1) {
            //logger.debug("INT FAIL 1");
            settings = getSettings();
        } else if (!settings.hasOwnProperty("app")) {
            //logger.debug("INT FAIL 2");
            settings = getSettings();
        }
    } else if (!parseUtils.validateSettings(settings.app, 1)) {
        //logger.debug("INT FAIL 4");
        settings = getSettings();
    }
    /* setting current settings as window object (json) */
    window.allsettings = settings;

    /* only in main window! */
    //$("body").css("zoom", settings.app.zoom / 100);

    /* Setting up UI texts */
    setupTranslations(settings.app["app-lang"]);
}
interfaceUpdate();