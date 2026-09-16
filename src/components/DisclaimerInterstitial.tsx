import React from 'react';
import {
  Modal,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { YStack, XStack, Text, View } from 'tamagui';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PhosphorIcon } from '@/components/ui/PhosphorIcon';
import { Fonts, Spacing } from '@/constants/theme';
import { MANDATORY_DISCLAIMER, POLICY_METADATA } from '@/constants/legalPolicies';
import { usePreferencesStore } from '@/store/preferencesStore';

interface DisclaimerInterstitialProps {
  theme: {
    text: string;
    textSecondary: string;
    surface: string;
    border: string;
    primary: string;
    background: string;
    warning: string;
    error: string;
  };
}

/**
 * A full-screen blocking interstitial that the user must accept before
 * accessing the simulator or any gameplay features. This satisfies the
 * legal requirement for a mandatory financial disclaimer that prevents
 * users from claiming they were never informed the app is purely educational.
 *
 * Once accepted, the flag is persisted via the preferences store and the
 * interstitial will not appear again for that user.
 */
export function DisclaimerInterstitial({ theme }: DisclaimerInterstitialProps) {
  const disclaimerAccepted = usePreferencesStore((s) => s.disclaimerAccepted);
  const setDisclaimerAccepted = usePreferencesStore((s) => s.setDisclaimerAccepted);
  const insets = useSafeAreaInsets();

  if (disclaimerAccepted) return null;

  return (
    <Modal
      visible={!disclaimerAccepted}
      animationType="fade"
      transparent={false}
      statusBarTranslucent
    >
      <YStack
        flex={1}
        style={{
          backgroundColor: theme.background,
          paddingTop: Math.max(insets.top, Platform.OS === 'android' ? 40 : 20),
          paddingBottom: Math.max(insets.bottom, Platform.OS === 'android' ? 28 : 16) + 12,
        }}
      >
        {/* Header */}
        <YStack
          alignItems="center"
          paddingHorizontal={Spacing[24]}
          paddingTop={24}
          gap={16}
        >
          {/* Warning Icon */}
          <View
            style={{
              width: 72,
              height: 72,
              borderRadius: 36,
              backgroundColor: `${theme.warning}1A`,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <PhosphorIcon
              name="Warning"
              size={36}
              color={theme.warning}
              weight="fill"
            />
          </View>

          <Text
            fontSize={20}
            fontWeight="800"
            textAlign="center"
            style={{ color: theme.text, fontFamily: Fonts.extraBold }}
          >
            {MANDATORY_DISCLAIMER.title}
          </Text>
        </YStack>

        {/* Disclaimer Content */}
        <YStack
          flex={1}
          justifyContent="center"
          paddingHorizontal={Spacing[24]}
          gap={20}
        >
          {/* Warning Box */}
          <View
            style={[
              styles.warningBox,
              {
                backgroundColor: `${theme.warning}10`,
                borderColor: `${theme.warning}30`,
              },
            ]}
          >
            <PhosphorIcon
              name="Warning"
              size={20}
              color={theme.warning}
              weight="fill"
            />
            <Text
              fontSize={14}
              lineHeight={22}
              textAlign="center"
              style={{ color: theme.text, fontFamily: Fonts.medium }}
            >
              {MANDATORY_DISCLAIMER.content}
            </Text>
          </View>

          {/* Key Points */}
          <YStack gap={12} paddingHorizontal={4}>
            <KeyPoint
              icon="CurrencyDollarSimple"
              text="All virtual currencies (₱, $, €, £) have ZERO real-world value."
              theme={theme}
            />
            <KeyPoint
              icon="ChartLineUp"
              text="Simulated performance does NOT guarantee real-world results."
              theme={theme}
            />
            <KeyPoint
              icon="GraduationCap"
              text="This is an educational tool — NOT financial advice."
              theme={theme}
            />
            <KeyPoint
              icon="ShieldWarning"
              text="We are NOT a licensed financial institution, brokerage, or bank."
              theme={theme}
            />
          </YStack>
        </YStack>

        {/* Accept Button */}
        <YStack
          paddingHorizontal={Spacing[24]}
          gap={8}
        >
          <Text
            fontSize={11}
            textAlign="center"
            lineHeight={15}
            style={{ color: theme.textSecondary, fontFamily: Fonts.medium }}
          >
            By tapping "I Understand & Accept", you acknowledge that you have read and
            understood this disclaimer.
          </Text>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={setDisclaimerAccepted}
            accessibilityRole="button"
            accessibilityLabel="I Understand & Accept"
            accessibilityHint="Accepts the disclaimer and continues to the app"
            style={{
              height: 54,
              backgroundColor: '#10B981',
              borderRadius: 16,
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: '#10B981',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.35,
              shadowRadius: 12,
              elevation: 6,
            }}
          >
            <XStack alignItems="center" gap={8}>
              <PhosphorIcon name="ShieldCheck" size={20} color="#FFFFFF" weight="fill" />
              <Text
                fontSize={15}
                fontWeight="700"
                style={{ color: '#FFFFFF', fontFamily: Fonts.bold }}
              >
                I Understand & Accept
              </Text>
            </XStack>
          </TouchableOpacity>
        </YStack>
      </YStack>
    </Modal>
  );
}

// ── Key Point Row ────────────────────────────────────────────────────
function KeyPoint({
  icon,
  text,
  theme,
}: {
  icon: string;
  text: string;
  theme: { text: string; textSecondary: string; warning: string; error: string };
}) {
  return (
    <XStack alignItems="flex-start" gap={10} accessible={true} accessibilityLabel={text}>
      <View
        style={{
          width: 28,
          height: 28,
          borderRadius: 14,
          backgroundColor: `${theme.error}15`,
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: 1,
        }}
      >
        <PhosphorIcon name={icon as any} size={14} color={theme.error} weight="fill" />
      </View>
      <Text
        flex={1}
        fontSize={12.5}
        lineHeight={18}
        style={{ color: theme.text, fontFamily: Fonts.medium }}
      >
        {text}
      </Text>
    </XStack>
  );
}

const styles = StyleSheet.create({
  warningBox: {
    gap: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
});
