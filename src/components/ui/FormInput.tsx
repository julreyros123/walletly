import React, { forwardRef, useState } from 'react';
import { TextInput, StyleSheet, TouchableOpacity, View } from 'react-native';
import { YStack, Text, XStack, InputProps } from 'tamagui';
import { useTheme } from '@/hooks/use-theme';
import { PhosphorIcon } from '@/components/ui/PhosphorIcon';
import type { PhosphorIconName } from '@/components/ui/PhosphorIcon';

import { Fonts } from '@/constants/theme';

interface FormInputProps extends InputProps {
  label?: string;
  error?: string;
  leftIcon?: PhosphorIconName;
  rightIcon?: PhosphorIconName;
  variant?: 'default' | 'auth';
}

export const FormInput = forwardRef<TextInput, FormInputProps>(
  (
    {
      label,
      error,
      secureTextEntry,
      leftIcon,
      rightIcon,
      variant = 'auth',
      style,
      value,
      onFocus,
      onBlur,
      onChangeText,
      ...props
    },
    ref
  ) => {
    const theme = useTheme();
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [isFocused, setIsFocused] = useState(false);

    const handleFocus = (e: any) => {
      setIsFocused(true);
      onFocus?.(e);
    };

    const handleBlur = (e: any) => {
      setIsFocused(false);
      onBlur?.(e);
    };

    const isSecure = secureTextEntry && !isPasswordVisible;

    // PayPal / Fintech high-contrast palette
    const isAuth = variant === 'auth';
    const bgColor = isAuth
      ? isFocused
        ? '#122238'
        : '#0C1829'
      : isFocused
        ? `${theme.backgroundElement}80`
        : theme.backgroundElement;

    const borderColor = error
      ? '#EF4444'
      : isFocused
        ? theme.primary
        : isAuth
          ? '#1E334D'
          : theme.border;

    const labelColor = isAuth ? '#E2E8F0' : theme.text;
    const textColor = isAuth ? '#FFFFFF' : theme.text;
    const placeholderColor = isAuth ? '#64748B' : theme.textSecondary;
    const iconColor = error
      ? '#EF4444'
      : isFocused
        ? theme.primary
        : isAuth
          ? '#94A3B8'
          : theme.textSecondary;

    return (
      <YStack width="100%" gap={6}>
        {/* Label and Error Row */}
        {(label || error) && (
          <XStack justifyContent="space-between" alignItems="center" paddingHorizontal={1}>
            {label && (
              <Text
                color={labelColor as any}
                fontSize={13}
                fontFamily={Fonts.semiBold as any}
                letterSpacing={-0.1}
              >
                {label}
              </Text>
            )}
            {error && (
              <Text
                color="#EF4444"
                fontSize={12}
                fontFamily={Fonts.semiBold as any}
              >
                {error}
              </Text>
            )}
          </XStack>
        )}

        {/* Flat Fintech Input Container */}
        <XStack
          alignItems="center"
          width="100%"
          style={[
            styles.container,
            {
              backgroundColor: bgColor,
              borderColor,
              borderWidth: isFocused || error ? 1.5 : 1,
            },
          ]}
        >
          {/* Left Icon */}
          {leftIcon && (
            <View style={styles.leftIconWrapper}>
              <PhosphorIcon
                name={leftIcon}
                size={18}
                color={iconColor}
              />
            </View>
          )}

          <TextInput
            ref={ref}
            value={value as string}
            secureTextEntry={isSecure}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onChangeText={onChangeText}
            placeholderTextColor={placeholderColor}
            accessibilityLabel={label || undefined}
            accessibilityState={error ? { error: true } : undefined}
            style={[
              styles.input,
              {
                paddingLeft: leftIcon ? 42 : 14,
                paddingRight: secureTextEntry || rightIcon ? 46 : 14,
                color: textColor,
                fontFamily: Fonts.medium,
                outlineStyle: 'none',
              } as any,
              style,
            ]}
            {...(props as any)}
          />

          {/* Right Icon/Toggle */}
          {secureTextEntry ? (
            <TouchableOpacity
              onPress={() => setIsPasswordVisible(!isPasswordVisible)}
              style={styles.rightIconWrapper}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={isPasswordVisible ? 'Hide password' : 'Show password'}
            >
              <PhosphorIcon
                name={isPasswordVisible ? 'EyeSlash' : 'Eye'}
                size={18}
                color={iconColor}
              />
            </TouchableOpacity>
          ) : rightIcon ? (
            <View style={styles.rightIconWrapper} pointerEvents="none">
              <PhosphorIcon
                name={rightIcon}
                size={18}
                color={iconColor}
              />
            </View>
          ) : null}
        </XStack>
      </YStack>
    );
  }
);

FormInput.displayName = 'FormInput';

const styles = StyleSheet.create({
  container: {
    height: 48,
    borderRadius: 8,
    position: 'relative',
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 15,
    letterSpacing: -0.1,
  },
  leftIconWrapper: {
    position: 'absolute',
    left: 13,
    zIndex: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightIconWrapper: {
    position: 'absolute',
    right: 12,
    zIndex: 10,
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    width: 32,
  },
});
