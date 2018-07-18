
//////////////////////////////////////////////////////////////////////////////77 init.js
/* NEED TO BE DEACTIVATED!!! */
/* Handles moving source files into project folder and generating temp-files ASYNC!! (IPC to app.js) */
function sourceFiles2ProjAsync(files) { // Last object of "files" will be name of the project where files will be added to NEEDSTOBECHANGED
    logger.debug("sourceFiles2ProjAsync");
    var proj_name = files[files.length - 1];
    var docpath = remote.app.getPath('documents');

    var f2p_options = {
        name: proj_name,
        cwd: path.join(docpath, 'SLIPPS DECSV\\Projects\\' + proj_name + '\\')
    }
    const f2p_store = new Store(f2p_options);//
    var pre_dirfiles = f2p_store.get('source-files', []);
    logger.debug(pre_dirfiles);

    ipcRenderer.on('async-import-files-reply', (event, arg) => {
        logger.debug("BACK FROM APP - import files into project");
        var dirfiles = fs.readdirSync(path.join(docpath, 'SLIPPS DECSV\\Projects\\' + proj_name + '\\source\\'));
        logger.debug(docpath);
        logger.debug(dirfiles);
        //console.log("RETURNED FROM APP: ");
        //console.log(arg);
        if (arg[0]) {
            // do something if importing was successful
            logger.debug("DONE IMPORTING SOURCE FILES!");
        }
        else {
            logger.debug("ERROR WHILE IMPORTING!");
            var reason1 = arg[1];
            // SHOW REASON TO USER! 
        }
        logger.debug("STORE SOURCE: " + f2p_store.get("source-files", "NONE!!!!"));
        f2p_store.set("source-files", dirfiles);
        ipcRenderer.removeAllListeners('async-import-files-reply');

        ipcRenderer.on('async-transform-files-reply', (event, arg) => {
            logger.debug("BACK FROM APP - returned from transforming src files to temp");
            if (arg[0]) {
                logger.info("SRC to TEMP conversion success!");
                // successfully ended the temp conversion
                logger.debug("SUCCESS AND FAIL ARRAYS");
                logger.debug(arg[1]);//success array
                logger.debug(arg[2]);//fail array
                // filearr 0 = fileoriginal, 1 = filetemp, 2 = filedonestatus

                // fileS,"temp#"+fileS+".json",false
                for (var a = 0; a < arg[1].length; a++) {
                    var fileArr = [];
                    fileArr.push(arg[1][a][0], arg[1][a][1], arg[1][a][2]); // NEEDS UPDATE!!!!!! CUSTOM INPUT
                    addProjFile(fileArr);
                }
            }
            else {
                logger.error("SRC to TEMP conversion failed!");
                var reason2 = arg[1];
                // SHOW REASON TO USER!

                //folders missing
            }
            //var testing_opt = {
            //    name: "temp#"+arg[1][0],
            //    cwd: path.join(docpath, 'SLIPPS DECSV\\Projects\\' + proj_name + '\\temp\\')
            //}
            /*
            const testing_store = new Store(testing_opt);
            var teststring = testing_store.get("c","AHAHAHAHAHAHAHAH");
            //THIS IS FOR TESTING
            $("#edita-div").addClass("is-shown");
            $("#edit-A-edit-text").html(teststring);
            */

            //updateFileList(proj_name);
            ipcRenderer.removeAllListeners('async-transform-files-reply');
        });
        ipcRenderer.send('async-transform-files', proj_name);
    });
    logger.debug("SENDING ASYNC TO MAIN APP!");
    var send_arg = [];
    send_arg.push(files);
    send_arg.push(pre_dirfiles);
    logger.debug("########### LISTING FILELIST GOING TO BE SENT");
    logger.debug(files);
    logger.debug(pre_dirfiles);
    ipcRenderer.send('async-import-files', send_arg);
}
//////////////////////////////////////////////////////////////////////////////////////// middle of init.js
///NEEDS UPDATE
/* This function parses data for textareas that are CURRENTLY USED
        => Will be changed */
/*
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
*/

///NEEDS UPDATE
/* This function puts C section answers into right places */
/*
function showCsecData(section_data) {
    //console.log("#############");
    var line = 1;
    for (var i = 4; i < section_data[1].length - 1; i++) {
        //console.log(section_data[1][i]);
        var lineId = "#secC-Q" + line + "-cont";
        $(lineId).text(section_data[1][i]);
        line++;
    }
}
*/

///NEEDS UPDATE
/* This function shows pre-selected words from the file */
/*
function loadKeyWords(keys) {
    for (var i = 0; i < keys.length; i++) {
        var to_appended = '<li class="list-keys-elem">' + keys[i] + '</li>';
        $("#aside-key-list").append(to_appended);
        paintEmAll(keys[i], 0);
    }
    updateKeywordsList();
}
*/

///NEEDS UPDATE
/*
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
*/
//%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%5


///NEEDS UPDATE
/* True if is found, false otherwise */
/*
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
*/

///NEEDS UPDATE
// mode 0 = paint all words as "keys"; mode 1 = remove "keys" marks from words
/*
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
*/
/////////////////////////////////////////////////////////////////////////// beginning of init.js
/*
$.fn.select2.amd.define('select2/i18n/current_lang', [], function () {
    // Current language $("#open-file-prompt-text").text(i18n.__('open-files'));
    return {
        errorLoading: function () {
            return i18n.__('select2-cannot-load');
        },
        inputTooLong: function (args) {
            var overChars = args.input.length - args.maximum;
            var message = i18n.__('select2-del-char-p1') + overChars;
            if (overChars < 2){
                message += i18n.__('select2-del-char-p2-1')
            }
            else if (overChars >= 2) {
                message += i18n.__('select2-del-char-p2-2');
            }
            return message;
        },
        inputTooShort: function (args) {
            var remainingChars = args.minimum - args.input.length;

            var message = i18n.__('select2-add-char-p1') + remainingChars + i18n.__('select2-add-char-p2');

            return message;
        },
        loadingMore: function () {
            return i18n.__('select2-loading-more');
        },
        maximumSelected: function (args) {
            var message = i18n.__('select2-select-p1') + e.maximum;

            if (args.maximum < 2) {
                message += i18n.__('select2-select-p2-1');
            }
            else if (args.maximum >= 2){
                message += i18n.__('select2-select-p2-2');
            }

            return message;
        },
        noResults: function () {
            return i18n.__('select2-no-results');
        },
        searching: function () {
            return i18n.__('select2-searching');
        }
    };
});
*/

////////////////////////////////////////////////////////////////// document.getElementById("win-close-icon").onclick
/*
    // going through yellow file list elements (as in currently opened/selected)
        $('#proj-files-ul li.w3-yellow').each(function (i) {
            done = ($(this).attr('data-done') === "true");
            country = $(this).attr('data-country');
            country = $(this).attr('data-lang');
        });
    
        // since we are closing, we need to clear the edit sections of the UI

        // clearing translations (no need to have them saved)
        $("#edit-A-orig-text .secA-Q").empty();
        $("#edit-B-orig-text .secB-Q").empty();
        for (var k = 1; k < 15; k++) {
            $("#edit-C-orig-text .secC-Q-" + k).empty();
        }

        // taking text to be saved
        var dataA = $("#edit-A-orig-text").html();
        var dataB = $("#edit-B-orig-text").html();
        intUtils.sectionUtils.clearCsectionUI();
        var dataC = $("#edit-C-orig-text").html();
        var dataKW = [];
        $("#file-chosen-kw-ul li").each(function (i) {
            var value = $(this).attr("data-value").substring(3, test.length - 1);
            //$(this).find('span').remove(); // no need to remove span, since we don't need text
            dataKW.push(value);
        });
        var notes = [];
        $("#proj-notes-ul li").each(function (i) {
            var text = $(this).ignore("span").text();
            notes.push(text);
        });

        // saving these to window-variable and backup, but since we are closing, but NO into actual file (no need to promp, because handleClosing() deals with it)
        saveProject(0, dataA, dataB, dataC, dataKW, notes, done, country, lang);//mode, dataA, dataB, dataC, kw, notes, done, country, lang
        */

////////////////////////////////////////////////////// middle of init.js

//////////////////////////////////////////////////////////////////////////////////////////////
/* Login/Register div */
//

//window.onload = function () {
    /*
    function getHighlightedWords() {
        var text = "";
        var activeEl = document.activeElement;
        var activeElTagName = activeEl ? activeEl.tagName.toLowerCase() : null;
        if (
            (activeElTagName == "textarea") || (activeElTagName == "input" &&
                /^(?:text|search|password|tel|url)$/i.test(activeEl.type)) &&
            (typeof activeEl.selec



tionStart == "number")
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

///////////////////////////////////////////////////////////////////////// end of init.js

/*
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
*/

/*
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
*/

///////////////////////////////////////////////////////////////// app.js
// NEEDS UPDATE - NOT USED AT THE MOMENT
// delete project
ipcMain.on('async-delete-project', (event, arg) => {
    logger.debug("async-delete-project (at app.js)");
})

// import files to project folder
ipcMain.on('async-import-files', (event, arg) => {
    logger.debug("async-import-files (at app.js)");
    //srcFiles2Proj(arg[0], event, arg[1]);
})

// transform source-folder files into temp files :)
ipcMain.on('async-transform-files', (event, arg) => {
    logger.debug("async-transform-files (at app.js)");
    transformSrc2Temp(arg, event);
})

///////////////////////////////////////////////////////////////////////// app.js
// NEEDS UPDATE - NOT CURRENTLY USED NEEDSTOBECHANGED
/* This deletes project directory with given name */
function removeProject(proj_name) {
    logger.debug("removeProject");
    if (proj_name.length === 0 || proj_name.length > 100) {
        // Projectname length 0 or over 100 characters
        return false;
    }
    else if (fs.existsSync(path.join(docpath, 'SLIPPS DECSV'))) {
        if (fs.existsSync(path.join(docpath, 'SLIPPS DECSV\\Projects'))) {
            if (fs.existsSync(path.join(docpath, 'SLIPPS DECSV\\Projects\\' + proj_name))) {

                //  REMOVE PROJECT DIRECTORY HERE!!!!!!

            }
            else {
                // No project with given name found!
                return false;
            }
        }
        else {
            // Projects-folder not present!
            return false;
        }
    }
    else {
        // No Application-folder (at Documents) not present!
        return false;
    }


}

// NOT CURRENTLY USED NEEDSTOBECHANGED
/* This function checks and compares temp folder contents of project with it's properties file "temp-files" list */
function checkTempFiles(proj_name) {
    //
    var docpath = app.getPath('documents');
    var proj_base = path.join(docpath, 'SLIPPS DECSV\\Projects\\' + proj_name + '\\');

    if (fs.existsSync(path.join(docpath, 'SLIPPS DECSV'))) {
        if (fs.existsSync(path.join(docpath, 'SLIPPS DECSV\\Projects'))) {
            if (fs.existsSync(path.join(docpath, 'SLIPPS DECSV\\Projects\\' + proj_name + '\\temp'))) {
                if (fs.existsSync(path.join(docpath, 'SLIPPS DECSV\\Projects\\' + proj_name + '.json'))) {
                    var temp_files = [];
                    fs.readdirSync(path.join(docpath, 'SLIPPS DECSV\\Projects\\' + proj_name + '\\temp'), (err, files) => {
                        temp_files = files;
                    });

                    var check_options = {
                        name: proj_name,
                        cwd: proj_base
                    }
                    //logger.debug("proj_name and proj_base: "+proj_name+" & "+proj_base);
                    const check_store = new Store(check_options);//

                    var sourceF = check_store.get('source-files', []);
                    var tempF = check_store.get('temp-files', {});
                    var tempLang = check_store.get('lang', null);
                    var tempCountry = check_store.get('country', null);
                    var proj_ver = check_store.get("version", null);

                    // compare dir contents with proj properties contents, and either add new (valid) files into properties, or remove non-existing from properties

                    for (var proj_f in tempF) {
                        //
                    }
                    ///////////////////////////////////////////////////////////////////////////////
                    /*
                    var temp_options = {
                        defaults: {
                            "src": fileS.toString(),
                            "src-data": [],
                            "subID": 0,
                            "subDATE": new Date(),
                            "a": "",
                            "b": "",
                            "c": "",
                            "kw": [],
                            "done": false,
                            "lang": tempLang,
                            "country": tempCountry,
                            "version": app.getVersion()
                        },
                        name: "temp#" + temp_finalname,
                        cwd: temp_base
                    }
                    logger.debug("CREATING TEMP FILE: " + "temp#" + temp_finalname);
                    const temp_store = new Store(temp_options);
                    if (temp_store.get("version", null) !== null) {
                        // checking version found inside...
                    }
                    else {
                        // no version. too old.
                    }
                    */
                    ///////////////////////////////////////////////////////////////////////////////


                }
                else {
                    // No project properties file
                    return false;
                }

            }
            else {
                // No project with given name or tempfolder found!
                return false;
            }
        }
        else {
            // Projects-folder not present!
            return false;
        }
    }
    else {
        // No Application-folder (at Documents) not present!
        return false;
    }
}

/* NEED TO BE DISABLED!!!! */
/* Imports source files into the project folders */
function srcFiles2ProjsrcFiles2Proj(files, event, ready_src) { // NEEDSTOBECHANGED
    logger.debug("srcFiles2Proj");
    var docpath = app.getPath('documents');
    var proj_name = files.pop();

    /* This still needs verifications about folders if they exists */

    var source = null;
    var dest = null;
    var dest_base = path.join(docpath, 'SLIPPS DECSV\\Projects\\' + proj_name + '\\source\\');
    var readStream = null;
    var writeStream = null;
    var result = [];
    result[0] = true;
    var filename = null;
    var rcounter = 0;
    var wcounter = 0;
    var check = false;

    if (fs.existsSync(path.join(docpath, 'SLIPPS DECSV\\Projects\\' + proj_name))) {
        if (fs.existsSync(dest_base)) {

            // Loop through the array of files to be imported
            for (var i = 0; i < files.length; i++) {
                source = files[i];
                filename = files[i].split('\\').pop();
                logger.debug("FILENAME: " + filename);
                logger.debug("ready_SRC: " + ready_src);
                // Check if file to be imported is already mentioned in project config file
                for (var k = 0; k < ready_src.length; k++) {
                    logger.debug("testing ready_src: " + k);
                    if (ready_src[k] === filename) { check = true; break; }
                }
                logger.debug(check);
                if (check) {
                    check = false;
                    rcounter++;
                    logger.warn("Tried to import file with same name as already existing '" + filename + "'. Skipping file import...");
                    continue;
                }

                dest = path.join(dest_base, filename);
                logger.debug("DEST: " + dest);
                readStream = fs.createReadStream(source);
                writeStream = fs.createWriteStream(dest);

                readStream.once('error', (err) => {
                    logger.error("Error while reading source file while importing!");
                    logger.error(err.message);
                    rcounter++;
                    result[0] = false;
                    result.push("Error reading source file while importing '" + filename + "'");
                });

                readStream.once('end', () => {
                    logger.info("Reading source file completed");
                    rcounter++;
                });

                writeStream.on('error', function () {
                    logger.info("Error while writing source file while importing!");
                    result[0] = false;
                    result.push("Error writing to target file while importing '" + filename + "'");
                });

                writeStream.on('finish', function () {
                    logger.info("Writing source file completed while importing");
                    wcounter++;
                    logger.debug("WCOUNTER and RCOUNTER");
                    logger.debug(wcounter);
                    logger.debug(rcounter);
                    logger.debug("FILES LENGTH: " + files.length);
                    if (rcounter === files.length) {
                        logger.debug("sending back now");
                        event.sender.send('async-import-files-reply', result);
                    }
                });
                logger.debug("Before reading and writing...");
                readStream.pipe(writeStream);
            }
        }
        else {
            logger.error();
            result[0] = false;
            result.push("Project source-folder does not exist!");
            event.sender.send('async-import-files-reply', result);
            // Project data .json not present!
        }
    }
    else {
        logger.error();
        result[0] = false;
        result.push("Project's folder does not exist!");
        event.sender.send('async-import-files-reply', result);
        // project source folder or other folders not present!
    }
}