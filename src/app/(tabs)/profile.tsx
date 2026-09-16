import React, { useState } from 'react';
import { ScrollView, StyleSheet, Alert, Modal, TextInput, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { YStack, XStack, Text, Button, View } from 'tamagui';
import { useAuthStore } from '@/store/authStore';
import { useTheme } from '@/hooks/use-theme';
import { useThemeStore, AccentColor } from '@/store/themeStore';
import { PhosphorIcon, PhosphorIconName } from '@/components/ui/PhosphorIcon';
import { useRouter, Href, useFocusEffect } from 'expo-router';
import { setStatusBarStyle } from 'expo-status-bar';
import { CbudgetCard } from '@/components/ui/CbudgetCard';
import { Spacing, Fonts } from '@/constants/theme';
import Animated, { FadeInDown, FadeIn, ZoomIn } from 'react-native-reanimated';
import { useGamificationStore, ALL_ACHIEVEMENTS } from '@/store/gamificationStore';
import { BackgroundSystem } from '@/components/ui/BackgroundSystem';
import { AppSettingsSection } from '@/features/profile/components/AppSettingsSection';
import { InterfaceModeSwitch } from '@/features/profile/components/InterfaceModeSwitch';
import { LegalPolicyModal } from '@/features/profile/components/LegalPolicyModal';
import { safeHaptic } from '@/utils/haptics';
const getMasteryAvatarDetails = (title: string) => {
  switch (title) {
    case 'Smart Saver':
      return {
        initials: 'SS',
        color: '#10B981', // emerald
        borderColor: 'rgba(16, 185, 129, 0.25)',
        borderStyle: 'solid' as const,
        bg: 'rgba(16, 185, 129, 0.1)',
      };
    case 'Investment Explorer':
      return {
        initials: 'IE',
        color: '#3B82F6', // royal blue
        borderColor: 'rgba(59, 130, 246, 0.25)',
        borderStyle: 'solid' as const,
        bg: 'rgba(59, 130, 246, 0.1)',
      };
    case 'Financial Strategist':
      return {
        initials: 'FS',
        color: '#F59E0B', // amber
        borderColor: 'rgba(245, 158, 11, 0.25)',
        borderStyle: 'solid' as const,
        bg: 'rgba(245, 158, 11, 0.1)',
      };
    case 'Budget Beginner':
    default:
      return {
        initials: 'BB',
        color: '#64748B', // slate
        borderColor: 'rgba(100, 116, 139, 0.25)',
        borderStyle: 'solid' as const,
        bg: 'rgba(100, 116, 139, 0.1)',
      };
  }
};

export default function ProfileScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { mode, setMode, primaryColor, setPrimaryColor } = useThemeStore();
  const { user, logout, isPremium, setPremium, updateProfile, deleteAccount } = useAuthStore();
  const { achievements: unlockedAchievements, customAvatar, getFinancialHealthScore, streakDays, resetAllData } = useGamificationStore();

  useFocusEffect(
    React.useCallback(() => {
      setStatusBarStyle(theme.mode === 'dark' ? 'light' : 'dark');
    }, [theme.mode])
  );

  // Checkout flow states
  const [checkoutVisible, setCheckoutVisible] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState(1); // 1: Comparison, 2: Payment Form, 3: Success
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [paymentLoading, setPaymentLoading] = useState(false);

  // Edit Profile modal states
  const [editProfileVisible, setEditProfileVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editAvatarColor, setEditAvatarColor] = useState('');
  const [editAvatarEmoji, setEditAvatarEmoji] = useState('');

  // Card Inputs
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  // Support, Terms, and Logout Modal states
  const [helpSupportVisible, setHelpSupportVisible] = useState(false);
  const [termsVisible, setTermsVisible] = useState(false);
  const [logoutConfirmVisible, setLogoutConfirmVisible] = useState(false);
  const [supportMessage, setSupportMessage] = useState('');
  const [supportSending, setSupportSending] = useState(false);

  const achievements = ALL_ACHIEVEMENTS.map(ach => ({
    ...ach,
    unlocked: unlockedAchievements.some(ua => ua.id === ach.id)
  }));

  const handleLogout = () => {
    setLogoutConfirmVisible(true);
  };

  const handleResetData = () => {
    Alert.alert(
      'Reset Learning Sandbox',
      'This will revert all your budget metrics, lessons completed, virtual simulator balances, and unlocked achievements back to default settings. Proceed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset Data',
          style: 'destructive',
          onPress: () => {
            resetAllData(10000);
            Alert.alert('Sandbox Reset', 'Your simulated learning metrics have been reset.');
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account Permanently',
      'This will permanently delete your simulated profile, reset your learning metrics, and remove all local login sessions. This action is irreversible. Proceed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: async () => {
            resetAllData(0);
            await deleteAccount();
            Alert.alert('Account Deleted', 'Your profile and data have been wiped.');
            router.replace('/(auth)' as Href);
          },
        },
      ]
    );
  };

  const handleCancelSubscription = () => {
    Alert.alert(
      'Cancel Premium Plan',
      'Are you sure you want to downgrade your account? You will lose access to options simulator, unlocked Investment Lab, and academy certificates at the end of the billing period.',
      [
        { text: 'Keep Premium', style: 'cancel' },
        {
          text: 'Downgrade',
          style: 'destructive',
          onPress: async () => {
            await setPremium(false);
            Alert.alert('Plan Cancelled', 'Your account has been downgraded to the Free Tier.');
          }
        }
      ]
    );
  };

  const handleAchievementPress = (ach: typeof achievements[number]) => {
    Alert.alert(
      ach.title,
      `${ach.description}\n\nStatus: ${ach.unlocked ? 'Unlocked! 🎉' : 'Locked 🔒'}`
    );
  };

  // Credit Card Number Auto-formatting
  const handleCardNumberChange = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    const match = cleaned.match(/.{1,4}/g);
    const formatted = match ? match.join(' ') : cleaned;
    setCardNumber(formatted.slice(0, 19)); // Max 16 digits + 3 spaces
  };

  // Expiry Date Auto-formatting (MM/YY)
  const handleExpiryChange = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    let formatted = cleaned;
    if (cleaned.length >= 2) {
      formatted = `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`;
    }
    setCardExpiry(formatted.slice(0, 5));
  };

  // Card Network detection
  const getCardNetwork = (number: string) => {
    const cleanNum = number.replace(/\s/g, '');
    if (cleanNum.startsWith('4')) return 'visa';
    if (cleanNum.startsWith('5')) return 'mastercard';
    if (cleanNum.startsWith('3')) return 'amex';
    return 'generic';
  };

  const validatePayment = () => {
    if (!cardName.trim()) {
      Alert.alert('Validation Error', 'Please enter the cardholder name.');
      return false;
    }
    if (cardNumber.replace(/\s/g, '').length !== 16) {
      Alert.alert('Validation Error', 'Please enter a valid 16-digit credit card number.');
      return false;
    }
    if (cardExpiry.length !== 5 || !cardExpiry.includes('/')) {
      Alert.alert('Validation Error', 'Please enter a valid expiration date (MM/YY).');
      return false;
    }
    const [month, year] = cardExpiry.split('/');
    const m = parseInt(month, 10);
    if (m < 1 || m > 12) {
      Alert.alert('Validation Error', 'Please enter a valid month (01-12).');
      return false;
    }
    if (cardCvv.length < 3) {
      Alert.alert('Validation Error', 'Please enter a valid CVV.');
      return false;
    }
    return true;
  };

  const handlePayAndSubscribe = async () => {
    if (!validatePayment()) return;

    setPaymentLoading(true);
    // Simulate secure bank payment processing
    setTimeout(() => {
      setPaymentLoading(false);
      setCheckoutStep(3); // Success Screen
    }, 1800);
  };

  const handleActivatePremium = async () => {
    await setPremium(true);
    setCheckoutVisible(false);
    // Reset form states
    setCheckoutStep(1);
    setCardName('');
    setCardNumber('');
    setCardExpiry('');
    setCardCvv('');
    Alert.alert('Premium Active!', 'Welcome to Cbudget Premium. Enjoy your unlimited sandbox and unlocked Investment Lab tools!');
  };

  const avatarDetails = getMasteryAvatarDetails(customAvatar);
  const cardNetwork = getCardNetwork(cardNumber);

  // Compute initials fallback
  const getInitials = (name: string) => {
    if (!name) return 'BB';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase().slice(0, 2);
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <YStack flex={1} backgroundColor={theme.background}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        {/* ==================== EXECUTIVE TOP SCREEN HEADER ==================== */}
        <View style={styles.topHeaderBar}>
          <YStack gap={2}>
            <Text color={theme.text} fontSize={22} style={{ fontFamily: Fonts.bold }} letterSpacing={-0.4}>
              Profile & Account
            </Text>
            <Text color={theme.textSecondary} fontSize={11.5} style={{ fontFamily: Fonts.medium }}>
              Walletly Sandbox • Identity & Preferences
            </Text>
          </YStack>

          <View style={[styles.topStatusPill, { backgroundColor: theme.mode === 'hybrid' || theme.mode === 'light' ? '#FFFFFF' : '#131D31', borderWidth: 1, borderColor: theme.border }]}>
            <View width={6} height={6} borderRadius={3} backgroundColor="#10B981" />
            <Text color={theme.text} fontSize={11} style={{ fontFamily: Fonts.bold, letterSpacing: 0.4 }}>
              Active
            </Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* User Profile Card */}
          <CbudgetCard
            padding={20}
            marginBottom={Spacing[16]}
            alignItems="center"
            gap={16}
            backgroundColor={theme.mode === 'dark' ? '#1C2541' : '#FFFFFF'}
            borderWidth={theme.mode === 'dark' ? 1 : 0}
            borderColor={theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.06)' : 'transparent'}
            borderRadius={18}
          >
            <YStack alignItems="center" gap={12}>
              {/* Mastery Rank Avatar Ring */}
              <View
                style={{
                  width: 86,
                  height: 86,
                  borderRadius: 43,
                  backgroundColor: user?.avatarColor || avatarDetails.bg,
                  borderWidth: 2,
                  borderColor: user?.avatarColor ? `${user.avatarColor}40` : avatarDetails.borderColor,
                  borderStyle: 'solid',
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.1,
                  shadowRadius: 8,
                  elevation: 3,
                }}
              >
                {user?.avatarEmoji ? (
                  <Text fontSize={38}>{user.avatarEmoji}</Text>
                ) : (
                  <Text color="#FFFFFF" fontSize={26} style={{ fontFamily: Fonts.bold }}>
                    {getInitials(user?.name || '')}
                  </Text>
                )}
              </View>

              <YStack alignItems="center" gap={4}>
                <Text color={theme.text} fontSize={22} style={{ fontFamily: Fonts.bold }} letterSpacing={-0.3}>
                  {user?.name || 'User'}
                </Text>
                <Text color={theme.textSecondary} fontSize={13} style={{ fontFamily: Fonts.medium }}>
                  {user?.email || 'user@example.com'}
                </Text>

                <XStack gap={8} alignItems="center" marginTop={8}>
                  {/* Edit Profile Action Button */}
                  <TouchableOpacity
                    onPress={() => {
                      setEditName(user?.name || '');
                      setEditEmail(user?.email || '');
                      setEditAvatarColor(user?.avatarColor || '#14B8A6');
                      setEditAvatarEmoji(user?.avatarEmoji || '💼');
                      setEditProfileVisible(true);
                    }}
                    activeOpacity={0.75}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                      backgroundColor: theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.06)' : theme.backgroundElement,
                      borderWidth: 1,
                      borderColor: theme.border,
                      paddingHorizontal: 11,
                      paddingVertical: 5,
                      borderRadius: 8,
                    }}
                  >
                    <PhosphorIcon name="Pencil" size={12} color={theme.textSecondary} weight="bold" />
                    <Text color={theme.text} fontSize={11.5} style={{ fontFamily: Fonts.semiBold }}>
                      Edit Profile
                    </Text>
                  </TouchableOpacity>

                  {/* Mastery Rank Badge */}
                  <XStack
                    backgroundColor={`${avatarDetails.color}15` as any}
                    borderRadius={8}
                    paddingHorizontal={9}
                    paddingVertical={5}
                    alignItems="center"
                    gap={5}
                  >
                    <PhosphorIcon
                      name="Crown"
                      size={12}
                      color={avatarDetails.color as any}
                      weight="fill"
                    />
                    <Text color={avatarDetails.color as any} fontSize={10.5} style={{ fontFamily: Fonts.bold }} letterSpacing={0.4}>
                      {customAvatar.toUpperCase()}
                    </Text>
                  </XStack>
                </XStack>
              </YStack>
            </YStack>

            {/* Quick Metrics Container */}
            <XStack
              width="100%"
              justifyContent="space-between"
              paddingVertical={12}
              paddingHorizontal={8}
              backgroundColor={theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.04)' : theme.backgroundElement}
              borderRadius={12}
              borderWidth={0}
            >
              <YStack flex={1} alignItems="center" gap={3}>
                <Text color={theme.textSecondary} fontSize={10} style={{ fontFamily: Fonts.bold }} letterSpacing={0.6} textTransform="uppercase">
                  Academy Score
                </Text>
                <Text color={theme.text} fontSize={16} style={{ fontFamily: Fonts.bold }}>
                  {getFinancialHealthScore()} <Text color={theme.textSecondary} fontSize={12} style={{ fontFamily: Fonts.regular }}>/ 100</Text>
                </Text>
              </YStack>

              <View width={1} backgroundColor={theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)'} marginVertical={4} />

              <YStack flex={1} alignItems="center" gap={3}>
                <Text color={theme.textSecondary} fontSize={10} style={{ fontFamily: Fonts.bold }} letterSpacing={0.6} textTransform="uppercase">
                  Badges
                </Text>
                <Text color={theme.text} fontSize={16} style={{ fontFamily: Fonts.bold }}>
                  {unlockedAchievements.length} <Text color={theme.textSecondary} fontSize={12} style={{ fontFamily: Fonts.regular }}>/ {ALL_ACHIEVEMENTS.length}</Text>
                </Text>
              </YStack>

              <View width={1} backgroundColor={theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)'} marginVertical={4} />

              <YStack flex={1} alignItems="center" gap={3}>
                <Text color={theme.textSecondary} fontSize={10} style={{ fontFamily: Fonts.bold }} letterSpacing={0.6} textTransform="uppercase">
                  Streak
                </Text>
                <Text color="#F59E0B" fontSize={16} style={{ fontFamily: Fonts.bold }}>
                  🔥 {streakDays}d
                </Text>
              </YStack>
            </XStack>
          </CbudgetCard>

          {/* App Appearance & Customization Panel */}
          <YStack gap={10} marginBottom={Spacing[24]}>
            <Text color={theme.text} fontSize={16} style={{ fontFamily: Fonts.bold }} paddingHorizontal={2}>
              Appearance & Theme
            </Text>

            <CbudgetCard padding={16} gap={16}>
              {/* Theme Mode Selector (Hybrid / Dark / Light) - Smooth Animated Switch */}
              <YStack gap={8}>
                <Text color={theme.textSecondary} fontSize={11.5} style={{ fontFamily: Fonts.bold }} letterSpacing={0.5} textTransform="uppercase">
                  Interface Mode
                </Text>
                <InterfaceModeSwitch
                  currentMode={mode}
                  onSelectMode={(newMode) => {
                    setMode(newMode);
                  }}
                />
              </YStack>

              {/* Accent Color Palette */}
              <YStack gap={8} style={{ borderTopWidth: 1, borderTopColor: theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)', paddingTop: 12 }}>
                <XStack justifyContent="space-between" alignItems="center">
                  <Text color={theme.textSecondary} fontSize={12} style={{ fontFamily: Fonts.bold }} letterSpacing={0.4} textTransform="uppercase">
                    Accent Color
                  </Text>
                  <Text color={theme.textSecondary} fontSize={11} style={{ fontFamily: Fonts.medium }}>
                    {primaryColor.charAt(0).toUpperCase() + primaryColor.slice(1)}
                  </Text>
                </XStack>

                <XStack gap={12} alignItems="center" paddingVertical={4}>
                  {[
                    { name: 'green' as const, hex: '#10B981', label: 'Emerald' },
                    { name: 'sky' as const, hex: '#0EA5E9', label: 'Sky' },
                    { name: 'teal' as const, hex: '#14B8A6', label: 'Teal' },
                    { name: 'purple' as const, hex: '#8B5CF6', label: 'Purple' },
                    { name: 'rose' as const, hex: '#F43F5E', label: 'Rose' },
                    { name: 'orange' as const, hex: '#F97316', label: 'Orange' },
                  ].map((col) => {
                    const isSelected = primaryColor === col.name;
                    return (
                      <TouchableOpacity
                        key={col.name}
                        onPress={() => {
                          safeHaptic('light');
                          setPrimaryColor(col.name);
                        }}
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 18,
                          backgroundColor: col.hex,
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderWidth: isSelected ? 2.5 : 0,
                          borderColor: isSelected ? (theme.mode === 'dark' ? '#FFFFFF' : '#0F172A') : 'transparent',
                          shadowColor: col.hex,
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: isSelected ? 0.35 : 0.1,
                          shadowRadius: 4,
                          elevation: 2,
                        }}
                        activeOpacity={0.7}
                      >
                        {isSelected && (
                          <PhosphorIcon name="Check" size={14} color="#FFFFFF" weight="bold" />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </XStack>
              </YStack>
            </CbudgetCard>
          </YStack>

          {/* Preferences & System Settings */}
          <View marginBottom={Spacing[24]}>
            <AppSettingsSection theme={theme} />
          </View>

          {/* Achievement Showcase */}
          <YStack gap={12} marginBottom={Spacing[24]}>
            <Text color={theme.text} fontSize={16} style={{ fontFamily: Fonts.bold }} paddingHorizontal={2}>
              Academy Achievements
            </Text>

            <XStack flexWrap="wrap" justifyContent="space-between" gap={8}>
              {achievements.map((ach, index) => {
                const cardBg = ach.unlocked ? (theme.mode === 'dark' ? '#1C2541' : theme.surface) : theme.backgroundElement;
                const borderCol = ach.unlocked ? `${ach.color}40` as any : theme.border;
                const iconBg = ach.unlocked ? `${ach.color}18` as any : (theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : theme.border);
                const iconColor = ach.unlocked ? ach.color : theme.textSecondary;
                const textColor = ach.unlocked ? theme.text : theme.textSecondary;

                return (
                  <View key={ach.id} style={{ width: '48.5%' }}>
                    <Button
                      padding={0}
                      height="auto"
                      backgroundColor="transparent"
                      pressStyle={{ opacity: 0.9 }}
                      onPress={() => handleAchievementPress(ach)}
                      borderWidth={0}
                      width="100%"
                    >
                      <CbudgetCard
                        width="100%"
                        padding={16}
                        alignItems="center"
                        backgroundColor={cardBg}
                        borderWidth={ach.unlocked ? 1 : 0}
                        borderColor={ach.unlocked ? `${ach.color}25` as any : 'transparent'}
                        gap={8}
                      >
                        <YStack
                          width={44}
                          height={44}
                          borderRadius={22}
                          backgroundColor={iconBg}
                          alignItems="center"
                          justifyContent="center"
                        >
                          <PhosphorIcon
                            name={ach.icon as PhosphorIconName}
                            size={22}
                            color={iconColor}
                            weight="fill"
                          />
                        </YStack>
                        <YStack gap={2} alignItems="center">
                          <XStack gap={4} alignItems="center" justifyContent="center">
                            <Text
                              color={textColor}
                              fontSize={12}
                              style={{ fontFamily: Fonts.bold }}
                              textAlign="center"
                              numberOfLines={1}
                            >
                              {ach.title}
                            </Text>
                            {!ach.unlocked && (
                              <PhosphorIcon
                                name="Lock"
                                size={11}
                                color={theme.textSecondary}
                              />
                            )}
                          </XStack>
                          <Text
                            color={theme.textSecondary}
                            fontSize={10}
                            style={{ fontFamily: Fonts.regular }}
                            textAlign="center"
                            numberOfLines={2}
                            lineHeight={14}
                          >
                            {ach.description}
                          </Text>
                        </YStack>
                      </CbudgetCard>
                    </Button>
                  </View>
                );
              })}
            </XStack>
          </YStack>

          {/* Settings / Actions List */}
          <View>
            <YStack gap={Spacing[16]} marginBottom={Spacing[24]}>
              <CbudgetCard padding={0} overflow="hidden">
                {/* Help & Support */}
                <Button
                  backgroundColor="transparent"
                  pressStyle={{ backgroundColor: `${theme.text}06` as any }}
                  onPress={() => setHelpSupportVisible(true)}
                  borderWidth={0}
                  borderRadius={0}
                  height={54}
                  paddingHorizontal={16}
                >
                  <XStack alignItems="center" gap={12} width="100%">
                    <PhosphorIcon
                      name="Question"
                      size={20}
                      color={theme.textSecondary}
                    />
                    <Text color={theme.text} fontSize={14.5} style={{ fontFamily: Fonts.bold }} flex={1} textAlign="left">
                      Help & Academy Support
                    </Text>
                    <PhosphorIcon
                      name="CaretRight"
                      size={14}
                      color={theme.textSecondary}
                    />
                  </XStack>
                </Button>

                {/* Privacy Policy */}
                <Button
                  backgroundColor="transparent"
                  pressStyle={{ backgroundColor: `${theme.text}06` as any }}
                  onPress={() => setTermsVisible(true)}
                  borderWidth={0}
                  borderRadius={0}
                  height={54}
                  paddingHorizontal={16}
                  borderTopWidth={1}
                  borderTopColor={theme.border}
                >
                  <XStack alignItems="center" gap={12} width="100%">
                    <PhosphorIcon
                      name="FileText"
                      size={20}
                      color={theme.textSecondary}
                    />
                    <Text color={theme.text} fontSize={14.5} style={{ fontFamily: Fonts.bold }} flex={1} textAlign="left">
                      Terms & Privacy Policy
                    </Text>
                    <PhosphorIcon
                      name="CaretRight"
                      size={14}
                      color={theme.textSecondary}
                    />
                  </XStack>
                </Button>

                {/* Open Source Licenses */}
                <Button
                  backgroundColor="transparent"
                  pressStyle={{ backgroundColor: `${theme.text}06` as any }}
                  onPress={() => router.push('/licenses' as Href)}
                  borderWidth={0}
                  borderRadius={0}
                  height={54}
                  paddingHorizontal={16}
                  borderTopWidth={1}
                  borderTopColor={theme.border}
                >
                  <XStack alignItems="center" gap={12} width="100%">
                    <PhosphorIcon
                      name="Code"
                      size={20}
                      color={theme.textSecondary}
                    />
                    <Text color={theme.text} fontSize={14.5} style={{ fontFamily: Fonts.bold }} flex={1} textAlign="left">
                      Open Source Licenses
                    </Text>
                    <PhosphorIcon
                      name="CaretRight"
                      size={14}
                      color={theme.textSecondary}
                    />
                  </XStack>
                </Button>
              </CbudgetCard>
            </YStack>
          </View>

          {/* Simulated Account Settings */}
          <View>
            <CbudgetCard marginBottom={Spacing[24]} gap={12} padding={16}>
              <Text color={theme.text} fontSize={15} style={{ fontFamily: Fonts.bold }} paddingHorizontal={4} marginBottom={4}>
                Simulated Sandbox Account
              </Text>
              
              <YStack gap={8}>
                {/* Reset Data */}
                <Button
                  backgroundColor={theme.backgroundElement}
                  borderWidth={0}
                  pressStyle={{ opacity: 0.8 }}
                  borderRadius={10}
                  height={44}
                  onPress={handleResetData}
                >
                  <XStack gap={8} alignItems="center" justifyContent="center">
                    <PhosphorIcon
                      name="ArrowClockwise"
                      size={14}
                      color={theme.text}
                    />
                    <Text color={theme.text} fontSize={14} style={{ fontFamily: Fonts.semiBold }}>
                      Reset Sandbox Data
                    </Text>
                  </XStack>
                </Button>

                {/* Sign Out */}
                <Button
                  backgroundColor={theme.backgroundElement}
                  borderWidth={0}
                  pressStyle={{ opacity: 0.8 }}
                  borderRadius={10}
                  height={44}
                  onPress={handleLogout}
                >
                  <XStack gap={8} alignItems="center" justifyContent="center">
                    <PhosphorIcon
                      name="Power"
                      size={14}
                      color={theme.text}
                    />
                    <Text color={theme.text} fontSize={14} style={{ fontFamily: Fonts.semiBold }}>
                      Sign Out
                    </Text>
                  </XStack>
                </Button>

                {/* Delete Account */}
                <Button
                  backgroundColor="rgba(239, 68, 68, 0.06)"
                  borderColor="rgba(239, 68, 68, 0.2)"
                  borderWidth={1}
                  pressStyle={{ opacity: 0.8 }}
                  borderRadius={10}
                  height={44}
                  onPress={handleDeleteAccount}
                >
                  <XStack gap={8} alignItems="center" justifyContent="center">
                    <PhosphorIcon
                      name="Trash"
                      size={14}
                      color="#EF4444"
                    />
                    <Text color="#EF4444" fontSize={14} style={{ fontFamily: Fonts.bold }}>
                      Delete Sandbox Account
                    </Text>
                  </XStack>
                </Button>
              </YStack>
            </CbudgetCard>
          </View>

        </ScrollView>
      </SafeAreaView>

      {/* EDIT PROFILE MODAL */}
      <Modal
        visible={editProfileVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditProfileVisible(false)}
      >
        <YStack flex={1} backgroundColor="rgba(15, 23, 42, 0.7)" justifyContent="flex-end">
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setEditProfileVisible(false)} />
          <YStack
            backgroundColor={theme.surface}
            borderTopLeftRadius={24}
            borderTopRightRadius={24}
            maxHeight="90%"
            paddingHorizontal={Spacing[24]}
            paddingTop={Spacing[24]}
            paddingBottom={Platform.OS === 'ios' ? 44 : 24}
            gap={16}
            elevation={10}
            shadowColor="#000"
            shadowOffset={{ width: 0, height: -8 }}
            shadowOpacity={0.15}
            shadowRadius={24}
          >
            <XStack justifyContent="space-between" alignItems="center">
              <Text fontSize={18} style={{ fontFamily: Fonts.bold }} color={theme.text}>Edit Sandbox Profile</Text>
              <TouchableOpacity onPress={() => setEditProfileVisible(false)} style={{ padding: 4 }}>
                <PhosphorIcon name="X" size={18} color={theme.textSecondary} weight="bold" />
              </TouchableOpacity>
            </XStack>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <YStack gap={16}>
                
                {/* Avatar Designer Section */}
                <YStack alignItems="center" gap={8} backgroundColor={theme.backgroundElement} padding={12} borderRadius={16}>
                  <Text color={theme.textSecondary} fontSize={10} fontWeight="800" textTransform="uppercase" letterSpacing={0.8}>
                    DESIGN AVATAR
                  </Text>
                  
                  {/* Live Avatar Preview */}
                  <View
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: 40,
                      backgroundColor: editAvatarColor,
                      alignItems: 'center',
                      justifyContent: 'center',
                      shadowColor: editAvatarColor,
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.3,
                      shadowRadius: 8,
                      elevation: 5
                    } as any}
                  >
                    {editAvatarEmoji ? (
                      <Text fontSize={36}>{editAvatarEmoji}</Text>
                    ) : (
                      <Text color="#FFFFFF" fontSize={24} fontWeight="800">
                        {editName ? getInitials(editName) : 'BB'}
                      </Text>
                    )}
                  </View>

                  {/* Emojis Selector Grid */}
                  <YStack gap={4} width="100%" alignItems="center" marginTop={4}>
                    <Text color={theme.textSecondary} fontSize={10} fontWeight="600">Select Icon Emoji</Text>
                    <XStack gap={8} justifyContent="center" flexWrap="wrap" paddingVertical={4}>
                      {['💼', '📈', '🚀', '💡', '💰', '🎓', '👑', '🧠'].map((emoji) => {
                        const isSelected = editAvatarEmoji === emoji;
                        return (
                          <TouchableOpacity
                            key={emoji}
                            onPress={() => setEditAvatarEmoji(emoji)}
                            style={{
                              width: 34,
                              height: 34,
                              borderRadius: 8,
                              alignItems: 'center',
                              justifyContent: 'center',
                              backgroundColor: isSelected ? theme.backgroundSelected : 'rgba(255,255,255,0.4)',
                              borderWidth: 1.5,
                              borderColor: isSelected ? theme.primary : 'transparent'
                            }}
                          >
                            <Text fontSize={20}>{emoji}</Text>
                          </TouchableOpacity>
                        );
                      })}
                      <TouchableOpacity
                        onPress={() => setEditAvatarEmoji('')}
                        style={{
                          width: 44,
                          height: 34,
                          borderRadius: 8,
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: editAvatarEmoji === '' ? theme.backgroundSelected : 'rgba(255,255,255,0.4)',
                          borderWidth: 1.5,
                          borderColor: editAvatarEmoji === '' ? theme.primary : 'transparent'
                        } as any}
                      >
                        <Text fontSize={10} fontWeight="800" color={theme.textSecondary}>INITIALS</Text>
                      </TouchableOpacity>
                    </XStack>
                  </YStack>

                  {/* Colors Selector Grid */}
                  <YStack gap={4} width="100%" alignItems="center" marginTop={4}>
                    <Text color={theme.textSecondary} fontSize={10} fontWeight="600">Select Background Color</Text>
                    <XStack gap={10} justifyContent="center" paddingVertical={4}>
                      {['#14B8A6', '#0EA5E9', '#8B5CF6', '#F43F5E', '#F97316', '#64748B'].map((color) => {
                        const isSelected = editAvatarColor === color;
                        return (
                          <TouchableOpacity
                            key={color}
                            onPress={() => setEditAvatarColor(color)}
                            style={{
                              width: 28,
                              height: 28,
                              borderRadius: 14,
                              backgroundColor: color,
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderWidth: 3,
                              borderColor: isSelected ? '#FFFFFF' : 'transparent',
                            }}
                          />
                        );
                      })}
                    </XStack>
                  </YStack>
                </YStack>

                {/* Profile Fields */}
                <YStack gap={12}>
                  <YStack gap={4}>
                    <Text color={theme.text} fontSize={12} fontWeight="700">Full Name</Text>
                    <TextInput
                      value={editName}
                      onChangeText={setEditName}
                      style={[styles.inputField, { borderColor: theme.border, color: theme.text, backgroundColor: theme.backgroundElement }]}
                      placeholder="Your Full Name"
                      placeholderTextColor={`${theme.text}35`}
                    />
                  </YStack>

                  <YStack gap={4}>
                    <Text color={theme.text} fontSize={12} fontWeight="700">Email Address</Text>
                    <TextInput
                      value={editEmail}
                      onChangeText={setEditEmail}
                      keyboardType="email-address"
                      style={[styles.inputField, { borderColor: theme.border, color: theme.text, backgroundColor: theme.backgroundElement }]}
                      placeholder="name@example.com"
                      placeholderTextColor={`${theme.text}35`}
                    />
                  </YStack>
                </YStack>

                <Button
                  height={48}
                  backgroundColor={theme.primary as any}
                  borderRadius={12}
                  color="#FFFFFF"
                  fontWeight="700"
                  fontSize={14}
                  pressStyle={{ opacity: 0.9 }}
                  onPress={async () => {
                    if (!editName.trim()) {
                      Alert.alert('Validation Error', 'Please enter your name.');
                      return;
                    }
                    if (!editEmail.trim() || !editEmail.includes('@')) {
                      Alert.alert('Validation Error', 'Please enter a valid email address.');
                      return;
                    }
                    try {
                      await updateProfile(editName, editEmail, editAvatarColor, editAvatarEmoji);
                      setEditProfileVisible(false);
                      Alert.alert('Profile Saved', 'Your profile preferences have been successfully updated.');
                    } catch (err: any) {
                      Alert.alert('Save Failed', err.message || 'Unable to update profile.');
                    }
                  }}
                  marginTop={6}
                >
                  Save Changes
                </Button>
              </YStack>
            </ScrollView>
          </YStack>
        </YStack>
      </Modal>

      {/* MULTI-STEP CHECKOUT MODAL */}
      <Modal
        visible={checkoutVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setCheckoutVisible(false)}
      >
        <YStack flex={1} backgroundColor="rgba(15, 23, 42, 0.7)" justifyContent="flex-end">
          {/* Dismiss keyboard / tap away to close (only on step 1 or 3) */}
          <TouchableOpacity 
            style={{ flex: 1 }}
            activeOpacity={1}
            disabled={checkoutStep === 2}
            onPress={() => setCheckoutVisible(false)}
          />
          
          <YStack
            backgroundColor={theme.surface}
            borderTopLeftRadius={24}
            borderTopRightRadius={24}
            maxHeight="90%"
            paddingHorizontal={Spacing[24]}
            paddingTop={Spacing[24]}
            paddingBottom={Platform.OS === 'ios' ? 44 : 24}
            shadowColor="#0F172A"
            shadowOffset={{ width: 0, height: -8 }}
            shadowOpacity={0.15}
            shadowRadius={24}
            elevation={10}
            gap={16}
          >
            {/* Modal Header */}
            <XStack justifyContent="space-between" alignItems="center">
              <Text fontSize={18} fontWeight="800" color={theme.text}>
                {checkoutStep === 1 && 'Select Premium Plan'}
                {checkoutStep === 2 && 'Secure Checkout'}
                {checkoutStep === 3 && 'Cbudget Pro Active!'}
              </Text>
              {checkoutStep !== 2 && (
                <TouchableOpacity onPress={() => setCheckoutVisible(false)} style={{ padding: 4 }}>
                  <Text fontSize={22} fontWeight="600" color={theme.textSecondary}>×</Text>
                </TouchableOpacity>
              )}
            </XStack>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {/* STEP 1: PLAN SELECTION & BENEFITS */}
              {checkoutStep === 1 && (
                <Animated.View entering={FadeIn.duration(300)} style={{ gap: 16 }}>
                  {/* Benefits comparison */}
                  <YStack gap={8} backgroundColor={theme.backgroundElement} padding={12} borderRadius={16} borderWidth={1} borderColor={theme.border}>
                    <Text fontSize={12} fontWeight="800" color="#F59E0B" letterSpacing={0.5}>BENEFITS COMPARISON</Text>
                    {[
                      { name: 'Virtual Cash & Stock Trades', free: true, pro: true },
                      { name: 'Options, Cryptos, & Margin Trading', free: false, pro: true },
                      { name: 'Unlocked Investment Lab', free: false, pro: true },
                      { name: 'Unlimited Savings & Custom Goals', free: false, pro: true },
                      { name: 'Certified Milestones & Pathways', free: false, pro: true },
                    ].map((feature, i) => (
                      <XStack key={i} justifyContent="space-between" alignItems="center" paddingVertical={4}>
                        <Text fontSize={13} color={theme.text} flex={1}>{feature.name}</Text>
                        <XStack gap={16} alignItems="center">
                          <PhosphorIcon
                            name={feature.free ? 'CheckCircle' : 'XCircle'}
                            size={14}
                            color={feature.free ? theme.textSecondary : theme.error}
                            weight="fill"
                          />
                          <PhosphorIcon
                            name="CheckCircle"
                            size={14}
                            color="#F59E0B"
                            weight="fill"
                          />
                        </XStack>
                      </XStack>
                    ))}
                  </YStack>

                  {/* Plan Options */}
                  <YStack gap={10}>
                    {/* Monthly */}
                    <TouchableOpacity
                      onPress={() => setBillingCycle('monthly')}
                      style={[
                        styles.planCard,
                        {
                          borderColor: billingCycle === 'monthly' ? '#F59E0B' : theme.border,
                          backgroundColor: theme.surface
                        }
                      ]}
                    >
                      <XStack gap={12} alignItems="center">
                        <View style={[styles.radio, { borderColor: billingCycle === 'monthly' ? '#F59E0B' : theme.border }]}>
                          {billingCycle === 'monthly' && <View style={styles.radioSelected} />}
                        </View>
                        <YStack flex={1}>
                          <Text color={theme.text} fontWeight="700" fontSize={15}>Monthly Plan</Text>
                          <Text color={theme.textSecondary} fontSize={12}>Billed monthly, cancel anytime</Text>
                        </YStack>
                        <Text color={theme.text} fontWeight="800" fontSize={16}>₱249/mo</Text>
                      </XStack>
                    </TouchableOpacity>

                    {/* Yearly */}
                    <TouchableOpacity
                      onPress={() => setBillingCycle('yearly')}
                      style={[
                        styles.planCard,
                        {
                          borderColor: billingCycle === 'yearly' ? '#F59E0B' : theme.border,
                          backgroundColor: theme.surface
                        }
                      ]}
                    >
                      <XStack gap={12} alignItems="center">
                        <View style={[styles.radio, { borderColor: billingCycle === 'yearly' ? '#F59E0B' : theme.border }]}>
                          {billingCycle === 'yearly' && <View style={styles.radioSelected} />}
                        </View>
                        <YStack flex={1}>
                          <XStack gap={6} alignItems="center">
                            <Text color={theme.text} fontWeight="700" fontSize={15}>Yearly Plan</Text>
                             <View backgroundColor={theme.primary as any} paddingHorizontal={6} paddingVertical={2} borderRadius={6}>
                              <Text color="#FFFFFF" fontSize={9} fontWeight="800">SAVE 33%</Text>
                            </View>
                          </XStack>
                          <Text color={theme.textSecondary} fontSize={12}>₱165/mo equivalent, billed yearly</Text>
                        </YStack>
                        <YStack alignItems="flex-end">
                          <Text color={theme.text} fontWeight="800" fontSize={16}>₱1,990/yr</Text>
                        </YStack>
                      </XStack>
                    </TouchableOpacity>
                  </YStack>

                  <Button
                    height={50}
                    backgroundColor="#F59E0B"
                    borderRadius={12}
                    color="#FFFFFF"
                    fontWeight="700"
                    fontSize={15}
                    pressStyle={{ opacity: 0.9 }}
                    onPress={() => setCheckoutStep(2)}
                    marginTop={8}
                  >
                    Proceed to Payment
                  </Button>
                </Animated.View>
              )}

              {/* STEP 2: CREDIT CARD SECURE FORM */}
              {checkoutStep === 2 && (
                <Animated.View entering={FadeIn.duration(300)} style={{ gap: 16 }}>
                  
                  {/* Credit Card Preview Screen */}
                  <View style={[styles.creditCardPreview, { backgroundColor: cardNetwork === 'visa' ? '#1E3A8A' : cardNetwork === 'mastercard' ? '#3B0764' : cardNetwork === 'amex' ? '#065F46' : '#1E293B' }]}>
                    {/* Glossy Overlay/Chips */}
                    <XStack justifyContent="space-between" alignItems="center">
                      <View style={styles.chip} />
                      <XStack gap={6}>
                        {cardNetwork === 'visa' && <Text color="#FFFFFF" fontSize={18} fontWeight="900" fontStyle="italic">VISA</Text>}
                        {cardNetwork === 'mastercard' && <Text color="#FFFFFF" fontSize={18} fontWeight="900" fontStyle="italic">MC</Text>}
                        {cardNetwork === 'amex' && <Text color="#FFFFFF" fontSize={18} fontWeight="900" fontStyle="italic">AMEX</Text>}
                        {cardNetwork === 'generic' && <PhosphorIcon name="CreditCard" size={20} color="#FFFFFF" />}
                      </XStack>
                    </XStack>
                    
                    <YStack gap={10} marginTop={12}>
                      {/* Card Number */}
                      <Text color="#FFFFFF" fontSize={18} fontWeight="bold" letterSpacing={2}>
                        {cardNumber || '•••• •••• •••• ••••'}
                      </Text>
                      
                      {/* Expiry & Holder */}
                      <XStack justifyContent="space-between" alignItems="center">
                        <YStack gap={2}>
                          <Text color="rgba(255, 255, 255, 0.5)" fontSize={8} fontWeight="600" textTransform="uppercase">Cardholder Name</Text>
                          <Text color="#FFFFFF" fontSize={12} fontWeight="bold" numberOfLines={1}>
                            {cardName.toUpperCase() || 'CARDHOLDER NAME'}
                          </Text>
                        </YStack>
                        <YStack gap={2} alignItems="flex-end">
                          <Text color="rgba(255, 255, 255, 0.5)" fontSize={8} fontWeight="600" textTransform="uppercase">Expires</Text>
                          <Text color="#FFFFFF" fontSize={12} fontWeight="bold">
                            {cardExpiry || 'MM/YY'}
                          </Text>
                        </YStack>
                      </XStack>
                    </YStack>
                  </View>

                  {/* Form Inputs */}
                  <YStack gap={12}>
                    <YStack gap={4}>
                      <Text color={theme.text} fontSize={12} fontWeight="700">Cardholder Name</Text>
                      <TextInput
                        placeholder="John Doe"
                        placeholderTextColor={`${theme.text}35`}
                        value={cardName}
                        onChangeText={setCardName}
                        style={[styles.inputField, { borderColor: theme.border, color: theme.text, backgroundColor: theme.backgroundElement }]}
                        autoCapitalize="words"
                      />
                    </YStack>

                    <YStack gap={4}>
                      <Text color={theme.text} fontSize={12} fontWeight="700">Card Number</Text>
                      <View style={{ position: 'relative', justifyContent: 'center' }}>
                        <TextInput
                          placeholder="4000 1234 5678 9010"
                          placeholderTextColor={`${theme.text}35`}
                          value={cardNumber}
                          onChangeText={handleCardNumberChange}
                          keyboardType="numeric"
                          style={[styles.inputField, { borderColor: theme.border, color: theme.text, backgroundColor: theme.backgroundElement }]}
                        />
                      </View>
                    </YStack>

                    <XStack gap={12}>
                      <YStack gap={4} flex={1}>
                        <Text color={theme.text} fontSize={12} fontWeight="700">Expiry Date</Text>
                        <TextInput
                          placeholder="MM/YY"
                          placeholderTextColor={`${theme.text}35`}
                          value={cardExpiry}
                          onChangeText={handleExpiryChange}
                          keyboardType="numeric"
                          style={[styles.inputField, { borderColor: theme.border, color: theme.text, backgroundColor: theme.backgroundElement }]}
                        />
                      </YStack>

                      <YStack gap={4} flex={1}>
                        <Text color={theme.text} fontSize={12} fontWeight="700">CVV</Text>
                        <TextInput
                          placeholder="123"
                          placeholderTextColor={`${theme.text}35`}
                          value={cardCvv}
                          onChangeText={(t) => setCardCvv(t.replace(/\D/g, '').slice(0, 4))}
                          keyboardType="numeric"
                          secureTextEntry
                          style={[styles.inputField, { borderColor: theme.border, color: theme.text, backgroundColor: theme.backgroundElement }]}
                        />
                      </YStack>
                    </XStack>
                  </YStack>

                  {/* Submit / Back Buttons */}
                  <XStack gap={12} marginTop={8}>
                    <Button
                      flex={1}
                      height={50}
                      backgroundColor="transparent"
                      borderColor={theme.border}
                      borderWidth={1}
                      borderRadius={12}
                      color={theme.textSecondary}
                      fontWeight="600"
                      pressStyle={{ opacity: 0.8 }}
                      onPress={() => setCheckoutStep(1)}
                      disabled={paymentLoading}
                    >
                      Back
                    </Button>
                    <Button
                      flex={2}
                      height={50}
                      backgroundColor="#F59E0B"
                      borderRadius={12}
                      pressStyle={{ opacity: 0.9 }}
                      onPress={handlePayAndSubscribe}
                      disabled={paymentLoading}
                    >
                      {paymentLoading ? (
                        <ActivityIndicator color="#FFFFFF" size="small" />
                      ) : (
                        <Text color="#FFFFFF" fontWeight="700" fontSize={14}>
                          Pay ₱{billingCycle === 'monthly' ? '249' : '1,990'}
                        </Text>
                      )}
                    </Button>
                  </XStack>
                </Animated.View>
              )}

              {/* STEP 3: CONGRATULATIONS SUCCESS UNLOCK */}
              {checkoutStep === 3 && (
                <Animated.View entering={ZoomIn.duration(400)} style={{ gap: 20, alignItems: 'center', paddingVertical: 16 }}>
                  {/* Glowing unlock graphic */}
                  <View style={styles.successGlow}>
                    <PhosphorIcon
                      name="Crown"
                      size={44}
                      color="#F59E0B"
                      weight="fill"
                    />
                  </View>

                  <YStack gap={6} alignItems="center">
                    <Text color={theme.text} fontSize={20} fontWeight="900" textAlign="center">
                      Welcome to Cbudget Premium!
                    </Text>
                    <Text color={theme.textSecondary} fontSize={13} textAlign="center" lineHeight={18}>
                      Your purchase of Cbudget Premium ({billingCycle === 'monthly' ? 'Monthly' : 'Yearly'}) has been successfully simulated. Your premium features are now unlocked!
                    </Text>
                  </YStack>

                  <Button
                    width="100%"
                    height={50}
                    backgroundColor="#F59E0B"
                    borderRadius={12}
                    color="#FFFFFF"
                    fontWeight="700"
                    fontSize={15}
                    pressStyle={{ opacity: 0.9 }}
                    onPress={handleActivatePremium}
                  >
                    Get Started
                  </Button>
                </Animated.View>
              )}
            </ScrollView>
          </YStack>
        </YStack>
      </Modal>

      {/* HELP & SUPPORT MODAL */}
      <Modal
        visible={helpSupportVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setHelpSupportVisible(false)}
      >
        <YStack flex={1} backgroundColor="rgba(15, 23, 42, 0.7)" justifyContent="flex-end">
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setHelpSupportVisible(false)} />
          <YStack
            backgroundColor={theme.surface}
            borderTopLeftRadius={24}
            borderTopRightRadius={24}
            maxHeight="85%"
            paddingHorizontal={Spacing[24]}
            paddingTop={Spacing[24]}
            paddingBottom={Platform.OS === 'ios' ? 44 : 24}
            gap={16}
            elevation={10}
            shadowColor="#000"
            shadowOffset={{ width: 0, height: -8 }}
            shadowOpacity={0.15}
            shadowRadius={24}
          >
            <XStack justifyContent="space-between" alignItems="center">
              <Text fontSize={18} fontWeight="800" color={theme.text}>Academy Help & Support</Text>
              <TouchableOpacity onPress={() => setHelpSupportVisible(false)} style={{ padding: 4 }}>
                <Text fontSize={22} fontWeight="600" color={theme.textSecondary}>×</Text>
              </TouchableOpacity>
            </XStack>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <YStack gap={16} paddingBottom={20}>
                {/* Contact Banner */}
                <YStack gap={8} backgroundColor={theme.backgroundElement} padding={16} borderRadius={16} borderWidth={1} borderColor={theme.border} alignItems="center">
                  <PhosphorIcon
                    name="Envelope"
                    size={28}
                    color={theme.primary as any}
                  />
                  <Text color={theme.text} fontSize={14} fontWeight="700">Email simulated support desk</Text>
                  <Text color={theme.primary as any} fontSize={15} fontWeight="800">support@cbudget.education</Text>
                  <Text color={theme.textSecondary} fontSize={11} textAlign="center" lineHeight={16}>
                    Available 24/7 for simulated grading guides and virtual simulator assistance.
                  </Text>
                </YStack>

                {/* FAQ Accordion Section */}
                <YStack gap={10}>
                  <Text color={theme.text} fontSize={14} fontWeight="800">Simulator Guides</Text>
                  {[
                    { q: 'How do I earn XP fast?', a: 'Log expenses daily, setup monthly budgets, complete lessons, and make successful simulated trades.' },
                    { q: 'Can I withdraw virtual balance?', a: 'No, Cbudget is a sandbox simulator. All funds are mock assets for educational purposes.' },
                    { q: 'How to reset my academy progress?', a: 'Click the "Reset Sandbox Data" button at the bottom of the Profile page.' }
                  ].map((faq, i) => (
                    <YStack key={i} gap={4} padding={12} backgroundColor={`${theme.text}04`} borderRadius={12} borderWidth={1} borderColor={theme.border}>
                      <Text color={theme.text} fontSize={13} fontWeight="700">Q: {faq.q}</Text>
                      <Text color={theme.textSecondary} fontSize={12} lineHeight={16}>{faq.a}</Text>
                    </YStack>
                  ))}
                </YStack>

                {/* Help Form */}
                <YStack gap={8} marginTop={8}>
                  <Text color={theme.text} fontSize={14} fontWeight="800">Ask a Question</Text>
                  <TextInput
                    multiline
                    numberOfLines={4}
                    value={supportMessage}
                    onChangeText={setSupportMessage}
                    placeholder="Describe your question or module issues..."
                    placeholderTextColor={`${theme.text}35`}
                    style={{
                      width: '100%',
                      height: 90,
                      borderWidth: 1.5,
                      borderColor: theme.border,
                      borderRadius: 12,
                      padding: 12,
                      fontSize: 14,
                      color: theme.text,
                      backgroundColor: theme.backgroundElement,
                      textAlignVertical: 'top'
                    }}
                  />
                  
                  <Button
                    height={46}
                    backgroundColor={theme.primary as any}
                    borderRadius={12}
                    color="#FFFFFF"
                    fontWeight="700"
                    onPress={() => {
                      if (!supportMessage.trim()) {
                        Alert.alert('Validation Error', 'Please type your question.');
                        return;
                      }
                      setSupportSending(true);
                      setTimeout(() => {
                        setSupportSending(false);
                        setSupportMessage('');
                        Alert.alert('Message Sent', 'Your simulated support request has been submitted. We will email you back shortly.');
                      }, 1500);
                    }}
                    disabled={supportSending}
                  >
                    {supportSending ? <ActivityIndicator size="small" color="#FFFFFF" /> : 'Submit Question'}
                  </Button>
                </YStack>
              </YStack>
            </ScrollView>
          </YStack>
        </YStack>
      </Modal>

      {/* TERMS & PRIVACY POLICY MODAL — Full tabbed legal document */}
      <LegalPolicyModal
        visible={termsVisible}
        onClose={() => setTermsVisible(false)}
        theme={theme}
      />

      {/* CUSTOM LOGOUT CONFIRMATION MODAL */}
      <Modal
        visible={logoutConfirmVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setLogoutConfirmVisible(false)}
      >
        <YStack flex={1} backgroundColor="rgba(15, 23, 42, 0.75)" justifyContent="center" alignItems="center" padding={Spacing[24]}>
          <YStack
            backgroundColor={theme.surface}
            borderRadius={24}
            width="100%"
            maxWidth={340}
            padding={Spacing[24]}
            gap={20}
            elevation={12}
            shadowColor="#000"
            shadowOffset={{ width: 0, height: 10 }}
            shadowOpacity={0.2}
            shadowRadius={24}
            alignItems="center"
          >
            {/* Warning Icon Helper */}
            <YStack
              width={64}
              height={64}
              borderRadius={32}
              backgroundColor={`${theme.warning}15` as any}
              alignItems="center"
              justifyContent="center"
            >
              <PhosphorIcon
                name="Warning"
                size={32}
                color={theme.warning}
                weight="fill"
              />
            </YStack>

            <YStack gap={6} alignItems="center">
              <Text fontSize={18} fontWeight="800" color={theme.text} textAlign="center">
                Sign Out?
              </Text>
              <Text fontSize={13} color={theme.textSecondary} textAlign="center" lineHeight={18}>
                Are you sure you want to sign out and end your sandbox learning session?
              </Text>
            </YStack>

            <XStack gap={12} width="100%">
              <Button
                flex={1}
                height={46}
                backgroundColor="transparent"
                borderColor={theme.border}
                borderWidth={1}
                borderRadius={12}
                color={theme.textSecondary}
                fontWeight="700"
                pressStyle={{ opacity: 0.8 }}
                onPress={() => setLogoutConfirmVisible(false)}
              >
                Cancel
              </Button>
              <Button
                flex={1}
                height={46}
                backgroundColor={theme.error as any}
                borderRadius={12}
                color="#FFFFFF"
                fontWeight="700"
                pressStyle={{ opacity: 0.9 }}
                onPress={async () => {
                  setLogoutConfirmVisible(false);
                  await logout();
                  router.replace('/(auth)/login' as Href);
                }}
              >
                Sign Out
              </Button>
            </XStack>
          </YStack>
        </YStack>
      </Modal>
    </YStack>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  topHeaderBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  topStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 32,
  },
  planCard: {
    width: '100%',
    padding: 16,
    borderRadius: 14,
    borderWidth: 2,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#F59E0B',
  },
  creditCardPreview: {
    width: '100%',
    height: 170,
    borderRadius: 16,
    padding: 20,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  chip: {
    width: 38,
    height: 28,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  inputField: {
    width: '100%',
    height: 46,
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  successGlow: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: 'rgba(245, 158, 11, 0.3)',
    borderWidth: 3,
  },
  toggleButton: {
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
