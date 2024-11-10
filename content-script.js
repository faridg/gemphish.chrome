function extractReadableContent() {
    // get main content using readability heuristics
    const contentElements = document.querySelectorAll('article, main, [role="main"], .main-content, #main-content');
    let content = '';
    
    if (contentElements.length) {
        content = contentElements[0].innerText;
    } else {
        // fallback to p tags if no main content found
        const paragraphs = document.querySelectorAll('p');
        content = Array.from(paragraphs)
            .map(p => p.innerText)
            .join('\n\n');
    }
    
    return {
        title: document.title,
        content: content.trim()
    };
}

// listen for messages from panel
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getContent') {
        sendResponse(extractReadableContent());
    }
});
