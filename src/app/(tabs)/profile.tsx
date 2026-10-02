import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Switch,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  Platform,
  View,
  Text,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, Href, useFocusEffect } from 'expo-router';
import { setStatusBarStyle } from 'expo-status-bar';
import { useTheme } from '@/hooks/use-theme';
import { useThemeStore } from '@/store/themeStore';
import { usePreferencesStore, SupportedCurrency } from '@/store/preferencesStore';
import { useAuthStore } from '@/store/authStore';
import { useGamificationStore, ALL_ACHIEVEMENTS } from '@/store/gamificationStore';
import { PhosphorIcon, PhosphorIconName } from '@/components/ui/PhosphorIcon';
import { LegalPolicyModal } from '@/features/profile/components/LegalPolicyModal';
import { LegalTabId } from '@/constants/legalPolicies';
import { safeHaptic } from '@/utils/haptics';
import { Fonts } from '@/constants/theme';

interface SettingsRowItem {
  id: string;
  title: string;
  icon: PhosphorIconName;
  iconBgColor?: string;
  detail?: string;
  type: 'navigation' | 'switch';
  switchValue?: boolean;
  onPress?: () => void;
  onToggle?: (val: boolean) => void;
  isDestructive?: boolean;
}

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { mode, setMode } = useThemeStore();
  const { user, logout, updateProfile } = useAuthStore();
  const {
    achievements: unlockedAchievements,
    getFinancialHealthScore,
    level,
    resetAllData,
  } = useGamificationStore();
  const isDark = theme.mode === 'dark';

  useFocusEffect(
    React.useCallback(() => {
      setStatusBarStyle(theme.mode === 'dark' ? 'light' : 'dark');
    }, [theme.mode])
  );

  const {
    currency,
    language,
    notificationsEnabled,
    soundEffectsEnabled,
    hapticsEnabled,
    guardianEmail,
    guardianLinked,
    setCurrency,
    setLanguage,
    setNotificationsEnabled,
    setSoundEffectsEnabled,
    setHapticsEnabled,
    setGuardianInfo,
  } = usePreferencesStore();

  // Modals
  const [editProfileModalVisible, setEditProfileModalVisible] = useState(false);
  const [currencyModalVisible, setCurrencyModalVisible] = useState(false);
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const [achievementsModalVisible, setAchievementsModalVisible] = useState(false);
  const [legalModalVisible, setLegalModalVisible] = useState(false);
  const [legalTab, setLegalTab] = useState<LegalTabId>('terms');

  // Edit Profile Form State (matching Screen 2 in mock)
  const [nameInput, setNameInput] = useState(user?.name || '');
  const [emailInput, setEmailInput] = useState(user?.email || '');
  const [phoneInput, setPhoneInput] = useState(user?.phone || '');
  const [cityInput, setCityInput] = useState(user?.city || '');
  const [schoolGradeInput, setSchoolGradeInput] = useState(user?.schoolGrade || '');
  const [guardianInput, setGuardianInput] = useState(guardianEmail || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const unlockedCount = unlockedAchievements.length;
  const healthScore = getFinancialHealthScore ? getFinancialHealthScore() : 85;

  const handleOpenEditProfile = () => {
    safeHaptic('light');
    setNameInput(user?.name || '');
    setEmailInput(user?.email || '');
    setPhoneInput(user?.phone || '');
    setCityInput(user?.city || '');
    setSchoolGradeInput(user?.schoolGrade || '');
    setGuardianInput(guardianEmail || '');
    setEditProfileModalVisible(true);
  };

  const handleSaveProfile = async () => {
    const cleanName = nameInput.trim();
    const cleanEmail = emailInput.trim();
    const cleanPhone = phoneInput.trim();
    const cleanCity = cityInput.trim();
    const cleanSchoolGrade = schoolGradeInput.trim();
    const cleanGuardian = guardianInput.trim();

    if (!cleanName) {
      Alert.alert('Required Field', 'Please enter your name.');
      return;
    }

    safeHaptic('medium');
    setIsSavingProfile(true);
    try {
      await updateProfile(
        cleanName,
        cleanEmail || user?.email || '',
        user?.avatarColor,
        user?.avatarEmoji,
        cleanPhone,
        cleanCity,
        cleanSchoolGrade
      );
      if (cleanGuardian !== guardianEmail) {
        await setGuardianInfo(cleanGuardian, Boolean(cleanGuardian));
      }
      setEditProfileModalVisible(false);
      Alert.alert('Profile Updated', 'Your profile details have been successfully updated.');
    } catch (err) {
      console.warn('[Profile] Failed to save profile:', err);
      Alert.alert('Update Failed', 'Could not save profile changes. Please try again.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleResetData = () => {
    safeHaptic('medium');
    Alert.alert(
      'Reset Learning Sandbox',
      'This will revert all your budget metrics, expenses, and virtual simulator balances back to default settings (₱10,000). Proceed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset Data',
          style: 'destructive',
          onPress: () => {
            resetAllData(10000);
            Alert.alert('Sandbox Reset', 'Your simulated learning metrics have been reset to ₱10,000.');
          },
        },
      ]
    );
  };

  const handleOpenLegal = (tab: LegalTabId) => {
    safeHaptic('light');
    setLegalTab(tab);
    setLegalModalVisible(true);
  };

  const handleSignOut = () => {
    safeHaptic('medium');
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out of your account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              router.replace('/(auth)' as Href);
            } catch (err) {
              console.warn('[Profile] Logout error:', err);
            }
          },
        },
      ]
    );
  };

  const primaryAccent = theme.primary || '#10B981';

  const rows: SettingsRowItem[] = [
    {
      id: 'edit-profile',
      title: 'Edit Profile',
      icon: 'User',
      iconBgColor: primaryAccent,
      type: 'navigation',
      onPress: handleOpenEditProfile,
    },
    {
      id: 'language',
      title: 'App Language',
      icon: 'Globe',
      iconBgColor: primaryAccent,
      detail: language || 'English (US)',
      type: 'navigation',
      onPress: () => {
        safeHaptic('light');
        setLanguageModalVisible(true);
      },
    },
    {
      id: 'currency',
      title: 'App Currency',
      icon: 'Coins',
      iconBgColor: primaryAccent,
      detail: currency === 'PHP' ? '₱ PHP' : `${currency}`,
      type: 'navigation',
      onPress: () => {
        safeHaptic('light');
        setCurrencyModalVisible(true);
      },
    },
    {
      id: 'my-wallet',
      title: 'MyWallet & Budget',
      icon: 'Wallet',
      iconBgColor: primaryAccent,
      type: 'navigation',
      onPress: () => {
        safeHaptic('light');
        router.push('/(tabs)/budget' as Href);
      },
    },
    {
      id: 'achievements',
      title: 'Badges & Milestones',
      icon: 'Trophy',
      iconBgColor: primaryAccent,
      detail: `${unlockedCount}/${ALL_ACHIEVEMENTS.length} Earned`,
      type: 'navigation',
      onPress: () => {
        safeHaptic('light');
        setAchievementsModalVisible(true);
      },
    },
    {
      id: 'notifications',
      title: 'Notifications',
      icon: 'Bell',
      iconBgColor: primaryAccent,
      type: 'switch',
      switchValue: notificationsEnabled,
      onToggle: (val) => {
        safeHaptic('light');
        setNotificationsEnabled(val);
      },
    },
    {
      id: 'dark-mode',
      title: 'Dark Mode',
      icon: 'Moon',
      iconBgColor: primaryAccent,
      type: 'switch',
      switchValue: mode === 'dark',
      onToggle: (val) => {
        safeHaptic('light');
        setMode(val ? 'dark' : 'light');
      },
    },
    {
      id: 'sounds',
      title: 'Sound & Haptics',
      icon: 'SpeakerHigh',
      iconBgColor: primaryAccent,
      type: 'switch',
      switchValue: soundEffectsEnabled && hapticsEnabled,
      onToggle: (val) => {
        safeHaptic('light');
        setSoundEffectsEnabled(val);
        setHapticsEnabled(val);
      },
    },
    {
      id: 'guardian',
      title: 'Parent & Guardian Link',
      icon: 'ShieldCheck',
      iconBgColor: primaryAccent,
      detail: guardianLinked ? 'Linked' : 'Not Linked',
      type: 'navigation',
      onPress: handleOpenEditProfile,
    },
    {
      id: 'help',
      title: 'Contact & Help',
      icon: 'ChatCircle',
      iconBgColor: primaryAccent,
      type: 'navigation',
      onPress: () => handleOpenLegal('rights'),
    },
    {
      id: 'terms',
      title: 'Terms & Privacy Policy',
      icon: 'FileText',
      iconBgColor: primaryAccent,
      type: 'navigation',
      onPress: () => handleOpenLegal('terms'),
    },
    {
      id: 'licenses',
      title: 'Open Source Licenses',
      icon: 'Code',
      iconBgColor: primaryAccent,
      type: 'navigation',
      onPress: () => {
        safeHaptic('light');
        router.push('/licenses' as Href);
      },
    },
    {
      id: 'reset',
      title: 'Reset Sandbox Data',
      icon: 'ArrowClockwise',
      iconBgColor: '#F59E0B',
      detail: '₱10,000',
      type: 'navigation',
      onPress: handleResetData,
    },
    {
      id: 'logout',
      title: 'Sign Out',
      icon: 'SignOut',
      iconBgColor: '#EF4444',
      type: 'navigation',
      isDestructive: true,
      onPress: handleSignOut,
    },
  ];

  const CURRENCY_OPTIONS: { id: SupportedCurrency; label: string; symbol: string }[] = [
    { id: 'PHP', label: 'Philippine Peso', symbol: '₱' },
    { id: 'USD', label: 'US Dollar', symbol: '$' },
    { id: 'EUR', label: 'Euro', symbol: '€' },
    { id: 'GBP', label: 'British Pound', symbol: '£' },
  ];

  const LANGUAGE_OPTIONS = [
    { id: 'English (US)', label: 'English (United States)', sub: 'Default app language' },
    { id: 'Filipino (Tagalog)', label: 'Filipino (Tagalog)', sub: 'Pambansang wika' },
  ];

  return (
    <SafeAreaView
      edges={['top']}
      style={[
        styles.container,
        { backgroundColor: isDark ? '#0A0F1D' : '#F8FAFC' },
      ]}
    >
      {/* Top Header */}
      <View style={styles.topHeader}>
        <View style={styles.headerLeftPlaceholder} />
        <Text style={[styles.headerTitle, { color: theme.text }]}>Settings</Text>
        <View style={styles.headerRightPlaceholder} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 24) + 36 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Hero Avatar Section (Clean, centered, matching screenshot) */}
        <View style={styles.profileHeroSection}>
          <TouchableOpacity
            onPress={handleOpenEditProfile}
            activeOpacity={0.8}
            style={[
              styles.avatarContainer,
              {
                backgroundColor: user?.avatarColor || primaryAccent,
                borderColor: isDark ? '#1E293B' : '#FFFFFF',
                shadowColor: primaryAccent,
              },
            ]}
          >
            {user?.avatarEmoji ? (
              <Text style={styles.avatarEmoji}>{user.avatarEmoji}</Text>
            ) : (
              <Text style={styles.avatarInitials}>
                {(user?.name || 'U').slice(0, 2).toUpperCase()}
              </Text>
            )}
          </TouchableOpacity>

          <Text style={[styles.profileName, { color: theme.text }]}>
            {user?.name || 'CBudget Learner'}
          </Text>

          <Text style={[styles.profileEmail, { color: theme.textSecondary }]}>
            {user?.phone || user?.email || 'learner@cbudget.app'}
          </Text>

          {/* Minimal Status Summary Pill */}
          <View
            style={[
              styles.badgeSummaryPill,
              {
                backgroundColor: isDark ? '#131D31' : '#FFFFFF',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0',
              },
            ]}
          >
            <View style={styles.badgePillItem}>
              <Text style={[styles.badgePillLabel, { color: theme.textSecondary }]}>LEVEL</Text>
              <Text style={[styles.badgePillValue, { color: theme.text }]}>{level || 1}</Text>
            </View>
            <View style={[styles.badgePillDivider, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#E2E8F0' }]} />
            <View style={styles.badgePillItem}>
              <Text style={[styles.badgePillLabel, { color: theme.textSecondary }]}>SCORE</Text>
              <Text style={[styles.badgePillValue, { color: primaryAccent }]}>{healthScore}/100</Text>
            </View>
          </View>
        </View>

        {/* Clean, Unified Settings Rows Container (One sleek card canvas, zero clutter!) */}
        <View
          style={[
            styles.unifiedListContainer,
            {
              backgroundColor: isDark ? '#131D31' : '#FFFFFF',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#E2E8F0',
            },
          ]}
        >
          {rows.map((item, index) => {
            const isLast = index === rows.length - 1;
            return (
              <View key={item.id}>
                {item.type === 'switch' ? (
                  <View style={styles.rowItem}>
                    <View style={styles.rowLeftGroup}>
                      <View
                        style={[
                          styles.iconCircle,
                          { backgroundColor: item.iconBgColor || primaryAccent },
                        ]}
                      >
                        <PhosphorIcon name={item.icon} size={18} color="#FFFFFF" weight="bold" />
                      </View>
                      <Text
                        numberOfLines={1}
                        style={[styles.rowTitle, { color: theme.text }]}
                      >
                        {item.title}
                      </Text>
                    </View>

                    <View style={styles.switchRightGroup}>
                      <Text
                        style={[
                          styles.switchStatusLabel,
                          { color: theme.textSecondary },
                        ]}
                      >
                        {item.switchValue ? 'On' : 'Off'}
                      </Text>
                      <Switch
                        value={item.switchValue}
                        onValueChange={item.onToggle}
                        trackColor={{ false: '#CBD5E1', true: primaryAccent }}
                        thumbColor="#FFFFFF"
                      />
                    </View>
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={item.onPress}
                    style={styles.rowItem}
                    activeOpacity={0.65}
                  >
                    <View style={styles.rowLeftGroup}>
                      <View
                        style={[
                          styles.iconCircle,
                          { backgroundColor: item.iconBgColor || primaryAccent },
                        ]}
                      >
                        <PhosphorIcon name={item.icon} size={18} color="#FFFFFF" weight="bold" />
                      </View>
                      <Text
                        numberOfLines={1}
                        style={[
                          styles.rowTitle,
                          {
                            color: item.isDestructive ? '#EF4444' : theme.text,
                          },
                        ]}
                      >
                        {item.title}
                      </Text>
                    </View>

                    <View style={styles.rowRightGroup}>
                      {item.detail && (
                        <Text
                          numberOfLines={1}
                          style={[
                            styles.detailText,
                            { color: theme.textSecondary },
                          ]}
                        >
                          {item.detail}
                        </Text>
                      )}
                      <PhosphorIcon
                        name="CaretRight"
                        size={16}
                        color={theme.textSecondary}
                        weight="bold"
                      />
                    </View>
                  </TouchableOpacity>
                )}

                {!isLast && (
                  <View
                    style={[
                      styles.rowDivider,
                      {
                        backgroundColor: isDark
                          ? 'rgba(255, 255, 255, 0.05)'
                          : '#F1F5F9',
                      },
                    ]}
                  />
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* ==================== EDIT PROFILE MODAL (Screen 2 in screenshot) ==================== */}
      <Modal
        visible={editProfileModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditProfileModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.editProfileSheet,
              {
                backgroundColor: isDark ? '#131D31' : '#FFFFFF',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#E2E8F0',
                paddingBottom: Math.max(insets.bottom, 24) + 16,
              },
            ]}
          >
            {/* Sheet Handle */}
            <View style={styles.sheetHandle} />

            <View style={styles.modalHeaderRow}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Edit Profile</Text>
              <TouchableOpacity
                onPress={() => setEditProfileModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <PhosphorIcon name="X" size={20} color={theme.textSecondary} weight="bold" />
              </TouchableOpacity>
            </View>

            {/* Avatar Centered in Edit View */}
            <View style={styles.editAvatarWrapper}>
              <View
                style={[
                  styles.avatarContainerLarge,
                  {
                    backgroundColor: user?.avatarColor || primaryAccent,
                    borderColor: isDark ? '#1E293B' : '#FFFFFF',
                  },
                ]}
              >
                {user?.avatarEmoji ? (
                  <Text style={styles.avatarEmojiLarge}>{user.avatarEmoji}</Text>
                ) : (
                  <Text style={styles.avatarInitialsLarge}>
                    {(user?.name || 'U').slice(0, 2).toUpperCase()}
                  </Text>
                )}
              </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.editFormScroll}>
              {/* Phone Number Input */}
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: theme.textSecondary }]}>
                  Phone Number
                </Text>
                <View
                  style={[
                    styles.inputContainer,
                    {
                      backgroundColor: isDark ? '#0A0F1D' : '#F8FAFC',
                      borderColor: isDark ? '#1E293B' : '#E2E8F0',
                    },
                  ]}
                >
                  <PhosphorIcon name="Phone" size={18} color={primaryAccent} weight="bold" />
                  <TextInput
                    value={phoneInput}
                    onChangeText={setPhoneInput}
                    placeholder="+63 912 345 6789"
                    placeholderTextColor={theme.textSecondary}
                    keyboardType="phone-pad"
                    style={[styles.formInput, { color: theme.text }]}
                  />
                </View>
              </View>

              {/* Email Address Input */}
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: theme.textSecondary }]}>
                  Email Address
                </Text>
                <View
                  style={[
                    styles.inputContainer,
                    {
                      backgroundColor: isDark ? '#0A0F1D' : '#F8FAFC',
                      borderColor: isDark ? '#1E293B' : '#E2E8F0',
                    },
                  ]}
                >
                  <PhosphorIcon name="EnvelopeSimple" size={18} color={primaryAccent} weight="bold" />
                  <TextInput
                    value={emailInput}
                    onChangeText={setEmailInput}
                    placeholder="learner@cbudget.app"
                    placeholderTextColor={theme.textSecondary}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    style={[styles.formInput, { color: theme.text }]}
                  />
                </View>
              </View>

              {/* Complete Name Input */}
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: theme.textSecondary }]}>
                  Complete Name
                </Text>
                <View
                  style={[
                    styles.inputContainer,
                    {
                      backgroundColor: isDark ? '#0A0F1D' : '#F8FAFC',
                      borderColor: isDark ? '#1E293B' : '#E2E8F0',
                    },
                  ]}
                >
                  <PhosphorIcon name="User" size={18} color={primaryAccent} weight="bold" />
                  <TextInput
                    value={nameInput}
                    onChangeText={setNameInput}
                    placeholder="Enter your full name"
                    placeholderTextColor={theme.textSecondary}
                    style={[styles.formInput, { color: theme.text }]}
                  />
                </View>
              </View>

              {/* Side-by-side City / Region & School / Grade */}
              <View style={styles.formRow}>
                <View style={styles.formRowItem}>
                  <Text style={[styles.formLabel, { color: theme.textSecondary }]}>
                    City / Region
                  </Text>
                  <View
                    style={[
                      styles.inputContainer,
                      {
                        backgroundColor: isDark ? '#0A0F1D' : '#F8FAFC',
                        borderColor: isDark ? '#1E293B' : '#E2E8F0',
                      },
                    ]}
                  >
                    <PhosphorIcon name="MapPin" size={18} color={primaryAccent} weight="bold" />
                    <TextInput
                      value={cityInput}
                      onChangeText={setCityInput}
                      placeholder="e.g. Manila"
                      placeholderTextColor={theme.textSecondary}
                      style={[styles.formInput, { color: theme.text }]}
                    />
                  </View>
                </View>

                <View style={styles.formRowItem}>
                  <Text style={[styles.formLabel, { color: theme.textSecondary }]}>
                    Grade / Level
                  </Text>
                  <View
                    style={[
                      styles.inputContainer,
                      {
                        backgroundColor: isDark ? '#0A0F1D' : '#F8FAFC',
                        borderColor: isDark ? '#1E293B' : '#E2E8F0',
                      },
                    ]}
                  >
                    <PhosphorIcon name="GraduationCap" size={18} color={primaryAccent} weight="bold" />
                    <TextInput
                      value={schoolGradeInput}
                      onChangeText={setSchoolGradeInput}
                      placeholder="e.g. Grade 10"
                      placeholderTextColor={theme.textSecondary}
                      style={[styles.formInput, { color: theme.text }]}
                    />
                  </View>
                </View>
              </View>

              {/* Parent / Guardian Email Input */}
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: theme.textSecondary }]}>
                  Parent / Guardian Email
                </Text>
                <View
                  style={[
                    styles.inputContainer,
                    {
                      backgroundColor: isDark ? '#0A0F1D' : '#F8FAFC',
                      borderColor: isDark ? '#1E293B' : '#E2E8F0',
                    },
                  ]}
                >
                  <PhosphorIcon name="ShieldCheck" size={18} color={primaryAccent} weight="bold" />
                  <TextInput
                    value={guardianInput}
                    onChangeText={setGuardianInput}
                    placeholder="guardian@example.com"
                    placeholderTextColor={theme.textSecondary}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    style={[styles.formInput, { color: theme.text }]}
                  />
                </View>
              </View>

              {/* Update Profile Button */}
              <TouchableOpacity
                onPress={handleSaveProfile}
                disabled={isSavingProfile}
                style={[
                  styles.updateProfileBtn,
                  { backgroundColor: primaryAccent, opacity: isSavingProfile ? 0.7 : 1 },
                ]}
                activeOpacity={0.85}
              >
                <Text style={styles.updateProfileBtnText}>
                  {isSavingProfile ? 'Saving...' : 'Update Profile'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ==================== ACHIEVEMENTS MODAL ==================== */}
      <Modal
        visible={achievementsModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setAchievementsModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.editProfileSheet,
              {
                backgroundColor: isDark ? '#131D31' : '#FFFFFF',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#E2E8F0',
                paddingBottom: Math.max(insets.bottom, 24) + 16,
              },
            ]}
          >
            <View style={styles.sheetHandle} />

            <View style={styles.modalHeaderRow}>
              <View>
                <Text style={[styles.modalTitle, { color: theme.text }]}>
                  Badges & Milestones
                </Text>
                <Text style={[styles.currencySubtitle, { color: theme.textSecondary, marginBottom: 0 }]}>
                  {unlockedCount} of {ALL_ACHIEVEMENTS.length} unlocked in your journey
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setAchievementsModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <PhosphorIcon name="X" size={20} color={theme.textSecondary} weight="bold" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.editFormScroll}>
              <View style={styles.achievementsGrid}>
                {ALL_ACHIEVEMENTS.map((ach) => {
                  const isUnlocked = unlockedAchievements.some((ua) => ua.id === ach.id);
                  return (
                    <View
                      key={ach.id}
                      style={[
                        styles.achievementCard,
                        {
                          backgroundColor: isUnlocked
                            ? isDark
                              ? 'rgba(16, 185, 129, 0.08)'
                              : '#F0FDF4'
                            : isDark
                            ? 'rgba(255, 255, 255, 0.03)'
                            : '#F8FAFC',
                          borderColor: isUnlocked
                            ? primaryAccent
                            : isDark
                            ? '#1E293B'
                            : '#E2E8F0',
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.achievementIconCircle,
                          {
                            backgroundColor: isUnlocked
                              ? primaryAccent
                              : isDark
                              ? '#1E293B'
                              : '#E2E8F0',
                          },
                        ]}
                      >
                        <PhosphorIcon
                          name={ach.icon as PhosphorIconName}
                          size={20}
                          color={isUnlocked ? '#FFFFFF' : theme.textSecondary}
                          weight={isUnlocked ? 'bold' : 'regular'}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.achievementTitle, { color: theme.text }]}>
                          {ach.title}
                        </Text>
                        <Text
                          style={[styles.achievementDesc, { color: theme.textSecondary }]}
                          numberOfLines={2}
                        >
                          {ach.description}
                        </Text>
                      </View>
                      {isUnlocked && (
                        <PhosphorIcon name="CheckCircle" size={18} color={primaryAccent} weight="fill" />
                      )}
                    </View>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ==================== CURRENCY SELECTION MODAL ==================== */}
      <Modal
        visible={currencyModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setCurrencyModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.currencyModalCard,
              {
                backgroundColor: isDark ? '#131D31' : '#FFFFFF',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#E2E8F0',
              },
            ]}
          >
            <View style={styles.modalHeaderRow}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                Select Display Currency
              </Text>
              <TouchableOpacity
                onPress={() => setCurrencyModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <PhosphorIcon name="X" size={20} color={theme.textSecondary} weight="bold" />
              </TouchableOpacity>
            </View>

            <Text
              style={[
                styles.currencySubtitle,
                { color: theme.textSecondary },
              ]}
            >
              Choose your preferred currency symbol. Default is Philippine Peso (₱ PHP).
            </Text>

            <View style={styles.currencyOptionsList}>
              {CURRENCY_OPTIONS.map((item) => {
                const isSelected = currency === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => {
                      safeHaptic('light');
                      setCurrency(item.id);
                      setCurrencyModalVisible(false);
                    }}
                    style={[
                      styles.currencyOptionRow,
                      {
                        backgroundColor: isSelected
                          ? `${primaryAccent}14`
                          : isDark
                          ? 'rgba(255, 255, 255, 0.03)'
                          : '#F8FAFC',
                        borderColor: isSelected ? primaryAccent : isDark ? '#1E293B' : '#E2E8F0',
                      },
                    ]}
                    activeOpacity={0.7}
                  >
                    <View style={styles.currencyLeftGroup}>
                      <View
                        style={[
                          styles.currencySymbolBadge,
                          {
                            backgroundColor: isSelected
                              ? primaryAccent
                              : isDark
                              ? '#1E293B'
                              : '#E2E8F0',
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.currencySymbolText,
                            { color: isSelected ? '#FFFFFF' : theme.text },
                          ]}
                        >
                          {item.symbol}
                        </Text>
                      </View>
                      <View>
                        <Text style={[styles.currencyLabel, { color: theme.text }]}>
                          {item.label}
                        </Text>
                        <Text style={[styles.currencyCodeText, { color: theme.textSecondary }]}>
                          {item.id} {item.id === 'PHP' ? '• Official Default' : ''}
                        </Text>
                      </View>
                    </View>

                    {isSelected && (
                      <PhosphorIcon name="CheckCircle" size={20} color={primaryAccent} weight="fill" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>

      {/* ==================== LANGUAGE MODAL ==================== */}
      <Modal
        visible={languageModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setLanguageModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.currencyModalCard,
              {
                backgroundColor: isDark ? '#131D31' : '#FFFFFF',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#E2E8F0',
              },
            ]}
          >
            <View style={styles.modalHeaderRow}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                Select App Language
              </Text>
              <TouchableOpacity
                onPress={() => setLanguageModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <PhosphorIcon name="X" size={20} color={theme.textSecondary} weight="bold" />
              </TouchableOpacity>
            </View>

            <Text
              style={[
                styles.currencySubtitle,
                { color: theme.textSecondary },
              ]}
            >
              Choose your preferred interface language for CBudget.
            </Text>

            <View style={styles.currencyOptionsList}>
              {LANGUAGE_OPTIONS.map((item) => {
                const isSelected = (language || 'English (US)') === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => {
                      safeHaptic('light');
                      setLanguage(item.id);
                      setLanguageModalVisible(false);
                    }}
                    style={[
                      styles.currencyOptionRow,
                      {
                        backgroundColor: isSelected
                          ? `${primaryAccent}14`
                          : isDark
                          ? 'rgba(255, 255, 255, 0.03)'
                          : '#F8FAFC',
                        borderColor: isSelected ? primaryAccent : isDark ? '#1E293B' : '#E2E8F0',
                      },
                    ]}
                    activeOpacity={0.7}
                  >
                    <View style={styles.currencyLeftGroup}>
                      <View
                        style={[
                          styles.currencySymbolBadge,
                          {
                            backgroundColor: isSelected
                              ? primaryAccent
                              : isDark
                              ? '#1E293B'
                              : '#E2E8F0',
                          },
                        ]}
                      >
                        <PhosphorIcon
                          name="Globe"
                          size={18}
                          color={isSelected ? '#FFFFFF' : theme.text}
                          weight="bold"
                        />
                      </View>
                      <View>
                        <Text style={[styles.currencyLabel, { color: theme.text }]}>
                          {item.label}
                        </Text>
                        <Text style={[styles.currencyCodeText, { color: theme.textSecondary }]}>
                          {item.sub}
                        </Text>
                      </View>
                    </View>

                    {isSelected && (
                      <PhosphorIcon name="CheckCircle" size={20} color={primaryAccent} weight="fill" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>

      {/* Legal & Privacy Policy Modal */}
      <LegalPolicyModal
        visible={legalModalVisible}
        onClose={() => setLegalModalVisible(false)}
        initialTab={legalTab}
        theme={theme}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerLeftPlaceholder: {
    width: 32,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: Fonts.bold,
  },
  headerRightPlaceholder: {
    width: 32,
  },
  scrollContent: {
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  profileHeroSection: {
    alignItems: 'center',
    paddingVertical: 16,
    gap: 6,
  },
  avatarContainer: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    marginBottom: 6,
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
      },
      android: {
        elevation: 6,
      },
      web: {
        boxShadow: '0 6px 16px rgba(16, 185, 129, 0.25)',
      } as any,
    }),
  },
  avatarInitials: {
    color: '#FFFFFF',
    fontSize: 26,
    fontFamily: Fonts.bold,
  },
  avatarEmoji: {
    fontSize: 34,
  },
  profileName: {
    fontSize: 20,
    fontFamily: Fonts.bold,
    letterSpacing: -0.3,
  },
  profileEmail: {
    fontSize: 13,
    fontFamily: Fonts.medium,
  },
  badgeSummaryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 6,
    gap: 12,
  },
  badgePillItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badgePillLabel: {
    fontSize: 10.5,
    fontFamily: Fonts.bold,
    letterSpacing: 0.5,
  },
  badgePillValue: {
    fontSize: 12,
    fontFamily: Fonts.bold,
  },
  badgePillDivider: {
    width: 1,
    height: 12,
  },
  unifiedListContainer: {
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 12,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 4px 14px rgba(0, 0, 0, 0.05)',
      } as any,
    }),
  },
  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  rowLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 8,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTitle: {
    fontSize: 14,
    fontFamily: Fonts.bold,
    letterSpacing: -0.1,
    flexShrink: 1,
  },
  rowRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  detailText: {
    fontSize: 12.5,
    fontFamily: Fonts.medium,
  },
  switchRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  switchStatusLabel: {
    fontSize: 12.5,
    fontFamily: Fonts.medium,
  },
  rowDivider: {
    height: 1,
    marginLeft: 62,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  editProfileSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    maxHeight: '90%',
  },
  sheetHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#94A3B8',
    alignSelf: 'center',
    marginBottom: 12,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: Fonts.bold,
  },
  modalCloseBtn: {
    padding: 6,
  },
  editAvatarWrapper: {
    alignItems: 'center',
    marginVertical: 12,
  },
  avatarContainerLarge: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
  },
  avatarInitialsLarge: {
    color: '#FFFFFF',
    fontSize: 30,
    fontFamily: Fonts.bold,
  },
  avatarEmojiLarge: {
    fontSize: 38,
  },
  editFormScroll: {
    marginTop: 6,
  },
  formGroup: {
    marginBottom: 16,
    gap: 6,
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  formRowItem: {
    flex: 1,
    gap: 6,
  },
  formLabel: {
    fontSize: 12.5,
    fontFamily: Fonts.semiBold,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 50,
  },
  formInput: {
    flex: 1,
    fontSize: 14.5,
    fontFamily: Fonts.medium,
  },
  updateProfileBtn: {
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  updateProfileBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: Fonts.bold,
  },
  achievementsGrid: {
    gap: 10,
    paddingBottom: 24,
  },
  achievementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    gap: 12,
  },
  achievementIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  achievementTitle: {
    fontSize: 14,
    fontFamily: Fonts.bold,
    marginBottom: 2,
  },
  achievementDesc: {
    fontSize: 11.5,
    fontFamily: Fonts.medium,
    lineHeight: 16,
  },
  currencyModalCard: {
    margin: 20,
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    alignSelf: 'center',
    width: '92%',
    maxWidth: 380,
  },
  currencySubtitle: {
    fontSize: 12.5,
    fontFamily: Fonts.medium,
    lineHeight: 18,
    marginBottom: 16,
  },
  currencyOptionsList: {
    gap: 10,
  },
  currencyOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  currencyLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  currencySymbolBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  currencySymbolText: {
    fontSize: 16,
    fontFamily: Fonts.bold,
  },
  currencyLabel: {
    fontSize: 14,
    fontFamily: Fonts.bold,
  },
  currencyCodeText: {
    fontSize: 11.5,
    fontFamily: Fonts.medium,
  },
});
