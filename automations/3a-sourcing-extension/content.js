// 3A Automation - Smart Scraper Content Script

function scrapeProductData() {
    const data = {
        name: '',
        image: '',
        description: '',
        price: 'Best available',
        currency: 'USD',
        brand: '',
        url: window.location.href,
        scraped_at: new Date().toISOString()
    };

    try {
        // 1. JSON-LD Extraction (High Precision)
        const scripts = document.querySelectorAll('script[type="application/ld+json"]');
        for (const script of scripts) {
            try {
                const json = JSON.parse(script.innerText);
                const items = Array.isArray(json) ? json : (json['@graph'] || [json]);
                const product = items.find(x => x['@type'] === 'Product' || x['@type'] === 'ItemPage');

                if (product) {
                    data.name = product.name || data.name;
                    data.image = product.image || (Array.isArray(product.image) ? product.image[0] : '') || data.image;
                    data.description = product.description || data.description;
                    data.brand = product.brand ? (product.brand.name || product.brand) : data.brand;

                    if (product.offers) {
                        const offer = Array.isArray(product.offers) ? product.offers[0] : product.offers;
                        data.price = offer.price || data.price;
                        data.currency = offer.priceCurrency || data.currency;
                    }
                    break; // Found primary product, stop scanning
                }
            } catch (e) {
                console.warn('JSON-LD Parse Error', e);
            }
        }

        // 2. OpenGraph Fallback
        if (!data.name) {
            data.name = document.querySelector('meta[property="og:title"]')?.content || document.title;
        }
        if (!data.image) {
            data.image = document.querySelector('meta[property="og:image"]')?.content || '';
        }
        if (!data.description) {
            data.description = document.querySelector('meta[property="og:description"]')?.content || '';
        }

        // 3. Sanitization
        data.name = data.name.replace(/\|.*/, '').replace(/Amazon\..*/, '').trim();

    } catch (err) {
        console.error('Fatal Scrape Error', err);
    }

    return data;
}

// Listen for messages from Popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "scrape") {
        const data = scrapeProductData();
        sendResponse(data);
    }
    return true;
});
