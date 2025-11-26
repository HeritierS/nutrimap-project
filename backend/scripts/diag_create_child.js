(async () => {
  const base = 'http://localhost:4000';
  const fetch = global.fetch || require('node-fetch');
  try {
    console.log('Attempting login as CHW (chw@nutrimap.rw)');
    const loginRes = await fetch(base + '/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'chw@nutrimap.rw', password: 'chw123' }),
    });
    const loginJson = await loginRes.json().catch(() => null);
    console.log('LOGIN_STATUS', loginRes.status);
    console.log('LOGIN_BODY', loginJson);

    if (!loginJson || !loginJson.token) {
      console.error('Login did not return a token — aborting test create.');
      process.exit(loginRes.status || 1);
    }

    const token = loginJson.token;

    const childPayload = {
      name: 'Diag Child',
      motherName: 'Diag Mother',
      dob: '2021-01-01',
      sex: 'male',
      address: 'Kigali',
      geo: { lat: -1.95, lng: 30.06 },
      initialRecordedAt: new Date().toISOString(),
      initialWeightKg: 7.1,
      initialHeightCm: 65,
    };

    console.log('Posting test child...');
    const createRes = await fetch(base + '/api/children', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      body: JSON.stringify(childPayload),
    });
    const createJson = await createRes.json().catch(() => null);
    console.log('CREATE_STATUS', createRes.status);
    console.log('CREATE_BODY', createJson);
  } catch (err) {
    console.error('Diagnostic error:', err);
  }

  // Print backend log tail if present
  try {
    const fs = require('fs');
    const path = 'backend-dev.log';
    if (fs.existsSync(path)) {
      const tail = fs.readFileSync(path, 'utf8').split(/\r?\n/).slice(-80).join('\n');
      console.log('\n--- BACKEND LOG TAIL ---\n');
      console.log(tail);
    } else {
      console.log('\nNo backend-dev.log found at', path);
    }
  } catch (e) {
    console.log('Failed to read backend-dev.log:', e.message);
  }
})();
