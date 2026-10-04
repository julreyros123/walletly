import { create } from 'zustand';
import { AppState } from 'react-native';
import { storage } from '@/utils/storage';
import { supabase } from '@/utils/supabase';
import { syncQueue } from '@/utils/syncQueue';

export const CURRENT_GAMIFICATION_VERSION = 2;
const BASE_GAMIFICATION_KEY = 'cbudget_gamification_state';

// Track the current authenticated user ID for state scoping
let currentActiveUserId: string | null = null;
let lastHydratedTarget: string | null | undefined = undefined;
let hydrationGeneration = 0;
let isHydrationComplete = false;

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

export function getCycleMetrics(state: {
  totalBudget: number;
  budgetType: 'daily' | 'weekly' | 'monthly' | null;
  loggedExpenses: Expense[];
}): CycleMetrics {
  const cycle = state.budgetType || 'monthly';
  const limit =
    state.totalBudget > 0
      ? state.totalBudget
      : cycle === 'daily'
      ? 150
      : cycle === 'weekly'
      ? 1000
      : 4000;

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

  // Core Actions
  addXP: (amount: number) => void;
  checkAndUpdateStreak: () => void;
  claimDailyReward: () => { success: boolean; xp: number; cash: number };
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

const LEVEL_THRESHOLDS = [0, 100, 250, 500, 1000, 2000, 3500, 5000];

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

    const dataToSave = {
      _version: CURRENT_GAMIFICATION_VERSION,
      xp: state.xp,
      level: state.level,
      streakDays: state.streakDays,
      lastActiveDate: state.lastActiveDate,
      lastClaimedRewardDate: state.lastClaimedRewardDate,
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
      _savedAt: Date.now(),
    };
    await storage.setItem(storageKey, JSON.stringify(dataToSave));

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
  streakDays: number;
  lastActiveDate: string | null;
  lastClaimedRewardDate: string | null;
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
};

export const DEFAULT_GAMIFICATION_DATA: GamificationDataState = {
  xp: 45,
  level: 1,
  streakDays: 1,
  lastActiveDate: null,
  lastClaimedRewardDate: null,
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
};

export const useGamificationStore = create<GamificationState>()((set, get) => ({
  ...DEFAULT_GAMIFICATION_DATA,

  addXP: (amount) => {
    set((state) => {
      const newXp = state.xp + amount;
      let newLevel = 1;
      for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
        if (newXp >= LEVEL_THRESHOLDS[i]) {
          newLevel = i + 1;
          break;
        }
      }
      const next = { xp: newXp, level: newLevel };
      persistState({ ...state, ...next });
      return next;
    });
  },

  checkAndUpdateStreak: () => {
    const today = getLocalDateString();
    set((state) => {
      if (!state.lastActiveDate) {
        const next = { streakDays: 1, lastActiveDate: today };
        persistState({ ...state, ...next });
        return next;
      }
      if (state.lastActiveDate === today) {
        return state;
      }

      // Calculate calendar days difference safely using local date parts
      const [y1, m1, d1] = state.lastActiveDate.split('-').map(Number);
      const [y2, m2, d2] = today.split('-').map(Number);
      const dActive = new Date(y1, m1 - 1, d1);
      const dToday = new Date(y2, m2 - 1, d2);
      const diffTime = dToday.getTime() - dActive.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        const nextStreak = (state.streakDays || 0) + 1;
        let updatedAchievements = [...state.achievements];
        if (nextStreak >= 7 && !updatedAchievements.some((a) => a.id === 'streak_7')) {
          const ach = ALL_ACHIEVEMENTS.find((a) => a.id === 'streak_7');
          if (ach) {
            updatedAchievements.push({ ...ach, unlockedAt: new Date().toISOString() });
          }
        }
        const next = {
          streakDays: nextStreak,
          lastActiveDate: today,
          savingScore: Math.min(100, state.savingScore + 5),
          achievements: updatedAchievements,
        };
        persistState({ ...state, ...next });
        return next;
      } else if (diffDays > 1) {
        const next = { streakDays: 1, lastActiveDate: today };
        persistState({ ...state, ...next });
        return next;
      }
      return state;
    });
  },

  claimDailyReward: () => {
    let result = { success: false, xp: 0, cash: 0 };
    set((state) => {
      const today = getLocalDateString();
      if (state.lastClaimedRewardDate === today) {
        return state;
      }

      const dayInCycle = (((state.streakDays || 1) - 1) % 7) + 1;
      const xpReward = dayInCycle * 10;
      let cashReward = 0;
      if (dayInCycle === 3) cashReward = 500;
      if (dayInCycle === 7) cashReward = 2000;

      result = { success: true, xp: xpReward, cash: cashReward };

      const newXp = state.xp + xpReward;
      let newLevel = 1;
      for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
        if (newXp >= LEVEL_THRESHOLDS[i]) {
          newLevel = i + 1;
          break;
        }
      }

      const next = {
        lastClaimedRewardDate: today,
        lastActiveDate: today,
        xp: newXp,
        level: newLevel,
        virtualBalance: state.virtualBalance + cashReward,
        learningScore: Math.min(100, state.learningScore + dayInCycle * 2),
      };
      persistState({ ...state, ...next });
      return next;
    });
    return result;
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

      const next = {
        isBudgetSetupComplete: true,
        budgetType: type,
        totalBudget: amount,
        selectedCategories: categories,
        categoryLimits: limits,
        budgetingScore: 80,
        achievements: updatedAchievements,
        xp: state.xp + 30,
      };
      persistState({ ...state, ...next });

      // Enqueue sync for budgets with retry queue
      (async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession().catch(() => ({ data: { session: null } }));
          if (session?.user?.id && session.user.id !== 'guest') {
            const currentMonth = new Date().toISOString().slice(0, 7); // 'YYYY-MM'
            const rowsToInsert = [
              {
                owner_id: session.user.id,
                user_id: session.user.id,
                category: '__total__',
                limit_amount: amount,
                allocated_amount: amount,
                period: 'monthly',
                month: currentMonth,
              },
              ...Object.entries(limits).map(([cat, limit]) => ({
                owner_id: session.user.id,
                user_id: session.user.id,
                category: cat,
                limit_amount: limit,
                allocated_amount: limit,
                period: 'monthly',
                month: currentMonth,
              })),
            ];
            await syncQueue.enqueue({
              table: 'budgets',
              action: 'delete',
              match: { owner_id: session.user.id },
            });
            await syncQueue.enqueue({
              table: 'budgets',
              action: 'insert',
              payload: rowsToInsert,
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
              const { data: existing } = await supabase
                .from('budgets')
                .select('budget_id')
                .eq('owner_id', session.user.id)
                .eq('category', '__total__')
                .maybeSingle();

              if (existing?.budget_id) {
                await supabase
                  .from('budgets')
                  .update({ limit_amount: amount, allocated_amount: amount, updated_at: new Date().toISOString() })
                  .eq('budget_id', existing.budget_id);
              } else {
                await supabase.from('budgets').insert({
                  owner_id: session.user.id,
                  user_id: session.user.id,
                  category: '__total__',
                  limit_amount: amount,
                  allocated_amount: amount,
                  period: 'monthly',
                  month: currentMonth,
                });
              }
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
      if (state.totalBudget > 0 && totalSpent > state.totalBudget) {
        nextBudgetingScore = Math.max(20, state.budgetingScore - 10);
      } else {
        nextBudgetingScore = Math.min(100, state.budgetingScore + 5);
      }

      let updatedAchievements = [...state.achievements];
      if (nextBudgetingScore >= 90 && !updatedAchievements.some((a) => a.id === 'budget_master')) {
        const ach = ALL_ACHIEVEMENTS.find((a) => a.id === 'budget_master');
        if (ach) updatedAchievements.push({ ...ach, unlockedAt: new Date().toISOString() });
      }

      const cents = amount % 100;
      const roundUp = cents === 0 ? 0 : 100 - cents;
      const nextSpareChange = state.spareChangeAccumulated + roundUp;

      const next = {
        loggedExpenses: updatedExpenses,
        budgetingScore: nextBudgetingScore,
        achievements: updatedAchievements,
        xp: state.xp + 10,
        spareChangeAccumulated: nextSpareChange,
      };
      persistState({ ...state, ...next });

      // Enqueue sync for transaction insert
      (async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession().catch(() => ({ data: { session: null } }));
          if (session?.user?.id && session.user.id !== 'guest') {
            await syncQueue.enqueue({
              table: 'transactions',
              action: 'insert',
              payload: {
                transaction_id: expenseId,
                owner_id: session.user.id,
                user_id: session.user.id,
                type: 'expense',
                category: category,
                amount,
                description: notes ? `${name} - ${notes}` : name,
                transaction_date: toISODate(date),
              },
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
              match: { transaction_id: id, owner_id: session.user.id },
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
              match: { transaction_id: id, owner_id: session.user.id },
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
      const next = {
        loggedExpenses: updatedExpenses,
        xp: state.xp + 10,
      };
      persistState({ ...state, ...next });

      (async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession().catch(() => ({ data: { session: null } }));
          if (session?.user?.id && session.user.id !== 'guest') {
            await syncQueue.enqueue({
              table: 'transactions',
              action: 'insert',
              payload: {
                transaction_id: incomeId,
                owner_id: session.user.id,
                user_id: session.user.id,
                type: 'income',
                category: category || 'Income',
                amount,
                description: notes ? `${name} - ${notes}` : name,
                transaction_date: toISODate(date),
              },
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
        supabase.from('transactions').delete().eq('owner_id', uid),
        supabase.from('budgets').delete().eq('owner_id', uid),
        supabase.from('saving_challenges').delete().eq('user_id', uid),
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
      const next = {
        savingsGoals: updatedGoals,
        savingScore: Math.min(100, state.savingScore + 5),
        xp: state.xp + 15,
      };
      persistState({ ...state, ...next });

      (async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession().catch(() => ({ data: { session: null } }));
          if (session?.user?.id && session.user.id !== 'guest') {
            await syncQueue.enqueue({
              table: 'saving_challenges',
              action: 'insert',
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

      const next = {
        savingsGoals: updatedGoals,
        loggedExpenses: updatedExpenses,
        savingScore: Math.min(100, nextSavingScore),
        achievements: updatedAchievements,
        xp: state.xp + 15,
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
              action: 'insert',
              payload: {
                transaction_id: expenseId,
                owner_id: session.user.id,
                user_id: session.user.id,
                type: 'expense',
                category: 'Savings',
                amount: actualContributed,
                description: `Allocated to ${goalName}`,
                transaction_date: getLocalDateString(),
              },
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
              action: 'insert',
              payload: {
                transaction_id: incomeId,
                owner_id: session.user.id,
                user_id: session.user.id,
                type: 'income',
                category: 'Savings',
                amount,
                description: `Withdrawn from ${targetGoal.name}`,
                transaction_date: getLocalDateString(),
              },
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

      const next = {
        unspentSavingsVault: nextVault,
        savingsRecords: updatedRecords,
        loggedExpenses: updatedExpenses,
        xp: state.xp + 15,
        savingScore: Math.min(100, state.savingScore + 5),
      };
      persistState({ ...state, ...next });

      (async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession().catch(() => ({ data: { session: null } }));
          if (session?.user?.id && session.user.id !== 'guest') {
            await syncQueue.enqueue({
              table: 'transactions',
              action: 'insert',
              payload: {
                transaction_id: expenseId,
                owner_id: session.user.id,
                user_id: session.user.id,
                type: 'expense',
                category: 'Savings',
                amount,
                description: `Savings Vault: ${defaultNote}`,
                transaction_date: getLocalDateString(now),
              },
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
              action: 'insert',
              payload: {
                transaction_id: incomeId,
                owner_id: session.user.id,
                user_id: session.user.id,
                type: 'income',
                category: 'Savings',
                amount,
                description: `Withdrawal from Savings Vault at ${formattedTime}`,
                transaction_date: getLocalDateString(now),
              },
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
      const next = {
        spareChangeAccumulated: 0,
        virtualBalance: state.virtualBalance + amount,
        xp: state.xp + 10,
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

      const next = {
        loggedExpenses: updatedExpenses,
        virtualBalance: state.virtualBalance + amount,
        xp: state.xp + 10,
      };
      persistState({ ...state, ...next });

      (async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession().catch(() => ({ data: { session: null } }));
          if (session?.user?.id && session.user.id !== 'guest') {
            await syncQueue.enqueue({
              table: 'transactions',
              action: 'insert',
              payload: {
                transaction_id: expenseId,
                owner_id: session.user.id,
                user_id: session.user.id,
                type: 'expense',
                category: 'Savings',
                amount,
                description: 'Transfer to Investment Sandbox',
                transaction_date: getLocalDateString(),
              },
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
      const next = {
        virtualBalance: state.virtualBalance + amount,
        xp: state.xp + 25,
      };
      persistState({ ...state, ...next });
      return next;
    });
  },

  addSimulationCash: (amount, xpReward = 10) => {
    set((state) => {
      const next = {
        virtualBalance: state.virtualBalance + amount,
        xp: state.xp + xpReward,
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
      const newXp = state.xp + xpEarned;
      let newLevel = 1;
      for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
        if (newXp >= LEVEL_THRESHOLDS[i]) {
          newLevel = i + 1;
          break;
        }
      }
      const nextBalance = Math.max(0, state.virtualBalance + cashProfit);
      const next = {
        xp: newXp,
        level: newLevel,
        virtualBalance: nextBalance,
      };
      persistState({ ...state, ...next });
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
      const next = {
        virtualBalance: state.virtualBalance + amount,
        xp: state.xp + 5,
        lastDividendClaimDates: {
          ...state.lastDividendClaimDates,
          [ticker]: today,
        },
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

        const next = {
          virtualBalance: state.virtualBalance - totalCost,
          portfolioAllocations: newAllocations,
          investingScore: nextInvestingScore,
          achievements: updatedAchievements,
          xp: state.xp + 15,
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

        const next = {
          virtualBalance: state.virtualBalance + totalCost,
          portfolioAllocations: newAllocations,
          xp: state.xp + 10,
        };
        persistState({ ...state, ...next });
        return next;
      }
    });
    return success;
  },

  completeLesson: (moduleName, lessonId) => {
    set((state) => {
      const id = lessonId || moduleName;
      const alreadyCompleted = state.completedLessonIds.includes(id);

      if (alreadyCompleted) {
        // Repeated practice: small XP bonus, no extra score unlock
        const next = { xp: state.xp + 10 };
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

      const next = {
        learningScore: nextLearningScore,
        completedLessonIds: nextCompleted,
        achievements: updatedAchievements,
        xp: state.xp + 50,
      };
      persistState({ ...state, ...next });
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

      const next = {
        customAvatar: avatar,
        achievements: updatedAchievements,
        xp: state.xp + 10,
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
    const isGuest = currentActiveUserId === null || currentActiveUserId === 'guest';
    if (!isGuest) return;
    const today = getLocalDateString();
    const state = get();
    if (state.guestSessionDate && state.guestSessionDate !== today) {
      const next = {
        loggedExpenses: [] as Expense[],
        guestSessionDate: today,
      };
      set(next);
      persistState({ ...state, ...next }, 'guest');
    }
  },

  hydrate: async (targetUserId?: string | null) => {
    try {
      const generation = ++hydrationGeneration;
      let resolvedUserId = targetUserId;
      if (resolvedUserId === undefined) {
        // Probe Supabase session
        const { data: { session } } = await supabase.auth.getSession().catch((err) => {
          console.warn('[GamificationStore] Probe session warning:', err);
          return { data: { session: null } };
        });
        resolvedUserId = session?.user?.id || null;
      }

      if (resolvedUserId !== undefined && resolvedUserId === lastHydratedTarget) {
        return;
      }
      lastHydratedTarget = resolvedUserId;
      currentActiveUserId = resolvedUserId;
      isHydrationComplete = false;

      const userKey = getUserStorageKey(resolvedUserId);
      const isGuestMode = resolvedUserId === null || resolvedUserId === 'guest';
      const todayISO = getLocalDateString();

      // 1. Read from local cache for instant offline load
      let stored = await storage.getItem(userKey);
      if (!stored && isGuestMode) {
        // Migration: check legacy un-scoped key only for guest/unauthenticated sessions
        stored = await storage.getItem(BASE_GAMIFICATION_KEY);
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
        set({ ...DEFAULT_GAMIFICATION_DATA });
      }

      isHydrationComplete = true;

      // 2. If authenticated with Supabase, pull cloud records and sync permanently
      if (resolvedUserId && resolvedUserId !== 'guest') {
        const userId = resolvedUserId;

        // Concurrent fetch of full-state backup, transactions, budgets, and saving challenges
        // Uses .or(owner_id, user_id) so no transactions are ever omitted
        const [snapshotRes, txRes, budgetRes, goalsRes] = await Promise.allSettled([
          supabase
            .from(CLOUD_STATE_TABLE)
            .select('state, updated_at')
            .eq('user_id', userId)
            .maybeSingle(),
          supabase
            .from('transactions')
            .select('*')
            .or(`owner_id.eq.${userId},user_id.eq.${userId}`)
            .order('transaction_date', { ascending: false }),
          supabase
            .from('budgets')
            .select('*')
            .or(`owner_id.eq.${userId},user_id.eq.${userId}`),
          supabase
            .from('saving_challenges')
            .select('*')
            .eq('user_id', userId),
        ]);

        if (generation !== hydrationGeneration) {
          return;
        }

        // Full-state backup: restore it when this device has no cache or an older one
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
                set(buildStateFromSnapshot(remoteState, false, todayISO));
                restoredFromSnapshot = true;
              }
            }
          } else if (isMissingTableError(snapErr)) {
            cloudSnapshotDisabled = true;
            snapshotRead = true;
            console.warn('[GamificationStore] user_app_state table missing. Run supabase/user_app_state.sql to enable cloud backup.');
          } else {
            console.warn('[GamificationStore] Cloud snapshot read failed:', snapErr.message);
          }
        }

        const nextUpdates: Partial<GamificationState> = {};

        // Transactions / Activity history sync (merge remote with offline local items)
        if (txRes.status === 'fulfilled' && txRes.value.data) {
          const remoteTxs = txRes.value.data;
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
        }

        // Budgets / Allocation sync (the full-state backup already carries budget data)
        if (!restoredFromSnapshot && budgetRes.status === 'fulfilled' && budgetRes.value.data) {
          const budgetRows = budgetRes.value.data;
          if (budgetRows.length > 0) {
            let total = 0;
            const categoryLimits: Record<string, number> = {};
            const categories: string[] = [];

            for (const b of budgetRows) {
              // Prefer `category`: older rows got category_id = '__total__' from the column default
              const cat = b.category || b.category_id;
              const limit = Number(b.limit_amount ?? b.allocated_amount) || 0;
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
        }

        // Savings Goals sync (saving_challenges in Supabase, merged with local goals)
        if (goalsRes.status === 'fulfilled' && goalsRes.value.data) {
          const goalsRows = goalsRes.value.data;
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
        }

        if (Object.keys(nextUpdates).length > 0) {
          set(nextUpdates);
        }

        // Allow cloud backups only once we know we won't clobber real cloud data:
        // either the cloud row was read, or this device already had its own cache.
        if (snapshotRead || hasLocalCache) {
          cloudReadyUserId = userId;
        }

        if (restoredFromSnapshot || Object.keys(nextUpdates).length > 0 || cloudReadyUserId === userId) {
          persistState(get(), userId);
        }

        // Process any queued offline actions now that connection & user are verified
        syncQueue.process().catch((err) => {
          console.warn('[GamificationStore] Error processing sync queue post-hydration:', err);
        });
      }
    } catch (e) {
      console.warn('[GamificationStore] Failed to hydrate gamification state:', e);
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

  // Midnight reset for Guest Mode: if date changed, clear guest transactions
  if (isGuestMode) {
    if (guestSessionDate !== todayISO) {
      effectiveExpenses = [];
      guestSessionDate = todayISO;
    }
  }

  return {
    xp: parsed.xp ?? 45,
    level: parsed.level ?? 1,
    streakDays: parsed.streakDays ?? 1,
    lastActiveDate: parsed.lastActiveDate ?? null,
    lastClaimedRewardDate: parsed.lastClaimedRewardDate ?? null,
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
  } else if (nextAppState === 'background') {
    flushCloudSnapshot().catch((err) => console.warn('[GamificationStore] Background snapshot flush error:', err));
  }
});

