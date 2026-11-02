import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Image } from 'expo-image';

interface UserAvatarProps {
  size?: number;
  avatarUrl?: string | null;
  avatarEmoji?: string | null;
  avatarColor?: string | null;
  name?: string | null;
  borderColor?: string;
  showBorder?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function UserAvatar({
  size = 48,
  avatarUrl,
  avatarEmoji,
  avatarColor = '#10B981',
  name = 'User',
  borderColor,
  showBorder = true,
  style,
}: UserAvatarProps) {
  const initials = (name || 'U')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s.charAt(0).toUpperCase())
    .join('');

  const radius = size / 2;
  const fontSize = Math.round(size * 0.45);
  const initialsSize = Math.round(size * 0.38);

  return (
    <View
      style={[
        styles.avatarBase,
        {
          width: size,
          height: size,
          borderRadius: radius,
          backgroundColor: avatarUrl ? '#0F172A' : avatarColor || '#10B981',
          borderWidth: showBorder ? (size > 60 ? 3 : 2) : 0,
          borderColor: borderColor || 'rgba(255, 255, 255, 0.2)',
        },
        style,
      ]}
    >
      {avatarUrl ? (
        <Image
          source={{ uri: avatarUrl }}
          style={[styles.image, { borderRadius: radius }]}
          contentFit="cover"
          transition={200}
        />
      ) : avatarEmoji ? (
        <Text style={[styles.emojiText, { fontSize }]}>{avatarEmoji}</Text>
      ) : (
        <Text style={[styles.initialsText, { fontSize: initialsSize }]}>
          {initials || 'U'}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  avatarBase: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  emojiText: {
    textAlign: 'center',
  },
  initialsText: {
    color: '#FFFFFF',
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
});

