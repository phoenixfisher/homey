import { API_URL } from '@/lib/api';

export type OkrMetrics = {
  totalUsers: number;
  activeUsers: number;
  activeWindowDays: number;
};

export async function fetchOkrMetrics(): Promise<OkrMetrics | null> {
  try {
    const res = await fetch(`${API_URL}/api/metrics/okr`, { credentials: 'include' });
    if (!res.ok) return null;
    return (await res.json()) as OkrMetrics;
  } catch {
    return null;
  }
}

