// domain age calculation
function calculateDomainAge(createDate) {
    const now = new Date();
    let years = now.getFullYear() - createDate.getFullYear();
    let months = now.getMonth() - createDate.getMonth();
    if (months < 0) { years--; months += 12; }
    return `${years}y ${months}m`;
}

// get parent domain from url
function getParentDomain(hostname) {
    const domainParts = hostname.replace('www.', '').split('.');
    return domainParts.slice(-2).join('.');
}

// domain info fetch
async function getDomainAge(url) {
    // supported tlds and their rdap endpoints
    const rdapEndpoints = {
        'com': 'https://rdap.verisign.com/com/v1/domain/',
        'net': 'https://rdap.verisign.com/net/v1/domain/',
        'org': 'https://rdap.publicinterestregistry.org/rdap/domain/'
    };

    const hostname = new URL(url).hostname;
    const parentDomain = getParentDomain(hostname);
    const tld = parentDomain.split('.').pop().toLowerCase();

    if (!rdapEndpoints[tld]) return 'unsupported TLD';

    try {
        const response = await fetch(`${rdapEndpoints[tld]}${parentDomain}`);
        if (!response.ok) return 'not found';
        
        const data = await response.json();
        const event = data.events?.find(e => e.eventAction === "registration") 
                  || data.events?.find(e => e.eventAction === "created");
        
        if (!event) return 'no data';
        
        return calculateDomainAge(new Date(event.eventDate));
    } catch (e) {
        return 'error';
    }
}

export { getDomainAge, getParentDomain };
