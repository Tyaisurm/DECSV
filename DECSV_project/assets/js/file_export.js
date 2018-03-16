const remote = require('electron').remote;
const app = remote.app;
const dialog = remote.dialog;
const thiswindow = remote.getCurrentWindow();
const path = require('path');
const fs = require('fs');
const Store = require('electron-store');
const htmlParser = require('html-parse-stringify2');
const shell = remote.shell;
const parentwindow = thiswindow.getParentWindow();
const ipcRenderer = require('electron').ipcRenderer;

var projectname = "";
var file_version = "1.0.0";

/* This is about retrieving project's name from another window */
$(document).ready(setTimeout(function () { 
    $("#exportlist").empty();
ipcRenderer.on('get-project-data-reply', function (event, output) {
    logger.debug("Project name received: "+output);
    projectname = output;
    if (projectname !== undefined){
        var result = parseDoneFiles(projectname);
        notesOutput(projectname);

        //console.log(result);// proj_name, file_store.get("src",""),file_store.get("subID", 0), file_store.get("subDATE", new Date()), file_store.get("kw", []), done_a, done_b, done_c, file_store.get("lang", ""), file_store.get("country", ""), tempFileName.substring(5, tempFileName.length - 5));
        
        for (var i = 0; i < result.length; i++) {
            writeFile_csv(result[i]);
        }
        
    }
})
parentwindow.webContents.send('get-project-data', thiswindow.id);
}, 0));

/* THIS IS SETTING UP UI TRANSLATION */
function setupTranslations() {
    logger.info("EXPORT-WINDOW Loading translations into UI...");
    // Set text here
}
setupTranslations();

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
$("#view-button").on("click", function () {
    //
    var docpath = app.getPath('documents');
    var out_base = path.join(docpath, 'SLIPPS DECSV\\Output\\' + projectname);
    shell.openItem(out_base);
    thiswindow.close();
});
///////////////////////////////////////////////////////////////////////////////

/* This function takes in an array filled with data, and then writes a csv-file based on it */
// resultArr.push(proj_name, file_store.get("src", ""), file_store.get("subID", 0), file_store.get("subDATE", new Date()), file_store.get("kw", []), done_a, done_b, done_c, file_store.get("lang", ""), file_store.get("country", ""), tempFileName.substring(5, tempFileName.length - 5)
function writeFile_csv(dataArray) {
    logger.debug("writeFile_csv");
    var proj_name = dataArray[0];
    var docpath = app.getPath('documents');
    var out_base = path.join(docpath, 'SLIPPS DECSV\\Output\\' + proj_name);
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

    logger.info("Starting to parse array into proper csv-format...");
    var finArr = [];
    finArr[0] = []; //metadata
    finArr[1] = []; //data
    finArr[2] = []; //kw
    var temp = "";
    finArr[0].push(file_version, dataArray[3], dataArray[8], dataArray[9]); // version, datetime, lang, country
    //console.log(finArr);
    finArr[1].push(dataArray[5], dataArray[6], JSON.stringify(dataArray[7])); //, dataArr[7] needs to be parsed


    //////////////////////////////////////////////////////////////////////////////////////
    //finArr[1].push(dataArray[2], dataArray[3], dataArray[5], dataArray[6]);

    //for (var z = 0; z < dataArray[7].length; z++){
    //    finArr[1].push(dataArray[7][z]);
    //}
    //for (var v = 0; v < finArr[1].length; v++) {
    //    finArr[0].push(v + 1);
    //}
    for (var x = 0; x < dataArray[4].length; x++){
        finArr[2].push(dataArray[4][x][0]);
    }
    //console.log("FINAL PRODUCT (ALMOST)");
    //console.log(finArr);
    //////////////////////////////////////////////////////////////////////////////////////


    //parse arrays to be like .csv file's content
    for (var i = 0; i < finArr.length; i++) {
        for (var j = 0; j < finArr[i].length; j++) {
            if (j === 0) {
                temp = temp + "\"" + finArr[i][j] + "\"";
            }
            else {
                temp = temp + ";\"" + finArr[i][j] + "\"";
            }
        }
        if (finArr[2].length === 0 && i === 2) {
            temp = temp + "\"\"";
        }
        temp = temp + "\r\n";
    }
    //console.log(temp);

    /* Overwriting if same name at the moment! */
    
    fs.writeFile(file, temp, "utf8", function (msg) {
        if (!msg) {
            logger.info("File '" + "out_" + dataArray[10] + "' successfully saved!");
            addFile2List(dataArray[10], 0)
            return;
        }

        logger.error("Error while trying to save a new file!");
        addFile2List(dataArray[10], 1)
    });
    
}
// status: 0=success 1=failure, file=name
/* This function adds files into the EXPORT-window list based on their status */
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

/* Make array from temp-files that will be then used to make new csv files */

// uses html-parse-stringify2
// line-endings with "\r\n
// line starts with "
// object delimiter "" and "",""
// .parse(htmlString, options)
// .stringify(AST) AbstractSyntaxTree    htmlParser
function parseDoneFiles(proj_name) {
    logger.debug("parseDoneFiles: " + proj_name);
    var docpath = app.getPath('documents');
    var src_base = path.join(docpath, 'SLIPPS DECSV\\Projects\\' + proj_name + '\\source\\');
    var temp_base = path.join(docpath, 'SLIPPS DECSV\\Projects\\' + proj_name + '\\temp\\');
    var proj_prop = path.join(docpath, 'SLIPPS DECSV\\Projects\\' + proj_name + '\\' + proj_name + '.json');
    var proj_base = path.join(docpath, 'SLIPPS DECSV\\Projects\\' + proj_name + '\\');
    if (fs.existsSync(src_base)) {
        if (fs.existsSync(proj_prop)) {
            if (fs.existsSync(temp_base)) {
                // needed locations exist...
                var proj_options = {
                    name: proj_name,
                    cwd: proj_base
                }
                const proj_store = new Store(proj_options);
                var proj_temps = proj_store.get('temp-files', {});
                var finishedArr = [];
                for (var tempFileName in proj_temps) {
                    var temp_file_location = path.join(docpath, 'SLIPPS DECSV\\Projects\\' + proj_name + '\\temp\\' + tempFileName);

                    if (fs.existsSync(temp_file_location)) {
                        var file_options = {
                            name: tempFileName.substring(0, tempFileName.length - 5),
                            cwd: temp_base
                        }
                        const file_store = new Store(file_options);
                        if (!file_store.get("done", false)) {
                            logger.info("File '" + tempFileName + "' not ready! Skipping...");
                            continue;
                        } else {
                            // file_store returned 'false' or didn't exist, so 'false' was defaulted
                        }

                        var tf_a = htmlParser.parse(file_store.get("a", ""));
                        var tf_b = htmlParser.parse(file_store.get("b", ""));
                        var tf_c = htmlParser.parse(file_store.get("c", ""));

                        var done_a = "";
                        var done_b = "";
                        var done_c = "";

                        // FIRST PART A
                        for (var obj_o in tf_a[1].children) {
                            var obj = tf_a[1].children[obj_o];
                            if (obj.type !== "text") {
                                var check = false;
                                var test_arr = obj.attrs.class.split(" ");
                                for (var k = 0; k < test_arr.length; k++) {
                                    if (test_arr[k] === "censored") {
                                        check = true;
                                    }
                                }
                                if (!check) {
                                    done_a += obj.children[0].content;
                                } else {
                                    done_a += "*****";
                                }
                            } else {
                                done_a += obj.content
                            }
                        }

                        // SECOND PART B
                        for (var obj_o in tf_b[1].children) {
                            var obj = tf_b[1].children[obj_o];
                            if (obj.type !== "text") {
                                var check = false;
                                var test_arr = obj.attrs.class.split(" ");
                                for (var k = 0; k < test_arr.length; k++) {
                                    if (test_arr[k] === "censored") {
                                        check = true;
                                    }
                                }
                                if (!check) {
                                    done_b += obj.children[0].content;
                                } else {
                                    done_b += "*****";
                                }
                            } else {
                                done_b += obj.content
                            }
                        }

                        // THIRD PART C
                        var done_c = [];

                        var ccounter = 0;
                        var obj_string = "";
                        //console.log("11111111111");
                        //console.log(tf_c);
                        //console.log();
                        for (var obj_o in tf_c[0].children) {
                            obj_string = "";
                            if (ccounter === 0) {
                                ccounter++;
                                continue;
                            }
                            else {
                                ccounter = 0;
                            }
                            
                            var obj = tf_c[0].children[obj_o];
                            //console.log("OBJECT");
                            //console.log(obj);
                            var check = false;
                            if (obj.children.length !== 0) {
                                for (var k = 0; k < obj.children.length; k++) {
                                    if (obj.children[k].type === "text") {
                                        obj_string += obj.children[k].content;
                                        continue;
                                    }
                                    var test_arr = obj.children[k].attrs.class.split(" ");
                                    for (var i = 0; i < test_arr.length; i++) {
                                        if (test_arr[i] === "censored") {
                                            check = true; // singular "word" has a class 'censored' attached to it
                                        }
                                    }
                                    if (!check) {
                                        obj_string += obj.children[k].children[0].content;
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
                                if (obj.attrs.hasOwnProperty("data-real")) {
                                    //console.log("¤¤¤%¤%%¤¤%%¤¤%¤%¤%¤%%¤%¤%¤%¤%¤%¤¤%¤%¤%¤%%¤%¤%¤%¤%¤%¤%¤%¤%¤%¤%¤%¤%¤%¤%¤%¤%¤%¤%¤");
                                    //console.log(obj.attrs["data-real"]);
                                    //console.log(obj.attrs.hasOwnProperty("data-real"));
                                    //console.log(obj.attrs["data-real"].length);
                                    if (obj.attrs["data-real"].length !== 0) {
                                        var rex = /&quot;/g;
                                        var string_src = obj.attrs["data-real"];
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
                                        done_c.push(-1);
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
                        var resultArr = [];
                        resultArr.push(proj_name, file_store.get("src", ""), file_store.get("subID", 0), file_store.get("subDATE", new Date()), file_store.get("kw", []), done_a, done_b, done_c, file_store.get("lang", ""), file_store.get("country", ""), tempFileName.substring(5, tempFileName.length - 5));
                        finishedArr.push(resultArr);
                    } else {
                        // temp_file_location does not exist!
                    }
                }
                logger.info("Parsing temp files completed!");
                //console.log("FINALARRAY!!!!!!!!!!!!!!!!!!!11111111111111111111111111111111111");
                //console.log(finishedArr);
                //console.log(finishedArr[0][7]);
                return finishedArr;
            } else {
                // temp_base does not exist!
            }
        } else {
            // proj_prop does not exist!
        }
    } else {
        // src_base does not exist!
    }
}

function notesOutput(proj_name) {
    logger.debug("notesOutput");
    var docpath = app.getPath('documents');
    var proj_prop = path.join(docpath, 'SLIPPS DECSV\\Projects\\' + proj_name + '\\' + proj_name + '.json');
    var proj_base = path.join(docpath, 'SLIPPS DECSV\\Projects\\' + proj_name + '\\');
    var out_base = path.join(docpath, 'SLIPPS DECSV\\Output\\' + proj_name);

    if (fs.existsSync(proj_prop)) {
        if (fs.existsSync(out_base)) {

            var proj_options = {
                name: proj_name,
                cwd: proj_base
            }
            const proj_store = new Store(proj_options);
            var notes = proj_store.get("notes", []);
            var basestring = "####### DECSV (version " + remote.app.getVersion() + "), project '"+proj_name+"' notefile #######\r\n";
            basestring = basestring +"############### START ###############\r\n";

            for (var i = 0; i < notes.length;i++) {
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