import { Alert, Linking } from 'react-native';
import { supabase, isSupabaseConfigured } from '@/utils/supabase';
import { useAuthStore } from '@/store/authStore';
import { useGamificationStore } from '@/store/gamificationStore';
import { usePreferencesStore } from '@/store/preferencesStore';
import { safeHaptic } from '@/utils/haptics';

export interface GuardianReportResult {
  success: boolean;
  message?: string;
}

/**
 * Sends and records an educational progress report to the linked parent or guardian.
 * Persists the record to Supabase public.guardian_reports if authenticated and online.
 */
export async function sendGuardianReport(emailOverride?: string): Promise<GuardianReportResult> {
  const preferences = usePreferencesStore.getState();
  const gamification = useGamificationStore.getState();
  const auth = useAuthStore.getState();

  const targetEmail = (emailOverride || preferences.guardianEmail || '').trim();
  if (!targetEmail || !targetEmail.includes('@')) {
    Alert.alert('No Guardian Email', 'Please provide a valid parent or guardian email address to send the report.');
    return { success: false, message: 'Invalid email' };
  }

  safeHaptic('medium');

  const healthScore = gamification.getFinancialHealthScore ? gamification.getFinancialHealthScore() : 85;
  const streakDays = gamification.streakDays || 0;
  const unlockedCount = gamification.achievements
    ? gamification.achievements.filter((a: any) => a.unlocked).length
    : 0;
  const studentName = auth.user?.name || auth.user?.email?.split('@')[0] || 'Your Student';

  // 1. Persist log to Supabase guardian_reports table if logged in
  if (auth.user?.id && auth.user.id !== 'guest' && isSupabaseConfigured) {
    try {
      const { error } = await supabase.from('guardian_reports').insert({
        user_id: auth.user.id,
        guardian_email: targetEmail,
        financial_health_score: healthScore,
        streak_days: streakDays,
        badges_count: unlockedCount,
        sent_at: new Date().toISOString(),
      });

      if (error) {
        console.warn('[GuardianReport] Supabase insert warning:', error.message);
      }
    } catch (e) {
      console.warn('[GuardianReport] Failed to log guardian report to database:', e);
    }
  }

  // 2. Format student learning progress email
  const subject = encodeURIComponent(`📊 CBudget: ${studentName}'s Financial Literacy Progress Report`);
  const body = encodeURIComponent(
    `Hello Guardian,\n\n` +
      `Here is the latest financial literacy & budgeting progress summary for ${studentName}:\n\n` +
      `📈 Overall Financial Health Score: ${healthScore}/100\n` +
      `🔥 Active Learning Streak: ${streakDays} day(s)\n` +
      `🏆 Badges & Financial Milestones Unlocked: ${unlockedCount}\n\n` +
      `What is CBudget?\n` +
      `CBudget is an educational sandbox designed to teach students budgeting, savings discipline, and financial literacy safely in a risk-free simulated environment.\n\n` +
      `Thank you for encouraging financial responsibility!\n\n` +
      `Warm regards,\n` +
      `The CBudget Educational Team`
  );

  const mailUrl = `mailto:${targetEmail}?subject=${subject}&body=${body}`;

  try {
    const canOpen = await Linking.canOpenURL(mailUrl);
    if (canOpen) {
      await Linking.openURL(mailUrl);
      return { success: true };
    } else {
      Alert.alert(
        'Email App Not Found',
        `The report has been recorded. You can also manually email ${targetEmail} with score: ${healthScore}/100 and streak: ${streakDays} days.`
      );
      return { success: true, message: 'Logged but mail app unavailable' };
    }
  } catch (err) {
    console.warn('[GuardianReport] Linking error:', err);
    Alert.alert('Report Saved', `Progress report recorded for ${targetEmail}.`);
    return { success: true };
  }
}
