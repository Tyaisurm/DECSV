﻿const remote = require("electron").remote;
//const Store = require("electron-config");
const fs = require("fs");
const path = require('path');

/* Setting up language selector for app language (select2) */
function setAppLang() {
    logger.debug("setAppLang");
    $("#app-lang-selector").empty();
    fs.readdirSync(path.join(__dirname, "..\\translations")).forEach(file => {
        if (file.split('.').pop() === "js") { return; }
        var lang = file.split('.')[0];
        logger.debug("LANGUAGE: " + lang);
        logger.debug("FILE: " + file);
        if (lang === null) {
            logger.warn("Lang was null! Using placeholder 'NOT_DEFINED'...");
            lang = "NOT_DEFINED";
        }
        $("#app-lang-selector").append('<option value="' + file.split('.')[0] + '">' + lang + '</option>');
    });

    $("#app-lang-selector").select2({
        placeholder: i18n.__('select2-app-lang-ph'),
        minimumResultsForSearch: Infinity
    });
    ///////////////////////////// BECAUSE LANGUAGE SELECT IS NOT YET WORKING
    $("#app-lang-selector").prop("disabled", true);
    ////////////////////////////
}

/* Setup language and country (in English) selectors on Create Project -view */
function setCreateProjSelect() {
    logger.debug("setCreateProjSelect");
    var resultdata1 = "";
    var resultdata2 = "";
    try {
        resultdata1 = JSON.parse(fs.readFileSync(path.join(__dirname, "../select2/language_3b2.json"), "utf8"));
        resultdata2 = JSON.parse(fs.readFileSync(path.join(__dirname, "../select2/data_countries.json"), "utf8"));
    }
    catch (err) {
        logger.error("Error opening >Create Project< file: " + err.message);
        return -1;
    }
    var testdata1 = $.map(resultdata1, function (obj) {
        obj.id = obj["alpha2"];
        obj.text = obj.English;
        return obj;
    });

    var testdata2 = $.map(resultdata2, function (obj) {
        obj.id = obj.Code;
        obj.text = obj.Name;
        return obj;
    });
    $("#create-proj-country-select").select2({
        placeholder: i18n.__('select2-proj-country-ph'),
        data: testdata2
    }
    );

    $("#create-proj-language-select").select2({
        placeholder: i18n.__('select2-proj-lang-ph'),
        data: testdata1
    }
    );

    $("#create-proj-country-select").val(null).trigger("change");
    $("#create-proj-language-select").val(null).trigger("change");
}

/* Setting up country and language selector, that is shown on edit-view for individual events */
function setEditSelects() {
    logger.debug("setEditSelects");
    var resultdata1 = "";
    var resultdata2 = "";
    try {
        resultdata1 = JSON.parse(fs.readFileSync(path.join(__dirname, "../select2/language_3b2.json"), "utf8"));
        resultdata2 = JSON.parse(fs.readFileSync(path.join(__dirname, "../select2/data_countries.json"), "utf8"));
    }
    catch (err) {
        logger.error("Error opening >Edit Select< file: " + err.message);
        return -1;
    }
    var testdata1 = $.map(resultdata1, function (obj) {
        obj.id = obj["alpha2"];
        obj.text = obj.English;
        return obj;
    });

    var testdata2 = $.map(resultdata2, function (obj) {
        obj.id = obj.Code;
        obj.text = obj.Name;
        return obj;
    });
    $("#preview-event-country-select").select2({
        placeholder: i18n.__('select2-event-country-ph'),
        data: testdata2
    }
    );

    $("#preview-event-lang-select").select2({
        placeholder: i18n.__('select2-event-lang-ph'),
        data: testdata1
    }
    );

    $("#preview-event-country-select").val(null).trigger("change");
    $("#preview-event-lang-select").val(null).trigger("change");

    $("#preview-event-country-select").prop("disabled", true);
    $("#preview-event-lang-select").prop("disabled", true);
}

/* Setting up KW-selector on EDIT-view (select2) */
function setupEditKW(settings = { "app": { "enabled-keywordlists": ["en"] }}) {
    logger.debug("setupEditKW");
    var enabledKW = settings.app["enabled-keywordlists"];
    //if (enabledKW.length === 0) { enabledKW.push("en");}
    //var apppath = remote.app.getPath('userData');

    $("#KW-selector").empty();
    $("#KW-selector").append(document.createElement("option"));

    logger.debug("getting enabled local lists...");
    /*
    $("#settings-local-kw-lists .kw-list-enabled").each(function (i) {
        var kw_list_id = $(this).attr("data-id");
        enabledKW.push(kw_list_id);
        logger.debug("ADDED: " + kw_list_id);
    });
    */

    var kw_base = path.join(__dirname, '../../keywordfiles/lists/');

    var kw_groups = [];
    var kw_current_group = "";
    logger.debug("GOING TO LOOP enabledKW now....");
    for (var i = 0; i < enabledKW.length; i++) {
        //logger.debug("Round: " + i);
        // enabledKW is list of lang folder names ["en","fi",....]
        var langfolderbase = path.join(kw_base, enabledKW[i]);
        var kwfiles = fs.readdirSync(path.join(kw_base, enabledKW[i]), 'utf8');// read dir, like "en" contents
        for (var f = 0; f < kwfiles.length; f++) {
            // kwfiles is list of kw files under language folder, like "en"
            let loadedlist = [];
            if (fs.existsSync(path.join(langfolderbase, kwfiles[f]))) {
                logger.debug("KW file '" + kwfiles[f] + "' located!");
                try {
                    //logger.debug("TRYING TO GET KW FILE CONTENTS AND LOOP 'EM");
                    loadedlist = require(path.join(langfolderbase, kwfiles[f]));
                    for (var k in loadedlist) {
                        //logger.debug("in loop now. current: " + k);
                        if (loadedlist.hasOwnProperty(k)) {
                            var kw_tag = k;
                            var kw_itself = loadedlist[k];
                            if (Object.keys(loadedlist).indexOf(k) === 0) {//loadedlist.indexof(k) === 0) {// skipping 0, because that is the name
                                //logger.debug(kw_itself);
                                kw_current_group = kw_itself;//.substring(kw_itself.split(' - ')[0].length + 3, kw_itself.length);
                                //logger.debug("First line! taking name...: " + kw_current_group);
                                continue;
                            } else if (Object.keys(loadedlist).indexOf(k) === 1) {
                                //version number here...
                                continue;
                            }
                            if (kw_groups.indexOf(kw_current_group) > -1) {
                                //logger.debug("Group seems to exist: " + kw_current_group);
                                let option_elem = document.createElement("option");
                                let option_text = document.createTextNode(kw_itself);
                                //logger.debug("KW ITSELF: " + kw_itself);
                                //logger.debug("KW TAG: " + kw_tag);
                                $(option_elem).attr({
                                    value: kw_tag
                                });
                                $(option_elem).append(option_text);
                                $("#KW-selector optgroup[label='" + kw_current_group + "']").append(option_elem);
                                //logger.debug("#KW-selector optgroup[label='" + kw_current_group + "']");
                            }
                            else {
                                //logger.debug("Group seems to NOT exist: " + kw_current_group);
                                kw_groups.push(kw_current_group);
                                var optgroup_elem = document.createElement("optgroup");
                                $(optgroup_elem).attr({
                                    label: kw_current_group
                                });
                                $("#KW-selector").append(optgroup_elem);

                                let option_elem = document.createElement("option");
                                let option_text = document.createTextNode(kw_itself);
                                //logger.debug("KW ITSELF: " + kw_itself);
                                //logger.debug("KW TAG: " + kw_tag);
                                $(option_elem).attr({
                                    value: kw_tag
                                });
                                $(option_elem).append(option_text);
                                $("#KW-selector optgroup[label='" + kw_current_group + "']").append(option_elem);
                                //logger.debug("#KW-selector optgroup[label='" + kw_current_group + "']");
                            }
                        }
                    }
                } catch (err) {
                    logger.error("Failed to load '" + enabledKW[i] + ".json' KW file...");
                    logger.error(err.message);
                    $("#settings-local-kw-lists li['data-id'='" + enabledKW[i] + "'] span").trigger("click");
                }
            }
            else {
                logger.warn("No desired KW-file found in keywords directory!");
                $("#settings-local-kw-lists li[data-id='" + enabledKW[i] + "'] span").trigger("click");
            }
        }
    }
    // here you update kw-selector in case of same words in current file
    $("#file-chosen-kw-ul li").each(function (i) {//"#KW-selector"
        logger.debug("TESTING IF THE CURRENT FILE SELECTED KW ARE PRESENT IN SELECT-LIST");
        var kw_identificator = $(this).attr("data-value").substring(3, $(this).attr("data-value").length);
        $("#KW-selector option").each(function (i) {
            // FRIENDSHIP IS MAGIC! var value = $(this).attr("data-value").substring(3, test.length - 1);
            var kw_testvalue = $(this).val().substring(3, $(this).val().length);
            logger.debug("TESTING SELECTED KEYWORD----");
            if (kw_testvalue === kw_identificator) {
                // same and nice :3
                $(this).attr("disabled", "disabled");
            }
        });
    });
    logger.debug("re-calling SELECT2 for keyword selection in edit-view.....");
    $("#KW-selector").select2({
        placeholder: i18n.__('select2-kw-add-ph')
    });
}

/* Setting up KW-list-choosing  on SETTINGS-view (select2) */
function setSettingsLoadedKW() {
    logger.debug("setSettingsLoadedKW");
    $("#KW-selector").select2({
        placeholder: i18n.__('select2-kw-add-ph')
    });
    $('#KW-selector').on("select2:select", function (e) {
        //NEEDSTOBECHANGED save project to temp here
        // -> is saved in another onClick listener, specified in init.js

        //console.log(e);
        //console.log(this);
        //var kw_value = e.params.data.id;
        //var kw_text = e.params.data.text;

        var kw_text = e.params.data.id; // en-basic-13
        var kw_value = kw_text.substring(3, kw_text.length);// basic-13
        var kw_title = e.params.data.text; // Name is This

        //logger.debug("VALUE: "+kw_value + " # TEXT: " + kw_text);
        $('#KW-selector').val(null).trigger("change");
        $("#KW-selector option").each(function (i) {
            if ($(this).val().substring(3, $(this).val().length) === kw_value) {
                $(this).attr('disabled', 'disabled');
            }
        });

        var li_string = document.createTextNode(kw_title);
        var li_node = document.createElement("li");
        var span_node = document.createElement("span");

        li_node.appendChild(li_string);
        span_node.innerHTML = "&times;";

        $(li_node).attr({
            class: "w3-display-container",
            "data-value": kw_text
        });

        $(span_node).attr({
            style: "height: 100%;",
            class: "w3-button w3-display-right",
            onmouseover: "$(this.parentElement).addClass('w3-hover-blue');",
            onmouseout: "$(this.parentElement).removeClass('w3-hover-blue');",
            onclick: "$(\"#KW-selector option\").each(function(i){if($(this).val().substring(3, $(this).val().length) === \"" + kw_value + "\"){$(this).removeAttr('disabled', 'disabled')}}); $(\"#KW-selector\").select2({placeholder: i18n.__('select2-kw-add-ph')}); $(this.parentElement.parentElement).trigger({type: 'deleted', params : {data: '" + kw_text + "'}}); $(this.parentElement).remove();"
        });

        li_node.appendChild(span_node);

        $('#file-chosen-kw-ul').append(li_node);

        $("#KW-selector").select2({
            placeholder: i18n.__('select2-kw-add-ph')
        });
    });
    $('#KW-selector').prop("disabled", true);
}

/* Sets up select field for import wizard window */
function setImportSelect() {
    logger.debug("setImportSelect");
    var resultdata1 = "";
    var resultdata2 = "";
    var resultdata3 = "";
    var resultdata4 = "";
    try {
        //console.log(fs.readFileSync(path.join(__dirname, "../select2/surveytools.json"), "utf8"));
        resultdata1 = JSON.parse(fs.readFileSync(path.join(__dirname, "../select2/surveytools.json"), "utf8"));
        resultdata2 = JSON.parse(fs.readFileSync(path.join(__dirname, "../select2/delimiters.json"), "utf8"));
        resultdata3 = JSON.parse(fs.readFileSync(path.join(__dirname, "../select2/encodings.json"), "utf8"));
        resultdata4 = JSON.parse(fs.readFileSync(path.join(__dirname, "../select2/survey_template_versions.json"), "utf8"));
    }
    catch (err) {
        logger.error("Error opening >Import Wizard< file: " + err.message);
        return -1;
    }
    var testdata1 = $.map(resultdata1, function (obj) {
        obj.id = obj["id"];
        obj.text = obj["name"];
        return obj;
    });
    var testdata2 = $.map(resultdata2, function (obj) {
        obj.id = obj["id"];
        obj.text = obj["name"];
        return obj;
    });
    var testdata3 = $.map(resultdata3, function (obj) {
        obj.id = obj["id"];
        obj.text = obj["name"];
        return obj;
    });
    var testdata4 = $.map(resultdata4, function (obj) {
        obj.id = obj["id"];
        obj.text = obj["name"];
        return obj;
    });

    
    $("#import-select-tool").select2({
        placeholder: i18n.__('select2-surveytool-ph'),
        data: testdata1
    }
    );
    $("#import-select-delimiter").select2({
        placeholder: i18n.__('select2-delimiter-ph'),
        data: testdata2
    }//window.import_ready
    );
    $("#import-select-encoding").select2({
        placeholder: i18n.__('select2-encoding-ph'),
        data: testdata3
    }
    );
    $("#import-select-survey-ver").select2({
        placeholder: i18n.__('select2-survey-version-ph'),
        data: testdata4
    }
    );

    $("#import-select-tool").val(null).trigger("change");
    $("#import-select-delimiter").val("0").trigger("change");
    $("#import-select-encoding").val("0").trigger("change");
    $("#import-select-survey-ver").val(null).trigger("change");

    $("#import-select-tool").on("select2:select", function (e) { window.import_ready = false;});
    $("#import-select-delimiter").on("select2:select", function (e) { window.import_ready = false; });
    $("#import-select-encoding").on("select2:select", function (e) { window.import_ready = false; });
    //$("#import-select-survey-ver").on("select2:select", function (e) { window.import_ready = false; });

    return 0;
}

module.exports = {
    setAppLang: setAppLang,
    setCreateProjSelect: setCreateProjSelect,
    setSettingsLoadedKW: setSettingsLoadedKW,
    setupEditKW: setupEditKW,
    setEditSelects: setEditSelects,
    setImportSelect: setImportSelect
}