import { getDomainAge, getParentDomain } from './domain-utils.js';

// extract content from current tab
async function updateContent() {
    try {
        // get current tab
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab) return;

        // get domain info
        const domainAge = await getDomainAge(tab.url);
        const parentDomain = getParentDomain(new URL(tab.url).hostname);

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

        displayContent({
            ...result.result,
            domainAge,
            parentDomain
        });
    } catch (e) {
        console.error('Failed to update content:', e);
    }
}

// update ui with extracted content
function displayContent(data) {
    document.getElementById('title').textContent = data.title;
    document.getElementById('content').textContent = data.content;
    document.getElementById('url').textContent = data.url;
    document.getElementById('domain-age').textContent = 
        `${data.parentDomain} - ${data.domainAge}`;
}

// watch for tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete') {
        updateContent();
    }
});

// initial content load
document.addEventListener('DOMContentLoaded', updateContent);
