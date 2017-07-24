const links = document.querySelectorAll('link[rel="import"]');
logger.info("Importing html-documents...");
// Import and add each page to the DOM. This DOESN'T use jquery just yet!
Array.prototype.forEach.call(links, function (link) {
    let template = link.import.querySelector('.phase-template');
    let clone = document.importNode(template.content, true);

    if (link.href.match('about.html') || link.href.match('login.html')) {
        document.querySelector('body').appendChild(clone);
    } else {
        document.querySelector('.content').appendChild(clone);
    }

    document.querySelector('.content').appendChild(clone);
    logger.info("Imported: " + link.href);
});