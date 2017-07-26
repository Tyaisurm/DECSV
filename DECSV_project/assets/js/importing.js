const links = document.querySelectorAll('link[rel="import"]');
logger.info("Importing html-documents...");
// Import and add each page to the DOM. This DOESN'T use jquery just yet!
Array.prototype.forEach.call(links, function (link) {
    let template = link.import.querySelector('.phase-template');
    let clone = document.importNode(template.content, true);


    document.querySelector('.content').appendChild(clone);

    //document.querySelector('.content').appendChild(clone);
    logger.debug("Imported: " + link.href);
});
logger.info("Done importing!");