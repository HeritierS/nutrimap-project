(async () => {
  const base = 'http://localhost:4000';
  const headers = { 'Content-Type': 'application/json' };
  try {
    // Login CHW1
    const r1 = await fetch(base + '/api/auth/login', { method: 'POST', headers, body: JSON.stringify({ email: 'chw@nutrimap.rw', password: 'chw123' }) });
    const j1 = await r1.json();
    const id1 = j1.user?.id;
    if (!id1) throw new Error('CHW1 login failed');

    // Login CHW2
    const r2 = await fetch(base + '/api/auth/login', { method: 'POST', headers, body: JSON.stringify({ email: 'chw2@nutrimap.rw', password: 'chw223' }) });
    const j2 = await r2.json();
    const id2 = j2.user?.id;
    if (!id2) throw new Error('CHW2 login failed');

    // Fetch children for each CHW
    const list1Res = await fetch(base + '/api/children?collectorId=' + encodeURIComponent(id1), { headers: { Authorization: 'Bearer ' + j1.token } });
    const list1 = await list1Res.json();
    const list2Res = await fetch(base + '/api/children?collectorId=' + encodeURIComponent(id2), { headers: { Authorization: 'Bearer ' + j2.token } });
    const list2 = await list2Res.json();

    const ids1 = new Set((Array.isArray(list1) ? list1 : []).map(c => c.id));
    const ids2 = new Set((Array.isArray(list2) ? list2 : []).map(c => c.id));

    const intersection = [...ids1].filter(x => ids2.has(x));

    console.log('CHW1 count:', ids1.size, 'CHW2 count:', ids2.size);
    if (intersection.length === 0) {
      console.log('PASS: No overlap between CHW1 and CHW2 children');
      process.exitCode = 0;
    } else {
      console.error('FAIL: Overlap found!', intersection.slice(0, 10));
      process.exitCode = 2;
    }
  } catch (err) {
    console.error('Error during verification', err);
    process.exitCode = 1;
  }
})();
