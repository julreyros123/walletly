import { create } from 'zustand';
import { AppState } from 'react-native';
import { storage } from '@/utils/storage';
import { supabase } from '@/utils/supabase';
import { syncQueue } from '@/utils/syncQueue';
import { applyRemoteRows, getLocalRows, saveLocalAppState, loadLocalAppState, getLatestLocalAppState } from '@/db/localRepository';
import { safeHaptic } from '@/utils/haptics';
import { useExchangeRateStore } from './exchangeRateStore';

export const CURRENT_GAMIFICATION_VERSION = 2;
const BASE_GAMIFICATION_KEY = 'cbudget_gamification_state';

// Track the current authenticated user ID for state scoping
let currentActiveUserId: string | null = null;
let lastHydratedTarget: string | null | undefined = undefined;
let hydrationGeneration = 0;
let isHydrationComplete = false;
let activeHydrationPromise: Promise<void> | null = null;
let activeHydratingUserId: string | null | undefined = undefined;

export function setActiveGamificationUser(userId: string | null) {
  currentActiveUserId = userId;
  lastHydratedTarget = undefined;
  cloudReadyUserId = null;
}

export function getUserStorageKey(userId?: string | null): string {
  if (userId && userId !== 'guest') {
    return `${BASE_GAMIFICATION_KEY}_${userId}`;
  }
  return `${BASE_GAMIFICATION_KEY}_guest`;
}

// ── Cloud snapshot backup (public.user_app_state) ─────────────────────
// Only transactions / budgets / saving goals have dedicated tables. Everything else
// (XP, level, budget type, savings vault, lessons, portfolio...) lived only on-device,
// so a reinstall / new device looked like a full account reset. We mirror the full
// persisted state to a single JSONB row per user.
const CLOUD_STATE_TABLE = 'user_app_state';
const CLOUD_SNAPSHOT_DEBOUNCE_MS = 1500;
let cloudSnapshotTimer: ReturnType<typeof setTimeout> | null = null;
let pendingCloudSnapshot: { userId: string; data: Record<string, unknown> } | null = null;
let cloudSnapshotDisabled = false;
// Uploads are blocked until the user's cloud state has been read, so a fresh/empty
// device can never overwrite the real cloud backup with default values.
let cloudReadyUserId: string | null = null;

function isMissingTableError(error: { code?: string; message?: string } | null | undefined): boolean {
  if (!error) return false;
  return (
    error.code === 'PGRST205' ||
    error.code === '42P01' ||
    Boolean(error.message?.includes('does not exist')) ||
    Boolean(error.message?.includes('schema cache'))
  );
}

async function uploadCloudSnapshot(userId: string, data: Record<string, unknown>): Promise<void> {
  if (cloudSnapshotDisabled) return;
  try {
    const { error } = await supabase.from(CLOUD_STATE_TABLE).upsert({
      user_id: userId,
      state: data,
      updated_at: new Date().toISOString(),
    });
    if (error) {
      if (isMissingTableError(error)) {
        cloudSnapshotDisabled = true;
        console.warn('[GamificationStore] user_app_state table missing. Run supabase/user_app_state.sql to enable cloud backup.');
      } else {
        console.warn('[GamificationStore] Cloud snapshot upload failed:', error.message);
      }
    }
  } catch (e) {
    console.warn('[GamificationStore] Cloud snapshot upload error:', e);
  }
}

function scheduleCloudSnapshot(userId: string, data: Record<string, unknown>): void {
  if (cloudSnapshotDisabled || cloudReadyUserId !== userId) return;
  pendingCloudSnapshot = { userId, data };
  if (cloudSnapshotTimer) clearTimeout(cloudSnapshotTimer);
  cloudSnapshotTimer = setTimeout(() => {
    flushCloudSnapshot().catch((err) => console.warn('[GamificationStore] Snapshot flush error:', err));
  }, CLOUD_SNAPSHOT_DEBOUNCE_MS);
}

/** Immediately uploads any pending cloud snapshot (call before sign-out / on background). */
export async function flushCloudSnapshot(): Promise<void> {
  if (cloudSnapshotTimer) {
    clearTimeout(cloudSnapshotTimer);
    cloudSnapshotTimer = null;
  }
  const pending = pendingCloudSnapshot;
  pendingCloudSnapshot = null;
  if (pending) await uploadCloudSnapshot(pending.userId, pending.data);
}

/** Drops any pending snapshot without uploading (used on account deletion). */
export function cancelCloudSnapshot(): void {
  if (cloudSnapshotTimer) {
    clearTimeout(cloudSnapshotTimer);
    cloudSnapshotTimer = null;
  }
  pendingCloudSnapshot = null;
  cloudReadyUserId = null;
}

/**
 * Standard RFC4122 v4 UUID generator compatible with PostgreSQL UUID primary keys
 */
export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    try {
      return crypto.randomUUID();
    } catch (e) {
      console.warn('[UUID] crypto.randomUUID fallback:', e);
    }
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Normalizes input date strings (e.g. "Sep 25", "Sep 25, 2026", or undefined)
 * into a strict YYYY-MM-DD format accepted by PostgreSQL DATE columns.
 */
export function toISODate(dateStr?: string): string {
  if (!dateStr) return getLocalDateString();
  const trimmed = dateStr.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  const currentYear = new Date().getFullYear();
  const withYear = trimmed.includes(String(currentYear)) ? trimmed : `${trimmed}, ${currentYear}`;
  const parsed = new Date(withYear);
  if (!isNaN(parsed.getTime())) {
    return getLocalDateString(parsed);
  }
  return getLocalDateString();
}

/**
 * Returns the current date in local device timezone formatted as YYYY-MM-DD.
 * Prevents timezone mismatches between UTC and local calendar days.
 */
export function getLocalDateString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Safely computes calendar day difference between two date strings (YYYY-MM-DD or ISO strings).
 * Uses Date.UTC to eliminate daylight saving time (DST) shifts and timezone offsets.
 */
export function getDaysDifference(dateA?: string | null, dateB?: string | null): number {
  if (!dateA || !dateB) return -1;
  const cleanA = dateA.slice(0, 10);
  const cleanB = dateB.slice(0, 10);
  const [y1, m1, d1] = cleanA.split('-').map(Number);
  const [y2, m2, d2] = cleanB.split('-').map(Number);
  if (isNaN(y1) || isNaN(m1) || isNaN(d1) || isNaN(y2) || isNaN(m2) || isNaN(d2)) {
    return -1;
  }
  const utc1 = Date.UTC(y1, m1 - 1, d1);
  const utc2 = Date.UTC(y2, m2 - 1, d2);
  return Math.round((utc2 - utc1) / (1000 * 60 * 60 * 24));
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  unlockedAt?: string;
}

export interface Expense {
  id: string;
  name: string;
  category: string;
  amount: number;
  date: string;
  time?: string; // 12-hour format e.g. "02:30 PM"
  notes?: string;
  type?: 'expense' | 'income';
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentSavings: number;
  targetDate: string;
  category: string; // Emergency Fund, New Laptop, School Tuition, etc.
}

export interface SavingsRecord {
  id: string;
  amount: number;
  date: string; // e.g., "Sep 25, 2026"
  time: string; // 12-hour format e.g., "09:15 PM"
  note: string;
  cycle: 'daily' | 'weekly' | 'monthly';
  createdAtISO: string;
}

export function format12HourTime(d: Date = new Date()): string {
  let hours = d.getHours();
  const minutes = d.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const minutesStr = String(minutes).padStart(2, '0');
  const hoursStr = String(hours).padStart(2, '0');
  return `${hoursStr}:${minutesStr} ${ampm}`;
}

export function formatShortDate(d: Date = new Date()): string {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function parseExpenseDate(dateStr: string): Date {
  if (!dateStr) return new Date();
  const trimmed = dateStr.trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    const cleanDate = trimmed.slice(0, 10);
    const [y, m, d] = cleanDate.split('-').map(Number);
    if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
      return new Date(y, m - 1, d);
    }
  }
  const parsed = Date.parse(trimmed);
  if (!isNaN(parsed)) {
    const d = new Date(parsed);
    if (d.getFullYear() < 2000) {
      d.setFullYear(new Date().getFullYear());
    }
    return d;
  }
  return new Date();
}

export function isTodayDate(dateStr: string): boolean {
  if (!dateStr) return true;
  const todayISO = getLocalDateString();
  const todayStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  if (dateStr === todayISO || dateStr === todayStr || dateStr.startsWith(todayISO)) return true;
  const d = parseExpenseDate(dateStr);
  const now = new Date();
  return (
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear()
  );
}

export function isThisWeekDate(dateStr: string): boolean {
  if (isTodayDate(dateStr)) return true;
  const d = parseExpenseDate(dateStr);
  const now = new Date();
  const diffTime = now.getTime() - d.getTime();
  const diffDays = diffTime / (1000 * 3600 * 24);
  return diffDays >= 0 && diffDays <= 7;
}

export function isThisMonthDate(dateStr: string): boolean {
  if (isTodayDate(dateStr) || isThisWeekDate(dateStr)) return true;
  const d = parseExpenseDate(dateStr);
  const now = new Date();
  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
}

export interface CycleMetrics {
  cycle: 'daily' | 'weekly' | 'monthly';
  cycleName: string;
  limit: number;
  spent: number;
  income: number;
  netSpent: number;
  balance: number;
}

export function getCycleMetrics(
  state: {
    totalBudget: number;
    budgetType: 'daily' | 'weekly' | 'monthly' | null;
    loggedExpenses: Expense[];
  },
  customCurrency?: string
): CycleMetrics {
  const cycle = state.budgetType || 'monthly';
  let activeCurrency = customCurrency;
  if (!activeCurrency) {
    try {
      const { usePreferencesStore } = require('@/store/preferencesStore');
      activeCurrency = usePreferencesStore.getState().currency || 'PHP';
    } catch {
      activeCurrency = 'PHP';
    }
  }

  let limit = state.totalBudget;
  if (!limit || limit <= 0) {
    const phpBaseline =
      cycle === 'daily'
        ? 150
        : cycle === 'weekly'
        ? 1000
        : 4000;

    if (activeCurrency === 'PHP') {
      limit = phpBaseline;
    } else {
      limit = useExchangeRateStore.getState().convert(phpBaseline, 'PHP', activeCurrency || 'PHP');
    }
  }

  const cycleName =
    cycle === 'daily'
      ? "Today's Baon"
      : cycle === 'weekly'
      ? "This Week's Allowance"
      : "Current Balance";

  let expenses = 0;
  let income = 0;

  for (const item of state.loggedExpenses) {
    const isRelevant =
      cycle === 'daily'
        ? isTodayDate(item.date)
        : cycle === 'weekly'
        ? isThisWeekDate(item.date)
        : isThisMonthDate(item.date);

    if (isRelevant) {
      if (item.type === 'income') {
        income += item.amount;
      } else {
        expenses += item.amount;
      }
    }
  }

  const netSpent = Math.max(0, expenses - income);
  const balance = Math.max(0, limit - expenses + income);

  return {
    cycle,
    cycleName,
    limit,
    spent: expenses,
    income,
    netSpent,
    balance,
  };
}

interface GamificationState {
  xp: number;
  level: number;
  streakDays: number;
  lastActiveDate: string | null;
  lastClaimedRewardDate: string | null;
  lastClaimedDay?: number;
  achievements: Achievement[];

  // Educational Subscores (0 - 100)
  budgetingScore: number;
  learningScore: number;
  savingScore: number;
  investingScore: number;

  // Custom Avatar Mastery Title
  customAvatar: string;

  // Budget Setup State
  isBudgetSetupComplete: boolean;
  budgetType: 'daily' | 'weekly' | 'monthly' | null;
  totalBudget: number;
  selectedCategories: string[];
  categoryLimits: Record<string, number>;

  // Logged Expenses, Incomes & Savings Goals
  loggedExpenses: Expense[];
  savingsGoals: SavingsGoal[];
  unspentSavingsVault: number;
  savingsRecords: SavingsRecord[];

  // Simulated Investing Cash Balance
  virtualBalance: number;
  portfolioAllocations: Record<string, number>;
  riskProfile: 'Conservative' | 'Moderate' | 'Aggressive' | null;
  spareChangeAccumulated: number;

  // Completed Lessons Tracking (prevents duplicate XP exploits)
  completedLessonIds: string[];
  lastDividendClaimDates: Record<string, string>; // ticker -> YYYY-MM-DD
  guestSessionDate?: string;
  currency?: string;
  pendingLevelUp: number | null;
  dismissLevelUp: () => void;

  // Core Actions
  addXP: (amount: number) => void;
  checkAndUpdateStreak: () => void;
  claimDailyReward: () => { success: boolean; xp: number; cash: number; day?: number };
  debugSimulateNextDay: () => void;
  convertAllMonetaryValues: (fromCurrency: string, toCurrency: string) => void;
  unlockAchievement: (achievementId: string) => void;

  // Budget & Expense Actions
  setupBudget: (
    type: 'daily' | 'weekly' | 'monthly',
    amount: number,
    categories: string[],
    limits: Record<string, number>
  ) => void;
  setBudgetType: (type: 'daily' | 'weekly' | 'monthly', amount?: number) => void;
  addExpense: (name: string, category: string, amount: number, date?: string, notes?: string, time?: string) => void;
  editExpense: (id: string, updated: Partial<Omit<Expense, 'id'>>) => void;
  deleteExpense: (id: string) => void;
  addIncome: (name: string, category: string, amount: number, date?: string, notes?: string, time?: string) => void;
  resetBudget: () => void;
  resetAllData: (defaultVirtualBalance?: number) => void;

  // Savings Actions
  addSavingsGoal: (name: string, targetAmount: number, targetDate: string, category: string) => void;
  updateSavingsGoal: (
    goalId: string,
    updates: { name?: string; targetAmount?: number; category?: string; targetDate?: string }
  ) => void;
  contributeToSavingsGoal: (goalId: string, amount: number) => boolean;
  withdrawSavingsGoal: (goalId: string, amount: number) => boolean;
  deleteSavingsGoal: (goalId: string) => void;
  allocateUnspentSavings: (amount: number, note?: string) => boolean;
  withdrawUnspentSavings: (amount: number) => boolean;

  // Simulator & Games Actions
  allocateToSimulation: (amount: number) => boolean;
  sweepSpareChange: () => void;
  tradeAssetSim: (ticker: string, type: 'buy' | 'sell', qty: number, price: number) => boolean;
  setRiskProfile: (profile: 'Conservative' | 'Moderate' | 'Aggressive' | null) => void;
  grantOnboardingCash: (amount: number) => void;
  addSimulationCash: (amount: number, xpReward?: number) => void;
  deductBet: (amount: number) => boolean;
  creditGameReward: (xp: number, cashProfit: number) => void;
  claimDailyDividend: (ticker: string, amount: number) => boolean;

  // Learning & General
  completeLesson: (moduleName: string, lessonId?: string) => void;
  setCustomAvatar: (avatar: string) => void;
  getFinancialHealthScore: () => number;
  checkMidnightGuestReset: () => void;
  hydrate: (targetUserId?: string | null) => Promise<void>;
}

export const LEVEL_THRESHOLDS = [
  0,     // Level 1: 0 - 99 XP
  100,   // Level 2: 100 - 199 XP
  200,   // Level 3: 200 - 299 XP
  300,   // Level 4: 300 - 449 XP
  450,   // Level 5: 450 - 599 XP
  600,   // Level 6: 600 - 799 XP
  800,   // Level 7: 800 - 1099 XP
  1100,  // Level 8: 1100 - 1499 XP
  1500,  // Level 9: 1500 - 1999 XP
  2000,  // Level 10: 2000 - 2599 XP
  2600,  // Level 11: 2600 - 3299 XP
  3300,  // Level 12: 3300 - 4099 XP
  4100,  // Level 13: 4100 - 4999 XP
  5000,  // Level 14: 5000+ XP
];

export function calculateLevelFromXP(xp: number): number {
  let level = 1;
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) {
      level = i + 1;
      break;
    }
  }
  return level;
}

export function getLevelProgress(xp: number) {
  const level = calculateLevelFromXP(xp);
  const currentFloor = LEVEL_THRESHOLDS[level - 1] ?? 0;
  const nextCeil = LEVEL_THRESHOLDS[level] ?? currentFloor + 100;
  const xpInLevel = Math.max(0, xp - currentFloor);
  const xpNeeded = Math.max(1, nextCeil - currentFloor);
  const progressRatio = Math.min(1, Math.max(0, xpInLevel / xpNeeded));

  return {
    level,
    currentFloor,
    nextCeil,
    xpInLevel,
    xpNeeded,
    progressRatio,
  };
}

export function applyXpGain(
  state: { xp: number; level: number; pendingLevelUp?: number | null },
  xpGain: number
) {
  const newXp = state.xp + xpGain;
  const newLevel = calculateLevelFromXP(newXp);
  const leveledUp = newLevel > state.level;
  if (leveledUp) {
    safeHaptic('success');
  }
  return {
    xp: newXp,
    level: Math.max(state.level, newLevel),
    pendingLevelUp: leveledUp ? newLevel : (state.pendingLevelUp ?? null),
  };
}

export const ALL_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_budget',
    title: 'First Budget Created',
    description: 'Defined your budgeting frequency, limit, and categories.',
    icon: 'CheckCircle',
    color: '#10B981',
  },
  {
    id: 'first_lesson',
    title: 'First Lesson Completed',
    description: 'Finished your first Cbudget Academy lesson module.',
    icon: 'GraduationCap',
    color: '#3B82F6',
  },
  {
    id: 'streak_7',
    title: '7 Day Learning Streak',
    description: 'Maintained a 7-day streak of active financial learning.',
    icon: 'Fire',
    color: '#F59E0B',
  },
  {
    id: 'invest_graduate',
    title: 'Investment Lab Graduate',
    description: 'Allocated simulation cash across assets in the Investment Lab.',
    icon: 'GraduationCap',
    color: '#8B5CF6',
  },
  {
    id: 'budget_master',
    title: 'Budget Master',
    description: 'Kept overall budgeting score above 90.',
    icon: 'ChartPie',
    color: '#06B6D4',
  },
  {
    id: 'financial_explorer',
    title: 'Financial Explorer',
    description: 'Unlocked 5 different lessons and completed 3 quizzes.',
    icon: 'Sparkle',
    color: '#EC4899',
  },
  {
    id: 'savings_strategist',
    title: 'Savings Strategist',
    description: 'Reached a simulated savings score of 85 or higher.',
    icon: 'HandCoins',
    color: '#10B981',
  },
  {
    id: 'emergency_fund_planner',
    title: 'Emergency Fund Planner',
    description: 'Completed the Emergency Funds saving strategy lesson.',
    icon: 'ShieldCheck',
    color: '#EF4444',
  },
  {
    id: 'compound_master',
    title: 'Time Compounding Guru',
    description: 'Simulated a long-term 20-year compound interest savings timeline.',
    icon: 'Hourglass',
    color: '#10B981',
  },
  // Arcade Trophies
  {
    id: 'alpha_guru',
    title: 'Alpha Guru',
    description: 'Predict 5/5 headlines in Headline Trader.',
    icon: 'Trophy',
    color: '#F59E0B',
  },
  {
    id: 'moon_shot_master',
    title: 'Moon Shot Master',
    description: 'Cash out Crypto Rocket at 3.00x or higher.',
    icon: 'Rocket',
    color: '#8B5CF6',
  },
  {
    id: 'streak_champion',
    title: 'Streak Champion',
    description: 'Activate 2x Fire Streak in any mini-game.',
    icon: 'Lightning',
    color: '#EC4899',
  },
];

async function persistState(state: GamificationState, specificUserId?: string | null) {
  try {
    if (!isHydrationComplete && specificUserId === undefined) {
      // Ignore premature persist calls while store is loading from cache
      return;
    }
    const targetUserId = specificUserId !== undefined ? specificUserId : currentActiveUserId;
    const storageKey = getUserStorageKey(targetUserId);

    // Guard against accidentally wiping populated user data with default zeroes
    const isStateBlank =
      !state.isBudgetSetupComplete &&
      (state.completedLessonIds || []).length === 0 &&
      Object.keys(state.portfolioAllocations || {}).length === 0 &&
      (state.virtualBalance || 0) === 0 &&
      (state.xp || 0) <= 45;

    if (isStateBlank) {
      const existingJson = (await loadLocalAppState(storageKey)) || (await storage.getItem(storageKey));
      if (existingJson) {
        try {
          const parsed = JSON.parse(existingJson);
          const hasExistingProgress =
            (parsed.completedLessonIds || []).length > 0 ||
            Object.keys(parsed.portfolioAllocations || {}).length > 0 ||
            (parsed.virtualBalance || 0) > 0 ||
            (parsed.xp || 0) > 45 ||
            (parsed.streakDays || 1) > 1;
          if (hasExistingProgress) {
            // Refuse to overwrite real user data with empty defaults
            return;
          }
        } catch {}
      }
    }

    const dataToSave = {
      _version: CURRENT_GAMIFICATION_VERSION,
      xp: state.xp,
      level: state.level,
      streakDays: state.streakDays,
      lastActiveDate: state.lastActiveDate,
      lastClaimedRewardDate: state.lastClaimedRewardDate,
      lastClaimedDay: state.lastClaimedDay,
      achievements: state.achievements,
      budgetingScore: state.budgetingScore,
      learningScore: state.learningScore,
      savingScore: state.savingScore,
      investingScore: state.investingScore,
      customAvatar: state.customAvatar,
      isBudgetSetupComplete: state.isBudgetSetupComplete,
      budgetType: state.budgetType,
      totalBudget: state.totalBudget,
      selectedCategories: state.selectedCategories,
      categoryLimits: state.categoryLimits,
      loggedExpenses: state.loggedExpenses,
      savingsGoals: state.savingsGoals,
      unspentSavingsVault: state.unspentSavingsVault,
      savingsRecords: state.savingsRecords,
      virtualBalance: state.virtualBalance,
      portfolioAllocations: state.portfolioAllocations,
      riskProfile: state.riskProfile,
      spareChangeAccumulated: state.spareChangeAccumulated,
      completedLessonIds: state.completedLessonIds,
      lastDividendClaimDates: state.lastDividendClaimDates,
      guestSessionDate: state.guestSessionDate,
      currency: state.currency || 'PHP',
      _savedAt: Date.now(),
    };

    const json = JSON.stringify(dataToSave);

    // 1. Save directly into SQLite local_app_state table (guaranteed APK upgrade durability)
    await saveLocalAppState(storageKey, json);

    // 2. Save into AsyncStorage & SecureStore chunked mirror
    await storage.setItem(storageKey, json);

    if (targetUserId && targetUserId !== 'guest') {
      scheduleCloudSnapshot(targetUserId, dataToSave);
    }
  } catch (e) {
    console.warn('[GamificationStore] Failed to persist state:', e);
  }
}

export type GamificationDataState = {
  xp: number;
  level: number;
  pendingLevelUp: number | null;
  streakDays: number;
  lastActiveDate: string | null;
  lastClaimedRewardDate: string | null;
  lastClaimedDay?: number;
  achievements: Achievement[];
  budgetingScore: number;
  learningScore: number;
  savingScore: number;
  investingScore: number;
  customAvatar: string;
  isBudgetSetupComplete: boolean;
  budgetType: 'daily' | 'weekly' | 'monthly' | null;
  totalBudget: number;
  selectedCategories: string[];
  categoryLimits: Record<string, number>;
  loggedExpenses: Expense[];
  savingsGoals: SavingsGoal[];
  unspentSavingsVault: number;
  savingsRecords: SavingsRecord[];
  virtualBalance: number;
  portfolioAllocations: Record<string, number>;
  riskProfile: 'Conservative' | 'Moderate' | 'Aggressive' | null;
  spareChangeAccumulated: number;
  completedLessonIds: string[];
  lastDividendClaimDates: Record<string, string>;
  guestSessionDate?: string;
  currency?: string;
};

export const DEFAULT_GAMIFICATION_DATA: GamificationDataState = {
  xp: 45,
  level: 1,
  streakDays: 1,
  lastActiveDate: null,
  lastClaimedRewardDate: null,
  lastClaimedDay: undefined,
  achievements: [],
  budgetingScore: 0,
  learningScore: 0,
  savingScore: 0,
  investingScore: 0,
  customAvatar: 'Budget Beginner',
  isBudgetSetupComplete: false,
  budgetType: null,
  totalBudget: 0,
  selectedCategories: [],
  categoryLimits: {},
  loggedExpenses: [],
  savingsGoals: [],
  unspentSavingsVault: 0,
  savingsRecords: [],
  virtualBalance: 0,
  portfolioAllocations: {},
  riskProfile: null,
  spareChangeAccumulated: 0,
  completedLessonIds: [],
  lastDividendClaimDates: {},
  guestSessionDate: undefined,
  currency: 'PHP',
  pendingLevelUp: null,
};

export const useGamificationStore = create<GamificationState>()((set, get) => ({
  ...DEFAULT_GAMIFICATION_DATA,

  dismissLevelUp: () => set({ pendingLevelUp: null }),

  addXP: (amount) => {
    set((state) => {
      const xpUpdate = applyXpGain(state, amount);
      const next = {
        ...xpUpdate,
      };
      persistState({ ...state, ...next });
      return next;
    });
  },

  checkAndUpdateStreak: () => {
    const today = getLocalDateString();
    set((state) => {
      // Guard against running before stored cache has hydrated
      if (!isHydrationComplete) {
        return state;
      }

      if (!state.lastActiveDate) {
        const next = { streakDays: state.streakDays || 1, lastActiveDate: today };
        persistState({ ...state, ...next });
        return next;
      }

      const cleanLastActive = state.lastActiveDate.slice(0, 10);
      if (cleanLastActive === today) {
        return state;
      }

      const diffDays = getDaysDifference(cleanLastActive, today);

      if (diffDays === 1) {
        // Consecutive calendar day: advance streak and update active date
        const next = {
          streakDays: (state.streakDays || 1) + 1,
          lastActiveDate: today,
          savingScore: Math.min(100, state.savingScore + 2),
        };
        persistState({ ...state, ...next });
        return next;
      } else if (diffDays === 2) {
        // 1-day grace period: maintain current streak without resetting
        const next = {
          lastActiveDate: today,
          savingScore: Math.min(100, state.savingScore + 1),
        };
        persistState({ ...state, ...next });
        return next;
      } else if (diffDays > 2) {
        // Inactive for more than 2 calendar days: reset streak to 1
        const next = {
          streakDays: 1,
          lastClaimedDay: undefined,
          lastActiveDate: today,
        };
        persistState({ ...state, ...next });
        return next;
      }
      return state;
    });
  },

  claimDailyReward: () => {
    let result = { success: false, xp: 0, cash: 0, day: 1 };
    set((state) => {
      const today = getLocalDateString();
      if (state.lastClaimedRewardDate?.slice(0, 10) === today) {
        return state;
      }

      const daysSinceLastClaim = state.lastClaimedRewardDate
        ? getDaysDifference(state.lastClaimedRewardDate, today)
        : -1;

      let dayInCycle = 1;
      let nextStreak = 1;
      if (daysSinceLastClaim === 1) {
        // Consecutive check-in! Advance cleanly in the 1..7 cycle
        const prevDay = state.lastClaimedDay || 1;
        dayInCycle = (prevDay % 7) + 1;
        nextStreak = (state.streakDays || 0) + 1;
      } else if (daysSinceLastClaim === -1) {
        // First ever claim
        dayInCycle = 1;
        nextStreak = Math.max(state.streakDays || 1, 1);
      } else {
        // Streak broken: restart at Day 1
        dayInCycle = 1;
        nextStreak = 1;
      }

      const xpReward = dayInCycle * 10;
      let cashReward = 0;
      if (dayInCycle === 3) cashReward = 500;
      if (dayInCycle === 7) cashReward = 2000;

      result = { success: true, xp: xpReward, cash: cashReward, day: dayInCycle };

      const newXp = state.xp + xpReward;
      const newLevel = calculateLevelFromXP(newXp);
      const leveledUp = newLevel > state.level;
      if (leveledUp) {
        safeHaptic('success');
      }

      let updatedAchievements = [...state.achievements];
      if (nextStreak >= 7 && !updatedAchievements.some((a) => a.id === 'streak_7')) {
        const ach = ALL_ACHIEVEMENTS.find((a) => a.id === 'streak_7');
        if (ach) {
          updatedAchievements.push({ ...ach, unlockedAt: new Date().toISOString() });
        }
      }

      let updatedExpenses = state.loggedExpenses;
      let rewardTransactionId: string | null = null;
      if (cashReward > 0) {
        rewardTransactionId = generateUUID();
        const now = new Date();
        const formattedTime = format12HourTime(now);
        const rewardIncome: Expense = {
          id: rewardTransactionId,
          name: dayInCycle === 7 ? 'Daily Check-In: 7-Day Streak Bonus' : `Daily Check-In Reward (Day ${dayInCycle})`,
          category: 'Rewards',
          amount: cashReward,
          date: today,
          time: formattedTime,
          notes: dayInCycle === 7 ? 'Completed 7-day sign-in streak bonus reward' : `Day ${dayInCycle} daily login bonus`,
          type: 'income',
        };
        updatedExpenses = [rewardIncome, ...state.loggedExpenses];
      }

      const next = {
        streakDays: nextStreak,
        lastClaimedDay: dayInCycle,
        lastClaimedRewardDate: today,
        lastActiveDate: today,
        xp: newXp,
        level: newLevel,
        pendingLevelUp: leveledUp ? newLevel : state.pendingLevelUp,
        virtualBalance: state.virtualBalance + cashReward,
        loggedExpenses: updatedExpenses,
        learningScore: Math.min(100, state.learningScore + dayInCycle * 2),
        achievements: updatedAchievements,
      };
      persistState({ ...state, ...next });

      if (rewardTransactionId && cashReward > 0) {
        (async () => {
          try {
            const { data: { session } } = await supabase.auth.getSession().catch(() => ({ data: { session: null } }));
            if (session?.user?.id && session.user.id !== 'guest') {
              await syncQueue.enqueue({
                table: 'transactions',
                action: 'upsert',
                payload: {
                  transaction_id: rewardTransactionId,
                  user_id: session.user.id,
                  owner_id: session.user.id,
                  type: 'income',
                  category: 'Rewards',
                  category_id: 'Rewards',
                  amount: cashReward,
                  description: dayInCycle === 7 ? 'Daily Check-In: 7-Day Streak Bonus' : `Daily Check-In Reward (Day ${dayInCycle})`,
                  transaction_date: toISODate(today),
                  date: toISODate(today),
                },
                options: { onConflict: 'transaction_id' },
              });

              // Log check-in entry for calendar streak heatmap & analytics
              await syncQueue.enqueue({
                table: 'daily_checkin_logs',
                action: 'upsert',
                payload: {
                  user_id: session.user.id,
                  checkin_date: toISODate(today),
                  streak_count: nextStreak,
                  day_in_cycle: dayInCycle,
                  xp_reward: result.xp,
                  cash_reward: cashReward,
                  claimed_at: new Date().toISOString(),
                },
                options: { onConflict: 'user_id,checkin_date' },
              });
            }
          } catch (err) {
            console.warn('[GamificationStore] Daily reward transaction sync enqueue error:', err);
          }
        })();
      }

      return next;
    });
    return result;
  },

  debugSimulateNextDay: () => {
    if (!__DEV__) return;
    set((state) => {
      // Shift last active & claim dates back by 24h
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const yesterdayISO = getLocalDateString(yesterday);
      const next = {
        lastActiveDate: yesterdayISO,
        lastClaimedRewardDate: state.lastClaimedRewardDate ? yesterdayISO : null,
      };
      persistState({ ...state, ...next });
      return next;
    });
    get().checkAndUpdateStreak();
  },

  convertAllMonetaryValues: (fromCurrency: string, toCurrency: string) => {
    if (fromCurrency === toCurrency) return;
    const convertFn = (val: number) => {
      if (!val || typeof val !== 'number' || isNaN(val)) return 0;
      return useExchangeRateStore.getState().convert(val, fromCurrency, toCurrency);
    };

    set((state) => {
      const nextTotalBudget = convertFn(state.totalBudget);
      const nextCategoryLimits: Record<string, number> = {};
      Object.entries(state.categoryLimits || {}).forEach(([cat, lim]) => {
        nextCategoryLimits[cat] = convertFn(lim);
      });

      const nextExpenses = (state.loggedExpenses || []).map((e) => ({
        ...e,
        amount: convertFn(e.amount),
      }));

      const nextGoals = (state.savingsGoals || []).map((g) => ({
        ...g,
        targetAmount: convertFn(g.targetAmount),
        currentSavings: convertFn(g.currentSavings),
      }));

      const nextRecords = (state.savingsRecords || []).map((r) => ({
        ...r,
        amount: convertFn(r.amount),
      }));

      const nextUnspent = convertFn(state.unspentSavingsVault);
      const nextBalance = convertFn(state.virtualBalance);
      const nextSpare = convertFn(state.spareChangeAccumulated);

      const next = {
        totalBudget: nextTotalBudget,
        categoryLimits: nextCategoryLimits,
        loggedExpenses: nextExpenses,
        savingsGoals: nextGoals,
        savingsRecords: nextRecords,
        unspentSavingsVault: nextUnspent,
        virtualBalance: nextBalance,
        spareChangeAccumulated: nextSpare,
        currency: toCurrency,
      };
      persistState({ ...state, ...next });
      return next;
    });
  },

  unlockAchievement: (achievementId) => {
    set((state) => {
      if (state.achievements.some((a) => a.id === achievementId)) {
        return state;
      }
      const achievement = ALL_ACHIEVEMENTS.find((a) => a.id === achievementId);
      if (!achievement) return state;

      const next = {
        achievements: [
          ...state.achievements,
          { ...achievement, unlockedAt: new Date().toISOString() },
        ],
      };
      persistState({ ...state, ...next });
      return next;
    });
  },

  setupBudget: (type, amount, categories, limits) => {
    set((state) => {
      let updatedAchievements = [...state.achievements];
      if (!updatedAchievements.some((a) => a.id === 'first_budget')) {
        const ach = ALL_ACHIEVEMENTS.find((a) => a.id === 'first_budget');
        if (ach) updatedAchievements.push({ ...ach, unlockedAt: new Date().toISOString() });
      }

      const xpUpdate = applyXpGain(state, 30);
      const next = {
        isBudgetSetupComplete: true,
        budgetType: type,
        totalBudget: amount,
        selectedCategories: categories,
        categoryLimits: limits,
        budgetingScore: 80,
        achievements: updatedAchievements,
        ...xpUpdate,
      };
      persistState({ ...state, ...next });

      // Enqueue sync for budgets with retry queue (atomic upsert per category & month)
      (async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession().catch(() => ({ data: { session: null } }));
          if (session?.user?.id && session.user.id !== 'guest') {
            const currentMonth = new Date().toISOString().slice(0, 7); // 'YYYY-MM'
            const rowsToUpsert = [
              {
                user_id: session.user.id,
                owner_id: session.user.id,
                category: '__total__',
                category_id: '__total__',
                allocated_amount: amount,
                limit_amount: amount,
                month: currentMonth,
                period: currentMonth,
                updated_at: new Date().toISOString(),
              },
              ...Object.entries(limits).map(([cat, limit]) => ({
                user_id: session.user.id,
                owner_id: session.user.id,
                category: cat,
                category_id: cat,
                allocated_amount: limit,
                limit_amount: limit,
                month: currentMonth,
                period: currentMonth,
                updated_at: new Date().toISOString(),
              })),
            ];
            await syncQueue.enqueue({
              table: 'budgets',
              action: 'upsert',
              payload: rowsToUpsert,
              options: { onConflict: 'user_id,category,month' },
            });
          }
        } catch (err) {
          console.warn('[GamificationStore] setupBudget sync enqueue error:', err);
        }
      })();

      return next;
    });
  },

  setBudgetType: (type, amount) => {
    set((state) => {
      const effectiveTotal = amount !== undefined ? amount : state.totalBudget;
      const next = {
        budgetType: type,
        totalBudget: effectiveTotal,
      };
      persistState({ ...state, ...next });

      if (amount !== undefined) {
        (async () => {
          try {
            const { data: { session } } = await supabase.auth.getSession().catch(() => ({ data: { session: null } }));
            if (session?.user?.id && session.user.id !== 'guest') {
              const currentMonth = new Date().toISOString().slice(0, 7);
              await syncQueue.enqueue({
                table: 'budgets',
                action: 'upsert',
                payload: {
                  user_id: session.user.id,
                  owner_id: session.user.id,
                  category: '__total__',
                  category_id: '__total__',
                  allocated_amount: amount,
                  limit_amount: amount,
                  month: currentMonth,
                  period: currentMonth,
                  updated_at: new Date().toISOString(),
                },
                options: { onConflict: 'user_id,category,month' },
              });
            }
          } catch (err) {
            console.warn('[GamificationStore] Supabase setBudgetType error:', err);
          }
        })();
      }

      return next;
    });
  },

  addExpense: (name, category, amount, date, notes, time) => {
    if (!amount || !Number.isFinite(amount) || amount <= 0) {
      console.warn('[GamificationStore] addExpense ignored invalid or non-positive amount:', amount);
      return;
    }

    set((state) => {
      const expenseId = generateUUID();
      const newExpense: Expense = {
        id: expenseId,
        name,
        category,
        amount,
        date: date || getLocalDateString(),
        time: time || format12HourTime(),
        notes,
        type: 'expense',
      };
      const updatedExpenses = [newExpense, ...state.loggedExpenses];
      const onlyExpenses = updatedExpenses.filter((e) => e.type !== 'income');
      const totalSpent = onlyExpenses.reduce((sum, e) => sum + e.amount, 0);

      let nextBudgetingScore = state.budgetingScore;
      const prevSpent = state.loggedExpenses.filter((e) => e.type !== 'income').reduce((sum, e) => sum + e.amount, 0);
      if (state.totalBudget > 0 && totalSpent > state.totalBudget) {
        nextBudgetingScore = Math.max(20, state.budgetingScore - 10);
        if (prevSpent <= state.totalBudget) {
          try {
            const { sendPhoneNotificationAsync, NOTIFICATION_CHANNELS } = require('@/utils/notifications');
            const { usePreferencesStore } = require('@/store/preferencesStore');
            const curr = usePreferencesStore.getState().currency || 'PHP';
            const sym = curr === 'PHP' ? '₱' : curr === 'EUR' ? '€' : curr === 'GBP' ? '£' : '$';
            sendPhoneNotificationAsync({
              title: '⚠️ Smart Budget Alert: Spending Limit Exceeded',
              body: `Total expenses reached ${sym}${totalSpent.toFixed(2)}, exceeding your ${sym}${state.totalBudget.toFixed(2)} budget limit.`,
              channelId: NOTIFICATION_CHANNELS.BUDGET_GUARD,
            }).catch(() => {});
          } catch (_) {}
        }
      } else {
        nextBudgetingScore = Math.min(100, state.budgetingScore + 5);
      }

      let updatedAchievements = [...state.achievements];
      if (nextBudgetingScore >= 90 && !updatedAchievements.some((a) => a.id === 'budget_master')) {
        const ach = ALL_ACHIEVEMENTS.find((a) => a.id === 'budget_master');
        if (ach) {
          updatedAchievements.push({ ...ach, unlockedAt: new Date().toISOString() });
          try {
            const { sendPhoneNotificationAsync } = require('@/utils/notifications');
            sendPhoneNotificationAsync({
              title: '🏆 Achievement Unlocked!',
              body: `You unlocked "${ach.title}"! High financial discipline score maintained.`,
            }).catch(() => {});
          } catch (_) {}
        }
      }

      const cents = amount % 100;
      const roundUp = cents === 0 ? 0 : 100 - cents;
      const nextSpareChange = state.spareChangeAccumulated + roundUp;
      const xpUpdate = applyXpGain(state, 10);

      const next = {
        loggedExpenses: updatedExpenses,
        budgetingScore: nextBudgetingScore,
        achievements: updatedAchievements,
        spareChangeAccumulated: nextSpareChange,
        ...xpUpdate,
      };
      persistState({ ...state, ...next });

      // Enqueue sync for transaction upsert (idempotent across retries)
      (async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession().catch(() => ({ data: { session: null } }));
          if (session?.user?.id && session.user.id !== 'guest') {
            await syncQueue.enqueue({
              table: 'transactions',
              action: 'upsert',
              payload: {
                transaction_id: expenseId,
                user_id: session.user.id,
                owner_id: session.user.id,
                type: 'expense',
                category: category,
                category_id: category || 'Other',
                amount,
                description: notes ? `${name} - ${notes}` : name,
                transaction_date: toISODate(date),
                date: toISODate(date),
              },
              options: { onConflict: 'transaction_id' },
            });
          }
        } catch (err) {
          console.warn('[GamificationStore] insert expense sync enqueue error:', err);
        }
      })();

      return next;
    });
  },

  editExpense: (id, updated) => {
    if (updated.amount !== undefined && (!Number.isFinite(updated.amount) || updated.amount <= 0)) {
      console.warn('[GamificationStore] editExpense ignored invalid or non-positive amount:', updated.amount);
      return;
    }

    set((state) => {
      const updatedExpenses = state.loggedExpenses.map((exp) => {
        if (exp.id === id) {
          return { ...exp, ...updated };
        }
        return exp;
      });
      const next = { loggedExpenses: updatedExpenses };
      persistState({ ...state, ...next });

      (async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession().catch(() => ({ data: { session: null } }));
          if (session?.user?.id && session.user.id !== 'guest') {
            const updatePayload: Record<string, unknown> = {};
            if (updated.category) updatePayload.category = updated.category;
            if (updated.amount !== undefined) updatePayload.amount = updated.amount;
            if (updated.name || updated.notes) {
              updatePayload.description = updated.notes ? `${updated.name} - ${updated.notes}` : updated.name;
            }
            if (updated.date) updatePayload.transaction_date = toISODate(updated.date);
            if (updated.type) updatePayload.type = updated.type;

            await syncQueue.enqueue({
              table: 'transactions',
              action: 'update',
              payload: updatePayload,
              match: { transaction_id: id, user_id: session.user.id },
            });
          }
        } catch (err) {
          console.warn('[GamificationStore] edit expense sync enqueue error:', err);
        }
      })();

      return next;
    });
  },

  deleteExpense: (id) => {
    set((state) => {
      const updatedExpenses = state.loggedExpenses.filter((e) => e.id !== id);
      const onlyExpenses = updatedExpenses.filter((e) => e.type !== 'income');
      const totalSpent = onlyExpenses.reduce((sum, e) => sum + e.amount, 0);

      let nextBudgetingScore = state.budgetingScore;
      if (state.totalBudget > 0 && totalSpent > state.totalBudget) {
        nextBudgetingScore = Math.max(20, state.budgetingScore - 10);
      } else {
        nextBudgetingScore = Math.min(100, state.budgetingScore + 5);
      }

      const next = {
        loggedExpenses: updatedExpenses,
        budgetingScore: nextBudgetingScore,
      };
      persistState({ ...state, ...next });

      (async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession().catch(() => ({ data: { session: null } }));
          if (session?.user?.id && session.user.id !== 'guest') {
            await syncQueue.enqueue({
              table: 'transactions',
              action: 'delete',
              match: { transaction_id: id, user_id: session.user.id },
            });
          }
        } catch (err) {
          console.warn('[GamificationStore] delete expense sync enqueue error:', err);
        }
      })();

      return next;
    });
  },

  addIncome: (name, category, amount, date, notes, time) => {
    if (!amount || !Number.isFinite(amount) || amount <= 0) {
      console.warn('[GamificationStore] addIncome ignored invalid or non-positive amount:', amount);
      return;
    }

    set((state) => {
      const incomeId = generateUUID();
      const newIncome: Expense = {
        id: incomeId,
        name,
        category: category || 'Income',
        amount,
        date: date || getLocalDateString(),
        time: time || format12HourTime(),
        notes,
        type: 'income',
      };
      const updatedExpenses = [newIncome, ...state.loggedExpenses];
      const xpUpdate = applyXpGain(state, 10);
      const next = {
        loggedExpenses: updatedExpenses,
        ...xpUpdate,
      };
      persistState({ ...state, ...next });

      (async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession().catch(() => ({ data: { session: null } }));
          if (session?.user?.id && session.user.id !== 'guest') {
            await syncQueue.enqueue({
              table: 'transactions',
              action: 'upsert',
              payload: {
                transaction_id: incomeId,
                user_id: session.user.id,
                owner_id: session.user.id,
                type: 'income',
                category: category || 'Income',
                category_id: category || 'Income',
                amount,
                description: notes ? `${name} - ${notes}` : name,
                transaction_date: toISODate(date),
                date: toISODate(date),
              },
              options: { onConflict: 'transaction_id' },
            });
          }
        } catch (err) {
          console.warn('[GamificationStore] addIncome sync enqueue error:', err);
        }
      })();

      return next;
    });
  },

  resetBudget: () => {
    set((state) => {
      const next = {
        isBudgetSetupComplete: false,
        budgetType: null,
        totalBudget: 0,
        selectedCategories: [],
        categoryLimits: {},
        loggedExpenses: [],
        savingsGoals: [],
        virtualBalance: 0,
        portfolioAllocations: {},
        budgetingScore: 0,
        savingScore: 0,
        investingScore: 0,
        spareChangeAccumulated: 0,
        completedLessonIds: [],
        lastDividendClaimDates: {},
      };
      persistState({ ...state, ...next });
      return next;
    });
  },

  resetAllData: (defaultVirtualBalance = 10000) => {
    set((state) => {
      const next = {
        ...DEFAULT_GAMIFICATION_DATA,
        virtualBalance: defaultVirtualBalance,
      };
      persistState({ ...state, ...next });
      return next;
    });

    if (currentActiveUserId && currentActiveUserId !== 'guest') {
      const uid = currentActiveUserId;
      Promise.allSettled([
        supabase.from('transactions').delete().eq('user_id', uid),
        supabase.from('budgets').delete().eq('user_id', uid),
        supabase.from('saving_challenges').delete().eq('user_id', uid),
        supabase.from(CLOUD_STATE_TABLE).delete().eq('user_id', uid),
      ]).then((results) => {
        results.forEach((res, i) => {
          if (res.status === 'rejected') {
            console.warn(`[GamificationStore] Cloud reset warning for step ${i}:`, res.reason);
          }
        });
      });
    }
  },

  addSavingsGoal: (name, targetAmount, targetDate, category) => {
    set((state) => {
      const goalId = generateUUID();
      const newGoal: SavingsGoal = {
        id: goalId,
        name,
        targetAmount,
        currentSavings: 0,
        targetDate,
        category,
      };
      const updatedGoals = [...state.savingsGoals, newGoal];
      const xpUpdate = applyXpGain(state, 15);
      const next = {
        savingsGoals: updatedGoals,
        savingScore: Math.min(100, state.savingScore + 5),
        ...xpUpdate,
      };
      persistState({ ...state, ...next });

      (async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession().catch(() => ({ data: { session: null } }));
          if (session?.user?.id && session.user.id !== 'guest') {
            await syncQueue.enqueue({
              table: 'saving_challenges',
              action: 'upsert',
              payload: {
                challenge_id: goalId,
                user_id: session.user.id,
                title: name,
                icon: category,
                target_amount: targetAmount,
                current_amount: 0,
                end_date: targetDate.includes('-') ? targetDate : null,
                is_completed: false,
              },
              options: { onConflict: 'challenge_id' },
            });
          }
        } catch (err) {
          console.warn('[GamificationStore] insert saving_challenge sync enqueue error:', err);
        }
      })();

      return next;
    });
  },

  contributeToSavingsGoal: (goalId, amount) => {
    let success = false;
    set((state) => {
      const metrics = getCycleMetrics(state);
      if (amount <= 0 || amount > metrics.balance) {
        return state;
      }

      const targetGoal = state.savingsGoals.find((g) => g.id === goalId);
      if (!targetGoal) {
        return state;
      }

      const goalName = targetGoal.name || 'Savings Goal';
      const maxNeeded =
        targetGoal.targetAmount > 0
          ? Math.max(0, targetGoal.targetAmount - targetGoal.currentSavings)
          : amount;
      const actualContributed = Math.min(amount, maxNeeded > 0 ? maxNeeded : amount);

      if (actualContributed <= 0) {
        return state;
      }

      success = true;
      let updatedSavingsVal = 0;
      let isGoalCompleted = false;

      const updatedGoals = state.savingsGoals.map((g) => {
        if (g.id === goalId) {
          const nextVal = g.currentSavings + actualContributed;
          updatedSavingsVal = targetGoal.targetAmount > 0 ? Math.min(g.targetAmount, nextVal) : nextVal;
          isGoalCompleted = targetGoal.targetAmount > 0 && updatedSavingsVal >= targetGoal.targetAmount;
          return { ...g, currentSavings: updatedSavingsVal };
        }
        return g;
      });

      const totalTarget = updatedGoals.reduce((sum, g) => sum + g.targetAmount, 0);
      const totalCurrent = updatedGoals.reduce((sum, g) => sum + g.currentSavings, 0);
      const savingsRatio = totalTarget > 0 ? totalCurrent / totalTarget : 0;
      const nextSavingScore = Math.round(40 + savingsRatio * 60);

      let updatedAchievements = [...state.achievements];
      if (nextSavingScore >= 85 && !updatedAchievements.some((a) => a.id === 'savings_strategist')) {
        const ach = ALL_ACHIEVEMENTS.find((a) => a.id === 'savings_strategist');
        if (ach) updatedAchievements.push({ ...ach, unlockedAt: new Date().toISOString() });
      }

      // Log transaction deducting from current cycle balance
      const expenseId = generateUUID();
      const savingsExpense: Expense = {
        id: expenseId,
        name: `Savings: ${goalName}`,
        category: 'Savings',
        amount: actualContributed,
        date: getLocalDateString(),
        time: format12HourTime(),
        notes: `Allocated to ${goalName}`,
        type: 'expense',
      };
      const updatedExpenses = [savingsExpense, ...state.loggedExpenses];
      const xpUpdate = applyXpGain(state, 15);

      const next = {
        savingsGoals: updatedGoals,
        loggedExpenses: updatedExpenses,
        savingScore: Math.min(100, nextSavingScore),
        achievements: updatedAchievements,
        ...xpUpdate,
      };
      persistState({ ...state, ...next });

      (async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession().catch(() => ({ data: { session: null } }));
          if (session?.user?.id && session.user.id !== 'guest') {
            await syncQueue.enqueue({
              table: 'saving_challenges',
              action: 'update',
              payload: {
                current_amount: updatedSavingsVal,
                is_completed: isGoalCompleted,
                updated_at: new Date().toISOString(),
              },
              match: { challenge_id: goalId, user_id: session.user.id },
            });

            await syncQueue.enqueue({
              table: 'transactions',
              action: 'upsert',
              payload: {
                transaction_id: expenseId,
                user_id: session.user.id,
                owner_id: session.user.id,
                type: 'expense',
                category: 'Savings',
                amount: actualContributed,
                description: `Allocated to ${goalName}`,
                transaction_date: getLocalDateString(),
              },
              options: { onConflict: 'transaction_id' },
            });
          }
        } catch (err) {
          console.warn('[GamificationStore] contribute saving_challenge sync enqueue error:', err);
        }
      })();

      return next;
    });
    return success;
  },

  withdrawSavingsGoal: (goalId, amount) => {
    let success = false;
    set((state) => {
      const targetGoal = state.savingsGoals.find((g) => g.id === goalId);
      if (!targetGoal || targetGoal.currentSavings < amount || amount <= 0) {
        return state;
      }

      success = true;
      let updatedSavingsVal = 0;

      const updatedGoals = state.savingsGoals.map((g) => {
        if (g.id === goalId) {
          updatedSavingsVal = Math.max(0, g.currentSavings - amount);
          return { ...g, currentSavings: updatedSavingsVal };
        }
        return g;
      });

      // Log income transaction restoring money to current balance
      const incomeId = generateUUID();
      const withdrawalIncome: Expense = {
        id: incomeId,
        name: `Withdrawal: ${targetGoal.name}`,
        category: 'Savings',
        amount,
        date: getLocalDateString(),
        time: format12HourTime(),
        notes: `Withdrawn from ${targetGoal.name}`,
        type: 'income',
      };
      const updatedExpenses = [withdrawalIncome, ...state.loggedExpenses];

      const next = {
        savingsGoals: updatedGoals,
        loggedExpenses: updatedExpenses,
      };
      persistState({ ...state, ...next });

      (async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession().catch(() => ({ data: { session: null } }));
          if (session?.user?.id && session.user.id !== 'guest') {
            await syncQueue.enqueue({
              table: 'saving_challenges',
              action: 'update',
              payload: {
                current_amount: updatedSavingsVal,
                is_completed: false,
                updated_at: new Date().toISOString(),
              },
              match: { challenge_id: goalId, user_id: session.user.id },
            });

            await syncQueue.enqueue({
              table: 'transactions',
              action: 'upsert',
              payload: {
                transaction_id: incomeId,
                user_id: session.user.id,
                owner_id: session.user.id,
                type: 'income',
                category: 'Savings',
                amount,
                description: `Withdrawn from ${targetGoal.name}`,
                transaction_date: getLocalDateString(),
              },
              options: { onConflict: 'transaction_id' },
            });
          }
        } catch (err) {
          console.warn('[GamificationStore] withdraw saving_challenge sync enqueue error:', err);
        }
      })();

      return next;
    });
    return success;
  },

  updateSavingsGoal: (goalId, updates) => {
    set((state) => {
      let updatedGoal: SavingsGoal | undefined;
      const updatedGoals = state.savingsGoals.map((g) => {
        if (g.id === goalId) {
          const newTarget = updates.targetAmount !== undefined ? Math.max(0, updates.targetAmount) : g.targetAmount;
          updatedGoal = {
            ...g,
            name: updates.name !== undefined && updates.name.trim() ? updates.name.trim() : g.name,
            targetAmount: newTarget,
            category: updates.category !== undefined ? updates.category : g.category,
            targetDate: updates.targetDate !== undefined ? updates.targetDate : g.targetDate,
          };
          return updatedGoal;
        }
        return g;
      });

      const totalTarget = updatedGoals.reduce((sum, g) => sum + g.targetAmount, 0);
      const totalCurrent = updatedGoals.reduce((sum, g) => sum + g.currentSavings, 0);
      const savingsRatio = totalTarget > 0 ? totalCurrent / totalTarget : 0;
      const nextSavingScore = Math.round(40 + savingsRatio * 60);

      const next = {
        savingsGoals: updatedGoals,
        savingScore: Math.min(100, nextSavingScore),
      };
      persistState({ ...state, ...next });

      (async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession().catch(() => ({ data: { session: null } }));
          if (session?.user?.id && session.user.id !== 'guest' && updatedGoal) {
            await syncQueue.enqueue({
              table: 'saving_challenges',
              action: 'update',
              payload: {
                title: updatedGoal.name,
                target_amount: updatedGoal.targetAmount,
                updated_at: new Date().toISOString(),
              },
              match: { challenge_id: goalId, user_id: session.user.id },
            });
          }
        } catch (err) {
          console.warn('[GamificationStore] update saving_challenge sync enqueue error:', err);
        }
      })();

      return next;
    });
  },

  deleteSavingsGoal: (goalId) => {
    set((state) => {
      const updatedGoals = state.savingsGoals.filter((g) => g.id !== goalId);
      const next = { savingsGoals: updatedGoals };
      persistState({ ...state, ...next });

      (async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession().catch(() => ({ data: { session: null } }));
          if (session?.user?.id && session.user.id !== 'guest') {
            await syncQueue.enqueue({
              table: 'saving_challenges',
              action: 'delete',
              match: { challenge_id: goalId, user_id: session.user.id },
            });
          }
        } catch (err) {
          console.warn('[GamificationStore] delete saving_challenge sync enqueue error:', err);
        }
      })();

      return next;
    });
  },

  allocateUnspentSavings: (amount, note) => {
    let success = false;
    set((state) => {
      const metrics = getCycleMetrics(state);
      if (amount <= 0 || amount > metrics.balance) {
        return state;
      }
      success = true;

      const now = new Date();
      const recordId = generateUUID();
      const formattedDate = formatShortDate(now);
      const formattedTime = format12HourTime(now);
      const defaultNote = note?.trim() || `Unspent ${metrics.cycleName.toLowerCase()} surplus`;

      const newRecord: SavingsRecord = {
        id: recordId,
        amount,
        date: formattedDate,
        time: formattedTime,
        note: defaultNote,
        cycle: metrics.cycle,
        createdAtISO: now.toISOString(),
      };

      const expenseId = generateUUID();
      const savingsExpense: Expense = {
        id: expenseId,
        name: `Savings Vault: ${defaultNote}`,
        category: 'Savings',
        amount,
        date: getLocalDateString(now),
        time: formattedTime,
        notes: `Allocated to Savings Vault at ${formattedTime}`,
        type: 'expense',
      };

      const updatedRecords = [newRecord, ...(state.savingsRecords || [])];
      const updatedExpenses = [savingsExpense, ...state.loggedExpenses];
      const nextVault = (state.unspentSavingsVault || 0) + amount;
      const xpUpdate = applyXpGain(state, 15);

      const next = {
        unspentSavingsVault: nextVault,
        savingsRecords: updatedRecords,
        loggedExpenses: updatedExpenses,
        savingScore: Math.min(100, state.savingScore + 5),
        ...xpUpdate,
      };
      persistState({ ...state, ...next });

      (async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession().catch(() => ({ data: { session: null } }));
          if (session?.user?.id && session.user.id !== 'guest') {
            await syncQueue.enqueue({
              table: 'transactions',
              action: 'upsert',
              payload: {
                transaction_id: expenseId,
                user_id: session.user.id,
                owner_id: session.user.id,
                type: 'expense',
                category: 'Savings',
                amount,
                description: `Savings Vault: ${defaultNote}`,
                transaction_date: getLocalDateString(now),
              },
              options: { onConflict: 'transaction_id' },
            });
          }
        } catch (err) {
          console.warn('[GamificationStore] allocate unspent sync enqueue error:', err);
        }
      })();

      return next;
    });
    return success;
  },

  withdrawUnspentSavings: (amount) => {
    let success = false;
    set((state) => {
      const currentVault = state.unspentSavingsVault || 0;
      if (amount <= 0 || amount > currentVault) {
        return state;
      }
      success = true;
      const now = new Date();
      const incomeId = generateUUID();
      const formattedTime = format12HourTime(now);

      const withdrawalIncome: Expense = {
        id: incomeId,
        name: 'Withdrawal from Savings Vault',
        category: 'Savings',
        amount,
        date: getLocalDateString(now),
        time: formattedTime,
        notes: `Withdrawn from Savings Vault at ${formattedTime}`,
        type: 'income',
      };

      const nextVault = Math.max(0, currentVault - amount);
      const updatedExpenses = [withdrawalIncome, ...state.loggedExpenses];
      const next = {
        unspentSavingsVault: nextVault,
        loggedExpenses: updatedExpenses,
      };
      persistState({ ...state, ...next });

      (async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession().catch(() => ({ data: { session: null } }));
          if (session?.user?.id && session.user.id !== 'guest') {
            await syncQueue.enqueue({
              table: 'transactions',
              action: 'upsert',
              payload: {
                transaction_id: incomeId,
                user_id: session.user.id,
                owner_id: session.user.id,
                type: 'income',
                category: 'Savings',
                amount,
                description: `Withdrawal from Savings Vault at ${formattedTime}`,
                transaction_date: getLocalDateString(now),
              },
              options: { onConflict: 'transaction_id' },
            });
          }
        } catch (err) {
          console.warn('[GamificationStore] withdraw unspent sync enqueue error:', err);
        }
      })();

      return next;
    });
    return success;
  },

  setRiskProfile: (profile) => {
    set((state) => {
      const next = { riskProfile: profile };
      persistState({ ...state, ...next });
      return next;
    });
  },

  sweepSpareChange: () => {
    set((state) => {
      const amount = state.spareChangeAccumulated;
      if (amount <= 0) return state;
      const xpUpdate = applyXpGain(state, 10);
      const next = {
        spareChangeAccumulated: 0,
        virtualBalance: state.virtualBalance + amount,
        ...xpUpdate,
      };
      persistState({ ...state, ...next });
      return next;
    });
  },

  allocateToSimulation: (amount) => {
    let success = false;
    set((state) => {
      const metrics = getCycleMetrics(state);
      if (amount <= 0 || amount > metrics.balance) {
        return state;
      }

      success = true;
      const expenseId = generateUUID();
      const investExpense: Expense = {
        id: expenseId,
        name: 'Transfer to Investment Sandbox',
        category: 'Savings',
        amount,
        date: getLocalDateString(),
        time: format12HourTime(),
        notes: 'Transferred from allowance to investment cash',
        type: 'expense',
      };
      const updatedExpenses = [investExpense, ...state.loggedExpenses];
      const xpUpdate = applyXpGain(state, 10);

      const next = {
        loggedExpenses: updatedExpenses,
        virtualBalance: state.virtualBalance + amount,
        ...xpUpdate,
      };
      persistState({ ...state, ...next });

      (async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession().catch(() => ({ data: { session: null } }));
          if (session?.user?.id && session.user.id !== 'guest') {
            await syncQueue.enqueue({
              table: 'transactions',
              action: 'upsert',
              payload: {
                transaction_id: expenseId,
                user_id: session.user.id,
                owner_id: session.user.id,
                type: 'expense',
                category: 'Savings',
                amount,
                description: 'Transfer to Investment Sandbox',
                transaction_date: getLocalDateString(),
              },
              options: { onConflict: 'transaction_id' },
            });
          }
        } catch (err) {
          console.warn('[GamificationStore] transfer investment sync enqueue error:', err);
        }
      })();

      return next;
    });
    return success;
  },

  grantOnboardingCash: (amount) => {
    set((state) => {
      const xpUpdate = applyXpGain(state, 25);
      const next = {
        virtualBalance: state.virtualBalance + amount,
        ...xpUpdate,
      };
      persistState({ ...state, ...next });
      return next;
    });
  },

  addSimulationCash: (amount, xpReward = 10) => {
    set((state) => {
      const xpUpdate = applyXpGain(state, xpReward);
      const next = {
        virtualBalance: state.virtualBalance + amount,
        ...xpUpdate,
      };
      persistState({ ...state, ...next });
      return next;
    });
  },

  deductBet: (amount) => {
    let success = false;
    set((state) => {
      if (amount > state.virtualBalance || amount <= 0) {
        return state;
      }
      success = true;
      const next = { virtualBalance: state.virtualBalance - amount };
      persistState({ ...state, ...next });
      return next;
    });
    return success;
  },

  creditGameReward: (xpEarned, cashProfit) => {
    set((state) => {
      const xpUpdate = applyXpGain(state, xpEarned);
      const nextBalance = Math.max(0, state.virtualBalance + cashProfit);
      const next = {
        virtualBalance: nextBalance,
        ...xpUpdate,
      };
      persistState({ ...state, ...next });

      if (xpEarned > 0 || cashProfit > 0) {
        (async () => {
          try {
            const { data: { session } } = await supabase.auth.getSession().catch(() => ({ data: { session: null } }));
            if (session?.user?.id && session.user.id !== 'guest') {
              await syncQueue.enqueue({
                table: 'arcade_scores',
                action: 'insert',
                payload: {
                  user_id: session.user.id,
                  game_id: 'arcade_session',
                  score: xpEarned,
                  xp_earned: xpEarned,
                  cash_profit: cashProfit,
                  played_at: new Date().toISOString(),
                },
              });
            }
          } catch (e) {
            console.warn('[GamificationStore] Arcade score sync error:', e);
          }
        })();
      }

      return next;
    });
  },

  claimDailyDividend: (ticker, amount) => {
    let success = false;
    set((state) => {
      const today = getLocalDateString();
      if (state.lastDividendClaimDates[ticker] === today) {
        return state;
      }
      success = true;
      const xpUpdate = applyXpGain(state, 5);
      const next = {
        virtualBalance: state.virtualBalance + amount,
        lastDividendClaimDates: {
          ...state.lastDividendClaimDates,
          [ticker]: today,
        },
        ...xpUpdate,
      };
      persistState({ ...state, ...next });
      return next;
    });
    return success;
  },

  tradeAssetSim: (ticker, type, qty, price) => {
    let success = false;
    set((state) => {
      // Simulated brokerage spread: 0.25% per trade (realistic bid-ask + fee friction)
      // Real brokerages charge 0.1-0.5% via spreads even on "commission-free" platforms
      const TRADE_SPREAD_PCT = 0.0025;
      const effectivePrice = type === 'buy'
        ? price * (1 + TRADE_SPREAD_PCT)  // Buy at slightly higher ask price
        : price * (1 - TRADE_SPREAD_PCT); // Sell at slightly lower bid price

      const totalCost = qty * effectivePrice;
      const currentOwned = state.portfolioAllocations[ticker] || 0;

      if (type === 'buy') {
        if (totalCost > state.virtualBalance) {
          return state;
        }

        success = true;
        const newAllocations = {
          ...state.portfolioAllocations,
          [ticker]: currentOwned + qty,
        };

        const nextInvestingScore = Math.min(100, state.investingScore + 10);
        let updatedAchievements = [...state.achievements];
        if (!updatedAchievements.some((a) => a.id === 'invest_graduate')) {
          const ach = ALL_ACHIEVEMENTS.find((a) => a.id === 'invest_graduate');
          if (ach) updatedAchievements.push({ ...ach, unlockedAt: new Date().toISOString() });
        }

        const xpUpdate = applyXpGain(state, 15);
        const next = {
          virtualBalance: state.virtualBalance - totalCost,
          portfolioAllocations: newAllocations,
          investingScore: nextInvestingScore,
          achievements: updatedAchievements,
          ...xpUpdate,
        };
        persistState({ ...state, ...next });
        return next;
      } else {
        if (qty > currentOwned) {
          return state;
        }

        success = true;
        const newAllocations = {
          ...state.portfolioAllocations,
          [ticker]: currentOwned - qty,
        };

        if (newAllocations[ticker] === 0) {
          delete newAllocations[ticker];
        }

        const xpUpdate = applyXpGain(state, 10);
        const next = {
          virtualBalance: state.virtualBalance + totalCost,
          portfolioAllocations: newAllocations,
          ...xpUpdate,
        };
        persistState({ ...state, ...next });
        return next;
      }
    });

    if (success) {
      (async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession().catch(() => ({ data: { session: null } }));
          if (session?.user?.id && session.user.id !== 'guest') {
            const currentQty = get().portfolioAllocations[ticker] || 0;
            if (currentQty > 0) {
              await syncQueue.enqueue({
                table: 'user_investments',
                action: 'upsert',
                payload: {
                  user_id: session.user.id,
                  ticker,
                  asset_class: ticker === 'BTC' || ticker === 'ETH' || ticker === 'SOL' ? 'crypto' : 'stock',
                  quantity: currentQty,
                  average_buy_price: price,
                  updated_at: new Date().toISOString(),
                },
                options: { onConflict: 'user_id,ticker' },
              });
            } else {
              await syncQueue.enqueue({
                table: 'user_investments',
                action: 'delete',
                match: { user_id: session.user.id, ticker },
              });
            }

            // Record trade in persistent investment_orders ledger
            const TRADE_SPREAD_PCT = 0.0025;
            const effectivePrice = type === 'buy' ? price * (1 + TRADE_SPREAD_PCT) : price * (1 - TRADE_SPREAD_PCT);
            const totalCost = qty * effectivePrice;
            await syncQueue.enqueue({
              table: 'investment_orders',
              action: 'insert',
              payload: {
                user_id: session.user.id,
                ticker,
                side: type,
                shares: qty,
                price: effectivePrice,
                total_amount: totalCost,
                executed_at: new Date().toISOString(),
              },
            });
          }
        } catch (tradeSyncErr) {
          console.warn('[GamificationStore] executeTrade investments sync error:', tradeSyncErr);
        }
      })();
    }

    return success;
  },

  completeLesson: (moduleName, lessonId) => {
    set((state) => {
      const id = lessonId || moduleName;
      const alreadyCompleted = state.completedLessonIds.includes(id);

      if (alreadyCompleted) {
        // Repeated practice: small XP bonus, no extra score unlock
        const xpUpdate = applyXpGain(state, 10);
        const next = { ...xpUpdate };
        persistState({ ...state, ...next });
        return next;
      }

      const nextLearningScore = Math.min(100, state.learningScore + 11);
      const nextCompleted = [...state.completedLessonIds, id];

      let updatedAchievements = [...state.achievements];
      if (!updatedAchievements.some((a) => a.id === 'first_lesson')) {
        const ach = ALL_ACHIEVEMENTS.find((a) => a.id === 'first_lesson');
        if (ach) updatedAchievements.push({ ...ach, unlockedAt: new Date().toISOString() });
      }

      if (
        moduleName.toLowerCase().includes('emergency') &&
        !updatedAchievements.some((a) => a.id === 'emergency_fund_planner')
      ) {
        const ach = ALL_ACHIEVEMENTS.find((a) => a.id === 'emergency_fund_planner');
        if (ach) updatedAchievements.push({ ...ach, unlockedAt: new Date().toISOString() });
      }

      if (nextLearningScore >= 80 && !updatedAchievements.some((a) => a.id === 'financial_explorer')) {
        const ach = ALL_ACHIEVEMENTS.find((a) => a.id === 'financial_explorer');
        if (ach) updatedAchievements.push({ ...ach, unlockedAt: new Date().toISOString() });
      }

      const xpUpdate = applyXpGain(state, 50);
      const next = {
        learningScore: nextLearningScore,
        completedLessonIds: nextCompleted,
        achievements: updatedAchievements,
        ...xpUpdate,
      };
      persistState({ ...state, ...next });

      // Record lesson completion in relational database (Supabase + SQLite mirror)
      (async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession().catch(() => ({ data: { session: null } }));
          if (session?.user?.id && session.user.id !== 'guest') {
            await syncQueue.enqueue({
              table: 'user_lessons',
              action: 'upsert',
              payload: {
                user_id: session.user.id,
                lesson_id: id,
                completed_at: new Date().toISOString(),
              },
              options: { onConflict: 'user_id,lesson_id' },
            });

            // Log quiz mastery attempt in relational table
            await syncQueue.enqueue({
              table: 'quiz_attempts',
              action: 'insert',
              payload: {
                user_id: session.user.id,
                lesson_id: id,
                score_percent: 100,
                passed: 1,
                attempted_at: new Date().toISOString(),
              },
            });
          }
        } catch (lessonSyncErr) {
          console.warn('[GamificationStore] Lesson sync note:', lessonSyncErr);
        }
      })();

      return next;
    });
  },

  setCustomAvatar: (avatar) => {
    set((state) => {
      let updatedAchievements = [...state.achievements];
      if (avatar === 'Financial Strategist' && !updatedAchievements.some((a) => a.id === 'savings_strategist')) {
        const ach = ALL_ACHIEVEMENTS.find((a) => a.id === 'savings_strategist');
        if (ach) updatedAchievements.push({ ...ach, unlockedAt: new Date().toISOString() });
      }

      const xpUpdate = applyXpGain(state, 10);
      const next = {
        customAvatar: avatar,
        achievements: updatedAchievements,
        ...xpUpdate,
      };
      persistState({ ...state, ...next });
      return next;
    });
  },

  getFinancialHealthScore: () => {
    const state = get();
    if (!state.isBudgetSetupComplete) {
      // Meaningful baseline even before budget setup
      const base = Math.round((state.learningScore + state.savingScore + state.investingScore) / 4);
      return Math.max(25, base);
    }
    return Math.round(
      (state.budgetingScore + state.learningScore + state.savingScore + state.investingScore) / 4
    );
  },

  checkMidnightGuestReset: () => {
    const state = get();
    const today = getLocalDateString();
    
    // Auto-rollover unspent budget to savings
    const cycle = state.budgetType || 'monthly';
    const d = new Date();
    const isCycleEnding = 
      cycle === 'daily' || 
      (cycle === 'weekly' && d.getDay() === 0) || 
      (cycle === 'monthly' && new Date(d.getTime() + 86400000).getDate() === 1);

    if (state.isBudgetSetupComplete && isCycleEnding && state.totalBudget > 0) {
      // Calculate spent today/this week/this month
      let spent = 0;
      for (const item of state.loggedExpenses) {
        if (item.type === 'expense') {
          spent += item.amount;
        }
      }
      // Note: we'd need proper date filtering, but this is a simplified rollover logic
      const unspent = state.totalBudget - spent;
      if (unspent > 0) {
        const now = new Date();
        const rolloverRecord: SavingsRecord = {
          id: Math.random().toString(),
          amount: unspent,
          date: today,
          time: format12HourTime(now),
          note: `Rollover from unspent ${cycle} budget`,
          cycle: cycle as 'daily' | 'weekly' | 'monthly',
          createdAtISO: now.toISOString(),
        };
        const next = {
          unspentSavingsVault: (state.unspentSavingsVault || 0) + unspent,
          savingsRecords: [...(state.savingsRecords || []), rolloverRecord],
        };
        set(next);
        persistState({ ...state, ...next });
      }
    }

    const isGuest = currentActiveUserId === null || currentActiveUserId === 'guest';
    if (!isGuest) return;
    const latestState = get();
    if (latestState.guestSessionDate && latestState.guestSessionDate !== today) {
      const next = {
        guestSessionDate: today,
      };
      set(next);
      persistState({ ...latestState, ...next }, 'guest');
    }
  },

  hydrate: async (targetUserId?: string | null) => {
    // 1. Concurrency deduplication: reuse active hydration if already running for this user
    if (activeHydrationPromise && activeHydratingUserId === targetUserId) {
      return activeHydrationPromise;
    }
    if (targetUserId !== undefined && targetUserId === lastHydratedTarget && isHydrationComplete) {
      return;
    }

    const runHydration = async () => {
      try {
        let resolvedUserId = targetUserId;
        if (resolvedUserId === undefined) {
          // Probe Supabase session
          const { data: { session } } = await supabase.auth.getSession().catch((err) => {
            console.warn('[GamificationStore] Probe session warning:', err);
            return { data: { session: null } };
          });
          resolvedUserId = session?.user?.id || null;
        }

        const generation = ++hydrationGeneration;
        currentActiveUserId = resolvedUserId;
        isHydrationComplete = false;

        const userKey = getUserStorageKey(resolvedUserId);
        const isGuestMode = resolvedUserId === null || resolvedUserId === 'guest';
        const todayISO = getLocalDateString();

        // 1. Read from local cache for instant offline load (SQLite local_app_state first, then storage)
        let stored = (await loadLocalAppState(userKey)) || (await storage.getItem(userKey));
        if (!stored && isGuestMode) {
          // Migration: check legacy un-scoped key only for guest/unauthenticated sessions
          stored = (await loadLocalAppState(BASE_GAMIFICATION_KEY)) || (await storage.getItem(BASE_GAMIFICATION_KEY));

          // Auto-recovery across APK updates: If guest state is empty, search SQLite for ANY previous progress!
          if (!stored) {
            const latest = await getLatestLocalAppState();
            if (latest && latest.state) {
              try {
                const parsedLatest = JSON.parse(latest.state);
                const hasProgress =
                  (parsedLatest.completedLessonIds || []).length > 0 ||
                  Object.keys(parsedLatest.portfolioAllocations || {}).length > 0 ||
                  (parsedLatest.virtualBalance || 0) > 0 ||
                  (parsedLatest.xp || 0) > 45 ||
                  (parsedLatest.streakDays || 1) > 1;
                if (hasProgress) {
                  console.log(`[GamificationStore] Auto-recovered saved progress from ${latest.key} across app update!`);
                  stored = latest.state;
                  await saveLocalAppState(userKey, stored);
                  await storage.setItem(userKey, stored);
                }
              } catch (err) {
                console.warn('[GamificationStore] Error parsing latest local state:', err);
              }
            }
          }
        } else if (!stored && resolvedUserId && resolvedUserId !== 'guest') {
          // Migration: If newly signed-in user has no local cache yet, inherit guest progress or latest local progress
          const guestStored = (await loadLocalAppState(`${BASE_GAMIFICATION_KEY}_guest`)) || (await storage.getItem(`${BASE_GAMIFICATION_KEY}_guest`));
          if (guestStored) {
            stored = guestStored;
            await saveLocalAppState(userKey, guestStored);
            await storage.setItem(userKey, guestStored);
          } else {
            const latest = await getLatestLocalAppState();
            if (latest && latest.state) {
              stored = latest.state;
              await saveLocalAppState(userKey, stored);
              await storage.setItem(userKey, stored);
            }
          }
        }

        if (generation !== hydrationGeneration) {
          return;
        }

        let localSavedAt = 0;
        let hasLocalCache = false;
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            localSavedAt = Number(parsed._savedAt) || 0;
            hasLocalCache = true;
            set(buildStateFromSnapshot(parsed, isGuestMode, todayISO));
          } catch (parseErr) {
            console.warn('[GamificationStore] Error parsing cached state:', parseErr);
          }
        } else {
          // Relational SQLite fallback: reconstruct state from local SQLite tables if JSON snapshot was missing
          try {
            const localLessons = (await getLocalRows('user_lessons', resolvedUserId || undefined)) || [];
            const localInvestments = (await getLocalRows('user_investments', resolvedUserId || undefined)) || [];
            const localTx = (await getLocalRows('transactions', resolvedUserId || undefined)) || [];

            const initialCompletedLessonIds = localLessons.map((r: any) => String(r.lesson_id));
            const initialPortfolio: Record<string, number> = {};
            for (const row of localInvestments) {
              const qty = Number(row.quantity) || 0;
              if (qty > 0 && row.ticker) {
                initialPortfolio[String(row.ticker)] = qty;
              }
            }
            const initialExpenses: Expense[] = localTx.map((r: any) => ({
              id: String(r.transaction_id || r.id),
              name: String(r.description || 'Transaction'),
              category: String(r.category || 'Other'),
              amount: Number(r.amount) || 0,
              date: String(r.transaction_date || todayISO),
              type: r.type === 'income' ? 'income' : 'expense',
            }));

            const calculatedXp = Math.max(45, 45 + initialCompletedLessonIds.length * 50);
            set({
              ...DEFAULT_GAMIFICATION_DATA,
              completedLessonIds: initialCompletedLessonIds,
              portfolioAllocations: initialPortfolio,
              loggedExpenses: initialExpenses,
              xp: calculatedXp,
              level: calculateLevelFromXP(calculatedXp),
            });
          } catch (e) {
            set({ ...DEFAULT_GAMIFICATION_DATA });
          }
        }

        isHydrationComplete = true;
        lastHydratedTarget = resolvedUserId;
        get().checkAndUpdateStreak();

      // 2. If authenticated with Supabase, pull cloud records and sync permanently
      if (resolvedUserId && resolvedUserId !== 'guest') {
        const userId = resolvedUserId;

        // Concurrent fetch of full-state backup, transactions, budgets, saving challenges, investments, and completed lessons
        const [snapshotRes, txRes, budgetRes, goalsRes, investRes, lessonsRes] = await Promise.allSettled([
          supabase
            .from(CLOUD_STATE_TABLE)
            .select('state, updated_at')
            .eq('user_id', userId)
            .maybeSingle(),
          supabase
            .from('transactions')
            .select('*')
            .eq('user_id', userId)
            .order('transaction_date', { ascending: false }),
          supabase
            .from('budgets')
            .select('*')
            .eq('user_id', userId),
          supabase
            .from('saving_challenges')
            .select('*')
            .eq('user_id', userId),
          supabase
            .from('user_investments')
            .select('*')
            .eq('user_id', userId),
          supabase
            .from('user_lessons')
            .select('*')
            .eq('user_id', userId),
        ]);

        if (generation !== hydrationGeneration) {
          return;
        }

        // Full-state backup: restore and merge safely with offline/current state
        let snapshotRead = false;
        let restoredFromSnapshot = false;
        if (snapshotRes.status === 'fulfilled') {
          const { data: snapRow, error: snapErr } = snapshotRes.value;
          if (!snapErr) {
            snapshotRead = true;
            const remoteState = snapRow?.state as Record<string, unknown> | undefined;
            if (remoteState && typeof remoteState === 'object') {
              const remoteSavedAt = Number(remoteState._savedAt) || 0;
              if (!hasLocalCache || remoteSavedAt > localSavedAt) {
                const builtRemote = buildStateFromSnapshot(remoteState, false, todayISO);
                const currentLocal = get();

                // Merge collections so local offline progress is never obliterated
                const mergedLessons = Array.from(
                  new Set([...(currentLocal.completedLessonIds || []), ...(builtRemote.completedLessonIds || [])])
                );
                const mergedAllocations = {
                  ...(builtRemote.portfolioAllocations || {}),
                  ...(currentLocal.portfolioAllocations || {}),
                };
                const mergedVirtualBalance = Math.max(
                  builtRemote.virtualBalance || 0,
                  currentLocal.virtualBalance || 0
                );
                const mergedXp = Math.max(builtRemote.xp || 45, currentLocal.xp || 45);
                const mergedStreak = Math.max(builtRemote.streakDays || 1, currentLocal.streakDays || 1);

                set({
                  ...builtRemote,
                  completedLessonIds: mergedLessons,
                  portfolioAllocations: mergedAllocations,
                  virtualBalance: mergedVirtualBalance,
                  xp: mergedXp,
                  level: calculateLevelFromXP(mergedXp),
                  streakDays: mergedStreak,
                });
                restoredFromSnapshot = true;
                get().checkAndUpdateStreak();
              }
            }
          } else if (isMissingTableError(snapErr)) {
            cloudSnapshotDisabled = true;
            snapshotRead = true;
            console.warn('[GamificationStore] user_app_state table missing. Run complete_setup.sql in Supabase.');
          } else {
            console.warn('[GamificationStore] Cloud snapshot read failed:', snapErr.message);
          }
        }

        const nextUpdates: Partial<GamificationState> = {};

        // User Investments / Portfolio Holdings sync
        if (investRes.status === 'fulfilled' && investRes.value.data) {
          const investRows = investRes.value.data;
          applyRemoteRows('user_investments', userId, investRows).catch((e) => {
            console.warn('[GamificationStore] SQLite user_investments mirror error:', e);
          });
          if (investRows.length > 0) {
            const allocations: Record<string, number> = { ...(get().portfolioAllocations || {}) };
            for (const row of investRows) {
              const qty = Number(row.quantity) || 0;
              if (qty > 0 && row.ticker) {
                allocations[row.ticker] = qty;
              }
            }
            nextUpdates.portfolioAllocations = allocations;
          }
        } else {
          // Offline fallback: load portfolio from local SQLite mirror
          const localInvest = await getLocalRows('user_investments', userId);
          if (localInvest && localInvest.length > 0) {
            const allocations: Record<string, number> = { ...(get().portfolioAllocations || {}) };
            for (const row of localInvest) {
              const qty = Number(row.quantity) || 0;
              if (qty > 0 && row.ticker) {
                allocations[String(row.ticker)] = qty;
              }
            }
            nextUpdates.portfolioAllocations = allocations;
          }
        }

        // Completed Lessons sync
        if (lessonsRes.status === 'fulfilled' && lessonsRes.value.data) {
          const lessonRows = lessonsRes.value.data;
          applyRemoteRows('user_lessons', userId, lessonRows).catch((e) => {
            console.warn('[GamificationStore] SQLite user_lessons mirror error:', e);
          });
          if (lessonRows.length > 0) {
            const lessonIds = lessonRows.map((r: any) => String(r.lesson_id));
            const merged = Array.from(new Set([...(get().completedLessonIds || []), ...lessonIds]));
            nextUpdates.completedLessonIds = merged;
          }
        } else {
          // Offline fallback: load completed lessons from local SQLite mirror
          const localLessons = await getLocalRows('user_lessons', userId);
          if (localLessons && localLessons.length > 0) {
            const lessonIds = localLessons.map((r: any) => String(r.lesson_id));
            const merged = Array.from(new Set([...(get().completedLessonIds || []), ...lessonIds]));
            nextUpdates.completedLessonIds = merged;
          }
        }

        // Transactions / Activity history sync (merge remote with offline local items, mirrored in SQLite)
        if (txRes.status === 'fulfilled' && txRes.value.data) {
          const remoteTxs = txRes.value.data;
          applyRemoteRows('transactions', userId, remoteTxs).catch((e) => {
            console.warn('[GamificationStore] SQLite transactions mirror error:', e);
          });
          if (remoteTxs.length > 0) {
            const localById = new Map((get().loggedExpenses || []).map((e) => [e.id, e]));
            const mappedExpenses: Expense[] = remoteTxs.map((t: any) => {
              const id = t.transaction_id || t.id;
              const local = localById.get(id);
              return {
                id,
                name: local?.name || t.description || t.category || t.category_id,
                category: t.category || t.category_id,
                amount: Number(t.amount) || 0,
                date: t.transaction_date || getLocalDateString(),
                time: local?.time || (t.created_at ? format12HourTime(new Date(t.created_at)) : undefined),
                notes: local?.notes,
                type: (t.type === 'income' ? 'income' : 'expense') as 'expense' | 'income',
              };
            });
            const remoteIds = new Set(mappedExpenses.map((e) => e.id));
            const localOnly = (get().loggedExpenses || []).filter((e) => !remoteIds.has(e.id));
            nextUpdates.loggedExpenses = [...mappedExpenses, ...localOnly];
          }
        } else {
          // Offline fallback: load from local SQLite mirror
          const localTxs = await getLocalRows('transactions', userId);
          if (localTxs && localTxs.length > 0) {
            nextUpdates.loggedExpenses = localTxs.map((t: any) => ({
              id: String(t.transaction_id),
              name: String(t.description || t.category || 'Transaction'),
              category: String(t.category || 'Other'),
              amount: Number(t.amount) || 0,
              date: String(t.transaction_date || getLocalDateString()),
              time: t.created_at ? format12HourTime(new Date(String(t.created_at))) : undefined,
              type: (t.type === 'income' ? 'income' : 'expense') as 'expense' | 'income',
            }));
          }
        }

        // Budgets / Allocation sync (the full-state backup already carries budget data)
        if (!restoredFromSnapshot && budgetRes.status === 'fulfilled' && budgetRes.value.data) {
          const budgetRows = budgetRes.value.data;
          applyRemoteRows('budgets', userId, budgetRows).catch((e) => {
            console.warn('[GamificationStore] SQLite budgets mirror error:', e);
          });
          if (budgetRows.length > 0) {
            let total = 0;
            const categoryLimits: Record<string, number> = {};
            const categories: string[] = [];

            for (const b of budgetRows) {
              // Canonical allocated_amount with legacy fallback, canonical category
              const cat = b.category || b.category_id || '__total__';
              const limit = Number(b.allocated_amount ?? b.limit_amount) || 0;
              if (cat === '__total__') {
                total = limit;
              } else {
                categoryLimits[cat] = limit;
                categories.push(cat);
              }
            }

            if (total === 0 && Object.keys(categoryLimits).length > 0) {
              total = Object.values(categoryLimits).reduce((a, b) => a + b, 0);
            }

            nextUpdates.isBudgetSetupComplete = true;
            nextUpdates.totalBudget = total;
            nextUpdates.categoryLimits = categoryLimits;
            nextUpdates.selectedCategories = categories;
            if (!get().budgetType) nextUpdates.budgetType = 'monthly';
          }
        } else if (!restoredFromSnapshot) {
          // Offline fallback: read from local SQLite
          const localBudgets = await getLocalRows('budgets', userId);
          if (localBudgets && localBudgets.length > 0) {
            let total = 0;
            const categoryLimits: Record<string, number> = {};
            const categories: string[] = [];
            for (const b of localBudgets) {
              const cat = String(b.category || '__total__');
              const limit = Number(b.allocated_amount) || 0;
              if (cat === '__total__') {
                total = limit;
              } else {
                categoryLimits[cat] = limit;
                categories.push(cat);
              }
            }
            if (total === 0 && Object.keys(categoryLimits).length > 0) {
              total = Object.values(categoryLimits).reduce((a, b) => a + b, 0);
            }
            nextUpdates.isBudgetSetupComplete = true;
            nextUpdates.totalBudget = total;
            nextUpdates.categoryLimits = categoryLimits;
            nextUpdates.selectedCategories = categories;
          }
        }

        // Savings Goals sync (saving_challenges in Supabase, merged with local goals)
        if (goalsRes.status === 'fulfilled' && goalsRes.value.data) {
          const goalsRows = goalsRes.value.data;
          applyRemoteRows('saving_challenges', userId, goalsRows).catch((e) => {
            console.warn('[GamificationStore] SQLite saving_challenges mirror error:', e);
          });
          if (goalsRows.length > 0) {
            const localGoalsById = new Map((get().savingsGoals || []).map((g) => [g.id, g]));
            const mappedGoals = goalsRows.map((g: any) => {
              const id = g.challenge_id || g.id;
              const local = localGoalsById.get(id);
              return {
                id,
                name: local?.name || g.title || 'Savings Goal',
                targetAmount: Number(g.target_amount) || 0,
                currentSavings: Number(g.current_amount) || 0,
                targetDate: local?.targetDate || g.end_date || g.deadline || '120',
                category: local?.category || g.icon || 'Emergency Fund',
              };
            });
            const remoteGoalIds = new Set(mappedGoals.map((g) => g.id));
            const localOnlyGoals = (get().savingsGoals || []).filter((g) => !remoteGoalIds.has(g.id));
            nextUpdates.savingsGoals = [...mappedGoals, ...localOnlyGoals];
          }
        } else {
          // Offline fallback: read from local SQLite
          const localGoals = await getLocalRows('saving_challenges', userId);
          if (localGoals && localGoals.length > 0) {
            nextUpdates.savingsGoals = localGoals.map((g: any) => ({
              id: String(g.challenge_id),
              name: String(g.title || 'Savings Goal'),
              targetAmount: Number(g.target_amount) || 0,
              currentSavings: Number(g.current_amount) || 0,
              targetDate: String(g.end_date || '120'),
              category: String(g.icon || 'Emergency Fund'),
            }));
          }
        }

        if (Object.keys(nextUpdates).length > 0) {
          set(nextUpdates);
        }

        // Allow cloud backups for this authenticated user once initial hydration completes
        cloudReadyUserId = userId;

        if (restoredFromSnapshot || Object.keys(nextUpdates).length > 0 || cloudReadyUserId === userId) {
          persistState(get(), userId);
        }

        // Automatic currency alignment: if user changed currency in preferences previously
        // but gamification store was stored in another currency, convert all monetary values immediately
        try {
          const { usePreferencesStore } = require('@/store/preferencesStore');
          const activeUserCurrency = usePreferencesStore.getState().currency || 'PHP';
          const storedCurrency = get().currency || 'PHP';
          if (storedCurrency !== activeUserCurrency) {
            get().convertAllMonetaryValues(storedCurrency, activeUserCurrency);
          }
        } catch (err) {
          console.warn('[GamificationStore] Currency alignment error post-hydration:', err);
        }

        // Process any queued offline actions now that connection & user are verified
        syncQueue.process().catch((err) => {
          console.warn('[GamificationStore] Error processing sync queue post-hydration:', err);
        });

        // Auto-populate Supabase relational tables if empty so all tables (transactions,
        // budgets, saving_challenges, user_investments, user_lessons, user_achievements,
        // daily_checkin_logs, savings_vault_history) contain active data in Supabase dashboard
        (async () => {
          // 1. Transactions: if remote is empty and we have local expenses, sync them
          try {
            const currentExpenses = get().loggedExpenses || [];
            if ((!txRes || (txRes.status === 'fulfilled' && (!txRes.value.data || txRes.value.data.length === 0))) && currentExpenses.length > 0) {
              const txRows = currentExpenses.map((e) => ({
                transaction_id: e.id,
                user_id: userId,
                owner_id: userId,
                type: e.type || 'expense',
                category: e.category || 'Other',
                category_id: e.category || 'Other',
                amount: Math.max(0.01, e.amount || 0),
                description: e.notes ? `${e.name} - ${e.notes}` : e.name,
                transaction_date: toISODate(e.date),
                date: toISODate(e.date),
              }));
              await supabase.from('transactions').upsert(txRows, { onConflict: 'transaction_id' });
            }
          } catch (e) {
            console.warn('[GamificationStore] Transactions auto-seed note:', e);
          }

          // 2. Budgets: if remote is empty and we have budget configured, sync them
          try {
            const currentTotal = get().totalBudget || 0;
            const currentLimits = get().categoryLimits || {};
            if (currentTotal > 0 || Object.keys(currentLimits).length > 0) {
              const currentMonth = new Date().toISOString().slice(0, 7);
              const bRows = [
                {
                  user_id: userId,
                  owner_id: userId,
                  category: '__total__',
                  category_id: '__total__',
                  allocated_amount: currentTotal,
                  limit_amount: currentTotal,
                  month: currentMonth,
                  period: currentMonth,
                  updated_at: new Date().toISOString(),
                },
                ...Object.entries(currentLimits).map(([cat, limit]) => ({
                  user_id: userId,
                  owner_id: userId,
                  category: cat,
                  category_id: cat,
                  allocated_amount: limit,
                  limit_amount: limit,
                  month: currentMonth,
                  period: currentMonth,
                  updated_at: new Date().toISOString(),
                })),
              ];
              const { error: bErr } = await supabase.from('budgets').upsert(bRows, { onConflict: 'user_id,category,month' });
              if (bErr) {
                // Fallback if unique constraint has a different name: clean and insert
                await supabase.from('budgets').delete().eq('user_id', userId).eq('month', currentMonth);
                await supabase.from('budgets').insert(bRows);
              }
            }
          } catch (e) {
            console.warn('[GamificationStore] Budgets auto-seed note:', e);
          }

          // 3. Saving Challenges: if remote is empty and we have goals, sync them
          try {
            const currentGoals = get().savingsGoals || [];
            if ((!goalsRes || (goalsRes.status === 'fulfilled' && (!goalsRes.value.data || goalsRes.value.data.length === 0))) && currentGoals.length > 0) {
              const goalRows = currentGoals.map((g) => ({
                challenge_id: g.id,
                user_id: userId,
                title: g.name,
                target_amount: g.targetAmount,
                current_amount: g.currentSavings || 0,
                end_date: g.targetDate ? toISODate(g.targetDate) : null,
                icon: g.category || 'PiggyBank',
                color: '#10B981',
                is_completed: (g.currentSavings || 0) >= g.targetAmount,
                updated_at: new Date().toISOString(),
              }));
              await supabase.from('saving_challenges').upsert(goalRows, { onConflict: 'challenge_id' });
            }
          } catch (e) {
            console.warn('[GamificationStore] Saving challenges auto-seed note:', e);
          }

          // 4. User Investments: sync active portfolio allocations
          try {
            const currentAllocations = get().portfolioAllocations || {};
            if (Object.keys(currentAllocations).length > 0) {
              const investRows = Object.entries(currentAllocations).map(([ticker, qty]) => ({
                user_id: userId,
                ticker,
                asset_class: ticker === 'BTC' || ticker === 'ETH' || ticker === 'SOL' ? 'crypto' : 'stock',
                quantity: qty,
                average_buy_price: 100.0,
                updated_at: new Date().toISOString(),
              }));
              await supabase.from('user_investments').upsert(investRows, { onConflict: 'user_id,ticker' });
            }
          } catch (e) {
            console.warn('[GamificationStore] User investments auto-seed note:', e);
          }

          // 5. User Lessons: sync completed lessons
          try {
            const completedLessons = get().completedLessonIds || [];
            if (completedLessons.length > 0) {
              const lRows = completedLessons.map((lId) => ({
                user_id: userId,
                lesson_id: lId,
                completed_at: new Date().toISOString(),
              }));
              await supabase.from('user_lessons').upsert(lRows, { onConflict: 'user_id,lesson_id' });
            }
          } catch (e) {
            console.warn('[GamificationStore] User lessons auto-seed note:', e);
          }

          // 6. User Achievements: sync all unlocked badges
          try {
            const achievements = get().achievements || [];
            // Seed any unlocked achievement or grant basic starter badge if user has any progress
            const unlocked = achievements.filter((a) => a.unlockedAt);
            const toSync = unlocked.length > 0
              ? unlocked
              : (get().completedLessonIds || []).length > 0
              ? [{ id: 'first_lesson', unlockedAt: new Date().toISOString() }]
              : [{ id: 'first_budget', unlockedAt: new Date().toISOString() }];

            const achRows = toSync.map((a) => ({
              user_id: userId,
              achievement_id: a.id,
              unlocked_at: a.unlockedAt || new Date().toISOString(),
            }));
            await supabase.from('user_achievements').upsert(achRows, { onConflict: 'user_id,achievement_id' });
          } catch (e) {
            console.warn('[GamificationStore] User achievements auto-seed note:', e);
          }

          // 7. Daily Check-in Logs: sync check-in record for current streak
          try {
            const streakCount = get().streakDays || 1;
            const lastClaim = get().lastClaimedRewardDate || getLocalDateString();
            const dayInCycle = get().lastClaimedDay || ((streakCount - 1) % 7) + 1;
            await supabase.from('daily_checkin_logs').upsert([
              {
                user_id: userId,
                checkin_date: toISODate(lastClaim),
                streak_count: streakCount,
                day_in_cycle: dayInCycle,
                xp_reward: 15 * dayInCycle,
                cash_reward: 100 * dayInCycle,
                claimed_at: new Date().toISOString(),
              },
            ], { onConflict: 'user_id,checkin_date' });
          } catch (e) {
            console.warn('[GamificationStore] Daily checkin logs auto-seed note:', e);
          }

          // 8. Savings Vault History: sync unspent baon rollovers
          try {
            const records = get().savingsRecords || [];
            const vaultBal = get().unspentSavingsVault || 0;
            if (records.length > 0) {
              const vaultRows = records.map((r) => ({
                user_id: userId,
                amount: r.amount,
                cycle: r.cycle || 'daily',
                note: r.note || 'Unspent allowance rollover',
                rolled_over_at: r.createdAtISO || new Date().toISOString(),
              }));
              await supabase.from('savings_vault_history').insert(vaultRows);
            } else if (vaultBal > 0) {
              await supabase.from('savings_vault_history').insert([
                {
                  user_id: userId,
                  amount: vaultBal,
                  cycle: get().budgetType || 'daily',
                  note: 'Baon savings vault reserve',
                  rolled_over_at: new Date().toISOString(),
                },
              ]);
            }
          } catch (e) {
            console.warn('[GamificationStore] Savings vault history auto-seed note:', e);
          }
        })();
      }
    } catch (e) {
      console.warn('[GamificationStore] Failed to hydrate gamification state:', e);
    }
  };

  activeHydratingUserId = targetUserId;
  activeHydrationPromise = runHydration();
  try {
    await activeHydrationPromise;
  } finally {
    activeHydrationPromise = null;
    activeHydratingUserId = undefined;
  }
},
}));

/**
 * Converts a persisted snapshot (local cache or cloud backup) into store data,
 * applying schema migrations and the guest midnight reset.
 */
function buildStateFromSnapshot(
  raw: Record<string, any>,
  isGuestMode: boolean,
  todayISO: string
): GamificationDataState {
  const parsed = { ...raw };
  const version = parsed._version || 1;

  // Schema migrations for older versions
  if (version < CURRENT_GAMIFICATION_VERSION) {
    if (!Array.isArray(parsed.loggedExpenses)) parsed.loggedExpenses = [];
    if (!Array.isArray(parsed.savingsGoals)) parsed.savingsGoals = [];
    if (!Array.isArray(parsed.savingsRecords)) parsed.savingsRecords = [];
    if (!Array.isArray(parsed.achievements)) parsed.achievements = [];
    if (!Array.isArray(parsed.completedLessonIds)) parsed.completedLessonIds = [];
    if (typeof parsed.unspentSavingsVault !== 'number') parsed.unspentSavingsVault = 0;
    if (typeof parsed.virtualBalance !== 'number') parsed.virtualBalance = 0;
    if (!parsed.portfolioAllocations || typeof parsed.portfolioAllocations !== 'object') {
      parsed.portfolioAllocations = {};
    }
    if (!parsed.categoryLimits || typeof parsed.categoryLimits !== 'object') {
      parsed.categoryLimits = {};
    }
  }

  let effectiveExpenses: Expense[] = parsed.loggedExpenses ?? [];
  let guestSessionDate = parsed.guestSessionDate || parsed.lastActiveDate || todayISO;

  if (isGuestMode) {
    if (guestSessionDate !== todayISO) {
      guestSessionDate = todayISO;
    }
  }

  const xpVal = parsed.xp ?? 45;
  const computedLevel = calculateLevelFromXP(xpVal);
  const storedLevel = parsed.level ?? 1;
  const effectiveLevel = Math.max(storedLevel, computedLevel);
  const pendingLevelUp = computedLevel > storedLevel ? computedLevel : null;

  return {
    xp: xpVal,
    level: effectiveLevel,
    pendingLevelUp,
    streakDays: parsed.streakDays ?? 1,
    lastActiveDate: parsed.lastActiveDate ?? null,
    lastClaimedRewardDate: parsed.lastClaimedRewardDate ?? null,
    lastClaimedDay: parsed.lastClaimedDay !== undefined ? Number(parsed.lastClaimedDay) : undefined,
    achievements: parsed.achievements ?? [],
    budgetingScore: parsed.budgetingScore ?? 0,
    learningScore: parsed.learningScore ?? 0,
    savingScore: parsed.savingScore ?? 0,
    investingScore: parsed.investingScore ?? 0,
    customAvatar: parsed.customAvatar ?? 'Budget Beginner',
    isBudgetSetupComplete: parsed.isBudgetSetupComplete ?? false,
    budgetType: parsed.budgetType ?? null,
    totalBudget: parsed.totalBudget ?? 0,
    selectedCategories: parsed.selectedCategories ?? [],
    categoryLimits: parsed.categoryLimits ?? {},
    loggedExpenses: effectiveExpenses,
    savingsGoals: parsed.savingsGoals ?? [],
    unspentSavingsVault: parsed.unspentSavingsVault ?? 0,
    savingsRecords: parsed.savingsRecords ?? [],
    virtualBalance: parsed.virtualBalance ?? 0,
    portfolioAllocations: parsed.portfolioAllocations ?? {},
    riskProfile: parsed.riskProfile ?? null,
    spareChangeAccumulated: parsed.spareChangeAccumulated ?? 0,
    completedLessonIds: parsed.completedLessonIds ?? [],
    lastDividendClaimDates: parsed.lastDividendClaimDates ?? {},
    guestSessionDate,
    currency: parsed.currency ?? 'PHP',
  };
}

// ── Automatic 12 Midnight Guest Reset Scheduler ──────────────────────
let midnightTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleMidnightCheck() {
  if (midnightTimer) {
    clearTimeout(midnightTimer);
    midnightTimer = null;
  }
  const now = new Date();
  const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 1);
  const msUntilMidnight = Math.max(1000, nextMidnight.getTime() - now.getTime());

  midnightTimer = setTimeout(() => {
    useGamificationStore.getState().checkMidnightGuestReset();
    scheduleMidnightCheck();
  }, msUntilMidnight);
}

scheduleMidnightCheck();

// Listen to foreground resume so if device slept through midnight, guest resets immediately.
// On background, push any pending cloud backup so it isn't lost if the app is killed.
AppState.addEventListener('change', (nextAppState) => {
  if (nextAppState === 'active') {
    useGamificationStore.getState().checkMidnightGuestReset();
    useGamificationStore.getState().checkAndUpdateStreak();
  } else if (nextAppState === 'background') {
    flushCloudSnapshot().catch((err) => console.warn('[GamificationStore] Background snapshot flush error:', err));
  }
});

