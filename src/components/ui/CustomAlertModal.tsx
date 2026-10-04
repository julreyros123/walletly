import React, { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { PhosphorIcon } from '@/components/ui/PhosphorIcon';
import type { PhosphorIconName } from '@/components/ui/PhosphorIcon';
import { useTheme } from '@/hooks/use-theme';
import { Fonts } from '@/constants/theme';

export interface AlertButton {
  text: string;
  onPress?: () => void;
  variant?: 'primary' | 'destructive' | 'secondary';
}

export type CustomAlertType = 'success' | 'error' | 'warning' | 'info' | 'logout' | 'delete';

interface CustomAlertModalProps {
  visible: boolean;
  type?: CustomAlertType;
  title: string;
  description: string;
  onClose: () => void;
  buttons?: AlertButton[];
}

export function CustomAlertModal({
  visible,
  type = 'info',
  title,
  description,
  onClose,
  buttons,
}: CustomAlertModalProps) {
  const theme = useTheme();
  const [internalVisible, setInternalVisible] = useState(visible);

  // Reanimated shared values for entrance/exit transitions
  const backdropOpacity = useSharedValue(0);
  const cardScale = useSharedValue(0.9);
  const cardOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      setInternalVisible(true);
      
      // Tactile feedback on alert trigger
      try {
        if (type === 'success') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else if (type === 'error' || type === 'delete' || type === 'logout') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        } else {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      } catch {
        // Safe fallback if haptics unavailable
      }

      // Smooth spring entrance
      backdropOpacity.value = withTiming(1, { duration: 220 });
      cardScale.value = withSpring(1, {
        damping: 18,
        stiffness: 240,
        mass: 0.8,
      });
      cardOpacity.value = withTiming(1, { duration: 180 });
    } else {
      // Exit transition
      backdropOpacity.value = withTiming(0, { duration: 160 });
      cardScale.value = withTiming(0.92, { duration: 160 });
      cardOpacity.value = withTiming(0, { duration: 160 }, (finished) => {
        if (finished) {
          runOnJS(setInternalVisible)(false);
        }
      });
    }
  }, [visible, type]);

  // Contextual icon and theme styling
  const getTypeDetails = (): {
    icon: PhosphorIconName;
    color: string;
    bg: string;
    haloBg: string;
    haloBorder: string;
  } => {
    switch (type) {
      case 'logout':
        return {
          icon: 'SignOut',
          color: '#E11D48', // Premium Fintech Rose
          bg: 'rgba(225, 29, 72, 0.12)',
          haloBg: 'rgba(225, 29, 72, 0.06)',
          haloBorder: 'rgba(225, 29, 72, 0.18)',
        };
      case 'delete':
        return {
          icon: 'Trash',
          color: '#DC2626', // Crimson Red
          bg: 'rgba(220, 38, 38, 0.12)',
          haloBg: 'rgba(220, 38, 38, 0.06)',
          haloBorder: 'rgba(220, 38, 38, 0.18)',
        };
      case 'success':
        return {
          icon: 'CheckCircle',
          color: '#10B981', // Executive Brand Emerald
          bg: 'rgba(16, 185, 129, 0.14)',
          haloBg: 'rgba(16, 185, 129, 0.06)',
          haloBorder: 'rgba(16, 185, 129, 0.20)',
        };
      case 'error':
        return {
          icon: 'XCircle',
          color: '#EF4444',
          bg: 'rgba(239, 68, 68, 0.14)',
          haloBg: 'rgba(239, 68, 68, 0.06)',
          haloBorder: 'rgba(239, 68, 68, 0.20)',
        };
      case 'warning':
        return {
          icon: 'Warning',
          color: '#F59E0B', // Amber Gold
          bg: 'rgba(245, 158, 11, 0.14)',
          haloBg: 'rgba(245, 158, 11, 0.06)',
          haloBorder: 'rgba(245, 158, 11, 0.20)',
        };
      case 'info':
      default:
        return {
          icon: 'Info',
          color: '#0EA5E9', // Electric Sky
          bg: 'rgba(14, 165, 233, 0.14)',
          haloBg: 'rgba(14, 165, 233, 0.06)',
          haloBorder: 'rgba(14, 165, 233, 0.20)',
        };
    }
  };

  const details = getTypeDetails();
  const alertButtons = buttons && buttons.length > 0
    ? buttons
    : [{ text: 'OK', onPress: () => {}, variant: 'primary' as const }];

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const cardAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
    opacity: cardOpacity.value,
  }));

  const isDarkMode = theme.mode === 'dark';

  if (!internalVisible) return null;

  return (
    <Modal
      transparent
      visible={internalVisible}
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.modalRoot}>
        {/* Frosted / Deep Dimming Scrim */}
        <Animated.View style={[styles.backdrop, backdropStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>

        {/* Elevated Fintech Dialog Card */}
        <Animated.View
          style={[
            styles.cardContainer,
            {
              backgroundColor: isDarkMode ? '#131B2E' : '#FFFFFF',
              borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(226, 232, 240, 0.85)',
            },
            cardAnimStyle,
          ]}
        >
          {/* Dual-Ring Halo Icon Presentation */}
          <View
            style={[
              styles.outerHalo,
              {
                backgroundColor: details.haloBg,
                borderColor: details.haloBorder,
              },
            ]}
          >
            <View
              style={[
                styles.innerBadge,
                {
                  backgroundColor: details.bg,
                },
              ]}
            >
              <PhosphorIcon
                name={details.icon}
                size={26}
                color={details.color}
                weight="fill"
              />
            </View>
          </View>

          {/* Typography Section */}
          <View style={styles.textContainer}>
            <Text
              style={[
                styles.titleText,
                {
                  color: isDarkMode ? '#F8FAFC' : '#0F172A',
                },
              ]}
            >
              {title}
            </Text>
            {description ? (
              <Text
                style={[
                  styles.descText,
                  {
                    color: isDarkMode ? '#94A3B8' : '#64748B',
                  },
                ]}
              >
                {description}
              </Text>
            ) : null}
          </View>

          {/* Action Row */}
          <View style={styles.actionsRow}>
            {alertButtons.map((btn, idx) => (
              <AlertButtonComponent
                key={idx}
                button={btn}
                isSingle={alertButtons.length === 1}
                isDarkMode={isDarkMode}
                theme={theme}
                onSelect={() => {
                  onClose();
                  if (btn.onPress) {
                    btn.onPress();
                  }
                }}
              />
            ))}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

function AlertButtonComponent({
  button,
  isSingle,
  isDarkMode,
  theme,
  onSelect,
}: {
  button: AlertButton;
  isSingle: boolean;
  isDarkMode: boolean;
  theme: any;
  onSelect: () => void;
}) {
  const isPrimary = button.variant === 'primary' || !button.variant;
  const isDestructive = button.variant === 'destructive';
  const isSecondary = button.variant === 'secondary';

  let btnBg = isDarkMode ? '#1E293B' : '#F1F5F9';
  let borderCol = isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(226, 232, 240, 0.9)';
  let txtColor = isDarkMode ? '#F8FAFC' : '#1E293B';
  let hasShadow = false;

  if (isPrimary) {
    btnBg = '#10B981'; // Brand Emerald
    borderCol = '#059669';
    txtColor = '#FFFFFF';
    hasShadow = true;
  } else if (isDestructive) {
    btnBg = '#E11D48'; // Rich Velvet Crimson
    borderCol = '#BE123C';
    txtColor = '#FFFFFF';
    hasShadow = true;
  }

  return (
    <Pressable
      style={({ pressed }) => [
        styles.actionButton,
        {
          backgroundColor: btnBg,
          borderColor: borderCol,
          flex: isSingle ? 1 : 1,
          opacity: pressed ? 0.88 : 1,
          transform: [{ scale: pressed ? 0.97 : 1 }],
        },
        hasShadow && isPrimary && styles.primaryShadow,
        hasShadow && isDestructive && styles.destructiveShadow,
      ]}
      onPress={() => {
        try {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } catch {
          // ignore
        }
        onSelect();
      }}
    >
      <Text
        style={[
          styles.actionButtonText,
          {
            color: txtColor,
            fontFamily: (isPrimary || isDestructive) ? Fonts.bold : Fonts.semiBold,
          },
        ]}
      >
        {button.text}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(10, 20, 35, 0.68)',
  },
  cardContainer: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 24,
    borderWidth: 1,
    paddingTop: 28,
    paddingBottom: 22,
    paddingHorizontal: 22,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#070C18',
        shadowOffset: { width: 0, height: 16 },
        shadowOpacity: 0.22,
        shadowRadius: 28,
      },
      android: {
        elevation: 16,
      },
    }),
  },
  outerHalo: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  innerBadge: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 6,
    marginBottom: 22,
  },
  titleText: {
    fontSize: 18,
    fontFamily: Fonts.bold,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  descText: {
    fontSize: 13.5,
    fontFamily: Fonts.regular,
    fontWeight: '400',
    lineHeight: 19.5,
    textAlign: 'center',
    marginTop: 8,
  },
  actionsRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 10,
  },
  actionButton: {
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  actionButtonText: {
    fontSize: 14,
    letterSpacing: -0.1,
  },
  primaryShadow: {
    ...Platform.select({
      ios: {
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  destructiveShadow: {
    ...Platform.select({
      ios: {
        shadowColor: '#E11D48',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
});
