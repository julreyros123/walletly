import React, { useState } from 'react';
import { StyleSheet, Modal, Alert, Platform, Pressable } from 'react-native';
import { YStack, XStack, Text, Button, View } from 'tamagui';
import { useAuthStore } from '@/store/authStore';
import { useGamificationStore } from '@/store/gamificationStore';
import { useTheme } from '@/hooks/use-theme';
import { PhosphorIcon } from '@/components/ui/PhosphorIcon';
import { useRouter, Href } from 'expo-router';
import { Image } from 'expo-image';

export function AppHeader() {
  const router = useRouter();
  const theme = useTheme();
  const { user, logout } = useAuthStore();
  const { 
    xp, 
    level, 
    streakDays, 
    getFinancialHealthScore,
    achievements
  } = useGamificationStore();

  const [showDrawer, setShowDrawer] = useState(false);

  const handleLogout = async () => {
    setShowDrawer(false);
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login' as Href);
        },
      },
    ]);
  };

  const handleResetData = () => {
    Alert.alert(
      'Reset Simulated Data',
      'This will reset your simulated academy scores, XP, level, and achievements back to defaults. This action cannot be undone. Proceed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            // Reset state
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
            });
            setShowDrawer(false);
            Alert.alert('Data Reset', 'All simulated sandbox data has been reset to defaults.');
          },
        },
      ]
    );
  };

  return (
    <>
      <XStack
        height={64}
        alignItems="center"
        justifyContent="space-between"
        paddingHorizontal={20}
        borderBottomWidth={1}
        borderBottomColor={theme.border}
        backgroundColor={theme.surface}
      >
        {/* Left: Brand logo & name */}
        <XStack alignItems="center">
          <Image
            source={require('../../../assets/images/walletly-logo.png')}
            style={{ width: 34, height: 34, transform: [{ translateY: 1 }] }}
            contentFit="contain"
          />
          <Text
            color={theme.text}
            fontSize={24}
            fontWeight="800"
            style={{ fontFamily: "Inter_800ExtraBold" }}
            letterSpacing={-1}
            marginLeft={-2}
          >
            budget
          </Text>
        </XStack>

        {/* Right: Actions (Notification & Settings Burger) */}
        <XStack alignItems="center" gap={12}>
          <Button
            chromeless
            circular
            padding={0}
            width={40}
            height={40}
            alignItems="center"
            justifyContent="center"
            pressStyle={{ opacity: 0.7 }}
            onPress={() => 
              Alert.alert(
                'Academy Notification', 
                'You are all caught up! Complete your lessons and track your budget to boost your score.'
              )
            }
          >
            <View style={{ position: 'relative' }}>
              <PhosphorIcon name="Bell" size={22} color={theme.text} weight="regular" />
              <View
                style={{
                  position: 'absolute',
                  top: -2,
                  right: -2,
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: theme.error,
                }}
              />
            </View>
          </Button>

          <Button
            chromeless
            circular
            padding={0}
            width={40}
            height={40}
            alignItems="center"
            justifyContent="center"
            pressStyle={{ opacity: 0.7 }}
            onPress={() => setShowDrawer(true)}
          >
            <PhosphorIcon name="List" size={22} color={theme.text} weight="bold" />
          </Button>
        </XStack>
      </XStack>

      {/* Settings Burger Drawer Modal */}
      <Modal
        visible={showDrawer}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDrawer(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowDrawer(false)}>
          <Pressable style={[styles.drawerContent, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={(e) => e.stopPropagation()}>
            <YStack gap={16} width="100%">
              {/* Header inside drawer */}
              <XStack justifyContent="space-between" alignItems="center" borderBottomWidth={1} borderBottomColor={theme.border} paddingBottom={12}>
                <Text color={theme.text} fontSize={16} fontWeight="700">
                  App Settings
                </Text>
                <Button
                  chromeless
                  circular
                  width={30}
                  height={30}
                  padding={0}
                  alignItems="center"
                  justifyContent="center"
                  onPress={() => setShowDrawer(false)}
                >
                  <PhosphorIcon name="X" size={16} color={theme.textSecondary} weight="bold" />
                </Button>
              </XStack>

              {/* User Account Info */}
              <YStack gap={4} paddingBottom={4}>
                <Text color={theme.text} fontSize={15} fontWeight="700">
                  {user?.name || 'Academy Learner'}
                </Text>
                <Text color={theme.textSecondary} fontSize={12}>
                  {user?.email || 'learner@cbudget.com'}
                </Text>
              </YStack>

              {/* Quick Stats Summary */}
              {user?.id === 'guest' && (
                <YStack gap={8} backgroundColor={`${theme.primary}10` as any} padding={12} borderRadius={10} borderWidth={1} borderColor={`${theme.primary}20` as any}>
                  <XStack justifyContent="space-between" alignItems="center">
                    <Text style={{ color: theme.primary }} fontSize={12} fontWeight="700">Offline Guest Mode</Text>
                    <Pressable
                      onPress={async () => {
                        setShowDrawer(false);
                        await logout();
                        router.replace('/(auth)/register' as Href);
                      }}
                      style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                    >
                      <Text style={{ color: theme.primary }} fontSize={11} fontWeight="700" textDecorationLine="underline">
                        Create Account
                      </Text>
                    </Pressable>
                  </XStack>
                  <Text color={theme.textSecondary} fontSize={11} lineHeight={15}>
                    All features, budgets, arcade games, and stats work 100% offline on this device.
                  </Text>
                </YStack>
              )}

              <YStack gap={8} backgroundColor={theme.backgroundElement} padding={12} borderRadius={8}>
                <XStack justifyContent="space-between" alignItems="center">
                  <Text color={theme.textSecondary} fontSize={12} fontWeight="500">Financial Health</Text>
                  <Text color={theme.text} fontSize={13} fontWeight="700">{getFinancialHealthScore()}/100</Text>
                </XStack>
                <XStack justifyContent="space-between" alignItems="center">
                  <Text color={theme.textSecondary} fontSize={12} fontWeight="500">Streak</Text>
                  <Text color={theme.warning} fontSize={13} fontWeight="700">🔥 {streakDays} days</Text>
                </XStack>
                <XStack justifyContent="space-between" alignItems="center">
                  <Text color={theme.textSecondary} fontSize={12} fontWeight="500">Academy Level</Text>
                  <Text color={theme.primary as any} fontSize={13} fontWeight="700">Lvl {level} ({xp} XP)</Text>
                </XStack>
              </YStack>

              {/* Actions List */}
              <YStack gap={10} marginTop={8}>
                {/* Full App Settings */}
                <Button
                  backgroundColor={theme.backgroundElement}
                  pressStyle={{ opacity: 0.8 }}
                  borderWidth={0}
                  borderRadius={8}
                  height={40}
                  onPress={() => {
                    setShowDrawer(false);
                    router.push('/settings' as Href);
                  }}
                >
                  <XStack gap={8} alignItems="center" justifyContent="center">
                    <PhosphorIcon name="GearSix" size={16} color={theme.text} weight="bold" />
                    <Text color={theme.text} fontSize={13} fontWeight="600">
                      Settings & Preferences
                    </Text>
                  </XStack>
                </Button>

                {/* Reset simulated data */}
                <Button
                  backgroundColor={theme.backgroundElement}
                  pressStyle={{ opacity: 0.8 }}
                  borderWidth={0}
                  borderRadius={8}
                  height={40}
                  onPress={handleResetData}
                >
                  <XStack gap={8} alignItems="center" justifyContent="center">
                    <PhosphorIcon name="ArrowClockwise" size={14} color={theme.text} weight="bold" />
                    <Text color={theme.text} fontSize={13} fontWeight="600">
                      Reset Simulated Data
                    </Text>
                  </XStack>
                </Button>

                {/* Simulated Academy Sign Out */}
                <Button
                  backgroundColor={`${theme.error}10` as any}
                  borderColor={`${theme.error}20` as any}
                  borderWidth={1}
                  pressStyle={{ opacity: 0.8 }}
                  borderRadius={8}
                  height={40}
                  onPress={handleLogout}
                >
                  <XStack gap={8} alignItems="center" justifyContent="center">
                    <PhosphorIcon name="Power" size={14} color={theme.error} weight="bold" />
                    <Text color={theme.error} fontSize={13} fontWeight="600">
                      {user?.id === 'guest' ? 'Exit Guest Mode' : 'Sign Out'}
                    </Text>
                  </XStack>
                </Button>
              </YStack>
            </YStack>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
  },
  drawerContent: {
    width: Platform.OS === 'web' ? 300 : '75%',
    height: '100%',
    padding: 20,
    borderLeftWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
});
