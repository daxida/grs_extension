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

function walk(node, iterNode) {
  if (node.nodeType === Node.TEXT_NODE) {
    iterNode(node);
  } else {
    node.childNodes.forEach((node) => walk(node, iterNode));
  }
}

function groupDiagnostics(diagnostics) {
  // Note that this whole highlight logic won't work well
  // if two diagnostic ranges happen to overlap.
  //
  // We can not simply iterate the diagnostics, instead...
  //
  // (Partially) deal with overlap by highlighting once
  // but showing all kinds at that range.
  const grouped = new Map();
  for (const { kind, range, fix } of diagnostics) {
    const key = JSON.stringify(range);
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key).push(kind);
  }
  return grouped;
}

const SPAN_CLASS = "grs-highlight";

function highlightNode(node, color, diagnostics) {
  let modifiedText = node.textContent;
  let offset = 0;
  for (const [key, kindArray] of groupDiagnostics(diagnostics)) {
    const range = JSON.parse(key);
    const kinds = kindArray.join(", ");
    const start = range.start + offset;
    const end = range.end + offset;

    const style = `"background-color: ${color};"`;
    const textSlice = modifiedText.slice(start, end);
    const highlightedText = `<span class=${SPAN_CLASS} style=${style} title="${kinds}">${textSlice}</span>`;
    modifiedText = modifiedText.slice(0, start) + highlightedText + modifiedText.slice(end);
    offset += highlightedText.length - (end - start);
  }
  const parent = node.parentNode;
  const tempElement = document.createElement("span");
  tempElement.innerHTML = modifiedText;
  parent.replaceChild(tempElement, node);
}

function removeHighlights() {
  document.querySelectorAll(`.${SPAN_CLASS}`).forEach(span => {
    span.replaceWith(...span.childNodes);
  });
}

async function scanPage() {
  const mod = await loadWasmModule();
  if (!mod) return;

  chrome.storage.local.get("selectedColor", (data) => {
    const color = data.selectedColor || "#FFFF00"; // Default to yellow if not set
    scanPageGo(mod, color);
  });
}

function scanPageGo(mod, color) {
  console.log("Running scanPage with color: " + color);

  const { scan_text } = mod;
  const cnt = {};

  const iterNode = (node) => {
    try {
      const diagnostics = scan_text(node.textContent);
      for (const { kind, range, fix } of diagnostics) {
        cnt[kind] = (cnt[kind] || 0) + 1;
      }
      if (diagnostics.length > 0) {
        highlightNode(node, color, diagnostics);
      }
    } catch (e) {
      console.log(e);
      console.log("Failed with text " + textContent);
    }
  }

  walk(document.body, iterNode);

  console.log("Diagnostics counter: " + JSON.stringify(cnt));
}

async function toMonotonic() {
  const mod = await loadWasmModule();
  if (!mod) return;
  toMonotonicGo(mod);
}

function toMonotonicGo(mod) {
  const { to_monotonic } = mod;
  const iterNode = (node) => {
    node.textContent = to_monotonic(node.textContent);
  }
  walk(document.body, iterNode);
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Received message:", message);

  switch (message.action) {
    case "runScan":
      console.log("[L] Running scanPage...");
      scanPage();
      sendResponse({ status: "Scan started" });
      break;

    case "runToMono":
      console.log("[L] Running toMonotonicConversion...");
      removeHighlights();
      toMonotonic();
      scanPage();
      sendResponse({ status: "Monotonic conversion started" });
      break;

    default:
      console.warn("[L] Unknown action received:", message.action);
      sendResponse({ status: "Unknown action" });
  }
});

console.log("Content script loaded!");

scanPage();
