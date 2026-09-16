import React from 'react';
import { StyleSheet, View, Text, Platform } from 'react-native';
import { PhosphorIcon, PhosphorIconName } from '@/components/ui/PhosphorIcon';
import { Fonts } from '@/constants/theme';
import { InteractivePressable } from '@/components/ui/InteractivePressable';
import { useTheme } from '@/hooks/use-theme';

interface QuickActionsGridProps {
  onPressLogExpense: () => void;
  onPressAddSavings: () => void;
  onPressMiniGames: () => void;
  onPressLearn: () => void;
}

export function QuickActionsGrid({
  onPressLogExpense,
  onPressAddSavings,
  onPressMiniGames,
  onPressLearn,
}: QuickActionsGridProps) {
  const theme = useTheme();

  const BRAND_ACCENT = '#10B981';

  const actions: { id: string; title: string; icon: PhosphorIconName; onPress: () => void }[] = [
    {
      id: 'log',
      title: 'Log Expense',
      icon: 'Plus',
      onPress: onPressLogExpense,
    },
    {
      id: 'savings',
      title: 'Add Savings',
      icon: 'PiggyBank',
      onPress: onPressAddSavings,
    },
    {
      id: 'games',
      title: 'Mini Games',
      icon: 'GameController',
      onPress: onPressMiniGames,
    },
    {
      id: 'learn',
      title: 'Learn',
      icon: 'GraduationCap',
      onPress: onPressLearn,
    },
  ];

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.surface,
          borderColor: theme.mode === 'dark' ? '#334155' : '#E2E8F0',
        },
      ]}
    >
      <View style={styles.actionsRow}>
        {actions.map((action) => (
          <InteractivePressable
            key={action.id}
            onPress={action.onPress}
            style={styles.actionItem}
            accessibilityLabel={action.title}
            accessibilityHint={`Opens ${action.title.toLowerCase()}`}
          >
            <View
              style={[
                styles.iconWrapper,
                {
                  backgroundColor:
                    theme.mode === 'dark' ? '#0F172A' : '#F1F5F9',
                  borderColor:
                    theme.mode === 'dark'
                      ? 'rgba(255, 255, 255, 0.1)'
                      : 'rgba(15, 23, 42, 0.08)',
                },
              ]}
            >
              <PhosphorIcon
                name={action.icon}
                size={22}
                color={BRAND_ACCENT}
                weight="duotone"
              />
            </View>
            <Text
              style={[
                styles.actionLabel,
                { color: theme.text },
              ]}
              numberOfLines={1}
            >
              {action.title}
            </Text>
          </InteractivePressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginTop: -22,
    borderRadius: 18,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 8,
    zIndex: 20,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 4,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  actionItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 4,
    gap: 7,
  },
  iconWrapper: {
    width: 50,
    height: 50,
    borderRadius: 999,
    overflow: 'hidden',
    borderWidth: 1.2,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 2px 6px rgba(15, 23, 42, 0.06)',
      } as any,
    }),
  },
  actionLabel: {
    fontSize: 11,
    fontFamily: Fonts.bold,
    textAlign: 'center',
  },
});

export default QuickActionsGrid;
