import { getDomainAge, getParentDomain } from './domain-utils.js';
import { generateSummary } from './api-utils.js';

// check if url is supported
function isValidUrl(url) {
    return url.startsWith('http://') || url.startsWith('https://');
}

// extract content and generate summary
async function updateContent() {
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab) return;

        // check if valid url
        if (!isValidUrl(tab.url)) {
            displayUnsupportedPage();
            return;
        }

        // get domain info
        const domainAge = await getDomainAge(tab.url);
        const parentDomain = getParentDomain(new URL(tab.url).hostname);

        // show loading state
        displayLoading();

        // execute content extraction
        const [result] = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => {
                // extract main content
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

                // extract all links
                const links = Array.from(document.getElementsByTagName('a'))
                    .map(a => ({
                        text: a.innerText.trim(),
                        href: a.href,
                        isExternal: a.href.startsWith('http') && !a.href.includes(window.location.hostname)
                    }))
                    .filter(link => link.text && link.href); // filter out empty links

                return {
                    title: document.title,
                    content: content.trim(),
                    url: window.location.href,
                    links: links
                };
            }
        });

        // generate summary
        const summary = await generateSummary(
            result.result.content, 
            domainAge.years,
            result.result.links
        );

        displayContent({
            ...result.result,
            summary,
            domainAge: domainAge.text,
            parentDomain
        });
    } catch (e) {
        console.error('Failed to update content:', e);
        displayError(e.message);
    }
}

// display message for unsupported pages
function displayUnsupportedPage() {
    document.getElementById('url').textContent = 'Unsupported page';
    document.getElementById('domain-age').textContent = '';
    document.getElementById('title').textContent = 'Try visiting a real website!';
    document.getElementById('content').innerHTML = `
        <div class="message">
            <p>This extension only works on regular websites starting with http:// or https://</p>  
            <p>Please visit a website for it to work, e.g. <a href="http://example.com" target="_blank">example.com</a></p>
        </div>
    `;
}

// display loading state
function displayLoading() {
    document.getElementById('title').textContent = 'Analyzing...';
    document.getElementById('content').innerHTML = '<div class="loading">⏳</div>';
}

// display error state
function displayError(message) {
    document.getElementById('content').textContent = `Error: ${message}`;
}

// update ui with content
function displayContent(data) {
    // extract risk level from summary
    const riskMatch = data.summary.match(/Risk level.*?(Low|Medium|High)/i);
    const riskLevel = riskMatch ? riskMatch[1].toLowerCase() : 'unknown';
    
    // get risk icon and color
    const riskInfo = {
        low: { icon: '🟢', color: '#2ecc71' },
        medium: { icon: '🟡', color: '#f1c40f' },
        high: { icon: '🔴', color: '#e74c3c' },
        unknown: { icon: '⚪', color: '#95a5a6' }
    }[riskLevel];

    // create risk level element
    const riskHtml = `
        <div class="risk-level" style="color: ${riskInfo.color};">
            ${riskInfo.icon} Risk Level: ${riskLevel.toUpperCase()}
        </div>
    `;

    // parse markdown safely
    let formattedContent;
    try {
        formattedContent = marked.parse(data.summary);
    } catch (e) {
        console.error('Markdown parsing error:', e);
        formattedContent = data.summary;
    }

    document.getElementById('title').textContent = data.title;
    document.getElementById('content').innerHTML = riskHtml + formattedContent;
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