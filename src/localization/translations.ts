export type LanguageCode = 'en' | 'fil';

export interface Translations {
  // Navigation / Tabs
  tab_home: string;
  tab_budget: string;
  tab_invest: string;
  tab_profile: string;
  tab_arcade: string;

  // Common UI
  save: string;
  cancel: string;
  confirm: string;
  delete: string;
  edit: string;
  done: string;
  close: string;
  back: string;
  loading: string;
  continue: string;
  search: string;

  // Home Dashboard
  greeting_morning: string;
  greeting_afternoon: string;
  greeting_evening: string;
  available_to_spend: string;
  daily_allowance: string;
  daily_streak: string;
  days_streak: string;
  claim_daily_reward: string;
  claimed_today: string;
  log_expense: string;
  quick_actions: string;
  recent_activity: string;
  no_transactions: string;
  financial_health: string;
  xp_points: string;
  level: string;

  // Budget Screen
  set_budget: string;
  total_budget: string;
  spent_so_far: string;
  remaining: string;
  over_budget: string;
  allocate_unspent: string;
  smart_recommendation: string;
  add_expense: string;
  expense_name: string;
  amount: string;
  category: string;
  notes: string;
  save_expense: string;

  // Settings & Preferences
  settings: string;
  sound_and_touch: string;
  sound_effects: string;
  sound_effects_sub: string;
  vibration: string;
  vibration_sub: string;
  notifications_alerts: string;
  push_notifications: string;
  push_notifications_sub: string;
  streak_reminder: string;
  streak_reminder_sub: string;
  weekly_digest: string;
  weekly_digest_sub: string;
  test_notification: string;
  test_notification_sub: string;
  test_alert_btn: string;
  display_currency: string;
  display_currency_sub: string;
  app_language: string;
  app_language_sub: string;
  parent_guardian_link: string;
  parent_guardian_sub: string;
  log_out: string;

  // System Notifications
  streak_notification_title: string;
  streak_notification_body: string;
  weekly_notification_title: string;
  weekly_notification_body: string;
  budget_alert_title: string;
  budget_alert_body: string;
  achievement_unlocked: string;
}

export type TranslationKey = keyof Translations;

export const translations: Record<LanguageCode, Translations> = {
  en: {
    // Navigation / Tabs
    tab_home: 'Home',
    tab_budget: 'Budget',
    tab_invest: 'Invest Lab',
    tab_profile: 'Profile',
    tab_arcade: 'Arcade',

    // Common UI
    save: 'Save',
    cancel: 'Cancel',
    confirm: 'Confirm',
    delete: 'Delete',
    edit: 'Edit',
    done: 'Done',
    close: 'Close',
    back: 'Back',
    loading: 'Loading...',
    continue: 'Continue',
    search: 'Search',

    // Home Dashboard
    greeting_morning: 'Good morning',
    greeting_afternoon: 'Good afternoon',
    greeting_evening: 'Good evening',
    available_to_spend: 'Available to Spend',
    daily_allowance: 'Daily Allowance',
    daily_streak: 'Daily Streak',
    days_streak: 'Day Streak',
    claim_daily_reward: 'Claim Daily Reward',
    claimed_today: 'Claimed Today',
    log_expense: 'Log Expense',
    quick_actions: 'Quick Actions',
    recent_activity: 'Recent Activity',
    no_transactions: 'No transactions logged yet today.',
    financial_health: 'Financial Health Score',
    xp_points: 'XP',
    level: 'Level',

    // Budget Screen
    set_budget: 'Set Budget',
    total_budget: 'Total Budget',
    spent_so_far: 'Spent So Far',
    remaining: 'Remaining',
    over_budget: 'Over Budget',
    allocate_unspent: 'Allocate Unspent',
    smart_recommendation: 'Smart Recommendation',
    add_expense: 'Add Expense',
    expense_name: 'Expense Name',
    amount: 'Amount',
    category: 'Category',
    notes: 'Notes (Optional)',
    save_expense: 'Save Expense',

    // Settings & Preferences
    settings: 'Settings',
    sound_and_touch: 'Sound & Touch Feedback',
    sound_effects: 'Game Sound Effects (SFX)',
    sound_effects_sub: 'Chimes, fanfare, and market audio in mini-games',
    vibration: 'Vibration & Haptics',
    vibration_sub: 'Tactile feedback for button taps and card swipes',
    notifications_alerts: 'Notifications & Alerts',
    push_notifications: 'Push Notifications',
    push_notifications_sub: 'Allow CBudget to send learning reminders',
    streak_reminder: 'Daily Streak Reminder',
    streak_reminder_sub: 'Evening nudge to protect your daily learning streak',
    weekly_digest: 'Weekly Spending & XP Digest',
    weekly_digest_sub: 'Sunday summary of savings, trades & badges earned',
    test_notification: 'Test Phone Notification',
    test_notification_sub: 'Test lock screen & system status bar reminder',
    test_alert_btn: 'Test Alert',
    display_currency: 'Display Currency',
    display_currency_sub: 'Choose your preferred currency symbol for virtual balances:',
    app_language: 'App Language',
    app_language_sub: 'Choose your preferred interface language for CBudget:',
    parent_guardian_link: 'Parent & Guardian Link',
    parent_guardian_sub: 'Link email to receive weekly progress digests',
    log_out: 'Log Out',

    // System Notifications
    streak_notification_title: '🔥 Keep Your Streak Alive!',
    streak_notification_body: "Don't break your momentum! Log today's allowance or complete a quick quiz in CBudget.",
    weekly_notification_title: '📊 Your Weekly Budget Summary is Ready',
    weekly_notification_body: 'Check out your spending habits and see how much you saved this week!',
    budget_alert_title: '⚠️ Smart Budget Alert: Spending Limit Exceeded',
    budget_alert_body: 'Your total spending has exceeded your set budget limit. Check your budget breakdown.',
    achievement_unlocked: '🏆 Achievement Unlocked!',
  },

  fil: {
    // Navigation / Tabs
    tab_home: 'Tahanan',
    tab_budget: 'Badyet',
    tab_invest: 'Pamumuhunan',
    tab_profile: 'Akaunt',
    tab_arcade: 'Palaruan',

    // Common UI
    save: 'I-save',
    cancel: 'Kanselahin',
    confirm: 'Kumpirmahin',
    delete: 'Burahin',
    edit: 'I-edit',
    done: 'Tapos na',
    close: 'Isara',
    back: 'Bumalik',
    loading: 'Naglo-load...',
    continue: 'Magpatuloy',
    search: 'Maghanap',

    // Home Dashboard
    greeting_morning: 'Magandang umaga',
    greeting_afternoon: 'Magandang hapon',
    greeting_evening: 'Magandang gabi',
    available_to_spend: 'Magagamit na Pera',
    daily_allowance: 'Pang-araw-araw na Baon',
    daily_streak: 'Araw-araw na Streak',
    days_streak: 'Araw na Streak',
    claim_daily_reward: 'Kunin ang Gantimpala',
    claimed_today: 'Nakuha na Ngayon',
    log_expense: 'Magtala ng Gastos',
    quick_actions: 'Mabilis na Aksyon',
    recent_activity: 'Kamakailang Gawain',
    no_transactions: 'Wala pang naitalang gastos ngayong araw.',
    financial_health: 'Marka sa Kalusugang Pinansyal',
    xp_points: 'XP',
    level: 'Antas',

    // Budget Screen
    set_budget: 'Magtakda ng Badyet',
    total_budget: 'Kabuuang Badyet',
    spent_so_far: 'Nastos Hanggang Ngayon',
    remaining: 'Natitira',
    over_budget: 'Lumampas sa Badyet',
    allocate_unspent: 'Ilipat ang Sobrang Pera',
    smart_recommendation: 'Matalinong Rekomendasyon',
    add_expense: 'Magdagdag ng Gastos',
    expense_name: 'Pangalan ng Gastos',
    amount: 'Halaga',
    category: 'Kategorya',
    notes: 'Karagdagang Tala (Opsyonal)',
    save_expense: 'I-save ang Gastos',

    // Settings & Preferences
    settings: 'Mga Setting',
    sound_and_touch: 'Tunog at Panginginig',
    sound_effects: 'Tunog ng Laro (SFX)',
    sound_effects_sub: 'Mga tunog, fanfare, at audio sa mga mini-games',
    vibration: 'Panginginig at Haptics',
    vibration_sub: 'Panginginig sa pagpindot ng buton at pag-swipe',
    notifications_alerts: 'Mga Notipikasyon at Paalala',
    push_notifications: 'Mga Notipikasyon sa Telepono',
    push_notifications_sub: 'Pahintulutan ang CBudget na magpadala ng mga paalala',
    streak_reminder: 'Paalala sa Araw-araw na Streak',
    streak_reminder_sub: 'Gabi-gabing paalala upang protektahan ang iyong streak',
    weekly_digest: 'Lingguhang Ulat ng Gastos at XP',
    weekly_digest_sub: 'Buod ng naipon, kalakalan at mga badge tuwing Linggo',
    test_notification: 'Subukan ang Notipikasyon',
    test_notification_sub: 'Subukan ang paalala sa lock screen at status bar',
    test_alert_btn: 'Subukan',
    display_currency: 'Gamiting Pera',
    display_currency_sub: 'Piliin ang simbolo ng pera para sa iyong virtual na balanse:',
    app_language: 'Wika ng App',
    app_language_sub: 'Piliin ang nais mong wika sa CBudget:',
    parent_guardian_link: 'Koneksyon sa Magulang / Tagapangalaga',
    parent_guardian_sub: 'Ikonekta ang email upang makatanggap ng lingguhang ulat',
    log_out: 'Mag-sign Out',

    // System Notifications
    streak_notification_title: '🔥 Panatilihing Buhay ang Iyong Streak!',
    streak_notification_body: 'Huwag putulin ang momentum! Itala ang baon ngayon o mag-aral sa CBudget.',
    weekly_notification_title: '📊 Handa na ang Iyong Lingguhang Buod',
    weekly_notification_body: 'Tingnan ang iyong mga nagastos at kung magkano ang iyong naipon ngayong linggo!',
    budget_alert_title: '⚠️ Babala sa Badyet: Lumampas sa Limitasyon',
    budget_alert_body: 'Lumampas ang iyong kabuuang gastos sa itinakdang badyet. Suriin ang iyong talaan.',
    achievement_unlocked: '🏆 May Bagong Tagumpay!',
  },
};
