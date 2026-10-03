import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { Image } from 'expo-image';

export interface CbudgetLogoSVGProps {
  size?: number;
  showText?: boolean;
  animationMode?: string;
  primaryColor?: string;
  secondaryColor?: string;
  textColor?: string;
  style?: ViewStyle;
}

const FULL_LOGO = require('@/assets/images/walletly-logo.png');
// Symbol-only mark with transparent background (cropped from the master logo, no wordmark)
const MARK_LOGO = require('@/assets/images/cbudget-mark.png');

export function CbudgetLogoSVG({
  size = 64,
  showText = true,
  style,
}: CbudgetLogoSVGProps) {
  return (
    <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}>
      <Image
        source={showText ? FULL_LOGO : MARK_LOGO}
        style={{
          width: size,
          height: size,
          borderRadius: showText ? Math.round(size * 0.22) : 0,
        }}
        contentFit="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default CbudgetLogoSVG;
