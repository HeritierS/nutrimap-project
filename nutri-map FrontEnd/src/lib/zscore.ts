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
