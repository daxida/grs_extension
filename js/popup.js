// To inspect the console logs, one has to open the popup's devtools
// (as opposed to the default webpage's devtools that is opened in chrome)

function handleError(response) {
  if (chrome.runtime.lastError) {
    console.error("[POPUP] Error sending message:", JSON.stringify(chrome.runtime.lastError));
  } else {
    console.log("[POPUP] Scan triggered:", response?.status);
  }
}

document.addEventListener('DOMContentLoaded', function() {
  const colorPicker = document.getElementById('color-picker');
  const toMonotonicButton = document.getElementById("to-monotonic");
  const ruleButtons = document.getElementsByClassName("rule-btn");
  let debounceTimer;

  // COLORS
  // Load the stored color if it exists
  chrome.storage.local.get('selectedColor', function(result) {
    if (result.selectedColor) {
      colorPicker.value = result.selectedColor;
    }
  });

  // Debounced function to save color once user stops input
  function saveColor() {
    const selectedColor = colorPicker.value;
    chrome.storage.local.set({ selectedColor: selectedColor });
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length === 0) return;
      chrome.tabs.sendMessage(tabs[0].id, { action: "runScan" }, handleError)
    });
  }

  colorPicker.addEventListener('input', function() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(saveColor, 500);
  });

  // MONOTONIC
  toMonotonicButton.addEventListener("click", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length === 0) return;
      chrome.tabs.sendMessage(tabs[0].id, { action: "runToMono" }, handleError)
    });
  });

  // RULES
  chrome.storage.local.get('ruleStates', function(result) {
    const ruleStates = result.ruleStates || {};
    Array.from(ruleButtons).forEach(button => {
      const rule = button.dataset.rule;
      if (ruleStates[rule] === false) {
        button.classList.add("inactive");
      }
    });
  });

  // Send the rule on the clicked button to content.js
  Array.from(ruleButtons).forEach(button => {
    button.addEventListener("click", () => {
      const rule = button.dataset.rule;
      // Modify the class to apply the CSS (but not contents.js config object!).
      button.classList.toggle("inactive");
      // Get the current states from storage and update
      chrome.storage.local.get('ruleStates', function(result) {
        const ruleStates = result.ruleStates || {};
        ruleStates[rule] = !button.classList.contains("inactive");
        chrome.storage.local.set({ ruleStates: ruleStates });
      });
      // Modify contents.js config and scan the page again. 
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs.length === 0) return;
        chrome.tabs.sendMessage(tabs[0].id, { action: "setRule", rule: rule }, handleError);
      });
    });
  });
});
