const http = require('http');

const candidates = [
  'http://home-ai.runasp.net/',
  'http://home-ai.runasp.net/swagger/index.html',
  'http://home-ai.runasp.net/api/swagger/index.html',
  'http://home-ai.runasp.net/api/swagger/v1/swagger.json',
  'http://home-ai.runasp.net/api/swagger.json',
  'http://home-ai.runasp.net/api/v1/swagger.json',
  'http://home-ai.runasp.net/api/swagger/index.html',
  'http://home-ai.runasp.net/swagger/v1/swagger.json',
];

function fetchHead(url) {
  return new Promise((resolve) => {
    try {
      const u = new URL(url);
      const req = http.request({
        hostname: u.hostname,
        port: u.port || 80,
        path: u.pathname + u.search,
        method: 'GET'
      }, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          if (data.length < 500) data += chunk;
        });
        res.on('end', () => {
          resolve({ url, status: res.statusCode, data: data.substring(0, 500) });
        });
      });
      req.on('error', (err) => resolve({ url, status: 'error', message: err.message }));
      req.end();
    } catch (e) {
      resolve({ url, status: 'error', message: e.message });
    }
  });
}

async function run() {
  console.log('Probing potential Swagger / root locations...');
  for (const c of candidates) {
    const res = await fetchHead(c);
    console.log(`URL: ${c} => Status: ${res.status}`);
    if (res.status === 200) {
      console.log(`Sample output from ${c}:`);
      console.log(res.data);
      console.log('-------------------------------------------');
    }
  }
}

run();


