import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Animated, Easing } from 'react-native';
import Svg, { Path, Rect, Circle, Ellipse, G, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Fonts } from '@/constants/theme';

interface DashboardMascotProps {
  onPress?: () => void;
  size?: number;
}

const GREETINGS = [
  "Hey there! Ready to budget today? 👋✨",
  "Great job tracking your cash! 💰",
  "Don't forget your daily streak! 🔥",
  "You're building great wealth habits! 🚀",
  "Save smart, spend happier! 💚",
];

export function DashboardMascot({ onPress, size = 114 }: DashboardMascotProps) {
  const [greetingIndex, setGreetingIndex] = useState(0);
  const [showBubble, setShowBubble] = useState(false);
  const [isWaving, setIsWaving] = useState(false);

  // Animation drivers
  const waveAnim = useRef(new Animated.Value(0)).current; // Waving right arm
  const eyeBlink = useRef(new Animated.Value(1)).current; // Gentle periodic blink
  const mascotBounce = useRef(new Animated.Value(0)).current; // Pop up jump
  const bubbleOpacity = useRef(new Animated.Value(0)).current;
  const bubbleScale = useRef(new Animated.Value(0.8)).current;

  // Wave function
  const triggerWave = () => {
    setIsWaving(true);
    Animated.sequence([
      Animated.timing(waveAnim, { toValue: 1, duration: 120, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(waveAnim, { toValue: -1, duration: 140, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(waveAnim, { toValue: 0.9, duration: 120, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(waveAnim, { toValue: -0.9, duration: 120, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(waveAnim, { toValue: 0.8, duration: 110, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(waveAnim, { toValue: -0.8, duration: 110, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(waveAnim, { toValue: 0, duration: 150, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start(() => {
      setIsWaving(false);
    });
  };

  useEffect(() => {
    // 1. Initial friendly wave on load
    const initialTimer = setTimeout(() => {
      triggerWave();
    }, 700);

    // 2. Periodic quick eye blink every 4s (keeps eyes wide open 98% of the time)
    const blinkInterval = setInterval(() => {
      Animated.sequence([
        Animated.timing(eyeBlink, { toValue: 0.15, duration: 60, useNativeDriver: true }),
        Animated.timing(eyeBlink, { toValue: 1, duration: 70, useNativeDriver: true }),
      ]).start();
    }, 4000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(blinkInterval);
    };
  }, []);

  const handleMascotClick = () => {
    // 1. Pick next greeting
    setGreetingIndex((prev) => (prev + 1) % GREETINGS.length);
    setShowBubble(true);

    // 2. Wave arm & playful jump
    triggerWave();

    Animated.sequence([
      Animated.timing(mascotBounce, { toValue: -10, duration: 140, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(mascotBounce, { toValue: 0, duration: 200, easing: Easing.bounce, useNativeDriver: true }),
    ]).start();

    // 3. Pop speech bubble
    Animated.parallel([
      Animated.spring(bubbleScale, { toValue: 1, friction: 6, tension: 120, useNativeDriver: true }),
      Animated.timing(bubbleOpacity, { toValue: 1, duration: 180, useNativeDriver: true }),
    ]).start();

    // Auto-dismiss bubble after 3.2s
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(bubbleScale, { toValue: 0.8, duration: 200, useNativeDriver: true }),
        Animated.timing(bubbleOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start(() => setShowBubble(false));
    }, 3200);

    if (onPress) {
      onPress();
    }
  };

  // Arm Wave rotation interpolation
  const armRotation = waveAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-30deg', '0deg', '35deg'],
  });

  return (
    <View style={styles.container}>
      {/* Interactive Speech Bubble */}
      {showBubble && (
        <Animated.View
          style={[
            styles.bubbleContainer,
            {
              transform: [{ scale: bubbleScale }],
              opacity: bubbleOpacity,
            },
          ]}
        >
          <Text style={styles.bubbleText}>{GREETINGS[greetingIndex]}</Text>
          <View style={styles.bubbleArrow} />
        </Animated.View>
      )}

      {/* Main Mascot & Card-Gripping Composition */}
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={handleMascotClick}
        style={styles.touchTarget}
      >
        <Animated.View
          style={[
            styles.mascotHolder,
            { transform: [{ translateY: mascotBounce }] },
          ]}
        >
          {/* Main Wallet Character Body */}
          <Svg width={size} height={size * 0.7} viewBox="0 0 144 100">
            <Defs>
              <LinearGradient id="walletGrad" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor="#3EB47D" />
                <Stop offset="1" stopColor="#23965D" />
              </LinearGradient>
              <LinearGradient id="coinGrad" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor="#FFE066" />
                <Stop offset="1" stopColor="#F59E0B" />
              </LinearGradient>
              <LinearGradient id="handGrad" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor="#3EB47D" />
                <Stop offset="1" stopColor="#1B7849" />
              </LinearGradient>
            </Defs>

            {/* 1. Shiny Gold Coin in Top Pocket */}
            <Circle cx={72} cy={20} r={18} fill="#D97706" />
            <Circle cx={72} cy={20} r={15} fill="url(#coinGrad)" />
            <Circle cx={72} cy={20} r={12} fill="#FEF3C7" opacity={0.6} />
            {/* Currency Symbol ₱ */}
            <Path
              d="M 70 14 L 70 26 M 70 17 L 75 17 A 3 3 0 0 1 75 23 L 70 23 M 67 19 L 77 19"
              stroke="#B45309"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />

            {/* 2. Flat Green Wallet Body */}
            <Rect x={20} y={26} width={104} height={72} rx={16} fill="url(#walletGrad)" />

            {/* Clean Flat Stitching Accents */}
            <Path
              d="M 28 34 L 116 34 M 28 40 L 28 88 M 116 40 L 116 88"
              stroke="rgba(255, 255, 255, 0.45)"
              strokeWidth={1.8}
              strokeDasharray="4, 3"
              fill="none"
            />

            {/* Leather Wallet Snap Flap on Right */}
            <Path
              d="M 108 46 L 130 46 A 8 8 0 0 1 130 62 L 108 62 Z"
              fill="#1B7849"
            />
            <Circle cx={124} cy={54} r={4.5} fill="#F59E0B" />
            <Circle cx={124} cy={54} r={2.5} fill="#FEF3C7" />

            {/* 3. WIDE OPEN, BEAUTIFUL EXPRESSIVE EYES */}
            {/* Left Eye */}
            <Animated.View style={{ transform: [{ scaleY: eyeBlink }] }}>
              {/* Outer Deep Black Eye */}
              <Circle cx={50} cy={54} r={9.5} fill="#051322" />
              {/* Vibrant Green Eye Iris Glow */}
              <Circle cx={50} cy={54} r={7.5} fill="#2ECC71" opacity={0.45} />
              <Circle cx={50} cy={54} r={6} fill="#051322" />
              {/* Dual Glossy White Light Reflections (Wide Open & Sparkling) */}
              <Circle cx={47.5} cy={51} r={3.8} fill="#FFFFFF" />
              <Circle cx={52.5} cy={56.5} r={1.8} fill="#FFFFFF" />
            </Animated.View>

            {/* Right Eye */}
            <Animated.View style={{ transform: [{ scaleY: eyeBlink }] }}>
              {/* Outer Deep Black Eye */}
              <Circle cx={88} cy={54} r={9.5} fill="#051322" />
              {/* Vibrant Green Eye Iris Glow */}
              <Circle cx={88} cy={54} r={7.5} fill="#2ECC71" opacity={0.45} />
              <Circle cx={88} cy={54} r={6} fill="#051322" />
              {/* Dual Glossy White Light Reflections (Wide Open & Sparkling) */}
              <Circle cx={85.5} cy={51} r={3.8} fill="#FFFFFF" />
              <Circle cx={90.5} cy={56.5} r={1.8} fill="#FFFFFF" />
            </Animated.View>

            {/* Cute Eyebrows */}
            <Path
              d="M 43 40 Q 50 35 57 40"
              stroke="#051322"
              strokeWidth={2.2}
              strokeLinecap="round"
              fill="none"
            />
            <Path
              d="M 81 40 Q 88 35 95 40"
              stroke="#051322"
              strokeWidth={2.2}
              strokeLinecap="round"
              fill="none"
            />

            {/* Rosy Blush Cheeks */}
            <Ellipse cx={37} cy={63} rx={6} ry={4} fill="rgba(248, 113, 113, 0.65)" />
            <Ellipse cx={101} cy={63} rx={6} ry={4} fill="rgba(248, 113, 113, 0.65)" />

            {/* Cute Happy Smiling Mouth */}
            <Path
              d="M 63 63 Q 69 72 75 63"
              stroke="#051322"
              strokeWidth={3}
              strokeLinecap="round"
              fill="none"
            />

            {/* 4. LEFT HAND (Distinctly Gripping & Hooking over the Top Card Rim) */}
            <G transform="translate(18, 72)">
              {/* Palm Base */}
              <Path
                d="M 0 6 C 0 0 22 0 22 6 L 22 18 C 22 22 0 22 0 18 Z"
                fill="url(#handGrad)"
              />
              {/* 3 Distinct Rounded Fingers Curling Over the Card Edge */}
              <Rect x={1} y={6} width={6.5} height={16} rx={3.2} fill="#34D399" stroke="#064E3B" strokeWidth={1.5} />
              <Rect x={8} y={6} width={6.5} height={17.5} rx={3.2} fill="#34D399" stroke="#064E3B" strokeWidth={1.5} />
              <Rect x={15} y={6} width={6.5} height={16} rx={3.2} fill="#34D399" stroke="#064E3B" strokeWidth={1.5} />
              {/* Finger Tip Glossy Highlights */}
              <Circle cx={4.2} cy={18} r={1.5} fill="#D1FAE5" />
              <Circle cx={11.2} cy={19.5} r={1.5} fill="#D1FAE5" />
              <Circle cx={18.2} cy={18} r={1.5} fill="#D1FAE5" />
            </G>

            {/* 5. RIGHT HAND (When idle: resting on the ledge, gripping the card) */}
            {!isWaving && (
              <G transform="translate(98, 72)">
                {/* Palm Base */}
                <Path
                  d="M 0 6 C 0 0 22 0 22 6 L 22 18 C 22 22 0 22 0 18 Z"
                  fill="url(#handGrad)"
                />
                {/* 3 Distinct Rounded Fingers Curling Over the Card Edge */}
                <Rect x={1} y={6} width={6.5} height={16} rx={3.2} fill="#34D399" stroke="#064E3B" strokeWidth={1.5} />
                <Rect x={8} y={6} width={6.5} height={17.5} rx={3.2} fill="#34D399" stroke="#064E3B" strokeWidth={1.5} />
                <Rect x={15} y={6} width={6.5} height={16} rx={3.2} fill="#34D399" stroke="#064E3B" strokeWidth={1.5} />
                {/* Finger Tip Glossy Highlights */}
                <Circle cx={4.2} cy={18} r={1.5} fill="#D1FAE5" />
                <Circle cx={11.2} cy={19.5} r={1.5} fill="#D1FAE5" />
                <Circle cx={18.2} cy={18} r={1.5} fill="#D1FAE5" />
              </G>
            )}
          </Svg>

          {/* 6. ANIMATED WAVING RIGHT ARM (Pops up to wave when clicked or greeted) */}
          {isWaving && (
            <Animated.View
              style={[
                styles.wavingArmContainer,
                {
                  transform: [
                    { translateY: 10 },
                    { rotate: armRotation },
                    { translateY: -10 },
                  ],
                },
              ]}
            >
              <Svg width={40} height={44} viewBox="0 0 40 44">
                {/* Arm Limb */}
                <Path
                  d="M 8 36 C 12 26 20 18 26 10"
                  stroke="#1B7849"
                  strokeWidth={10}
                  strokeLinecap="round"
                  fill="none"
                />
                <Path
                  d="M 8 36 C 12 26 20 18 26 10"
                  stroke="#3EB47D"
                  strokeWidth={7.5}
                  strokeLinecap="round"
                  fill="none"
                />

                {/* Hand Palm & Waving Fingers */}
                <Circle cx={28} cy={8} r={7.5} fill="#3EB47D" stroke="#1B7849" strokeWidth={1} />
                {/* 4 Waving Fingers */}
                <Rect x={26} y={1} width={4} height={8} rx={2} fill="#3EB47D" stroke="#1B7849" strokeWidth={0.8} />
                <Rect x={31} y={3} width={3.6} height={7.5} rx={1.8} fill="#3EB47D" stroke="#1B7849" strokeWidth={0.8} />
                <Rect x={21} y={3} width={3.6} height={7} rx={1.8} fill="#3EB47D" stroke="#1B7849" strokeWidth={0.8} />
                <Circle cx={32} cy={12} r={2.8} fill="#3EB47D" />
              </Svg>
            </Animated.View>
          )}
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
    paddingRight: 6,
    marginBottom: -12,
    zIndex: 30,
  },
  touchTarget: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  mascotHolder: {
    position: 'relative',
    width: 124,
    height: 84,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  wavingArmContainer: {
    position: 'absolute',
    top: 4,
    right: 2,
    width: 40,
    height: 44,
    zIndex: 25,
  },
  bubbleContainer: {
    position: 'absolute',
    bottom: 78,
    right: 14,
    backgroundColor: '#0F2642',
    borderWidth: 1.5,
    borderColor: '#3EB47D',
    borderRadius: 14,
    paddingHorizontal: 13,
    paddingVertical: 9,
    maxWidth: 210,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 30,
  },
  bubbleText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontFamily: Fonts.bold,
    lineHeight: 16,
    textAlign: 'center',
  },
  bubbleArrow: {
    position: 'absolute',
    bottom: -7,
    right: 32,
    width: 0,
    height: 0,
    borderLeftWidth: 7,
    borderRightWidth: 7,
    borderTopWidth: 7,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#3EB47D',
  },
});

export default DashboardMascot;
