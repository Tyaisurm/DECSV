const remote = require('electron').remote;
const BrowserWindow = remote.BrowserWindow;
const dialog = remote.dialog;

/* setting listener for save file -button. This hanles both saving file, and moving to next file in queue */


// WORK IN PROGRESS
function parse_content2Array() {
    var sectionA_text;
    var sectionB_text;
    var sectionC_text;
    var submissionID;
    var submissionTIME;
    var keywords;

    var finalData = [];
    finalData[0] = [];
    finalData[1] = [];
}

/* This function takes in data that is in arrays, and then parses and writes it
into new .csv files */
function writeFile_csv(file, content, encoding) {
    //writing... Array[0-1][0-x]
    var dataArray = content;

    //PARSING DATA FROM EDIT-VIEW HAPPENS >>HERE<<

    /*
    //testing_KEYWORDS
    dataArray[2] = [];
    dataArray[2][0] = "FIRST";
    dataArray[2][1] = "SECOND";
    dataArray[2][2] = "THIRD";
    */

    //parsing content...
    //console.log("Parsing content for saving...");
    logger.info("Starting to parse array into proper csv-format...");

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