document.addEventListener('DOMContentLoaded', function() {
  const colorPicker = document.getElementById('color-picker');
  const saveButton = document.getElementById('save-button');

  // Load the stored color if it exists
  chrome.storage.local.get('selectedColor', function(result) {
    if (result.selectedColor) {
      colorPicker.value = result.selectedColor;
    }
  });

  // Save the color to chrome.storage.local when the user clicks the Save button
  saveButton.addEventListener('click', function() {
    const selectedColor = colorPicker.value;
    chrome.storage.local.set({ selectedColor: selectedColor });
    // Test
    chrome.storage.local.get("selectedColor", (data) => {
      console.log("Stored color:", data.selectedColor);
      alert("Stored color: " + data.selectedColor);
    });

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
  });
});
