/**
 * Budget Domain Store
 * Clean Architecture Facade mapping to the unified Gamification & Budget state.
 */
import { useGamificationStore, Expense, CycleMetrics, getCycleMetrics } from './gamificationStore';

export type { Expense, CycleMetrics };

export interface BudgetStoreState {
  isBudgetSetupComplete: boolean;
  budgetType: 'daily' | 'weekly' | 'monthly' | null;
  totalBudget: number;
  selectedCategories: string[];
  categoryLimits: Record<string, number>;
  loggedExpenses: Expense[];
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
  getCycleMetrics: () => CycleMetrics;
}

/**
 * Hook to access the Budget Domain state and actions.
 */
export function useBudgetStore(): BudgetStoreState;
export function useBudgetStore<T>(selector: (state: BudgetStoreState) => T): T;
export function useBudgetStore<T>(selector?: (state: BudgetStoreState) => T): T | BudgetStoreState {
  return useGamificationStore((state) => {
    const budgetState: BudgetStoreState = {
      isBudgetSetupComplete: state.isBudgetSetupComplete,
      budgetType: state.budgetType,
      totalBudget: state.totalBudget,
      selectedCategories: state.selectedCategories,
      categoryLimits: state.categoryLimits,
      loggedExpenses: state.loggedExpenses,
      setupBudget: state.setupBudget,
      setBudgetType: state.setBudgetType,
      addExpense: state.addExpense,
      editExpense: state.editExpense,
      deleteExpense: state.deleteExpense,
      addIncome: state.addIncome,
      resetBudget: state.resetBudget,
      getCycleMetrics: () =>
        getCycleMetrics({
          totalBudget: state.totalBudget,
          budgetType: state.budgetType,
          loggedExpenses: state.loggedExpenses,
        }),
    };

    return selector ? selector(budgetState) : budgetState;
  });
}
