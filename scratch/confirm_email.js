const https = require('https');

const baseUrl = 'https://home-ai.runasp.net/api/';

function post(path, body) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const u = new URL(baseUrl + path);
    const req = https.request({
      hostname: u.hostname,
      port: u.port || 443,
      path: u.pathname + u.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        resolve({ status: res.statusCode, body: data });
      });
    });
    req.on('error', (err) => reject(err));
    req.write(payload);
    req.end();
  });
}

async function main() {
  const rand = Math.floor(Math.random() * 1000000);
  const email = `vendor${rand}@example.com`;
  const password = 'Password123!';
  
  console.log(`Registering vendor: ${email}...`);
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

  const otps = ['123456', '000000', '1234', '111111', '12345'];
  for (const otp of otps) {
    console.log(`Trying to confirm email with OTP: ${otp}...`);
    const confirmRes = await post('auth/confirm-email-otp', {
      email,
      otpCodeEmail: otp,
      accountType: 'vendor'
    });
    console.log(`OTP ${otp} status:`, confirmRes.status, confirmRes.body);
    if (confirmRes.status === 200) {
      console.log(`SUCCESS! Confirmed with OTP: ${otp}`);
      // Now log in
      const loginRes = await post('Vendors/login', { email, password });
      console.log('Login status:', loginRes.status, loginRes.body);
      return;
    }
  }
}

main().catch(console.error);
