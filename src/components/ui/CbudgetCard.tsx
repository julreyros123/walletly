import React from 'react';
import { StyleSheet, Platform } from 'react-native';
import { YStack, YStackProps } from 'tamagui';
import { useTheme } from '@/hooks/use-theme';

interface CbudgetCardProps extends YStackProps {
  children: React.ReactNode;
  variant?: 'surface' | 'dark';
}

export function CbudgetCard({ children, variant = 'surface', style, ...props }: CbudgetCardProps) {
  const theme = useTheme();
  const bg = variant === 'dark' ? (theme.surfaceDark || '#0F172A') : theme.surface;

  return (
    <YStack
      backgroundColor={bg as any}
      borderRadius={14}
      padding={16}
      borderWidth={1}
      borderColor={variant === 'dark' ? 'rgba(255, 255, 255, 0.08)' : (theme.border as any)}
      style={[
        styles.floatingCard,
        theme.mode === 'hybrid' || theme.mode === 'light'
          ? styles.lightShadow
          : styles.darkShadow,
        style as any,
      ]}
      {...props}
    >
      {children}
    </YStack>
  );
}

const styles = StyleSheet.create({
  floatingCard: {
    overflow: 'hidden',
  },
  lightShadow: {
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 4px 14px rgba(15, 23, 42, 0.06)',
      } as any,
    }),
  },
  darkShadow: {
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.38,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
      } as any,
    }),
  },
});

export default CbudgetCard;
