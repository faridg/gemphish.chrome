async function updateContent() {
    // get active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    try {
        // inject script if needed and get content
        const response = await chrome.tabs.sendMessage(tab.id, { action: 'getContent' });
        displayContent(response);
    } catch (e) {
        // if content script not injected, inject and retry
        await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['content-script.js']
        });
        const response = await chrome.tabs.sendMessage(tab.id, { action: 'getContent' });
        displayContent(response);
    }
}

function displayContent(data) {
    document.getElementById('title').textContent = data.title;
    document.getElementById('content').textContent = data.content;
    document.getElementById('url').textContent = data.url;
}

// listen for page changes
chrome.runtime.onMessage.addListener((request) => {
    if (request.action === 'pageChanged') {
        updateContent();
    }
});

// initial load
document.addEventListener('DOMContentLoaded', updateContent);
