/* setting listener for save file -button. This hanles both saving file, and moving to next file in queue */
document.getElementById("save-file-prompt").onclick = function () {
    console.log("SAVE CLICKED");
    var options = {
        title: "Save file",
        //defaultPath: THIS MUST BE SET
        filters: [
            { name: 'CSV spreadsheet', extensions: ['csv'] }
        ]
    }
    function callback(fileName) {
        if (fileName === undefined) {
            logger.info("No file(s) chosen to be opened.");
            return;
        }
        var content = "THIS.IS.TEST-CONTENT!:D"; //only just in case for now
        var encoding = "utf8";

        writeFile_csv(fileName, content, encoding);
    }
    dialog.showSaveDialog(options, callback);
}

/* This function takes in data that is in arrays, and then parses and writes it
into new .csv files */
function writeFile_csv(file, content, encoding) {
    //writing... Array[0-1][0-x]
    var dataArray = get_survey_data();

    //PARSING DATA FROM EDIT-VIEW HAPPENS >>HERE<<

    /*
    //testing_KEYWORDS
    dataArray[2] = [];
    dataArray[2][0] = "FIRST";
    dataArray[2][1] = "SECOND";
    dataArray[2][2] = "THIRD";
    */

    //parsing content...
    console.log("Parsing content for saving...");

    var temp = "";

    //parse arrays to be like .csv file's content
    for (var i = 0; i < dataArray.length; i++) {
        temp = temp + "\"";
        console.log(i);
        console.log(temp);
        for (var j = 0; j < dataArray[i].length; j++) {
            console.log(j);
            console.log(temp);
            if (j === 0) {
                temp = temp + dataArray[i][j];
            }
            else {
                var input = dataArray[i][j];
                temp = temp + ",\"\"" + input + "\"\"";
            }
        }
        temp = temp + "\"\r\n";
    }

    //testlogs...
    console.log(file);
    console.log(encoding);
    console.log(temp);
    content = temp;

    //overwriting if same name at the moment!... naah. fs-dialog prompts about this before we even GET here :P
    fs.writeFile(file, content, encoding, function (msg) {
        if (msg) {
            console.log(msg);
            console.log("The file has been successfully saved");
        }
    });
}