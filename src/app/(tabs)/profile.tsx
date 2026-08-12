import React, { useState } from 'react';
import { ScrollView, StyleSheet, Alert, Modal, TextInput, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { YStack, XStack, Text, Button, View } from 'tamagui';
import { useAuthStore } from '@/store/authStore';
import { useTheme } from '@/hooks/use-theme';
import { useThemeStore } from '@/store/themeStore';
import { SymbolView } from 'expo-symbols';
import { useRouter, Href } from 'expo-router';
import { CbudgetCard } from '@/components/ui/CbudgetCard';
import { Spacing } from '@/constants/theme';
import Animated, { FadeInDown, FadeIn, ZoomIn } from 'react-native-reanimated';
import { useGamificationStore, ALL_ACHIEVEMENTS } from '@/store/gamificationStore';
import { BackgroundSystem } from '@/components/ui/BackgroundSystem';
import { PouchyHelper } from '@/components/ui/PouchyHelper';

const getMasteryAvatarDetails = (title: string) => {
  switch (title) {
    case 'Smart Saver':
      return {
        initials: 'SS',
        color: '#10B981', // emerald
        borderColor: '#10B981',
        borderStyle: 'dashed' as const,
        bg: 'rgba(16, 185, 129, 0.1)',
      };
    case 'Investment Explorer':
      return {
        initials: 'IE',
        color: '#3B82F6', // royal blue
        borderColor: '#3B82F6',
        borderStyle: 'solid' as const,
        bg: 'rgba(59, 130, 246, 0.1)',
      };
    case 'Financial Strategist':
      return {
        initials: 'FS',
        color: '#F59E0B', // amber
        borderColor: '#F59E0B',
        borderStyle: 'solid' as const,
        bg: 'rgba(245, 158, 11, 0.1)',
      };
    case 'Budget Beginner':
    default:
      return {
        initials: 'BB',
        color: '#64748B', // slate
        borderColor: '#64748B',
        borderStyle: 'solid' as const,
        bg: 'rgba(100, 116, 139, 0.1)',
      };
  }
};

export default function ProfileScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { mode, primaryColor, setMode, setPrimaryColor } = useThemeStore();
  const { user, logout, isPremium, setPremium, updateProfile, deleteAccount } = useAuthStore();
  const { achievements: unlockedAchievements, customAvatar, getFinancialHealthScore, streakDays } = useGamificationStore();

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
            useGamificationStore.setState({
              xp: 45,
              level: 1,
              streakDays: 3,
              budgetingScore: 75,
              learningScore: 60,
              savingScore: 80,
              investingScore: 65,
              achievements: [],
              customAvatar: 'Budget Beginner',
              loggedExpenses: [],
              savingsGoals: [],
              isBudgetSetupComplete: false,
              virtualBalance: 10000,
            });
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
            useGamificationStore.setState({
              xp: 45,
              level: 1,
              streakDays: 3,
              budgetingScore: 0,
              learningScore: 0,
              savingScore: 0,
              investingScore: 0,
              achievements: [],
              customAvatar: 'Budget Beginner',
              loggedExpenses: [],
              savingsGoals: [],
              isBudgetSetupComplete: false,
              virtualBalance: 0,
            });
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
      'Are you sure you want to downgrade your account? You will lose access to options simulator, advanced AI advisor, and academy certificates at the end of the billing period.',
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
    Alert.alert('Premium Active!', 'Welcome to Cbudget Premium. Enjoy your unlimited sandbox and AI financial tools!');
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
      <BackgroundSystem mode="tabs" />
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* User Profile Card */}
          <Animated.View entering={FadeInDown.delay(100).duration(500)}>
            <CbudgetCard
              marginBottom={Spacing[16]}
              alignItems="center"
              gap={Spacing[16]}
              borderLeftWidth={5}
              borderLeftColor={(isPremium ? '#F59E0B' : theme.primary) as any}
              borderColor={isPremium ? 'rgba(245, 158, 11, 0.3)' : theme.border}
              borderWidth={isPremium ? 1.5 : 1}
            >
              <YStack alignItems="center" gap={12}>
                
                {/* Mastery Rank Avatar Ring */}
                <View
                  style={{
                    width: 90,
                    height: 90,
                    borderRadius: 45,
                    backgroundColor: user?.avatarColor || avatarDetails.bg,
                    borderWidth: 3,
                    borderColor: isPremium ? '#F59E0B' : (user?.avatarColor || avatarDetails.borderColor),
                    borderStyle: isPremium ? 'solid' : avatarDetails.borderStyle,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 4,
                    shadowColor: isPremium ? '#F59E0B' : '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.15,
                    shadowRadius: 8,
                    elevation: 5
                  } as any}
                >
                  {user?.avatarEmoji ? (
                    <Text fontSize={40}>{user.avatarEmoji}</Text>
                  ) : (
                    <Text color="#FFFFFF" fontSize={28} fontWeight="800">
                      {getInitials(user?.name || '')}
                    </Text>
                  )}
                </View>

                <YStack alignItems="center" gap={4}>
                  <XStack alignItems="center" gap={6}>
                    <Text color={theme.text} fontSize={20} fontWeight="700">
                      {user?.name || 'User'}
                    </Text>
                    {isPremium && (
                      <SymbolView
                        name={{ ios: 'crown.fill', android: 'star', web: 'star' } as any}
                        size={16}
                        tintColor="#F59E0B"
                      />
                    )}
                  </XStack>
                  <Text color={theme.textSecondary} fontSize={13}>
                    {user?.email || 'user@example.com'}
                  </Text>
                  
                  {/* Edit Profile Button Link */}
                  <TouchableOpacity 
                    onPress={() => {
                      setEditName(user?.name || '');
                      setEditEmail(user?.email || '');
                      setEditAvatarColor(user?.avatarColor || '#14B8A6');
                      setEditAvatarEmoji(user?.avatarEmoji || '💼');
                      setEditProfileVisible(true);
                    }}
                    style={{ marginTop: 4 }}
                    activeOpacity={0.7}
                  >
                    <XStack gap={4} alignItems="center" backgroundColor={`${theme.primary}15` as any} paddingHorizontal={12} paddingVertical={4} borderRadius={100}>
                      <SymbolView name={{ ios: 'pencil', android: 'edit', web: 'edit' } as any} size={11} tintColor={theme.primary as any} />
                      <Text color={theme.primary as any} fontSize={11} fontWeight="700">Edit Profile</Text>
                    </XStack>
                  </TouchableOpacity>

                  {/* Mastery Rank Badge */}
                  <XStack
                    backgroundColor={isPremium ? 'rgba(245, 158, 11, 0.12)' : `${avatarDetails.color}15` as any}
                    borderColor={isPremium ? 'rgba(245, 158, 11, 0.3)' : `${avatarDetails.color}30` as any}
                    borderWidth={1}
                    borderRadius={100}
                    paddingHorizontal={12}
                    paddingVertical={3}
                    marginTop={8}
                    alignItems="center"
                    gap={4}
                  >
                    <SymbolView
                      name={{ ios: 'crown.fill', android: 'emoji_events', web: 'emoji_events' } as any}
                      size={11}
                      tintColor={isPremium ? '#F59E0B' : avatarDetails.color as any}
                    />
                    <Text color={isPremium ? '#F59E0B' : avatarDetails.color as any} fontSize={10} fontWeight="600" letterSpacing={0.5}>
                      {isPremium ? 'PREMIUM MEMBER' : customAvatar.toUpperCase()}
                    </Text>
                  </XStack>
                </YStack>
              </YStack>

              {/* Quick Metrics Grid */}
              <XStack
                width="100%"
                justifyContent="space-between"
                borderTopWidth={1}
                borderTopColor={theme.border}
                paddingTop={16}
                gap={12}
              >
                <YStack flex={1} alignItems="center" gap={2}>
                  <Text color={theme.textSecondary} fontSize={11} fontWeight="500" letterSpacing={0.5} textTransform="uppercase">
                    Academy Score
                  </Text>
                  <Text color={theme.text} fontSize={16} fontWeight="700">
                    {getFinancialHealthScore()} / 100
                  </Text>
                </YStack>
                
                <YStack
                  flex={1}
                  alignItems="center"
                  borderLeftWidth={1}
                  borderRightWidth={1}
                  borderColor={theme.border}
                  gap={2}
                >
                  <Text color={theme.textSecondary} fontSize={11} fontWeight="500" letterSpacing={0.5} textTransform="uppercase">
                    Badges
                  </Text>
                  <Text color={theme.text} fontSize={16} fontWeight="700">
                    {unlockedAchievements.length} / {ALL_ACHIEVEMENTS.length}
                  </Text>
                </YStack>

                <YStack flex={1} alignItems="center" gap={2}>
                  <Text color={theme.textSecondary} fontSize={11} fontWeight="500" letterSpacing={0.5} textTransform="uppercase">
                    Streak
                  </Text>
                  <Text color={theme.warning} fontSize={16} fontWeight="700">
                    🔥 {streakDays}d
                  </Text>
                </YStack>
              </XStack>
            </CbudgetCard>
          </Animated.View>

          {/* Cbudget Premium Section */}
          <Animated.View entering={FadeInDown.delay(150).duration(500)}>
            {!isPremium ? (
              <CbudgetCard
                marginBottom={Spacing[16]}
                padding={0}
                style={{ overflow: 'hidden' }}
                borderColor="rgba(245, 158, 11, 0.4)"
                borderWidth={1.5}
              >
                {/* Luxury Indigo/Violet Gradient Background */}
                <View
                  style={{
                    padding: 20,
                    gap: 14,
                    background: 'linear-gradient(135deg, #1E1B4B 0%, #311042 100%)',
                    backgroundColor: '#1E1B4B', // Fallback
                  } as any}
                >
                  <XStack justifyContent="space-between" alignItems="center">
                    <YStack gap={2}>
                      <XStack gap={4} alignItems="center">
                        <SymbolView
                          name={{ ios: 'sparkles', android: 'auto_awesome', web: 'auto_awesome' } as any}
                          size={12}
                          tintColor="#F59E0B"
                        />
                        <Text color="#F59E0B" fontSize={11} fontWeight="900" letterSpacing={1.5}>
                          UNLEASH FINANCIAL MASTERY
                        </Text>
                      </XStack>
                      <Text color="#FFFFFF" fontSize={22} fontWeight="900" letterSpacing={-0.5} marginTop={2}>
                        Cbudget Premium
                      </Text>
                    </YStack>
                    <SymbolView
                      name={{ ios: 'crown.fill', android: 'star', web: 'star' } as any}
                      size={32}
                      tintColor="#F59E0B"
                    />
                  </XStack>
                  
                  <Text color="rgba(248, 250, 252, 0.75)" fontSize={13} lineHeight={19}>
                    Join 10,000+ members accelerating their financial independence. Get options simulator modules, margin trading lab, custom AI-driven budget leaks advisor, and certified pathways.
                  </Text>
                  
                  <Button
                    height={46}
                    backgroundColor="#F59E0B"
                    borderRadius={12}
                    pressStyle={{ opacity: 0.9, scale: 0.98 }}
                    onPress={() => {
                      setCheckoutStep(1);
                      setCheckoutVisible(true);
                    }}
                    borderWidth={0}
                    marginTop={4}
                  >
                    <XStack gap={6} alignItems="center">
                      <Text color="#FFFFFF" fontWeight="800" fontSize={14} letterSpacing={0.2}>
                        Upgrade to Premium
                      </Text>
                      <SymbolView
                        name={{ ios: 'crown.fill', android: 'star', web: 'star' } as any}
                        size={14}
                        tintColor="#FFFFFF"
                      />
                    </XStack>
                  </Button>
                </View>
              </CbudgetCard>
            ) : (
              <CbudgetCard
                marginBottom={Spacing[16]}
                padding={16}
                gap={12}
                backgroundColor={`${theme.primary}0D` as any}
                borderColor={`${theme.primary}40` as any}
                borderWidth={1.5}
              >
                <XStack justifyContent="space-between" alignItems="center">
                  <YStack gap={2}>
                    <XStack gap={6} alignItems="center">
                      <SymbolView
                        name={{ ios: 'checkmark.seal.fill', android: 'check_circle', web: 'check_circle' } as any}
                        size={16}
                        tintColor={theme.primary as any}
                      />
                      <Text color={theme.primary as any} fontSize={11} fontWeight="800" letterSpacing={1}>
                        SUBSCRIBED
                      </Text>
                    </XStack>
                    <Text color={theme.text} fontSize={17} fontWeight="800">
                      Cbudget Premium Active
                    </Text>
                  </YStack>
                  <SymbolView
                    name={{ ios: 'crown.fill', android: 'star', web: 'star' } as any}
                    size={24}
                    tintColor="#F59E0B"
                  />
                </XStack>
                <Text color={theme.textSecondary} fontSize={13}>
                  Your premium subscription renews automatically. Next payment date: July 13, 2026.
                </Text>
                <Button
                  height={40}
                  backgroundColor="transparent"
                  borderColor={theme.border}
                  borderWidth={1}
                  borderRadius={10}
                  pressStyle={{ opacity: 0.8 }}
                  onPress={handleCancelSubscription}
                >
                  <Text color={theme.textSecondary} fontWeight="600" fontSize={13}>
                    Cancel Subscription
                  </Text>
                </Button>
              </CbudgetCard>
            )}
          </Animated.View>

          {/* App Customization Panel */}
          <Animated.View entering={FadeInDown.delay(200).duration(500)}>
            <YStack gap={10} marginBottom={Spacing[24]}>
              <Text color={theme.text} fontSize={16} fontWeight="900" paddingHorizontal={2}>
                App Customization
              </Text>
              
              <CbudgetCard padding={16} gap={14}>
                {/* Theme Mode Toggles */}
                <YStack gap={6}>
                  <Text color={theme.text} fontSize={13} fontWeight="700">Theme Mode</Text>
                  <XStack gap={8} width="100%">
                    <TouchableOpacity
                      onPress={() => setMode('light')}
                      style={[
                        styles.toggleButton,
                        {
                          flex: 1,
                          backgroundColor: mode === 'light' ? theme.backgroundSelected : theme.backgroundElement,
                          borderColor: mode === 'light' ? theme.primary : 'transparent',
                          borderWidth: 1.5,
                        }
                      ]}
                      activeOpacity={0.8}
                    >
                      <XStack gap={8} alignItems="center" justifyContent="center">
                        <SymbolView name={{ ios: 'sun.max.fill', android: 'light_mode', web: 'light_mode' } as any} size={15} tintColor={mode === 'light' ? theme.primary : theme.textSecondary} />
                        <Text color={mode === 'light' ? theme.text : theme.textSecondary} fontSize={13} fontWeight="700">Light</Text>
                      </XStack>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => setMode('dark')}
                      style={[
                        styles.toggleButton,
                        {
                          flex: 1,
                          backgroundColor: mode === 'dark' ? theme.backgroundSelected : theme.backgroundElement,
                          borderColor: mode === 'dark' ? theme.primary : 'transparent',
                          borderWidth: 1.5,
                        }
                      ]}
                      activeOpacity={0.8}
                    >
                      <XStack gap={8} alignItems="center" justifyContent="center">
                        <SymbolView name={{ ios: 'moon.fill', android: 'dark_mode', web: 'dark_mode' } as any} size={15} tintColor={mode === 'dark' ? theme.primary : theme.textSecondary} />
                        <Text color={mode === 'dark' ? theme.text : theme.textSecondary} fontSize={13} fontWeight="700">Dark</Text>
                      </XStack>
                    </TouchableOpacity>
                  </XStack>
                </YStack>

                {/* Accent Color Circles */}
                <YStack gap={6}>
                  <Text color={theme.text} fontSize={13} fontWeight="700">Primary Color Theme</Text>
                  <XStack gap={12} alignItems="center" paddingVertical={4}>
                    {[
                      { name: 'sky', hex: '#0EA5E9' },
                      { name: 'teal', hex: '#14B8A6' },
                      { name: 'purple', hex: '#8B5CF6' },
                      { name: 'rose', hex: '#F43F5E' },
                      { name: 'orange', hex: '#F97316' },
                    ].map((col) => {
                      const isSelected = primaryColor === col.name;
                      return (
                        <TouchableOpacity
                          key={col.name}
                          onPress={() => setPrimaryColor(col.name as any)}
                          style={{
                            width: 34,
                            height: 34,
                            borderRadius: 17,
                            backgroundColor: col.hex,
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderWidth: 3,
                            borderColor: isSelected ? (mode === 'dark' ? '#F8FAFC' : '#0F172A') : 'transparent',
                            shadowColor: col.hex,
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.3,
                            shadowRadius: 4,
                            elevation: 3
                          }}
                          activeOpacity={0.7}
                        >
                          {isSelected && (
                            <SymbolView name={{ ios: 'checkmark', android: 'check', web: 'check' } as any} size={14} tintColor="#FFFFFF" />
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </XStack>
                </YStack>
              </CbudgetCard>
            </YStack>
          </Animated.View>

          {/* Achievement Showcase */}
          <YStack gap={12} marginBottom={Spacing[24]}>
            <Text color={theme.text} fontSize={18} fontWeight="900" paddingHorizontal={2}>
              Academy Achievements
            </Text>

            <XStack flexWrap="wrap" justifyContent="space-between" gap={8}>
              {achievements.map((ach, index) => {
                const cardBg = ach.unlocked ? theme.surface : theme.backgroundElement;
                const borderCol = ach.unlocked ? `${ach.color}40` as any : theme.border;
                const iconBg = ach.unlocked ? `${ach.color}12` as any : theme.border;
                const iconColor = ach.unlocked ? ach.color : theme.textSecondary;
                const textColor = ach.unlocked ? theme.text : theme.textSecondary;

                return (
                  <Animated.View key={ach.id} entering={FadeInDown.delay(100 * index).duration(500)} style={{ width: '48.5%' }}>
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
                        borderColor={borderCol}
                        borderWidth={1}
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
                          <SymbolView
                            name={ach.icon as any}
                            size={22}
                            tintColor={iconColor}
                          />
                        </YStack>
                        <YStack gap={2} alignItems="center">
                          <XStack gap={4} alignItems="center" justifyContent="center">
                            <Text
                              color={textColor}
                              fontSize={12}
                              fontWeight="900"
                              textAlign="center"
                              numberOfLines={1}
                            >
                              {ach.title}
                            </Text>
                            {!ach.unlocked && (
                              <SymbolView
                                name={{ ios: 'lock.fill', android: 'lock', web: 'lock' } as const}
                                size={11}
                                tintColor={theme.textSecondary}
                              />
                            )}
                          </XStack>
                          <Text
                            color={theme.textSecondary}
                            fontSize={10}
                            textAlign="center"
                            numberOfLines={2}
                            lineHeight={14}
                          >
                            {ach.description}
                          </Text>
                        </YStack>
                      </CbudgetCard>
                    </Button>
                  </Animated.View>
                );
              })}
            </XStack>
          </YStack>

          {/* Settings / Actions List */}
          <Animated.View entering={FadeInDown.delay(300).duration(500)}>
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
                    <SymbolView
                      name={{ ios: 'questionmark.circle', android: 'help_outline', web: 'help_outline' } as const}
                      size={20}
                      tintColor={theme.textSecondary}
                    />
                    <Text color={theme.text} fontSize={15} fontWeight="700" flex={1} textAlign="left">
                      Help & Academy Support
                    </Text>
                    <SymbolView
                      name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' } as const}
                      size={14}
                      tintColor={theme.textSecondary}
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
                    <SymbolView
                      name={{ ios: 'doc.plaintext', android: 'description', web: 'description' } as const}
                      size={20}
                      tintColor={theme.textSecondary}
                    />
                    <Text color={theme.text} fontSize={15} fontWeight="700" flex={1} textAlign="left">
                      Terms & Privacy Policy
                    </Text>
                    <SymbolView
                      name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' } as const}
                      size={14}
                      tintColor={theme.textSecondary}
                    />
                  </XStack>
                </Button>
              </CbudgetCard>
            </YStack>
          </Animated.View>

          {/* Simulated Account Settings */}
          <Animated.View entering={FadeInDown.delay(350).duration(500)}>
            <CbudgetCard marginBottom={Spacing[24]} gap={12} padding={16}>
              <Text color={theme.text} fontSize={15} fontWeight="700" paddingHorizontal={4} marginBottom={4}>
                Simulated Sandbox Account
              </Text>
              
              <YStack gap={8}>
                {/* Reset Data */}
                <Button
                  backgroundColor={theme.backgroundElement}
                  pressStyle={{ opacity: 0.8 }}
                  borderWidth={0}
                  borderRadius={8}
                  height={44}
                  onPress={handleResetData}
                >
                  <XStack gap={8} alignItems="center" justifyContent="center">
                    <SymbolView
                      name={{ ios: 'arrow.clockwise', android: 'refresh', web: 'refresh' } as const}
                      size={14}
                      tintColor={theme.text}
                    />
                    <Text color={theme.text} fontSize={14} fontWeight="700">
                      Reset Sandbox Data
                    </Text>
                  </XStack>
                </Button>

                {/* Sign Out */}
                <Button
                  backgroundColor={`${theme.error}10` as any}
                  borderColor={`${theme.error}20` as any}
                  borderWidth={1}
                  pressStyle={{ opacity: 0.8 }}
                  borderRadius={8}
                  height={44}
                  onPress={handleLogout}
                >
                  <XStack gap={8} alignItems="center" justifyContent="center">
                    <SymbolView
                      name={{ ios: 'power', android: 'power_settings_new', web: 'power_settings_new' } as const}
                      size={14}
                      tintColor={theme.error}
                    />
                    <Text color={theme.error} fontSize={14} fontWeight="700">
                      Sign Out
                    </Text>
                  </XStack>
                </Button>

                {/* Delete Account */}
                <Button
                  backgroundColor={`${theme.error}1A` as any}
                  borderColor={`${theme.error}4D` as any}
                  borderWidth={1.5}
                  pressStyle={{ opacity: 0.8, scale: 0.98, backgroundColor: `${theme.error}26` as any }}
                  borderRadius={8}
                  height={44}
                  onPress={handleDeleteAccount}
                >
                  <XStack gap={8} alignItems="center" justifyContent="center">
                    <SymbolView
                      name={{ ios: 'trash.fill', android: 'delete', web: 'delete' } as const}
                      size={14}
                      tintColor={theme.error}
                    />
                    <Text color={theme.error} fontSize={14} fontWeight="700">
                      Delete Sandbox Account
                    </Text>
                  </XStack>
                </Button>
              </YStack>
            </CbudgetCard>
          </Animated.View>

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
              <Text fontSize={18} fontWeight="800" color={theme.text}>Edit Sandbox Profile</Text>
              <TouchableOpacity onPress={() => setEditProfileVisible(false)} style={{ padding: 4 }}>
                <Text fontSize={22} fontWeight="600" color={theme.textSecondary}>×</Text>
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
                              borderColor: isSelected ? (mode === 'dark' ? '#F8FAFC' : '#0F172A') : 'transparent'
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
                  onPress={() => {
                    if (!editName.trim()) {
                      Alert.alert('Validation Error', 'Please enter your name.');
                      return;
                    }
                    if (!editEmail.trim() || !editEmail.includes('@')) {
                      Alert.alert('Validation Error', 'Please enter a valid email address.');
                      return;
                    }
                    updateProfile(editName, editEmail, editAvatarColor, editAvatarEmoji);
                    setEditProfileVisible(false);
                    Alert.alert('Profile Saved', 'Your sandbox profile preferences have been successfully updated.');
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
                      { name: 'Personalized AI Coach Budgets', free: false, pro: true },
                      { name: 'Unlimited Savings & Custom Goals', free: false, pro: true },
                      { name: 'Certified Milestones & Pathways', free: false, pro: true },
                    ].map((feature, i) => (
                      <XStack key={i} justifyContent="space-between" alignItems="center" paddingVertical={4}>
                        <Text fontSize={13} color={theme.text} flex={1}>{feature.name}</Text>
                        <XStack gap={16} alignItems="center">
                          <SymbolView
                            name={feature.free ? { ios: 'checkmark.circle.fill', android: 'check', web: 'check' } as any : { ios: 'xmark.circle.fill', android: 'close', web: 'close' } as any}
                            size={14}
                            tintColor={feature.free ? theme.textSecondary : theme.error}
                          />
                          <SymbolView
                            name={{ ios: 'checkmark.circle.fill', android: 'check', web: 'check' } as any}
                            size={14}
                            tintColor="#F59E0B"
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
                        {cardNetwork === 'generic' && <SymbolView name={{ ios: 'creditcard.fill', android: 'credit_card', web: 'credit_card' } as any} size={20} tintColor="#FFFFFF" />}
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
                    <SymbolView
                      name={{ ios: 'crown.fill', android: 'star', web: 'star' } as any}
                      size={44}
                      tintColor="#F59E0B"
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
                  <SymbolView
                    name={{ ios: 'envelope.fill', android: 'mail', web: 'mail' } as any}
                    size={28}
                    tintColor={theme.primary as any}
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

      {/* TERMS & PRIVACY POLICY MODAL */}
      <Modal
        visible={termsVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setTermsVisible(false)}
      >
        <YStack flex={1} backgroundColor="rgba(15, 23, 42, 0.7)" justifyContent="flex-end">
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setTermsVisible(false)} />
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
              <Text fontSize={18} fontWeight="800" color={theme.text}>Terms & Privacy Policy</Text>
              <TouchableOpacity onPress={() => setTermsVisible(false)} style={{ padding: 4 }}>
                <Text fontSize={22} fontWeight="600" color={theme.textSecondary}>×</Text>
              </TouchableOpacity>
            </XStack>

            <ScrollView showsVerticalScrollIndicator={false}>
              <YStack gap={16} paddingBottom={20}>
                
                {/* Simulated Agreement Section */}
                <YStack gap={6}>
                  <Text color={theme.text} fontSize={14} fontWeight="700">1. Simulated Sandbox Agreement</Text>
                  <Text color={theme.textSecondary} fontSize={12} lineHeight={18}>
                    Cbudget is an educational simulator for personal finance, budgeting, and stock trading. All assets, balances, margins, stock holdings, cash balances, and transactions are 100% virtual and simulated. No real currency is ever traded, transacted, or transferred within this application.
                  </Text>
                </YStack>

                {/* Privacy Policy Section */}
                <YStack gap={6}>
                  <Text color={theme.text} fontSize={14} fontWeight="700">2. Privacy & On-Device Data</Text>
                  <Text color={theme.textSecondary} fontSize={12} lineHeight={18}>
                    We respect your learning journey privacy. All local budgeting logs, mock purchase records, simulated trading portfolios, achievements, and custom avatar profiles are stored locally on your device via secure key-value encryption. We do not transmit or sell your financial habits data to any third-party networks.
                  </Text>
                </YStack>

                {/* Gamified Leaderboard Rules Section */}
                <YStack gap={6}>
                  <Text color={theme.text} fontSize={14} fontWeight="700">3. Gamified Content & Titles</Text>
                  <Text color={theme.textSecondary} fontSize={12} lineHeight={18}>
                    XP points, levels, daily login streaks, financial health grades, and sandbox titles (e.g. Smart Saver, Investment Explorer) are game elements created solely to incentivize positive financial habit-building and educational course engagement. They do not constitute any professional banking score or credit rating.
                  </Text>
                </YStack>

                {/* Disclaimer Section */}
                <YStack gap={6} padding={12} backgroundColor={`${theme.warning}10` as any} borderRadius={12} borderWidth={1} borderColor={`${theme.warning}30` as any}>
                  <Text color={theme.warning as any} fontSize={12} fontWeight="700">⚠️ Educational Disclaimer</Text>
                  <Text color={theme.textSecondary} fontSize={11} lineHeight={16}>
                    The content inside the learning modules is for educational guidance only and should not be considered professional financial advice. Always consult a certified financial planner for real-life investing.
                  </Text>
                </YStack>
              </YStack>
            </ScrollView>

            <Button
              height={48}
              backgroundColor={theme.primary as any}
              borderRadius={12}
              color="#FFFFFF"
              fontWeight="700"
              onPress={() => setTermsVisible(false)}
            >
              I Accept & Understand
            </Button>
          </YStack>
        </YStack>
      </Modal>

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
            {/* Pouchy Sad Mascot Helper */}
            <PouchyHelper expression="sad" size={80} />

            <YStack gap={6} alignItems="center">
              <Text fontSize={18} fontWeight="800" color={theme.text} textAlign="center">
                Pouchy is Sad!
              </Text>
              <Text fontSize={13} color={theme.textSecondary} textAlign="center" lineHeight={18}>
                Pouchy will miss you! Are you sure you want to sign out and end your sandbox learning session?
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
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
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
