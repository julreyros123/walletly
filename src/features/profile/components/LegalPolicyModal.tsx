import React, { useState } from 'react';
import {
  Modal,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { YStack, XStack, Text, Button, View } from 'tamagui';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PhosphorIcon } from '@/components/ui/PhosphorIcon';
import { Fonts, Spacing } from '@/constants/theme';
import {
  LEGAL_TABS,
  TERMS_OF_SERVICE,
  PRIVACY_POLICY,
  SIMULATOR_RULES,
  DATA_RIGHTS,
  EDUCATIONAL_DISCLAIMER,
  POLICY_METADATA,
  type LegalTabId,
  type PolicySection,
} from '@/constants/legalPolicies';

interface LegalPolicyModalProps {
  visible: boolean;
  onClose: () => void;
  theme: {
    text: string;
    textSecondary: string;
    surface: string;
    border: string;
    primary: string;
    backgroundElement: string;
    warning: string;
  };
  /** Optional: pre-select a specific tab when opening */
  initialTab?: LegalTabId;
}

function getPolicySections(tabId: LegalTabId): PolicySection[] {
  switch (tabId) {
    case 'terms':
      return TERMS_OF_SERVICE;
    case 'privacy':
      return PRIVACY_POLICY;
    case 'simulator':
      return SIMULATOR_RULES;
    case 'rights':
      return DATA_RIGHTS;
    default:
      return TERMS_OF_SERVICE;
  }
}

export function LegalPolicyModal({
  visible,
  onClose,
  theme,
  initialTab = 'terms',
}: LegalPolicyModalProps) {
  const [activeTab, setActiveTab] = useState<LegalTabId>(initialTab);

  // Reset to initial tab when modal opens
  React.useEffect(() => {
    if (visible) {
      setActiveTab(initialTab);
    }
  }, [visible, initialTab]);

  const sections = getPolicySections(activeTab);
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();
  const sheetHeight = Math.round(screenHeight * 0.88);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <YStack flex={1} backgroundColor="rgba(15, 23, 42, 0.7)" justifyContent="flex-end">
        <TouchableOpacity
          style={{ flex: 1 }}
          activeOpacity={1}
          onPress={onClose}
        />
        <YStack
          style={{ backgroundColor: theme.surface, height: sheetHeight }}
          borderTopLeftRadius={24}
          borderTopRightRadius={24}
          paddingTop={10}
          paddingBottom={Math.max(insets.bottom, Platform.OS === 'android' ? 28 : 16) + 12}
          gap={0}
          elevation={10}
          shadowColor="#000"
          shadowOffset={{ width: 0, height: -8 }}
          shadowOpacity={0.15}
          shadowRadius={24}
        >
          {/* Sheet Drag Handle / Dismiss Area */}
          <TouchableOpacity
            onPress={onClose}
            hitSlop={{ top: 12, bottom: 12, left: 40, right: 40 }}
            style={{ alignSelf: 'center', paddingVertical: 4, marginBottom: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Dismiss legal policies modal"
          >
            <View
              style={{
                width: 40,
                height: 4,
                backgroundColor: theme.border,
                borderRadius: 2,
              }}
            />
          </TouchableOpacity>

          {/* Header */}
          <XStack
            justifyContent="space-between"
            alignItems="center"
            paddingHorizontal={Spacing[24]}
            paddingBottom={16}
          >
            <XStack alignItems="center" gap={10}>
              <PhosphorIcon
                name="ShieldCheck"
                size={24}
                color={theme.primary}
                weight="fill"
              />
              <Text
                fontSize={18}
                fontWeight="800"
                style={{ color: theme.text }}
              >
                Legal & Policies
              </Text>
            </XStack>
            <TouchableOpacity
              onPress={onClose}
              style={{ padding: 4 }}
              accessibilityRole="button"
              accessibilityLabel="Close legal policies modal"
            >
              <Text fontSize={22} fontWeight="600" style={{ color: theme.textSecondary }}>
                ×
              </Text>
            </TouchableOpacity>
          </XStack>

          {/* Tab Bar */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabBarContent}
            style={[styles.tabBar, { borderBottomColor: theme.border }]}
            accessibilityRole="tablist"
          >
            {LEGAL_TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <TouchableOpacity
                  key={tab.id}
                  onPress={() => setActiveTab(tab.id)}
                  style={[
                    styles.tabItem,
                    isActive && {
                      borderBottomColor: theme.primary,
                      borderBottomWidth: 2,
                    },
                  ]}
                  activeOpacity={0.7}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: isActive }}
                  accessibilityLabel={tab.label}
                >
                  <XStack alignItems="center" gap={7}>
                    <PhosphorIcon
                      name={tab.icon as any}
                      size={18}
                      color={isActive ? theme.primary : theme.textSecondary}
                      weight={isActive ? 'fill' : 'regular'}
                    />
                    <Text
                      fontSize={13.5}
                      style={{
                        fontFamily: isActive ? Fonts.bold : Fonts.medium,
                        color: isActive ? theme.primary : theme.textSecondary,
                      }}
                    >
                      {tab.label}
                    </Text>
                  </XStack>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Effective Date */}
          <XStack
            paddingHorizontal={Spacing[24]}
            paddingTop={12}
            paddingBottom={4}
          >
            <Text
              fontSize={11}
              style={{ fontFamily: Fonts.medium, color: theme.textSecondary }}
            >
              Effective: {POLICY_METADATA.EFFECTIVE_DATE}
            </Text>
          </XStack>

          {/* Scrollable Content */}
          <ScrollView
            style={{ flex: 1 }}
            nestedScrollEnabled={true}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={true}
            contentContainerStyle={{ paddingHorizontal: Spacing[24], paddingBottom: 24 }}
          >
            <YStack gap={16} paddingTop={8}>
              {sections.map((section, index) => (
                <PolicySectionCard
                  key={`${activeTab}-${index}`}
                  section={section}
                  theme={theme}
                />
              ))}

              {/* Show educational disclaimer on Simulator and Terms tabs */}
              {(activeTab === 'simulator' || activeTab === 'terms') && (
                <View
                  style={[
                    styles.warningBox,
                    {
                      backgroundColor: `${theme.warning}10`,
                      borderColor: `${theme.warning}30`,
                    },
                  ]}
                >
                  <Text
                    color={theme.warning as any}
                    fontSize={12}
                    style={{ fontFamily: Fonts.bold }}
                  >
                    {EDUCATIONAL_DISCLAIMER.title}
                  </Text>
                  <Text
                    style={{ color: theme.textSecondary }}
                    fontSize={11}
                    lineHeight={16}
                  >
                    {EDUCATIONAL_DISCLAIMER.content}
                  </Text>
                </View>
              )}
            </YStack>
          </ScrollView>

          {/* Accept Button */}
          <YStack
            paddingHorizontal={Spacing[24]}
            paddingTop={12}
            borderTopWidth={1}
            borderTopColor={theme.border as any}
          >
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="I Acknowledge & Understand"
              accessibilityHint="Closes the legal policies modal"
              style={{
                height: 50,
                backgroundColor: '#10B981',
                borderRadius: 14,
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: '#10B981',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 10,
                elevation: 4,
              }}
            >
              <Text
                fontSize={15}
                fontWeight="700"
                style={{ color: '#FFFFFF', fontFamily: Fonts.bold }}
              >
                I Acknowledge & Understand
              </Text>
            </TouchableOpacity>
          </YStack>
        </YStack>
      </YStack>
    </Modal>
  );
}

// ── Individual policy section card ───────────────────────────────────
function PolicySectionCard({
  section,
  theme,
}: {
  section: PolicySection;
  theme: { text: string; textSecondary: string; backgroundElement: string; warning: string };
}) {
  if (section.isWarning) {
    return (
      <View
        style={[
          styles.warningBox,
          {
            backgroundColor: `${theme.warning}10`,
            borderColor: `${theme.warning}30`,
          },
        ]}
      >
        <Text
          color={theme.warning as any}
          fontSize={12}
          style={{ fontFamily: Fonts.bold }}
        >
          {section.title}
        </Text>
        <Text style={{ color: theme.textSecondary }} fontSize={11} lineHeight={16}>
          {section.content}
        </Text>
      </View>
    );
  }

  return (
    <YStack gap={6}>
      <Text
        style={{ color: theme.text, fontFamily: Fonts.bold }}
        fontSize={14}
      >
        {section.title}
      </Text>
      <Text
        style={{ color: theme.textSecondary }}
        fontSize={12}
        lineHeight={18}
      >
        {section.content}
      </Text>
    </YStack>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    height: 46,
    flexGrow: 0,
    flexShrink: 0,
    borderBottomWidth: 1,
  },
  tabBarContent: {
    paddingHorizontal: 20,
    gap: 4,
  },
  tabItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  warningBox: {
    gap: 6,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
});
