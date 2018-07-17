const remote = require("electron").remote;
//const Store = require("electron-config");
const fs = require("fs");
const path = require('path');

/* Setting up language selector for app language (select2) */
function setAppLang() {
    logger.debug("setAppLang");
    fs.readdirSync(path.join(__dirname, "..\\translations")).forEach(file => {
        if (file.split('.').pop() === "js") { return; }
        var lang = getFullLangName(file.split('.')[0]);
        logger.debug("LANGUAGE: " + lang);
        logger.debug("FILE: " + file);
        if (lang === null) {
            logger.warn("Requested language not defined in getFullLangName function!! Using placeholder 'NOT_DEFINED'...");
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

/* Setting up available kw-list selector (select2) */
function setKWListAvailable() {
    logger.debug("set_kw_list_available_select");
    $("#kw-list-available-choose").select2({
        placeholder: i18n.__('select2-kw-list-ph')
    });
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
function setupEditKW() {
    logger.debug("setupEditKW");
    var enabledKW = [];
    var apppath = remote.app.getPath('userData');

    $("#KW-selector").empty();
    $("#KW-selector").append(document.createElement("option"));

    logger.debug("getting enabled local lists...");
    $("#settings-local-kw-lists .kw-list-enabled").each(function (i) {
        var kw_list_id = $(this).attr("data-id");
        enabledKW.push(kw_list_id);
        logger.debug("ADDED: " + kw_list_id);
    });

    var kw_base = path.join(apppath, 'keywordlists');
    var kw_groups = [];
    var kw_current_group = "";
    logger.debug("GOING TO LOOP enabledKW now....");
    for (var i = 0; i < enabledKW.length; i++) {
        //logger.debug("Round: " + i);

        let loadedlist = [];
        if (fs.existsSync(path.join(kw_base, enabledKW[i] + '.json'))) {
            logger.info("KW file '" + enabledKW[i] + "' located!");
            try {
                //logger.debug("TRYING TO GET KW FILE CONTENTS AND LOOP 'EM");
                loadedlist = require(path.join(kw_base, enabledKW[i] + '.json'));
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
    // here you update kw-selector in case of same words in current file
    $("#file-chosen-kw-ul li").each(function (i) {//"#KW-selector"
        logger.debug("TESTING IF THE CURRENT FILE SELECTED KW ARE PRESENT IN SELECT-LIST");
        var kw_identificator = $(this).attr("data-value").substring(3, $(this).attr("data-value").length);
        $("#KW-selector option").each(function (i) {
            // FRIENDSHIP IS MAGIC! var value = $(this).attr("data-value").substring(3, test.length - 1);
            var kw_testvalue = $(this).val().substring(3, $(this).val().length);
            logger.debug("TESTING SELECTED KEYWORD----");
            //console.log("HUEHEUHEUEHUHEUEHEUHEUEUHUEHEUHEUEHUEHEUH");
            //console.log(this);
            //console.log($(this));
            //console.log("selected identificator: " + kw_identificator);
            //console.log("this VALUE: " + kw_testvalue);
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

        //console.log(e);
        //console.log(this);
        var kw_value = e.params.data.id;
        var kw_text = e.params.data.text;
        //logger.debug("VALUE: "+kw_value + " # TEXT: " + kw_text);
        $('#KW-selector').val(null).trigger("change");
        $("#KW-selector option").each(function (i) {
            if ($(this).val().substring(3, $(this).val().length) === kw_value.substring(3, kw_value.length)) {
                $(this).attr('disabled', 'disabled');
            }
        });

        var li_string = document.createTextNode(kw_text);
        var li_node = document.createElement("li");
        var span_node = document.createElement("span");

        li_node.appendChild(li_string);
        span_node.innerHTML = "&times;";

        $(li_node).attr({
            class: "w3-display-container",
            "data-value": kw_value
        });

        $(span_node).attr({
            style: "height: 100%;",
            class: "w3-button w3-display-right",
            onmouseover: "$(this.parentElement).addClass('w3-hover-blue');",
            onmouseout: "$(this.parentElement).removeClass('w3-hover-blue');",
            onclick: "$(\"#KW-selector option\").each(function(i){if($(this).val().substring(3, $(this).val().length) === \"" + kw_value.substring(3, kw_value.length) + "\"){$(this).removeAttr('disabled', 'disabled')}}); $(this.parentElement).remove(); $(\"#KW-selector\").select2({placeholder: i18n.__('select2-kw-add-ph')});"
        });
        // //NEEDSTOBECHANGED save project to temp here (when object deleted...) 
        li_node.appendChild(span_node);

        $('#file-chosen-kw-ul').append(li_node);

        $("#KW-selector").select2({
            placeholder: i18n.__('select2-kw-add-ph')
        });
    });
    $('#KW-selector').prop("disabled", true);
}

/* So that you get full displayed name for short identifier */
function getFullLangName(lang_short) {
    logger.debug("getFullLangName");
    var lang_full = null;

    switch (lang_short) {
        case "en":
            lang_full = "English";
            break;
        case "fi":
            lang_full = "Suomi";
            break;
        default:
        //
    }
    return lang_full;
}

/* Sets up select field for import wizard window */
function setImportSelect() {
    logger.debug("setImportSelect");
    var resultdata1 = "";
    try {
        console.log(fs.readFileSync(path.join(__dirname, "../select2/surveytools.json"), "utf8"));
        resultdata1 = JSON.parse(fs.readFileSync(path.join(__dirname, "../select2/surveytools.json"), "utf8"));
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
    
    $("#file-import-tool").select2({
        placeholder: i18n.__('select2-surveytool-ph'),
        data: testdata1
    }
    );

    $("#file-import-tool").val(null).trigger("change");

    return 0;
}

module.exports = {
    setAppLang: setAppLang,
    setKWListAvailable: setKWListAvailable,
    setCreateProjSelect: setCreateProjSelect,
    setSettingsLoadedKW: setSettingsLoadedKW,
    setupEditKW: setupEditKW,
    getFullLangName: getFullLangName,
    setEditSelects: setEditSelects,
    setImportSelect: setImportSelect
}