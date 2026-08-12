import React from 'react';
import { StyleSheet } from 'react-native';
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
      borderRadius={12}
      padding={24}
      borderWidth={1}
      borderColor={theme.border}
      shadowColor="#0F172A"
      shadowOffset={{ width: 0, height: 4 }}
      shadowOpacity={0.03}
      shadowRadius={12}
      elevation={2}
      style={[styles.card, style as any]}
      {...props}
    >
      {children}
    </YStack>
  );
}

const styles = StyleSheet.create({
  card: {
    // Platform specific overrides if needed
  },
});
