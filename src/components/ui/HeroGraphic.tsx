import React, { useRef, useEffect } from 'react';
import { Animated, StyleSheet, View, Platform } from 'react-native';
import { YStack, Text } from 'tamagui';
import { Image } from 'expo-image';

import { Fonts } from '@/constants/theme';
import { CbudgetLogoSVG } from '@/components/ui/CbudgetLogoSVG';

interface HeroGraphicProps {
  title?: string;
  subtitle?: string;
}

export function HeroGraphic({ title, subtitle }: HeroGraphicProps) {
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.88)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslate = useRef(new Animated.Value(10)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          damping: 18,
          stiffness: 180,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 280,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.spring(titleTranslate, {
          toValue: 0,
          damping: 20,
          stiffness: 200,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(subtitleOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      {/* App Vector Logo without background */}
      <Animated.View
        style={[
          styles.logoWrap,
          { opacity: logoOpacity, transform: [{ scale: logoScale }] },
        ]}
      >
        <CbudgetLogoSVG size={72} showText={false} />
      </Animated.View>

      {/* Title & Subtitle */}
      {(title || subtitle) && (
        <YStack alignItems="center" gap={8} marginTop={16}>
          {title && (
            <Animated.Text
              style={[
                styles.title,
                {
                  opacity: titleOpacity,
                  transform: [{ translateY: titleTranslate }],
                },
              ]}
            >
              {title}
            </Animated.Text>
          )}
          {subtitle && (
            <Animated.Text style={[styles.subtitle, { opacity: subtitleOpacity }]}>
              {subtitle}
            </Animated.Text>
          )}
        </YStack>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 24,
    paddingTop: 8,
  },
  logoWrap: {
    shadowColor: '#2ECC71',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  logo: {
    width: 72,
    height: 72,
    borderRadius: 20,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 26,
    letterSpacing: -0.6,
    lineHeight: 32,
    textAlign: 'center',
    fontFamily: Fonts.bold,
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    fontFamily: Fonts.regular,
    letterSpacing: -0.1,
  },
});
