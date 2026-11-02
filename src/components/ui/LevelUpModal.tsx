import React, { useEffect, useRef } from 'react';
import {
  Modal,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Animated,
  Easing,
  Platform,
} from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { PhosphorIcon } from '@/components/ui/PhosphorIcon';
import { Fonts } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useGamificationStore } from '@/store/gamificationStore';
import { useAuthStore } from '@/store/authStore';
import { safeHaptic } from '@/utils/haptics';

export function LevelUpModal() {
  const theme = useTheme();
  const isDark = theme.mode === 'dark';
  const store = useGamificationStore();
  const user = useAuthStore((s) => s.user);

  const pendingLevel = store.pendingLevelUp;
  const isVisible = pendingLevel !== null && pendingLevel !== undefined;

  const rotateAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isVisible) {
      safeHaptic('success');
      rotateAnim.setValue(0);
      scaleAnim.setValue(0);
      fadeAnim.setValue(0);

      // 1. Continuous rotation of background sunburst
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 12000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();

      // 2. Spring pop-in for the main level badge
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.15,
          duration: 350,
          easing: Easing.out(Easing.back(2)),
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 180,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]).start();

      // 3. Fade in text and perks
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay: 150,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }
  }, [isVisible]);

  if (!isVisible) return null;

  const handleDismiss = () => {
    safeHaptic('light');
    store.dismissLevelUp();
  };

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const firstName = user?.name ? user.name.split(' ')[0] : 'Explorer';

  return (
    <Modal visible={isVisible} transparent animationType="fade" onRequestClose={handleDismiss}>
      <View style={styles.backdrop}>
        <View style={styles.wrapper}>
          <View
            style={[
              styles.card,
              {
                backgroundColor: theme.surface,
                borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
              },
            ]}
          >
            {/* Top Glowing Header Gradient Accent */}
            <Svg width="100%" height={100} viewBox="0 0 340 100" fill="none" style={StyleSheet.absoluteFill}>
              <Defs>
                <LinearGradient id="lvlGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <Stop offset="0%" stopColor="#10B981" stopOpacity={isDark ? 0.35 : 0.12} />
                  <Stop offset="70%" stopColor="#10B981" stopOpacity={isDark ? 0.08 : 0.02} />
                  <Stop offset="100%" stopColor={isDark ? '#0F172A' : '#FFFFFF'} stopOpacity={0} />
                </LinearGradient>
              </Defs>
              <Rect width="340" height="100" fill="url(#lvlGrad)" />
            </Svg>

            {/* Close Button Top Right */}
            <TouchableOpacity
              onPress={handleDismiss}
              style={[
                styles.closeBtn,
                { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)' },
              ]}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <PhosphorIcon name="X" size={14} color={theme.textSecondary} />
            </TouchableOpacity>

            <View style={styles.content}>
              {/* Spinning Sunburst & Level Badge */}
              <View style={styles.badgeContainer}>
                <Animated.View style={[styles.sunburst, { transform: [{ rotate: spin }] }]}>
                  <PhosphorIcon name="Sparkle" size={88} color="rgba(16, 185, 129, 0.25)" weight="fill" />
                </Animated.View>

                <Animated.View style={[styles.badgeCircle, { transform: [{ scale: scaleAnim }] }]}>
                  <Text style={styles.badgeEmoji}>🏆</Text>
                  <View style={styles.levelTag}>
                    <Text style={styles.levelTagText}>LVL {pendingLevel}</Text>
                  </View>
                </Animated.View>
              </View>

              <Animated.View style={[styles.textGroup, { opacity: fadeAnim }]}>
                {/* Level Up Title */}
                <Text style={styles.subTitle}>CONGRATULATIONS!</Text>
                <Text style={[styles.mainTitle, { color: theme.text }]}>
                  You're Level {pendingLevel}! 🎉
                </Text>
                <Text style={[styles.desc, { color: theme.textSecondary }]}>
                  Awesome progress, {firstName}! Your financial discipline is paying off.
                </Text>

                {/* Unlocked Perks List */}
                <View
                  style={[
                    styles.perksBox,
                    {
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#F8FAFC',
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0',
                    },
                  ]}
                >
                  <View style={styles.perkRow}>
                    <View style={styles.perkIconWrap}>
                      <PhosphorIcon name="TrendUp" size={16} color="#10B981" weight="bold" />
                    </View>
                    <View style={styles.perkTextGroup}>
                      <Text style={[styles.perkTitle, { color: theme.text }]}>
                        Higher Simulator Power
                      </Text>
                      <Text style={[styles.perkDesc, { color: theme.textSecondary }]}>
                        Expanded portfolio limits and faster XP streak boosts.
                      </Text>
                    </View>
                  </View>

                  <View style={[styles.divider, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#E2E8F0' }]} />

                  <View style={styles.perkRow}>
                    <View style={[styles.perkIconWrap, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
                      <PhosphorIcon name="GraduationCap" size={16} color="#3B82F6" weight="bold" />
                    </View>
                    <View style={styles.perkTextGroup}>
                      <Text style={[styles.perkTitle, { color: theme.text }]}>
                        Financial Academy Mastery
                      </Text>
                      <Text style={[styles.perkDesc, { color: theme.textSecondary }]}>
                        Advanced budgeting & investment lessons ready to explore.
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Primary Action Button */}
                <TouchableOpacity
                  onPress={handleDismiss}
                  style={styles.awesomeBtn}
                  activeOpacity={0.85}
                >
                  <Text style={styles.awesomeBtnText}>Claim & Continue ✨</Text>
                </TouchableOpacity>
              </Animated.View>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 18,
    zIndex: 9999,
  },
  wrapper: {
    width: '100%',
    maxWidth: 350,
  },
  card: {
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
    ...Platform.select({
      ios: {
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.35,
        shadowRadius: 28,
      },
      android: {
        elevation: 20,
      },
    }),
  },
  closeBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  content: {
    padding: 22,
    alignItems: 'center',
  },
  badgeContainer: {
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 8,
    position: 'relative',
  },
  sunburst: {
    position: 'absolute',
    width: 88,
    height: 88,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 2,
    borderColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeEmoji: {
    fontSize: 32,
  },
  levelTag: {
    position: 'absolute',
    bottom: -6,
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  levelTagText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: Fonts.bold,
    letterSpacing: 0.5,
  },
  textGroup: {
    width: '100%',
    alignItems: 'center',
    marginTop: 10,
  },
  subTitle: {
    color: '#10B981',
    fontSize: 11,
    fontFamily: Fonts.bold,
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  mainTitle: {
    fontSize: 22,
    fontFamily: Fonts.bold,
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  desc: {
    fontSize: 12.5,
    fontFamily: Fonts.medium,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 4,
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  perksBox: {
    width: '100%',
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    gap: 10,
    marginBottom: 18,
  },
  perkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  perkIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  perkTextGroup: {
    flex: 1,
  },
  perkTitle: {
    fontSize: 12.5,
    fontFamily: Fonts.bold,
  },
  perkDesc: {
    fontSize: 11,
    fontFamily: Fonts.regular,
    marginTop: 1,
  },
  divider: {
    height: 1,
    width: '100%',
  },
  awesomeBtn: {
    backgroundColor: '#10B981',
    width: '100%',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  awesomeBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: Fonts.bold,
  },
});

