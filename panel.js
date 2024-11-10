import { getDomainAge, getParentDomain } from './domain-utils.js';
import { generateSummary } from './api-utils.js';

// extract content from current tab and generate summary
async function updateContent() {
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab) return;

        // get domain info
        const domainAge = await getDomainAge(tab.url);
        const parentDomain = getParentDomain(new URL(tab.url).hostname);

        // show loading state
        displayLoading();

        // execute content extraction
        const [result] = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => {
                const contentElements = document.querySelectorAll('article, main, [role="main"], .main-content, #main-content');
                let content = '';
                
                if (contentElements.length) {
                    content = contentElements[0].innerText;
                } else {
                    const paragraphs = document.querySelectorAll('p');
                    content = Array.from(paragraphs)
                        .map(p => p.innerText)
                        .join('\n\n');
                }
                
                return {
                    title: document.title,
                    content: content.trim(),
                    url: window.location.href
                };
            }
        });

        // generate summary
        const summary = await generateSummary(result.result.content);

        displayContent({
            ...result.result,
            summary,
            domainAge,
            parentDomain
        });
    } catch (e) {
        console.error('Failed to update content:', e);
        displayError(e.message);
    }
}

// display loading state
function displayLoading() {
    document.getElementById('title').textContent = 'Generating summary...';
    document.getElementById('content').innerHTML = '<div class="loading">⏳</div>';
}

// display error state
function displayError(message) {
    document.getElementById('content').textContent = `Error: ${message}`;
}

// update ui with content
function displayContent(data) {
    document.getElementById('title').textContent = data.title;
    document.getElementById('content').textContent = data.summary;
    document.getElementById('url').textContent = data.url;
    document.getElementById('domain-age').textContent = 
        `${data.parentDomain} - ${data.domainAge}`;
}

// open options page
function openOptions() {
    chrome.runtime.openOptionsPage();
}

// watch for tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete') {
        updateContent();
    }
});

// init
document.addEventListener('DOMContentLoaded', () => {
    updateContent();
    document.getElementById('settings').addEventListener('click', openOptions);
});
