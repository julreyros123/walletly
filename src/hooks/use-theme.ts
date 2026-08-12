import { Colors } from '@/constants/theme';
import { useThemeStore } from '@/store/themeStore';

export function useTheme() {
  const { mode, primaryColor } = useThemeStore();

  const themeColors = Colors[mode];

  // Map user-selected primary accent colors to hex values
  const primaryHex = getPrimaryHex(primaryColor);

  return {
    ...themeColors,
    primary: primaryHex,
  };
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
    default:
      return '#0EA5E9';
  }
}
