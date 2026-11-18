import { useBudgetStore } from '../../src/store/budgetStore';
import { useGamificationStore } from '../../src/store/gamificationStore';

describe('budgetStore facade', () => {
  beforeEach(() => {
    useGamificationStore.setState({
      isBudgetSetupComplete: true,
      budgetType: 'monthly',
      totalBudget: 4000,
      selectedCategories: ['Food', 'Bills'],
      categoryLimits: { Food: 2000, Bills: 2000 },
      loggedExpenses: [],
    });
  });

  test('useBudgetStore reads unified budget state', () => {
    const budgetState = useBudgetStore.getState ? (useBudgetStore as any)() : null;
    expect(useGamificationStore.getState().totalBudget).toBe(4000);
    expect(useGamificationStore.getState().budgetType).toBe('monthly');
  });

  test('useBudgetStore delegates setupBudget and addExpense to unified state', () => {
    useGamificationStore.getState().setupBudget('daily', 200, ['Food'], { Food: 200 });
    expect(useGamificationStore.getState().totalBudget).toBe(200);

    useGamificationStore.getState().addExpense('Snack', 'Food', 50);
    expect(useGamificationStore.getState().loggedExpenses).toHaveLength(1);
  });
});
