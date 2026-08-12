import React, { forwardRef, useState } from 'react';
import { TextInput, StyleSheet, TouchableOpacity, View } from 'react-native';
import { YStack, Text, XStack, InputProps } from 'tamagui';
import { useTheme } from '@/hooks/use-theme';
import { SymbolView } from 'expo-symbols';
import type { SymbolViewProps } from 'expo-symbols';

interface FormInputProps extends InputProps {
  label?: string;
  error?: string;
  leftIcon?: SymbolViewProps['name'];
  rightIcon?: SymbolViewProps['name'];
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

    return (
      <YStack width="100%" gap={6}>
        {/* Label and Error Row */}
        {(label || error) && (
          <XStack justifyContent="space-between" alignItems="center" paddingHorizontal={2}>
            {label && (
              <Text
                color={theme.textSecondary}
                fontSize={13}
                fontWeight="600"
                letterSpacing={0.2}
              >
                {label}
              </Text>
            )}
            {error && (
              <Text
                color="#EF4444"
                fontSize={12}
                fontWeight="600"
              >
                {error}
              </Text>
            )}
          </XStack>
        )}

        {/* Input Field Container */}
        <XStack
          alignItems="center"
          width="100%"
          style={[
            styles.container,
            {
              borderColor: error ? '#EF4444' : isFocused ? theme.primary : theme.border,
              borderWidth: isFocused || error ? 1.5 : 1,
              backgroundColor: isFocused ? `${theme.backgroundElement}45` as any : theme.backgroundElement,
            }
          ]}
        >
          {/* Left Icon */}
          {leftIcon && (
            <View style={styles.leftIconWrapper}>
              <SymbolView
                name={leftIcon}
                size={18}
                tintColor={error ? '#EF4444' : isFocused ? theme.primary : theme.textSecondary}
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
            placeholderTextColor={`${theme.textSecondary}75` as any}
            style={[
              styles.input,
              {
                paddingLeft: leftIcon ? 42 : 16,
                paddingRight: secureTextEntry || rightIcon ? 46 : 16,
                color: theme.text,
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
            >
              <SymbolView
                name={
                  isPasswordVisible
                    ? { ios: 'eye.slash', android: 'visibility_off', web: 'visibility_off' }
                    : { ios: 'eye', android: 'visibility', web: 'visibility' }
                }
                size={18}
                tintColor={theme.textSecondary}
              />
            </TouchableOpacity>
          ) : rightIcon ? (
            <View style={styles.rightIconWrapper} pointerEvents="none">
              <SymbolView
                name={rightIcon}
                size={18}
                tintColor={theme.textSecondary}
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
    height: 50,
    borderRadius: 12,
    position: 'relative',
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 15,
    fontWeight: '400',
  },
  leftIconWrapper: {
    position: 'absolute',
    left: 14,
    zIndex: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightIconWrapper: {
    position: 'absolute',
    right: 14,
    zIndex: 10,
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    width: 32,
  },
});
