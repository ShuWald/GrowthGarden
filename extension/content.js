const SUPPORTED_HOSTS = [
  "chatgpt.com",
  "chat.openai.com",
  "gemini.google.com",
  "claude.ai",
];

let lastPrompt = null;
let indicatorElement = null;

if (SUPPORTED_HOSTS.some((host) => window.location.hostname.includes(host))) {
  initializePromptCapture();
}

function initializePromptCapture() {
  document.addEventListener("keydown", handlePromptSubmitKeydown, true);
  document.addEventListener("click", handlePromptSubmitClick, true);
}

function handlePromptSubmitKeydown(event) {
  if (event.key !== "Enter" || event.shiftKey) {
    return;
  }

  const prompt = readActivePromptInput();
  if (prompt) {
    submitPrompt(prompt);
  }
}

function handlePromptSubmitClick(event) {
  const target = event.target instanceof Element ? event.target : null;
  if (!target) {
    return;
  }

  const button = target.closest("button");
  if (!button) {
    return;
  }

  const buttonText = button.textContent?.toLowerCase() ?? "";
  const ariaLabel = button.getAttribute("aria-label")?.toLowerCase() ?? "";
  const title = button.getAttribute("title")?.toLowerCase() ?? "";
  const combinedLabel = `${buttonText} ${ariaLabel} ${title}`;

  if (!/(send|submit|up|arrow)/.test(combinedLabel)) {
    return;
  }

  const prompt = readActivePromptInput();
  if (prompt) {
    submitPrompt(prompt);
  }
}

function readActivePromptInput() {
  const selectors = [
    "textarea",
    '[contenteditable="true"]',
    '[role="textbox"]',
    "div.ProseMirror",
  ];

  for (const selector of selectors) {
    const elements = document.querySelectorAll(selector);
    for (const element of elements) {
      const text = extractTextFromElement(element);
      if (text) {
        return text;
      }
    }
  }

  return null;
}

function extractTextFromElement(element) {
  if (element instanceof HTMLTextAreaElement || element instanceof HTMLInputElement) {
    return element.value.trim();
  }

  return element.textContent?.trim() ?? "";
}

async function submitPrompt(prompt) {
  if (!prompt || prompt === lastPrompt) {
    return;
  }

  lastPrompt = prompt;

  try {
    const response = await chrome.runtime.sendMessage({
      action: "submitPrompt",
      payload: {
        prompt,
        source: window.location.hostname,
        timestamp: new Date().toISOString(),
      },
    });

    if (response?.success) {
      renderIndicator(response.data);
      return;
    }

    renderIndicator({
      final_score: null,
      tags: [response?.error ?? "backend-error"],
    });
  } catch (error) {
    console.error("Error sending prompt to backend:", error);
    renderIndicator({
      final_score: null,
      tags: [error instanceof Error ? error.message : "connection-error"],
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
      ${tags.length > 0 ? tags.join(" | ") : "No relevant tags returned yet"}
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
