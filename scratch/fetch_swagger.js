const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const candidates = [
  'https://home-ai.runasp.net/swagger/v1/swagger.json',
  'https://home-ai.runasp.net/api/swagger/v1/swagger.json',
  'https://home-ai.runasp.net/api/swagger.json',
  'http://home-ai.runasp.net/swagger/v1/swagger.json',
];

function fetchUrl(url) {
  return new Promise((resolve) => {
    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        resolve({ url, status: res.statusCode, body: data });
      });
    });
    req.on('error', (err) => resolve({ url, status: 'error', message: err.message }));
  });
}

async function run() {
  for (const url of candidates) {
    console.log(`Fetching: ${url}`);
    const res = await fetchUrl(url);
    console.log(`Status: ${res.status}`);
    if (res.status === 200) {
      try {
        const parsed = JSON.parse(res.body);
        fs.writeFileSync(path.join(__dirname, 'swagger.json'), JSON.stringify(parsed, null, 2));
        console.log(`Successfully saved Swagger json from ${url}`);
        return;
      } catch (e) {
        console.log(`Failed to parse body from ${url} as JSON: ${e.message}`);
      }
    }
  }
  console.log('Could not retrieve Swagger json from any candidate.');
}

run().catch(console.error);
