// Content script that runs on ChatGPT, Gemini, Claude sites
// Captures user prompts and sends them to the backend

const BACKEND_URL = 'http://localhost:8000';

console.log('Growth Garden extension loaded on:', window.location.hostname);

// Track the last sent prompt to avoid duplicates
let lastPrompt = null;

// Detect and capture new prompts from ChatGPT
function captureNewPrompts() {
  // Watch for changes in the DOM for new messages
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      // ChatGPT user messages typically have specific classes/structure
      // Adjust selectors based on ChatGPT's current DOM structure
      const userMessages = document.querySelectorAll('[data-message-author-role="user"]');
      
      if (userMessages.length > 0) {
        const lastMessage = userMessages[userMessages.length - 1];
        const promptText = lastMessage.textContent?.trim();
        
        // Only send if it's a new prompt (not duplicate)
        if (promptText && promptText !== lastPrompt) {
          lastPrompt = promptText;
          sendPromptToBackend(promptText);
        }
      }
    });
  });

  // Observe the entire document for changes
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: false,
  });
}

// Send prompt to the backend API
async function sendPromptToBackend(prompt) {
  try {
    const payload = {
      prompt: prompt,
      source: window.location.hostname,
      timestamp: new Date().toISOString(),
    };

    const response = await fetch(`${BACKEND_URL}/api/model`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      const result = await response.json();
      console.log('Backend response:', result);
      
      // Store the result locally
      chrome.storage.local.set({ lastBackendResult: result });
    } else {
      console.error('Backend error:', response.status);
    }
  } catch (error) {
    console.error('Error sending prompt to backend:', error);
  }
}

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getData') {
    chrome.storage.local.get(['lastBackendResult'], (result) => {
      sendResponse({ success: true, data: result.lastBackendResult });
    });
    return true; // Keep the channel open for async response
  }
});

// Start capturing prompts when the page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', captureNewPrompts);
} else {
  captureNewPrompts();
}
