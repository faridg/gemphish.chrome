// save options
function saveOptions() {
    const apiKey = document.getElementById('apiKey').value;
    chrome.storage.sync.set({ geminiApiKey: apiKey }, () => {
        const status = document.getElementById('status');
        status.textContent = 'Saved';
        setTimeout(() => {
            status.textContent = '';
        }, 1500);
    });
}

// restore options
function restoreOptions() {
    chrome.storage.sync.get('geminiApiKey', (result) => {
        if (result.geminiApiKey) {
            document.getElementById('apiKey').value = result.geminiApiKey;
        }
    });
}

document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('save').addEventListener('click', saveOptions);
