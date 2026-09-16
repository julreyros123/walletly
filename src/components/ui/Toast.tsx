import React, { useEffect } from 'react';
import { StyleSheet, Text, View, Pressable, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { PhosphorIcon } from '@/components/ui/PhosphorIcon';
import type { PhosphorIconName } from '@/components/ui/PhosphorIcon';
import * as Haptics from 'expo-haptics';
import { useToastStore, ToastType } from '@/store/toastStore';
import { Fonts } from '@/constants/theme';

const TOAST_ICONS: Record<ToastType, { icon: PhosphorIconName; color: string; bg: string }> = {
  success: {
    icon: 'CheckCircle',
    color: '#10B981',
    bg: 'rgba(16, 185, 129, 0.15)',
  },
  info: {
    icon: 'Info',
    color: '#38BDF8',
    bg: 'rgba(56, 189, 248, 0.15)',
  },
  warning: {
    icon: 'Warning',
    color: '#F59E0B',
    bg: 'rgba(245, 158, 11, 0.15)',
  },
  error: {
    icon: 'XCircle',
    color: '#EF4444',
    bg: 'rgba(239, 68, 68, 0.15)',
  },
};

export function ToastProvider() {
  const insets = useSafeAreaInsets();
  const currentToast = useToastStore((state) => state.currentToast);
  const hideToast = useToastStore((state) => state.hideToast);

  const translateY = useSharedValue(-120);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (currentToast) {
      try {
        if (currentToast.type === 'success') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else if (currentToast.type === 'error') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } else {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      } catch (error) {
        console.warn('Toast haptics error:', error);
      }

      translateY.value = withSpring(0, { damping: 14, stiffness: 220 });
      opacity.value = withTiming(1, { duration: 200 });

      const timer = setTimeout(() => {
        translateY.value = withTiming(-120, { duration: 220 }, (finished) => {
          if (finished) {
            runOnJS(hideToast)();
          }
        });
        opacity.value = withTiming(0, { duration: 200 });
      }, currentToast.durationMs ?? 2600);

      return () => clearTimeout(timer);
    } else {
      translateY.value = -120;
      opacity.value = 0;
    }
  }, [currentToast, hideToast, translateY, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  if (!currentToast) return null;

  const iconInfo = TOAST_ICONS[currentToast.type] || TOAST_ICONS.info;

  return (
    <View
      pointerEvents="box-none"
      style={[styles.container, { top: Math.max(insets.top, 16) + 8 }]}
    >
      <Animated.View style={[styles.toastPill, animatedStyle]}>
        <Pressable
          onPress={() => {
            translateY.value = withTiming(-120, { duration: 180 }, (finished) => {
              if (finished) runOnJS(hideToast)();
            });
            opacity.value = withTiming(0, { duration: 160 });
          }}
          style={styles.innerContent}
        >
          <View style={[styles.iconCircle, { backgroundColor: iconInfo.bg }]}>
            <PhosphorIcon
              name={iconInfo.icon}
              size={18}
              color={iconInfo.color}
              weight="fill"
            />
          </View>

          <View style={styles.textContainer}>
            <Text style={styles.title} numberOfLines={1}>
              {currentToast.title}
            </Text>
            {!!currentToast.message && (
              <Text style={styles.message} numberOfLines={2}>
                {currentToast.message}
              </Text>
            )}
          </View>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 9999,
    alignItems: 'center',
  },
  toastPill: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#0F172A',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    paddingVertical: 10,
    paddingHorizontal: 14,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.28,
        shadowRadius: 14,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
      } as any,
    }),
  },
  innerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontFamily: Fonts.bold,
    letterSpacing: -0.2,
  },
  message: {
    color: '#94A3B8',
    fontSize: 12,
    fontFamily: Fonts.medium,
    marginTop: 1,
  },
});

export default ToastProvider;
