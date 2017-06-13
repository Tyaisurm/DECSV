/*THIS FILE WILL HAVE FUNCTIONALITY ABOUT TAKING KEYWORDS*/
/*
function getHighlightedWords() {
    var text = "";
    var activeEl = document.activeElement;
    var activeElTagName = activeEl ? activeEl.tagName.toLowerCase() : null;
    if (
        (activeElTagName == "textarea") || (activeElTagName == "input" &&
            /^(?:text|search|password|tel|url)$/i.test(activeEl.type)) &&
        (typeof activeEl.selectionStart == "number")
    ) {
        text = activeEl.value.slice(activeEl.selectionStart, activeEl.selectionEnd);
    } else if (window.getSelection) {
        text = window.getSelection().toString();
    }
    console.log(">>>>>>>>>>>>>>HUEHUEHUEHUEHUEHUEHUEHUHEUHUEHUEHUEHU");
    console.log(text);
}
*/

/* So far, this is only used as a "global storage" :S */
var survey_data_storage = null;
function set_survey_data(data){
    survey_data_storage = data;
}
function get_survey_data(data) {
    return survey_data_storage;
}