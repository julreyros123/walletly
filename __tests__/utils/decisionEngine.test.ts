import {
  BUDGET_STATUS,
  computeCategoryShares,
  computeInvestmentAllocation,
  evaluateBudget,
  matchAffordableInvestments,
  runDecisionSupportEngine,
  simulateInvestmentReplay,
} from '../../src/utils/decisionEngine';
import { ASSET_DATA } from '../../src/constants/assets';
import * as finnhubApi from '../../src/services/finnhubApi';
import {
  advanceRecurringDate,
  DEFAULT_GAMIFICATION_DATA,
  useGamificationStore,
} from '../../src/store/gamificationStore';

describe('RB-PFDSE Decision Engine & Capstone Equations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useGamificationStore.setState({
      ...DEFAULT_GAMIFICATION_DATA,
      isBudgetSetupComplete: true,
      budgetType: 'monthly',
      totalBudget: 3000,
      loggedExpenses: [],
      recurringSchedules: [],
    });
  });

  describe('Equation 1 & Algorithm 1: evaluateBudget (Table 5 Scenarios)', () => {
    test('evaluateBudget non-positive budget returns Set a valid budget', () => {
      const zeroRes = evaluateBudget(0, [100, 200]);
      expect(zeroRes.isValidBudget).toBe(false);
      expect(zeroRes.status).toBe(BUDGET_STATUS.INVALID);

      const negRes = evaluateBudget(-500, 100);
      expect(negRes.isValidBudget).toBe(false);
      expect(negRes.status).toBe(BUDGET_STATUS.INVALID);
    });

    test('evaluateBudget BUD_001 (B=5000, TE=5300) classifies Overspending with RB=-300 and BU=106%', () => {
      const res = evaluateBudget(5000, [1500, 800, 1000, 500, 1500]);
      expect(res.totalExpenses).toBe(5300);
      expect(res.remainingBudget).toBe(-300);
      expect(res.budgetUtilization).toBe(106);
      expect(res.status).toBe(BUDGET_STATUS.OVERSPENDING);
    });

    test('evaluateBudget BUD_002 (B=2000, TE=1750) classifies Warning with RB=250 and BU=87.5%', () => {
      const res = evaluateBudget(2000, 1750);
      expect(res.remainingBudget).toBe(250);
      expect(res.budgetUtilization).toBe(87.5);
      expect(res.status).toBe(BUDGET_STATUS.WARNING);
    });

    test('evaluateBudget BUD_003 (B=1000, TE=600) classifies Within Budget with RB=400 and BU=60%', () => {
      const res = evaluateBudget(1000, 600);
      expect(res.remainingBudget).toBe(400);
      expect(res.budgetUtilization).toBe(60);
      expect(res.status).toBe(BUDGET_STATUS.WITHIN_BUDGET);
    });

    test('evaluateBudget BUD_004 boundary 100% (B=2000, TE=2000) classifies Warning (not Overspending)', () => {
      const res = evaluateBudget(2000, 2000);
      expect(res.remainingBudget).toBe(0);
      expect(res.budgetUtilization).toBe(100);
      expect(res.status).toBe(BUDGET_STATUS.WARNING);
    });

    test('evaluateBudget exact 80% threshold (B=1500, TE=1200) classifies Warning', () => {
      const res = evaluateBudget(1500, 1200);
      expect(res.remainingBudget).toBe(300);
      expect(res.budgetUtilization).toBe(80);
      expect(res.status).toBe(BUDGET_STATUS.WARNING);
    });

    test('evaluateBudget zero expenses (B=3000, TE=0) classifies Within Budget with BU=0%', () => {
      const res = evaluateBudget(3000, []);
      expect(res.remainingBudget).toBe(3000);
      expect(res.budgetUtilization).toBe(0);
      expect(res.status).toBe(BUDGET_STATUS.WITHIN_BUDGET);
    });
  });

  describe('Equation 2 & Algorithm 2: computeInvestmentAllocation (Table 6 Scenarios)', () => {
    test('computeInvestmentAllocation Within Budget (RB=400, P=20%) recommends IA=80', () => {
      const res = computeInvestmentAllocation(BUDGET_STATUS.WITHIN_BUDGET, 400, 0.2);
      expect(res.isGated).toBe(false);
      expect(res.recommendationType).toBe('invest');
      expect(res.recommendedAllocation).toBe(80);
    });

    test('computeInvestmentAllocation Warning (RB=250) gates IA to 0', () => {
      const res = computeInvestmentAllocation(BUDGET_STATUS.WARNING, 250, 0.2);
      expect(res.isGated).toBe(true);
      expect(res.recommendationType).toBe('no_investment');
      expect(res.recommendedAllocation).toBe(0);
    });

    test('computeInvestmentAllocation Overspending (RB=-300) gates IA to 0', () => {
      const res = computeInvestmentAllocation(BUDGET_STATUS.OVERSPENDING, -300, 0.2);
      expect(res.isGated).toBe(true);
      expect(res.recommendedAllocation).toBe(0);
      expect(res.message).toContain('overspending');
    });
  });

  describe('Finnhub Investment Matching (Table 5)', () => {
    const assetsList = Object.values(ASSET_DATA);

    test('matchAffordableInvestments BUD_003 (IA=80) matches LITE at ₱50.00', () => {
      const match = matchAffordableInvestments(BUDGET_STATUS.WITHIN_BUDGET, 80, assetsList);
      expect(match.isGated).toBe(false);
      expect(match.closestMatch?.ticker).toBe('LITE');
      expect(match.closestMatch?.price).toBeLessThanOrEqual(80);
    });

    test('matchAffordableInvestments BUD_005 (B=3000, TE=1200 -> IA=360) finds closest match <= 360', () => {
      const pipeline = runDecisionSupportEngine({
        budget: 3000,
        expenses: 1200,
        assets: assetsList,
      });
      expect(pipeline.allocation.recommendedAllocation).toBe(360);
      expect(pipeline.matching.closestMatch?.ticker).toBe('VOLT');
      expect(pipeline.matching.closestMatch?.price).toBe(345.5);
    });

    test('matchAffordableInvestments gated status returns None (gated)', () => {
      const match = matchAffordableInvestments(BUDGET_STATUS.WARNING, 0, assetsList);
      expect(match.isGated).toBe(true);
      expect(match.matchedAssets).toHaveLength(0);
      expect(match.summaryLabel).toBe('None (gated)');
    });
  });

  describe('Equation 3: computeCategoryShares (Table 7)', () => {
    test('computeCategoryShares calculates exact category shares summing to 100%', () => {
      const result = computeCategoryShares(
        [
          { category: 'Food', amount: 1200, type: 'expense' },
          { category: 'Transport', amount: 600, type: 'expense' },
          { category: 'Load/Data', amount: 300, type: 'expense' },
          { category: 'School', amount: 400, type: 'expense' },
          { category: 'Others', amount: 500, type: 'expense' },
          { category: 'Allowance', amount: 5000, type: 'income' }, // ignored in expense shares
        ],
        { Food: 1500, Transport: 500 }
      );

      expect(result.totalExpenses).toBe(3000);
      const food = result.categories.find((c) => c.category === 'Food');
      const transport = result.categories.find((c) => c.category === 'Transport');

      expect(food?.sharePercent).toBe(40);
      expect(food?.status).toBe(BUDGET_STATUS.WARNING); // 1200 / 1500 = 80%
      expect(transport?.sharePercent).toBe(20);
      expect(transport?.status).toBe(BUDGET_STATUS.OVERSPENDING); // 600 > 500
    });
  });

  describe('Equation 4: simulateInvestmentReplay (Table 8 & Finnhub History)', () => {
    test('simulateInvestmentReplay reproduces Table 8 (I0=1000, P0=50, N=20) to exact centavos', () => {
      const sim = simulateInvestmentReplay(
        1000,
        50,
        [2.0, -1.5, 3.0, -4.5, -1.0],
        5
      );

      expect(sim.shares).toBe(20);
      expect(sim.steps).toHaveLength(6); // Day 0 .. Day 5

      expect(sim.steps[0]).toEqual({
        day: 0,
        pctChange: null,
        simulatedPrice: 50.0,
        value: 1000.0,
        gainLoss: 0,
      });
      expect(sim.steps[1]).toEqual({
        day: 1,
        pctChange: 2.0,
        simulatedPrice: 51.0,
        value: 1020.0,
        gainLoss: 20.0,
      });
      expect(sim.steps[2]).toEqual({
        day: 2,
        pctChange: -1.5,
        simulatedPrice: 50.24,
        value: 1004.7,
        gainLoss: 4.7,
      });
      expect(sim.steps[3]).toEqual({
        day: 3,
        pctChange: 3.0,
        simulatedPrice: 51.74,
        value: 1034.84,
        gainLoss: 34.84,
      });
      expect(sim.steps[4]).toEqual({
        day: 4,
        pctChange: -4.5,
        simulatedPrice: 49.41,
        value: 988.27,
        gainLoss: -11.73,
      });
      expect(sim.steps[5]).toEqual({
        day: 5,
        pctChange: -1.0,
        simulatedPrice: 48.92,
        value: 978.39,
        gainLoss: -21.61,
      });
    });

    test('getAssetReplayHistory parses Finnhub candles when online and falls back to bundled sample offline', async () => {
      jest.spyOn(finnhubApi, 'getFinnhubApiKey').mockReturnValue('test_key');
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          s: 'ok',
          c: [100, 102, 99.96],
          t: [1700000000, 1700086400, 1700172800],
        }),
      } as unknown as Response);

      const live = await finnhubApi.getAssetReplayHistory('NOVA', true);
      expect(live.source).toBe('finnhub_live');
      expect(live.changes).toEqual([2, -2]);

      jest.spyOn(finnhubApi, 'getFinnhubApiKey').mockReturnValue(null);
      const fallback = await finnhubApi.getAssetReplayHistory('SOLR', false);
      expect(fallback.changes.length).toBeGreaterThan(0);
    });
  });

  describe('Automated Recurring Income & Expense Scheduling', () => {
    test('advanceRecurringDate handles daily, weekly, and month-end clamping', () => {
      expect(advanceRecurringDate('2026-04-10', 'daily')).toBe('2026-04-11');
      expect(advanceRecurringDate('2026-04-10', 'weekly')).toBe('2026-04-17');
      expect(advanceRecurringDate('2026-01-31', 'monthly')).toBe('2026-02-28');
    });

    test('addRecurringSchedule auto-generates due transaction and advances nextDueDate', () => {
      const store = useGamificationStore.getState();
      const created = store.addRecurringSchedule({
        name: 'Weekly Baon Allowance',
        category: 'Allowance',
        amount: 1000,
        type: 'income',
        frequency: 'weekly',
        nextDueDate: '2026-01-01',
      });

      const updated = useGamificationStore.getState();
      expect(updated.recurringSchedules).toHaveLength(1);
      expect(updated.loggedExpenses.length).toBeGreaterThan(0);
      expect(updated.loggedExpenses[0].name).toBe('Weekly Baon Allowance');
      expect(updated.loggedExpenses[0].type).toBe('income');

      // Pause and delete schedule
      updated.toggleRecurringSchedule(created.id);
      expect(useGamificationStore.getState().recurringSchedules[0].isActive).toBe(false);

      updated.deleteRecurringSchedule(created.id);
      expect(useGamificationStore.getState().recurringSchedules).toHaveLength(0);
    });
  });
});
