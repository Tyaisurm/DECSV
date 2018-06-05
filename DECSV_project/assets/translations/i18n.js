﻿const path = require("path")
const electron = require('electron')
const fs = require('fs');

const logger = require('electron-log');

let loadedLanguage;
let app = electron.app ? electron.app : electron.remote.app

module.exports = i18n;

function i18n(check = false) {
    logger.debug("Called from main process?: " + check);
    var locale = "en";//app.getLocale();
     
     
    //const Store = require('electron-config');
    const Store = require("electron-store");
    var langstore_options = {
        name: "app-configuration",
        cwd: app.getPath('userData')
    }
    const langstore = new Store(langstore_options);
    var lang = langstore.get('app-lang', 'NOT_FOUND');
    

    //if (!!/[^a-zA-Z]/.test(locale)) {
    //    locale = locale.substring(0, 2);
    //}
    if (lang !== 'NOT_FOUND') {
        logger.info("language aquired from configuration file: " + lang);
        locale = lang;
    }
    else {
        logger.warn("No language from configuration file! Using 'en' default...");
    }
    

    logger.info("loading translation file...");

    if (fs.existsSync(path.join(__dirname, locale + '.json'))) {
        logger.info("Using translation for locale '" + locale + "'.");
        try {
            loadedLanguage = require(path.join(__dirname, locale + '.json'));
        }catch(err){
            logger.error("Failed to read the file '" + locale + ".json'");
        }
    }
    else {
        logger.warn("No desired language found for user's locale. Using fallback-translation...\r\nGot locale: "+locale);
        logger.info("Using translation for locale 'en'.");
        loadedLanguage = require(path.join(__dirname, 'en.json'));
    }
}

i18n.prototype.__ = function (phrase,check = false) {
    let translation;
    try {
        translation = loadedLanguage[phrase]
    } catch (err) {
        logger.error("No language set to be used!");
    }
    if (translation === undefined) {
        if (check) {
        logger.debug("Translation into main process.......");
        }
        logger.error("No translation for '" + phrase + "' found in translation-file! Using placeholder '{**NO_TRANSLATION**}'");
        translation = "{**NO_TRANSLATION**}";
    }
    return translation
}