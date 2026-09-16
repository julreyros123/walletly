import React, { useEffect, useRef, useState } from 'react';
import {
  LayoutChangeEvent,
  Platform,
  StyleProp,
  StyleSheet,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Text } from 'tamagui';
import { PhosphorIcon, PhosphorIconName } from '@/components/ui/PhosphorIcon';
import { Fonts } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { safeHaptic } from '@/utils/haptics';

export interface SegmentOption<T extends string = string> {
  id: T;
  label: string;
  icon?: PhosphorIconName;
}

const SPRING_CONFIG = {
  damping: 20,
  stiffness: 280,
  mass: 0.6,
};

interface AnimatedSegmentSwitchProps<T extends string = string> {
  options: SegmentOption<T>[];
  activeId: T;
  onChange: (id: T) => void;
  height?: number;
  activePillColor?: string;
  activeTextColor?: string;
  inactiveTextColor?: string;
  forceDark?: boolean;
  style?: StyleProp<ViewStyle>;
  trackStyle?: StyleProp<ViewStyle>;
  fontSize?: number;
}

export function AnimatedSegmentSwitch<T extends string = string>({
  options,
  activeId,
  onChange,
  height = 40,
  activePillColor,
  activeTextColor = '#FFFFFF',
  inactiveTextColor,
  forceDark = false,
  style,
  trackStyle,
  fontSize = 13,
}: AnimatedSegmentSwitchProps<T>) {
  const theme = useTheme();
  const [availableWidth, setAvailableWidth] = useState(0);

  // Optimistic local state: updates in 0ms without waiting for heavy parent re-render
  const [selectedId, setSelectedId] = useState<T>(activeId);

  useEffect(() => {
    setSelectedId(activeId);
  }, [activeId]);

  const activeIndex = Math.max(
    0,
    options.findIndex((opt) => opt.id === selectedId)
  );

  const numOptions = options.length;
  const padding = 3;
  const innerWidth = Math.max(0, availableWidth - padding * 2);
  const segmentWidth = numOptions > 0 && innerWidth > 0 ? innerWidth / numOptions : 0;

  const translateX = useSharedValue(0);
  const pillOpacity = useSharedValue(0);
  const isInitializedRef = useRef(false);
  const previousIndexRef = useRef(activeIndex);
  const previousWidthRef = useRef(availableWidth);

  const handleLayout = (e: LayoutChangeEvent) => {
    const width = Math.round(e.nativeEvent.layout.width);
    if (width > 0 && width !== availableWidth) {
      setAvailableWidth(width);
    }
  };

  useEffect(() => {
    if (availableWidth <= 0 || segmentWidth <= 0) return;

    const targetX = activeIndex * segmentWidth;

    if (!isInitializedRef.current) {
      // First layout measurement: snap immediately without animation (0 delay)
      translateX.value = targetX;
      pillOpacity.value = 1;
      isInitializedRef.current = true;
      previousIndexRef.current = activeIndex;
      previousWidthRef.current = availableWidth;
    } else if (previousIndexRef.current !== activeIndex) {
      // External or state change: spring smoothly
      translateX.value = withSpring(targetX, SPRING_CONFIG);
      previousIndexRef.current = activeIndex;
      previousWidthRef.current = availableWidth;
    } else if (previousWidthRef.current !== availableWidth) {
      // Layout resize without tab change
      translateX.value = targetX;
      previousWidthRef.current = availableWidth;
    }
  }, [activeIndex, availableWidth, segmentWidth, pillOpacity, translateX]);

  const handlePress = (targetId: T, index: number) => {
    if (targetId === selectedId) return;
    safeHaptic('light');

    // Instant optimistic update for the child's text styling (0ms latency!)
    setSelectedId(targetId);

    if (segmentWidth > 0) {
      translateX.value = withSpring(index * segmentWidth, SPRING_CONFIG);
      previousIndexRef.current = index;
    }

    onChange(targetId);
  };

  const animatedPillStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    opacity: pillOpacity.value,
  }));

  const isDarkMode = forceDark || theme.mode === 'dark';
  const resolvedTrackColor = isDarkMode ? '#131D31' : '#FFFFFF';
  const resolvedBorderColor = isDarkMode ? 'rgba(255, 255, 255, 0.08)' : theme.border;
  const resolvedPillColor = activePillColor || theme.primary || '#10B981';
  const resolvedInactiveTextColor = inactiveTextColor || (isDarkMode ? '#8D99AE' : theme.textSecondary);
  const isReady = availableWidth > 0 && segmentWidth > 0;

  return (
    <View
      style={[
        styles.track,
        {
          height,
          backgroundColor: resolvedTrackColor,
          borderColor: resolvedBorderColor,
        },
        trackStyle,
        style,
      ]}
      onLayout={handleLayout}
      accessibilityRole="tablist"
    >
      {/* Sliding Animated Pill Background */}
      {isReady && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.activePill,
            {
              left: padding,
              width: segmentWidth,
              height: height - padding * 2,
              backgroundColor: resolvedPillColor,
              shadowColor: resolvedPillColor,
            },
            animatedPillStyle,
          ]}
        />
      )}

      {/* Segment Tap Targets & Labels */}
      <View style={styles.segmentsRow}>
        {options.map((opt, index) => {
          const isSelected = opt.id === selectedId;
          return (
            <TouchableOpacity
              key={opt.id}
              onPress={() => handlePress(opt.id, index)}
              style={styles.segmentButton}
              activeOpacity={0.75}
              accessibilityRole="tab"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={opt.label}
            >
              <View style={styles.labelWrapper}>
                {opt.icon && (
                  <PhosphorIcon
                    name={opt.icon}
                    size={fontSize + 2}
                    color={isSelected ? activeTextColor : resolvedInactiveTextColor}
                    weight={isSelected ? 'bold' : 'regular'}
                  />
                )}
                <Text
                  fontSize={fontSize}
                  numberOfLines={1}
                  style={{
                    color: isSelected ? activeTextColor : resolvedInactiveTextColor,
                    fontFamily: isSelected ? Fonts.bold : Fonts.semiBold,
                  }}
                >
                  {opt.label}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    borderRadius: 24,
    padding: 3,
    borderWidth: 1,
    position: 'relative',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 2px 8px rgba(15, 23, 42, 0.06)',
      } as any,
    }),
  },
  activePill: {
    position: 'absolute',
    borderRadius: 20,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  segmentsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: '100%',
    zIndex: 1,
  },
  segmentButton: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
});
