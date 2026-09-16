import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Animated, Easing } from 'react-native';
import Svg, {
  Path,
  Rect,
  Circle,
  G,
  Defs,
  LinearGradient,
  Stop,
  Line,
  Polygon,
  Text as SvgText,
} from 'react-native-svg';

export type GameSceneType = 'trader' | 'rocket' | 'balancer' | 'snowball';

interface GameSceneIllustrationProps {
  type: GameSceneType;
  width?: number;
  height?: number;
}

export function GameSceneIllustration({
  type,
  width = 280,
  height = 140,
}: GameSceneIllustrationProps) {
  // Animations
  const animValue = useRef(new Animated.Value(0)).current;
  const rocketFly = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animValue, { toValue: -4, duration: 1200, useNativeDriver: true }),
        Animated.timing(animValue, { toValue: 0, duration: 1200, useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(rocketFly, { toValue: -6, duration: 700, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(rocketFly, { toValue: 4, duration: 700, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <View style={[styles.container, { width, height }]}>
      <Svg width={width} height={height} viewBox="0 0 280 140" style={StyleSheet.absoluteFill}>
        <Defs>
          {/* Gradients */}
          <LinearGradient id="traderSky" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#064E3B" />
            <Stop offset="60%" stopColor="#022C22" />
            <Stop offset="100%" stopColor="#021E16" />
          </LinearGradient>
          <LinearGradient id="spaceSky" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#2E1065" />
            <Stop offset="60%" stopColor="#0F172A" />
            <Stop offset="100%" stopColor="#030712" />
          </LinearGradient>
          <LinearGradient id="officeSky" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#78350F" />
            <Stop offset="100%" stopColor="#1E1B4B" />
          </LinearGradient>
          <LinearGradient id="alpineSky" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#083344" />
            <Stop offset="60%" stopColor="#164E63" />
            <Stop offset="100%" stopColor="#0E7490" />
          </LinearGradient>
          <LinearGradient id="suitNavy" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#1E293B" />
            <Stop offset="60%" stopColor="#0F172A" />
            <Stop offset="100%" stopColor="#090D16" />
          </LinearGradient>
          <LinearGradient id="goldGleam" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#FEF08A" />
            <Stop offset="100%" stopColor="#F59E0B" />
          </LinearGradient>
          <LinearGradient id="rocketBody" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#FFFFFF" />
            <Stop offset="60%" stopColor="#E2E8F0" />
            <Stop offset="100%" stopColor="#94A3B8" />
          </LinearGradient>
          <LinearGradient id="fireGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#FEF08A" />
            <Stop offset="40%" stopColor="#F59E0B" />
            <Stop offset="100%" stopColor="#EF4444" />
          </LinearGradient>
        </Defs>

        {/* ============================================================== */}
        {/* SCENE 1: HEADLINE TRADER (Wall Street & Businessman in Suit) */}
        {/* ============================================================== */}
        {type === 'trader' && (
          <G>
            {/* Background: Night Sky & Wall Street High-Rise Windows */}
            <Rect width="280" height="140" fill="url(#traderSky)" />

            {/* Skyscraper Silhouettes */}
            <Rect x={8} y={35} width={42} height={105} fill="#063228" opacity={0.7} />
            <Rect x={54} y={15} width={50} height={125} fill="#083E32" opacity={0.85} />
            <Rect x={108} y={40} width={42} height={100} fill="#063228" opacity={0.7} />

            {/* City Windows Glow */}
            <Circle cx={20} cy={50} r={2} fill="#34D399" opacity={0.8} />
            <Circle cx={34} cy={50} r={2} fill="#FEF08A" opacity={0.8} />
            <Circle cx={68} cy={30} r={2.5} fill="#34D399" opacity={0.9} />
            <Circle cx={86} cy={30} r={2.5} fill="#34D399" opacity={0.9} />
            <Circle cx={68} cy={48} r={2.5} fill="#FEF08A" opacity={0.9} />

            {/* Wall Street Digital Ticker Board in Background */}
            <Rect x={10} y={10} width={260} height={20} rx={5} fill="#021E16" stroke="#10B981" strokeWidth={1.2} />
            <SvgText x={16} y={24} fill="#34D399" fontSize={9.5} fontWeight="bold">AAPL ▲ +3.4%   NVDA ▲ +8.2%   TSLA ▼ -2.1%</SvgText>

            {/* Glowing Stock Candlestick Chart Wave */}
            <Path d="M 70 115 L 100 88 L 125 98 L 160 58 L 190 72 L 230 32" stroke="#10B981" strokeWidth={3.5} fill="none" strokeLinecap="round" />
            <Circle cx={230} cy={32} r={4.5} fill="#34D399" />
            <Path d="M 70 115 L 100 88 L 125 98 L 160 58 L 190 72 L 230 32 L 230 140 L 70 140 Z" fill="#10B981" opacity={0.12} />

            {/* Character: Businessman in Suit with Natural Hairline & Crossed Arms */}
            <G transform="translate(195, 8)">
              {/* 1. Neck */}
              <Path d="M 30 34 L 42 34 L 44 48 L 28 48 Z" fill="#FDE8D7" />
              <Path d="M 30 34 Q 36 40 42 34 L 42 37 Q 36 43 30 37 Z" fill="#E2A97A" opacity={0.6} />

              {/* 2. Left & Right Ears */}
              <Path d="M 22 24 Q 19 28 22 32 Q 24 30 24 26 Z" fill="#FDE8D7" />
              <Path d="M 48 24 Q 51 28 48 32 Q 46 30 46 26 Z" fill="#FDE8D7" />

              {/* 3. Face Contour (Smooth natural chin & jaw) */}
              <Path d="M 23 18 Q 36 8 47 18 L 46 28 Q 44 42 35 44 Q 26 42 24 28 Z" fill="#FDE8D7" />

              {/* 4. Natural Wavy Chestnut Hair with Proper Organic Hairline */}
              {/* Hair Base Volume */}
              <Path d="M 20 18 C 18 6, 52 4, 50 18 C 52 10, 42 4, 34 5 C 26 6, 22 10, 20 18 Z" fill="#3E1A0C" />
              {/* Natural Hairline & Side-part locks */}
              <Path d="M 22 18 C 26 12, 36 10, 42 16 C 36 12, 28 14, 22 18 Z" fill="#542410" />
              <Path d="M 42 14 C 47 16, 49 22, 47 26 C 45 20, 42 16, 42 14 Z" fill="#3E1A0C" />
              <Path d="M 21 18 C 23 22, 24 26, 22 28 C 22 22, 21 20, 21 18 Z" fill="#3E1A0C" />

              {/* 5. Minimalist Facial Features */}
              {/* Soft Eyebrows */}
              <Path d="M 26 18 Q 29 16 33 19" stroke="#3E1A0C" strokeWidth={1.2} fill="none" strokeLinecap="round" />
              <Path d="M 37 19 Q 41 16 44 18" stroke="#3E1A0C" strokeWidth={1.2} fill="none" strokeLinecap="round" />
              {/* Eyes */}
              <Circle cx={29.5} cy={22} r={1.5} fill="#1E293B" />
              <Circle cx={40.5} cy={22} r={1.5} fill="#1E293B" />
              <Circle cx={30} cy={21.5} r={0.5} fill="#FFFFFF" />
              <Circle cx={41} cy={21.5} r={0.5} fill="#FFFFFF" />
              {/* Confident Smile */}
              <Path d="M 32 30 Q 35 33 39 30" stroke="#9A3412" strokeWidth={1.2} fill="none" strokeLinecap="round" />

              {/* 6. Light Blue Collared Shirt */}
              <Polygon points="28,42 42,42 35,58" fill="#E0F2FE" stroke="#BAE6FD" strokeWidth={0.8} />

              {/* 7. Crimson Red Power Tie */}
              <Polygon points="33,46 37,46 38,86 35,92 32,86" fill="#DC2626" />
              <Polygon points="32,44 38,44 37,50 33,50" fill="#991B1B" />

              {/* 8. Tailored Dark Navy Suit Jacket */}
              <Path d="M 6 48 L 26 42 L 44 42 L 64 48 L 60 132 L 10 132 Z" fill="url(#suitNavy)" stroke="#334155" strokeWidth={1.8} />

              {/* Peak Suit Lapels */}
              <Polygon points="26,42 32,68 20,56" fill="#1E293B" stroke="#475569" strokeWidth={1} />
              <Polygon points="44,42 38,68 50,56" fill="#1E293B" stroke="#475569" strokeWidth={1} />

              {/* 9. Crossed Arms Pose */}
              {/* Left & Right Suit Upper Sleeves */}
              <Path d="M 6 48 L 0 78 L 12 82 L 20 54 Z" fill="#0F172A" stroke="#334155" strokeWidth={1.5} />
              <Path d="M 64 48 L 70 78 L 58 82 L 50 54 Z" fill="#0F172A" stroke="#334155" strokeWidth={1.5} />

              {/* Forearm crossing across chest (Right over Left) */}
              <Path d="M 0 76 Q 18 86 48 70 L 50 80 Q 20 96 2 84 Z" fill="#1E293B" stroke="#334155" strokeWidth={1.5} />
              {/* Hand tucked under arm */}
              <Path d="M 46 70 Q 54 68 52 76 L 48 78 Z" fill="#FDE8D7" />

              {/* Other Arm crossing under */}
              <Path d="M 68 76 Q 50 84 22 70 L 20 78 Q 48 94 66 84 Z" fill="#0F172A" stroke="#334155" strokeWidth={1.5} />
              {/* Hand resting on upper forearm */}
              <Path d="M 20 70 Q 12 68 14 76 L 18 78 Z" fill="#FDE8D7" />

              {/* 10. Suit Trousers */}
              <Path d="M 14 118 L 33 118 L 31 140 L 12 140 Z" fill="#0F172A" />
              <Path d="M 37 118 L 56 118 L 58 140 L 39 140 Z" fill="#0F172A" />
            </G>
          </G>
        )}

        {/* ============================================================== */}
        {/* SCENE 2: CRYPTO ROCKET (Deep Space Galaxy & Moving Rocket) */}
        {/* ============================================================== */}
        {type === 'rocket' && (
          <G>
            {/* Background: Starry Deep Space Galaxy */}
            <Rect width="280" height="140" fill="url(#spaceSky)" />

            {/* Glowing Nebula Clouds */}
            <Circle cx={80} cy={70} r={55} fill="#6B21A8" opacity={0.35} />
            <Circle cx={220} cy={40} r={45} fill="#4C1D95" opacity={0.4} />

            {/* Luminous Distant Moon & Stars */}
            <Circle cx={235} cy={35} r={22} fill="#FEF08A" opacity={0.9} />
            <Circle cx={228} cy={30} r={4} fill="#EAB308" opacity={0.4} />
            <Circle cx={242} cy={42} r={6} fill="#EAB308" opacity={0.3} />

            {/* Twinkling Star Field */}
            <Circle cx={30} cy={25} r={1.5} fill="#FFFFFF" opacity={0.9} />
            <Circle cx={60} cy={95} r={2} fill="#38BDF8" opacity={0.8} />
            <Circle cx={120} cy={30} r={1.5} fill="#FFFFFF" opacity={0.7} />
            <Circle cx={160} cy={110} r={2} fill="#FDE047" opacity={0.8} />
            <Circle cx={260} cy={100} r={1.5} fill="#FFFFFF" opacity={0.9} />

            {/* Green Candlestick Parabolic Trajectory */}
            <Path d="M 20 120 Q 90 105 140 70" stroke="#10B981" strokeWidth={2} strokeDasharray="5,5" fill="none" opacity={0.7} />

            {/* Flying Space Rocket Ship Blasting Diagonally */}
            <G transform="translate(110, 20) rotate(-22)">
              {/* Rocket Exhaust Smoke & Energy Trail */}
              <Path d="M 30 90 Q 20 125 10 145" stroke="#FBBF24" strokeWidth={12} opacity={0.3} strokeLinecap="round" />
              <Path d="M 30 90 Q 20 115 15 130" stroke="#EF4444" strokeWidth={8} opacity={0.5} strokeLinecap="round" />

              {/* Dynamic Thruster Flames */}
              <Path d="M 20 85 Q 26 115 32 85 Z" fill="url(#fireGrad)" />
              <Path d="M 23 85 Q 26 102 29 85 Z" fill="#FFFFFF" />

              {/* Rocket Stabilizer Fins */}
              <Path d="M 12 70 L 0 88 L 14 84 Z" fill="#EF4444" />
              <Path d="M 40 70 L 52 88 L 38 84 Z" fill="#EF4444" />

              {/* Aerodynamic Rocket Hull */}
              <Path d="M 26 10 C 14 26, 12 55, 14 80 L 38 80 C 40 55, 38 26, 26 10 Z" fill="url(#rocketBody)" stroke="#1E293B" strokeWidth={1.5} />

              {/* Red Nose Cone */}
              <Path d="M 26 10 C 20 20, 18 30, 18 35 L 34 35 C 34 30, 32 20, 26 10 Z" fill="#EF4444" />

              {/* Glass Cockpit Porthole */}
              <Circle cx={26} cy={50} r={8} fill="#0F172A" stroke="#38BDF8" strokeWidth={2} />
              <Circle cx={26} cy={50} r={5.5} fill="#10B981" />
              <Circle cx={24} cy={48} r={1.5} fill="#FFFFFF" />
            </G>
          </G>
        )}

        {/* ============================================================== */}
        {/* SCENE 3: PORTFOLIO BALANCER (High-Rise Office & Strategist) */}
        {/* ============================================================== */}
        {type === 'balancer' && (
          <G>
            {/* Background: Executive Boardroom Sunset Sky */}
            <Rect width="280" height="140" fill="url(#officeSky)" />

            {/* Boardroom Glass Window Mullions */}
            <Line x1={90} y1={0} x2={90} y2={140} stroke="#334155" strokeWidth={2} opacity={0.6} />
            <Line x1={190} y1={0} x2={190} y2={140} stroke="#334155" strokeWidth={2} opacity={0.6} />
            <Line x1={0} y1={90} x2={280} y2={90} stroke="#334155" strokeWidth={2} opacity={0.6} />

            {/* Sunset Skyline in distance */}
            <Polygon points="10,90 25,60 40,90" fill="#B45309" opacity={0.4} />
            <Polygon points="45,90 65,45 85,90" fill="#9A3412" opacity={0.5} />
            <Polygon points="100,90 120,50 140,90" fill="#B45309" opacity={0.4} />

            {/* Holographic Glowing 3D Pie Chart Wheel */}
            <G transform="translate(40, 26)">
              <Circle cx={36} cy={36} r={34} fill="#0F172A" stroke="#FBBF24" strokeWidth={2} opacity={0.9} />
              {/* Tech Slice (Blue) */}
              <Path d="M 36 36 L 36 2 A 34 34 0 0 1 70 36 Z" fill="#38BDF8" />
              {/* Dividend Slice (Green) */}
              <Path d="M 36 36 L 70 36 A 34 34 0 0 1 36 70 Z" fill="#10B981" />
              {/* Gold Slice (Yellow) */}
              <Path d="M 36 36 L 36 70 A 34 34 0 0 1 2 36 Z" fill="#FBBF24" />
              {/* Cash Slice (Slate) */}
              <Path d="M 36 36 L 2 36 A 34 34 0 0 1 36 2 Z" fill="#94A3B8" />
              {/* Center Core */}
              <Circle cx={36} cy={36} r={11} fill="#0F172A" stroke="#FFFFFF" strokeWidth={1.5} />
              <SvgText x={31} y={40} fill="#FFFFFF" fontSize={11} fontWeight="bold">⚖️</SvgText>
            </G>

            {/* Character: Natural Human Strategist with Glasses */}
            <G transform="translate(180, 24)">
              {/* Neck */}
              <Path d="M 28 32 L 40 32 L 42 46 L 26 46 Z" fill="#FDE8D7" />

              {/* Face & Head */}
              <Path d="M 22 16 Q 34 6 45 16 L 44 26 Q 42 38 34 40 Q 26 38 23 26 Z" fill="#FDE8D7" />

              {/* Professional Hair */}
              <Path d="M 20 16 C 18 4, 48 4, 46 16 C 48 8, 38 4, 30 5 C 24 6, 21 10, 20 16 Z" fill="#1E293B" />
              <Path d="M 21 16 C 25 12, 34 10, 40 16 C 34 12, 26 14, 21 16 Z" fill="#334155" />

              {/* Smart Glasses */}
              <Circle cx={28} cy={20} r={4.5} fill="none" stroke="#FFFFFF" strokeWidth={1.5} />
              <Circle cx={38} cy={20} r={4.5} fill="none" stroke="#FFFFFF" strokeWidth={1.5} />
              <Line x1={32.5} y1={20} x2={33.5} y2={20} stroke="#FFFFFF" strokeWidth={1.5} />

              {/* Smile */}
              <Path d="M 30 28 Q 34 31 38 28" stroke="#0F172A" strokeWidth={1.2} fill="none" strokeLinecap="round" />

              {/* Smart Indigo Blazer & Amber Tie */}
              <Path d="M 6 44 L 24 38 L 44 38 L 62 44 L 58 116 L 10 116 Z" fill="#312E81" stroke="#4338CA" strokeWidth={1.5} />
              <Polygon points="28,38 40,38 34,54" fill="#FFFFFF" />
              <Polygon points="32,42 36,42 37,70 34,74 31,70" fill="#F59E0B" />

              {/* Pointing Arm Gesture towards holographic chart */}
              <Line x1={10} y1={52} x2={-14} y2={42} stroke="#312E81" strokeWidth={8} strokeLinecap="round" />
              <Circle cx={-14} cy={42} r={4} fill="#FDE8D7" />
            </G>
          </G>
        )}

        {/* ============================================================== */}
        {/* SCENE 4: DIVIDEND SNOWBALL (Snowy Alpine Slope & Rolling Snowball) */}
        {/* ============================================================== */}
        {type === 'snowball' && (
          <G>
            {/* Background: Snowy Alpine Mountain Sky */}
            <Rect width="280" height="140" fill="url(#alpineSky)" />

            {/* Mountain Peaks */}
            <Polygon points="20,100 80,30 140,100" fill="#0C4A6E" />
            <Polygon points="70,42 80,30 90,42" fill="#FFFFFF" />
            <Polygon points="120,110 180,40 240,110" fill="#0E7490" />
            <Polygon points="170,52 180,40 190,52" fill="#FFFFFF" />

            {/* Snow Slope Ground */}
            <Path d="M 0 65 Q 140 110 280 140 L 280 140 L 0 140 Z" fill="#F0F9FF" opacity={0.95} />
            <Path d="M 0 75 Q 140 115 280 140" stroke="#BAE6FD" strokeWidth={3} fill="none" />

            {/* Pine Trees on Slope */}
            <Polygon points="25,75 15,95 35,95" fill="#065F46" />
            <Polygon points="25,65 18,80 32,80" fill="#065F46" />
            <Polygon points="65,90 55,110 75,110" fill="#065F46" />

            {/* Floating Dividend Coin Bubbles */}
            <G transform="translate(40, 20)">
              <Circle cx={14} cy={14} r={14} fill="#FEF08A" stroke="#CA8A04" strokeWidth={1.5} />
              <SvgText x={9} y={18} fill="#78350F" fontSize={12} fontWeight="bold">₱</SvgText>
            </G>
            <G transform="translate(95, 12)">
              <Circle cx={12} cy={12} r={12} fill="#A7F3D0" stroke="#059669" strokeWidth={1.5} />
              <SvgText x={7} y={16} fill="#065F46" fontSize={10} fontWeight="bold">₱</SvgText>
            </G>

            {/* Giant Rolling Snowball packed with Gold Coins */}
            <G transform="translate(125, 54)">
              <Circle cx={36} cy={44} r={34} fill="#0284C7" opacity={0.3} />
              <Circle cx={34} cy={34} r={32} fill="#FFFFFF" stroke="#38BDF8" strokeWidth={3} />
              <Circle cx={34} cy={34} r={20} fill="#E0F2FE" />
              <Circle cx={34} cy={34} r={14} fill="url(#goldGleam)" stroke="#CA8A04" strokeWidth={2} />
              <SvgText x={29} y={39} fill="#78350F" fontSize={15} fontWeight="bold">₱</SvgText>
            </G>

            {/* Character: Natural Human Winter Athlete in Puffer Jacket Pushing Snowball */}
            <G transform="translate(205, 42)">
              {/* Head */}
              <Path d="M 12 18 Q 22 10 32 18 L 30 26 Q 28 34 22 36 Q 16 34 14 26 Z" fill="#FDE8D7" />

              {/* Blue Beanie with Pom-Pom */}
              <Path d="M 10 18 Q 22 4 34 18 Z" fill="#6366F1" stroke="#3730A3" strokeWidth={1.5} />
              <Circle cx={22} cy={4} r={4} fill="#FFFFFF" />

              {/* Smiling Face */}
              <Circle cx={18} cy={20} r={1.5} fill="#0F172A" />
              <Circle cx={26} cy={20} r={1.5} fill="#0F172A" />
              <Path d="M 19 26 Q 22 29 25 26" stroke="#0F172A" strokeWidth={1.2} fill="none" strokeLinecap="round" />

              {/* Puffy Winter Jacket */}
              <Path d="M 6 36 L 38 36 L 36 76 L 8 76 Z" fill="#0284C7" stroke="#0369A1" strokeWidth={2} />
              {/* Arms pushing forward */}
              <Line x1={10} y1={44} x2={-12} y2={55} stroke="#0284C7" strokeWidth={8} strokeLinecap="round" />
              <Circle cx={-12} cy={55} r={4.5} fill="#FDE8D7" />
            </G>
          </G>
        )}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 18,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
