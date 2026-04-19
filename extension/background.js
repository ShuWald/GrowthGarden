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
  let response;

  try {
    response = await fetch(`${BACKEND_URL}/api/prompts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    throw new Error(
      `Unable to reach backend at ${BACKEND_URL}: ${error instanceof Error ? error.message : "unknown fetch error"}`,
    );
  }

  if (!response.ok) {
    let detail = "";

    try {
      const body = await response.json();
      detail = typeof body.detail === "string" ? body.detail : "";
    } catch {
      detail = await response.text();
    }

    throw new Error(
      detail
        ? `Backend returned ${response.status}: ${detail}`
        : `Backend returned ${response.status}`,
    );
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
