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
}

export function BackgroundSystem({ mode = 'auth' }: BackgroundSystemProps) {
  const theme = useTheme();
  // Shared values for auth mode (floating polygons)
  const floatY1 = useSharedValue(0);
  const floatX2 = useSharedValue(0);
  const floatY3 = useSharedValue(0);
  const floatX4 = useSharedValue(0);
  const floatY5 = useSharedValue(0);
  const floatX6 = useSharedValue(0);

  // Shared values for tabs mode (micro-float banner shapes)
  const bannerY1 = useSharedValue(0);
  const bannerY2 = useSharedValue(0);

  useEffect(() => {
    if (mode === 'auth') {
      // Top-Left Floating
      floatY1.value = withRepeat(
        withSequence(
          withTiming(15, { duration: 7000, easing: Easing.inOut(Easing.ease) }),
          withTiming(-15, { duration: 7000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );

      // Mid-Right Floating
      floatX2.value = withRepeat(
        withSequence(
          withTiming(-20, { duration: 9000, easing: Easing.inOut(Easing.ease) }),
          withTiming(20, { duration: 9000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );

      // Mid-Right Lower Floating
      floatY3.value = withRepeat(
        withSequence(
          withTiming(25, { duration: 8000, easing: Easing.inOut(Easing.ease) }),
          withTiming(-25, { duration: 8000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );

      // Mid-Left Floating
      floatX4.value = withRepeat(
        withSequence(
          withTiming(-18, { duration: 10000, easing: Easing.inOut(Easing.ease) }),
          withTiming(18, { duration: 10000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );

      // Bottom-Left Floating
      floatY5.value = withRepeat(
        withSequence(
          withTiming(22, { duration: 8500, easing: Easing.inOut(Easing.ease) }),
          withTiming(-22, { duration: 8500, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );

      // Bottom-Right Floating
      floatX6.value = withRepeat(
        withSequence(
          withTiming(-16, { duration: 9500, easing: Easing.inOut(Easing.ease) }),
          withTiming(16, { duration: 9500, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    } else {
      // Smooth micro-float for tabs banner shapes
      bannerY1.value = withRepeat(
        withSequence(
          withTiming(8, { duration: 6000, easing: Easing.inOut(Easing.ease) }),
          withTiming(-8, { duration: 6000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );

      bannerY2.value = withRepeat(
        withSequence(
          withTiming(-10, { duration: 7000, easing: Easing.inOut(Easing.ease) }),
          withTiming(10, { duration: 7000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    }
  }, [mode]);

  // Auth Mode Styles
  const authStyle1 = useAnimatedStyle(() => ({
    transform: [
      { translateY: floatY1.value },
      { rotate: '45deg' },
      ...(Platform.OS === 'web' ? [{ skewX: '15deg' }] : [{ scaleX: 1.2 }]),
    ] as any,
  }));

  const authStyle2 = useAnimatedStyle(() => ({
    transform: [
      { translateX: floatX2.value },
      { rotate: '25deg' },
      ...(Platform.OS === 'web' ? [{ skewY: '-20deg' }] : [{ scaleY: 1.2 }]),
    ] as any,
  }));

  const authStyle3 = useAnimatedStyle(() => ({
    transform: [
      { translateY: floatY3.value },
      { rotate: '-15deg' },
      ...(Platform.OS === 'web' ? [{ skewX: '-10deg' }] : [{ scaleX: 1.1 }]),
    ] as any,
  }));

  const authStyle4 = useAnimatedStyle(() => ({
    transform: [
      { translateX: floatX4.value },
      { rotate: '60deg' },
      ...(Platform.OS === 'web' ? [{ skewY: '10deg' }] : [{ scaleY: 1.1 }]),
    ] as any,
  }));

  const authStyle5 = useAnimatedStyle(() => ({
    transform: [
      { translateY: floatY5.value },
      { rotate: '35deg' },
      ...(Platform.OS === 'web' ? [{ skewX: '5deg' }] : [{ scaleX: 1.05 }]),
    ] as any,
  }));

  const authStyle6 = useAnimatedStyle(() => ({
    transform: [
      { translateX: floatX6.value },
      { rotate: '50deg' },
      ...(Platform.OS === 'web' ? [{ skewY: '-5deg' }] : [{ scaleY: 1.05 }]),
    ] as any,
  }));

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

  if (mode === 'auth') {
    return (
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {/* Top Left Shape */}
        <Animated.View
          style={[
            styles.polygon,
            { backgroundColor: theme.primary, top: -80, left: -60 },
            authStyle1,
          ]}
        />

        {/* Mid Right Shape */}
        <Animated.View
          style={[
            styles.polygon,
            { backgroundColor: theme.primary, top: '22%', right: -120 },
            authStyle2,
          ]}
        />

        {/* Mid Left Shape */}
        <Animated.View
          style={[
            styles.polygon,
            { backgroundColor: theme.primary, top: '45%', left: -140 },
            authStyle4,
          ]}
        />

        {/* Lower Mid Right Shape */}
        <Animated.View
          style={[
            styles.polygon,
            { backgroundColor: theme.primary, top: '68%', right: -130 },
            authStyle3,
          ]}
        />

        {/* Bottom Left Shape */}
        <Animated.View
          style={[
            styles.polygon,
            { backgroundColor: theme.primary, bottom: -120, left: -80 },
            authStyle5,
          ]}
        />

        {/* Bottom Right Shape */}
        <Animated.View
          style={[
            styles.polygon,
            { backgroundColor: theme.primary, bottom: -140, right: -80 },
            authStyle6,
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
          height: 180,
          backgroundColor: `${theme.primary}1F` as any, // Dynamic opacity base
          borderBottomLeftRadius: 24,
          borderBottomRightRadius: 24,
          overflow: 'hidden',
        }}
      >
        {/* Dynamic Graphic Accent Shapes inside the banner */}
        <Animated.View
          style={[
            {
              position: 'absolute',
              top: -40,
              right: -20,
              width: 140,
              height: 140,
              borderRadius: 70,
              backgroundColor: `${theme.primary}40` as any, // Dynamic primary accent circle
            },
            tabStyleCircle,
          ]}
        />
        <Animated.View
          style={[
            {
              position: 'absolute',
              bottom: -50,
              left: -30,
              width: 110,
              height: 110,
              backgroundColor: `${theme.primary}33` as any, // Dynamic primary accent diamond
            },
            tabStyleDiamond,
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  polygon: {
    position: 'absolute',
    width: 350,
    height: 350,
    borderRadius: 0, // Sharp edge matching the W logo angles
    opacity: 0.18, // High contrast visible graphics
  },
});
