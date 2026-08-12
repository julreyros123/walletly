import React from 'react';
import { Pressable } from 'react-native';
import { XStack, Label, Text, View } from 'tamagui';
import { useTheme } from '@/hooks/use-theme';
import { SymbolView } from 'expo-symbols';

interface FormCheckboxProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: string | React.ReactNode;
  error?: string;
}

export function FormCheckbox({
  checked,
  onCheckedChange,
  label,
  error,
}: FormCheckboxProps) {
  const theme = useTheme();

  return (
    <View space="$1">
      <Pressable onPress={() => onCheckedChange(!checked)}>
        <XStack gap={12} alignItems="flex-start" paddingVertical={6}>
          <View
            width={20}
            height={20}
            borderRadius={6}
            borderWidth={1.5}
            borderColor={error ? theme.error : checked ? theme.teal : theme.border}
            backgroundColor={checked ? theme.teal : 'transparent'}
            alignItems="center"
            justifyContent="center"
            marginTop={1}
          >
            {checked && (
              <SymbolView
                name={{ ios: 'checkmark', android: 'check', web: 'check' } as const}
                size={12}
                tintColor="#FFFFFF"
              />
            )}
          </View>
          {typeof label === 'string' ? (
            <Label color={theme.text} fontSize={14} fontWeight="500" style={{ lineHeight: 20 }}>
              {label}
            </Label>
          ) : (
            <View flex={1}>
              {label}
            </View>
          )}
        </XStack>
      </Pressable>
      {error && (
        <Text
          color={theme.error}
          fontSize={11}
          fontWeight="500"
          position="absolute"
          bottom={-12}
          marginLeft={32}
        >
          {error}
        </Text>
      )}
    </View>
  );
}
