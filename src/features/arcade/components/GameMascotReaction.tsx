import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Animated } from 'react-native';
import Svg, { Path, Rect, Circle, G, Defs, LinearGradient, Stop } from 'react-native-svg';

export type MascotEmotion = 'happy' | 'sad' | 'combo' | 'idle';

interface GameMascotReactionProps {
  emotion: MascotEmotion;
  size?: number;
}

export function GameMascotReaction({ emotion = 'happy', size = 80 }: GameMascotReactionProps) {
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (emotion === 'happy' || emotion === 'combo') {
      Animated.sequence([
        Animated.timing(bounceAnim, { toValue: -12, duration: 180, useNativeDriver: true }),
        Animated.timing(bounceAnim, { toValue: 0, duration: 220, useNativeDriver: true }),
        Animated.timing(bounceAnim, { toValue: -6, duration: 140, useNativeDriver: true }),
        Animated.timing(bounceAnim, { toValue: 0, duration: 160, useNativeDriver: true }),
      ]).start();
    } else if (emotion === 'sad') {
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 0.9, duration: 200, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [emotion]);

  const scale = size / 100;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          transform: [{ translateY: bounceAnim }, { scale: scaleAnim }],
        },
      ]}
    >
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Defs>
          <LinearGradient id="mascotBody" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#34D399" />
            <Stop offset="100%" stopColor="#059669" />
          </LinearGradient>
          <LinearGradient id="flameGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#FFB703" />
            <Stop offset="100%" stopColor="#FB8500" />
          </LinearGradient>
        </Defs>

        {/* Combo Fire Aura Backdrop */}
        {emotion === 'combo' && (
          <G opacity={0.9}>
            <Path
              d="M 20 85 C 10 60, 25 35, 50 10 C 75 35, 90 60, 80 85 Z"
              fill="url(#flameGrad)"
            />
            <Path
              d="M 30 85 C 25 65, 35 48, 50 28 C 65 48, 75 65, 70 85 Z"
              fill="#FFFBEB"
            />
          </G>
        )}

        {/* Mascot Main Rounded Body */}
        <Rect
          x={18}
          y={25}
          width={64}
          height={55}
          rx={18}
          fill="url(#mascotBody)"
          stroke="#064E3B"
          strokeWidth={3.5}
        />

        {/* Wallet Flap Line & Clasp Button */}
        <Path
          d="M 18 42 Q 50 56 82 42"
          fill="none"
          stroke="#064E3B"
          strokeWidth={3}
        />
        <Circle cx={50} cy={48} r={5} fill="#FBBF24" stroke="#064E3B" strokeWidth={2} />

        {/* EMOTION 1: HAPPY (Cool Pixel Sunglasses + Cheerful Blush) */}
        {emotion === 'happy' && (
          <G>
            {/* Sunglasses frame */}
            <Rect x={28} y={32} width={18} height={11} rx={3} fill="#0F172A" />
            <Rect x={54} y={32} width={18} height={11} rx={3} fill="#0F172A" />
            <Rect x={44} y={35} width={12} height={4} fill="#0F172A" />
            {/* Glossy lens reflection */}
            <Path d="M 31 34 L 38 34" stroke="#38BDF8" strokeWidth={2} strokeLinecap="round" />
            <Path d="M 57 34 L 64 34" stroke="#38BDF8" strokeWidth={2} strokeLinecap="round" />
            {/* Big smiling mouth */}
            <Path
              d="M 40 60 Q 50 72 60 60"
              fill="#064E3B"
              stroke="#064E3B"
              strokeWidth={2}
            />
            {/* Rosy Cheeks */}
            <Circle cx={26} cy={56} r={4} fill="#FB7185" opacity={0.6} />
            <Circle cx={74} cy={56} r={4} fill="#FB7185" opacity={0.6} />
          </G>
        )}

        {/* EMOTION 2: SAD (Sweat Drop & Droopy Eyes) */}
        {emotion === 'sad' && (
          <G>
            {/* Droopy Eyes */}
            <Circle cx={36} cy={37} r={4.5} fill="#064E3B" />
            <Circle cx={64} cy={37} r={4.5} fill="#064E3B" />
            {/* Small wavy mouth */}
            <Path
              d="M 42 64 Q 50 56 58 64"
              fill="none"
              stroke="#064E3B"
              strokeWidth={3}
              strokeLinecap="round"
            />
            {/* Blue Sweat Drop */}
            <Path
              d="M 76 30 C 73 24, 71 28, 71 33 C 71 36, 74 38, 77 38 C 80 38, 83 36, 83 33 C 83 28, 79 24, 76 30 Z"
              fill="#38BDF8"
            />
          </G>
        )}

        {/* EMOTION 3: COMBO FIRE (Hype Laser Eyes & Victory Horns) */}
        {emotion === 'combo' && (
          <G>
            {/* Glowing yellow star eyes */}
            <Circle cx={36} cy={37} r={5.5} fill="#FEF08A" stroke="#CA8A04" strokeWidth={1.5} />
            <Circle cx={64} cy={37} r={5.5} fill="#FEF08A" stroke="#CA8A04" strokeWidth={1.5} />
            {/* Open roaring happy smile */}
            <Path
              d="M 38 58 Q 50 74 62 58 Z"
              fill="#DC2626"
              stroke="#064E3B"
              strokeWidth={2}
            />
            <Path d="M 43 66 Q 50 72 57 66" fill="#FCA5A5" />
          </G>
        )}

        {/* EMOTION 4: IDLE / DEFAULT */}
        {emotion === 'idle' && (
          <G>
            <Circle cx={36} cy={37} r={4.5} fill="#064E3B" />
            <Circle cx={64} cy={37} r={4.5} fill="#064E3B" />
            <Circle cx={38} cy={35} r={1.5} fill="#FFFFFF" />
            <Circle cx={66} cy={35} r={1.5} fill="#FFFFFF" />
            <Path
              d="M 43 59 Q 50 67 57 59"
              fill="none"
              stroke="#064E3B"
              strokeWidth={3}
              strokeLinecap="round"
            />
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
