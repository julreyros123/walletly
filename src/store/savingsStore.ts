/**
 * Savings Domain Store
 * Clean Architecture Facade mapping to the unified Gamification & Savings state.
 */
import {
  useGamificationStore,
  SavingsGoal,
  SavingsRecord,
} from './gamificationStore';

export type { SavingsGoal, SavingsRecord };

export interface SavingsStoreState {
  savingsGoals: SavingsGoal[];
  unspentSavingsVault: number;
  savingsRecords: SavingsRecord[];
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
}

/**
 * Hook to access the Savings Domain state and actions.
 */
export function useSavingsStore(): SavingsStoreState;
export function useSavingsStore<T>(selector: (state: SavingsStoreState) => T): T;
export function useSavingsStore<T>(selector?: (state: SavingsStoreState) => T): T | SavingsStoreState {
  return useGamificationStore((state) => {
    const savingsState: SavingsStoreState = {
      savingsGoals: state.savingsGoals,
      unspentSavingsVault: state.unspentSavingsVault,
      savingsRecords: state.savingsRecords,
      addSavingsGoal: state.addSavingsGoal,
      updateSavingsGoal: state.updateSavingsGoal,
      contributeToSavingsGoal: state.contributeToSavingsGoal,
      withdrawSavingsGoal: state.withdrawSavingsGoal,
      deleteSavingsGoal: state.deleteSavingsGoal,
      allocateUnspentSavings: state.allocateUnspentSavings,
      withdrawUnspentSavings: state.withdrawUnspentSavings,
    };

    return selector ? selector(savingsState) : savingsState;
  });
}
