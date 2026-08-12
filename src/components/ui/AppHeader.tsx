import React, { useEffect, useState } from 'react';
import { StyleSheet, Modal, Alert, Platform } from 'react-native';
import { YStack, XStack, Text, Button, View } from 'tamagui';
import { useAuthStore } from '@/store/authStore';
import { useGamificationStore } from '@/store/gamificationStore';
import { useSyncStore } from '@/store/syncStore';
import { useTheme } from '@/hooks/use-theme';
import { SymbolView } from 'expo-symbols';
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
  } = useGamificationStore();
  const syncStatus = useSyncStore((state) => ({
    backend: state.backend,
    connection: state.connection,
    lastSyncedAt: state.lastSyncedAt,
    hydrated: state.hydrated,
  }));
  const hydrateSync = useSyncStore((state) => state.hydrate);

  const [showDrawer, setShowDrawer] = useState(false);

  useEffect(() => {
    void hydrateSync();
  }, [hydrateSync]);

  const syncLabel = syncStatus.backend === 'supabase' ? 'Supabase online' : 'SQLite offline';
  const syncDisplayLabel = syncStatus.hydrated ? syncLabel : 'Sync loading';
  const syncTone = syncStatus.connection === 'online' ? theme.success : theme.warning;
  const lastSyncLabel = syncStatus.lastSyncedAt
    ? new Date(syncStatus.lastSyncedAt).toLocaleString()
    : 'Not synced yet';

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
            fontFamily="Inter_800ExtraBold"
            letterSpacing={-1}
            marginLeft={-2}
          >
            budget
          </Text>
        </XStack>

        {/* Right: Actions (Notification & Settings Burger) */}
        <XStack alignItems="center" gap={12}>
          <XStack
            alignItems="center"
            gap={6}
            paddingHorizontal={10}
            height={30}
            borderRadius={999}
            backgroundColor={`${syncTone}15` as any}
            borderWidth={1}
            borderColor={`${syncTone}35` as any}
          >
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: syncTone,
              }}
            />
            <Text color={theme.text} fontSize={11} fontWeight="700">
              {syncDisplayLabel}
            </Text>
          </XStack>

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
              <SymbolView
                name={{ ios: 'bell', android: 'notifications', web: 'notifications' } as const}
                size={22}
                tintColor={theme.text}
              />
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
            <SymbolView
              name={{ ios: 'line.3.horizontal', android: 'menu', web: 'menu' } as const}
              size={22}
              tintColor={theme.text}
            />
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
        <View style={styles.modalOverlay} onPress={() => setShowDrawer(false)}>
          <View style={[styles.drawerContent, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={(e: any) => e.stopPropagation()}>
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
                  <SymbolView
                    name={{ ios: 'xmark', android: 'close', web: 'close' } as const}
                    size={16}
                    tintColor={theme.textSecondary}
                  />
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
              {user?.id === 'guest' ? (
                <YStack gap={10} backgroundColor={`${theme.primary}10` as any} padding={14} borderRadius={12} borderWidth={1} borderColor={`${theme.primary}20` as any}>
                  <Text color={theme.text} fontSize={13} fontWeight="700">
                    Guest Session
                  </Text>
                  <Text color={theme.textSecondary} fontSize={11} lineHeight={16}>
                    Create an account to save your budgets, earn XP, track streaks, and unlock simulator games!
                  </Text>
                  <Button
                    backgroundColor={theme.primary}
                    pressStyle={{ opacity: 0.8 }}
                    borderWidth={0}
                    borderRadius={8}
                    height={32}
                    onPress={async () => {
                      setShowDrawer(false);
                      await logout();
                      router.replace('/(auth)/register' as Href);
                    }}
                  >
                    <Text color="#FFFFFF" fontSize={12} fontWeight="700">
                      Create Account
                    </Text>
                  </Button>
                </YStack>
              ) : (
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
                  <Text color={theme.primary} fontSize={13} fontWeight="700">Lvl {level} ({xp} XP)</Text>
                </XStack>
                <XStack justifyContent="space-between" alignItems="center">
                  <Text color={theme.textSecondary} fontSize={12} fontWeight="500">Storage</Text>
                  <Text color={theme.text} fontSize={12} fontWeight="700">{syncDisplayLabel}</Text>
                </XStack>
                <Text color={theme.textSecondary} fontSize={11} lineHeight={16}>
                  Last sync: {lastSyncLabel}
                </Text>
              </YStack>
              )}

              {/* Actions List */}
              <YStack gap={10} marginTop={8}>
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
                    <SymbolView
                      name={{ ios: 'arrow.clockwise', android: 'refresh', web: 'refresh' } as const}
                      size={14}
                      tintColor={theme.text}
                    />
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
                    <SymbolView
                      name={{ ios: 'power', android: 'power_settings_new', web: 'power_settings_new' } as const}
                      size={14}
                      tintColor={theme.error}
                    />
                    <Text color={theme.error} fontSize={13} fontWeight="600">
                      {user?.id === 'guest' ? 'Exit Guest Mode' : 'Sign Out'}
                    </Text>
                  </XStack>
                </Button>
              </YStack>
            </YStack>
          </View>
        </View>
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
