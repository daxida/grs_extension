// Use static import
import initWasmModule from './wasm/wasm_mod.js';

(async () => {
  await initWasmModule();
})();

// Listens for the extension button click and sends a message to the content script.
chrome.action.onClicked.addListener((tab) => {
  chrome.tabs.sendMessage(tab.id, { action: "runScan" });
});
