const https = require('https');
const fs = require('fs');

const baseUrl = 'https://home-ai.runasp.net/api/';

function post(path, body, token = null) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const u = new URL(baseUrl + path);
    const headers = {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload)
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const req = https.request({
      hostname: u.hostname,
      port: u.port || 443,
      path: u.pathname + u.search,
      method: 'POST',
      headers
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        resolve({ status: res.statusCode, headers: res.headers, body: data });
      });
    });
    req.on('error', (err) => reject(err));
    req.write(payload);
    req.end();
  });
}

function put(path, body, token = null) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const u = new URL(baseUrl + path);
    const headers = {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload)
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const req = https.request({
      hostname: u.hostname,
      port: u.port || 443,
      path: u.pathname + u.search,
      method: 'PUT',
      headers
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        resolve({ status: res.statusCode, headers: res.headers, body: data });
      });
    });
    req.on('error', (err) => reject(err));
    req.write(payload);
    req.end();
  });
}

function get(path, token = null) {
  return new Promise((resolve, reject) => {
    const u = new URL(baseUrl + path);
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const req = https.request({
      hostname: u.hostname,
      port: u.port || 443,
      path: u.pathname + u.search,
      method: 'GET',
      headers
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        resolve({ status: res.statusCode, headers: res.headers, body: data });
      });
    });
    req.on('error', (err) => reject(err));
    req.end();
  });
}

async function main() {
  const rand = Math.floor(Math.random() * 1000000);
  const email = `vendor${rand}@example.com`;
  const password = 'Password123!';
  
  console.log(`1. Registering vendor: ${email}...`);
  const regRes = await post('Vendors/create', {
    fullName: 'Test Vendor',
    email: email,
    password: password,
    phoneNumber: '01012345678',
    preferredLanguage: 'en',
    workshopNameAr: 'ورشة الفحص',
    workshopNameEn: 'Probe Workshop',
    descriptionAr: 'الوصف الفني',
    descriptionEn: 'Technical description',
    workshopAddress: {
      city: 'Cairo',
      area: 'Maadi',
      street: 'Street 9',
      buildingNumber: '10',
      notes: 'Near Metro'
    }
  });
  console.log('Reg status:', regRes.status);
  
  console.log('2. Logging in...');
  let loginRes = await post('auth/login', { email, password });
  console.log('auth/login status:', loginRes.status);
  if (loginRes.status !== 200) {
    loginRes = await post('Vendors/login', { email, password });
    console.log('Vendors/login status:', loginRes.status, loginRes.body);
  }
  
  let token = null;
  try {
    const body = JSON.parse(loginRes.body);
    token = body.token || (body.data && body.data.token) || body.result || (body.data && body.data.accessToken);
    console.log('Token extracted:', token ? `${token.substring(0, 20)}...` : 'None');
  } catch (e) {
    console.error('Failed to parse login response:', loginRes.body);
    return;
  }
  
  if (!token) return;
  
  console.log('3. Creating first material group...');
  const g1Res = await post('VendorMaterials/Groups', { nameAr: 'خشب', nameEn: 'Wood' }, token);
  console.log('Group 1 status:', g1Res.status);
  const g1 = JSON.parse(g1Res.body);
  console.log('Group 1 ID:', g1.id);
  
  console.log('4. Creating second material group...');
  const g2Res = await post('VendorMaterials/Groups', { nameAr: 'جلد', nameEn: 'Leather' }, token);
  console.log('Group 2 status:', g2Res.status);
  const g2 = JSON.parse(g2Res.body);
  console.log('Group 2 ID:', g2.id);
  
  console.log('5. Creating option under first group...');
  const optRes = await post(`VendorMaterials/Groups/${g1.id}/Options`, {
    valueAr: 'خشب زان',
    valueEn: 'Beech Wood',
    priceDelta: 100
  }, token);
  console.log('Option status:', optRes.status);
  const opt = JSON.parse(optRes.body);
  console.log('Option ID:', opt.id, 'Group ID:', opt.vendorMaterialGroupId);
  
  console.log('\n6. Testing PUT VendorMaterials/Options/{id} to update details AND parent group...');
  const updateRes = await put(`VendorMaterials/Options/${opt.id}`, {
    valueAr: 'خشب زان معدل',
    valueEn: 'Beech Wood Updated',
    priceDelta: 120,
    vendorMaterialGroupId: g2.id,
    materialGroupId: g2.id,
    vendorMaterialId: g2.id,
    materialId: g2.id,
    parentMaterialId: g2.id
  }, token);
  
  console.log('Update status:', updateRes.status);
  console.log('Update body:', updateRes.body);
  
  console.log('\n7. Fetching all materials to check if option group updated on the backend...');
  const fetchRes = await get('VendorMaterials', token);
  console.log('Fetch status:', fetchRes.status);
  const materials = JSON.parse(fetchRes.body);
  console.log('Backend materials state:');
  console.log(JSON.stringify(materials, null, 2));
}

main().catch(console.error);
