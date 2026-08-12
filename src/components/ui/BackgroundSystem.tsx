import React, { useEffect } from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '@/hooks/use-theme';

interface BackgroundSystemProps {
  mode?: 'auth' | 'tabs';
  height?: number | string;
}

export function BackgroundSystem({ mode = 'auth', height = 180 }: BackgroundSystemProps) {
  const theme = useTheme();
  // Shared values for tabs mode banner micro-float only
  const bannerY1 = useSharedValue(0);
  const bannerY2 = useSharedValue(0);

  useEffect(() => {
    if (mode !== 'tabs') return;
    // Subtle micro-float only for tabs banner — very restrained
    bannerY1.value = withRepeat(
      withSequence(
        withTiming(6, { duration: 7000, easing: Easing.inOut(Easing.ease) }),
        withTiming(-6, { duration: 7000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    bannerY2.value = withRepeat(
      withSequence(
        withTiming(-8, { duration: 9000, easing: Easing.inOut(Easing.ease) }),
        withTiming(8, { duration: 9000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, [mode]);

  // Tabs Mode Styles
  const tabStyleCircle = useAnimatedStyle(() => ({
    transform: [{ translateY: bannerY1.value }] as any,
  }));

  const tabStyleDiamond = useAnimatedStyle(() => ({
    transform: [
      { translateY: bannerY2.value },
      { rotate: '45deg' }
    ] as any,
  }));

  // Auth Mode — clean premium static accent shapes (no floating gimmicks)
  if (mode === 'auth') {
    return (
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {/* Top-right large soft circle */}
        <View
          style={[
            styles.softCircle,
            { backgroundColor: theme.primary, top: -160, right: -160, opacity: 0.07, width: 360, height: 360, borderRadius: 180 },
          ]}
        />
        {/* Bottom-left smaller accent */}
        <View
          style={[
            styles.softCircle,
            { backgroundColor: theme.primary, bottom: -120, left: -120, opacity: 0.05, width: 280, height: 280, borderRadius: 140 },
          ]}
        />
        {/* Top-left hairline arc — very subtle */}
        <View
          style={[
            styles.softCircle,
            { borderColor: `${theme.primary}30`, borderWidth: 1, backgroundColor: 'transparent', top: -80, left: -80, width: 220, height: 220, borderRadius: 110 },
          ]}
        />
      </View>
    );
  }

  // Tabs Mode (top banner)
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Top Accent Background Banner */}
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: height,
          backgroundColor: '#001a36',
          borderBottomLeftRadius: 24,
          borderBottomRightRadius: 24,
          overflow: 'hidden',
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  softCircle: {
    position: 'absolute',
  },
});
