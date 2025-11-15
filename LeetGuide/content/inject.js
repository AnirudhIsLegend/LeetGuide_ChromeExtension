console.log("🔥 inject.js loaded into page context!");
  
function getEditorCode() {
    try {
      const models = window.monaco?.editor?.getModels();
      if (models && models.length > 0) {
        return models[0].getValue();
      }
    } catch (e) {}
    return null;
  }
  
  window.addEventListener("leetguide-get-code", () => {
    const code = getEditorCode();
    window.dispatchEvent(new CustomEvent("leetguide-code-response", {
      detail: { code }
    }));
  });
  