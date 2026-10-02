import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, Animated } from 'react-native';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';

export interface SplashScreenProps {
  onAnimationEnd?: () => void;
}

export function CbudgetSplashScreen({ onAnimationEnd }: SplashScreenProps) {
  const [isDone, setIsDone] = useState(false);

  // Animated entrance and exit values
  const logoScale = useRef(new Animated.Value(0.92)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const containerOpacity = useRef(new Animated.Value(1)).current;

  const handleFinish = () => {
    setIsDone(true);
    if (onAnimationEnd) {
      onAnimationEnd();
    }
  };

  useEffect(() => {
    // 1. Smooth entrance animation
    Animated.parallel([
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 7,
        tension: 70,
        useNativeDriver: true,
      }),
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // 2. Play full splash motion sequence, then smoothly fade out to reveal the app
    const exitTimer = setTimeout(() => {
      Animated.timing(containerOpacity, {
        toValue: 0,
        duration: 450,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) {
          handleFinish();
        }
      });
    }, 2800);

    return () => {
      clearTimeout(exitTimer);
    };
  }, []);

  if (isDone) {
    return null;
  }

  return (
    <Animated.View
      style={[styles.container, { opacity: containerOpacity }]}
      pointerEvents={isDone ? 'none' : 'auto'}
    >
      <StatusBar style="light" />

      <View style={styles.contentWrapper}>
        <Animated.View
          style={{
            opacity: logoOpacity,
            transform: [{ scale: logoScale }],
          }}
        >
          {/* Watermark-free animated splash asset */}
          <Image
            source={require('@/assets/animations/walletly_splash.webp')}
            style={styles.masterLogo}
            contentFit="contain"
            priority="high"
          />
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#121E3F',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 99999,
  },
  contentWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  masterLogo: {
    width: 240,
    height: 240,
  },
});

export default CbudgetSplashScreen;
