import { Tabs } from 'expo-router';
import { useTheme } from '@/hooks/use-theme';
import { SymbolView } from 'expo-symbols';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabsLayout() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.surface,
          borderTopColor: theme.border,
          height: Platform.OS === 'web' ? 64 : 60 + insets.bottom,
          paddingBottom: Platform.OS === 'web' ? 10 : (insets.bottom > 0 ? insets.bottom : 8),
          paddingTop: 10,
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            <SymbolView
              name={{ ios: 'house.fill', android: 'home', web: 'home' } as const}
              size={size}
              tintColor={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="budget"
        options={{
          title: 'Budget',
          tabBarIcon: ({ color, size }) => (
            <SymbolView
              name={{ ios: 'chart.pie.fill', android: 'pie_chart', web: 'pie_chart' } as const}
              size={size}
              tintColor={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="learn"
        options={{
          title: 'Learn',
          tabBarIcon: ({ color, size }) => (
            <SymbolView
              name={{ ios: 'book.closed.fill', android: 'menu_book', web: 'menu_book' } as const}
              size={size}
              tintColor={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="invest"
        options={{
          title: 'Invest Lab',
          tabBarIcon: ({ color, size }) => (
            <SymbolView
              name={{ ios: 'chart.bar.fill', android: 'trending_up', web: 'trending_up' } as const}
              size={size}
              tintColor={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <SymbolView
              name={{ ios: 'person.fill', android: 'person', web: 'person' } as const}
              size={size}
              tintColor={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
