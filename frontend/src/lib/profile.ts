import { API_URL } from '@/lib/api';
import { getUserProfile, saveUserProfile, type HomeyUserProfile } from '@/lib/auth';

function parseHomeyMoney(value: string | undefined): number {
  if (value === undefined || value === null) return Number.NaN;
  const cleaned = String(value).replace(/[^0-9.-]/g, '');
  if (cleaned === '' || cleaned === '-') return Number.NaN;
  const n = Number.parseFloat(cleaned);
  return Number.isFinite(n) ? n : Number.NaN;
}

/**
 * True when target home price and monthly income/expenses are present so
 * target price and net monthly budget (income − expenses) are meaningful.
 */
export function profileHasTargetPriceAndMonthlyBudget(profile: HomeyUserProfile | null): boolean {
  if (!profile) return false;
  const target = parseHomeyMoney(profile.desiredHomePrice);
  const income = parseHomeyMoney(profile.monthlyIncome);
  const expenses = parseHomeyMoney(profile.monthlyExpenses);
  if (!(target > 0)) return false;
  if (!(income > 0)) return false;
  if (!Number.isFinite(expenses) || expenses < 0) return false;
  return true;
}

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
  targetZipCode: string | null;
  industryOfWork: string | null;
  role: string;
};

export type UpdateUserProfileRequest = Omit<UserProfile, 'userId' | 'role'>;

/** Writes API profile fields into `homeyProfile` for dashboard and onboarding UI. */
export function applyUserProfileToLocalStorage(loaded: UserProfile): void {
  const existing = getUserProfile();
  saveUserProfile({
    name: `${loaded.firstName} ${loaded.lastName}`.trim(),
    desiredHomePrice: loaded.desiredHomePrice?.toString() ?? '',
    creditScore: loaded.creditScore?.toString() ?? '',
    monthlyIncome: loaded.monthlyIncome?.toString() ?? '',
    yearlyIncome: existing?.yearlyIncome ?? '',
    savingsTotal: loaded.totalSavings?.toString() ?? '',
    monthlyExpenses: loaded.monthlyExpenses?.toString() ?? '',
    industry: loaded.industryOfWork ?? '',
  });
}

/**
 * Loads the authenticated user's profile from the API into localStorage (`homeyProfile`)
 * so the dashboard and other client-only flows match the database.
 * No-op if there is no session or no profile row (404/401).
 */
export async function hydrateLocalProfileFromServer(): Promise<void> {
  const loaded = await fetchUserProfile();
  if (!loaded) {
    return;
  }
  applyUserProfileToLocalStorage(loaded);
}

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
