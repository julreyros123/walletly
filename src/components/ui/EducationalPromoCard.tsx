import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, Animated, Easing, Platform } from 'react-native';
import { XStack, YStack, Text as TamaguiText } from 'tamagui';
const Text = (props: any) => <TamaguiText {...props} />;
import { useRouter, Href } from 'expo-router';
import Svg, { Path, Circle, Rect, G, Defs, LinearGradient, Stop } from 'react-native-svg';
import { safeHaptic } from '@/utils/haptics';
import { Fonts } from '../../constants/theme';
import { useTheme } from '@/hooks/use-theme';
import CbudgetCard from './CbudgetCard';

interface StageItem {
  id: string;
  stageName: string;
  badge: string;
  title: string;
  desc: string;
  actionText: string;
  route: string;
  xpReward: number;
}

const CAROUSEL_STAGES: StageItem[] = [
  {
    id: 'stage-kid',
    stageName: 'Junior Saver',
    badge: 'STAGE 1 • FOUNDATIONS',
    title: 'The 50/30/20 Rule',
    desc: 'Allocate 50% of your income or allowance to Needs, 30% to Wants, and 20% directly to Savings & Goals.',
    actionText: 'Learn Budgeting 📖',
    route: '/(tabs)/budget',
    xpReward: 20,
  },
  {
    id: 'stage-teen',
    stageName: 'Teen Investor',
    badge: 'STAGE 2 • HIGH SCHOOL',
    title: 'Compound Interest Magic',
    desc: 'Investing just ₱500 monthly during your teenage years grows into massive wealth due to decades of compounding.',
    actionText: 'Trade Sandbox 📈',
    route: '/(tabs)/invest',
    xpReward: 25,
  },
  {
    id: 'stage-shs',
    stageName: 'SHS Graduate',
    badge: 'STAGE 3 • STRATEGIST',
    title: 'Asset Diversification & DCA',
    desc: 'Spread capital across diversified stocks, high-yield savings, and round-ups to build sustainable wealth.',
    actionText: 'Explore Academy 🎓',
    route: '/(tabs)/learn',
    xpReward: 30,
  },
];

export function EducationalPromoCard() {
  const router = useRouter();
  const theme = useTheme();
  const [currentIdx, setCurrentIdx] = useState(0);

  // 100% Native Driver Animated Values
  const gazeGazeAnim = useRef(new Animated.Value(0)).current; // 0 = looking up at sky, 1 = looking down at item
  const chinHandAnim = useRef(new Animated.Value(0)).current;
  const itemTiltAnim = useRef(new Animated.Value(0)).current;
  const thoughtCloudAnim = useRef(new Animated.Value(0)).current;
  const transitionFadeAnim = useRef(new Animated.Value(1)).current;
  const transitionSlideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 1. Thinking Gaze Cycle (Looking UP at sky -> Looking DOWN at item in hand)
    const gazeLoop = Animated.loop(
      Animated.sequence([
        // Look UP at sky
        Animated.timing(gazeGazeAnim, {
          toValue: 0,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        // Smoothly glance down
        Animated.timing(gazeGazeAnim, {
          toValue: 1,
          duration: 700,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
        // Look DOWN at item
        Animated.delay(1800),
        // Glance back up
        Animated.timing(gazeGazeAnim, {
          toValue: 0,
          duration: 700,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
      ])
    );

    // 2. Chin Hand subtle thoughtful tap / motion
    const chinLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(chinHandAnim, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(chinHandAnim, {
          toValue: 0,
          duration: 1200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    // 3. Item tilt motion (money, smartphone, or tablet)
    const itemLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(itemTiltAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(itemTiltAnim, {
          toValue: -1,
          duration: 1500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    // 4. Thought cloud breathing pulse
    const cloudLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(thoughtCloudAnim, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(thoughtCloudAnim, {
          toValue: 0,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    gazeLoop.start();
    chinLoop.start();
    itemLoop.start();
    cloudLoop.start();

    // 5. Auto-play carousel timer: smoothly cycles to next stage every 5.5 seconds
    const autoPlayInterval = setInterval(() => {
      triggerSmoothTransition((prev) => (prev + 1) % CAROUSEL_STAGES.length);
    }, 5500);

    return () => {
      gazeLoop.stop();
      chinLoop.stop();
      itemLoop.stop();
      cloudLoop.stop();
      clearInterval(autoPlayInterval);
    };
  }, []);

  const triggerSmoothTransition = (nextIndexOrUpdater: number | ((prev: number) => number)) => {
    // 1. Immediately switch state (zero delay)
    if (typeof nextIndexOrUpdater === 'function') {
      setCurrentIdx(nextIndexOrUpdater);
    } else {
      setCurrentIdx(nextIndexOrUpdater);
    }

    // 2. Immediate responsive glide-in
    transitionFadeAnim.setValue(0.35);
    transitionSlideAnim.setValue(12);

    Animated.parallel([
      Animated.timing(transitionFadeAnim, {
        toValue: 1,
        duration: 240,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(transitionSlideAnim, {
        toValue: 0,
        duration: 240,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleNextStage = (nextIndex?: number) => {
    safeHaptic('light');

    if (nextIndex !== undefined) {
      triggerSmoothTransition(nextIndex);
    } else {
      triggerSmoothTransition((prev) => (prev + 1) % CAROUSEL_STAGES.length);
    }
  };

  const handleAction = (route: string) => {
    safeHaptic('medium');
    router.push(route as Href);
  };

  const currentStage = CAROUSEL_STAGES[currentIdx];

  // Head tilt based on gaze
  const headTilt = gazeGazeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['-2.5deg', '3.5deg'],
  });

  // Eye Pupils translation: Looking up at sky vs looking down at hand
  const pupilX = gazeGazeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-1.2, 2.5],
  });
  const pupilY = gazeGazeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-2.2, 2.8],
  });

  // Left Chin Hand movement
  const chinHandY = chinHandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -2],
  });

  // Right Item tilt
  const itemTilt = itemTiltAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-4deg', '6deg'],
  });

  const cloudScale = thoughtCloudAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.94, 1.06],
  });

  return (
    <CbudgetCard marginBottom={14} padding={14} gap={0} style={styles.fixedCardContainer}>
      {/* ==================== 1. SCENERY & CHARACTER BANNER ==================== */}
      <Animated.View
        style={[
          styles.daylightBanner,
          {
            opacity: transitionFadeAnim,
            transform: [{ translateX: transitionSlideAnim }],
          },
        ]}
      >
        {/* Background Landscape: Sky, Sun, Environment based on Stage */}
        <Svg width="100%" height={140} viewBox="0 0 320 140" fill="none">
          <Defs>
            {/* Daylight Sky Gradient */}
            <LinearGradient id="sky1" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor="#38BDF8" />
              <Stop offset="55%" stopColor="#7DD3FC" />
              <Stop offset="100%" stopColor="#BAE6FD" />
            </LinearGradient>

            {/* Sunset / Campus Sky for Teen */}
            <LinearGradient id="skyTeen" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor="#0284C7" />
              <Stop offset="60%" stopColor="#38BDF8" />
              <Stop offset="100%" stopColor="#FDE047" />
            </LinearGradient>

            {/* City Tech Hub Sky for SHS */}
            <LinearGradient id="skySHS" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor="#1E3A8A" />
              <Stop offset="50%" stopColor="#3B82F6" />
              <Stop offset="100%" stopColor="#93C5FD" />
            </LinearGradient>

            {/* Sun Radial */}
            <LinearGradient id="sunGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#FFFBEB" />
              <Stop offset="40%" stopColor="#FDE047" />
              <Stop offset="100%" stopColor="#F59E0B" />
            </LinearGradient>

            {/* Green Hills */}
            <LinearGradient id="dayHill1" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor="#4ADE80" />
              <Stop offset="100%" stopColor="#16A34A" />
            </LinearGradient>
            <LinearGradient id="dayHill2" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor="#22C55E" />
              <Stop offset="100%" stopColor="#15803D" />
            </LinearGradient>
          </Defs>

          {/* Sky Backdrop */}
          <Rect
            width="320"
            height="140"
            rx="10"
            fill={currentIdx === 0 ? 'url(#sky1)' : currentIdx === 1 ? 'url(#skyTeen)' : 'url(#skySHS)'}
          />

          {/* Golden Sun */}
          <Circle cx="44" cy="28" r="22" fill="#FEF08A" opacity={0.4} />
          <Circle cx="44" cy="28" r="14" fill="url(#sunGrad)" />

          {/* Clouds */}
          <Path d="M80 26C80 21 85 16 91 16C96 16 99 18 101 22C104 21 107 21 110 23C113 23 116 26 116 29C116 33 112 36 107 36H85C81 36 80 32 80 26Z" fill="#FFFFFF" opacity={0.85} />
          <Path d="M170 18C170 14 174 11 178 11C182 11 185 13 186 15C189 14 191 14 193 16C196 16 198 18 198 21C198 24 195 26 191 26H174C171 26 170 23 170 18Z" fill="#FFFFFF" opacity={0.75} />

          {/* ==================== SCENERY ENVIRONMENT ==================== */}
          {currentIdx === 0 && (
            /* STAGE 1: Suburban House & Apple Garden */
            <G>
              <Circle cx="120" cy="74" r="18" fill="#15803D" opacity={0.8} />
              <Circle cx="138" cy="78" r="14" fill="#166534" opacity={0.85} />
              <Rect x="18" y="66" width="62" height="54" fill="#F8FAFC" rx="2" stroke="#CBD5E1" strokeWidth={1} />
              <Path d="M10 68L49 36L88 68Z" fill="#F97316" />
              <Rect x="64" y="44" width="8" height="14" fill="#9A3412" />
              <Rect x="28" y="76" width="18" height="18" rx="2" fill="#E0F2FE" stroke="#38BDF8" strokeWidth={1.5} />
              <Path d="M37 76V94M28 85H46" stroke="#0284C7" strokeWidth={1.2} />
              <Rect x="54" y="82" width="16" height="38" rx="2" fill="#78350F" />
              <Circle cx="66" cy="100" r="1.8" fill="#FDE047" />
              <Path d="M84 100V120M92 100V120M100 100V120M108 100V120M80 106H112M80 114H112" stroke="#FFFFFF" strokeWidth={2} strokeLinecap="round" />
              <Rect x="124" y="86" width="7" height="32" fill="#78350F" />
              <Circle cx="127" cy="80" r="18" fill="#22C55E" />
              <Circle cx="135" cy="74" r="13" fill="#4ADE80" opacity={0.9} />
              <Circle cx="122" cy="76" r="2.2" fill="#EF4444" />
              <Circle cx="132" cy="82" r="2.2" fill="#EF4444" />
            </G>
          )}

          {currentIdx === 1 && (
            /* STAGE 2: High School Campus Quad & Trees */
            <G>
              <Rect x="16" y="55" width="80" height="65" fill="#334155" rx="3" />
              <Rect x="46" y="38" width="20" height="20" fill="#475569" rx="2" />
              <Circle cx="56" cy="48" r="5" fill="#FEF08A" />
              <Rect x="26" y="66" width="14" height="20" fill="#E2E8F0" rx="1" />
              <Rect x="46" y="66" width="14" height="20" fill="#E2E8F0" rx="1" />
              <Rect x="66" y="66" width="14" height="20" fill="#E2E8F0" rx="1" />
              <Rect x="118" y="78" width="8" height="40" fill="#582F0E" />
              <Circle cx="122" cy="68" r="22" fill="#16A34A" />
              <Circle cx="134" cy="62" r="16" fill="#22C55E" />
              <Rect x="142" y="105" width="24" height="6" rx="2" fill="#854D0E" />
            </G>
          )}

          {currentIdx === 2 && (
            /* STAGE 3: Modern Tech / Financial District Skyline */
            <G>
              <Rect x="18" y="40" width="34" height="80" fill="#1E293B" rx="3" />
              <Rect x="56" y="28" width="36" height="92" fill="#0F172A" rx="3" />
              <Rect x="96" y="48" width="32" height="72" fill="#334155" rx="3" />
              <Rect x="24" y="48" width="8" height="6" fill="#38BDF8" opacity={0.8} />
              <Rect x="36" y="48" width="8" height="6" fill="#FEF08A" opacity={0.8} />
              <Rect x="24" y="60" width="8" height="6" fill="#FEF08A" opacity={0.8} />
              <Rect x="36" y="60" width="8" height="6" fill="#38BDF8" opacity={0.8} />
              <Rect x="64" y="36" width="8" height="6" fill="#38BDF8" opacity={0.9} />
              <Rect x="76" y="36" width="8" height="6" fill="#38BDF8" opacity={0.9} />
              <Rect x="64" y="48" width="8" height="6" fill="#FEF08A" opacity={0.8} />
              <Rect x="76" y="48" width="8" height="6" fill="#38BDF8" opacity={0.9} />
              <Path d="M124 100Q136 80 148 100V120H124Z" fill="#64748B" opacity={0.5} />
            </G>
          )}

          {/* Rolling Green Grass Lawns */}
          <Path d="M0 114Q80 94 170 106Q240 114 320 102V140H0Z" fill="url(#dayHill2)" />
          <Path d="M0 122Q100 106 210 116Q270 122 320 112V140H0Z" fill="url(#dayHill1)" />

          {/* Wildflowers */}
          <Circle cx="40" cy="128" r="2.5" fill="#FDE047" />
          <Circle cx="88" cy="130" r="2.5" fill="#F472B6" />
          <Circle cx="140" cy="126" r="2.5" fill="#FDE047" />
          <Circle cx="178" cy="130" r="2.5" fill="#FFFFFF" />
        </Svg>

        {/* Thought Cloud with Dynamic Stage Icon */}
        <Animated.View style={[styles.thoughtCloudContainer, { transform: [{ scale: cloudScale }] }]}>
          <Svg width={66} height={40} viewBox="0 0 66 40" fill="none">
            <Circle cx="8" cy="34" r="3.5" fill="#FFFFFF" opacity={0.7} />
            <Circle cx="16" cy="26" r="5" fill="#FFFFFF" opacity={0.85} />
            <Rect x="20" y="4" width="44" height="28" rx="14" fill="#FFFFFF" />
            {currentIdx === 0 && (
              /* Lightbulb for Kid */
              <G>
                <Circle cx="42" cy="15" r="5" fill="#FDE047" stroke="#D97706" strokeWidth={1} />
                <Rect x="40" y="20" width="4" height="3" rx="1" fill="#D97706" />
                <Path d="M42 6V9M34 10L36.5 12M50 10L47.5 12" stroke="#F59E0B" strokeWidth={1.5} strokeLinecap="round" />
              </G>
            )}
            {currentIdx === 1 && (
              /* Upward Growth Chart for Teen */
              <G>
                <Path d="M30 22L38 15L44 19L52 10" stroke="#10B981" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
                <Path d="M46 10H52V16" stroke="#10B981" strokeWidth={2.5} strokeLinecap="round" />
              </G>
            )}
            {currentIdx === 2 && (
              /* Rocket / Bull Market for SHS */
              <G>
                <Path d="M42 8C38 12 36 18 36 22H48C48 18 46 12 42 8Z" fill="#6366F1" />
                <Circle cx="42" cy="15" r="2" fill="#FFFFFF" />
                <Path d="M40 22L36 26H48L44 22" fill="#EF4444" />
              </G>
            )}
          </Svg>
        </Animated.View>

        {/* ==================== 2. CHARACTER RENDERING ==================== */}
        <View style={styles.kidCharacterHolder}>
          {/* ==================== CHARACTER 1: KID (STAGE 0) ==================== */}
          {currentIdx === 0 && (
            <React.Fragment>
              {/* Steady Body */}
              <View style={styles.fullLayer}>
                <Svg width={92} height={120} viewBox="0 0 92 120" fill="none">
                  <Rect x="26" y="104" width="12" height="14" rx="4" fill="#0F172A" />
                  <Rect x="48" y="104" width="12" height="14" rx="4" fill="#0F172A" />
                  <Rect x="25" y="114" width="14" height="4" rx="2" fill="#FFFFFF" />
                  <Rect x="47" y="114" width="14" height="4" rx="2" fill="#FFFFFF" />
                  <Path d="M26 80H60V105H47V88H39V105H26V80Z" fill="#1E3A8A" />
                  <Path d="M20 50C20 40 28 36 43 36C58 36 66 40 66 50V80H20V50Z" fill="#3EB47D" />
                  <Path d="M36 36L43 45L50 36" stroke="#FFDFC4" strokeWidth={2} fill="#F0BE9B" />
                  <Rect x="39" y="30" width="8" height="8" fill="#FFDFC4" />
                </Svg>
              </View>

              {/* Head & Face */}
              <Animated.View style={[styles.fullLayer, { transform: [{ rotate: headTilt }] }]}>
                <Svg width={92} height={120} viewBox="0 0 92 120" fill="none">
                  <Circle cx={43} cy={24} r={18} fill="#FFDFC4" />
                  <Circle cx={25} cy={25} r={3.8} fill="#FFDFC4" />
                  <Circle cx={61} cy={25} r={3.8} fill="#FFDFC4" />
                  <Path d="M24 22C23 11 30 3 43 3C56 3 63 11 62 22C60 16 55 10 48 10C42 10 38 8 32 10C27 12 25 16 24 22Z" fill="#6F360E" />
                  <Path d="M34 6Q43 4 52 6" stroke="#8A4211" strokeWidth={1.5} strokeLinecap="round" />
                  <Path d="M33 16Q36 13 40 15" stroke="#3C1A03" strokeWidth={1.6} strokeLinecap="round" />
                  <Path d="M47 14Q50 12 54 14" stroke="#3C1A03" strokeWidth={1.6} strokeLinecap="round" />
                  <Circle cx={37} cy={21.5} r={3.8} fill="#FFFFFF" />
                  <Circle cx={49} cy={20.5} r={3.8} fill="#FFFFFF" />
                  <Path d="M41 31Q43 29 45 31" stroke="#C2410C" strokeWidth={1.6} strokeLinecap="round" />
                  <Circle cx={31} cy={25.5} r={2.8} fill="#F87171" opacity={0.4} />
                  <Circle cx={55} cy={25.5} r={2.8} fill="#F87171" opacity={0.4} />
                </Svg>

                <Animated.View style={[styles.fullLayer, { transform: [{ translateX: pupilX }, { translateY: pupilY }] }]}>
                  <Svg width={92} height={120} viewBox="0 0 92 120" fill="none">
                    <Circle cx={37.5} cy={21.5} r={2.2} fill="#1E293B" />
                    <Circle cx={38.3} cy={20.7} r={0.9} fill="#FFFFFF" />
                    <Circle cx={49.5} cy={20.5} r={2.2} fill="#1E293B" />
                    <Circle cx={50.3} cy={19.7} r={0.9} fill="#FFFFFF" />
                  </Svg>
                </Animated.View>
              </Animated.View>

              {/* Left Chin Hand */}
              <Animated.View style={[styles.fullLayer, { transform: [{ translateY: chinHandY }] }]}>
                <Svg width={92} height={120} viewBox="0 0 92 120" fill="none">
                  <Path d="M22 50C16 58 20 66 30 62L38 46" stroke="#FFDFC4" strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
                  <Circle cx={39} cy={43} r={5} fill="#FFDFC4" />
                </Svg>
              </Animated.View>

              {/* Right Money Hand */}
              <Animated.View style={[styles.fullLayer, { transform: [{ rotate: itemTilt }] }]}>
                <Svg width={92} height={120} viewBox="0 0 92 120" fill="none">
                  <Path d="M64 50C70 54 76 48 80 40" stroke="#FFDFC4" strokeWidth={6} strokeLinecap="round" />
                  <Circle cx={81} cy={38} r={5} fill="#FFDFC4" />
                  <G transform="translate(74, 22) rotate(12)">
                    <Rect x="-2" y="-1" width="20" height="11" rx="2" fill="#22C55E" stroke="#15803D" strokeWidth={1} />
                    <Circle cx={8} cy={4.5} r={2.5} fill="#15803D" opacity={0.3} />
                    <Path d="M8 2.5V6.5" stroke="#FFFFFF" strokeWidth={1} />
                    <Circle cx={18} cy={9} r={6} fill="#FDE047" stroke="#CA8A04" strokeWidth={1} />
                    <Circle cx={18} cy={9} r={4} stroke="#FFFFFF" strokeWidth={0.8} opacity={0.7} />
                  </G>
                </Svg>
              </Animated.View>
            </React.Fragment>
          )}

          {/* ==================== CHARACTER 2: TEENAGER (STAGE 1) ==================== */}
          {currentIdx === 1 && (
            <React.Fragment>
              {/* Steady Teen Body */}
              <View style={styles.fullLayer}>
                <Svg width={92} height={120} viewBox="0 0 92 120" fill="none">
                  <Rect x="26" y="104" width="12" height="14" rx="4" fill="#E11D48" />
                  <Rect x="48" y="104" width="12" height="14" rx="4" fill="#E11D48" />
                  <Rect x="25" y="114" width="14" height="4" rx="2" fill="#FFFFFF" />
                  <Rect x="47" y="114" width="14" height="4" rx="2" fill="#FFFFFF" />
                  <Path d="M26 78H60V105H47V86H39V105H26V78Z" fill="#0F172A" />
                  <Path d="M18 46C18 36 26 32 43 32C60 32 68 36 68 46V78H18V46Z" fill="#2563EB" />
                  <Path d="M38 32L43 42L48 32" stroke="#FFFFFF" strokeWidth={3} fill="#FFFFFF" />
                  <Path d="M30 38C30 46 56 46 56 38" stroke="#0F172A" strokeWidth={4} strokeLinecap="round" />
                  <Circle cx="30" cy="38" r="4" fill="#E11D48" />
                  <Circle cx="56" cy="38" r="4" fill="#E11D48" />
                  <Rect x="39" y="26" width="8" height="8" fill="#FFDFC4" />
                </Svg>
              </View>

              {/* Teen Head */}
              <Animated.View style={[styles.fullLayer, { transform: [{ rotate: headTilt }] }]}>
                <Svg width={92} height={120} viewBox="0 0 92 120" fill="none">
                  <Circle cx={43} cy={22} r={17} fill="#FFDFC4" />
                  <Circle cx={26} cy={23} r={3.5} fill="#FFDFC4" />
                  <Circle cx={60} cy={23} r={3.5} fill="#FFDFC4" />
                  <Path d="M25 18C24 8 32 2 45 2C57 2 62 8 62 18C59 13 54 8 46 8C39 8 35 6 29 9C26 11 25 14 25 18Z" fill="#1E293B" />
                  <Path d="M34 5Q44 3 53 5" stroke="#475569" strokeWidth={1.5} strokeLinecap="round" />
                  <Path d="M33 14Q37 11 41 13" stroke="#0F172A" strokeWidth={1.8} strokeLinecap="round" />
                  <Path d="M47 12Q51 10 55 12" stroke="#0F172A" strokeWidth={1.8} strokeLinecap="round" />
                  <Circle cx={37} cy={19.5} r={3.5} fill="#FFFFFF" />
                  <Circle cx={49} cy={18.5} r={3.5} fill="#FFFFFF" />
                  <Path d="M41 27Q44 26 47 27" stroke="#991B1B" strokeWidth={1.8} strokeLinecap="round" />
                </Svg>

                <Animated.View style={[styles.fullLayer, { transform: [{ translateX: pupilX }, { translateY: pupilY }] }]}>
                  <Svg width={92} height={120} viewBox="0 0 92 120" fill="none">
                    <Circle cx={37.5} cy={19.5} r={2.2} fill="#0F172A" />
                    <Circle cx={38.3} cy={18.7} r={0.9} fill="#FFFFFF" />
                    <Circle cx={49.5} cy={18.5} r={2.2} fill="#0F172A" />
                    <Circle cx={50.3} cy={17.7} r={0.9} fill="#FFFFFF" />
                  </Svg>
                </Animated.View>
              </Animated.View>

              {/* Teen Left Chin Hand */}
              <Animated.View style={[styles.fullLayer, { transform: [{ translateY: chinHandY }] }]}>
                <Svg width={92} height={120} viewBox="0 0 92 120" fill="none">
                  <Path d="M22 46C16 54 20 62 30 58L38 42" stroke="#FFDFC4" strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
                  <Circle cx={39} cy={39} r={5} fill="#FFDFC4" />
                </Svg>
              </Animated.View>

              {/* Teen Right Hand (Smartphone) */}
              <Animated.View style={[styles.fullLayer, { transform: [{ rotate: itemTilt }] }]}>
                <Svg width={92} height={120} viewBox="0 0 92 120" fill="none">
                  <Path d="M64 46C70 50 76 44 80 36" stroke="#FFDFC4" strokeWidth={6} strokeLinecap="round" />
                  <Circle cx={81} cy={34} r={5} fill="#FFDFC4" />
                  <G transform="translate(74, 14) rotate(10)">
                    <Rect x="-2" y="-1" width="16" height="26" rx="3" fill="#0F172A" stroke="#334155" strokeWidth={1} />
                    <Rect x="0" y="2" width="12" height="20" rx="1" fill="#022C22" />
                    <Path d="M2 16L5 11L8 14L11 6" stroke="#10B981" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
                    <Circle cx="11" cy="6" r="1.5" fill="#34D399" />
                  </G>
                </Svg>
              </Animated.View>
            </React.Fragment>
          )}

          {/* ==================== CHARACTER 3: SHS / YOUNG ADULT (STAGE 2) ==================== */}
          {currentIdx === 2 && (
            <React.Fragment>
              {/* Steady SHS Body */}
              <View style={styles.fullLayer}>
                <Svg width={92} height={120} viewBox="0 0 92 120" fill="none">
                  <Rect x="26" y="104" width="12" height="14" rx="4" fill="#451A03" />
                  <Rect x="48" y="104" width="12" height="14" rx="4" fill="#451A03" />
                  <Rect x="25" y="114" width="14" height="4" rx="2" fill="#1E293B" />
                  <Rect x="47" y="114" width="14" height="4" rx="2" fill="#1E293B" />
                  <Path d="M26 78H60V105H47V86H39V105H26V78Z" fill="#475569" />
                  <Path d="M18 44C18 34 26 30 43 30C60 30 68 34 68 44V78H18V44Z" fill="#4338CA" />
                  <Path d="M37 30L43 40L49 30" stroke="#FFFFFF" strokeWidth={3} fill="#FFFFFF" />
                  <Path d="M42 34L44 34L45 44L43 47L41 44Z" fill="#10B981" />
                  <Rect x="39" y="24" width="8" height="8" fill="#FFDFC4" />
                </Svg>
              </View>

              {/* SHS Head */}
              <Animated.View style={[styles.fullLayer, { transform: [{ rotate: headTilt }] }]}>
                <Svg width={92} height={120} viewBox="0 0 92 120" fill="none">
                  <Circle cx={43} cy={22} r={17} fill="#FFDFC4" />
                  <Circle cx={26} cy={23} r={3.5} fill="#FFDFC4" />
                  <Circle cx={60} cy={23} r={3.5} fill="#FFDFC4" />
                  <Path d="M25 18C24 7 32 2 44 2C56 2 62 7 62 18C59 13 54 7 46 7C39 7 35 5 29 8C26 10 25 13 25 18Z" fill="#312E81" />
                  <Path d="M34 5Q44 3 53 5" stroke="#6366F1" strokeWidth={1.5} strokeLinecap="round" />
                  <Rect x="32" y="15" width="10" height="9" rx="2" fill="none" stroke="#F59E0B" strokeWidth={1.2} />
                  <Rect x="44" y="14" width="10" height="9" rx="2" fill="none" stroke="#F59E0B" strokeWidth={1.2} />
                  <Path d="M42 18H44" stroke="#F59E0B" strokeWidth={1.2} />
                  <Path d="M33 13Q37 10 41 12" stroke="#1E1B4B" strokeWidth={1.8} strokeLinecap="round" />
                  <Path d="M46 11Q50 9 54 11" stroke="#1E1B4B" strokeWidth={1.8} strokeLinecap="round" />
                  <Circle cx={37} cy={19.5} r={3.5} fill="#FFFFFF" />
                  <Circle cx={49} cy={18.5} r={3.5} fill="#FFFFFF" />
                  <Path d="M41 27Q44 26 47 27" stroke="#7F1D1D" strokeWidth={1.8} strokeLinecap="round" />
                </Svg>

                <Animated.View style={[styles.fullLayer, { transform: [{ translateX: pupilX }, { translateY: pupilY }] }]}>
                  <Svg width={92} height={120} viewBox="0 0 92 120" fill="none">
                    <Circle cx={37.5} cy={19.5} r={2.2} fill="#0F172A" />
                    <Circle cx={38.3} cy={18.7} r={0.9} fill="#FFFFFF" />
                    <Circle cx={49.5} cy={18.5} r={2.2} fill="#0F172A" />
                    <Circle cx={50.3} cy={17.7} r={0.9} fill="#FFFFFF" />
                  </Svg>
                </Animated.View>
              </Animated.View>

              {/* SHS Left Chin Hand */}
              <Animated.View style={[styles.fullLayer, { transform: [{ translateY: chinHandY }] }]}>
                <Svg width={92} height={120} viewBox="0 0 92 120" fill="none">
                  <Path d="M22 44C16 52 20 60 30 56L38 40" stroke="#FFDFC4" strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
                  <Circle cx={39} cy={37} r={5} fill="#FFDFC4" />
                </Svg>
              </Animated.View>

              {/* SHS Right Hand (Tablet Chart) */}
              <Animated.View style={[styles.fullLayer, { transform: [{ rotate: itemTilt }] }]}>
                <Svg width={92} height={120} viewBox="0 0 92 120" fill="none">
                  <Path d="M64 44C70 48 76 42 80 34" stroke="#FFDFC4" strokeWidth={6} strokeLinecap="round" />
                  <Circle cx={81} cy={32} r={5} fill="#FFDFC4" />
                  <G transform="translate(72, 10) rotate(10)">
                    <Rect x="-2" y="-1" width="22" height="28" rx="3" fill="#0F172A" stroke="#475569" strokeWidth={1} />
                    <Rect x="0" y="2" width="18" height="22" rx="1" fill="#1E293B" />
                    <Circle cx="9" cy="11" r="5.5" fill="none" stroke="#10B981" strokeWidth={2.5} />
                    <Circle cx="9" cy="11" r="5.5" fill="none" stroke="#3B82F6" strokeWidth={2.5} strokeDasharray="18 36" />
                    <Circle cx="9" cy="11" r="5.5" fill="none" stroke="#F59E0B" strokeWidth={2.5} strokeDasharray="8 36" strokeDashoffset={-18} />
                    <Rect x="2" y="19" width="14" height="2" rx="1" fill="#64748B" />
                  </G>
                </Svg>
              </Animated.View>
            </React.Fragment>
          )}
        </View>
      </Animated.View>

      {/* ==================== 3. CLEAN SEPARATOR ==================== */}
      <View style={styles.cardSeparator} />

      {/* ==================== 4. FIXED-HEIGHT EDUCATIONAL TEXT & ACTIONS ==================== */}
      <YStack gap={10} paddingTop={2} style={styles.fixedTextSection}>
        {/* Header Row: Stage Badge + Carousel Dots + Cycle Button */}
        <XStack justifyContent="space-between" alignItems="center">
          <XStack alignItems="center" gap={6}>
            <View style={styles.badgePill}>
              <Text color="#3EB47D" fontSize={9.5} fontFamily={Fonts.bold} letterSpacing={0.6}>
                {currentStage.badge}
              </Text>
            </View>
            <View style={styles.xpPill}>
              <Text color="#FFB703" fontSize={9} fontFamily={Fonts.bold}>
                +{currentStage.xpReward} XP
              </Text>
            </View>
          </XStack>

          {/* Carousel Step Dots Indicator */}
          <XStack alignItems="center" gap={6}>
            {CAROUSEL_STAGES.map((s, idx) => (
              <TouchableOpacity
                key={s.id}
                onPress={() => handleNextStage(idx)}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
              >
                <View
                  style={[
                    styles.dotIndicator,
                    currentIdx === idx ? styles.activeDotIndicator : styles.inactiveDotIndicator,
                  ]}
                />
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              onPress={() => handleNextStage()}
              style={styles.cycleBtn}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text color="#94A3B8" fontSize={10} fontFamily={Fonts.bold}>
                Next ➔
              </Text>
            </TouchableOpacity>
          </XStack>
        </XStack>

        {/* Animated Smooth Content Area with Guaranteed Fixed Text Height */}
        <Animated.View
          style={[
            styles.textContentWrapper,
            {
              opacity: transitionFadeAnim,
              transform: [{ translateX: transitionSlideAnim }],
            },
          ]}
        >
          <Text color={theme.text} fontSize={14} fontFamily={Fonts.bold} letterSpacing={-0.2} numberOfLines={1}>
            {currentStage.title}
          </Text>
          <View style={styles.descWrapper}>
            <Text color={theme.textSecondary} fontSize={11.5} fontFamily={Fonts.medium} lineHeight={16.5} numberOfLines={2}>
              {currentStage.desc}
            </Text>
          </View>
        </Animated.View>

        {/* Action Footer Row */}
        <XStack justifyContent="space-between" alignItems="center" marginTop={2}>
          <Text color="#64748B" fontSize={10} fontFamily={Fonts.bold}>
            {currentStage.stageName}
          </Text>

          <TouchableOpacity
            onPress={() => handleAction(currentStage.route)}
            style={styles.actionBtn}
            activeOpacity={0.8}
          >
            <Text color="#FFFFFF" fontSize={11.5} fontFamily={Fonts.bold}>
              {currentStage.actionText}
            </Text>
          </TouchableOpacity>
        </XStack>
      </YStack>
    </CbudgetCard>
  );
}

const styles = StyleSheet.create({
  fixedCardContainer: {
    minHeight: 284,
  },
  daylightBanner: {
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#38BDF8',
    position: 'relative',
    height: 140,
  },
  thoughtCloudContainer: {
    position: 'absolute',
    top: 8,
    right: 86,
    zIndex: 10,
  },
  kidCharacterHolder: {
    position: 'absolute',
    bottom: 0,
    right: 12,
    width: 92,
    height: 120,
    zIndex: 15,
  },
  fullLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 92,
    height: 120,
  },
  cardSeparator: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginVertical: 12,
  },
  fixedTextSection: {
    minHeight: 112,
    justifyContent: 'space-between',
  },
  textContentWrapper: {
    gap: 3,
    minHeight: 46,
    justifyContent: 'center',
  },
  descWrapper: {
    height: 34,
    justifyContent: 'center',
  },
  badgePill: {
    backgroundColor: 'rgba(62, 180, 125, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  xpPill: {
    backgroundColor: 'rgba(255, 183, 3, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2.5,
    borderRadius: 5,
  },
  dotIndicator: {
    height: 6,
    borderRadius: 3,
  },
  activeDotIndicator: {
    width: 14,
    backgroundColor: '#3EB47D',
  },
  inactiveDotIndicator: {
    width: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  cycleBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 6,
    marginLeft: 4,
  },
  actionBtn: {
    backgroundColor: '#1D8348',
    paddingHorizontal: 13,
    paddingVertical: 6.5,
    borderRadius: 8,
  },
});

export default EducationalPromoCard;
