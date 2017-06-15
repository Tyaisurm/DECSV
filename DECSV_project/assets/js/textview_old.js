/* This script file handles most of the file-related tasks like opening and saving
    Also, parsing of the .csv files into arrays and other related functions happen here */
/*
const remote = require('electron').remote;
const dialog = remote.dialog;
const fs = require('fs');
const XLSX = require('xlsx');
*/


/* Function that is called from the <main.js> */
function startTV() {

    /* setting listener for open file -button */
    document.getElementById('open-file-icon').onclick = function () {
        console.log("OPEN CLICKED");
        var options = {
            title: "Open file",
            //defaultPath: THIS MUST BE SET!
            filters: [
                { name: 'Spreadsheet', extensions: ['csv','xls', 'xlsx'] }
            ],
            properties: ['openFile']
        }
        function callback(fileNames) {
            readFile(fileNames);
        }
        dialog.showOpenDialog(options, callback);
    }

    /* setting listener for save file -button */
    document.getElementById("save-file-icon").onclick = function () {
        console.log("SAVE CLICKED");
        var options = {
            title: "Save file",
            //defaultPath: THIS MUS BE SET
            filters: [
                { name: 'CSV spreadsheet', extensions: ['csv'] }
            ]
        }
        function callback(fileName) {
            if (fileName === undefined) {
                alert("You didn't save the file!");//NOT needed? meg...
                return;
            }
            var content = "THIS.IS.TEST-CONTENT!:D"; //only just in case for now
            var encoding = "utf8";

            writeFile_csv(fileName, content, encoding);
        }
        dialog.showSaveDialog(options, callback);
    }
}

/* Function for reading a given file. Takes in filepath and wanted encoding */
function readFile(files, encoding) {

    /* check file-extension */
    console.log(files);
    var file = files[0];
    var file_ext = file.split('.').pop();
    console.log(file_ext);


    /* xlsx-js */
    var workbook = XLSX.readFile(file);
    var first_sheet_name = workbook.SheetNames[0];
    var worksheet = workbook.Sheets[first_sheet_name];
    
    /* file has .xlsx or .xls extension */
    if (file_ext === 'xlsx' || file_ext === 'xls') {
        var csv_sheet = XLSX.utils.sheet_to_csv(worksheet);
        console.log("EXCEL TO CSV");
        console.log(JSON.stringify(csv_sheet));

        /* xlsx-js continue... THIS IS UNFINISED */

    }
    else {
        //what lies beyond this land...
    }

    /* file has .csv extension */
    if (file_ext === 'csv') {

    /*Node.js fs*/
    fs.readFile(file, 'utf8', function (err, data) {
        if (err) {
            return console.log(err);
        }
        console.log("DATA FROM READFILE");
        console.log(JSON.stringify(data));
        console.log(data);

        /* This function takes in raw data from read .csv file and turns it into arrays */
        function parseCSV2Array(csv) {

            var separators = ['\"\",\"\"', ',\"\"', '\"\"'];
            var newlines = ['\r\n','\n'];

            console.log(typeof(csv));
            //var lines = csv.split("\n");
            var lines = csv.split(new RegExp(newlines.join('|'), 'g'));
            //console.log(JSON.stringify(lines[0]));

            lines[0] = lines[0].substring(1, lines[0].length - 3);
            //console.log(JSON.stringify(lines[0]));
            lines[1] = lines[1].substring(1, lines[1].length - 3);
            //console.log(JSON.stringify(lines[1]));
            
            var headers = lines[0].split(new RegExp(separators.join('|'), 'g'));
            var contents = lines[1].split(new RegExp(separators.join('|'), 'g'));
            console.log(">>>>>>>>>>>>>>>>>>>>>>>>HEADERS");
            console.log(headers);
            console.log(">>>>>>>>>>>>>>>>>>>>>>>>CONTENTS");
            console.log(contents);

            var result = new Array(2);

            for (var i = 0; i < 2; i++) {
                result[i] = [];
            }

            //result[0][0] = headers[0];
            for (var i = 0; i < headers.length; i++){
                result[0][i] = headers[i];
            }
            for (var i = 0; i < contents.length; i++) {
                result[1][i] = contents[i];
            }

            return result;
        }
        console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>OMAN TULOSTUS");
        var output_data = parseCSV2Array(data)
        console.log("setting data");
        set_survey_data(output_data);//setting global variables.. oooh boy...

        console.log(output_data);

        /* This function parses data for textareas that are CURRENTLY USED
        => Will be changed */
        function showQuizData(data) {
            var data_0 = parseQuizArray(data, 0, 1);
            var data_A = parseQuizArray(data, 2, 2);
            var data_B = parseQuizArray(data, 3, 3);
            var data_C = parseQuizArray(data, 4, data[0].length-1);


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
            for (var i = fromIX; i <= toIX; i++){
                res = res + data[0][i] + "\n>>>";
                res = res + data[1][i] + "\n\n";
            }
            return res;
        }

        showQuizData(output_data);
        
        });
        
    }
    else {
        //wonder what happens here... :D
    }
    
}

/* This function takes in data that is in arrays, and then parses and writes it
into new .csv files */
function writeFile_csv(file, content, encoding) {
    //writing... Array[0-1][0-x]
    var dataArray = get_survey_data();

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
    for (var i = 0; i < dataArray.length; i++){
        temp = temp + "\"";
        console.log(i);
        console.log(temp);
        for (var j = 0; j < dataArray[i].length; j++){
            console.log(j);
            console.log(temp);
            if (j===0){
                temp = temp  + dataArray[i][j];
            }
            else {
                var input = dataArray[i][j];
                temp = temp + ",\"\""+input+"\"\"";
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
