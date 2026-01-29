let extractedData = null;

document.getElementById('extractBtn').addEventListener('click', async () => {
    const statusEl = document.getElementById('status');
    const previewEl = document.getElementById('preview');
    const sendBtn = document.getElementById('sendBtn');

    statusEl.className = 'status';
    statusEl.textContent = 'Extracting...';

    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        if (!tab.url?.includes('linkedin.com/in/')) {
            statusEl.className = 'status error';
            statusEl.textContent = 'Please navigate to a LinkedIn profile page first.';
            return;
        }

        const results = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: extractProfileData
        });

        extractedData = results[0].result;
        extractedData.linkedin = tab.url;

        // Update preview
        document.getElementById('prevName').textContent = extractedData.name || '-';
        document.getElementById('prevRole').textContent = extractedData.role || '-';
        document.getElementById('prevCompany').textContent = extractedData.company || '-';
        document.getElementById('prevLocation').textContent = extractedData.location || '-';

        previewEl.classList.remove('hidden');
        sendBtn.classList.remove('hidden');
        statusEl.className = 'status success';
        statusEl.textContent = 'Profile extracted successfully!';

    } catch (err) {
        statusEl.className = 'status error';
        statusEl.textContent = 'Error: ' + err.message;
    }
});

document.getElementById('sendBtn').addEventListener('click', async () => {
    const statusEl = document.getElementById('status');

    if (!extractedData) return;

    statusEl.textContent = 'Sending to ConnectionPro...';

    try {
        // Open ConnectionPro with pre-filled data via URL params
        const params = new URLSearchParams({
            name: extractedData.name || '',
            role: extractedData.role || '',
            company: extractedData.company || '',
            location: extractedData.location || '',
            linkedin: extractedData.linkedin || ''
        });

        // Open the app with prefilled data
        await chrome.tabs.create({
            url: `http://localhost:5173/connections/new?${params.toString()}`
        });

        statusEl.className = 'status success';
        statusEl.textContent = 'Opened ConnectionPro!';

    } catch (err) {
        statusEl.className = 'status error';
        statusEl.textContent = 'Error: ' + err.message;
    }
});

// This function runs in the context of the LinkedIn page
function extractProfileData() {
    const data = {
        name: '',
        role: '',
        company: '',
        location: ''
    };

    // Method 1: Try JSON-LD structured data (most reliable)
    try {
        const ldScript = document.querySelector('script[type="application/ld+json"]');
        if (ldScript) {
            const ldData = JSON.parse(ldScript.innerText);
            const graph = ldData['@graph'] || [ldData];
            const person = graph.find(obj => obj['@type'] === 'Person');

            if (person) {
                data.name = person.name || '';

                // Get location from address
                if (person.address && person.address.addressLocality) {
                    data.location = person.address.addressLocality;
                }

                // Get company from worksFor
                if (person.worksFor && person.worksFor.length > 0) {
                    data.company = person.worksFor[0].name || '';
                }

                // Get role from jobTitle (first non-obfuscated)
                if (person.jobTitle && person.jobTitle.length > 0) {
                    for (const title of person.jobTitle) {
                        if (!title.includes('*')) {
                            data.role = title;
                            break;
                        }
                    }
                }
            }
        }
    } catch (e) {
        console.log('JSON-LD parsing failed:', e);
    }

    // Method 2: Fallback to DOM scraping if JSON-LD incomplete
    if (!data.name) {
        // Try public view selectors
        const nameEl = document.querySelector('h1.top-card-layout__title') ||
            document.querySelector('h1.text-heading-xlarge') ||
            document.querySelector('h1');
        if (nameEl) {
            data.name = nameEl.innerText.trim();
        }
    }

    // Try to get headline if role/company still empty
    if (!data.role && !data.company) {
        const headlineEl = document.querySelector('.top-card-layout__headline') ||
            document.querySelector('.text-body-medium.break-words');
        if (headlineEl) {
            const headline = headlineEl.innerText.trim();
            // Parse "Title at Company" format
            if (headline.includes(' at ')) {
                const parts = headline.split(' at ');
                data.role = parts[0].trim();
                if (!data.company) data.company = parts[1].trim();
            } else {
                data.role = headline;
            }
        }
    }

    // Try to get location if still empty
    if (!data.location) {
        const locationEl = document.querySelector('.top-card__subline-item') ||
            document.querySelector('.text-body-small.inline.t-black--light.break-words');
        if (locationEl) {
            data.location = locationEl.innerText.trim();
        }
    }

    // Try to get company from top card link if still empty
    if (!data.company) {
        const companyEl = document.querySelector('.top-card-link__description');
        if (companyEl) {
            data.company = companyEl.innerText.trim();
        }
    }

    return data;
}
