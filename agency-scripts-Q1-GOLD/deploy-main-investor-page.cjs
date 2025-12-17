const fs = require('fs');
const https = require('https');
const path = require('path');

// Load environment
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const token = envContent.match(/SHOPIFY_ACCESS_TOKEN=(.+)/)[1];
const store = 'jqp1x4-7e.myshopify.com';

const PAGE_HANDLE = 'investor-relations';
const PAGE_TITLE = 'Investor Relations';
const CONTENT_FILE = path.join(__dirname, '..', 'investor-page-content.html');

/**
 * Deploy Main Page
 */
function deployMainPage() {
    const bodyHtml = fs.readFileSync(CONTENT_FILE, 'utf-8');

    return new Promise((resolve, reject) => {
        // Check if page exists
        const checkOptions = {
            hostname: store,
            path: `/admin/api/2025-10/pages.json?handle=${PAGE_HANDLE}`,
            method: 'GET',
            headers: { 'X-Shopify-Access-Token': token, 'Content-Type': 'application/json' }
        };

        const checkReq = https.request(checkOptions, (checkRes) => {
            let data = '';
            checkRes.on('data', c => data += c);
            checkRes.on('end', () => {
                const result = JSON.parse(data);
                const existingPage = result.pages && result.pages.length > 0 ? result.pages[0] : null;

                if (existingPage) {
                    updatePage(existingPage.id, bodyHtml, resolve, reject);
                } else {
                    createPage(bodyHtml, resolve, reject);
                }
            });
        });
        checkReq.on('error', reject);
        checkReq.end();
    });
}

function updatePage(id, html, resolve, reject) {
    const postData = JSON.stringify({
        page: { id: id, body_html: html }
    });

    const req = https.request({
        hostname: store,
        path: `/admin/api/2025-10/pages/${id}.json`,
        method: 'PUT',
        headers: {
            'X-Shopify-Access-Token': token,
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
        }
    }, (res) => {
        if (res.statusCode === 200) resolve('UPDATED');
        else reject(new Error(`Update failed: ${res.statusCode}`));
    });
    req.write(postData);
    req.end();
}

function createPage(html, resolve, reject) {
    const postData = JSON.stringify({
        page: {
            title: PAGE_TITLE,
            handle: PAGE_HANDLE,
            body_html: html,
            published: true,
            metafields: [{ namespace: 'custom', key: 'page_type', value: 'investor_portal', type: 'single_line_text_field' }]
        }
    });

    const req = https.request({
        hostname: store,
        path: '/admin/api/2025-10/pages.json',
        method: 'POST',
        headers: {
            'X-Shopify-Access-Token': token,
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
        }
    }, (res) => {
        if (res.statusCode === 201) resolve('CREATED');
        else reject(new Error(`Create failed: ${res.statusCode}`));
    });
    req.write(postData);
    req.end();
}

console.log('=== DEPLOYING MAIN INVESTOR PAGE ===');
deployMainPage()
    .then(action => console.log(`✅ SUCCESS: ${action} Main Page (${PAGE_HANDLE})`))
    .catch(err => console.error(`❌ FAILED: ${err.message}`));
