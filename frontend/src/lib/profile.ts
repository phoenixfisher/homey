import { API_URL } from '@/lib/api';

export type UserProfile = {
  userId: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  desiredHomePrice: number | null;
  creditScore: number | null;
  monthlyIncome: number | null;
  monthlyExpenses: number | null;
  totalSavings: number | null;
  industryOfWork: string | null;
  role: string;
};

export type UpdateUserProfileRequest = Omit<UserProfile, 'userId' | 'role'>;

export async function fetchUserProfile(): Promise<UserProfile | null> {
  const response = await fetch(`${API_URL}/api/profile/me`, {
    method: 'GET',
    credentials: 'include',
  });

  if (response.status === 401 || response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error('Unable to load profile.');
  }

  return (await response.json()) as UserProfile;
}

export async function updateUserProfile(payload: UpdateUserProfileRequest): Promise<void> {
  const response = await fetch(`${API_URL}/api/profile/me`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || 'Unable to save profile.');
  }
}
