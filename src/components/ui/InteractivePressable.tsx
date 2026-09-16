import React from 'react';
import { Pressable, StyleProp, ViewStyle, GestureResponderEvent, AccessibilityRole } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, useReducedMotion } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

export interface InteractivePressableProps {
  children: React.ReactNode;
  onPress?: (event: GestureResponderEvent) => void;
  onLongPress?: (event: GestureResponderEvent) => void;
  style?: StyleProp<ViewStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  scaleTo?: number;
  hapticStyle?: Haptics.ImpactFeedbackStyle | 'none';
  disabled?: boolean;
  hitSlop?: number | { top?: number; bottom?: number; left?: number; right?: number };
  /** Screen reader label describing the element's purpose */
  accessibilityLabel?: string;
  /** Screen reader hint providing additional context */
  accessibilityHint?: string;
  /** Semantic role for assistive technology (defaults to "button") */
  accessibilityRole?: AccessibilityRole;
}

export function InteractivePressable({
  children,
  onPress,
  onLongPress,
  style,
  containerStyle,
  scaleTo = 0.96,
  hapticStyle = Haptics.ImpactFeedbackStyle.Light,
  disabled = false,
  hitSlop,
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole = 'button',
}: InteractivePressableProps) {
  const scale = useSharedValue(1);
  const reduceMotion = useReducedMotion();

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (disabled) return;
    if (hapticStyle !== 'none') {
      try {
        Haptics.impactAsync(hapticStyle);
      } catch (error) {
        console.warn('Haptics failed in InteractivePressable:', error);
      }
    }
    if (!reduceMotion) {
      scale.value = withSpring(scaleTo, {
        damping: 15,
        stiffness: 300,
        mass: 0.5,
      });
    }
  };

  const handlePressOut = () => {
    if (disabled) return;
    if (!reduceMotion) {
      scale.value = withSpring(1, {
        damping: 15,
        stiffness: 300,
        mass: 0.5,
      });
    }
  };

  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      onLongPress={disabled ? undefined : onLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      hitSlop={hitSlop}
      style={containerStyle}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
    >
      <Animated.View style={[style, animatedStyle]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}

export default InteractivePressable;

