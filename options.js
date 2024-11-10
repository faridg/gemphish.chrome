// save options
function saveOptions() {
    const apiKey = document.getElementById('apiKey').value;
    chrome.storage.sync.set({ geminiApiKey: apiKey }, () => {
        const status = document.getElementById('status');
        status.textContent = 'Key Saved!';
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

// toggle api key visibility
function toggleKeyVisibility() {
    const input = document.getElementById('apiKey');
    const toggle = document.getElementById('toggleKey');
    
    if (input.type === 'password') {
        input.type = 'text';
        toggle.innerHTML = '&#x1F440;'; 
    } else {
        input.type = 'password';
        toggle.innerHTML = '&#x1F441;'; 
    }
}

// init
document.addEventListener('DOMContentLoaded', () => {
    restoreOptions();
    document.getElementById('save').addEventListener('click', saveOptions);
    document.getElementById('toggleKey').addEventListener('click', toggleKeyVisibility);
});
