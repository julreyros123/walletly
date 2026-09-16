/**
 * PhosphorCategoryIcon — Duotone category icon for budget/expense categories.
 *
 * Replaces `CustomDuotoneIcon` with Phosphor's built-in duotone weight.
 * Maps category name strings (e.g., "food", "transport", "bills") to the
 * matching Phosphor duotone icon, wrapped in a tinted rounded container
 * with a subtle pulse animation — matching the original look.
 *
 * Usage:
 *   import { PhosphorCategoryIcon } from '@/components/ui/PhosphorCategoryIcon';
 *   <PhosphorCategoryIcon name="food" size={24} accentColor="#10B981" />
 */
import React, { useEffect, useRef } from 'react';
import { StyleSheet, Animated, Easing, StyleProp, ViewStyle } from 'react-native';

import {
  Wallet,
  Fire,
  PiggyBank,
  ForkKnife,
  Car,
  AirplaneTilt,
  GraduationCap,
  Lightning,
  ShoppingBag,
  GameController,
  ShieldCheck,
  Laptop,
  DeviceMobile,
  Briefcase,
  FirstAid,
  Star,
} from 'phosphor-react-native';

// ── Category → Phosphor icon mapping ─────────────────────────────────
function getCategoryIcon(cat: string) {
  const normalized = (cat || '').toLowerCase().trim();

  if (normalized === 'budget' || normalized === 'wallet' || normalized.includes('baon') || normalized === 'daily') {
    return Wallet;
  }
  if (normalized === 'spent' || normalized.includes('flame') || normalized.includes('fire')) {
    return Fire;
  }
  if (normalized === 'savings' || normalized === 'buffer' || normalized === 'piggy' || normalized.includes('saving') || normalized.includes('buffer')) {
    return PiggyBank;
  }
  if (normalized.includes('food') || normalized.includes('dining') || normalized.includes('lunch') || normalized.includes('restaurant') || normalized.includes('eat')) {
    return ForkKnife;
  }
  if (normalized.includes('transport') || normalized.includes('commute') || normalized.includes('car') || normalized.includes('jeepney') || normalized.includes('grab')) {
    return Car;
  }
  if (normalized.includes('travel') || normalized.includes('airplane') || normalized.includes('flight') || normalized.includes('vacation')) {
    return AirplaneTilt;
  }
  if (normalized.includes('school') || normalized.includes('tuition') || normalized.includes('education') || normalized.includes('book') || normalized.includes('study')) {
    return GraduationCap;
  }
  if (normalized.includes('bill') || normalized.includes('utilit') || normalized.includes('electr') || normalized.includes('rent') || normalized.includes('water') || normalized.includes('wifi')) {
    return Lightning;
  }
  if (normalized.includes('shop') || normalized.includes('mall') || normalized.includes('clothes') || normalized.includes('bag') || normalized.includes('merchandise')) {
    return ShoppingBag;
  }
  if (normalized.includes('entertain') || normalized.includes('game') || normalized.includes('leisure') || normalized.includes('movie') || normalized.includes('netflix') || normalized.includes('arcade')) {
    return GameController;
  }
  if (normalized.includes('emergency') || normalized.includes('shield') || normalized.includes('fund')) {
    return ShieldCheck;
  }
  if (normalized.includes('laptop') || normalized.includes('computer') || normalized.includes('tech')) {
    return Laptop;
  }
  if (normalized.includes('phone') || normalized.includes('iphone') || normalized.includes('mobile')) {
    return DeviceMobile;
  }
  if (normalized.includes('business') || normalized.includes('capital') || normalized.includes('briefcase') || normalized.includes('work')) {
    return Briefcase;
  }
  if (normalized.includes('health') || normalized.includes('med') || normalized.includes('doctor') || normalized.includes('pharmacy')) {
    return FirstAid;
  }

  // Default
  return Star;
}

export interface PhosphorCategoryIconProps {
  name: string;
  size?: number;
  primaryColor?: string;
  accentColor?: string;
  backgroundColor?: string;
  animate?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function PhosphorCategoryIcon({
  name,
  size = 24,
  primaryColor = '#0F172A',
  accentColor = '#10B981',
  backgroundColor,
  animate = true,
  style,
}: PhosphorCategoryIconProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!animate) return;
    const pulse = Animated.sequence([
      Animated.timing(pulseAnim, {
        toValue: 1.06,
        duration: 1000,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 1000,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    ]);
    const loop = Animated.loop(pulse);
    loop.start();
    return () => loop.stop();
  }, [animate, pulseAnim]);

  const IconComponent = getCategoryIcon(name);
  const bg = backgroundColor || `${accentColor}15`;
  const containerSize = size + 14;

  return (
    <Animated.View
      style={[
        styles.iconBox,
        {
          width: containerSize,
          height: containerSize,
          borderRadius: 12,
          backgroundColor: bg,
          transform: [{ scale: pulseAnim }],
        },
        style,
      ]}
    >
      <IconComponent
        size={size}
        color={accentColor}
        weight="duotone"
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  iconBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default PhosphorCategoryIcon;
