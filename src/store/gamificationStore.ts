import { create } from 'zustand';
import { useAuthStore } from './authStore';
import { storage } from '@/utils/storage';

const GAMIFICATION_STORAGE_KEY = 'cbudget_gamification_state';

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

  // Simulated Investing Cash Balance
  virtualBalance: number;
  portfolioAllocations: Record<string, number>;
  riskProfile: 'Conservative' | 'Moderate' | 'Aggressive' | null;
  spareChangeAccumulated: number;

  // Completed Lessons Tracking (prevents duplicate XP exploits)
  completedLessonIds: string[];
  lastDividendClaimDates: Record<string, string>; // ticker -> YYYY-MM-DD

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
  addExpense: (name: string, category: string, amount: number, date: string, notes?: string) => void;
  editExpense: (id: string, updated: Partial<Omit<Expense, 'id'>>) => void;
  deleteExpense: (id: string) => void;
  addIncome: (name: string, category: string, amount: number, date: string, notes?: string) => void;
  resetBudget: () => void;
  resetAllData: (defaultVirtualBalance?: number) => void;

  // Savings Actions
  addSavingsGoal: (name: string, targetAmount: number, targetDate: string, category: string) => void;
  contributeToSavingsGoal: (goalId: string, amount: number) => boolean;
  withdrawSavingsGoal: (goalId: string, amount: number) => boolean;
  deleteSavingsGoal: (goalId: string) => void;

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
  hydrate: () => Promise<void>;
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

async function persistState(state: GamificationState) {
  try {
    const dataToSave = {
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
      virtualBalance: state.virtualBalance,
      portfolioAllocations: state.portfolioAllocations,
      riskProfile: state.riskProfile,
      spareChangeAccumulated: state.spareChangeAccumulated,
      completedLessonIds: state.completedLessonIds,
      lastDividendClaimDates: state.lastDividendClaimDates,
    };
    await storage.setItem(GAMIFICATION_STORAGE_KEY, JSON.stringify(dataToSave));
  } catch (e) {
    console.warn('[GamificationStore] Failed to persist state:', e);
  }
}

export const useGamificationStore = create<GamificationState>()((set, get) => ({
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

  virtualBalance: 0,
  portfolioAllocations: {},
  riskProfile: null,
  spareChangeAccumulated: 0,

  completedLessonIds: [],
  lastDividendClaimDates: {},

  addXP: (amount) => {
    const isGuest = useAuthStore.getState().user?.id === 'guest';
    if (isGuest) return;
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
    const isGuest = useAuthStore.getState().user?.id === 'guest';
    if (isGuest) return;
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
    const isGuest = useAuthStore.getState().user?.id === 'guest';
    set((state) => {
      let updatedAchievements = [...state.achievements];
      if (!isGuest && !updatedAchievements.some((a) => a.id === 'first_budget')) {
        const ach = ALL_ACHIEVEMENTS.find((a) => a.id === 'first_budget');
        if (ach) updatedAchievements.push({ ...ach, unlockedAt: new Date().toISOString() });
      }

      const next = {
        isBudgetSetupComplete: true,
        budgetType: type,
        totalBudget: amount,
        selectedCategories: categories,
        categoryLimits: limits,
        budgetingScore: isGuest ? 0 : 80,
        achievements: updatedAchievements,
        xp: isGuest ? state.xp : state.xp + 30,
      };
      persistState({ ...state, ...next });
      return next;
    });
  },

  setBudgetType: (type, amount) => {
    set((state) => {
      const next = {
        budgetType: type,
        totalBudget: amount !== undefined ? amount : state.totalBudget,
      };
      persistState({ ...state, ...next });
      return next;
    });
  },

  addExpense: (name, category, amount, date, notes) => {
    const isGuest = useAuthStore.getState().user?.id === 'guest';
    set((state) => {
      const newExpense: Expense = {
        id: Date.now().toString(),
        name,
        category,
        amount,
        date,
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
      if (!isGuest && nextBudgetingScore >= 90 && !updatedAchievements.some((a) => a.id === 'budget_master')) {
        const ach = ALL_ACHIEVEMENTS.find((a) => a.id === 'budget_master');
        if (ach) updatedAchievements.push({ ...ach, unlockedAt: new Date().toISOString() });
      }

      const cents = amount % 100;
      const roundUp = cents === 0 ? 0 : 100 - cents;
      const nextSpareChange = state.spareChangeAccumulated + roundUp;

      const next = {
        loggedExpenses: updatedExpenses,
        budgetingScore: isGuest ? 0 : nextBudgetingScore,
        achievements: updatedAchievements,
        xp: isGuest ? state.xp : state.xp + 10,
        spareChangeAccumulated: nextSpareChange,
      };
      persistState({ ...state, ...next });
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
      return next;
    });
  },

  deleteExpense: (id) => {
    const isGuest = useAuthStore.getState().user?.id === 'guest';
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
        budgetingScore: isGuest ? 0 : nextBudgetingScore,
      };
      persistState({ ...state, ...next });
      return next;
    });
  },

  addIncome: (name, category, amount, date, notes) => {
    set((state) => {
      const newIncome: Expense = {
        id: Date.now().toString(),
        name,
        category: category || 'Income',
        amount,
        date,
        notes,
        type: 'income',
      };
      const updatedExpenses = [newIncome, ...state.loggedExpenses];
      const next = {
        loggedExpenses: updatedExpenses,
        xp: state.xp + 10,
      };
      persistState({ ...state, ...next });
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
        virtualBalance: defaultVirtualBalance,
        portfolioAllocations: {},
        riskProfile: null,
        spareChangeAccumulated: 0,
        completedLessonIds: [],
        lastDividendClaimDates: {},
      };
      persistState({ ...state, ...next });
      return next;
    });
  },

  addSavingsGoal: (name, targetAmount, targetDate, category) => {
    set((state) => {
      const newGoal: SavingsGoal = {
        id: Date.now().toString(),
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
      return next;
    });
  },

  contributeToSavingsGoal: (goalId, amount) => {
    let success = false;
    set((state) => {
      const onlyExpenses = state.loggedExpenses.filter((e) => e.type !== 'income');
      const totalSpent = onlyExpenses.reduce((sum, e) => sum + e.amount, 0);
      const budgetRemaining = state.totalBudget - totalSpent;
      const totalSavingsContribution = state.savingsGoals.reduce((sum, g) => sum + g.currentSavings, 0);
      const budgetLeftover = budgetRemaining - totalSavingsContribution - state.virtualBalance;

      if (state.totalBudget > 0 && amount > budgetLeftover) {
        return state;
      }

      success = true;
      const updatedGoals = state.savingsGoals.map((g) => {
        if (g.id === goalId) {
          const nextVal = g.currentSavings + amount;
          return { ...g, currentSavings: Math.min(g.targetAmount, nextVal) };
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

      const next = {
        savingsGoals: updatedGoals,
        savingScore: Math.min(100, nextSavingScore),
        achievements: updatedAchievements,
        xp: state.xp + 15,
      };
      persistState({ ...state, ...next });
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
      const updatedGoals = state.savingsGoals.map((g) => {
        if (g.id === goalId) {
          return { ...g, currentSavings: Math.max(0, g.currentSavings - amount) };
        }
        return g;
      });

      const next = { savingsGoals: updatedGoals };
      persistState({ ...state, ...next });
      return next;
    });
    return success;
  },

  deleteSavingsGoal: (goalId) => {
    set((state) => {
      const updatedGoals = state.savingsGoals.filter((g) => g.id !== goalId);
      const next = { savingsGoals: updatedGoals };
      persistState({ ...state, ...next });
      return next;
    });
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
      const onlyExpenses = state.loggedExpenses.filter((e) => e.type !== 'income');
      const totalSpent = onlyExpenses.reduce((sum, e) => sum + e.amount, 0);
      const budgetRemaining = state.totalBudget - totalSpent;
      const totalSavingsContribution = state.savingsGoals.reduce((sum, g) => sum + g.currentSavings, 0);
      const availableToTransfer = budgetRemaining - totalSavingsContribution - state.virtualBalance;

      if (state.totalBudget > 0 && amount > availableToTransfer) {
        return state;
      }

      success = true;
      const next = {
        virtualBalance: state.virtualBalance + amount,
        xp: state.xp + 10,
      };
      persistState({ ...state, ...next });
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
      const totalCost = qty * price;
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

  hydrate: async () => {
    try {
      const stored = await storage.getItem(GAMIFICATION_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        set({
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
          loggedExpenses: parsed.loggedExpenses ?? [],
          savingsGoals: parsed.savingsGoals ?? [],
          virtualBalance: parsed.virtualBalance ?? 0,
          portfolioAllocations: parsed.portfolioAllocations ?? {},
          riskProfile: parsed.riskProfile ?? null,
          spareChangeAccumulated: parsed.spareChangeAccumulated ?? 0,
          completedLessonIds: parsed.completedLessonIds ?? [],
          lastDividendClaimDates: parsed.lastDividendClaimDates ?? {},
        });
      }
    } catch (e) {
      console.warn('[GamificationStore] Failed to hydrate gamification state:', e);
    }
  },
}));
