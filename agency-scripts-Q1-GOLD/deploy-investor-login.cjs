const fs = require('fs');
const https = require('https');

const path = require('path');

const envPath = '/Users/mac/Desktop/henderson-shopify/.env.local';
const envContent = fs.readFileSync(envPath, 'utf-8');
const token = envContent.match(/SHOPIFY_ACCESS_TOKEN=(.+)/)[1];
const store = 'jqp1x4-7e.myshopify.com';

// Read login page HTML
const templatePath = path.join(__dirname, 'data/investor-login-template.html');
const html = fs.readFileSync(templatePath, 'utf-8');

// Check if page exists
const getOptions = {
  hostname: store,
  path: '/admin/api/2025-10/pages.json?handle=investors-login',
  method: 'GET',
  headers: {
    'X-Shopify-Access-Token': token,
    'Content-Type': 'application/json'
  }
};

const getReq = https.request(getOptions, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const result = JSON.parse(data);

    if (result.pages && result.pages.length > 0) {
      // UPDATE existing page
      const pageId = result.pages[0].id;
      const updateData = {
        page: {
          id: pageId,
          title: 'Investor Login', // Clean title to prevent wrapping issues if displayed
          body_html: html
        }
      };

      const postData = JSON.stringify(updateData);
      const putOptions = {
        hostname: store,
        path: `/admin/api/2025-10/pages/${pageId}.json`,
        method: 'PUT',
        headers: {
          'X-Shopify-Access-Token': token,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      const putReq = https.request(putOptions, (putRes) => {
        if (putRes.statusCode === 200) {
          console.log('✅ UPDATED: investors-login (ID: ' + pageId + ')');
          console.log('   URL: https://www.hendersonshop.com/pages/investors-login');
        } else {
          console.error('❌ Error:', putRes.statusCode);
        }
      });

      putReq.write(postData);
      putReq.end();

    } else {
      // CREATE new page
      const createData = {
        page: {
          title: 'Investor Portal - Access',
          handle: 'investors-login',
          body_html: html,
          published: true
        }
      };

      const postData = JSON.stringify(createData);
      const postOptions = {
        hostname: store,
        path: '/admin/api/2025-10/pages.json',
        method: 'POST',
        headers: {
          'X-Shopify-Access-Token': token,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      const postReq = https.request(postOptions, (postRes) => {
        let resData = '';
        postRes.on('data', chunk => resData += chunk);
        postRes.on('end', () => {
          if (postRes.statusCode === 201) {
            const page = JSON.parse(resData).page;
            console.log('✅ CREATED: investors-login (ID: ' + page.id + ')');
            console.log('   URL: https://www.hendersonshop.com/pages/investors-login');
          } else {
            console.error('❌ Error:', postRes.statusCode, resData);
          }
        });
      });

      postReq.write(postData);
      postReq.end();
    }
  });
});

getReq.end();
