const WASM_MOD_URL = chrome.runtime.getURL('pkg/grs_wasm.js');

// Import Wasm module binding using dynamic import.
// "init" may fail if the current site CSP restricts the use of Wasm (e.g. any github.com page).
// In this case instantiate module in the background worker (see background.js) and use message passing.
const loadWasmModule = async () => {
  const mod = await import(WASM_MOD_URL);

  // default export is an init function
  const isOk = await mod.default().catch((e) => {
    console.warn('Failed to init wasm module in content script. Probably CSP of the page has restricted wasm loading.', e);
    return null;
  });

  return isOk ? mod : null;
};

function walk(node, color, scan_text_closure) {
  if (node.nodeType === Node.TEXT_NODE) {
    const diagnostics = scan_text_closure(node.textContent);
    if (diagnostics.length > 0) {
      highlightNode(node, color, diagnostics);
    }
  } else {
    node.childNodes.forEach((node) => walk(node, color, scan_text_closure));
  }
}

function highlightNode(node, color, diagnostics) {
  // Note that this whole highlight logic won't work well
  // if two diagnostic ranges happen to overlap.
  //
  // We can not simply iterate the diagnostics, instead...
  //
  // (Partially) deal with overlap by highlighting once
  // but showing all kinds at that range.
  const diagnosticsGrouped = new Map();
  for (const { kind, range, fix } of diagnostics) {
    const key = JSON.stringify(range);
    if (!diagnosticsGrouped.has(key)) {
      diagnosticsGrouped.set(key, []);
    }
    diagnosticsGrouped.get(key).push(kind);
  }

  let modifiedText = node.textContent;
  let offset = 0;
  for (const [key, kindArray] of diagnosticsGrouped) {
    const range = JSON.parse(key);
    const kinds = kindArray.join(", ");
    const start = range.start + offset;
    const end = range.end + offset;
    const highlightedText = `<span style="background-color: ${color};" title="${kinds}">${modifiedText.slice(start, end)}</span>`;
    modifiedText = modifiedText.slice(0, start) + highlightedText + modifiedText.slice(end);
    offset += highlightedText.length - (end - start);
  }
  const parent = node.parentNode;
  const tempElement = document.createElement("span");
  tempElement.innerHTML = modifiedText;
  parent.replaceChild(tempElement, node);
}

// There must be sth better
async function getColor() {
  return new Promise((resolve) => {
    chrome.storage.local.get("selectedColor", (data) => {
      resolve(data.selectedColor);
    });
  });
}

async function scanPage() {
  const mod = await loadWasmModule();
  const color = await getColor();

  if (mod) {
    console.log("Running scanPage with color: " + color);

    const { scan_text } = mod;
    const cnt = {};

    walk(document.body, color, (textContent) => {
      try {
        const diagnostics = scan_text(textContent);
        for (const { kind, range, fix } of diagnostics) {
          cnt[kind] = (cnt[kind] || 0) + 1;
        }
        return diagnostics;
      } catch (e) {
        console.log(e);
        console.log("Failed with text " + textContent);
      }
    });

    console.log("Diagnostics counter: " + JSON.stringify(cnt));
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Received message:", message);

  if (message.action === "runScan") {
    console.log("Running scanPage...");
    if (typeof scanPage === "function") {
      scanPage();
      sendResponse({ status: "Scan started" });
    } else {
      console.error("scanPage() is not defined!");
      sendResponse({ status: "Error: scanPage() not found" });
    }
  }
});

console.log("Content script loaded!");

scanPage();
