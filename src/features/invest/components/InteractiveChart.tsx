import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { YStack, XStack, Text, View } from 'tamagui';

export function InteractiveChart({
  data,
  color,
  onChangePrice,
  theme,
}: {
  data: number[];
  color: string;
  onChangePrice: (val: number | null) => void;
  theme: any;
}) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const chartHeight = 130;
  const [chartWidth, setChartWidth] = useState(300); // Dynamic layout fallback

  const points = data.map((val, idx) => {
    const x = (idx / (data.length - 1)) * (chartWidth - 10) + 5;
    const y = chartHeight - 15 - ((val - min) / range) * (chartHeight - 30);
    return { x, y, val };
  });

  const lastPoint = points[points.length - 1];

  return (
    <YStack gap={8} marginTop={12} width="100%">
      <View
        height={chartHeight}
        width="100%"
        onLayout={(e) => {
          const w = e.nativeEvent.layout.width;
          if (w > 0) setChartWidth(w);
        }}
        style={{ position: 'relative', overflow: 'visible' }}
      >
        {/* Subtle Horizontal Grid Guides */}
        <View position="absolute" top={20} left={0} right={0} height={1} backgroundColor="rgba(255, 255, 255, 0.04)" />
        <View position="absolute" top={70} left={0} right={0} height={1} backgroundColor="rgba(255, 255, 255, 0.04)" />
        <View position="absolute" top={120} left={0} right={0} height={1} backgroundColor="rgba(255, 255, 255, 0.04)" />

        {/* Draw Area Fill Stems */}
        {points.map((pt, idx) => (
          <View
            key={`area-${idx}`}
            style={{
              position: 'absolute',
              left: pt.x,
              top: pt.y,
              width: 1,
              height: chartHeight - pt.y - 10,
              backgroundColor: color,
              opacity: activeIndex === idx ? 0.4 : 0.12,
            }}
          />
        ))}

        {/* Draw Line Segments */}
        {points.map((pt, idx) => {
          if (idx === points.length - 1) return null;
          const nextPt = points[idx + 1];
          const dx = nextPt.x - pt.x;
          const dy = nextPt.y - pt.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const angle = Math.atan2(dy, dx);

          return (
            <View
              key={`seg-${idx}`}
              style={{
                position: 'absolute',
                left: pt.x + dx / 2 - dist / 2,
                top: pt.y + dy / 2 - 1.25,
                width: dist,
                height: 2.5,
                backgroundColor: color,
                transform: [{ rotate: `${angle}rad` }],
                opacity: activeIndex === null || activeIndex === idx || activeIndex === idx + 1 ? 1 : 0.4,
              }}
            />
          );
        })}

        {/* Live Active End Point Node */}
        {activeIndex === null && lastPoint && (
          <View
            style={{
              position: 'absolute',
              left: lastPoint.x - 7,
              top: lastPoint.y - 7,
              width: 14,
              height: 14,
              borderRadius: 7,
              backgroundColor: `${color}33`,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <View
              style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: color,
              }}
            />
          </View>
        )}

        {/* Vertical scrubbing indicator line */}
        {activeIndex !== null && points[activeIndex] && (
          <View
            style={{
              position: 'absolute',
              left: points[activeIndex].x,
              top: 0,
              bottom: 10,
              width: 1,
              backgroundColor: 'rgba(255, 255, 255, 0.4)',
            }}
          />
        )}

        {/* Active glowing scrubbing dot */}
        {activeIndex !== null && points[activeIndex] && (
          <View
            style={{
              position: 'absolute',
              left: points[activeIndex].x - 7,
              top: points[activeIndex].y - 7,
              width: 14,
              height: 14,
              borderRadius: 7,
              backgroundColor: color,
              borderWidth: 2,
              borderColor: '#FFFFFF',
              shadowColor: color,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.9,
              shadowRadius: 8,
              elevation: 6,
            }}
          />
        )}

        {/* Overlay touch zones for interactive scrubbing */}
        <XStack style={{ ...StyleSheet.absoluteFill }} justifyContent="space-between">
          {points.map((pt, idx) => (
            <TouchableOpacity
              key={`zone-${idx}`}
              onPressIn={() => {
                setActiveIndex(idx);
                onChangePrice(pt.val);
              }}
              onPressOut={() => {
                setActiveIndex(null);
                onChangePrice(null);
              }}
              activeOpacity={1}
              style={{
                width: `${100 / data.length}%`,
                height: '100%',
              }}
            />
          ))}
        </XStack>
      </View>

      <YStack alignItems="center" gap={4} marginTop={4} width="100%">
        <Text color={theme.textSecondary} opacity={0.7} fontSize={12} style={{ fontFamily: "Inter_500Medium" }} textAlign="center">
          💡 Tap & drag the line to see price history
        </Text>
        <XStack justifyContent="space-between" width="100%" paddingHorizontal={4}>
          <Text color={theme.textSecondary} fontSize={10} style={{ fontFamily: "Inter_700Bold" }} opacity={0.6}>TIMELINE START</Text>
          <Text color={theme.textSecondary} fontSize={10} style={{ fontFamily: "Inter_700Bold" }} opacity={0.6}>LIVE NOW</Text>
        </XStack>
      </YStack>
    </YStack>
  );
}
