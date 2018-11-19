//0 = BOS, 1 = Google Forms, 2 = Webropol
const fs = require('fs');
const path = require('path');
const logger = require("electron-log");
//return [false, 3, []];
// [true, 0, *completeARR*]

function parseHandler(arr = [], tool = -1, CSVtoArrayBOS = function () { return []; }, validateParsedArray = function () { return false; }) {
    logger.info("Parsing 1.0.0...");
    switch (tool) {
        case -1:
            // no tool defined
            return [false, 3, []];
            break;
        case 0:
            // Bristol Online Surveys / Online Surveys
            var returnable = parseBOS(arr);
            return returnable;
            break;
        case 1:
            // Google Forms
            var returnable = parseGoogle(arr, CSVtoArrayBOS, validateParsedArray);
            return returnable;
            break;
        case 2:
            // Webropol
            var returnable = parseWebropol(arr);
            return returnable;
            break;
        default:
            // unknown tool defined
            return [false, 3, []];
    }
}

/*
     
     [ "event-desc", "event-relevancy", #profession-INT, "profession-other", #age-INT, #gender-INT, #yearinprog-INT, #eventplacement-INT, 
     eventplacement-other", [#eventrelated-INT], "eventrelated-other", #typeofevent-INT, #reportedsystem-INT, "ifnotwhy", #reportedfiles-INT, "ifnotwhy", permission ] 
     
 */

function parseBOS(arr = []) {
    logger.warn("BOS 1.0.0 parsing not implemented!");
    return [false, 3, []];
}

function parseGoogle(arr = [], CSVtoArrayBOS = function () { return []; }, validateParsedArray = function () { return false; }) {
            //parsed[3][10] = CSVtoArrayBOS(parsed[3][10], ";");
    try {
        var completedata = [];
        var shift = 0;
        for (var i = 0; i < arr.length; i++) {
            var cursurv = arr[i+shift];
            //now loop single survey form
            completedata[i] = [];
            completedata[i][0] = cursurv[1];
            completedata[i][1] = cursurv[2];
            var parsed = Number.parseInt(cursurv[3], 10);
            if (Number.isNaN(parsed)) {
                // this might be titlerow?
                logger.warn("Row "+i+" probably titlerow! Skipping...");
                shift++;
                i--;
                continue;
            }
            completedata[i][2] = Number.parseInt(cursurv[3], 10);
            if (!cursurv[4]) {
                cursurv[4] = "";
            }
            completedata[i][3] = cursurv[4];
            completedata[i][4] = Number.parseInt(cursurv[5], 10);
            completedata[i][5] = Number.parseInt(cursurv[6], 10);
            completedata[i][6] = Number.parseInt(cursurv[7], 10);
            completedata[i][7] = Number.parseInt(cursurv[8], 10);
            if (!cursurv[9]) {
                cursurv[9] = "";
            }
            completedata[i][8] = cursurv[9];

            var temparr = CSVtoArrayBOS(cursurv[10], ";");// THIS NEEDS PARSING!
            completedata[i][9] = temparr[0];
            for (var qwe = 0; qwe < completedata[i][9].length;qwe++) {
                completedata[i][9][qwe] = Number.parseInt(completedata[i][9][qwe], 10);
            }
            if (!cursurv[11]) {
                cursurv[11] = "";
            }
            completedata[i][10] = cursurv[11];
            completedata[i][11] = Number.parseInt(cursurv[12], 10);

            //the part after this contains reported and ifnotwhy x2, plus permission
            var reported1 = null;
            if (!!cursurv[13]) {
                reported1 = Number.parseInt(cursurv[13], 10);
            }
            completedata[i][12] = reported1;//cursurv[13];
            if (!cursurv[14]) {
                cursurv[14] = null;
            }
            completedata[i][13] = cursurv[14];
            var reported2 = null;
            if (!!cursurv[15]) {
                reported2 = Number.parseInt(cursurv[15], 10);
            }
            completedata[i][14] = reported2;//cursurv[15]
            if (!cursurv[16]) {
                cursurv[16] = null;
            }
            completedata[i][15] = cursurv[16];

            completedata[i][16] = Number.parseInt(cursurv[17], 10);
        }
        if (validateParsedArray(completedata)) { return [true, 0, completedata]; } else { logger.error("Validating Google Forms array failed!");return [false, 3, []];}

    } catch (e) {
        logger.error("Unable to parse Google Forms array!");
        logger.error(e.message);
        return [false, 3, []];
    }
}

function parseWebropol(arr = []) {
    logger.warn("Webropol 1.0.0 parsing not implemented!");
    return [false, 3, []];
}

module.exports = {
    parseHandler: parseHandler
}