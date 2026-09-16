import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Animated } from 'react-native';
import Svg, { Path, Rect, Circle, G, Defs, LinearGradient, Stop, Line, Text as SvgText } from 'react-native-svg';

export type GameCharacterType = 'trader' | 'runner' | 'sneaker' | 'rocket' | 'balancer' | 'snowball';

interface GameCardMascotProps {
  type: GameCharacterType;
  size?: number;
}

export function GameCardMascot({ type, size = 95 }: GameCardMascotProps) {
  const floatAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Gentle floating breathing animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -8,
          duration: 1100,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 1100,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Subtle idle pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.04, duration: 1100, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1.0, duration: 1100, useNativeDriver: true }),
      ])
    ).start();

    if (type === 'rocket') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(rotateAnim, { toValue: 4, duration: 500, useNativeDriver: true }),
          Animated.timing(rotateAnim, { toValue: -4, duration: 500, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [type]);

  const rotate = rotateAnim.interpolate({
    inputRange: [-4, 0, 4],
    outputRange: ['-5deg', '0deg', '5deg'],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          transform: [{ translateY: floatAnim }, { scale: pulseAnim }, { rotate }],
        },
      ]}
    >
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Defs>
          {/* Gradients */}
          <LinearGradient id="traderBody" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#34D399" />
            <Stop offset="50%" stopColor="#10B981" />
            <Stop offset="100%" stopColor="#047857" />
          </LinearGradient>
          <LinearGradient id="rocketBody" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#C084FC" />
            <Stop offset="50%" stopColor="#A855F7" />
            <Stop offset="100%" stopColor="#6B21A8" />
          </LinearGradient>
          <LinearGradient id="balancerBody" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#FDE047" />
            <Stop offset="50%" stopColor="#F59E0B" />
            <Stop offset="100%" stopColor="#B45309" />
          </LinearGradient>
          <LinearGradient id="snowballBody" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#A5F3FC" />
            <Stop offset="50%" stopColor="#38BDF8" />
            <Stop offset="100%" stopColor="#0284C7" />
          </LinearGradient>
          <LinearGradient id="iceBall" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#FFFFFF" />
            <Stop offset="40%" stopColor="#CFFAFE" />
            <Stop offset="100%" stopColor="#38BDF8" />
          </LinearGradient>
          <LinearGradient id="chartGlow" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#34D399" stopOpacity={0.8} />
            <Stop offset="100%" stopColor="#059669" stopOpacity={0.1} />
          </LinearGradient>
          <LinearGradient id="goldGleam" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#FEF08A" />
            <Stop offset="100%" stopColor="#EAB308" />
          </LinearGradient>
        </Defs>

        {/* ==================== 1. TRADER MASCOT (Headline Trader) ==================== */}
        {type === 'trader' && (
          <G>
            {/* Backdrop Energy Aura */}
            <Circle cx={50} cy={50} r={44} fill="url(#chartGlow)" opacity={0.4} />

            {/* Mascot Base Body */}
            <Rect x={16} y={24} width={68} height={56} rx={18} fill="url(#traderBody)" stroke="#064E3B" strokeWidth={2.5} />
            {/* Top Wallet Notch / Fold Highlight */}
            <Path d="M 22 28 C 35 22, 65 22, 78 28" stroke="#6EE7B7" strokeWidth={2} strokeLinecap="round" />

            {/* Rosy Cheeks */}
            <Circle cx={24} cy={56} r={4.5} fill="#F472B6" opacity={0.65} />
            <Circle cx={76} cy={56} r={4.5} fill="#F472B6" opacity={0.65} />

            {/* Gold Central Clasp */}
            <Circle cx={50} cy={46} r={5} fill="url(#goldGleam)" stroke="#78350F" strokeWidth={1.5} />

            {/* Wall St Blue Striped Necktie */}
            <Path d="M 46 51 L 54 51 L 52 74 L 50 78 L 48 74 Z" fill="#0284C7" stroke="#0C4A6E" strokeWidth={1.2} />
            <Line x1={48} y1={58} x2={52} y2={58} stroke="#FFFFFF" strokeWidth={1} />
            <Line x1={48.5} y1={66} x2={51.5} y2={66} stroke="#FFFFFF" strokeWidth={1} />

            {/* Cool Shiny Pixel Sunglasses */}
            <Rect x={22} y={32} width={22} height={14} rx={4} fill="#0F172A" stroke="#38BDF8" strokeWidth={1.2} />
            <Rect x={56} y={32} width={22} height={14} rx={4} fill="#0F172A" stroke="#38BDF8" strokeWidth={1.2} />
            <Rect x={44} y={36} width={12} height={4} fill="#0F172A" />
            {/* Glass Lens Reflection */}
            <Line x1={25} y1={35} x2={32} y2={35} stroke="#38BDF8" strokeWidth={2} strokeLinecap="round" />
            <Line x1={59} y1={35} x2={66} y2={35} stroke="#38BDF8" strokeWidth={2} strokeLinecap="round" />

            {/* Holding Glowing Stock Chart Clipboard */}
            <G transform="translate(66, 44)">
              <Rect x={0} y={0} width={26} height={32} rx={6} fill="#0F172A" stroke="#34D399" strokeWidth={1.5} />
              <Path d="M 4 24 L 10 16 L 16 20 L 22 8" stroke="#10B981" strokeWidth={2.5} strokeLinecap="round" />
              <Circle cx={22} cy={8} r={2.5} fill="#34D399" />
              <Path d="M 4 4 L 12 4" stroke="#64748B" strokeWidth={1.5} strokeLinecap="round" />
            </G>

            {/* Happy Winner Smile */}
            <Path d="M 42 62 Q 50 71 58 62" fill="none" stroke="#064E3B" strokeWidth={2.5} strokeLinecap="round" />
          </G>
        )}

        {/* ==================== 2. ROCKET MASCOT (Crypto Rocket) ==================== */}
        {type === 'rocket' && (
          <G>
            {/* Space Cosmic Aura */}
            <Circle cx={50} cy={50} r={44} fill="#A855F7" opacity={0.2} />

            {/* Astronaut Mascot Body */}
            <Rect x={18} y={26} width={64} height={54} rx={18} fill="url(#rocketBody)" stroke="#4A044E" strokeWidth={2.5} />

            {/* Glowing Space Antenna on Head */}
            <Line x1={50} y1={26} x2={50} y2={12} stroke="#701A75" strokeWidth={2.5} />
            <Circle cx={50} cy={10} r={4.5} fill="url(#goldGleam)" stroke="#CA8A04" strokeWidth={1.5} />

            {/* Shiny Cockpit Visor */}
            <Rect x={24} y={32} width={52} height={26} rx={10} fill="#0F172A" stroke="#38BDF8" strokeWidth={2} />
            <Path d="M 28 36 Q 50 32 72 36" stroke="#38BDF8" strokeWidth={1.5} opacity={0.6} />

            {/* Inside Visor: Cute Glowing Eyes */}
            <Circle cx={40} cy={45} r={3.5} fill="#38BDF8" />
            <Circle cx={60} cy={45} r={3.5} fill="#38BDF8" />
            <Circle cx={41} cy={44} r={1.2} fill="#FFFFFF" />
            <Circle cx={61} cy={44} r={1.2} fill="#FFFFFF" />

            {/* Blushing Astronaut Cheeks */}
            <Circle cx={22} cy={58} r={4} fill="#F472B6" opacity={0.6} />
            <Circle cx={78} cy={58} r={4} fill="#F472B6" opacity={0.6} />

            {/* Side Thruster Boosters & Flames */}
            <G transform="translate(68, 52)">
              <Path d="M 4 0 Q 14 6 18 16 L 8 22 Q 2 12 4 0 Z" fill="#EF4444" stroke="#991B1B" strokeWidth={1.2} />
              <Path d="M 10 22 Q 15 32 12 36 Q 8 32 8 22 Z" fill="url(#goldGleam)" />
            </G>

            {/* Cheerful Smile */}
            <Path d="M 44 65 Q 50 71 56 65" fill="none" stroke="#4A044E" strokeWidth={2.2} strokeLinecap="round" />
          </G>
        )}

        {/* ==================== 3. BALANCER MASCOT (Portfolio Balancer) ==================== */}
        {type === 'balancer' && (
          <G>
            {/* Gold Wealth Aura */}
            <Circle cx={50} cy={50} r={44} fill="#F59E0B" opacity={0.2} />

            {/* Mascot Base Body */}
            <Rect x={16} y={24} width={68} height={56} rx={18} fill="url(#balancerBody)" stroke="#78350F" strokeWidth={2.5} />

            {/* Smart Analyst Wireframe Glasses */}
            <Circle cx={36} cy={40} r={8.5} fill="#0F172A" stroke="#FFFFFF" strokeWidth={2} />
            <Circle cx={64} cy={40} r={8.5} fill="#0F172A" stroke="#FFFFFF" strokeWidth={2} />
            <Line x1={44.5} y1={40} x2={55.5} y2={40} stroke="#FFFFFF" strokeWidth={2} />
            {/* Sparkle inside glasses */}
            <Circle cx={38} cy={38} r={2} fill="#38BDF8" />
            <Circle cx={66} cy={38} r={2} fill="#38BDF8" />

            {/* Rosy Cheeks */}
            <Circle cx={22} cy={58} r={4} fill="#F472B6" opacity={0.65} />
            <Circle cx={78} cy={58} r={4} fill="#F472B6" opacity={0.65} />

            {/* Confident Smile */}
            <Path d="M 43 62 Q 50 70 57 62" fill="none" stroke="#78350F" strokeWidth={2.5} strokeLinecap="round" />

            {/* Holding Glowing 3D Pie Chart Wheel */}
            <G transform="translate(62, 48)">
              <Circle cx={15} cy={15} r={15} fill="#0F172A" stroke="#FEF08A" strokeWidth={1.8} />
              {/* Tech Slice (Blue) */}
              <Path d="M 15 15 L 15 0 A 15 15 0 0 1 30 15 Z" fill="#38BDF8" />
              {/* Dividend Slice (Green) */}
              <Path d="M 15 15 L 30 15 A 15 15 0 0 1 15 30 Z" fill="#10B981" />
              {/* Gold Slice (Yellow) */}
              <Path d="M 15 15 L 15 30 A 15 15 0 0 1 0 15 Z" fill="#FBBF24" />
              {/* Center Hub */}
              <Circle cx={15} cy={15} r={4} fill="#FFFFFF" />
            </G>
          </G>
        )}

        {/* ==================== 4. SNOWBALL MASCOT (Dividend Snowball) ==================== */}
        {type === 'snowball' && (
          <G>
            {/* Icy Snowflake Aura */}
            <Circle cx={50} cy={50} r={44} fill="#06B6D4" opacity={0.2} />

            {/* Mascot Base Body */}
            <Rect x={16} y={26} width={68} height={54} rx={18} fill="url(#snowballBody)" stroke="#0C4A6E" strokeWidth={2.5} />

            {/* Knit Beanie Hat with Pom-Pom */}
            <Path d="M 18 28 Q 50 8 82 28 Z" fill="#6366F1" stroke="#3730A3" strokeWidth={2} />
            <Path d="M 16 28 L 84 28" stroke="#A5B4FC" strokeWidth={4} strokeLinecap="round" />
            <Circle cx={50} cy={8} r={6} fill="#FFFFFF" stroke="#E2E8F0" strokeWidth={1.5} />

            {/* Big Anime Cheerful Eyes */}
            <Circle cx={36} cy={44} r={5} fill="#0C4A6E" />
            <Circle cx={64} cy={44} r={5} fill="#0C4A6E" />
            <Circle cx={38} cy={42} r={2} fill="#FFFFFF" />
            <Circle cx={66} cy={42} r={2} fill="#FFFFFF" />
            <Circle cx={34} cy={46} r={0.8} fill="#FFFFFF" />
            <Circle cx={62} cy={46} r={0.8} fill="#FFFFFF" />

            {/* Rosy Blush */}
            <Circle cx={26} cy={54} r={4.5} fill="#F472B6" opacity={0.7} />
            <Circle cx={74} cy={54} r={4.5} fill="#F472B6" opacity={0.7} />

            {/* Open Happy Smile */}
            <Path d="M 43 59 Q 50 68 57 59" fill="#0C4A6E" stroke="#0C4A6E" strokeWidth={1.5} />

            {/* Giant Glowing Crystalline Dividend Snowball */}
            <G transform="translate(60, 46)">
              <Circle cx={16} cy={16} r={16} fill="url(#iceBall)" stroke="#0284C7" strokeWidth={2} />
              <Circle cx={16} cy={16} r={9} fill="url(#goldGleam)" stroke="#CA8A04" strokeWidth={1.5} />
              <SvgText fontSize={9} fill="#78350F" x={13} y={20} fontWeight="bold">₱</SvgText>
              {/* Sparkle stars */}
              <Path d="M 2 4 L 4 2 L 6 4 L 4 6 Z" fill="#FFFFFF" />
              <Path d="M 26 24 L 28 22 L 30 24 L 28 26 Z" fill="#FFFFFF" />
            </G>
          </G>
        )}

        {/* Fallback for other types */}
        {type === 'runner' && (
          <G>
            <Rect x={18} y={26} width={64} height={54} rx={18} fill="url(#snowballBody)" stroke="#0C4A6E" strokeWidth={2.5} />
            <Circle cx={50} cy={50} r={12} fill="#FEF08A" />
          </G>
        )}
        {type === 'sneaker' && (
          <G>
            <Rect x={18} y={26} width={64} height={54} rx={18} fill="#F43F5E" stroke="#881337" strokeWidth={2.5} />
            <Circle cx={50} cy={50} r={12} fill="#FFFFFF" />
          </G>
        )}
      </Svg>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
