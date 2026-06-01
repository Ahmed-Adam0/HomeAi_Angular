const http = require('http');

const baseUrl = 'http://home-ai.runasp.net/api/';

function get(path) {
  return new Promise((resolve) => {
    const url = baseUrl + path;
    const req = http.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        resolve({ status: res.statusCode, body: data });
      });
    });
    req.on('error', (err) => {
      resolve({ status: 'error', message: err.message });
    });
  });
}

async function run() {
  console.log('1. Fetching public products list...');
  const listRes = await get('Products');
  console.log('List status:', listRes.status);
  
  let products = [];
  try {
    const parsed = JSON.parse(listRes.body);
    // Unwrap standard envelope
    products = parsed.data || parsed.items || (Array.isArray(parsed) ? parsed : []);
  } catch (e) {
    console.error('Failed to parse list response');
    return;
  }

  if (products.length === 0) {
    console.log('No products returned in public list.');
    return;
  }

  const sampleProduct = products[0];
  const id = sampleProduct.id;
  console.log(`Using sample product ID: ${id}`);
  console.log(`Sample product title: ${sampleProduct.nameEn || sampleProduct.nameAr}`);
  console.log(`Sample product isActive: ${sampleProduct.isActive}`);

  console.log(`\n2. Hitting public details endpoint: Products/${id}`);
  const publicDetailRes = await get(`Products/${id}`);
  console.log(`Public details status code: ${publicDetailRes.status}`);

  console.log(`\n3. Hitting vendor details endpoint: Products/my-products/${id} (Without auth)`);
  const vendorDetailRes = await get(`Products/my-products/${id}`);
  console.log(`Vendor details status code: ${vendorDetailRes.status}`);
}

run().catch(console.error);
