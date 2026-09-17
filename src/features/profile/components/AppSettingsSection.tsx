import React, { useState } from 'react';
import {
  StyleSheet,
  Switch,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  Linking,
} from 'react-native';
import { YStack, XStack, Text as TamaguiText, View } from 'tamagui';
import { PhosphorIcon } from '@/components/ui/PhosphorIcon';
import { CbudgetCard } from '@/components/ui/CbudgetCard';
import { AnimatedSegmentSwitch } from '@/components/ui/AnimatedSegmentSwitch';
import { usePreferencesStore, SupportedCurrency } from '@/store/preferencesStore';
import { useAuthStore } from '@/store/authStore';
import { useGamificationStore } from '@/store/gamificationStore';
import { safeHaptic } from '@/utils/haptics';
import { Fonts, Spacing } from '@/constants/theme';

const Text = (props: any) => <TamaguiText {...props} />;

interface AppSettingsSectionProps {
  theme: {
    primary: string;
    text: string;
    textSecondary: string;
    border: string;
    background: string;
    backgroundElement: string;
    surface: string;
    success: string;
    warning: string;
    error: string;
  };
}

export function AppSettingsSection({ theme }: AppSettingsSectionProps) {
  const { user } = useAuthStore();
  const { getFinancialHealthScore, streakDays, achievements } = useGamificationStore();
  const {
    soundEffectsEnabled,
    hapticsEnabled,
    notificationsEnabled,
    streakRemindersEnabled,
    weeklyReportEnabled,
    currency,
    guardianEmail,
    guardianLinked,
    setSoundEffectsEnabled,
    setHapticsEnabled,
    setNotificationsEnabled,
    setStreakRemindersEnabled,
    setWeeklyReportEnabled,
    setCurrency,
    setGuardianInfo,
  } = usePreferencesStore();

  const [guardianModalVisible, setGuardianModalVisible] = useState(false);
  const [inputEmail, setInputEmail] = useState(guardianEmail);

  const currencies: { code: SupportedCurrency; label: string; symbol: string }[] = [
    { code: 'PHP', label: 'PHP', symbol: '₱' },
    { code: 'USD', label: 'USD', symbol: '$' },
    { code: 'EUR', label: 'EUR', symbol: '€' },
    { code: 'GBP', label: 'GBP', symbol: '£' },
  ];

  const handleSendGuardianReport = async (emailOverride?: string) => {
    const targetEmail = (emailOverride || guardianEmail).trim();
    if (!targetEmail) {
      Alert.alert('No Email', 'Please enter a valid parent or guardian email address.');
      return;
    }
    safeHaptic('light');

    const score = getFinancialHealthScore();
    const studentName = user?.name || user?.email?.split('@')[0] || 'Your Student';
    const unlockedCount = achievements.filter((a: any) => a.unlocked).length || achievements.length;
    const dateStr = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

    const subject = encodeURIComponent(`[CBudget] Financial Literacy Progress Report — ${studentName}`);
    const body = encodeURIComponent(
      `Hello Parent / Guardian,\n\nHere is the latest financial literacy progress update from CBudget for ${studentName} as of ${dateStr}:\n\n` +
      `📊 Financial Literacy Score: ${score}/100\n` +
      `🔥 Active Learning Streak: ${streakDays} day(s)\n` +
      `🏆 Achievements & Milestones Unlocked: ${unlockedCount}\n\n` +
      `About CBudget:\n` +
      `CBudget is an educational sandbox designed to teach students budgeting, savings discipline, and financial literacy safely in a risk-free simulated environment.\n\n` +
      `Thank you for encouraging financial responsibility!\n\n` +
      `Best regards,\nThe CBudget Team`
    );

    const mailUrl = `mailto:${targetEmail}?subject=${subject}&body=${body}`;
    try {
      const canOpen = await Linking.canOpenURL(mailUrl);
      if (canOpen) {
        await Linking.openURL(mailUrl);
      } else {
        Alert.alert(
          'Email App Not Found',
          `Could not open default mail app. You can manually email this progress report to ${targetEmail}.`
        );
      }
    } catch {
      Alert.alert('Error', 'Unable to launch default email app.');
    }
  };

  const handleGuardianSave = async () => {
    const cleanEmail = inputEmail.trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      Alert.alert('Invalid Email', 'Please enter a valid parent or guardian email address.');
      return;
    }
    safeHaptic('success');
    await setGuardianInfo(cleanEmail, true);
    setGuardianModalVisible(false);
    Alert.alert(
      'Guardian Linked! 🎉',
      `Parental reports and milestone summaries are now connected to ${cleanEmail}.\n\nWould you like to send an introductory progress report now?`,
      [
        { text: 'Later', style: 'cancel' },
        {
          text: 'Send Report Now',
          onPress: () => handleSendGuardianReport(cleanEmail),
        },
      ]
    );
  };

  const handleGuardianUnlink = async () => {
    safeHaptic('warning');
    await setGuardianInfo('', false);
    setInputEmail('');
    setGuardianModalVisible(false);
    Alert.alert('Guardian Unlinked', 'Parental report notifications have been disabled.');
  };

  return (
    <YStack gap={Spacing[24]}>
      {/* 1. SOUND & HAPTIC EXPERIENCE */}
      <YStack gap={10}>
        <Text color={theme.text} fontSize={16} fontFamily={Fonts.bold} paddingHorizontal={2}>
          Sound & Touch Feedback
        </Text>

        <CbudgetCard padding={0} overflow="hidden">
          {/* Sound Effects Toggle */}
          <XStack
            alignItems="center"
            justifyContent="space-between"
            paddingHorizontal={16}
            paddingVertical={14}
          >
            <XStack alignItems="center" gap={12} flex={1}>
              <View style={[styles.iconBox, { backgroundColor: 'rgba(16, 185, 129, 0.12)' }]}>
                <PhosphorIcon
                  name="SpeakerHigh"
                  size={18}
                  color="#10B981"
                  weight="fill"
                />
              </View>
              <YStack flex={1} gap={2}>
                <Text color={theme.text} fontSize={14.5} fontFamily={Fonts.bold}>
                  Game Sound Effects (SFX)
                </Text>
                <Text color={theme.textSecondary} fontSize={11.5} fontFamily={Fonts.medium}>
                  Chimes, fanfare, and market audio in mini-games
                </Text>
              </YStack>
            </XStack>
            <Switch
              value={soundEffectsEnabled}
              onValueChange={(val) => {
                safeHaptic('light');
                setSoundEffectsEnabled(val);
              }}
              trackColor={{ false: '#334155', true: '#10B981' }}
              thumbColor="#FFFFFF"
            />
          </XStack>

          {/* Haptic Feedback Toggle */}
          <XStack
            alignItems="center"
            justifyContent="space-between"
            paddingHorizontal={16}
            paddingVertical={14}
            style={{ borderTopWidth: 1, borderTopColor: theme.border }}
          >
            <XStack alignItems="center" gap={12} flex={1}>
              <View style={[styles.iconBox, { backgroundColor: 'rgba(245, 158, 11, 0.12)' }]}>
                <PhosphorIcon
                  name="Vibrate"
                  size={18}
                  color="#F59E0B"
                />
              </View>
              <YStack flex={1} gap={2}>
                <Text color={theme.text} fontSize={14.5} fontFamily={Fonts.bold}>
                  Vibration & Haptics
                </Text>
                <Text color={theme.textSecondary} fontSize={11.5} fontFamily={Fonts.medium}>
                  Tactile feedback for button taps and card swipes
                </Text>
              </YStack>
            </XStack>
            <Switch
              value={hapticsEnabled}
              onValueChange={(val) => {
                safeHaptic('light');
                setHapticsEnabled(val);
              }}
              trackColor={{ false: '#334155', true: '#10B981' }}
              thumbColor="#FFFFFF"
            />
          </XStack>
        </CbudgetCard>
      </YStack>

      {/* 2. NOTIFICATIONS & REMINDERS */}
      <YStack gap={10}>
        <Text color={theme.text} fontSize={16} fontFamily={Fonts.bold} paddingHorizontal={2}>
          Notifications & Alerts
        </Text>

        <CbudgetCard padding={0} overflow="hidden">
          {/* Master Push Notifications */}
          <XStack
            alignItems="center"
            justifyContent="space-between"
            paddingHorizontal={16}
            paddingVertical={14}
          >
            <XStack alignItems="center" gap={12} flex={1}>
              <View style={[styles.iconBox, { backgroundColor: 'rgba(59, 130, 246, 0.12)' }]}>
                <PhosphorIcon
                  name="Bell"
                  size={18}
                  color="#3B82F6"
                  weight="fill"
                />
              </View>
              <YStack flex={1} gap={2}>
                <XStack alignItems="center" gap={8}>
                  <Text color={theme.text} fontSize={14.5} fontFamily={Fonts.bold}>
                    Push Notifications
                  </Text>
                  <View
                    style={{
                      backgroundColor: 'rgba(59, 130, 246, 0.12)',
                      paddingHorizontal: 6,
                      paddingVertical: 2,
                      borderRadius: 6,
                    }}
                  >
                    <Text color="#3B82F6" fontSize={9} fontFamily={Fonts.bold} letterSpacing={0.5}>
                      BETA PREVIEW
                    </Text>
                  </View>
                </XStack>
                <Text color={theme.textSecondary} fontSize={11.5} fontFamily={Fonts.medium}>
                  Allow Walletly to send learning alerts
                </Text>
              </YStack>
            </XStack>
            <Switch
              value={notificationsEnabled}
              onValueChange={(val) => {
                safeHaptic('light');
                setNotificationsEnabled(val);
              }}
              trackColor={{ false: '#334155', true: '#10B981' }}
              thumbColor="#FFFFFF"
            />
          </XStack>

          {/* Daily Streak Reminder */}
          <XStack
            alignItems="center"
            justifyContent="space-between"
            paddingHorizontal={16}
            paddingVertical={14}
            style={{ borderTopWidth: 1, borderTopColor: theme.border, opacity: notificationsEnabled ? 1 : 0.5 }}
          >
            <XStack alignItems="center" gap={12} flex={1}>
              <View style={[styles.iconBox, { backgroundColor: 'rgba(239, 68, 68, 0.12)' }]}>
                <PhosphorIcon
                  name="Fire"
                  size={18}
                  color="#EF4444"
                  weight="fill"
                />
              </View>
              <YStack flex={1} gap={2}>
                <Text color={theme.text} fontSize={14.5} fontFamily={Fonts.bold}>
                  Daily Streak Reminder
                </Text>
                <Text color={theme.textSecondary} fontSize={11.5} fontFamily={Fonts.medium}>
                  Evening nudge to protect your daily learning streak
                </Text>
              </YStack>
            </XStack>
            <Switch
              disabled={!notificationsEnabled}
              value={streakRemindersEnabled && notificationsEnabled}
              onValueChange={(val) => {
                safeHaptic('light');
                setStreakRemindersEnabled(val);
              }}
              trackColor={{ false: '#334155', true: '#10B981' }}
              thumbColor="#FFFFFF"
            />
          </XStack>

          {/* Weekly Summary Digest */}
          <XStack
            alignItems="center"
            justifyContent="space-between"
            paddingHorizontal={16}
            paddingVertical={14}
            style={{ borderTopWidth: 1, borderTopColor: theme.border, opacity: notificationsEnabled ? 1 : 0.5 }}
          >
            <XStack alignItems="center" gap={12} flex={1}>
              <View style={[styles.iconBox, { backgroundColor: 'rgba(139, 92, 246, 0.12)' }]}>
                <PhosphorIcon
                  name="ChartBar"
                  size={18}
                  color="#8B5CF6"
                  weight="fill"
                />
              </View>
              <YStack flex={1} gap={2}>
                <Text color={theme.text} fontSize={14.5} fontFamily={Fonts.bold}>
                  Weekly Spending & XP Digest
                </Text>
                <Text color={theme.textSecondary} fontSize={11.5} fontFamily={Fonts.medium}>
                  Sunday summary of savings, trades & badges earned
                </Text>
              </YStack>
            </XStack>
            <Switch
              disabled={!notificationsEnabled}
              value={weeklyReportEnabled && notificationsEnabled}
              onValueChange={(val) => {
                safeHaptic('light');
                setWeeklyReportEnabled(val);
              }}
              trackColor={{ false: '#334155', true: '#10B981' }}
              thumbColor="#FFFFFF"
            />
          </XStack>
        </CbudgetCard>
      </YStack>

      {/* 3. SIMULATOR CURRENCY DISPLAY */}
      <YStack gap={10}>
        <Text color={theme.text} fontSize={16} fontFamily={Fonts.bold} paddingHorizontal={2}>
          Display Currency
        </Text>

        <CbudgetCard padding={16} gap={10}>
          <Text color={theme.textSecondary} fontSize={12} fontFamily={Fonts.medium}>
            Choose your preferred currency symbol for virtual learning balances:
          </Text>

          <AnimatedSegmentSwitch<SupportedCurrency>
            options={[
              { id: 'PHP', label: '₱ PHP' },
              { id: 'USD', label: '$ USD' },
              { id: 'EUR', label: '€ EUR' },
              { id: 'GBP', label: '£ GBP' },
            ]}
            activeId={currency}
            onChange={(newCurr) => {
              setCurrency(newCurr);
            }}
            height={40}
            fontSize={12.5}
          />
        </CbudgetCard>
      </YStack>

      {/* 4. GUARDIAN / PARENTAL LINK (TEEN SAFETY) */}
      <YStack gap={10}>
        <XStack justifyContent="space-between" alignItems="center" paddingHorizontal={2}>
          <Text color={theme.text} fontSize={16} fontFamily={Fonts.bold}>
            Parent & Guardian Link
          </Text>
          <View
            style={[
              styles.badgePill,
              {
                backgroundColor: guardianLinked ? 'rgba(16, 185, 129, 0.1)' : 'rgba(148, 163, 184, 0.1)',
              },
            ]}
          >
            <XStack alignItems="center" gap={5}>
              <View
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: 2.5,
                  backgroundColor: guardianLinked ? '#10B981' : theme.textSecondary,
                }}
              />
              <Text
                color={guardianLinked ? '#10B981' : theme.textSecondary}
                fontSize={10}
                fontFamily={Fonts.bold}
                letterSpacing={0.5}
              >
                {guardianLinked ? 'ACTIVE GUARDIAN' : 'UNLINKED'}
              </Text>
            </XStack>
          </View>
        </XStack>

        <CbudgetCard padding={16} gap={12}>
          <XStack alignItems="center" gap={12}>
            <View style={[styles.iconBox, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
              <PhosphorIcon
                name="UsersThree"
                size={20}
                color="#10B981"
                weight="fill"
              />
            </View>
            <YStack flex={1} gap={2}>
              <Text color={theme.text} fontSize={14.5} fontFamily={Fonts.bold}>
                {guardianLinked ? guardianEmail : 'Share Progress with a Parent'}
              </Text>
              <Text color={theme.textSecondary} fontSize={11.5} fontFamily={Fonts.medium}>
                {guardianLinked
                  ? 'Your parent receives your financial health & achievement reports'
                  : 'Link a parent to unlock family learning milestones'}
              </Text>
            </YStack>
          </XStack>

          {guardianLinked ? (
            <XStack gap={10}>
              <TouchableOpacity
                onPress={() => {
                  safeHaptic('light');
                  setInputEmail(guardianEmail);
                  setGuardianModalVisible(true);
                }}
                style={[
                  styles.guardianBtn,
                  { flex: 1, borderColor: theme.border, backgroundColor: theme.backgroundElement },
                ]}
                activeOpacity={0.7}
              >
                <Text color={theme.text} fontSize={12.5} fontFamily={Fonts.bold} textAlign="center">
                  Manage Email ➔
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleSendGuardianReport()}
                style={[
                  styles.guardianBtn,
                  { flex: 1.2, borderColor: '#10B981', backgroundColor: 'rgba(16, 185, 129, 0.12)' },
                ]}
                activeOpacity={0.7}
              >
                <XStack alignItems="center" justifyContent="center" gap={6}>
                  <PhosphorIcon name="PaperPlaneTilt" size={15} color="#10B981" weight="fill" />
                  <Text color="#10B981" fontSize={12.5} fontFamily={Fonts.bold}>
                    Send Report
                  </Text>
                </XStack>
              </TouchableOpacity>
            </XStack>
          ) : (
            <TouchableOpacity
              onPress={() => {
                safeHaptic('light');
                setInputEmail(guardianEmail);
                setGuardianModalVisible(true);
              }}
              style={[styles.guardianBtn, { borderColor: theme.border, backgroundColor: theme.backgroundElement }]}
              activeOpacity={0.7}
            >
              <Text color={theme.primary} fontSize={13} fontFamily={Fonts.bold}>
                + Connect Parent Email
              </Text>
            </TouchableOpacity>
          )}

          {/* Parental Consent Compliance Notice */}
          {!guardianLinked && (
            <View
              style={{
                backgroundColor: 'rgba(59, 130, 246, 0.06)',
                borderRadius: 10,
                borderWidth: 1,
                borderColor: 'rgba(59, 130, 246, 0.15)',
                padding: 10,
              }}
            >
              <XStack alignItems="flex-start" gap={8}>
                <PhosphorIcon
                  name="Info"
                  size={14}
                  color="#3B82F6"
                  weight="fill"
                />
                <YStack flex={1} gap={4}>
                  <Text color="#3B82F6" fontSize={11} fontFamily={Fonts.bold}>
                    Parental Consent Notice
                  </Text>
                  <Text color={theme.textSecondary} fontSize={10.5} fontFamily={Fonts.medium} lineHeight={15}>
                    Under the Philippine Data Privacy Act (R.A. 10173) and COPPA, users under 15 years old should have a parent or guardian linked to their account. We recommend connecting a parent email to comply with privacy regulations and unlock family learning milestones.
                  </Text>
                </YStack>
              </XStack>
            </View>
          )}
        </CbudgetCard>
      </YStack>

      {/* GUARDIAN MODAL */}
      <Modal
        visible={guardianModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setGuardianModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <XStack justifyContent="space-between" alignItems="center" marginBottom={12}>
              <XStack alignItems="center" gap={8}>
                <PhosphorIcon
                  name="ShieldCheck"
                  size={18}
                  color={theme.primary}
                  weight="fill"
                />
                <Text color={theme.text} fontSize={17} fontFamily={Fonts.bold}>
                  Parent / Guardian Link
                </Text>
              </XStack>
              <TouchableOpacity onPress={() => setGuardianModalVisible(false)}>
                <Text color={theme.textSecondary} fontSize={18}>✕</Text>
              </TouchableOpacity>
            </XStack>

            <Text color={theme.textSecondary} fontSize={12.5} fontFamily={Fonts.medium} lineHeight={18} marginBottom={14}>
              Enter your parent or guardian's email. They will receive automated summaries of your Financial Literacy Score and badges earned.
            </Text>

            <TextInput
              value={inputEmail}
              onChangeText={setInputEmail}
              placeholder="parent.guardian@example.com"
              placeholderTextColor="#64748B"
              keyboardType="email-address"
              autoCapitalize="none"
              style={[
                styles.modalInput,
                {
                  color: theme.text,
                  backgroundColor: theme.backgroundElement,
                  borderColor: theme.border,
                },
              ]}
            />

            <YStack gap={8} marginTop={16}>
              <TouchableOpacity
                onPress={handleGuardianSave}
                style={[styles.modalActionBtn, { backgroundColor: theme.primary }]}
                activeOpacity={0.8}
              >
                <Text color="#FFFFFF" fontSize={14} fontFamily={Fonts.bold}>
                  Save & Link Guardian
                </Text>
              </TouchableOpacity>

              {guardianLinked && (
                <>
                  <TouchableOpacity
                    onPress={() => {
                      setGuardianModalVisible(false);
                      handleSendGuardianReport();
                    }}
                    style={[
                      styles.modalActionBtn,
                      { backgroundColor: 'rgba(16, 185, 129, 0.12)', borderWidth: 1, borderColor: '#10B981' },
                    ]}
                    activeOpacity={0.8}
                  >
                    <XStack alignItems="center" justifyContent="center" gap={6}>
                      <PhosphorIcon name="PaperPlaneTilt" size={15} color="#10B981" weight="fill" />
                      <Text color="#10B981" fontSize={13.5} fontFamily={Fonts.bold}>
                        Send Progress Report Now
                      </Text>
                    </XStack>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleGuardianUnlink}
                    style={[styles.modalActionBtn, { backgroundColor: 'transparent' }]}
                    activeOpacity={0.8}
                  >
                    <Text color={theme.error} fontSize={13} fontFamily={Fonts.bold}>
                      Remove Guardian Link
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </YStack>
          </View>
        </View>
      </Modal>
    </YStack>
  );
}

const styles = StyleSheet.create({
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  currencyChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  badgePill: {
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 999,
  },
  guardianBtn: {
    width: '100%',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
  },
  modalInput: {
    width: '100%',
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 14,
  },
  modalActionBtn: {
    width: '100%',
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
