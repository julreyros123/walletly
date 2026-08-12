import React from 'react';
import { ActivityIndicator, Platform } from 'react-native';
import { Button, Text, XStack, ButtonProps } from 'tamagui';
import { useTheme } from '@/hooks/use-theme';
import { SymbolView } from 'expo-symbols';

import type { SymbolViewProps } from 'expo-symbols';

interface FormButtonProps extends Omit<ButtonProps, 'theme' | 'variant'> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  loading?: boolean;
  leftIcon?: SymbolViewProps['name'];
  rightIcon?: SymbolViewProps['name'];
}

export function FormButton({
  children,
  variant = 'primary',
  loading = false,
  leftIcon,
  rightIcon,
  disabled,
  style,
  ...props
}: FormButtonProps) {
  const theme = useTheme();
  const isDisabled = disabled || loading;

  let backgroundColor: any = theme.primary;
  let textColor: any = '#FFFFFF';
  let borderColor: any = 'transparent';
  let borderWidth = 0;
  let pressStyle: any = { opacity: 0.85, scale: 0.98 };

  if (isDisabled) {
    backgroundColor = theme.backgroundElement;
    textColor = theme.textSecondary;
  } else {
    if (variant === 'primary') {
      backgroundColor = theme.primary;
      textColor = '#FFFFFF';
      pressStyle = {
        opacity: 0.9,
        scale: 0.98,
      };
    } else if (variant === 'secondary') {
      backgroundColor = `${theme.text}0A` as any;
      textColor = theme.text;
      pressStyle = {
        opacity: 0.7,
        backgroundColor: `${theme.text}12` as any,
      };
    } else if (variant === 'outline') {
      backgroundColor = 'transparent';
      textColor = theme.primary;
      borderColor = theme.primary;
      borderWidth = 1.5;
    } else if (variant === 'ghost') {
      backgroundColor = 'transparent';
      textColor = theme.primary;
    }
  }

  return (
    <Button
      backgroundColor={backgroundColor}
      borderColor={borderColor}
      borderWidth={borderWidth}
      borderRadius={16}
      height={56}
      pressStyle={pressStyle}
      disabled={isDisabled}
      alignItems="center"
      justifyContent="center"
      style={[
        style as any,
        variant === 'primary' && !isDisabled && Platform.OS === 'web'
          ? { backgroundColor: theme.primary }
          : null,
      ]}
      {...props}
    >
      <XStack space="$2" alignItems="center" justifyContent="center">
        {loading ? (
          <ActivityIndicator color={textColor} size="small" />
        ) : (
          <>
            {leftIcon && (
              <SymbolView
                name={leftIcon}
                size={18}
                tintColor={textColor}
              />
            )}
            <Text
              color={textColor}
              fontSize={16}
              fontWeight="600"
              letterSpacing={0.5}
              textAlign="center"
            >
              {children}
            </Text>
            {rightIcon && (
              <SymbolView
                name={rightIcon}
                size={18}
                tintColor={textColor}
              />
            )}
          </>
        )}
      </XStack>
    </Button>
  );
}
