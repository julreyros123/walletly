import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Animated, Easing, ViewStyle, StyleProp } from 'react-native';
import Svg, { Path, Rect, Circle, Line, G } from 'react-native-svg';

export type MotionIconName =
  | 'bell'
  | 'flame'
  | 'plus'
  | 'savings'
  | 'book'
  | 'gift'
  | 'wallet'
  | 'chart'
  | 'calendar'
  | 'target'
  | 'sun'
  | 'clock'
  | 'pencil'
  | 'gamepad';

export interface MotionIconProps {
  name?: MotionIconName;
  size?: number;
  color?: string; // Foreground inner color (defaults to #3EB47D green)
  edgeColor?: string; // Double-edge outer contour (defaults to #FFFFFF white)
  autoPlay?: boolean;
  loop?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function MotionIcon({
  name = 'bell',
  size = 22,
  color = '#3EB47D',
  edgeColor = '#FFFFFF',
  autoPlay = true,
  loop = true,
  style,
}: MotionIconProps) {
  // Animation drivers
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!autoPlay) return;

    if (name === 'bell') {
      // 🔔 Ringing chime swing animation
      const bellSequence = Animated.sequence([
        Animated.timing(rotateAnim, { toValue: 1, duration: 80, easing: Easing.linear, useNativeDriver: true }),
        Animated.timing(rotateAnim, { toValue: -1, duration: 160, easing: Easing.linear, useNativeDriver: true }),
        Animated.timing(rotateAnim, { toValue: 0.7, duration: 120, easing: Easing.linear, useNativeDriver: true }),
        Animated.timing(rotateAnim, { toValue: -0.5, duration: 100, easing: Easing.linear, useNativeDriver: true }),
        Animated.timing(rotateAnim, { toValue: 0, duration: 80, easing: Easing.linear, useNativeDriver: true }),
        Animated.delay(2000),
      ]);

      if (loop) {
        Animated.loop(bellSequence).start();
      } else {
        bellSequence.start();
      }
    } else if (name === 'flame') {
      // 🔥 Multi-tier flickering flame animation
      const flameSequence = Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 1.15, duration: 250, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 0.92, duration: 220, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 1.08, duration: 200, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 1, duration: 240, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]);

      if (loop) {
        Animated.loop(flameSequence).start();
      } else {
        flameSequence.start();
      }
    } else if (name === 'plus') {
      // ➕ Smooth 90-degree rotate & pulse
      const plusSequence = Animated.sequence([
        Animated.timing(rotateAnim, { toValue: 1, duration: 350, easing: Easing.out(Easing.back(1.5)), useNativeDriver: true }),
        Animated.delay(1800),
        Animated.timing(rotateAnim, { toValue: 0, duration: 350, easing: Easing.out(Easing.back(1.5)), useNativeDriver: true }),
        Animated.delay(1800),
      ]);

      if (loop) {
        Animated.loop(plusSequence).start();
      } else {
        plusSequence.start();
      }
    } else if (name === 'savings') {
      // 💵 3D Coin-flip & bounce
      const coinSequence = Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 0.15, duration: 220, easing: Easing.inOut(Easing.cubic), useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 1, duration: 220, easing: Easing.inOut(Easing.cubic), useNativeDriver: true }),
        Animated.delay(2200),
      ]);

      if (loop) {
        Animated.loop(coinSequence).start();
      } else {
        coinSequence.start();
      }
    } else if (name === 'gift') {
      // 🎁 Bouncing elastic gift box
      const giftSequence = Animated.sequence([
        Animated.timing(bounceAnim, { toValue: -4, duration: 160, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(bounceAnim, { toValue: 0, duration: 220, easing: Easing.bounce, useNativeDriver: true }),
        Animated.delay(1800),
      ]);

      if (loop) {
        Animated.loop(giftSequence).start();
      } else {
        giftSequence.start();
      }
    } else if (name === 'book') {
      // 📖 Gentle breathing pulse
      const bookSequence = Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 1.14, duration: 280, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 1, duration: 280, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.delay(1800),
      ]);

      if (loop) {
        Animated.loop(bookSequence).start();
      } else {
        bookSequence.start();
      }
    }
  }, [name, autoPlay, loop]);

  // Interpolations
  const bellRotation = rotateAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-16deg', '0deg', '16deg'],
  });

  const plusRotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '90deg'],
  });

  const iconDimension = size;
  const viewBoxSize = 24;

  // Render double-edge vector graphic
  const renderDoubleEdgeVector = () => {
    switch (name) {
      case 'chart':
        return (
          <Svg width={iconDimension} height={iconDimension} viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`} fill="none">
            <Path
              d="M21 12a9 9 0 1 1-9-9c5 0 9 4 9 9z"
              stroke={color}
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Path
              d="M21 12h-9V3"
              stroke={color}
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        );

      case 'calendar':
        return (
          <Svg width={iconDimension} height={iconDimension} viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`} fill="none">
            <Rect
              x="3"
              y="4"
              width="18"
              height="18"
              rx="3"
              stroke={color}
              strokeWidth="2.2"
            />
            <Line x1="16" y1="2" x2="16" y2="6" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
            <Line x1="8" y1="2" x2="8" y2="6" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
            <Line x1="3" y1="10" x2="21" y2="10" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
            <Circle cx="8" cy="14" r="1" fill={color} />
            <Circle cx="12" cy="14" r="1" fill={color} />
            <Circle cx="16" cy="14" r="1" fill={color} />
          </Svg>
        );

      case 'target':
        return (
          <Svg width={iconDimension} height={iconDimension} viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`} fill="none">
            <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2.2" />
            <Circle cx="12" cy="12" r="5" stroke={color} strokeWidth="2.2" />
            <Circle cx="12" cy="12" r="1.5" fill={color} />
          </Svg>
        );

      case 'sun':
        return (
          <Svg width={iconDimension} height={iconDimension} viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`} fill="none">
            <Circle cx="12" cy="12" r="4.5" stroke={color} strokeWidth="2.2" />
            <Line x1="12" y1="2" x2="12" y2="5" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
            <Line x1="12" y1="19" x2="12" y2="22" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
            <Line x1="2" y1="12" x2="5" y2="12" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
            <Line x1="19" y1="12" x2="22" y2="12" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
          </Svg>
        );

      case 'clock':
        return (
          <Svg width={iconDimension} height={iconDimension} viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`} fill="none">
            <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2.2" />
            <Path d="M12 7v5l3 2" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        );

      case 'pencil':
        return (
          <Svg width={iconDimension} height={iconDimension} viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`} fill="none">
            <Path
              d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"
              stroke={color}
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        );

      case 'gamepad':
        return (
          <Svg width={iconDimension} height={iconDimension} viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`} fill="none">
            <Rect x="2" y="6" width="20" height="12" rx="5" stroke={color} strokeWidth="2.2" />
            <Line x1="6" y1="12" x2="10" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" />
            <Line x1="8" y1="10" x2="8" y2="14" stroke={color} strokeWidth="2" strokeLinecap="round" />
            <Circle cx="15" cy="10.5" r="1.2" fill={color} />
            <Circle cx="17.5" cy="13.5" r="1.2" fill={color} />
          </Svg>
        );

      case 'plus':
        return (
          <Animated.View style={{ transform: [{ rotate: plusRotation }] }}>
            <Svg width={iconDimension} height={iconDimension} viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`} fill="none">
              {/* Layer 1: Dark Blue Outer Edge Stroke */}
              <Line x1="12" y1="4" x2="12" y2="20" stroke={edgeColor} strokeWidth="5.2" strokeLinecap="round" />
              <Line x1="4" y1="12" x2="20" y2="12" stroke={edgeColor} strokeWidth="5.2" strokeLinecap="round" />
              {/* Layer 2: White Core Stroke */}
              <Line x1="12" y1="4" x2="12" y2="20" stroke={color} strokeWidth="2.6" strokeLinecap="round" />
              <Line x1="4" y1="12" x2="20" y2="12" stroke={color} strokeWidth="2.6" strokeLinecap="round" />
            </Svg>
          </Animated.View>
        );

      case 'savings':
        return (
          <Animated.View style={{ transform: [{ scaleX: scaleAnim }] }}>
            <Svg width={iconDimension} height={iconDimension} viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`} fill="none">
              {/* Layer 1: Dark Blue Outer Edge */}
              <Rect x="3" y="6" width="18" height="12" rx="3" stroke={edgeColor} strokeWidth="4.2" fill={edgeColor} />
              <Circle cx="12" cy="12" r="3.2" stroke={edgeColor} strokeWidth="2" />
              {/* Layer 2: White Core Banknote */}
              <Rect x="3" y="6" width="18" height="12" rx="2.5" stroke={color} strokeWidth="2.2" fill="none" />
              <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth="2" fill="none" />
              <Line x1="6" y1="9" x2="6" y2="15" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
              <Line x1="18" y1="9" x2="18" y2="15" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
            </Svg>
          </Animated.View>
        );

      case 'book':
        return (
          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <Svg width={iconDimension} height={iconDimension} viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`} fill="none">
              {/* Layer 1: Dark Blue Outer Silhouette */}
              <Path
                d="M4 19.5V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v13.5a1.5 1.5 0 0 1-2.5 1.1L12 17.5l-5.5 3.1A1.5 1.5 0 0 1 4 19.5z"
                stroke={edgeColor}
                strokeWidth="4.2"
                fill={edgeColor}
                strokeLinejoin="round"
              />
              {/* Layer 2: White Core Book / Pages */}
              <Path
                d="M4 19.5V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v13.5a1.5 1.5 0 0 1-2.5 1.1L12 17.5l-5.5 3.1A1.5 1.5 0 0 1 4 19.5z"
                stroke={color}
                strokeWidth="2.2"
                fill="none"
                strokeLinejoin="round"
              />
              <Line x1="8" y1="8" x2="16" y2="8" stroke={color} strokeWidth="2" strokeLinecap="round" />
              <Line x1="8" y1="12" x2="14" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" />
            </Svg>
          </Animated.View>
        );

      case 'gift':
        return (
          <Animated.View style={{ transform: [{ translateY: bounceAnim }] }}>
            <Svg width={iconDimension} height={iconDimension} viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`} fill="none">
              {/* Layer 1: Dark Blue Outer Edge */}
              <Rect x="4" y="9" width="16" height="11" rx="2" stroke={edgeColor} strokeWidth="4.2" fill={edgeColor} />
              <Rect x="3" y="6" width="18" height="4" rx="1.5" stroke={edgeColor} strokeWidth="4.2" fill={edgeColor} />
              {/* Layer 2: White Core Box */}
              <Rect x="4" y="9" width="16" height="11" rx="2" stroke={color} strokeWidth="2.2" fill="none" />
              <Rect x="3" y="6" width="18" height="4" rx="1" stroke={color} strokeWidth="2.2" fill="none" />
              {/* Ribbon Vertical & Horizontal */}
              <Line x1="12" y1="6" x2="12" y2="20" stroke={color} strokeWidth="2.2" />
              {/* Bow on Top */}
              <Path d="M12 6C10 3 7 4 8.5 6M12 6C14 3 17 4 15.5 6" stroke={color} strokeWidth="2" strokeLinecap="round" />
            </Svg>
          </Animated.View>
        );

      case 'bell':
        return (
          <Animated.View style={{ transform: [{ rotate: bellRotation }] }}>
            <Svg width={iconDimension} height={iconDimension} viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`} fill="none">
              <Path
                d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"
                stroke={color || '#FFFFFF'}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
              <Path
                d="M13.73 21a2 2 0 0 1-3.46 0"
                stroke={color || '#FFFFFF'}
                strokeWidth="2"
                strokeLinecap="round"
              />
              {/* Alert Notification Dot */}
              <Circle cx="18" cy="5" r="2.5" fill="#EF4444" stroke="#0F172A" strokeWidth="1" />
            </Svg>
          </Animated.View>
        );

      case 'flame':
        return (
          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <Svg width={iconDimension} height={iconDimension} viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`} fill="none">
              {/* Flame Outer Silhouette */}
              <Path
                d="M12 2C9 7 5 9 5 14a7 7 0 0 0 14 0c0-5-4-7-7-12z"
                fill="#FF8800"
              />
              {/* Flame Inner Core */}
              <Path
                d="M12 7c-2 2.8-4 4.2-4 7.5a4 4 0 0 0 8 0c0-3.3-2-4.7-4-7.5z"
                fill="#FFC300"
              />
              {/* Inner Flame Glow */}
              <Path
                d="M12 11c-1 1.6-2 2.4-2 4a2 2 0 0 0 4 0c0-1.6-1-2.4-2-4z"
                fill="#FFFFFF"
                opacity={0.9}
              />
            </Svg>
          </Animated.View>
        );

      case 'wallet':
      default:
        return (
          <Svg width={iconDimension} height={iconDimension} viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`} fill="none">
            <Rect x="2" y="5" width="20" height="14" rx="3" stroke={edgeColor} strokeWidth="4.2" fill={edgeColor} />
            <Rect x="2" y="5" width="20" height="14" rx="2.5" stroke={color} strokeWidth="2.2" fill="none" />
            <Circle cx="16" cy="12" r="1.8" fill={color} />
          </Svg>
        );
    }
  };

  return (
    <View style={[{ width: size + 4, height: size + 4, alignItems: 'center', justifyContent: 'center' }, style]}>
      {renderDoubleEdgeVector()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default MotionIcon;
