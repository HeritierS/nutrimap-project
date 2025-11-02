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
  // Placeholder - replace with WHO LMS calculations for production
  const zWH = (weight / (height/100)) - 2.5;
  const zHA = (height/ageDays) * 100;
  const classification = { wh: 'normal' as 'normal'|'moderate'|'severe', ha: 'normal' as 'normal'|'moderate'|'severe', wa: 'normal' as 'normal'|'moderate'|'severe' };
  if (zWH < -3) classification.wh = 'severe';
  else if (zWH < -2) classification.wh = 'moderate';
  else classification.wh = 'normal';
  return { ageDays, zWH, zHA, classification };
}
