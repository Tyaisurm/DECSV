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

$(document).ready(setTimeout(function () { 
    $("#exportlist").empty();
ipcRenderer.on('get-project-name-reply', function (event, output) {
    logger.debug("Project name received: "+output);
    projectname = output;
    if (output !== undefined){
        var result = parseDoneFiles(output)
        //console.log(result);// proj_name, file_store.get("src",""),file_store.get("subID", 0), file_store.get("subDATE", ""), file_store.get("kw",[]),done_a, done_b, done_c
        for (var i = 0; i < result.length; i++) {
            writeFile_csv(result[i]);
        }
    }
})
parentwindow.webContents.send('get-project-name', thiswindow.id);
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
    var file = path.join(out_base, "out_"+dataArray[1]);
    //writing... Array[0-1][0-x]

    //console.log("Parsing content for saving...");
    logger.info("Starting to parse array into proper csv-format...");
    var finArr = [];
    finArr[0] = []; finArr[1] = []; finArr[2] = [];
    var temp = "";

    finArr[1].push(dataArray[2], dataArray[3], dataArray[5], dataArray[6]);

    for (var z = 0; z < dataArray[7].length; z++){
        finArr[1].push(dataArray[7][z]);
    }
    for (var v = 0; v < finArr[1].length; v++) {
        finArr[0].push(v + 1);
    }
    for (var x = 0; x < dataArray[4].length; x++){
        finArr[2].push(dataArray[4][x][0]);
    }
    //console.log("FINAL PRODUCT (ALMOST)");
    //console.log(finArr);

    //parse arrays to be like .csv file's content
    for (var i = 0; i < finArr.length; i++) {
        for (var j = 0; j < finArr[i].length; j++) {
            if (j === 0) {
                temp = temp + "\"\"\"" + finArr[i][j] + "\"\"";
            }
            else {
                temp = temp + ",\"\"" + finArr[i][j] + "\"\"";
            }
        }
        if (finArr[2].length === 0) {
            temp = temp + "\"";
        }
        temp = temp + "\"\r\n";
    }

    //testlogs...
    console.log(file);
    //console.log(encoding);
    console.log("TEMP :DDDDDDDDDDDDDDD");
    console.log(temp);
    //content = temp;
    

    //overwriting if same name at the moment!... naah. fs-dialog prompts about this before we even GET here :P
    fs.writeFile(file, temp, "utf8", function (msg) {
        if (!msg) {
            //console.log(msg);
            //console.log("The file has been successfully saved");
            logger.info("File '" + "out_" + dataArray[1] + "' successfully saved!");
            addFile2List(dataArray[1], 0)
            return;
        }

        logger.error("Error while trying to save a new file!");
        addFile2List(dataArray[1], 1)
    });
}
// status: 0=success 1=failure, file=name
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
    // SORT LIST
}

// make array that will be then used to make new csv file

// NEEDS TO BE EDITED TO WORK IN A LOOP WITH PROJECT DATA!! uses html-parse-stringify2
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
                //needed locations exist...
                var proj_options = {
                    name: proj_name,
                    cwd: proj_base
                }
                //
                const proj_store = new Store(proj_options);
                var proj_temps = proj_store.get('temp-files', {});
                //console.log(proj_temps);
                var finishedArr = [];
                for (var tempFileName in proj_temps) {
                    //console.log(tempFileName);
                    var temp_file_location = path.join(docpath, 'SLIPPS DECSV\\Projects\\' + proj_name + '\\temp\\' + tempFileName);
                    /*if (obj.hasOwnProperty(key)) {
                        console.log(key + ": " + obj[key]);
                    }*/
                    //these go into loop of files
                    if (fs.existsSync(temp_file_location)) {
                        var file_options = {
                            name: tempFileName.substring(0, tempFileName.length-5),
                            cwd: temp_base
                        }
                        const file_store = new Store(file_options);
                        if (!file_store.get("done", false)) {
                            logger.info("File '"+tempFileName+"' not ready! Skipping...");
                            continue;
                        }
                        //console.log(tempFileName);
                        //console.log(temp_base);
                        //console.log(file_store.get("a", "ERROR WITH A"));
                        //
                        var tf_a = htmlParser.parse(file_store.get("a",""));
                        var tf_b = htmlParser.parse(file_store.get("b",""));
                        var tf_c = htmlParser.parse(file_store.get("c",""));
                        //return 0;
                        //var parsed = huetest.parse(htmlS);
                        //console.log(parsed);
                        var done_a = "";
                        var done_b = "";
                        var done_c = "";

                        // FIRST PART A
                        //console.log(tf_a);
                        //console.log(tf_b);
                        //console.log(tf_c);
                        for (var obj_o in tf_a[1].children) {
                            //
                            var obj = tf_a[1].children[obj_o];
                            if (obj.type !== "text") {
                                var check = false;
                                //console.log(obj);
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
                            //
                            var obj = tf_b[1].children[obj_o];
                            if (obj.type !== "text") {
                                var check = false;
                                //console.log(obj);
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
                        for (var obj_o in tf_c[0].children) {
                            //
                            //console.log();
                            obj_string = "";
                            if (ccounter === 0) {
                                ccounter++;
                                continue;
                            }
                            else {
                                ccounter = 0;
                            }
                            var obj = tf_c[0].children[obj_o];
                            var check = false;
                            //console.log(obj.attrs.class);
                            if (obj.children.length !== 0) {
                                for (var k = 0; k < obj.children.length; k++) {
                                    if (obj.children[k].type === "text") {
                                        obj_string += obj.children[k].content;
                                        continue;
                                    }
                                    var test_arr = obj.children[k].attrs.class.split(" ");
                                    for (var i = 0; i < test_arr.length; i++) {
                                        if (test_arr[i] === "censored") {
                                            check = true;
                                        }
                                    }
                                    if (!check) {
                                        obj_string += obj.children[k].children[0].content;
                                    } else {
                                        obj_string += "*****";
                                    }

                                }
                                done_c.push(obj_string);
                            } else { done_c.push(obj_string); }
                        }
                        //
                        console.log("LOGGING ALLL STUFF!!!!!");
                        console.log(file_store.get("src-data", []));
                        //console.log(done_a);
                        //console.log(done_b);
                        //console.log(done_c);
                        var resultArr = [];
                        resultArr.push(proj_name, file_store.get("src", ""), file_store.get("subID", 0), file_store.get("subDATE", ""), file_store.get("kw", []), done_a, done_b, done_c);
                        finishedArr.push(resultArr);
                    }
                }
                logger.info("Parsing temp files completed!");
                return finishedArr;
            }
        }
    }
}