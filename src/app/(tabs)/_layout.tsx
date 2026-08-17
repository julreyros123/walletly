import React, { useState } from 'react';
import { Tabs, useRouter, Href } from 'expo-router';
import { useTheme } from '@/hooks/use-theme';
import { SymbolView } from 'expo-symbols';
import { Platform, Modal, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@/store/authStore';
import { YStack, Text, Button, View } from 'tamagui';

export default function TabsLayout() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuthStore();
  const isGuest = user?.id === 'guest';
  const router = useRouter();
  const [registerModalVisible, setRegisterModalVisible] = useState(false);
  const [actionModalVisible, setActionModalVisible] = useState(false);

  const guestTabPressListener = {
    tabPress: (e: any) => {
      if (isGuest) {
        e.preventDefault();
        setRegisterModalVisible(true);
      }
    },
  };

  return (
    <>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: theme.primary as any,
          tabBarInactiveTintColor: theme.textSecondary as any,
          tabBarStyle: {
            backgroundColor: theme.surface as any,
            borderTopWidth: 0,
            height: Platform.OS === 'web' ? 64 : 60 + insets.bottom,
            paddingBottom: Platform.OS === 'web' ? 10 : (insets.bottom > 0 ? insets.bottom : 8),
            paddingTop: 10,
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.04,
            shadowRadius: 8,
            elevation: 8,
          },
          headerShown: false,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Dashboard',
            tabBarIcon: ({ color, size, focused }) => (
              <SymbolView
                name={{ ios: focused ? 'house.fill' : 'house', android: 'home', web: 'home' } as any}
                size={size}
                tintColor={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="budget"
          options={{
            title: 'Budget',
            tabBarIcon: ({ color, size, focused }) => (
              <SymbolView
                name={{ ios: focused ? 'wallet.pass.fill' : 'wallet.pass', android: 'account_balance_wallet', web: 'account_balance_wallet' } as any}
                size={size}
                tintColor={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="action"
          options={{
            tabBarButton: () => (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', height: '100%', minHeight: 48 }}>
                <TouchableOpacity
                  onPress={() => {
                    setActionModalVisible(true);
                  }}
                  activeOpacity={0.85}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: '#3EB47D',
                    justifyContent: 'center',
                    alignItems: 'center',
                    shadowColor: '#3EB47D',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.15,
                    shadowRadius: 4,
                    elevation: 3,
                  }}
                >
                  <SymbolView
                    name={{ ios: 'plus', android: 'add', web: 'add' } as any}
                    size={22}
                    tintColor="#FFFFFF"
                  />
                </TouchableOpacity>
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="learn"
          listeners={guestTabPressListener}
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="invest"
          listeners={guestTabPressListener}
          options={{
            title: 'Invest Lab',
            tabBarIcon: ({ color, size, focused }) => (
              <SymbolView
                name={{ ios: focused ? 'chart.bar.fill' : 'chart.bar', android: 'trending_up', web: 'trending_up' } as any}
                size={size}
                tintColor={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          listeners={guestTabPressListener}
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, size, focused }) => (
              <SymbolView
                name={{ ios: focused ? 'person.fill' : 'person', android: 'person', web: 'person' } as any}
                size={size}
                tintColor={color}
              />
            ),
          }}
        />
      </Tabs>

      <Modal
        visible={registerModalVisible}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={() => setRegisterModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <YStack
            backgroundColor={theme.surface}
            borderColor={theme.border}
            borderWidth={1}
            borderRadius={24}
            padding={24}
            width="85%"
            maxWidth={340}
            alignItems="center"
            gap={16}
            elevation={10}
            shadowColor="#000"
            shadowOffset={{ width: 0, height: 4 }}
            shadowOpacity={0.25}
            shadowRadius={10}
          >
            {/* Lock Icon */}
            <View
              width={64}
              height={64}
              borderRadius={32}
              backgroundColor={`${theme.primary}1A` as any}
              alignItems="center"
              justifyContent="center"
            >
              <SymbolView
                name={{ ios: 'lock.fill', android: 'lock', web: 'lock' } as const}
                size={26}
                tintColor={theme.primary as any}
              />
            </View>

            {/* Information Text */}
            <YStack alignItems="center" gap={8}>
              <Text color={theme.text} fontSize={18} fontWeight="800" textAlign="center">
                Create a Free Account
              </Text>
              <Text color={theme.textSecondary} fontSize={13} textAlign="center" lineHeight={18}>
                To unlock financial stats tracking, investment simulations, learning academy modules, and achievements, please create your profile today!
              </Text>
            </YStack>

            {/* Action Buttons */}
            <YStack gap={10} width="100%" marginTop={8}>
              <Button
                style={{ backgroundColor: theme.primary }}
                borderRadius={14}
                height={48}
                pressStyle={{ opacity: 0.85, scale: 0.98 }}
                onPress={async () => {
                  setRegisterModalVisible(false);
                  await logout();
                  router.replace('/(auth)/register' as Href);
                }}
              >
                <Text color="#FFFFFF" fontSize={14} fontWeight="700">
                  Create Account
                </Text>
              </Button>

              <TouchableOpacity
                onPress={() => setRegisterModalVisible(false)}
                activeOpacity={0.7}
                style={{ height: 40, alignItems: 'center', justifyContent: 'center' }}
              >
                <Text color={theme.textSecondary} fontSize={13} fontWeight="600">
                  Continue as Guest
                </Text>
              </TouchableOpacity>
            </YStack>
          </YStack>
        </View>
      </Modal>

      {/* Quick Actions (Rainbow Style) Modal */}
      <Modal
        visible={actionModalVisible}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={() => setActionModalVisible(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setActionModalVisible(false)}
          style={{
            flex: 1,
            backgroundColor: 'rgba(15, 23, 42, 0.55)',
            justifyContent: 'flex-end',
            alignItems: 'center',
            paddingBottom: insets.bottom + 76,
          }}
        >
          <YStack
            backgroundColor={theme.surface}
            borderColor={theme.border}
            borderWidth={1}
            borderRadius={24}
            padding={20}
            width="90%"
            maxWidth={340}
            gap={12}
            elevation={10}
            shadowColor="#000"
            shadowOffset={{ width: 0, height: 10 }}
            shadowOpacity={0.15}
            shadowRadius={16}
            onStartShouldSetResponder={() => true}
            onTouchEnd={(e) => e.stopPropagation()}
          >
            <Text color={theme.text} fontSize={15} style={{ fontFamily: "Inter_800ExtraBold" }} textAlign="center" marginBottom={4}>
              Quick Actions
            </Text>

            {/* Action 1: Log Expense */}
            <TouchableOpacity
              onPress={() => {
                setActionModalVisible(false);
                router.push('/(tabs)/budget' as Href);
              }}
              activeOpacity={0.7}
              style={[styles.modalActionRow, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}
            >
              <View style={[styles.modalActionIconCircle, { backgroundColor: '#3EB47D' }]}>
                <SymbolView name={{ ios: 'plus', android: 'add', web: 'add' } as any} size={16} tintColor="#FFFFFF" />
              </View>
              <YStack flex={1} gap={2}>
                <Text color={theme.text} fontSize={13} style={{ fontFamily: "Inter_700Bold" }}>Log Expense</Text>
                <Text color={theme.textSecondary} fontSize={10} style={{ fontFamily: "Inter_400Regular" }}>Record cash flow transaction</Text>
              </YStack>
              <SymbolView name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' } as any} size={10} tintColor={theme.textSecondary} />
            </TouchableOpacity>

            {/* Action 2: Add Savings */}
            <TouchableOpacity
              onPress={() => {
                setActionModalVisible(false);
                router.push('/(tabs)/budget' as Href);
              }}
              activeOpacity={0.7}
              style={[styles.modalActionRow, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}
            >
              <View style={[styles.modalActionIconCircle, { backgroundColor: '#10B981' }]}>
                <SymbolView name={{ ios: 'banknote.fill', android: 'savings', web: 'savings' } as any} size={15} tintColor="#FFFFFF" />
              </View>
              <YStack flex={1} gap={2}>
                <Text color={theme.text} fontSize={13} style={{ fontFamily: "Inter_700Bold" }}>Add Savings</Text>
                <Text color={theme.textSecondary} fontSize={10} style={{ fontFamily: "Inter_400Regular" }}>Contribute to savings goal progress</Text>
              </YStack>
              <SymbolView name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' } as any} size={10} tintColor={theme.textSecondary} />
            </TouchableOpacity>

            {/* Action 3: Go to Learn */}
            <TouchableOpacity
              onPress={() => {
                setActionModalVisible(false);
                router.push('/(tabs)/learn' as Href);
              }}
              activeOpacity={0.7}
              style={[styles.modalActionRow, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}
            >
              <View style={[styles.modalActionIconCircle, { backgroundColor: '#8B5CF6' }]}>
                <SymbolView name={{ ios: 'book.closed.fill', android: 'menu_book', web: 'menu_book' } as any} size={14} tintColor="#FFFFFF" />
              </View>
              <YStack flex={1} gap={2}>
                <Text color={theme.text} fontSize={13} style={{ fontFamily: "Inter_700Bold" }}>Go to Learn (Academy)</Text>
                <Text color={theme.textSecondary} fontSize={10} style={{ fontFamily: "Inter_400Regular" }}>Continue academy lesson track</Text>
              </YStack>
              <SymbolView name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' } as any} size={10} tintColor={theme.textSecondary} />
            </TouchableOpacity>

            {/* Close Trigger Button */}
            <TouchableOpacity
              onPress={() => setActionModalVisible(false)}
              activeOpacity={0.8}
              style={{
                alignSelf: 'center',
                marginTop: 6,
                backgroundColor: theme.backgroundElement,
                borderColor: theme.border,
                borderWidth: 1.5,
                borderRadius: 100,
                paddingHorizontal: 16,
                paddingVertical: 8,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 5,
                minHeight: 34,
              }}
            >
              <SymbolView name={{ ios: 'xmark', android: 'close', web: 'close' } as any} size={10} tintColor={theme.text} />
              <Text color={theme.text} fontSize={11} style={{ fontFamily: "Inter_700Bold" }}>Close</Text>
            </TouchableOpacity>
          </YStack>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    gap: 12,
    borderWidth: 1,
  },
  modalActionIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
