// Use static import
import initWasmModule, { hello_background } from './wasm/wasm_mod.js';

(async () => {
  await initWasmModule();
  hello_background();
})();

// Listens for the extension button click and sends a message to the content script.
chrome.action.onClicked.addListener((tab) => {
  chrome.tabs.sendMessage(tab.id, { action: "runScan" });
});
