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

// Request data from the currently active AI chatbot site
async function getDataFromChatbot() {
    try {
        // Get the currently active tab
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        // Only proceed if on a supported AI site
        const supportedSites = ['chatgpt.com', 'chat.openai.com', 'gemini.google.com', 'claude.ai'];
        const isSupported = supportedSites.some(site => tab.url.includes(site));
        
        if (!isSupported) {
            console.log('Not on a supported AI chatbot site');
            return null;
        }
        
        // Send message to content script
        const response = await chrome.tabs.sendMessage(tab.id, { action: 'getData' });
        return response.data;
    } catch (error) {
        console.error('Error getting data from chatbot:', error);
        return null;
    }
}

