import React, { forwardRef, useState } from 'react';
import { TextInput, TextInputProps } from 'react-native';
import { YStack, Label, Input, Text, XStack, Button, InputProps } from 'tamagui';
import { useTheme } from '@/hooks/use-theme';
import { SymbolView } from 'expo-symbols';

import type { SymbolViewProps } from 'expo-symbols';

interface FormInputProps extends InputProps {
  label?: string;
  error?: string;
  leftIcon?: SymbolViewProps['name'];
  rightIcon?: SymbolViewProps['name'];
}

export const FormInput = forwardRef<TextInput, FormInputProps>(
  ({ label, error, secureTextEntry, leftIcon, rightIcon, style, ...props }, ref) => {
    const theme = useTheme();
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [isFocused, setIsFocused] = useState(false);

    const isSecure = secureTextEntry && !isPasswordVisible;

    return (
      <YStack width="100%" gap={2}>
        {(label || error) && (
          <XStack justifyContent="space-between" alignItems="center" marginBottom={0}>
            {label && (
              <Label
                color={theme.textSecondary}
                fontSize={12}
                fontWeight="500"
                padding={0}
                height="auto"
                minHeight={0}
              >
                {label}
              </Label>
            )}
            {error && (
              <Text
                color={theme.error}
                fontSize={11}
                fontWeight="600"
              >
                {error}
              </Text>
            )}
          </XStack>
        )}
        <XStack position="relative" alignItems="center" width="100%">
          {leftIcon && (
            <XStack position="absolute" left={10} zIndex={10} pointerEvents="none">
              <SymbolView
                name={leftIcon}
                size={16}
                tintColor={error ? theme.error : isFocused ? theme.teal : theme.textSecondary}
              />
            </XStack>
          )}

          <Input
            ref={ref as any}
            secureTextEntry={isSecure}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholderTextColor={`${theme.textSecondary}80` as any}
            color={theme.text}
            backgroundColor={theme.surface}
            borderColor={error ? theme.error : isFocused ? theme.teal : theme.border}
            borderWidth={1}
            borderRadius={8}
            height={42}
            paddingLeft={leftIcon ? 34 : 12}
            paddingRight={secureTextEntry || rightIcon ? 34 : 12}
            flex={1}
            fontSize={14}
            focusStyle={{
              borderColor: error ? theme.error : theme.teal,
              borderWidth: 1.5,
              backgroundColor: theme.surface,
            }}
            shadowColor="#0F172A"
            shadowOffset={{ width: 0, height: 1 }}
            shadowOpacity={isFocused ? 0.06 : 0.03}
            shadowRadius={3}
            elevation={1}
            style={[{ outlineStyle: 'none' } as any, style]}
            {...props}
          />

          {secureTextEntry ? (
            <Button
              position="absolute"
              right={4}
              zIndex={10}
              chromeless
              circular
              width={34}
              height={34}
              padding={0}
              alignItems="center"
              justifyContent="center"
              onPress={() => setIsPasswordVisible(!isPasswordVisible)}
              pressStyle={{ opacity: 0.7 }}
            >
              <SymbolView
                name={
                  isPasswordVisible
                    ? { ios: 'eye.slash', android: 'visibility_off', web: 'visibility_off' }
                    : { ios: 'eye', android: 'visibility', web: 'visibility' }
                }
                size={16}
                tintColor={theme.textSecondary}
              />
            </Button>
          ) : rightIcon ? (
            <XStack position="absolute" right={10} zIndex={10} pointerEvents="none">
              <SymbolView
                name={rightIcon}
                size={16}
                tintColor={theme.textSecondary}
              />
            </XStack>
          ) : null}
        </XStack>
      </YStack>
    );
  }
);

FormInput.displayName = 'FormInput';
