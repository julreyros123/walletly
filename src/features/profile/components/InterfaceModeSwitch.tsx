import React, { useEffect, useRef, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Text } from 'tamagui';

import { PhosphorIcon, PhosphorIconName } from '@/components/ui/PhosphorIcon';
import { Fonts, ThemeMode } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { safeHaptic } from '@/utils/haptics';

interface ModeOption {
  id: ThemeMode;
  label: string;
  icon: PhosphorIconName;
}

const MODE_OPTIONS: ModeOption[] = [
  { id: 'hybrid', label: 'Hybrid', icon: 'Sparkle' },
  { id: 'dark', label: 'Dark', icon: 'Moon' },
  { id: 'light', label: 'Light', icon: 'Sun' },
];

const SPRING_CONFIG = {
  damping: 19,
  stiffness: 220,
  mass: 0.8,
};

interface InterfaceModeSwitchProps {
  currentMode: ThemeMode;
  onSelectMode: (mode: ThemeMode) => void;
}

export const InterfaceModeSwitch: React.FC<InterfaceModeSwitchProps> = ({
  currentMode,
  onSelectMode,
}) => {
  const theme = useTheme();
  const [availableWidth, setAvailableWidth] = useState(0);

  // Optimistic local state: updates instantly in 0ms without waiting for heavy global theme re-render
  const [selectedMode, setSelectedMode] = useState<ThemeMode>(currentMode);

  useEffect(() => {
    setSelectedMode(currentMode);
  }, [currentMode]);

  const activeIndex = Math.max(
    0,
    MODE_OPTIONS.findIndex((opt) => opt.id === selectedMode)
  );

  const segmentWidth = availableWidth > 0 ? availableWidth / MODE_OPTIONS.length : 0;

  const translateX = useSharedValue(0);
  const pillOpacity = useSharedValue(0);
  const isInitializedRef = useRef(false);
  const previousIndexRef = useRef(activeIndex);
  const previousWidthRef = useRef(availableWidth);

  const handleInnerLayout = (e: LayoutChangeEvent) => {
    const width = Math.round(e.nativeEvent.layout.width);
    if (width > 0 && width !== availableWidth) {
      setAvailableWidth(width);
    }
  };

  useEffect(() => {
    if (availableWidth <= 0) return;

    const targetX = activeIndex * (availableWidth / MODE_OPTIONS.length);

    if (!isInitializedRef.current) {
      // First layout measurement: snap directly to active segment without animation
      translateX.value = targetX;
      pillOpacity.value = 1;
      isInitializedRef.current = true;
      previousIndexRef.current = activeIndex;
      previousWidthRef.current = availableWidth;
    } else if (previousIndexRef.current !== activeIndex) {
      // External or store mode change: animate smoothly with spring
      translateX.value = withSpring(targetX, SPRING_CONFIG);
      previousIndexRef.current = activeIndex;
      previousWidthRef.current = availableWidth;
    } else if (previousWidthRef.current !== availableWidth) {
      // Responsive layout change without mode change
      translateX.value = targetX;
      previousWidthRef.current = availableWidth;
    }
  }, [activeIndex, availableWidth, pillOpacity, translateX]);

  const handlePress = (targetMode: ThemeMode, index: number) => {
    if (targetMode === selectedMode) return;
    safeHaptic('light');

    // 1. Instant local selection update (<1ms)
    setSelectedMode(targetMode);

    // 2. Instant spring animation on UI thread
    if (segmentWidth > 0) {
      translateX.value = withSpring(index * segmentWidth, SPRING_CONFIG);
      previousIndexRef.current = index;
    }

    // 3. Defer heavy global theme tree re-render to next frame so UI responds immediately
    requestAnimationFrame(() => {
      onSelectMode(targetMode);
    });
  };

  const animatedPillStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
      opacity: pillOpacity.value,
    };
  });

  const isDarkMode = selectedMode === 'dark';
  const isReady = availableWidth > 0;

  return (
    <View
      style={[
        styles.track,
        {
          backgroundColor: isDarkMode
            ? 'rgba(0, 0, 0, 0.3)'
            : theme.backgroundElement,
          borderColor: isDarkMode
            ? 'rgba(255, 255, 255, 0.06)'
            : 'rgba(0, 0, 0, 0.04)',
        },
      ]}
    >
      <View
        onLayout={handleInnerLayout}
        style={styles.innerContainer}
      >
        {/* Animated Sliding Pill */}
        {segmentWidth > 0 && (
          <Animated.View
            style={[
              styles.slidingPill,
              {
                width: segmentWidth,
                backgroundColor: isDarkMode ? '#334155' : '#FFFFFF',
                borderColor: isDarkMode
                  ? 'rgba(255, 255, 255, 0.12)'
                  : 'rgba(0, 0, 0, 0.04)',
                shadowOpacity: isDarkMode ? 0.35 : 0.08,
              },
              animatedPillStyle,
            ]}
          />
        )}

        {/* Buttons Row */}
        <View style={styles.buttonsRow}>
          {MODE_OPTIONS.map((item, index) => {
            const isSelected = selectedMode === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                onPress={() => handlePress(item.id, index)}
                activeOpacity={0.75}
                style={[
                  styles.segmentButton,
                  // Fallback background before layout measures
                  !isReady && isSelected && {
                    backgroundColor: isDarkMode ? '#334155' : '#FFFFFF',
                  },
                ]}
              >
                <PhosphorIcon
                  name={item.icon}
                  size={14}
                  color={isSelected ? (isDarkMode ? '#FFFFFF' : '#0F172A') : theme.textSecondary}
                  weight={isSelected ? 'fill' : 'regular'}
                />
                <Text
                  color={isSelected ? (isDarkMode ? '#FFFFFF' : '#0F172A') : theme.textSecondary}
                  fontSize={12}
                  style={{ fontFamily: isSelected ? Fonts.bold : Fonts.medium }}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  track: {
    padding: 4,
    borderRadius: 10,
    borderWidth: 1,
  },
  innerContainer: {
    position: 'relative',
    width: '100%',
  },
  slidingPill: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    borderRadius: 7,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
    zIndex: 0,
  },
  buttonsRow: {
    flexDirection: 'row',
    width: '100%',
    zIndex: 1,
  },
  segmentButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 7,
  },
});
