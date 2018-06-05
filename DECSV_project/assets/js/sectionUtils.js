// SETTING UP SELECTING WORDS
function setupCensorSelect() {
    logger.debug("setupCensorSelect");
    $("#edit-A-edit-text .word").off("click");
    $("#edit-B-edit-text .word").off("click");
    $("#edit-C-edit-text .word").off("click");

    $("#edit-A-edit-text .word").on("click", function () {
        var clicked = $(this).text();
        logger.debug("CLIECKED: " + clicked);
        if ($(this).hasClass("censored")) {
            $(this).removeClass("censored");
            logger.debug("REMOVE censored");
        }
        else {
            $(this).addClass("censored");
            logger.debug("ADDING censored");
        }
    });
    $("#edit-B-edit-text .word").on("click", function () {
        var clicked = $(this).text();
        logger.debug("CLIECKED: " + clicked);
        if ($(this).hasClass("censored")) {
            $(this).removeClass("censored");
            logger.debug("REMOVE censored");
        }
        else {
            $(this).addClass("censored");
            logger.debug("ADDING censored");
        }
    });
    $("#edit-C-edit-text .word").on("click", function () {
        var clicked = $(this).text();
        logger.debug("CLIECKED: " + clicked);
        if ($(this).hasClass("censored")) {
            $(this).removeClass("censored");
            logger.debug("REMOVE censored");
        }
        else {
            $(this).addClass("censored");
            logger.debug("ADDING censored");
        }
    });
}


function setupCsectionUI() {
    logger.debug("setupCsectionUI");
    for (var f = 1; f < 15; f++) {
        var realdata = "";
        var classStr = "secC-Q-" + f + "-cont";
        if (document.getElementById("edit-C-edit-text").getElementsByClassName(classStr)[0].hasAttribute("data-real")) { // has data-real attr
            if ($("#edit-C-edit-text ." + classStr).attr("data-real").length !== 0) {// has non-empty real-data attr

                realdata = JSON.parse($("#edit-C-edit-text ." + classStr).attr("data-real"));

                if (f === 1) {
                    $("#edit-C-edit-text ." + classStr).text(i18n.__("field-of-study-" + realdata.toString()));
                }
                else if (f === 3) {
                    $("#edit-C-edit-text ." + classStr).text(i18n.__("age-" + (realdata - 1).toString()));
                }
                else if (f === 4) {
                    $("#edit-C-edit-text ." + classStr).text(i18n.__("gender-" + (realdata - 1).toString()));
                }
                else if (f === 5) {
                    $("#edit-C-edit-text ." + classStr).text(i18n.__("study-year-" + (realdata - 1).toString()));
                }
                else if (f === 6) {
                    $("#edit-C-edit-text ." + classStr).text(i18n.__("work-placement-" + realdata.toString()));
                }
                else if (f === 8) {//array!!! if there is one
                    var temparr = [];
                    for (var s = 0; s < realdata.length; s++) {
                        temparr.push(i18n.__("event-related-" + realdata[s].toString()));
                    }
                    $("#edit-C-edit-text ." + classStr).text(temparr.toString());
                }
                else if (f === 10) {
                    $("#edit-C-edit-text ." + classStr).text(i18n.__("event-type-" + (realdata - 1).toString()));
                }
                else if (f === 11) {
                    $("#edit-C-edit-text ." + classStr).text(i18n.__("report-document-" + (realdata - 1).toString()));
                }
                else if (f === 13) {
                    $("#edit-C-edit-text ." + classStr).text(i18n.__("report-document-" + (realdata - 1).toString()));
                }
                //$("#edit-C-edit-text ." + classStr).addClass("w3-light-blue"); //adding background color
            }
            else {// data-real exists but nothing inside...
                $("#edit-C-edit-text ." + classStr).text("");
            }
        }
        else {// no data-real attr. no need to do anything for this...
            //
        }
        //$("#edit-C-edit-text " + classStr).text(i18n.__(""));
    }

    $("#edit-C-orig-text").html($("#edit-C-edit-text").html())
}

/* Clears UI for section C where translations were used */
function clearCsectionUI() {
    logger.debug("clearCsectionUI");
    for (var f = 1; f < 15; f++) {
        var classStr = "secC-Q-" + f + "-cont";
        var elem = document.getElementById("edit-C-orig-text").getElementsByClassName("secC-Q-" + f + "-cont")[0];
        if (elem === undefined) { // there is no such element. just quitting...
            logger.debug("NO FOUND ELEMENT TO CLEAR!!!!!");
            return;
        }
        if (elem.hasAttribute("data-real")) {
            logger.debug("emptying: " + elem.id);
            $("#edit-C-orig-text ." + classStr).empty();
            //$("#edit-C-edit-text ." + classStr).removeClass("w3-light-blue"); //remove background color
        }
    }
}

/* Update shown list of currently censored lists for each section A, B and C */
function updateCensoredList() {
    logger.debug("updateCensoredList");
    $("#file-censored-A-ul").empty();
    $("#file-censored-B-ul").empty();
    $("#file-censored-C-ul").empty();
    //Section A
    $("#edit-A-orig-text .censored").each(function (i) {
        var to_appended = '<li class="w3-display-container">' + $(this).text() + '</li>';
        $("#file-censored-A-ul").append(to_appended);
    });
    //Section B
    $("#edit-B-orig-text .censored").each(function (i) {
        var to_appended = '<li class="w3-display-container">' + $(this).text() + '</li>';
        $("#file-censored-B-ul").append(to_appended);
    });
    //Section C
    $("#edit-C-orig-text .censored").each(function (i) {
        var to_appended = '<li class="w3-display-container">' + $(this).text() + '</li>';
        $("#file-censored-C-ul").append(to_appended);
    });
}

/* Update EDIT-view preview sections (non-editable section A, B and C) */
function updatePreview() {
    logger.debug("updatePreview");
    //
    $("#preview-preview-A").html($("#edit-A-orig-text").html());
    $("#preview-preview-B").html($("#edit-B-orig-text").html());
    $("#preview-preview-C").html($("#edit-C-orig-text").html());
    removeCensored();
    $("#preview-preview-A .secA-Q-allA").text($("#preview-preview-A .secA-Q-allA").text());
    $("#preview-preview-B .secB-Q-allA").text($("#preview-preview-B .secB-Q-allA").text());

    for (var i = 1; i < 15; i++) {
        $("#preview-preview-C .secC-Q-allA .secC-Q-" + i + "-cont").text($("#preview-preview-C .secC-Q-allA .secC-Q-" + i + "-cont").text());
    }
}

/* Turns .word with .censored class into " ***** " */
function removeCensored() {
    logger.debug("removeCensored");
    //Section A
    $("#preview-preview-A .secA-Q-allA .censored").each(function (i) {
        $(this).text("*****");
    });
    //Section B
    $("#preview-preview-B .secB-Q-allA .censored").each(function (i) {
        $(this).text("*****");
    });
    //Section C

    $("#preview-preview-C .secC-Q-allA .censored").each(function (i) {
        $(this).text("*****");
    });

}

/* Empty contents of all elements */
function clearElements() {
    logger.debug("clearElements");
    $("#proj-files-ul").empty();
    $("#proj-notes-ul").empty();
    $("#file-chosen-kw-ul").empty();
    $("#proj-info-kw-ul").empty();
    $("#proj-info-files-ul").empty();

    $("#preview-preview-A").empty();
    $("#preview-preview-B").empty();
    $("#preview-preview-C").empty();

    $("#edit-A-edit-text").empty();
    $("#edit-A-orig-text").empty();
    $("#edit-B-edit-text").empty();
    $("#edit-B-orig-text").empty();
    $("#edit-C-edit-text").empty();
    $("#edit-C-orig-text").empty();

    $("#file-censored-A-ul").empty();
    $("#file-censored-B-ul").empty();
    $("#file-censored-C-ul").empty();
}

module.exports = {
    clearCsectionUI: clearCsectionUI,
    setupCensorSelect: setupCensorSelect,
    setupCsectionUI: setupCsectionUI,
    updateCensoredList: updateCensoredList,
    updatePreview: updatePreview,
    removeCensored: removeCensored,
    clearElements: clearElements

}