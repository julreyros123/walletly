import React from 'react';
import { StyleSheet, View } from 'react-native';
import { YStack, Text } from 'tamagui';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';

interface HeroGraphicProps {
  title?: string;
  subtitle?: string;
}

export function HeroGraphic({ title, subtitle }: HeroGraphicProps) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      {/* Premium Graphic Card Container */}
      <View style={[styles.graphicContainer, { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1 }]}>
        
        {/* Deep Blue Polygon */}
        <View style={[styles.polygon, { 
          backgroundColor: theme.primary, 
          width: 260, 
          height: 260, 
          top: -120, 
          left: -60, 
          transform: [{ rotate: '35deg' }, { skewX: '20deg' }],
          opacity: 0.12,
          zIndex: -1
        }]} />
        
        {/* Secondary Angular Shape */}
        <View style={[styles.polygon, { 
          backgroundColor: theme.primary, 
          width: 220, 
          height: 220, 
          top: -30, 
          right: -80, 
          transform: [{ rotate: '-15deg' }, { skewY: '-25deg' }],
          opacity: 0.1,
          zIndex: -1
        }]} />
        
        {/* Accent Sharp Shape */}
        <View style={[styles.polygon, { 
          backgroundColor: theme.primary, 
          width: 120, 
          height: 300, 
          bottom: -120, 
          left: '20%', 
          transform: [{ rotate: '45deg' }],
          opacity: 0.08,
          zIndex: -1
        }]} />

        {/* Crisp overlay lines to reinforce "geometric" structure */}
        <View style={[styles.line, { borderColor: theme.primary, top: '20%', left: '-10%', transform: [{ rotate: '35deg' }], zIndex: -1 }]} />
        <View style={[styles.line, { borderColor: theme.primary, top: '65%', right: '-20%', transform: [{ rotate: '-15deg' }], zIndex: -1 }]} />

        {/* Text Content Overlay */}
        {(title || subtitle) && (
          <YStack
            justifyContent="center"
            alignItems="flex-start"
            zIndex={10}
            gap={8}
          >
            {title && (
              <Text
                color={theme.text}
                fontSize={22}
                fontWeight="800"
                letterSpacing={-0.5}
                lineHeight={28}
              >
                {title}
              </Text>
            )}
            {subtitle && (
              <Text
                color={theme.textSecondary}
                fontSize={13}
                fontWeight="500"
                lineHeight={18}
              >
                {subtitle}
              </Text>
            )}
          </YStack>
        )}

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 12,
    overflow: 'hidden',
    borderRadius: 20,
  },
  graphicContainer: {
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 20,
  },
  polygon: {
    position: 'absolute',
    borderRadius: 32,
  },
  line: {
    position: 'absolute',
    width: '150%',
    height: 1,
    borderWidth: 1,
    opacity: 0.08,
  }
});
