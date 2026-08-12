import React, { useRef, useEffect } from 'react';
import { Animated, StyleSheet, View, Platform } from 'react-native';
import { YStack, Text } from 'tamagui';
import { Image } from 'expo-image';

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
      {/* App Logo */}
      <Animated.View
        style={[
          styles.logoWrap,
          { opacity: logoOpacity, transform: [{ scale: logoScale }] },
        ]}
      >
        <Image
          source={require('@/assets/images/walletly-logo.png')}
          style={styles.logo}
          contentFit="contain"
        />
      </Animated.View>

      {/* Title & Subtitle */}
      {(title || subtitle) && (
        <YStack alignItems="center" gap={6} marginTop={16}>
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
    shadowColor: '#0052FF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 12,
  },
  logo: {
    width: 72,
    height: 72,
    borderRadius: 20,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.6,
    lineHeight: 34,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Inter-Bold' : undefined,
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Inter-Regular' : undefined,
  },
});
