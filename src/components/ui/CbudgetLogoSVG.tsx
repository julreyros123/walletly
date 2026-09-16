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

export function CbudgetLogoSVG({
  size = 64,
  style,
}: CbudgetLogoSVGProps) {
  // Uses the exact high-resolution master PNG logo asset with unified proportions
  return (
    <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}>
      <Image
        source={require('@/assets/images/walletly-logo.png')}
        style={{
          width: size,
          height: size,
          borderRadius: Math.round(size * 0.22),
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
