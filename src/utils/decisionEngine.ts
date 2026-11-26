/**
 * CBudget Rule-Based Personal Financial Decision Support Engine (RB-PFDSE)
 *
 * Implements the deterministic, threshold-based IF-THEN production rules and
 * mathematical equations specified in Section 2.3.2 of the CBudget system design:
 *  - Equation 1 & Algorithm 1: Overspending Detection & 3-State Classification
 *  - Equation 2 & Algorithm 2: Gated Investment Allocation (default P = 20%)
 *  - Equation 3: Category Spending Share Function
 *  - Finnhub Market-Data Investment Matching (price <= IA)
 *  - Equation 4: Simulated Investment Value Function (historical % change replay)
 */

export const BUDGET_WARNING_THRESHOLD_PCT = 80;
export const DEFAULT_INVESTMENT_ALLOCATION_RATE = 0.2;

export const BUDGET_STATUS = {
  WITHIN_BUDGET: 'Within Budget',
  WARNING: 'Warning',
  OVERSPENDING: 'Overspending',
  INVALID: 'Set a valid budget',
} as const;

export type BudgetClassificationStatus =
  (typeof BUDGET_STATUS)[keyof typeof BUDGET_STATUS];

export type RecommendationActionType = 'invest' | 'no_investment';

export interface BudgetEvaluationResult {
  isValidBudget: boolean;
  budget: number;
  totalExpenses: number;
  remainingBudget: number;
  budgetUtilization: number;
  status: BudgetClassificationStatus;
  alertMessage: string;
}

export interface InvestmentAllocationResult {
  status: BudgetClassificationStatus;
  remainingBudget: number;
  allocationRate: number;
  recommendedAllocation: number;
  recommendationType: RecommendationActionType;
  isGated: boolean;
  message: string;
}

export interface CategoryExpenseInput {
  category: string;
  amount: number;
  type?: 'expense' | 'income';
}

export interface CategoryShareSummary {
  category: string;
  amount: number;
  sharePercent: number;
  limit?: number;
  utilizationPercent?: number;
  status: BudgetClassificationStatus;
}

export interface MatchableAsset {
  ticker: string;
  name: string;
  price: number;
  change: number;
  riskProfile: 'Conservative' | 'Moderate' | 'Aggressive';
}

export interface InvestmentMatchResult {
  isGated: boolean;
  recommendedAllocation: number;
  matchedAssets: MatchableAsset[];
  closestMatch: MatchableAsset | null;
  summaryLabel: string;
}

export interface SimulatedReplayStep {
  day: number;
  pctChange: number | null;
  simulatedPrice: number;
  value: number;
  gainLoss: number;
}

export interface SimulatedReplayResult {
  initialInvestment: number;
  startingPrice: number;
  shares: number;
  days: number;
  finalPrice: number;
  finalValue: number;
  totalGainLoss: number;
  totalReturnPct: number;
  steps: SimulatedReplayStep[];
}

export interface DecisionSupportSummary {
  evaluation: BudgetEvaluationResult;
  allocation: InvestmentAllocationResult;
  matching: InvestmentMatchResult;
}

function roundToTwo(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Equation 1 & Algorithm 1: Overspending Detection Algorithm
 *
 * Evaluates recorded expenses against user-allocated budget B:
 *  - If B <= 0 -> "Set a valid budget"
 *  - Rule 1: If TE > B -> "Overspending"
 *  - Rule 2: Else if BU >= 80% (and TE <= B) -> "Warning"
 *  - Rule 3: Else (BU < 80%) -> "Within Budget"
 */
export function evaluateBudget(
  budget: number,
  expensesInput: number | readonly number[],
  currencySymbol = '₱'
): BudgetEvaluationResult {
  const rawTotal = Array.isArray(expensesInput)
    ? expensesInput.reduce(
        (sum, val) => sum + (Number.isFinite(val) && val > 0 ? val : 0),
        0
      )
    : typeof expensesInput === 'number' && Number.isFinite(expensesInput) && expensesInput > 0
    ? expensesInput
    : 0;

  const totalExpenses = roundToTwo(rawTotal);

  if (!Number.isFinite(budget) || budget <= 0) {
    return {
      isValidBudget: false,
      budget: 0,
      totalExpenses,
      remainingBudget: 0,
      budgetUtilization: 0,
      status: BUDGET_STATUS.INVALID,
      alertMessage: 'Set a valid budget to classify your spending status.',
    };
  }

  const cleanBudget = roundToTwo(budget);
  const remainingBudget = roundToTwo(cleanBudget - totalExpenses);
  const budgetUtilization = roundToTwo((totalExpenses / cleanBudget) * 100);

  if (totalExpenses > cleanBudget) {
    const overAmount = roundToTwo(totalExpenses - cleanBudget);
    return {
      isValidBudget: true,
      budget: cleanBudget,
      totalExpenses,
      remainingBudget,
      budgetUtilization,
      status: BUDGET_STATUS.OVERSPENDING,
      alertMessage: `Overspending detected: Exceeded budget by ${currencySymbol}${overAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${budgetUtilization.toFixed(1)}%).`,
    };
  }

  if (budgetUtilization >= BUDGET_WARNING_THRESHOLD_PCT) {
    return {
      isValidBudget: true,
      budget: cleanBudget,
      totalExpenses,
      remainingBudget,
      budgetUtilization,
      status: BUDGET_STATUS.WARNING,
      alertMessage: `Budget warning: You have used ${budgetUtilization.toFixed(1)}% of your budget (${currencySymbol}${remainingBudget.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} left).`,
    };
  }

  return {
    isValidBudget: true,
    budget: cleanBudget,
    totalExpenses,
    remainingBudget,
    budgetUtilization,
    status: BUDGET_STATUS.WITHIN_BUDGET,
    alertMessage: `Within budget: ${budgetUtilization.toFixed(1)}% used with ${currencySymbol}${remainingBudget.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} remaining.`,
  };
}

/**
 * Equation 2 & Algorithm 2: Investment Allocation Algorithm
 *
 * Gated rule-based investment allocation:
 *  - Rule 4: If Status === "Within Budget", IA = RB * P (default P = 0.20)
 *  - Rule 5: If Status === "Warning" or "Overspending" (or invalid), IA = 0
 */
export function computeInvestmentAllocation(
  status: BudgetClassificationStatus,
  remainingBudget: number,
  allocationRate: number = DEFAULT_INVESTMENT_ALLOCATION_RATE,
  currencySymbol = '₱'
): InvestmentAllocationResult {
  const safeRate =
    Number.isFinite(allocationRate) && allocationRate > 0 && allocationRate <= 1
      ? allocationRate
      : DEFAULT_INVESTMENT_ALLOCATION_RATE;
  const safeRemaining = Number.isFinite(remainingBudget) ? roundToTwo(remainingBudget) : 0;

  if (status === BUDGET_STATUS.WITHIN_BUDGET && safeRemaining > 0) {
    const recommendedAllocation = roundToTwo(safeRemaining * safeRate);
    return {
      status,
      remainingBudget: safeRemaining,
      allocationRate: safeRate,
      recommendedAllocation,
      recommendationType: 'invest',
      isGated: false,
      message: `You have ${currencySymbol}${recommendedAllocation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} available to invest this period.`,
    };
  }

  let message = 'Focus on reducing overspending before investing.';
  if (status === BUDGET_STATUS.WARNING) {
    message =
      'Near your budget limit (80%+ used). Hold off on investing to protect your remaining allowance.';
  } else if (status === BUDGET_STATUS.INVALID) {
    message = 'Set a valid budget first to unlock rule-based investment guidance.';
  } else if (status === BUDGET_STATUS.WITHIN_BUDGET && safeRemaining <= 0) {
    message = 'No remaining budget left to allocate for investment this period.';
  }

  return {
    status,
    remainingBudget: safeRemaining,
    allocationRate: safeRate,
    recommendedAllocation: 0,
    recommendationType: 'no_investment',
    isGated: true,
    message,
  };
}

/**
 * Equation 3: Category Spending Share Function
 *
 * Computes C_k = sum(E_i in category k) and Share_k = (C_k / TE) * 100,
 * plus per-category rule-based status when category limits are configured.
 */
export function computeCategoryShares(
  records: readonly CategoryExpenseInput[],
  categoryLimits: Record<string, number> = {},
  currencySymbol = '₱'
): { totalExpenses: number; categories: CategoryShareSummary[] } {
  const categoryTotals: Record<string, number> = {};

  for (const item of records) {
    if (item.type === 'income') continue;
    if (!Number.isFinite(item.amount) || item.amount <= 0) continue;
    const cat = item.category?.trim() || 'Others';
    categoryTotals[cat] = (categoryTotals[cat] || 0) + item.amount;
  }

  const totalExpenses = roundToTwo(
    Object.values(categoryTotals).reduce((sum, val) => sum + val, 0)
  );

  const categories: CategoryShareSummary[] = Object.entries(categoryTotals)
    .map(([category, rawAmount]) => {
      const amount = roundToTwo(rawAmount);
      const sharePercent = totalExpenses > 0 ? roundToTwo((amount / totalExpenses) * 100) : 0;
      const limit = categoryLimits[category];

      if (typeof limit === 'number' && limit > 0) {
        const evalRes = evaluateBudget(limit, amount, currencySymbol);
        return {
          category,
          amount,
          sharePercent,
          limit,
          utilizationPercent: evalRes.budgetUtilization,
          status: evalRes.status,
        };
      }

      return {
        category,
        amount,
        sharePercent,
        status: BUDGET_STATUS.WITHIN_BUDGET,
      };
    })
    .sort((a, b) => b.amount - a.amount);

  return { totalExpenses, categories };
}

/**
 * Section 2.3.2.4 & Table 5: Finnhub Market-Data Investment Matching
 *
 * Matches instruments whose current price per share (in active currency / PHP)
 * is <= recommendedAllocation IA, sorted with closest match <= IA first.
 */
export function matchAffordableInvestments(
  status: BudgetClassificationStatus,
  recommendedAllocation: number,
  assets: readonly MatchableAsset[],
  currencySymbol = '₱'
): InvestmentMatchResult {
  if (status !== BUDGET_STATUS.WITHIN_BUDGET || recommendedAllocation <= 0) {
    return {
      isGated: true,
      recommendedAllocation: 0,
      matchedAssets: [],
      closestMatch: null,
      summaryLabel: 'None (gated)',
    };
  }

  const validAssets = assets.filter((a) => Number.isFinite(a.price) && a.price > 0);
  const affordable = validAssets
    .filter((a) => a.price <= recommendedAllocation)
    .sort((a, b) => b.price - a.price);

  const closestMatch = affordable.length > 0 ? affordable[0] : null;

  if (closestMatch) {
    return {
      isGated: false,
      recommendedAllocation,
      matchedAssets: affordable,
      closestMatch,
      summaryLabel: `${closestMatch.ticker} (${currencySymbol}${closestMatch.price.toFixed(2)}) ≤ ${currencySymbol}${recommendedAllocation.toFixed(2)}`,
    };
  }

  return {
    isGated: false,
    recommendedAllocation,
    matchedAssets: [],
    closestMatch: null,
    summaryLabel: `Fractional shares available up to ${currencySymbol}${recommendedAllocation.toFixed(2)}`,
  };
}

/**
 * Equation 4: Simulated Investment Value Function
 *
 * Replays chronological daily % changes r_t from Finnhub / SQLite:
 *  N = I_0 / P_0
 *  P_t = P_(t-1) * (1 + r_t)
 *  V_t = N * P_t
 *  GL_t = V_t - I_0
 */
export function simulateInvestmentReplay(
  initialInvestment: number,
  startingPrice: number,
  dailyPctChanges: readonly number[],
  days?: number
): SimulatedReplayResult {
  if (
    !Number.isFinite(initialInvestment) ||
    initialInvestment <= 0 ||
    !Number.isFinite(startingPrice) ||
    startingPrice <= 0
  ) {
    return {
      initialInvestment: 0,
      startingPrice: 0,
      shares: 0,
      days: 0,
      finalPrice: 0,
      finalValue: 0,
      totalGainLoss: 0,
      totalReturnPct: 0,
      steps: [],
    };
  }

  const cleanChanges =
    dailyPctChanges.length > 0
      ? dailyPctChanges.filter((c) => Number.isFinite(c))
      : [2.0, -1.5, 3.0, -4.5, -1.0];

  const effectiveChanges = cleanChanges.length > 0 ? cleanChanges : [0];
  const totalDays =
    typeof days === 'number' && days > 0 ? Math.floor(days) : effectiveChanges.length;

  const shares = initialInvestment / startingPrice;
  const steps: SimulatedReplayStep[] = [
    {
      day: 0,
      pctChange: null,
      simulatedPrice: roundToTwo(startingPrice),
      value: roundToTwo(initialInvestment),
      gainLoss: 0,
    },
  ];

  let runningPrice = startingPrice;

  for (let t = 1; t <= totalDays; t++) {
    const pct = effectiveChanges[(t - 1) % effectiveChanges.length];
    const r = pct / 100;
    runningPrice = Math.max(0.01, runningPrice * (1 + r));
    const currentValue = shares * runningPrice;
    const gainLoss = currentValue - initialInvestment;

    steps.push({
      day: t,
      pctChange: roundToTwo(pct),
      simulatedPrice: roundToTwo(runningPrice),
      value: roundToTwo(currentValue),
      gainLoss: roundToTwo(gainLoss),
    });
  }

  const lastStep = steps[steps.length - 1];
  const totalReturnPct = roundToTwo((lastStep.gainLoss / initialInvestment) * 100);

  return {
    initialInvestment: roundToTwo(initialInvestment),
    startingPrice: roundToTwo(startingPrice),
    shares: Math.round((shares + Number.EPSILON) * 10000) / 10000,
    days: totalDays,
    finalPrice: lastStep.simulatedPrice,
    finalValue: lastStep.value,
    totalGainLoss: lastStep.gainLoss,
    totalReturnPct,
    steps,
  };
}

/**
 * Convenience pipeline combining Equation 1, Equation 2, and Finnhub Matching.
 */
export function runDecisionSupportEngine(params: {
  budget: number;
  expenses: number | readonly number[];
  assets?: readonly MatchableAsset[];
  allocationRate?: number;
  currencySymbol?: string;
}): DecisionSupportSummary {
  const symbol = params.currencySymbol || '₱';
  const evaluation = evaluateBudget(params.budget, params.expenses, symbol);
  const allocation = computeInvestmentAllocation(
    evaluation.status,
    evaluation.remainingBudget,
    params.allocationRate ?? DEFAULT_INVESTMENT_ALLOCATION_RATE,
    symbol
  );
  const matching = matchAffordableInvestments(
    evaluation.status,
    allocation.recommendedAllocation,
    params.assets ?? [],
    symbol
  );

  return { evaluation, allocation, matching };
}
