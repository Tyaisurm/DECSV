const path = require("path")
const electron = require('electron')
const fs = require('fs');
let loadedLanguage;
let app = electron.app ? electron.app : electron.remote.app

module.exports = i18n;

function i18n() {
    logger.info("loading translation file...");
    if (fs.existsSync(path.join(__dirname, app.getLocale() + '.json'))) {
        logger.info("Using translation for locale '" + app.getLocale() + "'.");
        loadedLanguage = require(path.join(__dirname, app.getLocale() + '.json'));
    }
    else {
        logger.warn("No desired language found for user's locale. Using fallback-translation...");
        loadedLanguage = require(path.join(__dirname, 'en-US.json'));
    }
}

i18n.prototype.__ = function (phrase) {
    let translation = loadedLanguage[phrase]
    if (translation === undefined) {
        logger.error("No translation for '" + phrase + "' found in translation-file! Using placeholder '{**NO_TRANSLATION**}'");
        translation = "{**NO_TRANSLATION**}";
    }
    return translation
}