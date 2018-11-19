//0 = BOS, 1 = Google Forms, 2 = Webropol
const fs = require('fs');
const path = require('path');
const logger = require("electron-log");
//return [false, 3, []];
// [true, 0, *completeARR*]

function parseHandler(arr = [], tool = -1) {
    logger.info("Parsing 0.5.0...");
    logger.warn("Parsing with OLD / 0.5.0 not implemented!");
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
            var returnable = parseGoogle(arr);
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
     eventplacement-other", [#eventrelated-INT], "eventrelated-other", #typeofevent-INT, #reportedsystem-INT, "ifnotwhy", #reportedfiles-INT, "ifnotwhy" ] 
     
 */

function parseBOS(arr = []) {
    return [false, 3, []];
}

function parseGoogle(arr = []) {
    return [false, 3, []];
}

function parseWebropol(arr = []) {
    return [false, 3, []];
}

module.exports = {
    parseHandler: parseHandler
}