import { useMemo } from 'react';
import { Colors } from '@/constants/theme';
import { useThemeStore } from '@/store/themeStore';

export function useTheme() {
  const mode = useThemeStore((state) => state.mode);
  const primaryColor = useThemeStore((state) => state.primaryColor);

  return useMemo(() => {
    const themeColors = Colors[mode] || Colors.hybrid;
    const primaryHex = getPrimaryHex(primaryColor);

    return {
      ...themeColors,
      primary: primaryHex,
      mode,
    };
  }, [mode, primaryColor]);
}

function getPrimaryHex(color: string) {
  switch (color) {
    case 'teal':
      return '#14B8A6';
    case 'purple':
      return '#8B5CF6';
    case 'rose':
      return '#F43F5E';
    case 'orange':
      return '#F97316';
    case 'sky':
      return '#0EA5E9';
    case 'green':
    default:
      return '#10B981'; // Vibrant Brand Emerald
  }
}
