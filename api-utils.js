// get api key from storage
async function getGeminiApiKey() {
    const result = await chrome.storage.sync.get('geminiApiKey');
    return result.geminiApiKey || null;
}

// check if domain is trusted
function isTrustedDomain(links) {
    try {
        // get first valid URL from links array
        const url = links.find(l => l.url || l.href)?.url || links[0]?.href;
        if (!url) return false;
        
        const domain = new URL(url).hostname.toLowerCase();
        return domain.endsWith('.edu') || domain.endsWith('.gov');
    } catch (e) {
        console.error('Error checking domain:', e);
        return false;
    }
}

// generate summary using gemini
async function generateSummary(content, domainAgeYears, links) {
    const apiKey = await getGeminiApiKey();
    if (!apiKey) {
        return 'Please set Gemini API key in extension options (⚙️)';
    }

    // prepare links summary
    const externalLinks = links.filter(l => l.isExternal);
    const linksSummary = `
        Total Links: ${links.length}
        External Links: ${externalLinks.length}
        External Domains: ${[...new Set(externalLinks.map(l => new URL(l.href).hostname))].join(', ')}
    `;

    // check if it's a trusted domain
    const isTrusted = isTrustedDomain(links);
    const trustContext = isTrusted ? 
        "This is a .edu or .gov domain which are officially registered and restricted to educational and government institutions respectively. These domains are generally trustworthy due to strict registration requirements." : "";

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: `Analyze this webpage for phishing risks. Consider the following: 
                                - **Content:** ${content} 
                                - **Domain Age:** ${domainAgeYears} years old.
                                - **Links Analysis:**${linksSummary}
                                ${trustContext}
                                Provide a concise summary of the risks, including any suspicious elements or tactics. 
                                ${isTrusted ? "Note that as an official .edu or .gov domain, this should be considered Low risk unless there's overwhelming evidence of compromise." : ""}
                                Rank the risk level as 'Low', 'Medium', or 'High'.`
                        }]
                    }]
                })
            }
        );

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        return data.candidates[0].content.parts[0].text;
    } catch (e) {
        console.error('Analysis error:', e);
        return `Error analyzing: ${e.message}`;
    }
}

export { getGeminiApiKey, generateSummary };
