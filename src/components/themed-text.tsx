import { Platform, StyleSheet, Text, type TextProps } from 'react-native';

import { Fonts, ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ThemedTextProps = TextProps & {
  type?:
    | 'default'
    | 'display'
    | 'title'
    | 'h1'
    | 'h2'
    | 'h3'
    | 'bodyMed'
    | 'small'
    | 'smallBold'
    | 'subtitle'
    | 'label'
    | 'overline'
    | 'number'
    | 'numberLg'
    | 'link'
    | 'linkPrimary'
    | 'code';
  themeColor?: ThemeColor;
};

export function ThemedText({ style, type = 'default', themeColor, ...rest }: ThemedTextProps) {
  const theme = useTheme();

  return (
    <Text
      style={[
        { color: theme[themeColor ?? 'text'] },
        styles[type] || styles.default,
        type === 'linkPrimary' && { color: theme.primary },
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  display: {
    fontFamily: Fonts.extraBold,
    fontSize: 34,
    lineHeight: 40,
    letterSpacing: -1.2,
  },
  title: {
    fontFamily: Fonts.bold,
    fontSize: 26,
    lineHeight: 32,
    letterSpacing: -0.6,
  },
  h1: {
    fontFamily: Fonts.bold,
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.5,
  },
  h2: {
    fontFamily: Fonts.bold,
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: -0.3,
  },
  h3: {
    fontFamily: Fonts.semiBold,
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontFamily: Fonts.medium,
    fontSize: 15,
    lineHeight: 22,
    letterSpacing: -0.1,
  },
  default: {
    fontFamily: Fonts.regular,
    fontSize: 15,
    lineHeight: 22,
    letterSpacing: -0.1,
  },
  bodyMed: {
    fontFamily: Fonts.medium,
    fontSize: 15,
    lineHeight: 22,
    letterSpacing: -0.1,
  },
  small: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: -0.05,
  },
  smallBold: {
    fontFamily: Fonts.semiBold,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: -0.05,
  },
  label: {
    fontFamily: Fonts.semiBold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.1,
  },
  overline: {
    fontFamily: Fonts.bold,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  number: {
    fontFamily: Fonts.bold,
    fontSize: 16,
    letterSpacing: -0.3,
  },
  numberLg: {
    fontFamily: Fonts.bold,
    fontSize: 24,
    letterSpacing: -0.5,
  },
  link: {
    fontFamily: Fonts.semiBold,
    fontSize: 14,
    lineHeight: 20,
  },
  linkPrimary: {
    fontFamily: Fonts.semiBold,
    fontSize: 14,
    lineHeight: 20,
  },
  code: {
    fontFamily: Fonts.mono,
    fontSize: 12,
  },
});
