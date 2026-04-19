const BACKEND_URL = "http://localhost:8000";

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "submitPrompt") {
    submitPromptToBackend(request.payload)
      .then((result) => sendResponse({ success: true, data: result }))
      .catch((error) => {
        console.error("Background backend error:", error);
        sendResponse({
          success: false,
          error: error instanceof Error ? error.message : "Unknown backend error",
        });
      });
    return true;
  }

  if (request.action === "getLatestResult") {
    chrome.storage.local.get(["lastBackendResult"], (result) => {
      sendResponse({ success: true, data: result.lastBackendResult ?? null });
    });
    return true;
  }
});

async function submitPromptToBackend(payload) {
  const response = await fetch(`${BACKEND_URL}/api/prompts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Backend returned ${response.status}`);
  }

  const result = await response.json();
  const filteredResult = {
    final_score:
      typeof result.final_score === "number" ? result.final_score : null,
    tags: Array.isArray(result.tags) ? result.tags : [],
    recorded_at: typeof result.recorded_at === "string" ? result.recorded_at : "",
  };

  await chrome.storage.local.set({ lastBackendResult: filteredResult });
  return filteredResult;
}
