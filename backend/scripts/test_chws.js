(async () => {
  const base = 'http://localhost:4000';
  const headers = { 'Content-Type': 'application/json' };
  try {
    console.log('Logging CHW1 (chw@nutrimap.rw)');
    const r1 = await fetch(base + '/api/auth/login', { method: 'POST', headers, body: JSON.stringify({ email: 'chw@nutrimap.rw', password: 'chw123' }) });
    const j1 = await r1.json();
    console.log('CHW1 id:', j1.user?.id);

    console.log('Logging CHW2 (chw2@nutrimap.rw)');
    const r2 = await fetch(base + '/api/auth/login', { method: 'POST', headers, body: JSON.stringify({ email: 'chw2@nutrimap.rw', password: 'chw223' }) });
    const j2 = await r2.json();
    console.log('CHW2 id:', j2.user?.id);

    console.log('\nListing children for CHW1 via collectorId:');
    const list1 = await (await fetch(base + '/api/children?collectorId=' + encodeURIComponent(j1.user?.id || ''), { headers: { Authorization: 'Bearer ' + j1.token } })).json();
    console.log('CHW1 children count:', Array.isArray(list1) ? list1.length : 'unexpected', '\nSample IDs:', (Array.isArray(list1) && list1.slice(0,5).map(c=>c.id)));

    console.log('\nListing children for CHW2 via collectorId:');
    const list2 = await (await fetch(base + '/api/children?collectorId=' + encodeURIComponent(j2.user?.id || ''), { headers: { Authorization: 'Bearer ' + j2.token } })).json();
    console.log('CHW2 children count:', Array.isArray(list2) ? list2.length : 'unexpected', '\nSample IDs:', (Array.isArray(list2) && list2.slice(0,5).map(c=>c.id)));

  } catch (err) {
    console.error(err);
    process.exitCode = 1;
  }
})();
