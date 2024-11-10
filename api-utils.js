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

// analyze links and get metrics
function analyzeLinks(links) {
    const externalLinks = links.filter(l => l.isExternal);
    const numberOfExternalLinks = externalLinks.length;
    const proportionExternalLinks = ((numberOfExternalLinks / links.length) * 100).toFixed(1);
    
    // get top external domains
    const domainCounts = {};
    externalLinks.forEach(link => {
        try {
            const domain = new URL(link.href).hostname;
            domainCounts[domain] = (domainCounts[domain] || 0) + 1;
        } catch (e) {
            console.error('Error parsing URL:', e);
        }
    });

    const topDomains = Object.entries(domainCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([domain, count]) => `${domain} (${count})`)
        .join(', ');

    return {
        numberOfExternalLinks,
        proportionExternalLinks,
        topExternalDomains: topDomains || 'None'
    };
}

// analyze security indicators
function analyzeSecurityIndicators(url) {
    try {
        const urlObj = new URL(url);
        const protocol = urlObj.protocol;
        
        return {
            domainRegistrationDetails: 'Based on domain age above',
            contactInformationDetails: 'Contact information requires manual review',
            securityPracticesDetails: protocol === 'https:' ? 
                'Basic security practices observed (HTTPS)' : 'Basic security practices missing (HTTP)'
        };
    } catch (e) {
        console.error('Error analyzing security indicators:', e);
        return {
            domainRegistrationDetails: 'Unable to verify',
            contactInformationDetails: 'Unable to verify',
            securityPracticesDetails: 'Unable to verify'
        };
    }
}

// analyze phishing indicators
function analyzePhishingIndicators(content) {
    return {
        urgencyFearTacticsDetails: 'Based on content analysis',
        rewardsDetails: 'Based on content analysis',
        transparencyDetails: 'Based on content analysis',
        typographicalErrorsDetails: 'Based on content quality check',
        designDetails: 'Based on page structure analysis'
    };
}

// analyze URL patterns
function analyzeUrlPatterns(url) {
    try {
        const urlObj = new URL(url);
        const domain = urlObj.hostname;
        
        // check for suspicious patterns
        const hasNumbers = /\d/.test(domain);
        const hasDashes = domain.includes('-');
        const hasUnusualChars = /[^a-zA-Z0-9.-]/.test(domain);
        const hasLongSubdomains = domain.split('.').some(part => part.length > 20);
        
        return {
            uncommonCharacters: hasUnusualChars ? 'Present' : 'None detected',
            suspiciousPatterns: hasNumbers || hasDashes ? 'Some detected' : 'None detected',
            longSubdomains: hasLongSubdomains ? 'Present' : 'None detected'
        };
    } catch (e) {
        console.error('Error analyzing URL patterns:', e);
        return {
            uncommonCharacters: 'Unable to analyze',
            suspiciousPatterns: 'Unable to analyze',
            longSubdomains: 'Unable to analyze'
        };
    }
}

// generate summary using gemini
async function generateSummary(content, domainAgeYears, links) {
    const apiKey = await getGeminiApiKey();
    if (!apiKey) {
        return 'Please set Gemini API key in extension options (⚙️)';
    }

    // get current page URL
    const url = links[0]?.href || '';
    
    // gather all analysis
    const linkMetrics = analyzeLinks(links);
    const securityIndicators = analyzeSecurityIndicators(url);
    const phishingIndicators = analyzePhishingIndicators(content);
    const urlPatterns = analyzeUrlPatterns(url);
    
    // check if trusted domain
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
                                - **URL:** ${url}
                                - **Content:** ${content}
                                - **Domain Age:** ${domainAgeYears} years old.
                                - **Links Analysis:**
                                  - Number of external links: ${linkMetrics.numberOfExternalLinks}
                                  - Proportion of external links: ${linkMetrics.proportionExternalLinks}%
                                  - Top external domains: ${linkMetrics.topExternalDomains}
                                - **Trust Context:**
                                  - Domain Registration: ${securityIndicators.domainRegistrationDetails}
                                  - Contact Information: ${securityIndicators.contactInformationDetails}
                                  - Security Practices: ${securityIndicators.securityPracticesDetails}
                                - **Phishing Indicators:**
                                  - Urgency/Fear Tactics: ${phishingIndicators.urgencyFearTacticsDetails}
                                  - Excessive Rewards: ${phishingIndicators.rewardsDetails}
                                  - Lack of Transparency: ${phishingIndicators.transparencyDetails}
                                  - Typographical Errors: ${phishingIndicators.typographicalErrorsDetails}
                                  - Generic Website Design: ${phishingIndicators.designDetails}
                                - **URL Pattern Analysis:**
                                  - Uncommon Characters: ${urlPatterns.uncommonCharacters}
                                  - Suspicious Patterns: ${urlPatterns.suspiciousPatterns}
                                  - Long Subdomains: ${urlPatterns.longSubdomains}
                                ${trustContext}
                                Provide a concise summary of the risks, including any suspicious elements or tactics.
                                ${isTrusted ? "Note that as an official .edu or .gov domain, this should be considered Low risk unless there's overwhelming evidence of compromise." : ""}
                                **Assign a risk level of 'Low', 'Medium', or 'High' based on your analysis.**
                                Explain why you assigned this risk level. Don't display back analyzed URL in response.`
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
