import React, { useState } from 'react';
import { Tabs, useRouter, usePathname, Href } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '@/hooks/use-theme';
import { PhosphorIcon } from '@/components/ui/PhosphorIcon';
import { Platform, Modal, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@/store/authStore';
import { Fonts } from '@/constants/theme';
import { YStack, Text, Button, View } from 'tamagui';
import { DisclaimerInterstitial } from '@/components/DisclaimerInterstitial';

export default function TabsLayout() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const isGuest = user?.id === 'guest';
  const router = useRouter();
  const [registerModalVisible, setRegisterModalVisible] = useState(false);
  const [actionModalVisible, setActionModalVisible] = useState(false);

  // Home (index / (tabs) / root) and Invest tabs have dark backgrounds/headers even in light mode
  const isDarkHeaderTab = pathname === '/' || pathname === '/(tabs)' || pathname.endsWith('/index') || pathname.includes('invest');
  const isDark = theme.mode === 'dark';
  const tabStatusBarStyle = isDark || isDarkHeaderTab ? 'light' : 'dark';

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
      <StatusBar style={tabStatusBarStyle} />
      <Tabs
        screenOptions={{
          sceneStyle: { backgroundColor: theme.background },
          tabBarActiveTintColor: theme.primary as any,
          tabBarInactiveTintColor: theme.textSecondary as any,
          tabBarLabelStyle: {
            fontFamily: Fonts.bold,
            fontSize: 11.5,
            marginTop: 4,
          },
          tabBarStyle: {
            backgroundColor: theme.surface as any,
            borderTopWidth: 0,
            height: Platform.OS === 'web' ? 76 : 70 + insets.bottom,
            paddingBottom: Platform.OS === 'web' ? 14 : (insets.bottom > 0 ? insets.bottom + 4 : 12),
            paddingTop: 12,
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.06,
            shadowRadius: 10,
            elevation: 10,
          },
          headerShown: false,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, focused }) => (
              <PhosphorIcon
                name="House"
                size={focused ? 26 : 24}
                color={color}
                weight={focused ? 'fill' : 'regular'}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="budget"
          options={{
            title: 'Budget',
            tabBarIcon: ({ color, focused }) => (
              <PhosphorIcon
                name="Wallet"
                size={focused ? 26 : 24}
                color={color}
                weight={focused ? 'fill' : 'regular'}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="action"
          options={{
            tabBarButton: () => (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', height: '100%', minHeight: 52 }}>
                <TouchableOpacity
                  onPress={() => {
                    setActionModalVisible(true);
                  }}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                  accessibilityLabel="Quick Actions menu"
                  accessibilityHint="Opens quick actions like log expense or add savings"
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 26,
                    backgroundColor: theme.primary,
                    justifyContent: 'center',
                    alignItems: 'center',
                    shadowColor: theme.primary,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.35,
                    shadowRadius: 8,
                    elevation: 6,
                  }}
                >
                  <PhosphorIcon name="Plus" size={26} color="#FFFFFF" weight="bold" />
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
            tabBarIcon: ({ color, focused }) => (
              <PhosphorIcon
                name="ChartLineUp"
                size={focused ? 26 : 24}
                color={color}
                weight={focused ? 'fill' : 'regular'}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          listeners={guestTabPressListener}
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, focused }) => (
              <PhosphorIcon
                name="User"
                size={focused ? 26 : 24}
                color={color}
                weight={focused ? 'fill' : 'regular'}
              />
            ),
          }}
        />
      </Tabs>

      {/* Mandatory Financial Disclaimer — blocks access until accepted */}
      <DisclaimerInterstitial theme={theme} />

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
              <PhosphorIcon name="Lock" size={26} color={theme.primary} weight="fill" />
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
                accessibilityRole="button"
                accessibilityLabel="Create Account"
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
                accessibilityRole="button"
                accessibilityLabel="Continue as Guest"
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
                router.push('/(tabs)/budget?action=log' as Href);
              }}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Log Expense"
              accessibilityHint="Record cash flow transaction"
              style={[styles.modalActionRow, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}
            >
              <View style={[styles.modalActionIconCircle, { backgroundColor: theme.primary }]}>
                <PhosphorIcon name="Plus" size={16} color="#FFFFFF" weight="bold" />
              </View>
              <YStack flex={1} gap={2}>
                <Text color={theme.text} fontSize={13} style={{ fontFamily: "Inter_700Bold" }}>Log Expense</Text>
                <Text color={theme.textSecondary} fontSize={10} style={{ fontFamily: "Inter_400Regular" }}>Record cash flow transaction</Text>
              </YStack>
              <PhosphorIcon name="CaretRight" size={10} color={theme.textSecondary} weight="bold" />
            </TouchableOpacity>

            {/* Action 2: Add Savings */}
            <TouchableOpacity
              onPress={() => {
                setActionModalVisible(false);
                router.push('/(tabs)/budget?action=savings' as Href);
              }}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Add Savings"
              accessibilityHint="Contribute to savings goal progress"
              style={[styles.modalActionRow, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}
            >
              <View style={[styles.modalActionIconCircle, { backgroundColor: '#10B981' }]}>
                <PhosphorIcon name="Money" size={15} color="#FFFFFF" weight="fill" />
              </View>
              <YStack flex={1} gap={2}>
                <Text color={theme.text} fontSize={13} style={{ fontFamily: "Inter_700Bold" }}>Add Savings</Text>
                <Text color={theme.textSecondary} fontSize={10} style={{ fontFamily: "Inter_400Regular" }}>Contribute to savings goal progress</Text>
              </YStack>
              <PhosphorIcon name="CaretRight" size={10} color={theme.textSecondary} weight="bold" />
            </TouchableOpacity>

            {/* Action 3: Go to Learn */}
            <TouchableOpacity
              onPress={() => {
                setActionModalVisible(false);
                router.push('/(tabs)/learn' as Href);
              }}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Go to Learn Academy"
              accessibilityHint="Continue academy lesson track"
              style={[styles.modalActionRow, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}
            >
              <View style={[styles.modalActionIconCircle, { backgroundColor: '#8B5CF6' }]}>
                <PhosphorIcon name="GraduationCap" size={14} color="#FFFFFF" weight="fill" />
              </View>
              <YStack flex={1} gap={2}>
                <Text color={theme.text} fontSize={13} style={{ fontFamily: "Inter_700Bold" }}>Go to Learn (Academy)</Text>
                <Text color={theme.textSecondary} fontSize={10} style={{ fontFamily: "Inter_400Regular" }}>Continue academy lesson track</Text>
              </YStack>
              <PhosphorIcon name="CaretRight" size={10} color={theme.textSecondary} weight="bold" />
            </TouchableOpacity>

            {/* Close Trigger Button */}
            <TouchableOpacity
              onPress={() => setActionModalVisible(false)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Close quick actions"
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
              <PhosphorIcon name="X" size={10} color={theme.text} weight="bold" />
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
