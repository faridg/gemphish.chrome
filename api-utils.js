// get api key from storage
async function getGeminiApiKey() {
    const result = await chrome.storage.sync.get('geminiApiKey');
    return result.geminiApiKey || null;
}

export { getGeminiApiKey };
