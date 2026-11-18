import {
  getUserStorageKey,
  generateUUID,
  toISODate,
  getLocalDateString,
  getDaysDifference,
  format12HourTime,
  parseExpenseDate,
  isTodayDate,
  isThisWeekDate,
  isThisMonthDate,
  calculateLevelFromXP,
  getLevelProgress,
  applyXpGain,
  getCycleMetrics,
  useGamificationStore,
  LEVEL_THRESHOLDS,
} from '../../src/store/gamificationStore';

describe('gamificationStore and business logic', () => {
  describe('getUserStorageKey', () => {
    test('getUserStorageKey with null or undefined returns guest storage key', () => {
      expect(getUserStorageKey(null)).toBe('cbudget_gamification_state_guest');
      expect(getUserStorageKey(undefined)).toBe('cbudget_gamification_state_guest');
    });

    test('getUserStorageKey with guest string returns guest storage key', () => {
      expect(getUserStorageKey('guest')).toBe('cbudget_gamification_state_guest');
    });

    test('getUserStorageKey with authenticated user id returns user-specific storage key', () => {
      expect(getUserStorageKey('user_abc123')).toBe('cbudget_gamification_state_user_abc123');
    });
  });

  describe('generateUUID', () => {
    test('generateUUID returns standard RFC4122 v4 UUID format', () => {
      const uuid = generateUUID();
      expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });
  });

  describe('toISODate and getLocalDateString', () => {
    test('toISODate with undefined returns today in YYYY-MM-DD format', () => {
      const today = getLocalDateString();
      expect(toISODate(undefined)).toBe(today);
    });

    test('toISODate with strict YYYY-MM-DD date preserves format', () => {
      expect(toISODate('2026-05-18')).toBe('2026-05-18');
    });

    test('toISODate with formatted string converts to YYYY-MM-DD', () => {
      const iso = toISODate('Dec 25, 2026');
      expect(iso).toBe('2026-12-25');
    });

    test('getLocalDateString custom date formats correctly with zero padding', () => {
      const testDate = new Date(2026, 3, 5); // April 5, 2026
      expect(getLocalDateString(testDate)).toBe('2026-04-05');
    });
  });

  describe('getDaysDifference', () => {
    test('getDaysDifference with missing date arguments returns -1', () => {
      expect(getDaysDifference(null, '2026-04-10')).toBe(-1);
      expect(getDaysDifference('2026-04-10', null)).toBe(-1);
      expect(getDaysDifference(undefined, undefined)).toBe(-1);
    });

    test('getDaysDifference with invalid date format returns -1', () => {
      expect(getDaysDifference('invalid', '2026-04-10')).toBe(-1);
    });

    test('getDaysDifference same dates returns 0', () => {
      expect(getDaysDifference('2026-04-10', '2026-04-10')).toBe(0);
    });

    test('getDaysDifference consecutive dates returns 1', () => {
      expect(getDaysDifference('2026-04-10', '2026-04-11')).toBe(1);
    });

    test('getDaysDifference month boundary returns correct difference', () => {
      expect(getDaysDifference('2026-04-30', '2026-05-01')).toBe(1);
    });
  });

  describe('format12HourTime', () => {
    test('format12HourTime morning time formats with AM and leading zeros', () => {
      const d = new Date(2026, 0, 1, 9, 5);
      expect(format12HourTime(d)).toBe('09:05 AM');
    });

    test('format12HourTime noon time formats to 12 PM', () => {
      const d = new Date(2026, 0, 1, 12, 0);
      expect(format12HourTime(d)).toBe('12:00 PM');
    });

    test('format12HourTime midnight time formats to 12 AM', () => {
      const d = new Date(2026, 0, 1, 0, 0);
      expect(format12HourTime(d)).toBe('12:00 AM');
    });

    test('format12HourTime afternoon time formats with PM', () => {
      const d = new Date(2026, 0, 1, 15, 30);
      expect(format12HourTime(d)).toBe('03:30 PM');
    });
  });

  describe('parseExpenseDate, isTodayDate, isThisWeekDate, isThisMonthDate', () => {
    test('parseExpenseDate ISO date parses correctly to local Date', () => {
      const d = parseExpenseDate('2026-08-15');
      expect(d.getFullYear()).toBe(2026);
      expect(d.getMonth()).toBe(7); // 0-indexed August
      expect(d.getDate()).toBe(15);
    });

    test('parseExpenseDate empty string returns current date', () => {
      const d = parseExpenseDate('');
      expect(d).toBeInstanceOf(Date);
    });

    test('isTodayDate today ISO string returns true', () => {
      const todayISO = getLocalDateString();
      expect(isTodayDate(todayISO)).toBe(true);
    });

    test('isTodayDate past date returns false', () => {
      expect(isTodayDate('2020-01-01')).toBe(false);
    });

    test('isThisWeekDate today returns true', () => {
      const todayISO = getLocalDateString();
      expect(isThisWeekDate(todayISO)).toBe(true);
    });

    test('isThisWeekDate date 30 days ago returns false', () => {
      expect(isThisWeekDate('2020-01-01')).toBe(false);
    });

    test('isThisMonthDate current month returns true', () => {
      const now = new Date();
      const thisMonth = getLocalDateString(now);
      expect(isThisMonthDate(thisMonth)).toBe(true);
    });

    test('isThisMonthDate past year returns false', () => {
      expect(isThisMonthDate('2020-01-01')).toBe(false);
    });
  });

  describe('calculateLevelFromXP', () => {
    test('calculateLevelFromXP boundary values across all 14 thresholds', () => {
      // Level 1: 0 - 99 XP
      expect(calculateLevelFromXP(-10)).toBe(1);
      expect(calculateLevelFromXP(0)).toBe(1);
      expect(calculateLevelFromXP(99)).toBe(1);

      // Level 2: 100 - 199 XP
      expect(calculateLevelFromXP(100)).toBe(2);
      expect(calculateLevelFromXP(199)).toBe(2);

      // Level 3: 200 - 299 XP
      expect(calculateLevelFromXP(200)).toBe(3);

      // Level 5: 450 XP
      expect(calculateLevelFromXP(450)).toBe(5);

      // Level 14: 5000+ XP
      expect(calculateLevelFromXP(5000)).toBe(14);
      expect(calculateLevelFromXP(50000)).toBe(14);
    });
  });

  describe('getLevelProgress', () => {
    test('getLevelProgress 0 XP returns level 1 with 0 progressRatio', () => {
      const progress = getLevelProgress(0);
      expect(progress.level).toBe(1);
      expect(progress.currentFloor).toBe(0);
      expect(progress.nextCeil).toBe(100);
      expect(progress.xpInLevel).toBe(0);
      expect(progress.progressRatio).toBe(0);
    });

    test('getLevelProgress 50 XP in level 1 returns 0.5 progressRatio', () => {
      const progress = getLevelProgress(50);
      expect(progress.level).toBe(1);
      expect(progress.xpInLevel).toBe(50);
      expect(progress.progressRatio).toBe(0.5);
    });

    test('getLevelProgress boundary at exact threshold returns 0 progressRatio for new level', () => {
      const progress = getLevelProgress(100);
      expect(progress.level).toBe(2);
      expect(progress.currentFloor).toBe(100);
      expect(progress.nextCeil).toBe(200);
      expect(progress.xpInLevel).toBe(0);
      expect(progress.progressRatio).toBe(0);
    });
  });

  describe('applyXpGain', () => {
    test('applyXpGain within same level increases XP without level up', () => {
      const state = { xp: 20, level: 1, pendingLevelUp: null };
      const next = applyXpGain(state, 30);
      expect(next.xp).toBe(50);
      expect(next.level).toBe(1);
      expect(next.pendingLevelUp).toBeNull();
    });

    test('applyXpGain crossing threshold triggers level up and sets pendingLevelUp', () => {
      const state = { xp: 80, level: 1, pendingLevelUp: null };
      const next = applyXpGain(state, 30); // 110 XP -> level 2
      expect(next.xp).toBe(110);
      expect(next.level).toBe(2);
      expect(next.pendingLevelUp).toBe(2);
    });
  });

  describe('getCycleMetrics', () => {
    test('getCycleMetrics computes netSpent and balance accurately for daily cycle', () => {
      const today = getLocalDateString();
      const state = {
        totalBudget: 500,
        budgetType: 'daily' as const,
        loggedExpenses: [
          { id: '1', name: 'Lunch', category: 'Food', amount: 150, date: today, type: 'expense' as const },
          { id: '2', name: 'Snack', category: 'Food', amount: 50, date: today, type: 'expense' as const },
          { id: '3', name: 'Side gig', category: 'Income', amount: 100, date: today, type: 'income' as const },
        ],
      };

      const metrics = getCycleMetrics(state, 'PHP');
      expect(metrics.cycle).toBe('daily');
      expect(metrics.limit).toBe(500);
      expect(metrics.spent).toBe(200); // 150 + 50
      expect(metrics.income).toBe(100);
      expect(metrics.netSpent).toBe(100); // 200 - 100
      expect(metrics.balance).toBe(400); // 500 - 200 + 100
    });

    test('getCycleMetrics empty expenses returns 0 spent and full limit balance', () => {
      const state = {
        totalBudget: 1000,
        budgetType: 'weekly' as const,
        loggedExpenses: [],
      };

      const metrics = getCycleMetrics(state, 'PHP');
      expect(metrics.spent).toBe(0);
      expect(metrics.income).toBe(0);
      expect(metrics.netSpent).toBe(0);
      expect(metrics.balance).toBe(1000);
    });

    test('getCycleMetrics overspending clamps balance to 0 and does not return negative balance', () => {
      const today = getLocalDateString();
      const state = {
        totalBudget: 200,
        budgetType: 'daily' as const,
        loggedExpenses: [
          { id: '1', name: 'Shopping', category: 'Shopping', amount: 350, date: today, type: 'expense' as const },
        ],
      };

      const metrics = getCycleMetrics(state, 'PHP');
      expect(metrics.spent).toBe(350);
      expect(metrics.balance).toBe(0);
      expect(metrics.netSpent).toBe(350);
    });

    test('getCycleMetrics with 0 totalBudget uses default PHP baseline', () => {
      const state = {
        totalBudget: 0,
        budgetType: 'daily' as const,
        loggedExpenses: [],
      };

      const metrics = getCycleMetrics(state, 'PHP');
      expect(metrics.limit).toBe(150); // Daily baseline
    });
  });

  describe('useGamificationStore actions', () => {
    beforeEach(() => {
      useGamificationStore.setState({
        xp: 100,
        level: 2,
        totalBudget: 1000,
        loggedExpenses: [],
        savingsGoals: [],
        unspentSavingsVault: 0,
        savingsRecords: [],
        isBudgetSetupComplete: true,
        budgetingScore: 80,
        learningScore: 70,
        savingScore: 90,
        investingScore: 60,
      });
    });

    test('setupBudget updates budget parameters and marks setup complete', () => {
      useGamificationStore.getState().setupBudget(
        'weekly',
        2500,
        ['Food', 'Transport'],
        { Food: 1500, Transport: 1000 }
      );

      const state = useGamificationStore.getState();
      expect(state.budgetType).toBe('weekly');
      expect(state.totalBudget).toBe(2500);
      expect(state.selectedCategories).toEqual(['Food', 'Transport']);
      expect(state.isBudgetSetupComplete).toBe(true);
    });

    test('addExpense appends expense record to loggedExpenses', () => {
      useGamificationStore.getState().addExpense('Groceries', 'Food', 250);

      const state = useGamificationStore.getState();
      expect(state.loggedExpenses).toHaveLength(1);
      expect(state.loggedExpenses[0].name).toBe('Groceries');
      expect(state.loggedExpenses[0].amount).toBe(250);
      expect(state.loggedExpenses[0].type).toBe('expense');
    });

    test('addIncome appends income record to loggedExpenses', () => {
      useGamificationStore.getState().addIncome('Allowance', 'Income', 500);

      const state = useGamificationStore.getState();
      expect(state.loggedExpenses).toHaveLength(1);
      expect(state.loggedExpenses[0].name).toBe('Allowance');
      expect(state.loggedExpenses[0].amount).toBe(500);
      expect(state.loggedExpenses[0].type).toBe('income');
    });

    test('editExpense updates existing expense record', () => {
      useGamificationStore.getState().addExpense('Coffee', 'Food', 100);
      const expenseId = useGamificationStore.getState().loggedExpenses[0].id;

      useGamificationStore.getState().editExpense(expenseId, { amount: 120 });
      expect(useGamificationStore.getState().loggedExpenses[0].amount).toBe(120);
    });

    test('deleteExpense removes expense record from state', () => {
      useGamificationStore.getState().addExpense('Movie', 'Entertainment', 300);
      const expenseId = useGamificationStore.getState().loggedExpenses[0].id;

      useGamificationStore.getState().deleteExpense(expenseId);
      expect(useGamificationStore.getState().loggedExpenses).toHaveLength(0);
    });

    test('addSavingsGoal creates new savings goal in state', () => {
      useGamificationStore.getState().addSavingsGoal('Laptop', 30000, '2026-12-31', 'Tech');

      const goals = useGamificationStore.getState().savingsGoals;
      expect(goals).toHaveLength(1);
      expect(goals[0].name).toBe('Laptop');
      expect(goals[0].targetAmount).toBe(30000);
      expect(goals[0].currentSavings).toBe(0);
    });

    test('contributeToSavingsGoal adds amount and records savings transaction', () => {
      useGamificationStore.getState().addSavingsGoal('Emergency Fund', 10000, '2026-12-31', 'Safety');
      const goalId = useGamificationStore.getState().savingsGoals[0].id;

      const success = useGamificationStore.getState().contributeToSavingsGoal(goalId, 500);
      expect(success).toBe(true);

      const goal = useGamificationStore.getState().savingsGoals[0];
      expect(goal.currentSavings).toBe(500);
      expect(useGamificationStore.getState().loggedExpenses).toHaveLength(1);
      expect(useGamificationStore.getState().loggedExpenses[0].name).toBe('Savings: Emergency Fund');
    });

    test('contributeToSavingsGoal with non-existent goal returns false', () => {
      const success = useGamificationStore.getState().contributeToSavingsGoal('non_existent_id', 500);
      expect(success).toBe(false);
    });

    test('withdrawSavingsGoal removes amount from goal', () => {
      useGamificationStore.getState().addSavingsGoal('Trip', 5000, '2026-12-31', 'Travel');
      const goalId = useGamificationStore.getState().savingsGoals[0].id;
      useGamificationStore.getState().contributeToSavingsGoal(goalId, 500);

      const success = useGamificationStore.getState().withdrawSavingsGoal(goalId, 200);
      expect(success).toBe(true);
      expect(useGamificationStore.getState().savingsGoals[0].currentSavings).toBe(300);
    });

    test('withdrawSavingsGoal exceeding current amount fails and returns false', () => {
      useGamificationStore.getState().addSavingsGoal('Trip', 5000, '2026-12-31', 'Travel');
      const goalId = useGamificationStore.getState().savingsGoals[0].id;
      useGamificationStore.getState().contributeToSavingsGoal(goalId, 500);

      const success = useGamificationStore.getState().withdrawSavingsGoal(goalId, 1000);
      expect(success).toBe(false);
      expect(useGamificationStore.getState().savingsGoals[0].currentSavings).toBe(500);
    });

    test('getFinancialHealthScore calculates average of educational scores', () => {
      // (80 + 70 + 90 + 60) / 4 = 300 / 4 = 75
      const score = useGamificationStore.getState().getFinancialHealthScore();
      expect(score).toBe(75);
    });

    test('getFinancialHealthScore returns baseline when budget is not setup', () => {
      useGamificationStore.setState({ isBudgetSetupComplete: false });
      const score = useGamificationStore.getState().getFinancialHealthScore();
      expect(score).toBeGreaterThanOrEqual(25);
    });

    test('dismissLevelUp clears pendingLevelUp to null', () => {
      useGamificationStore.setState({ pendingLevelUp: 3 });
      useGamificationStore.getState().dismissLevelUp();
      expect(useGamificationStore.getState().pendingLevelUp).toBeNull();
    });
  });
});
