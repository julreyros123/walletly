import React from 'react';
import { ActivityIndicator, StyleSheet, Pressable } from 'react-native';
import { Text, XStack, ButtonProps } from 'tamagui';
import { useTheme } from '@/hooks/use-theme';
import { Fonts } from '@/constants/theme';
import { PhosphorIcon } from '@/components/ui/PhosphorIcon';
import type { PhosphorIconName } from '@/components/ui/PhosphorIcon';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, useReducedMotion } from 'react-native-reanimated';

interface FormButtonProps extends Omit<ButtonProps, 'theme' | 'variant'> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'social';
  loading?: boolean;
  leftIcon?: PhosphorIconName;
  rightIcon?: PhosphorIconName;
  customIcon?: React.ReactNode;
  glow?: boolean;
  fullWidth?: boolean;
  /** Screen reader hint providing additional context */
  accessibilityHint?: string;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function FormButton({
  children,
  variant = 'primary',
  loading = false,
  leftIcon,
  rightIcon,
  customIcon,
  disabled,
  style,
  glow = false,
  onPress,
  height = 48,
  borderRadius = 8, // Flat modern fintech aesthetic (PayPal/Stripe)
  fullWidth = true,
  accessibilityHint,
  ...props
}: FormButtonProps) {
  const theme = useTheme();
  const isDisabled = disabled || loading;
  const reduceMotion = useReducedMotion();

  // Derive a screen reader label from children text content
  const derivedLabel = loading
    ? 'Loading'
    : typeof children === 'string'
      ? children
      : undefined;

  const scale = useSharedValue(1);

  const handlePressIn = () => {
    if (!isDisabled && !reduceMotion) {
      scale.value = withSpring(0.97, { damping: 16, stiffness: 350 });
    }
  };

  const handlePressOut = () => {
    if (!isDisabled && !reduceMotion) {
      scale.value = withSpring(1, { damping: 16, stiffness: 350 });
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // Google Pay / GCash unified design tokens
  let backgroundColor: string = theme.primary;
  let textColor: string = '#FFFFFF';
  let borderColor: string = 'transparent';
  let borderWidth = 0;
  let shadowStyle: any = {};

  if (isDisabled) {
    backgroundColor = theme.backgroundElement || 'rgba(255, 255, 255, 0.08)';
    textColor = 'rgba(255, 255, 255, 0.4)';
  } else {
    switch (variant) {
      case 'primary':
        backgroundColor = theme.primary;
        textColor = '#FFFFFF';
        if (glow) {
          shadowStyle = {
            shadowColor: theme.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.28,
            shadowRadius: 10,
            elevation: 6,
          };
        }
        break;

      case 'secondary':
        backgroundColor = `${theme.primary}20`; // Soft tint background
        textColor = theme.primary;
        break;

      case 'outline':
        backgroundColor = 'transparent';
        textColor = '#FFFFFF';
        borderColor = 'rgba(255, 255, 255, 0.25)';
        borderWidth = 1.5;
        break;

      case 'ghost':
        backgroundColor = 'transparent';
        textColor = '#FFFFFF';
        break;

      case 'danger':
        backgroundColor = '#EF4444';
        textColor = '#FFFFFF';
        break;

      case 'social':
        backgroundColor = 'rgba(255, 255, 255, 0.08)';
        textColor = '#FFFFFF';
        borderColor = 'rgba(255, 255, 255, 0.15)';
        borderWidth = 1;
        break;
    }
  }

  return (
    <AnimatedPressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={isDisabled ? undefined : onPress}
      style={[
        animatedStyle,
        styles.buttonContainer,
        {
          height: height as number,
          borderRadius: borderRadius as number,
          backgroundColor,
          borderColor,
          borderWidth,
          width: fullWidth ? ('100%' as any) : undefined,
        },
        shadowStyle,
        style as any,
      ]}
      accessibilityRole="button"
      accessibilityLabel={derivedLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: isDisabled }}
      {...(props as any)}
    >
      <XStack space="$2.5" alignItems="center" justifyContent="center">
        {loading ? (
          <ActivityIndicator color={textColor} size="small" />
        ) : (
          <>
            {customIcon}
            {leftIcon && !customIcon && (
              <PhosphorIcon
                name={leftIcon}
                size={18}
                color={textColor}
              />
            )}
            <Text
              color={textColor as any}
              fontSize={15}
              fontWeight="700"
              fontFamily={Fonts.bold as any}
              letterSpacing={-0.2}
              textAlign="center"
            >
              {children}
            </Text>
            {rightIcon && (
              <PhosphorIcon
                name={rightIcon}
                size={18}
                color={textColor}
              />
            )}
          </>
        )}
      </XStack>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  buttonContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    position: 'relative',
    overflow: 'hidden',
  },
});
