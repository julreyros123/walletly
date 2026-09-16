import React from 'react';
import { XStack, YStack, Text } from 'tamagui';
import { PhosphorIcon } from '@/components/ui/PhosphorIcon';
import { useTheme } from '@/hooks/use-theme';

export function TrustIndicators() {
  const theme = useTheme();

  const indicators = [
    'Bank-Grade Encryption',
    'On-Device Privacy',
    'Risk-Free Sandbox'
  ];

  return (
    <YStack gap={12} marginTop={32} alignItems="center" width="100%">
      <XStack flexWrap="wrap" justifyContent="center" gap={16} paddingHorizontal={20}>
        {indicators.map((text, i) => (
          <XStack key={i} alignItems="center" gap={6}>
            <YStack
              width={20}
              height={20}
              borderRadius={10}
              backgroundColor={`${theme.primary}15` as any}
              alignItems="center"
              justifyContent="center"
            >
              <PhosphorIcon name="Check" size={12} color={theme.primary} weight="bold" />
            </YStack>
            <Text color={theme.textSecondary} fontSize={13} fontWeight="500">
              {text}
            </Text>
          </XStack>
        ))}
      </XStack>
    </YStack>
  );
}
