// Content script that runs on ChatGPT, Gemini, Claude sites
// Captures user prompts and sends them to the backend

const BACKEND_URL = "http://localhost:8000";

console.log("Growth Garden extension loaded on:", window.location.hostname);

let lastPrompt = null;
let indicatorElement = null;

function captureNewPrompts() {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach(() => {
      const userMessages = document.querySelectorAll(
        '[data-message-author-role="user"]',
      );

      if (userMessages.length > 0) {
        const lastMessage = userMessages[userMessages.length - 1];
        const promptText = lastMessage.textContent?.trim();

        if (promptText && promptText !== lastPrompt) {
          lastPrompt = promptText;
          sendPromptToBackend(promptText);
        }
      }
    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: false,
  });
}

async function sendPromptToBackend(prompt) {
  try {
    const payload = {
      prompt,
      source: window.location.hostname,
      timestamp: new Date().toISOString(),
    };

    const response = await fetch(`${BACKEND_URL}/api/prompts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      const result = await response.json();
      console.log("Backend response:", result);
      chrome.storage.local.set({ lastBackendResult: result });
      renderIndicator(result);
    } else {
      console.error("Backend error:", response.status);
      renderIndicator({
        final_score: null,
        tags: ["backend-error"],
      });
    }
  } catch (error) {
    console.error("Error sending prompt to backend:", error);
    renderIndicator({
      final_score: null,
      tags: ["connection-error"],
    });
  }
}

function renderIndicator(result) {
  if (!indicatorElement) {
    indicatorElement = document.createElement("div");
    indicatorElement.id = "growth-garden-indicator";
    indicatorElement.style.position = "fixed";
    indicatorElement.style.right = "16px";
    indicatorElement.style.bottom = "16px";
    indicatorElement.style.zIndex = "999999";
    indicatorElement.style.maxWidth = "260px";
    indicatorElement.style.padding = "12px 14px";
    indicatorElement.style.borderRadius = "16px";
    indicatorElement.style.background = "rgba(248, 245, 236, 0.96)";
    indicatorElement.style.border = "1px solid rgba(197, 207, 191, 0.95)";
    indicatorElement.style.boxShadow =
      "0 18px 48px -28px rgba(41, 62, 45, 0.45)";
    indicatorElement.style.color = "#243127";
    indicatorElement.style.fontFamily = '"Avenir Next", "Segoe UI", sans-serif';
    indicatorElement.style.backdropFilter = "blur(10px)";
    document.body.appendChild(indicatorElement);
  }

  const scoreText =
    typeof result.final_score === "number"
      ? result.final_score.toFixed(2)
      : "Unavailable";
  const tags = Array.isArray(result.tags) ? result.tags.slice(0, 3) : [];

  indicatorElement.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;">
      <div>
        <div style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#6c8a62;font-weight:700;">
          Growth Garden
        </div>
        <div style="margin-top:6px;font-size:24px;font-weight:700;font-family:Georgia, serif;">
          ${scoreText}
        </div>
      </div>
      <div style="width:12px;height:12px;border-radius:999px;background:${getIndicatorColor(result.final_score)};"></div>
    </div>
    <div style="margin-top:8px;font-size:12px;line-height:1.5;color:rgba(36,49,39,0.76);">
      ${tags.length > 0 ? tags.join(" | ") : "No category tags returned yet"}
    </div>
  `;
}

function getIndicatorColor(score) {
  if (typeof score !== "number") {
    return "#ba8f6f";
  }
  if (score >= 4) {
    return "#6c8a62";
  }
  if (score >= 2.5) {
    return "#d3b26f";
  }
  return "#bf6f5d";
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getData") {
    chrome.storage.local.get(["lastBackendResult"], (result) => {
      sendResponse({ success: true, data: result.lastBackendResult });
    });
    return true;
  }
});

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", captureNewPrompts);
} else {
  captureNewPrompts();
}
