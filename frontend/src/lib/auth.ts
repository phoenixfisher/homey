export const HOMEY_PROFILE_KEY = 'homeyProfile';
export const HOMEY_MILESTONES_KEY = 'homeyMilestones';

export type SessionUser = {
  userId: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
};

export type HomeyUserProfile = {
  name: string;
  desiredHomePrice: string;
  creditScore: string;
  monthlyIncome: string;
  yearlyIncome: string;
  savingsTotal: string;
  monthlyExpenses: string;
  industry: string;
};

export function isLoggedIn(): boolean {
  if (typeof window === 'undefined') return false;
  return !!window.localStorage.getItem(HOMEY_PROFILE_KEY);
}

export function getUserProfile(): HomeyUserProfile | null {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(HOMEY_PROFILE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as HomeyUserProfile;
  } catch {
    return null;
  }
}

export function saveUserProfile(profile: HomeyUserProfile): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(HOMEY_PROFILE_KEY, JSON.stringify(profile));
}

export function logout(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(HOMEY_PROFILE_KEY);
  window.localStorage.removeItem(HOMEY_MILESTONES_KEY);
}

export async function fetchSessionUser(): Promise<SessionUser | null> {
  try {
    const response = await fetch('http://localhost:5185/api/auth/me', {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok || response.status === 204) {
      return null;
    }

    return (await response.json()) as SessionUser;
  } catch {
    return null;
  }
}

export async function backendLogout(): Promise<void> {
  try {
    await fetch('http://localhost:5185/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });
  } catch {
    // Swallow network errors for logout.
  }
}

