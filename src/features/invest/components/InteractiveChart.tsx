import React, { useState, useMemo } from 'react';
import { StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { YStack, XStack, Text as TamaguiText, View } from 'tamagui';
const Text = (props: any) => <TamaguiText {...props} />;
import Svg, { Path, Defs, LinearGradient, Stop, Line, Circle } from 'react-native-svg';
import { Fonts } from '@/constants/theme';
import { useCurrency } from '@/utils/currency';
import { safeHaptic } from '@/utils/haptics';

interface InteractiveChartProps {
  data: number[];
  color: string;
  onChangePrice: (val: number | null) => void;
  theme: any;
}

// Catmull-Rom spline converted to cubic bezier curves
function generateBezierPaths(pts: { x: number; y: number }[], height: number) {
  if (!pts || pts.length === 0) return { linePath: '', areaPath: '' };
  if (pts.length === 1) {
    return { linePath: `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`, areaPath: '' };
  }

  let linePath = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;

  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(i - 1, 0)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(i + 2, pts.length - 1)];

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    linePath += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }

  const firstPt = pts[0];
  const lastPt = pts[pts.length - 1];
  const areaPath = `${linePath} L ${lastPt.x.toFixed(1)} ${height} L ${firstPt.x.toFixed(1)} ${height} Z`;

  return { linePath, areaPath };
}

export function InteractiveChart({
  data,
  color,
  onChangePrice,
  theme,
}: InteractiveChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [chartWidth, setChartWidth] = useState(320);
  const { symbol: currencySymbol } = useCurrency();

  const chartHeight = 220; // Expanded height for high readability

  const { points, linePath, areaPath, min, max } = useMemo(() => {
    if (!data || data.length === 0) {
      return { points: [], linePath: '', areaPath: '', min: 0, max: 0 };
    }

    const rawMax = Math.max(...data);
    const rawMin = Math.min(...data);
    const padding = (rawMax - rawMin) * 0.12 || rawMax * 0.05 || 1;
    const maxVal = rawMax + padding;
    const minVal = Math.max(0, rawMin - padding);
    const range = maxVal - minVal || 1;

    const topInset = 20;
    const bottomInset = 24;
    const usableHeight = chartHeight - topInset - bottomInset;

    const pts = data.map((val, idx) => {
      const x = (idx / Math.max(1, data.length - 1)) * (chartWidth - 20) + 10;
      const y = topInset + usableHeight - ((val - minVal) / range) * usableHeight;
      return { x, y, val };
    });

    const { linePath: lp, areaPath: ap } = generateBezierPaths(pts, chartHeight);

    return {
      points: pts,
      linePath: lp,
      areaPath: ap,
      min: rawMin,
      max: rawMax,
    };
  }, [data, chartWidth, chartHeight]);

  const lastPoint = points.length > 0 ? points[points.length - 1] : null;
  const activePoint = activeIndex !== null && points[activeIndex] ? points[activeIndex] : null;

  const gradId = `chartGrad-${color.replace(/[^a-zA-Z0-9]/g, '')}`;

  return (
    <YStack gap={10} marginTop={8} width="100%">
      <View
        height={chartHeight}
        width="100%"
        onLayout={(e) => {
          const w = e.nativeEvent.layout.width;
          if (w > 0) setChartWidth(w);
        }}
        style={styles.chartWrapper}
      >
        <Svg width={chartWidth} height={chartHeight} style={StyleSheet.absoluteFill}>
          <Defs>
            <LinearGradient id={gradId} x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor={color} stopOpacity={0.35} />
              <Stop offset="65%" stopColor={color} stopOpacity={0.08} />
              <Stop offset="100%" stopColor={color} stopOpacity={0.0} />
            </LinearGradient>
          </Defs>

          {/* Reference Horizontal Gridlines */}
          <Line
            x1="10"
            y1={chartHeight * 0.25}
            x2={chartWidth - 10}
            y2={chartHeight * 0.25}
            stroke={theme.border || 'rgba(150, 150, 150, 0.1)'}
            strokeDasharray="4 4"
            strokeWidth={1}
          />
          <Line
            x1="10"
            y1={chartHeight * 0.5}
            x2={chartWidth - 10}
            y2={chartHeight * 0.5}
            stroke={theme.border || 'rgba(150, 150, 150, 0.1)'}
            strokeDasharray="4 4"
            strokeWidth={1}
          />
          <Line
            x1="10"
            y1={chartHeight * 0.75}
            x2={chartWidth - 10}
            y2={chartHeight * 0.75}
            stroke={theme.border || 'rgba(150, 150, 150, 0.1)'}
            strokeDasharray="4 4"
            strokeWidth={1}
          />

          {/* Glowing Area Fill */}
          {areaPath ? <Path d={areaPath} fill={`url(#${gradId})`} /> : null}

          {/* Smooth Curved Line Path */}
          {linePath ? (
            <Path
              d={linePath}
              stroke={color}
              strokeWidth={3}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ) : null}

          {/* Inactive Latest Live Point */}
          {activeIndex === null && lastPoint && (
            <>
              <Circle
                cx={lastPoint.x}
                cy={lastPoint.y}
                r={10}
                fill={color}
                fillOpacity={0.2}
              />
              <Circle
                cx={lastPoint.x}
                cy={lastPoint.y}
                r={4.5}
                fill={color}
                stroke={theme.surface || '#FFFFFF'}
                strokeWidth={1.5}
              />
            </>
          )}

          {/* Active Vertical Scrubber Line & Dot */}
          {activePoint && (
            <>
              <Line
                x1={activePoint.x}
                y1={10}
                x2={activePoint.x}
                y2={chartHeight - 8}
                stroke={theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.45)' : 'rgba(0, 0, 0, 0.3)'}
                strokeDasharray="3 3"
                strokeWidth={1.5}
              />
              <Circle
                cx={activePoint.x}
                cy={activePoint.y}
                r={12}
                fill={color}
                fillOpacity={0.3}
              />
              <Circle
                cx={activePoint.x}
                cy={activePoint.y}
                r={5.5}
                fill={color}
                stroke={theme.surface || '#FFFFFF'}
                strokeWidth={2}
              />
            </>
          )}
        </Svg>

        {/* Floating Tooltip Pill for Active Scrubber */}
        {activePoint && (
          <View
            style={[
              styles.floatingTooltip,
              {
                left: Math.max(12, Math.min(chartWidth - 90, activePoint.x - 45)),
                top: Math.max(6, activePoint.y - 42),
                backgroundColor: theme.mode === 'dark' ? '#0F172A' : '#FFFFFF',
                borderColor: color,
              },
            ]}
          >
            <Text color={theme.text} fontSize={12} fontFamily={Fonts.bold}>
              {currencySymbol}{activePoint.val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
          </View>
        )}

        {/* Interactive Scrubbing Touch Overlay Zones */}
        <XStack style={StyleSheet.absoluteFill} justifyContent="space-between">
          {points.map((pt, idx) => (
            <TouchableOpacity
              key={`zone-${idx}`}
              onPressIn={() => {
                safeHaptic('light');
                setActiveIndex(idx);
                onChangePrice(pt.val);
              }}
              onPressOut={() => {
                setActiveIndex(null);
                onChangePrice(null);
              }}
              activeOpacity={1}
              style={{
                width: `${100 / Math.max(1, points.length)}%`,
                height: '100%',
              }}
            />
          ))}
        </XStack>
      </View>

      {/* High/Low Markers and Timeline Helper */}
      <YStack gap={6} width="100%" marginTop={4}>
        <XStack justifyContent="space-between" width="100%" paddingHorizontal={4} alignItems="center">
          <Text color={theme.textSecondary} fontSize={10} fontFamily={Fonts.bold} opacity={0.65}>
            LOW: {currencySymbol}{min.toLocaleString()}
          </Text>
          <Text color={theme.textSecondary} opacity={0.7} fontSize={10} fontFamily={Fonts.medium} textAlign="center" flex={1} numberOfLines={1} paddingHorizontal={6}>
            💡 Touch & drag to scrub
          </Text>
          <Text color={theme.textSecondary} fontSize={10} fontFamily={Fonts.bold} opacity={0.65}>
            HIGH: {currencySymbol}{max.toLocaleString()}
          </Text>
        </XStack>

        <XStack justifyContent="space-between" width="100%" paddingHorizontal={4} alignItems="center">
          <Text color={theme.textSecondary} fontSize={10} fontFamily={Fonts.bold} opacity={0.5}>
            PAST TIMEFRAME
          </Text>
          <XStack alignItems="center" gap={5}>
            <View width={6} height={6} borderRadius={3} backgroundColor="#10B981" />
            <Text color="#10B981" fontSize={10} fontFamily={Fonts.bold}>
              LIVE REAL-TIME
            </Text>
          </XStack>
        </XStack>
      </YStack>
    </YStack>
  );
}

const styles = StyleSheet.create({
  chartWrapper: {
    position: 'relative',
    overflow: 'visible',
    borderRadius: 16,
  },
  floatingTooltip: {
    position: 'absolute',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.25,
        shadowRadius: 5,
      },
      android: {
        elevation: 6,
      },
    }),
  },
});
