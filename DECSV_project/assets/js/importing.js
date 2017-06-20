const links = document.querySelectorAll('link[rel="import"]');
logger.info("importing html-documents...");
// Import and add each page to the DOM
Array.prototype.forEach.call(links, function (link) {
    let template = link.import.querySelector('.phase-template');
    let clone = document.importNode(template.content, true);
    
    if (link.href.match('about.html')) {
      document.querySelector('body').appendChild(clone);
  } else {
      document.querySelector('.content').appendChild(clone);
  }
    
    document.querySelector('.content').appendChild(clone);
})