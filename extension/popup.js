document.addEventListener("DOMContentLoaded", hydratePopup);

async function hydratePopup() {
  const scoreElement = document.getElementById("prompt-score");
  const tagsElement = document.getElementById("prompt-tags");

  if (!scoreElement || !tagsElement) {
    return;
  }

  const result = await getLatestResult();

  if (!result) {
    scoreElement.textContent = "--";
    tagsElement.textContent =
      "No prompt result cached yet. Refresh a supported chatbot tab after loading the extension.";
    return;
  }

  scoreElement.textContent =
    typeof result.final_score === "number" ? result.final_score.toFixed(2) : "--";
  tagsElement.textContent =
    Array.isArray(result.tags) && result.tags.length > 0
      ? result.tags.join(" | ")
      : "No relevant tags returned yet.";
}

async function getLatestResult() {
  const result = await chrome.storage.local.get(["lastBackendResult"]);
  return result.lastBackendResult ?? null;
}
