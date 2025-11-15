import { AnthroStatus } from './types';

// Mock z-score calculation
// In production, this would use WHO growth standards
export function classifyNutritionalStatus(
  weightKg: number,
  heightCm: number,
  ageMonths: number
): AnthroStatus {
  // Simple mock logic - replace with WHO standards in production
  const ratio = weightKg / (heightCm / 100);
  
  if (ratio >= 15) return 'normal';
  if (ratio >= 13) return 'moderate';
  return 'severe';
}

export function calculateAgeInMonths(dob: string): number {
  const birthDate = new Date(dob);
  const today = new Date();
  const months = (today.getFullYear() - birthDate.getFullYear()) * 12 +
    today.getMonth() - birthDate.getMonth();
  return months;
}

// NOTE: The following z-score calculations are simplified placeholders.
// For accurate WHO z-scores use a dedicated growth standards implementation
// (for example a server-side calculation using WHO LMS tables or a library
// such as `who-growth`/`growth` that implements the LMS method).
export function computeAnthroZScores(weightKg: number, heightCm: number, ageMonths: number) {
  if (typeof weightKg !== 'number' || typeof heightCm !== 'number' || !Number.isFinite(ageMonths)) {
    return { waz: null, whz: null, haz: null };
  }

  const heightM = heightCm / 100;
  const bmi = heightM > 0 ? weightKg / (heightM * heightM) : null;

  // Very simple expected value approximations (placeholders)
  const expectedWeight = 3.5 + ageMonths * 0.25; // crude approx: newborn ~3.5kg + 0.25kg/month
  const expectedHeight = 49 + ageMonths * 0.5; // crude approx: newborn ~49cm + 0.5cm/month

  // crude SD approximations to convert diffs into z-like scores
  const sdWeight = Math.max(0.8, expectedWeight * 0.15);
  const sdHeight = Math.max(1.5, expectedHeight * 0.06);
  const sdBMI = 1.5;

  const waz = Number(((weightKg - expectedWeight) / sdWeight).toFixed(2));
  const haz = Number(((heightCm - expectedHeight) / sdHeight).toFixed(2));
  const whz = bmi != null ? Number(((bmi - 14) / sdBMI).toFixed(2)) : null;

  return { waz, whz, haz };
}

export function getStatusColor(status: AnthroStatus): string {
  switch (status) {
    case 'normal':
      return 'success';
    case 'moderate':
      return 'warning';
    case 'severe':
      return 'danger';
  }
}

export function getStatusLabel(status: AnthroStatus): string {
  switch (status) {
    case 'normal':
      return 'Normal';
    case 'moderate':
      return 'MAM (Moderate)';
    case 'severe':
      return 'SAM (Severe)';
  }
}
