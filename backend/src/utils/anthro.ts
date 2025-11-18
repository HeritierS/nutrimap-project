let idCounter = Date.now() % 100000;

export async function generateLocalId() {
  idCounter++;
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,'0');
  const day = String(d.getDate()).padStart(2,'0');
  return `NUTRI-${y}${m}${day}-${String(idCounter).padStart(4,'0')}`;
}

export function computeAnthro({ ageDays, weight, height, sex }: { ageDays: number; weight: number; height: number; sex: 'male'|'female'; }) {
  // Try to use the `who-growth` package when available which reads
  // WHO tables and can return z-score related results. If it's not
  // available or fails, fall back to the lightweight approximations
  // implemented below.
  try {
    // require so that code doesn't break if package is not installed
    // (we installed `who-growth` into backend dependencies earlier).
    // The package exports `Patient` and `Calculator` helpers.
    // See https://www.npmjs.com/package/who-growth
    // We'll attempt to compute weight-for-age, weight-for-height and height-for-age z-like values.
    // Note: `who-growth` may return category strings; we try to coerce numeric values when possible.
    // Create patient record expected by the library
    // the library expects `birthDate` and numeric weight/height
    // derive birthDate from ageDays
    const { Patient, Calculator } = require('who-growth');
    const birthDate = new Date(Date.now() - ageDays * 24 * 60 * 60 * 1000);
    const patient = Patient.new({ name: 'child', birthDate: birthDate.toISOString(), weight, height, sex: sex === 'male' ? 'Male' : 'Female' });
    const calc = Calculator.load('ZScore', patient);

    let rawWaz: any = null;
    let rawWhz: any = null;
    let rawHaz: any = null;

    try {
      rawWaz = calc.calculateWeightForAge();
    } catch (e) {
      rawWaz = null;
    }
    try {
      rawWhz = calc.calculateWeightForHeight();
    } catch (e) {
      rawWhz = null;
    }
    try {
      rawHaz = calc.calculateHeightForAge();
    } catch (e) {
      rawHaz = null;
    }

    const parseNumeric = (v: any) => {
      if (v == null) return null;
      // If it's already a number, return it
      if (typeof v === 'number') return Number(v);
      // If it looks like a numeric string, parse it
      const n = Number(String(v).replace(/[^0-9-.]/g, ''));
      return Number.isFinite(n) ? Number(n) : null;
    };

    const waz = parseNumeric(rawWaz);
    const whz = parseNumeric(rawWhz);
    const haz = parseNumeric(rawHaz);

    const classification: { wh: 'normal'|'moderate'|'severe'; ha: 'normal'|'moderate'|'severe'; wa: 'normal'|'moderate'|'severe' } = { wh: 'normal', ha: 'normal', wa: 'normal' };
    if (waz !== null) {
      if (waz <= -3) classification.wa = 'severe';
      else if (waz <= -2) classification.wa = 'moderate';
    }
    if (haz !== null) {
      if (haz <= -3) classification.ha = 'severe';
      else if (haz <= -2) classification.ha = 'moderate';
    }
    if (whz !== null) {
      if (whz <= -3) classification.wh = 'severe';
      else if (whz <= -2) classification.wh = 'moderate';
    }

    return { ageDays, waz, whz, haz, classification };
  } catch (err) {
    // if anything goes wrong with the who-growth path, fall back to approximations
    // Safely extract an error message for unknown catch variable types
    // eslint-disable-next-line no-console
    const errMsg = (err instanceof Error) ? err.message : (typeof err === 'string' ? err : JSON.stringify(err));
    console.warn('[computeAnthro] who-growth integration failed, using fallback approximations', errMsg);
  }

  // Fallback approximations (as before)
  const ageMonths = Math.max(0, Math.floor(ageDays / 30.4375));
  const heightM = height / 100;

  // crude expected values (placeholders)
  const expectedWeight = 3.5 + ageMonths * 0.25; // newborn ~3.5kg + ~0.25kg/month
  const expectedHeight = 49 + ageMonths * 0.5; // newborn ~49cm + ~0.5cm/month

  const sdWeight = Math.max(0.8, expectedWeight * 0.15);
  const sdHeight = Math.max(1.5, expectedHeight * 0.06);
  const sdBMI = 1.5;

  const waz = Number(((weight - expectedWeight) / sdWeight).toFixed(2));
  const haz = Number(((height - expectedHeight) / sdHeight).toFixed(2));
  const bmi = heightM > 0 ? weight / (heightM * heightM) : null;
  const whz = bmi != null ? Number(((bmi - 14) / sdBMI).toFixed(2)) : null;

  const classification: { wh: 'normal'|'moderate'|'severe'; ha: 'normal'|'moderate'|'severe'; wa: 'normal'|'moderate'|'severe' } = { wh: 'normal', ha: 'normal', wa: 'normal' };

  if (waz <= -3) classification.wa = 'severe';
  else if (waz <= -2) classification.wa = 'moderate';

  if (haz <= -3) classification.ha = 'severe';
  else if (haz <= -2) classification.ha = 'moderate';

  if (whz !== null) {
    if (whz <= -3) classification.wh = 'severe';
    else if (whz <= -2) classification.wh = 'moderate';
  }

  return { ageDays, waz, whz, haz, classification };
}
