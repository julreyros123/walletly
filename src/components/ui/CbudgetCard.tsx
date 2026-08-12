import React from 'react';
import { StyleSheet, Platform } from 'react-native';
import { YStack, YStackProps } from 'tamagui';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';

interface CbudgetCardProps extends YStackProps {
  children: React.ReactNode;
}

export function CbudgetCard({ children, style, ...props }: CbudgetCardProps) {
  const theme = useTheme();

  return (
    <YStack
      backgroundColor={theme.surface}
      borderRadius={14}
      padding={20}
      borderWidth={1}
      borderColor={theme.border}
      style={[styles.card, style as any]}
      {...props}
    >
      {children}
    </YStack>
  );
}

const styles = StyleSheet.create({
  card: {
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: {
        elevation: 3,
      },
    }),
  },
});
