// get api key from storage
async function getGeminiApiKey() {
    const result = await chrome.storage.sync.get('geminiApiKey');
    return result.geminiApiKey || null;
}

// generate summary using gemini
async function generateSummary(content) {
    const apiKey = await getGeminiApiKey();
    if (!apiKey) {
        return 'Please set Gemini API key in extension options (⚙️)';
    }

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
                            text: `Summarize this webpage content concisely: ${content}`
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
        console.error('Summary generation error:', e);
        return `Error generating summary: ${e.message}`;
    }
}

export { getGeminiApiKey, generateSummary };
