// Check if localhost is available
function isLocalhostAvailable() {
    // TODO: Implement actual localhost check
    return false;
}

// Open the site (localhost if available, otherwise static site)
function openSite() {
    const url = isLocalhostAvailable() ? 'http://localhost:3000' : chrome.runtime.getURL('site.html');
    chrome.tabs.create({ url: url });
}
