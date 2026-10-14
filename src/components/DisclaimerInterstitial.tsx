import React from 'react';
import {
  Modal,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ScrollView,
} from 'react-native';
import { YStack, XStack, Text, View } from 'tamagui';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PhosphorIcon, PhosphorIconName } from '@/components/ui/PhosphorIcon';
import { Fonts } from '@/constants/theme';
import { MANDATORY_DISCLAIMER } from '@/constants/legalPolicies';
import { usePreferencesStore } from '@/store/preferencesStore';
import { safeHaptic } from '@/utils/haptics';

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

interface DisclaimerPoint {
  id: string;
  icon: PhosphorIconName;
  iconColor: string;
  iconBg: string;
  title: string;
  description: string;
}

const DISCLAIMER_POINTS: DisclaimerPoint[] = [
  {
    id: 'currencies',
    icon: 'Coins',
    iconColor: '#F59E0B', // Amber
    iconBg: 'rgba(245, 158, 11, 0.12)',
    title: 'Zero Real-World Value',
    description: 'All virtual currencies (₱, $, €, £) and portfolio balances are strictly simulated with zero cash value.',
  },
  {
    id: 'simulation',
    icon: 'ChartLineUp',
    iconColor: '#3B82F6', // Blue
    iconBg: 'rgba(59, 130, 246, 0.12)',
    title: 'Simulated Performance',
    description: 'Simulated market gains and trading results do not guarantee or predict real-world financial performance.',
  },
  {
    id: 'education',
    icon: 'GraduationCap',
    iconColor: '#10B981', // Emerald
    iconBg: 'rgba(16, 185, 129, 0.12)',
    title: 'Educational Learning Tool',
    description: 'Designed exclusively for risk-free practice. Content does not constitute professional investment or legal advice.',
  },
  {
    id: 'institution',
    icon: 'Bank',
    iconColor: '#8B5CF6', // Purple
    iconBg: 'rgba(139, 92, 246, 0.12)',
    title: 'Not a Financial Institution',
    description: 'We are an educational game platform, not a licensed bank, brokerage, investment fund, or credit provider.',
  },
];

/**
 * A full-screen blocking interstitial that the user must accept before
 * accessing the simulator or any gameplay features.
 *
 * Polished with modern flat iconography, clear visual cards, and
 * high-contrast tactile feedback.
 */
export function DisclaimerInterstitial({ theme }: DisclaimerInterstitialProps) {
  const disclaimerAccepted = usePreferencesStore((s) => s.disclaimerAccepted);
  const setDisclaimerAccepted = usePreferencesStore((s) => s.setDisclaimerAccepted);
  const insets = useSafeAreaInsets();

  if (disclaimerAccepted) return null;

  const handleAccept = () => {
    safeHaptic('medium');
    setDisclaimerAccepted();
  };

  return (
    <Modal
      visible={!disclaimerAccepted}
      animationType="fade"
      transparent={false}
      statusBarTranslucent
    >
      <View
        style={[
          styles.root,
          {
            backgroundColor: theme.background,
            paddingTop: Math.max(insets.top, Platform.OS === 'android' ? 36 : 20),
            paddingBottom: Math.max(insets.bottom, Platform.OS === 'android' ? 24 : 16),
          },
        ]}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          bounces={false}
        >
          {/* Top Emblem & Header */}
          <YStack alignItems="center" gap={12} style={styles.header}>
            <View
              style={[
                styles.badgeContainer,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                },
              ]}
            >
              <PhosphorIcon
                name="ShieldCheck"
                size={30}
                color={theme.primary}
                weight="bold"
              />
            </View>

            <View
              style={[
                styles.pillBadge,
                {
                  backgroundColor: `${theme.primary}12`,
                  borderColor: `${theme.primary}28`,
                },
              ]}
            >
              <Text
                style={[
                  styles.pillText,
                  { color: theme.primary, fontFamily: Fonts.bold },
                ]}
              >
                EDUCATIONAL SIMULATION
              </Text>
            </View>

            <Text
              style={[
                styles.title,
                { color: theme.text, fontFamily: Fonts.extraBold },
              ]}
            >
              Important Disclaimer
            </Text>

            <Text
              style={[
                styles.subtitle,
                { color: theme.textSecondary, fontFamily: Fonts.medium },
              ]}
            >
              Walletly is a risk-free educational environment. Please review these essential terms before entering.
            </Text>
          </YStack>

          {/* Structured Flat Point Cards */}
          <YStack gap={10} style={styles.cardsContainer}>
            {DISCLAIMER_POINTS.map((item) => (
              <View
                key={item.id}
                style={[
                  styles.card,
                  {
                    backgroundColor: theme.surface,
                    borderColor: theme.border,
                  },
                ]}
              >
                <View
                  style={[
                    styles.iconBox,
                    { backgroundColor: item.iconBg },
                  ]}
                >
                  <PhosphorIcon
                    name={item.icon}
                    size={20}
                    color={item.iconColor}
                    weight="bold"
                  />
                </View>

                <YStack flex={1} gap={3}>
                  <Text
                    style={[
                      styles.cardTitle,
                      { color: theme.text, fontFamily: Fonts.bold },
                    ]}
                  >
                    {item.title}
                  </Text>
                  <Text
                    style={[
                      styles.cardDescription,
                      { color: theme.textSecondary, fontFamily: Fonts.regular },
                    ]}
                  >
                    {item.description}
                  </Text>
                </YStack>
              </View>
            ))}
          </YStack>

          {/* Legal Advisory Strip */}
          <View
            style={[
              styles.advisoryStrip,
              {
                backgroundColor: `${theme.warning}0D`,
                borderColor: `${theme.warning}26`,
              },
            ]}
          >
            <PhosphorIcon
              name="ShieldWarning"
              size={18}
              color={theme.warning}
              weight="bold"
            />
            <Text
              style={[
                styles.advisoryText,
                { color: theme.textSecondary, fontFamily: Fonts.medium },
              ]}
            >
              Simulated trades never execute in real financial markets. Practice and learn at your own pace.
            </Text>
          </View>
        </ScrollView>

        {/* Pinned Bottom CTA */}
        <YStack gap={10} style={styles.footer}>
          <Text
            style={[
              styles.footerNotice,
              { color: theme.textSecondary, fontFamily: Fonts.regular },
            ]}
          >
            By continuing, you confirm that you have read and understood these simulation terms.
          </Text>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleAccept}
            accessibilityRole="button"
            accessibilityLabel="I Understand & Accept"
            accessibilityHint="Confirms the disclaimer and proceeds to the app"
            style={[
              styles.acceptButton,
              {
                backgroundColor: theme.primary,
                shadowColor: theme.primary,
              },
            ]}
          >
            <XStack alignItems="center" gap={8}>
              <PhosphorIcon name="Check" size={20} color="#FFFFFF" weight="bold" />
              <Text
                style={[
                  styles.acceptButtonText,
                  { color: '#FFFFFF', fontFamily: Fonts.bold },
                ]}
              >
                I Understand & Accept
              </Text>
            </XStack>
          </TouchableOpacity>
        </YStack>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  header: {
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  badgeContainer: {
    width: 60,
    height: 60,
    borderRadius: 20,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 2,
  },
  pillBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 100,
    borderWidth: 1,
  },
  pillText: {
    fontSize: 10.5,
    letterSpacing: 0.8,
  },
  title: {
    fontSize: 22,
    lineHeight: 28,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18.5,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  cardsContainer: {
    marginBottom: 14,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 13,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  cardTitle: {
    fontSize: 13.5,
    lineHeight: 18,
  },
  cardDescription: {
    fontSize: 12,
    lineHeight: 17,
  },
  advisoryStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
  },
  advisoryText: {
    flex: 1,
    fontSize: 11.5,
    lineHeight: 16,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  footerNotice: {
    fontSize: 11,
    lineHeight: 15,
    textAlign: 'center',
  },
  acceptButton: {
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  acceptButtonText: {
    fontSize: 15,
  },
});
