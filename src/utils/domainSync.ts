import { supabase } from '@/utils/supabase';
import { runOffline } from '@/utils/offlineSchema';
import { sqliteStorage } from '@/utils/sqliteStorage';
import { persistSyncStatus } from '@/utils/syncStatus';
import { uuidFromString } from '@/utils/uuid';

type SyncUser = {
  id: string;
  email: string;
  isPremium: boolean;
};

type SyncExpense = {
  id: string;
  name: string;
  category: string;
  amount: number;
  date: string;
  notes?: string;
};

type SyncSavingsGoal = {
  id: string;
  name: string;
  targetAmount: number;
  currentSavings: number;
  targetDate: string;
  category: string;
};

type SyncState = {
  budgetType: 'daily' | 'weekly' | 'monthly' | null;
  totalBudget: number;
  selectedCategories: string[];
  categoryLimits: Record<string, number>;
  loggedExpenses: SyncExpense[];
  savingsGoals: SyncSavingsGoal[];
  streakDays: number;
  lastActiveDate: string | null;
  achievements: { id: string; title: string; description: string; icon: string; color: string; unlockedAt?: string }[];
  completedLessons?: string[];
};

type RecommendationRow = {
  recommendation_id: string;
  owner_type: 'online' | 'offline';
  owner_id: string;
  category_id: string | null;
  rule_triggered: string;
  message: string;
  generated_at: string;
  is_dismissed: boolean;
};

type CategoryUpsertRow = {
  category_id: string;
  owner_type: 'online' | 'offline';
  owner_id: string;
  name: string;
  type: 'income' | 'expense';
  icon: string | null;
  is_default: boolean;
};

type BudgetUpsertRow = {
  budget_id: string;
  owner_type: 'online' | 'offline';
  owner_id: string;
  category_id: string | null;
  limit_amount: number;
  period: 'daily' | 'weekly' | 'monthly';
  is_recommended: boolean;
};

type StreakUpsertRow = {
  streak_id: string;
  user_id: string;
  current_count: number;
  longest_count: number;
  last_activity_date: string | null;
};

type SubscriptionUpsertRow = {
  subscription_id: string;
  user_id: string;
  tier: 'free' | 'premium';
  status: 'active' | 'past_due' | 'canceled' | 'trialing';
  start_date: string;
  renewal_date: string | null;
  payment_reference: string | null;
};

const REFERENCE_BADGES = [
  { id: 'first_budget', title: 'First Budget Created', description: 'Defined your budgeting frequency, limit, and categories.', icon: 'checkmark.seal.fill', color: '#10B981' },
  { id: 'first_lesson', title: 'First Lesson Completed', description: 'Finished your first Cbudget Academy lesson module.', icon: 'book.closed.fill', color: '#3B82F6' },
  { id: 'streak_7', title: '7 Day Learning Streak', description: 'Maintained a 7-day streak of active financial learning.', icon: 'flame.fill', color: '#F59E0B' },
  { id: 'invest_graduate', title: 'Investment Lab Graduate', description: 'Allocated simulation cash across assets in the Investment Lab.', icon: 'graduationcap.fill', color: '#8B5CF6' },
  { id: 'budget_master', title: 'Budget Master', description: 'Kept overall budgeting score above 90.', icon: 'chart.pie.fill', color: '#06B6D4' },
  { id: 'financial_explorer', title: 'Financial Explorer', description: 'Unlocked 5 different lessons and completed 3 quizzes.', icon: 'safari.fill', color: '#EC4899' },
  { id: 'savings_strategist', title: 'Savings Strategist', description: 'Reached a simulated savings score of 85 or higher.', icon: 'dollarsign.circle.fill', color: '#10B981' },
  { id: 'emergency_fund_planner', title: 'Emergency Fund Planner', description: 'Completed the Emergency Funds saving strategy lesson.', icon: 'shield.fill', color: '#EF4444' },
  { id: 'compound_master', title: 'Time Compounding Guru', description: 'Simulated a long-term 20-year compound interest savings timeline.', icon: 'hourglass.badge.plus', color: '#10B981' },
];

const REFERENCE_LESSONS = [
  { title: 'Level 1: Budgeting Basics', category: 'Budgeting Basics', orderIndex: 1 },
  { title: 'Level 2: Expense Tracking', category: 'Expense Tracking', orderIndex: 2 },
  { title: 'Level 3: Saving Strategies', category: 'Saving Strategies', orderIndex: 3 },
  { title: 'Level 4: Emergency Funds', category: 'Emergency Funds', orderIndex: 4 },
  { title: 'Level 5: Financial Planning', category: 'Financial Planning', orderIndex: 5 },
  { title: 'Level 6: Investment Fundamentals', category: 'Investment Fundamentals', orderIndex: 6 },
  { title: 'Level 7: Risk Management', category: 'Risk Management', orderIndex: 7 },
  { title: 'Level 8: Diversification', category: 'Diversification', orderIndex: 8 },
  { title: 'Level 9: Long-Term Wealth Building', category: 'Long-Term Wealth Building', orderIndex: 9 },
];

function ownerTypeForUser(user: SyncUser) {
  return user.id === 'guest' ? 'offline' : 'online';
}

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

async function sqliteSeedReferenceData() {
  for (const badge of REFERENCE_BADGES) {
    await runOffline(
      `INSERT INTO badges (badge_id, name, icon, description)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(badge_id) DO UPDATE SET
         name = excluded.name,
         icon = excluded.icon,
         description = excluded.description`,
      [uuidFromString(`badge:${badge.id}`), badge.title, badge.icon, badge.description],
    );
  }

  for (const lesson of REFERENCE_LESSONS) {
    await runOffline(
      `INSERT INTO literacy_lessons (lesson_id, title, category, target_user_type, order_index, is_active)
       VALUES (?, ?, ?, ?, ?, 1)
       ON CONFLICT(lesson_id) DO UPDATE SET
         title = excluded.title,
         category = excluded.category,
         target_user_type = excluded.target_user_type,
         order_index = excluded.order_index,
         is_active = excluded.is_active`,
      [uuidFromString(`lesson:${lesson.title}`), lesson.title, lesson.category, 'user', lesson.orderIndex],
    );
  }
}

async function upsertSupabaseRows(table: string, rows: Record<string, unknown>[], onConflict: string) {
  if (!rows.length) return;
  const { error } = await supabase.from(table).upsert(rows as never, { onConflict });
  if (error) {
    console.warn(`Supabase upsert failed for ${table}:`, error);
  }
}

async function getOrCreateOfflineDeviceId() {
  const key = 'cbudget_device_id';
  const existing = await sqliteStorage.getItem(key);
  if (existing) return existing;

  const next = uuidFromString(`device:${Date.now()}:${Math.random()}`);
  await sqliteStorage.setItem(key, next);
  return next;
}

export async function seedLocalReferenceData() {
  await sqliteSeedReferenceData();
}

export async function syncStructuredStateToStorage(user: SyncUser | null, state: SyncState) {
  await sqliteSeedReferenceData();
  const deviceId = await getOrCreateOfflineDeviceId();
  const now = new Date().toISOString();

  if (!user) {
    await runOffline(
      `INSERT INTO offline_devices (offline_id, device_id, currency_pref, upgraded_to_user_id, created_at, updated_at)
       VALUES (?, ?, ?, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       ON CONFLICT(device_id) DO UPDATE SET
         updated_at = CURRENT_TIMESTAMP`,
      [uuidFromString(`offline-device:${deviceId}`), deviceId, 'PHP'],
    );
    await persistSyncStatus({
      backend: 'sqlite',
      connection: 'offline',
      lastSyncedAt: now,
      userId: 'guest',
      deviceId,
      syncCursor: `categories:${state.selectedCategories.length}|expenses:${state.loggedExpenses.length}|goals:${state.savingsGoals.length}`,
    });
    return;
  }

  const ownerType = ownerTypeForUser(user);
  const ownerId = user.id;

  const categoryNames = Array.from(
    new Set([
      ...state.selectedCategories,
      ...state.loggedExpenses.map((item) => item.category),
      ...state.savingsGoals.map((item) => item.category),
    ]),
  ).filter(Boolean);

  const categories: CategoryUpsertRow[] = categoryNames.map((name) => ({
    category_id: uuidFromString(`category:${ownerId}:${name}`),
    owner_type: ownerType,
    owner_id: ownerId,
    name,
    type: 'expense',
    icon: null,
    is_default: false,
  }));

  const budgets: BudgetUpsertRow[] = state.selectedCategories.map((name) => ({
    budget_id: uuidFromString(`budget:${ownerId}:${state.budgetType ?? 'none'}:${name}`),
    owner_type: ownerType,
    owner_id: ownerId,
    category_id: uuidFromString(`category:${ownerId}:${name}`),
    limit_amount: state.categoryLimits[name] ?? 0,
    period: state.budgetType === 'daily' ? 'daily' : state.budgetType ?? 'monthly',
    is_recommended: false,
  }));

  const transactions = state.loggedExpenses.map((item) => ({
    transaction_id: uuidFromString(`txn:${ownerId}:${item.id}`),
    owner_type: ownerType,
    owner_id: ownerId,
    category_id: uuidFromString(`category:${ownerId}:${item.category}`),
    type: 'expense',
    amount: item.amount,
    description: item.notes || item.name,
    transaction_date: item.date,
    is_recurring: false,
    recurring_id: null,
    synced_at: now,
    created_at: now,
    updated_at: now,
  }));

  const streaks: StreakUpsertRow[] = [{
    streak_id: uuidFromString(`streak:${ownerId}`),
    user_id: ownerId,
    current_count: state.streakDays,
    longest_count: state.streakDays,
    last_activity_date: state.lastActiveDate,
  }];

  const savingChallenges = state.savingsGoals.map((goal) => {
    const parsedDays = Number.parseInt(goal.targetDate, 10);
    const endDate = Number.isFinite(parsedDays)
      ? new Date(Date.now() + parsedDays * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
      : todayIsoDate();

    return {
      challenge_id: uuidFromString(`challenge:${ownerId}:${goal.id}`),
      user_id: ownerId,
      target_amount: goal.targetAmount,
      current_amount: goal.currentSavings,
      start_date: todayIsoDate(),
      end_date: endDate,
      is_completed: goal.currentSavings >= goal.targetAmount,
      created_at: now,
      updated_at: now,
    };
  });

  const subscriptions: SubscriptionUpsertRow[] = [{
    subscription_id: uuidFromString(`subscription:${ownerId}`),
    user_id: ownerId,
    tier: user.isPremium ? 'premium' : 'free',
    status: 'active',
    start_date: todayIsoDate(),
    renewal_date: null,
    payment_reference: null,
  }];

  const userBadges = state.achievements.map((achievement) => ({
    user_badge_id: uuidFromString(`user-badge:${ownerId}:${achievement.id}`),
    user_id: ownerId,
    badge_id: uuidFromString(`badge:${achievement.id}`),
    earned_at: achievement.unlockedAt || now,
  }));

  const lessonProgress = Array.from(new Set(state.completedLessons || [])).map((lessonTitle) => ({
    progress_id: uuidFromString(`lesson-progress:${ownerId}:${lessonTitle}`),
    user_id: ownerId,
    lesson_id: uuidFromString(`lesson:${lessonTitle}`),
    is_completed: true,
    completed_at: now,
    created_at: now,
    updated_at: now,
  }));

  const recommendations: RecommendationRow[] = [];
  const totalSpent = state.loggedExpenses.reduce((sum, item) => sum + item.amount, 0);
  const categorySpend = state.loggedExpenses.reduce<Record<string, number>>((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + item.amount;
    return acc;
  }, {});
  const topCategory = Object.entries(categorySpend).sort((a, b) => b[1] - a[1])[0];

  if (state.totalBudget > 0 && totalSpent > state.totalBudget) {
    recommendations.push({
      recommendation_id: uuidFromString(`recommendation:${ownerId}:overbudget`),
      owner_type: ownerType,
      owner_id: ownerId,
      category_id: topCategory ? uuidFromString(`category:${ownerId}:${topCategory[0]}`) : null,
      rule_triggered: 'over_budget',
      message: topCategory
        ? `You are over budget. The biggest spend is ${topCategory[0]}. Consider tightening that category first.`
        : 'You are over budget. Review your highest spending category first.',
      generated_at: now,
      is_dismissed: false,
    });
  }

  if (state.savingsGoals.length > 0) {
    recommendations.push({
      recommendation_id: uuidFromString(`recommendation:${ownerId}:savings_boost`),
      owner_type: ownerType,
      owner_id: ownerId,
      category_id: null,
      rule_triggered: 'savings_boost',
      message: 'Keep routing leftover budget into savings goals before moving more money into investing.',
      generated_at: now,
      is_dismissed: false,
    });
  }

  if (state.streakDays < 3) {
    recommendations.push({
      recommendation_id: uuidFromString(`recommendation:${ownerId}:streak`),
      owner_type: ownerType,
      owner_id: ownerId,
      category_id: null,
      rule_triggered: 'streak_growth',
      message: 'Log in daily to build a longer streak and unlock more learning rewards.',
      generated_at: now,
      is_dismissed: false,
    });
  }

  const offlineStatements: Array<Promise<unknown>> = [
    runOffline(`DELETE FROM recommendations WHERE owner_id = ?`, [ownerId]),
    runOffline(`DELETE FROM categories WHERE owner_id = ?`, [ownerId]),
    runOffline(`DELETE FROM budgets WHERE owner_id = ?`, [ownerId]),
    runOffline(`DELETE FROM transactions WHERE owner_id = ?`, [ownerId]),
    runOffline(`DELETE FROM streaks WHERE user_id = ?`, [ownerId]),
    runOffline(`DELETE FROM saving_challenges WHERE user_id = ?`, [ownerId]),
    runOffline(`DELETE FROM subscriptions WHERE user_id = ?`, [ownerId]),
    runOffline(`DELETE FROM user_badges WHERE user_id = ?`, [ownerId]),
    runOffline(`DELETE FROM lesson_progress WHERE user_id = ?`, [ownerId]),
    runOffline(`DELETE FROM offline_devices WHERE device_id = ?`, [deviceId]),
  ];
  await Promise.all(offlineStatements);

  await runOffline(
    `INSERT INTO offline_devices (offline_id, device_id, currency_pref, upgraded_to_user_id, created_at, updated_at)
     VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
     ON CONFLICT(device_id) DO UPDATE SET
       upgraded_to_user_id = excluded.upgraded_to_user_id,
       updated_at = CURRENT_TIMESTAMP`,
    [uuidFromString(`offline-device:${deviceId}`), deviceId, 'PHP', user.id],
  );

  for (const row of categories) {
    await runOffline(
      `INSERT INTO categories (category_id, owner_type, owner_id, name, type, icon, is_default, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(category_id) DO UPDATE SET
         owner_type = excluded.owner_type,
         owner_id = excluded.owner_id,
         name = excluded.name,
         type = excluded.type,
         icon = excluded.icon,
         is_default = excluded.is_default,
         updated_at = excluded.updated_at`,
      [row.category_id, row.owner_type, row.owner_id, row.name, row.type, row.icon, row.is_default ? 1 : 0, now, now],
    );
  }

  for (const row of budgets) {
    await runOffline(
      `INSERT INTO budgets (budget_id, owner_type, owner_id, category_id, limit_amount, period, is_recommended, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(budget_id) DO UPDATE SET
         limit_amount = excluded.limit_amount,
         period = excluded.period,
         updated_at = excluded.updated_at`,
      [row.budget_id, row.owner_type, row.owner_id, row.category_id, row.limit_amount, row.period, row.is_recommended ? 1 : 0, now, now],
    );
  }

  for (const row of transactions) {
    await runOffline(
      `INSERT INTO transactions (transaction_id, owner_type, owner_id, category_id, type, amount, description, transaction_date, is_recurring, recurring_id, synced_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(transaction_id) DO UPDATE SET
         amount = excluded.amount,
         description = excluded.description,
         transaction_date = excluded.transaction_date,
         synced_at = excluded.synced_at,
         updated_at = excluded.updated_at`,
      [row.transaction_id, row.owner_type, row.owner_id, row.category_id, row.type, row.amount, row.description, row.transaction_date, row.is_recurring ? 1 : 0, row.recurring_id, row.synced_at, row.created_at, row.updated_at],
    );
  }

  for (const row of streaks) {
    await runOffline(
      `INSERT INTO streaks (streak_id, user_id, current_count, longest_count, last_activity_date, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(user_id) DO UPDATE SET
         current_count = excluded.current_count,
         longest_count = excluded.longest_count,
         last_activity_date = excluded.last_activity_date,
         updated_at = excluded.updated_at`,
      [row.streak_id, row.user_id, row.current_count, row.longest_count, row.last_activity_date, now, now],
    );
  }

  for (const row of savingChallenges) {
    await runOffline(
      `INSERT INTO saving_challenges (challenge_id, user_id, target_amount, current_amount, start_date, end_date, is_completed, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(challenge_id) DO UPDATE SET
         target_amount = excluded.target_amount,
         current_amount = excluded.current_amount,
         end_date = excluded.end_date,
         is_completed = excluded.is_completed,
         updated_at = excluded.updated_at`,
      [row.challenge_id, row.user_id, row.target_amount, row.current_amount, row.start_date, row.end_date, row.is_completed ? 1 : 0, row.created_at, row.updated_at],
    );
  }

  for (const row of subscriptions) {
    await runOffline(
      `INSERT INTO subscriptions (subscription_id, user_id, tier, status, start_date, renewal_date, payment_reference, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(user_id) DO UPDATE SET
         tier = excluded.tier,
         status = excluded.status,
         updated_at = excluded.updated_at`,
      [row.subscription_id, row.user_id, row.tier, row.status, row.start_date, row.renewal_date, row.payment_reference, now, now],
    );
  }

  for (const row of userBadges) {
    await runOffline(
      `INSERT INTO user_badges (user_badge_id, user_id, badge_id, earned_at)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(user_id, badge_id) DO UPDATE SET
         earned_at = excluded.earned_at`,
      [row.user_badge_id, row.user_id, row.badge_id, row.earned_at],
    );
  }

  for (const row of lessonProgress) {
    await runOffline(
      `INSERT INTO lesson_progress (progress_id, user_id, lesson_id, is_completed, completed_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(user_id, lesson_id) DO UPDATE SET
         is_completed = excluded.is_completed,
         completed_at = excluded.completed_at,
         updated_at = excluded.updated_at`,
      [row.progress_id, row.user_id, row.lesson_id, row.is_completed ? 1 : 0, row.completed_at, row.created_at, row.updated_at],
    );
  }

  for (const row of recommendations) {
    await runOffline(
      `INSERT INTO recommendations (recommendation_id, owner_type, owner_id, category_id, rule_triggered, message, generated_at, is_dismissed)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(recommendation_id) DO UPDATE SET
         category_id = excluded.category_id,
         rule_triggered = excluded.rule_triggered,
         message = excluded.message,
         generated_at = excluded.generated_at,
         is_dismissed = excluded.is_dismissed`,
      [row.recommendation_id, row.owner_type, row.owner_id, row.category_id, row.rule_triggered, row.message, row.generated_at, row.is_dismissed ? 1 : 0],
    );
  }

  if (user.id !== 'guest') {
    await Promise.all([
      upsertSupabaseRows('categories', categories, 'category_id'),
      upsertSupabaseRows('budgets', budgets, 'budget_id'),
      upsertSupabaseRows('transactions', transactions, 'transaction_id'),
      upsertSupabaseRows('recommendations', recommendations, 'recommendation_id'),
      upsertSupabaseRows('streaks', streaks, 'user_id'),
      upsertSupabaseRows('saving_challenges', savingChallenges, 'challenge_id'),
      upsertSupabaseRows('subscriptions', subscriptions, 'user_id'),
      upsertSupabaseRows('user_badges', userBadges, 'user_id,badge_id'),
      upsertSupabaseRows('lesson_progress', lessonProgress, 'user_id,lesson_id'),
    ]);
  }

  await persistSyncStatus({
    backend: 'supabase',
    connection: 'online',
    lastSyncedAt: now,
    userId: ownerId,
    deviceId,
    syncCursor: `categories:${categories.length}|budgets:${budgets.length}|transactions:${transactions.length}|lessons:${lessonProgress.length}`,
  });
}
