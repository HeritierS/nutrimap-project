(async () => {
  const base = 'http://localhost:4000';
  try {
    console.log('Logging in as CHW...');
    const loginResp = await (await fetch(base + '/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'chw@nutrimap.rw', password: 'chw123' }) })).json();
    console.log('CHW login:', loginResp.user?.email);
    const token = loginResp.token;

    console.log('Creating child...');
    const childPayload = {
      name: 'E2 Smoke Child',
      motherName: 'Smoke Mother',
      dob: '2021-07-01',
      sex: 'female',
      address: 'Kigali',
      geo: { lat: -1.9536, lng: 30.0606 },
      initialRecordedAt: new Date().toISOString(),
      initialWeightKg: 8.8,
      initialHeightCm: 70,
      initialHeadCircCm: 44
    };
  const createChildRes = await fetch(base + '/api/children', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token }, body: JSON.stringify(childPayload) });
  const createChildResp = await createChildRes.json().catch(() => ({}));
  const createdChildId = createChildResp.id || createChildResp?.child?.id || createChildResp?.data?.id || null;
  console.log('Child create status:', createChildRes.status, 'id:', createdChildId);

    console.log('Logging in as Admin...');
    const adminLogin = await (await fetch(base + '/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'admin@nutrimap.rw', password: 'admin123' }) })).json();
    console.log('Admin login:', adminLogin.user?.email);
    const admToken = adminLogin.token;

    console.log('Creating new user...');
    const rand = Math.floor(Math.random() * 100000);
    const newUserPayload = { name: 'Auto Test CHW', email: `autotest+${rand}@nutrimap.rw`, role: 'chw', password: 'test1234' };
    const createUserResp = await (await fetch(base + '/api/users', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + admToken }, body: JSON.stringify(newUserPayload) })).json();
    console.log('User created id:', createUserResp.id);

    console.log('Smoke tests finished successfully');
  } catch (err) {
    console.error('Smoke test error', err);
    process.exitCode = 1;
  }
})();
