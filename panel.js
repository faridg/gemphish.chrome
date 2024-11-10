document.addEventListener('DOMContentLoaded', async () => {
    // get active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // inject content script
    await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content-script.js']
    });
    
    // request content
    chrome.tabs.sendMessage(tab.id, { action: 'getContent' }, response => {
        document.getElementById('title').textContent = response.title;
        document.getElementById('content').textContent = response.content;
    });
});
