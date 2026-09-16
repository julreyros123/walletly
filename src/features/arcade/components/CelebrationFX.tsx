import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Animated, Easing } from 'react-native';
import Svg, { Circle, Rect, Path, G } from 'react-native-svg';

const PARTICLES_COUNT = 24;

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  shape: 'circle' | 'rect' | 'star';
  speedX: number;
  speedY: number;
  rotSpeed: number;
}

const COLORS = ['#10B981', '#34D399', '#FBBF24', '#F59E0B', '#38BDF8', '#EC4899', '#A855F7'];

export function CelebrationFX() {
  const animValue = useRef(new Animated.Value(0)).current;

  // Generate deterministic particles for celebration burst
  const particles = useRef<Particle[]>(
    Array.from({ length: PARTICLES_COUNT }).map((_, i) => {
      const angle = (i / PARTICLES_COUNT) * Math.PI * 2 + (Math.random() * 0.4 - 0.2);
      const distance = 80 + Math.random() * 90;
      return {
        id: i,
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance - 20,
        size: 5 + Math.random() * 6,
        color: COLORS[i % COLORS.length],
        shape: i % 3 === 0 ? 'star' : i % 2 === 0 ? 'rect' : 'circle',
        speedX: Math.cos(angle) * distance,
        speedY: Math.sin(angle) * distance,
        rotSpeed: (Math.random() - 0.5) * 360,
      };
    })
  ).current;

  useEffect(() => {
    animValue.setValue(0);
    Animated.timing(animValue, {
      toValue: 1,
      duration: 1200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, []);

  const opacity = animValue.interpolate({
    inputRange: [0, 0.7, 1],
    outputRange: [1, 0.9, 0],
  });

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {particles.map((p) => {
        const translateX = animValue.interpolate({
          inputRange: [0, 1],
          outputRange: [0, p.x],
        });
        const translateY = animValue.interpolate({
          inputRange: [0, 0.6, 1],
          outputRange: [0, p.y - 15, p.y + 40], // Arc and gravity fall
        });
        const rotate = animValue.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', `${p.rotSpeed}deg`],
        });
        const scale = animValue.interpolate({
          inputRange: [0, 0.2, 1],
          outputRange: [0.2, 1.2, 0.6],
        });

        return (
          <Animated.View
            key={p.id}
            style={[
              styles.particle,
              {
                opacity,
                transform: [{ translateX }, { translateY }, { rotate }, { scale }],
              },
            ]}
          >
            <Svg width={p.size * 2} height={p.size * 2} viewBox="0 0 20 20">
              {p.shape === 'circle' && <Circle cx="10" cy="10" r="7" fill={p.color} />}
              {p.shape === 'rect' && <Rect x="3" y="3" width="14" height="14" rx="2" fill={p.color} />}
              {p.shape === 'star' && (
                <Path
                  d="M 10 2 L 12.5 7.5 L 18 8 L 14 12 L 15 17.5 L 10 14.5 L 5 17.5 L 6 12 L 2 8 L 7.5 7.5 Z"
                  fill={p.color}
                />
              )}
            </Svg>
          </Animated.View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  particle: {
    position: 'absolute',
    left: '50%',
    top: '40%',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
