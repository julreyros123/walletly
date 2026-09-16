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
  const logoScale = useRef(new Animated.Value(0.82)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const containerOpacity = useRef(new Animated.Value(1)).current;

  const handleFinish = () => {
    setIsDone(true);
    if (onAnimationEnd) {
      onAnimationEnd();
    }
  };

  useEffect(() => {
    // 1. Exact logo pops into center with smooth physics
    Animated.parallel([
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 6,
        tension: 80,
        useNativeDriver: true,
      }),
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 380,
        useNativeDriver: true,
      }),
    ]).start();

    // 2. Smooth container fade-out to reveal the main app
    const exitTimer = setTimeout(() => {
      Animated.timing(containerOpacity, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) {
          handleFinish();
        }
      });
    }, 1800);

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
            shadowColor: '#2ECC71',
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.28,
            shadowRadius: 28,
            elevation: 12,
          }}
        >
          {/* Exact master PNG logo with 100% pixel-perfect accuracy */}
          <Image
            source={require('@/assets/images/walletly-logo.png')}
            style={styles.masterLogo}
            contentFit="contain"
          />
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#020C18',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 99999,
  },
  contentWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  masterLogo: {
    width: 220,
    height: 220,
    borderRadius: 48,
  },
});

export default CbudgetSplashScreen;
