import { API_URL } from '@/lib/api';

// ── Milestones ───────────────────────────────────────────────────────────────

export type MilestoneRecord = {
  milestoneId: number;
  completed: boolean;
  completedAt?: string | null;
};

export async function fetchMilestones(): Promise<MilestoneRecord[]> {
  try {
    const res = await fetch(`${API_URL}/api/milestones`, { credentials: 'include' });
    if (!res.ok) return [];
    return (await res.json()) as MilestoneRecord[];
  } catch {
    return [];
  }
}

export async function saveMilestone(milestoneId: number, completed: boolean): Promise<void> {
  try {
    await fetch(`${API_URL}/api/milestones/${milestoneId}`, {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed }),
    });
  } catch {
    // silently ignore — localStorage still has it
  }
}

// ── Learning Progress ────────────────────────────────────────────────────────

export async function fetchLearningProgress(): Promise<string[]> {
  try {
    const res = await fetch(`${API_URL}/api/learning/progress`, { credentials: 'include' });
    if (!res.ok) return [];
    return (await res.json()) as string[];
  } catch {
    return [];
  }
}

export async function markModuleComplete(moduleId: string): Promise<void> {
  try {
    await fetch(`${API_URL}/api/learning/progress/${encodeURIComponent(moduleId)}`, {
      method: 'POST',
      credentials: 'include',
    });
  } catch {
    // silently ignore — localStorage still has it
  }
}

// ── Money Settings ───────────────────────────────────────────────────────────

export type MoneySettings = {
  monthlySavingsGoal: number | null;
  housingBudget: number | null;
};

export async function fetchMoneySettings(): Promise<MoneySettings | null> {
  try {
    const res = await fetch(`${API_URL}/api/money-settings`, { credentials: 'include' });
    if (!res.ok) return null;
    return (await res.json()) as MoneySettings;
  } catch {
    return null;
  }
}

export async function saveMoneySettings(monthlySavingsGoal: number | null, housingBudget: number | null): Promise<void> {
  try {
    await fetch(`${API_URL}/api/money-settings`, {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ monthlySavingsGoal, housingBudget }),
    });
  } catch {
    // silently ignore — localStorage still has it
  }
}
