function openSite() {
  chrome.tabs.create({ url: "http://localhost:3000/metrics" });
}

async function getDataFromChatbot() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.url) {
      return null;
    }

    const supportedSites = [
      "chatgpt.com",
      "chat.openai.com",
      "gemini.google.com",
      "claude.ai",
    ];
    const isSupported = supportedSites.some((site) => tab.url.includes(site));

    if (!isSupported) {
      console.log("Not on a supported AI chatbot site");
      return null;
    }

    const response = await chrome.tabs.sendMessage(tab.id, { action: "getData" });
    return response?.data ?? null;
  } catch (error) {
    console.error("Error getting data from chatbot:", error);
    return null;
  }
}

async function hydratePopup() {
  const scoreElement = document.getElementById("prompt-score");
  const tagsElement = document.getElementById("prompt-tags");

  if (!scoreElement || !tagsElement) {
    return;
  }

  const result = await getDataFromChatbot();

  if (!result) {
    scoreElement.textContent = "--";
    tagsElement.textContent =
      "Open a supported chatbot tab to see prompt feedback.";
    return;
  }

  scoreElement.textContent =
    typeof result.final_score === "number" ? result.final_score.toFixed(2) : "--";

  if (Array.isArray(result.tags) && result.tags.length > 0) {
    tagsElement.textContent = result.tags.join(" | ");
  } else {
    tagsElement.textContent = "No tags returned yet.";
  }
}

document.addEventListener("DOMContentLoaded", hydratePopup);
