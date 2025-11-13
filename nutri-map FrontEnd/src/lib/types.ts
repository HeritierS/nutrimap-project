export type UserRole = 'admin' | 'chw' | 'nutritionist';

export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  password: string;
  approved?: boolean;
  region?: string;
  district?: string;
};

export type AnthroStatus = 'normal' | 'moderate' | 'severe';

export type Child = {
  id: string;
  name: string;
  motherName: string;
  dob: string;
  sex: 'male' | 'female';
  address: string;
  geo: { lat: number; lng: number };
  complications?: string;
  createdBy: string;
  initialAnthro: {
    recordedAt: string;
    weightKg: number;
    heightCm: number;
    headCircumferenceCm?: number;
  };
  followUps: Array<{
    id: string;
    recordedAt: string;
    weightKg: number;
    heightCm: number;
    headCircumferenceCm?: number;
  }>;
};
