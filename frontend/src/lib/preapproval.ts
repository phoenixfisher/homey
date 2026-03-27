import { API_URL } from '@/lib/api';

// ── Types ────────────────────────────────────────────────────────────────────

export type LoanApplicationData = {
  phone?: string;
  dependents?: string;
  maritalStatus?: string;
  currentAddress?: string;
  currentAddressYears?: string;
  previousAddress?: string;
  rentOrOwn?: string;
  monthlyHousingPayment?: number | null;
  landlordContact?: string;
  employerName?: string;
  employerAddress?: string;
  jobTitle?: string;
  employmentType?: string;
  startDate?: string;
  previousEmployer?: string;
  employmentGaps?: string;
  baseSalary?: number | null;
  bonuses?: number | null;
  selfEmployIncome?: number | null;
  rentalIncome?: number | null;
  otherIncome?: number | null;
  otherIncomeSource?: string;
  checkingBalance?: number | null;
  savingsBalance?: number | null;
  retirementBalance?: number | null;
  investmentBalance?: number | null;
  giftFunds?: number | null;
  realEstateValue?: number | null;
  otherAssets?: string;
  creditCardPayment?: number | null;
  studentLoanPayment?: number | null;
  autoLoanPayment?: number | null;
  childSupport?: number | null;
  otherDebt?: number | null;
  declOutstandingJudgments?: string;
  declBankruptcy?: string;
  declForeclosure?: string;
  declLawsuit?: string;
  declCosigner?: string;
  declCitizenship?: string;
  declPrimaryResidence?: string;
  savedAt?: string | null;
};

export type DocumentChecklist = {
  paystub1: boolean;
  paystub2: boolean;
  paystubEoy1: boolean;
  paystubEoy2: boolean;
  tax1: boolean;
  tax2: boolean;
  w2Year1: boolean;
  w2Year2: boolean;
  govId: boolean;
  bank1: boolean;
  bank2: boolean;
  bank3: boolean;
  bank4: boolean;
  savedAt?: string | null;
};

export type QualificationSnapshot = {
  dti?: number | null;
  creditScore?: number | null;
  monthlyIncome?: number | null;
  monthlyExpenses?: number | null;
  savings?: number | null;
  downPaymentPct?: number | null;
  savedAt?: string | null;
};

export type PreApprovalCompletion = {
  completed: boolean;
  completedAt?: string | null;
};

// ── Loan Application ─────────────────────────────────────────────────────────

export async function fetchLoanApplication(): Promise<LoanApplicationData | null> {
  const res = await fetch(`${API_URL}/api/preapproval/loan-application`, {
    credentials: 'include',
  });
  if (res.status === 401) return null;
  if (!res.ok) throw new Error('Failed to load loan application');
  return (await res.json()) as LoanApplicationData | null;
}

export async function saveLoanApplication(data: LoanApplicationData): Promise<void> {
  const res = await fetch(`${API_URL}/api/preapproval/loan-application`, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to save loan application');
}

// ── Document Checklist ───────────────────────────────────────────────────────

export async function fetchDocumentChecklist(): Promise<DocumentChecklist | null> {
  const res = await fetch(`${API_URL}/api/preapproval/documents`, {
    credentials: 'include',
  });
  if (res.status === 401) return null;
  if (!res.ok) throw new Error('Failed to load document checklist');
  return (await res.json()) as DocumentChecklist | null;
}

export async function saveDocumentChecklist(data: Omit<DocumentChecklist, 'savedAt'>): Promise<void> {
  const res = await fetch(`${API_URL}/api/preapproval/documents`, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to save document checklist');
}

// ── Qualification Snapshot ───────────────────────────────────────────────────

export async function fetchQualificationSnapshot(): Promise<QualificationSnapshot | null> {
  const res = await fetch(`${API_URL}/api/preapproval/qualification`, {
    credentials: 'include',
  });
  if (res.status === 401) return null;
  if (!res.ok) throw new Error('Failed to load qualification snapshot');
  return (await res.json()) as QualificationSnapshot | null;
}

export async function saveQualificationSnapshot(data: Omit<QualificationSnapshot, 'savedAt'>): Promise<void> {
  const res = await fetch(`${API_URL}/api/preapproval/qualification`, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to save qualification snapshot');
}

// ── Pre-Approval Completion ──────────────────────────────────────────────────

export async function fetchPreApprovalCompletion(): Promise<PreApprovalCompletion | null> {
  const res = await fetch(`${API_URL}/api/preapproval/complete`, {
    credentials: 'include',
  });
  if (res.status === 401) return null;
  if (!res.ok) throw new Error('Failed to load completion status');
  return (await res.json()) as PreApprovalCompletion;
}

export async function markPreApprovalComplete(): Promise<void> {
  const res = await fetch(`${API_URL}/api/preapproval/complete`, {
    method: 'POST',
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to mark pre-approval complete');
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Format a saved-at ISO timestamp into a friendly string like "Mar 27, 2026 at 3:45 PM" */
export function formatSavedAt(savedAt: string | null | undefined): string | null {
  if (!savedAt) return null;
  try {
    return new Date(savedAt).toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: 'numeric', minute: '2-digit',
    });
  } catch {
    return null;
  }
}

/** Strip non-numeric characters and parse to a number, or return null */
export function parseCurrencyField(raw: string | undefined): number | null {
  if (!raw) return null;
  const digits = raw.replace(/[^0-9.]/g, '');
  const n = parseFloat(digits);
  return isNaN(n) ? null : n;
}
