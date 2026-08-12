import { create } from 'zustand';
import { useAuthStore } from './authStore';
import { sqliteStorage } from '@/utils/sqliteStorage';
import { syncStructuredStateToStorage } from '@/utils/domainSync';

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
  lastClaimedRewardDate: string | null; // Tracks daily reward claims
  achievements: Achievement[];
  
  // Educational Subscores (0 - 100)
  budgetingScore: number;
  learningScore: number;
  savingScore: number;
  investingScore: number;
  
  // Custom Avatar Mastery Title
  customAvatar: string; // e.g., 'Budget Beginner', 'Smart Saver', 'Investment Explorer', 'Financial Strategist'
  
  // New Budget Onboarding State
  isBudgetSetupComplete: boolean;
  budgetType: 'daily' | 'weekly' | 'monthly' | null;
  totalBudget: number;
  selectedCategories: string[];
  categoryLimits: Record<string, number>;
  
  // Logged Expenses & Savings Goals
  loggedExpenses: Expense[];
  savingsGoals: SavingsGoal[];
  completedLessons: string[];
  
  // Simulated Investing Cash Balance (transferred from remaining budget)
  virtualBalance: number; 
  portfolioAllocations: Record<string, number>; // ticker -> units owned
  riskProfile: 'Conservative' | 'Moderate' | 'Aggressive' | null;
  spareChangeAccumulated: number;
  
  // Actions
  addXP: (amount: number) => void;
  checkAndUpdateStreak: () => void;
  claimDailyReward: () => { success: boolean; xp: number; cash: number };
  unlockAchievement: (achievementId: string) => void;
  
  setupBudget: (type: 'daily' | 'weekly' | 'monthly', amount: number, categories: string[], limits: Record<string, number>) => void;
  addExpense: (name: string, category: string, amount: number, date: string, notes?: string) => void;
  deleteExpense: (id: string) => void;
  resetBudget: () => void;
  
  // Savings Actions
  addSavingsGoal: (name: string, targetAmount: number, targetDate: string, category: string) => void;
  contributeToSavingsGoal: (goalId: string, amount: number) => boolean;
  
  // Simulator Actions
  allocateToSimulation: (amount: number) => boolean;
  sweepSpareChange: () => void;
  tradeAssetSim: (ticker: string, type: 'buy' | 'sell', qty: number, price: number) => boolean;
  setRiskProfile: (profile: 'Conservative' | 'Moderate' | 'Aggressive' | null) => void;
  
  // General Updates
  completeLesson: (moduleName: string) => void;
  setCustomAvatar: (avatar: string) => void;
  getFinancialHealthScore: () => number;
}

const LEVEL_THRESHOLDS = [0, 100, 250, 500, 1000, 2000, 3500, 5000];

export const ALL_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_budget',
    title: 'First Budget Created',
    description: 'Defined your budgeting frequency, limit, and categories.',
    icon: 'checkmark.seal.fill',
    color: '#10B981', // Success emerald green
  },
  {
    id: 'first_lesson',
    title: 'First Lesson Completed',
    description: 'Finished your first Cbudget Academy lesson module.',
    icon: 'book.closed.fill',
    color: '#3B82F6', // Primary blue
  },
  {
    id: 'streak_7',
    title: '7 Day Learning Streak',
    description: 'Maintained a 7-day streak of active financial learning.',
    icon: 'flame.fill',
    color: '#F59E0B', // Warning amber
  },
  {
    id: 'invest_graduate',
    title: 'Investment Lab Graduate',
    description: 'Allocated simulation cash across assets in the Investment Lab.',
    icon: 'graduationcap.fill',
    color: '#8B5CF6', // Purple
  },
  {
    id: 'budget_master',
    title: 'Budget Master',
    description: 'Kept overall budgeting score above 90.',
    icon: 'chart.pie.fill',
    color: '#06B6D4', // Cyan
  },
  {
    id: 'financial_explorer',
    title: 'Financial Explorer',
    description: 'Unlocked 5 different lessons and completed 3 quizzes.',
    icon: 'safari.fill',
    color: '#EC4899', // Pink
  },
  {
    id: 'savings_strategist',
    title: 'Savings Strategist',
    description: 'Reached a simulated savings score of 85 or higher.',
    icon: 'dollarsign.circle.fill',
    color: '#10B981',
  },
  {
    id: 'emergency_fund_planner',
    title: 'Emergency Fund Planner',
    description: 'Completed the Emergency Funds saving strategy lesson.',
    icon: 'shield.fill',
    color: '#EF4444', // Red
  },
  {
    id: 'compound_master',
    title: 'Time Compounding Guru',
    description: 'Simulated a long-term 20-year compound interest savings timeline.',
    icon: 'hourglass.badge.plus',
    color: '#10B981', // Success green
  }
];

export const useGamificationStore = create<GamificationState>()((set, get) => ({
  xp: 45, // start with some XP
  level: 1,
  streakDays: 1,
  lastActiveDate: null,
  lastClaimedRewardDate: null,
  achievements: [],

  // Subscores initialize at 0 and grow through actions
  budgetingScore: 0,
  learningScore: 0,
  savingScore: 0,
  investingScore: 0,

  customAvatar: 'Budget Beginner',
  
  // Budget Onboarding State (Default: not complete)
  isBudgetSetupComplete: false,
  budgetType: null,
  totalBudget: 0,
  selectedCategories: [],
  categoryLimits: {},
  
  // Collections
  loggedExpenses: [],
  savingsGoals: [],
  completedLessons: [],
  
  // Investment Lab simulator state
  virtualBalance: 0, // cash left inside Investment Lab simulator
  portfolioAllocations: {}, // ticker -> units owned
  riskProfile: null,
  spareChangeAccumulated: 0,

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
      return { xp: newXp, level: newLevel };
    });
  },

  checkAndUpdateStreak: () => {
    const today = new Date().toISOString().split('T')[0];
    set((state) => {
      if (!state.lastActiveDate) {
        return { streakDays: 3, lastActiveDate: today };
      }
      const lastActive = new Date(state.lastActiveDate);
      const currentDate = new Date(today);
      const diffTime = Math.abs(currentDate.getTime() - lastActive.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        const nextStreak = state.streakDays + 1;
        let updatedAchievements = [...state.achievements];
        if (nextStreak >= 7 && !updatedAchievements.some(a => a.id === 'streak_7')) {
          const ach = ALL_ACHIEVEMENTS.find(a => a.id === 'streak_7');
          if (ach) {
            updatedAchievements.push({ ...ach, unlockedAt: new Date().toISOString() });
          }
        }
        return { 
          streakDays: nextStreak, 
          lastActiveDate: today, 
          savingScore: Math.min(100, state.savingScore + 5),
          achievements: updatedAchievements
        };
      } else if (diffDays > 1) {
        return { streakDays: 1, lastActiveDate: today };
      }
      return state;
    });
  },

  claimDailyReward: () => {
    const isGuest = useAuthStore.getState().user?.id === 'guest';
    if (isGuest) return { success: false, xp: 0, cash: 0 };
    let result = { success: false, xp: 0, cash: 0 };
    
    set((state) => {
      const today = new Date().toISOString().split('T')[0];
      if (state.lastClaimedRewardDate === today) {
        return state; // Already claimed today
      }

      // Calculate reward based on streak day (1-7 loop)
      const dayInCycle = ((state.streakDays - 1) % 7) + 1;
      
      let xpReward = dayInCycle * 10;
      let cashReward = 0;
      
      // Bonus cash on milestone days
      if (dayInCycle === 3) cashReward = 500;
      if (dayInCycle === 7) cashReward = 2000;

      result = { success: true, xp: xpReward, cash: cashReward };

      // Calculate new XP and level
      const newXp = state.xp + xpReward;
      let newLevel = 1;
      for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
        if (newXp >= LEVEL_THRESHOLDS[i]) {
          newLevel = i + 1;
          break;
        }
      }

      return {
        lastClaimedRewardDate: today,
        xp: newXp,
        level: newLevel,
        virtualBalance: state.virtualBalance + cashReward,
        learningScore: Math.min(100, state.learningScore + (dayInCycle * 2)), // Helps unlock Academy lessons
      };
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
      const achievement = ALL_ACHIEVEMENTS.find(a => a.id === achievementId);
      if (!achievement) return state;

      return {
        achievements: [
          ...state.achievements,
          { ...achievement, unlockedAt: new Date().toISOString() },
        ],
      };
    });
  },

  // Setup Budget (Onboarding)
  setupBudget: (type, amount, categories, limits) => {
    const isGuest = useAuthStore.getState().user?.id === 'guest';
    set((state) => {
      let updatedAchievements = [...state.achievements];
      if (!isGuest && !updatedAchievements.some(a => a.id === 'first_budget')) {
        const ach = ALL_ACHIEVEMENTS.find(a => a.id === 'first_budget');
        if (ach) updatedAchievements.push({ ...ach, unlockedAt: new Date().toISOString() });
      }

      return {
        isBudgetSetupComplete: true,
        budgetType: type,
        totalBudget: amount,
        selectedCategories: categories,
        categoryLimits: limits,
        budgetingScore: isGuest ? 0 : 80, // initial budgeting score for starting setup
        achievements: updatedAchievements,
        xp: isGuest ? state.xp : state.xp + 30 // reward for onboarding
      };
    });
  },

  // Log simulated expense
  addExpense: (name, category, amount, date, notes) => {
    const isGuest = useAuthStore.getState().user?.id === 'guest';
    set((state) => {
      const newExpense: Expense = {
        id: Date.now().toString(),
        name,
        category,
        amount,
        date,
        notes
      };
      const updatedExpenses = [newExpense, ...state.loggedExpenses];
      
      // Calculate spent vs total budget
      const totalSpent = updatedExpenses.reduce((sum, e) => sum + e.amount, 0);
      let nextBudgetingScore = state.budgetingScore;
      
      if (totalSpent > state.totalBudget) {
        nextBudgetingScore = Math.max(20, state.budgetingScore - 10); // Penalty for over budget
      } else {
        nextBudgetingScore = Math.min(100, state.budgetingScore + 5); // Reward for logging correctly
      }

      let updatedAchievements = [...state.achievements];
      if (!isGuest && nextBudgetingScore >= 90 && !updatedAchievements.some(a => a.id === 'budget_master')) {
        const ach = ALL_ACHIEVEMENTS.find(a => a.id === 'budget_master');
        if (ach) updatedAchievements.push({ ...ach, unlockedAt: new Date().toISOString() });
      }

      // Calculate Acorns-style round-up to nearest ₱100
      const cents = amount % 100;
      const roundUp = cents === 0 ? 0 : 100 - cents;
      const nextSpareChange = state.spareChangeAccumulated + roundUp;

      return {
        loggedExpenses: updatedExpenses,
        budgetingScore: isGuest ? 0 : nextBudgetingScore,
        achievements: updatedAchievements,
        xp: isGuest ? state.xp : state.xp + 10, // +10 XP
        spareChangeAccumulated: nextSpareChange
      };
    });
  },

  deleteExpense: (id) => {
    const isGuest = useAuthStore.getState().user?.id === 'guest';
    set((state) => {
      const updatedExpenses = state.loggedExpenses.filter((e) => e.id !== id);
      
      // Recalculate budgeting score
      const totalSpent = updatedExpenses.reduce((sum, e) => sum + e.amount, 0);
      let nextBudgetingScore = state.budgetingScore;
      if (totalSpent > state.totalBudget) {
        nextBudgetingScore = Math.max(20, state.budgetingScore - 10);
      } else {
        nextBudgetingScore = Math.min(100, state.budgetingScore + 5);
      }

      return {
        loggedExpenses: updatedExpenses,
        budgetingScore: isGuest ? 0 : nextBudgetingScore
      };
    });
  },

  resetBudget: () => {
    set({
      isBudgetSetupComplete: false,
      budgetType: null,
      totalBudget: 0,
      selectedCategories: [],
      categoryLimits: {},
      loggedExpenses: [],
      savingsGoals: [],
      completedLessons: [],
      virtualBalance: 0,
      portfolioAllocations: {},
      budgetingScore: 0,
      savingScore: 0,
      investingScore: 0,
      spareChangeAccumulated: 0
    });
  },

  // Add Savings Goal
  addSavingsGoal: (name, targetAmount, targetDate, category) => {
    set((state) => {
      const newGoal: SavingsGoal = {
        id: Date.now().toString(),
        name,
        targetAmount,
        currentSavings: 0,
        targetDate,
        category
      };
      
      const updatedGoals = [...state.savingsGoals, newGoal];
      const nextSavingScore = Math.min(100, state.savingScore + 5);

      return {
        savingsGoals: updatedGoals,
        savingScore: nextSavingScore,
        xp: state.xp + 15 // +15 XP for planning savings goals
      };
    });
  },

  // Contribute money to savings goal
  contributeToSavingsGoal: (goalId, amount) => {
    let success = false;
    set((state) => {
      // Check remaining budget cash
      const totalSpent = state.loggedExpenses.reduce((sum, e) => sum + e.amount, 0);
      const budgetRemaining = state.totalBudget - totalSpent;
      const totalSavingsContribution = state.savingsGoals.reduce((sum, g) => sum + g.currentSavings, 0);
      
      // Leftover cash available in budget
      const budgetLeftover = budgetRemaining - totalSavingsContribution - state.virtualBalance;
      
      if (amount > budgetLeftover) {
        // Cannot contribute more than leftover budget cash
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

      // Update saving subscore based on goal completion ratio
      const totalTarget = updatedGoals.reduce((sum, g) => sum + g.targetAmount, 0);
      const totalCurrent = updatedGoals.reduce((sum, g) => sum + g.currentSavings, 0);
      const savingsRatio = totalTarget > 0 ? (totalCurrent / totalTarget) : 0;
      const nextSavingScore = Math.round(40 + savingsRatio * 60); // 40 baseline + scale to 100

      let updatedAchievements = [...state.achievements];
      if (nextSavingScore >= 85 && !updatedAchievements.some(a => a.id === 'savings_strategist')) {
        const ach = ALL_ACHIEVEMENTS.find(a => a.id === 'savings_strategist');
        if (ach) updatedAchievements.push({ ...ach, unlockedAt: new Date().toISOString() });
      }

      return {
        savingsGoals: updatedGoals,
        savingScore: Math.min(100, nextSavingScore),
        achievements: updatedAchievements,
        xp: state.xp + 15 // +15 XP
      };
    });
    return success;
  },

  // Allocate leftover budget cash to Investment Simulator
  setRiskProfile: (profile) => set({ riskProfile: profile }),

  sweepSpareChange: () => {
    set((state) => {
      const amount = state.spareChangeAccumulated;
      if (amount <= 0) return state;
      return {
        spareChangeAccumulated: 0,
        virtualBalance: state.virtualBalance + amount,
        xp: state.xp + 10 // XP for sweeping spare change to invest
      };
    });
  },

  allocateToSimulation: (amount) => {
    let success = false;
    set((state) => {
      const totalSpent = state.loggedExpenses.reduce((sum, e) => sum + e.amount, 0);
      const budgetRemaining = state.totalBudget - totalSpent;
      const totalSavingsContribution = state.savingsGoals.reduce((sum, g) => sum + g.currentSavings, 0);
      
      // Cash available to transfer to simulation
      const availableToTransfer = budgetRemaining - totalSavingsContribution - state.virtualBalance;

      if (amount > availableToTransfer) {
        return state;
      }

      success = true;
      return {
        virtualBalance: state.virtualBalance + amount,
        xp: state.xp + 10 // XP for taking steps to invest
      };
    });
    return success;
  },

  // Allocate funds to specific assets in simulation lab (Buy / Sell)
  tradeAssetSim: (ticker, type, qty, price) => {
    let success = false;
    set((state) => {
      const totalCost = qty * price;
      const currentOwned = state.portfolioAllocations[ticker] || 0;

      if (type === 'buy') {
        if (totalCost > state.virtualBalance) {
          return state; // Insufficient cash inside Investment Lab
        }
        
        success = true;
        const newAllocations = {
          ...state.portfolioAllocations,
          [ticker]: currentOwned + qty
        };

        const nextInvestingScore = Math.min(100, state.investingScore + 10);
        let updatedAchievements = [...state.achievements];
        if (!updatedAchievements.some(a => a.id === 'invest_graduate')) {
          const ach = ALL_ACHIEVEMENTS.find(a => a.id === 'invest_graduate');
          if (ach) updatedAchievements.push({ ...ach, unlockedAt: new Date().toISOString() });
        }

        return {
          virtualBalance: state.virtualBalance - totalCost,
          portfolioAllocations: newAllocations,
          investingScore: nextInvestingScore,
          achievements: updatedAchievements,
          xp: state.xp + 15
        };
      } else {
        if (qty > currentOwned) {
          return state; // Insufficient units owned
        }

        success = true;
        const newAllocations = {
          ...state.portfolioAllocations,
          [ticker]: currentOwned - qty
        };

        if (newAllocations[ticker] === 0) {
          delete newAllocations[ticker];
        }

        return {
          virtualBalance: state.virtualBalance + totalCost,
          portfolioAllocations: newAllocations,
          xp: state.xp + 10
        };
      }
    });
    return success;
  },

  completeLesson: (moduleName) => {
    set((state) => {
      const nextLearningScore = Math.min(100, state.learningScore + 11); // 9 levels, ~11% each
      
      let updatedAchievements = [...state.achievements];
      if (!updatedAchievements.some(a => a.id === 'first_lesson')) {
        const ach = ALL_ACHIEVEMENTS.find(a => a.id === 'first_lesson');
        if (ach) updatedAchievements.push({ ...ach, unlockedAt: new Date().toISOString() });
      }

      if (moduleName.toLowerCase().includes('emergency') && !updatedAchievements.some(a => a.id === 'emergency_fund_planner')) {
        const ach = ALL_ACHIEVEMENTS.find(a => a.id === 'emergency_fund_planner');
        if (ach) updatedAchievements.push({ ...ach, unlockedAt: new Date().toISOString() });
      }

      if (nextLearningScore >= 80 && !updatedAchievements.some(a => a.id === 'financial_explorer')) {
        const ach = ALL_ACHIEVEMENTS.find(a => a.id === 'financial_explorer');
        if (ach) updatedAchievements.push({ ...ach, unlockedAt: new Date().toISOString() });
      }

      const completedLessons = state.completedLessons.includes(moduleName)
        ? state.completedLessons
        : [...state.completedLessons, moduleName];

      return {
        learningScore: nextLearningScore,
        achievements: updatedAchievements,
        completedLessons,
        xp: state.xp + 50 // completing a lesson rewards 50 XP
      };
    });
  },

  setCustomAvatar: (avatar) => {
    set((state) => {
      let updatedAchievements = [...state.achievements];
      if (avatar === 'Financial Strategist' && !updatedAchievements.some(a => a.id === 'savings_strategist')) {
        const ach = ALL_ACHIEVEMENTS.find(a => a.id === 'savings_strategist');
        if (ach) updatedAchievements.push({ ...ach, unlockedAt: new Date().toISOString() });
      }

      return {
        customAvatar: avatar,
        xp: state.xp + 10
      };
    });
  },

  getFinancialHealthScore: () => {
    const state = get();
    // If budget is not setup, base score is low
    if (!state.isBudgetSetupComplete) return 25;
    
    return Math.round((state.budgetingScore + state.learningScore + state.savingScore + state.investingScore) / 4);
  }
}));

const GAMIFICATION_STATE_KEY = 'cbudget_gamification_state';

const hydrateGamificationState = async () => {
  try {
    const rawState = await sqliteStorage.getItem(GAMIFICATION_STATE_KEY);
    if (!rawState) return;

    const savedState = JSON.parse(rawState) as Partial<GamificationState>;
    useGamificationStore.setState(savedState);
  } catch (error) {
    console.error('Failed to hydrate gamification state:', error);
  }
};

void hydrateGamificationState();

useGamificationStore.subscribe((state) => {
  void sqliteStorage.setItem(GAMIFICATION_STATE_KEY, JSON.stringify(state));
});

useGamificationStore.subscribe((state) => {
  const user = useAuthStore.getState().user;
  void syncStructuredStateToStorage(
    user
      ? { id: user.id, email: user.email, isPremium: useAuthStore.getState().isPremium }
      : null,
    state,
  );
});
