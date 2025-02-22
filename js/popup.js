document.addEventListener('DOMContentLoaded', function() {
  const colorPicker = document.getElementById('color-picker');
  let debounceTimer;

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

      chrome.tabs.sendMessage(tabs[0].id, { action: "runScan" }, (response) => {
        if (chrome.runtime.lastError) {
          console.error("Error sending message:", JSON.stringify(chrome.runtime.lastError));
        } else {
          console.log("Scan triggered:", response?.status);
        }
      });
    });
  }

  colorPicker.addEventListener('input', function() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(saveColor, 500);
  });
});
