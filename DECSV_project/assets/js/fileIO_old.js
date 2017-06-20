const remote = require('electron').remote;
const dialog = remote.dialog;
const fs = require('fs');
const XLSX = require('xlsx');

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
        //console.log("EXCEL TO CSV");
        //console.log(JSON.stringify(csv_sheet));

        /* xlsx-js continue... THIS IS UNFINISED */
        var newlines = ['\r\n', '\n'];
        var lines = csv_sheet.split(new RegExp(newlines.join('|'), 'g'));

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
        };

        var headers = CSVtoArray(lines[0]);
        var contents = CSVtoArray(lines[1]);
        //console.log(headers);
        //console.log(contents);

        var output_data = [];
        output_data[0] = headers;
        output_data[1] = contents;
        //console.log("setting data");
        //set_survey_data(output_data);//setting global variables.. oooh boy...
        window.currentFileContent = output_data;
        console.log(output_data);

    }

    /* file has .csv extension */
    else if (file_ext === 'csv') {

        /*Node.js fs*/
        fs.readFile(file, 'utf8', function (err, data) {
            if (err) {
                return console.log(err);
            }
            //console.log("DATA FROM READFILE");
            //console.log(JSON.stringify(data));
            //console.log(data);

            /* This function takes in raw data from read .csv file and turns it into arrays */
            function parseCSV2Array(csv) {

                var separators = ['\"\",\"\"', ',\"\"', '\"\"'];
                var newlines = ['\r\n', '\n'];

                console.log(typeof (csv));
                //var lines = csv.split("\n");
                var lines = csv.split(new RegExp(newlines.join('|'), 'g'));
                //console.log(JSON.stringify(lines[0]));

                lines[0] = lines[0].substring(1, lines[0].length - 3);
                //console.log(JSON.stringify(lines[0]));
                lines[1] = lines[1].substring(1, lines[1].length - 3);
                //console.log(JSON.stringify(lines[1]));

                var headers = lines[0].split(new RegExp(separators.join('|'), 'g'));
                var contents = lines[1].split(new RegExp(separators.join('|'), 'g'));
                //console.log(">>>>>>>>>>>>>>>>>>>>>>>>HEADERS");
                //console.log(headers);
                //console.log(">>>>>>>>>>>>>>>>>>>>>>>>CONTENTS");
                //console.log(contents);

                var result = new Array(2);

                for (var i = 0; i < 2; i++) {
                    result[i] = [];
                }

                //result[0][0] = headers[0];
                for (var i = 0; i < headers.length; i++) {
                    result[0][i] = headers[i];
                }
                for (var i = 0; i < contents.length; i++) {
                    result[1][i] = contents[i];
                }

                return result;
            }
            //console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>OMAN TULOSTUS");
            var output_data = parseCSV2Array(data)
            //console.log("setting data");
            //set_survey_data(output_data);//setting global variables.. oooh boy...
            window.currentFileContent = output_data;
            console.log(output_data);

            /* This function parses data for textareas that are CURRENTLY USED
            => Will be changed */
            function showQuizData(data) {
                var data_0 = parseQuizArray(data, 0, 1);
                var data_A = parseQuizArray(data, 2, 2);
                var data_B = parseQuizArray(data, 3, 3);
                var data_C = parseQuizArray(data, 4, data[0].length - 1);

                if (data[2] === 'undefined') {
                    console.log(HUEHUEUE);
                };


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
                for (var i = fromIX; i <= toIX; i++) {
                    res = res + data[0][i] + "\n>>>";
                    res = res + data[1][i] + "\n\n";
                }
                return res;
            }

            //showQuizData(output_data);

        });

    }
    else {
        //what lies beyond this land...
    }

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