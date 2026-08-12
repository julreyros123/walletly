import React from 'react';
import { Platform, StyleSheet, View, ViewStyle } from 'react-native';

export type CbudgetAnimationMode = 'none' | 'bar-growth' | 'draw' | 'floating-dot' | 'fade-in' | 'startup';

export interface CbudgetLogoSVGProps {
  size?: number;
  showText?: boolean;
  animationMode?: CbudgetAnimationMode;
  primaryColor?: string;
  secondaryColor?: string;
  textColor?: string;
  backgroundColor?: string;
  showBackgroundCard?: boolean;
  style?: ViewStyle;
}

export function CbudgetLogoSVG({
  size = 220,
  showText = true,
  animationMode = 'none',
  primaryColor = '#2ECC71',
  secondaryColor = '#FFFFFF',
  textColor = '#FFFFFF',
  backgroundColor = '#0A2540',
  showBackgroundCard = false,
  style,
}: CbudgetLogoSVGProps) {
  const isWeb = Platform.OS === 'web';

  const viewBoxWidth = 360;
  const viewBoxHeight = showText ? 400 : 310;
  const aspectRatio = viewBoxWidth / viewBoxHeight;
  const computedHeight = size / aspectRatio;

  const isStartup = animationMode === 'startup';
  const isBarGrowth = animationMode === 'bar-growth';
  const isDraw = animationMode === 'draw';
  const isFloatingDot = animationMode === 'floating-dot';

  if (isWeb) {
    return (
      <View style={[{ width: size, height: computedHeight, alignItems: 'center', justifyContent: 'center' }, style]}>
        <style dangerouslySetInnerHTML={{ __html: inlineKeyframesCSS }} />
        <svg
          width={size}
          height={computedHeight}
          viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={
            isStartup
              ? 'cbudget-anim-startup'
              : isBarGrowth
              ? 'cbudget-anim-bar-growth'
              : isDraw
              ? 'cbudget-anim-draw'
              : isFloatingDot
              ? 'cbudget-anim-floating-dot'
              : ''
          }
          style={{ overflow: 'visible' }}
        >
          {/* Optional Card Background */}
          {showBackgroundCard && (
            <rect
              x="10"
              y="10"
              width={viewBoxWidth - 20}
              height={viewBoxHeight - 20}
              rx="44"
              fill={backgroundColor}
            />
          )}

          {/* Outer Green "C" Arc */}
          <path
            className="cbudget-outer-c"
            d="M 235 88 A 95 95 0 1 0 242 225"
            stroke={primaryColor}
            strokeWidth="24"
            strokeLinecap="round"
            fill="none"
          />

          {/* Inner White "C" Arc */}
          <path
            className="cbudget-inner-c"
            d="M 218 112 A 66 66 0 1 0 223 208"
            stroke={secondaryColor}
            strokeWidth="16"
            strokeLinecap="round"
            fill="none"
          />

          {/* Three Ascending Green Bars */}
          <g className="cbudget-bar-group">
            {/* Bar 1 (Smallest) */}
            <rect
              className="cbudget-bar cbudget-bar-1"
              x="126"
              y="172"
              width="18"
              height="36"
              rx="5"
              fill={primaryColor}
              style={{ transformOrigin: '135px 208px' }}
            />
            {/* Bar 2 (Medium) */}
            <rect
              className="cbudget-bar cbudget-bar-2"
              x="152"
              y="142"
              width="18"
              height="66"
              rx="5"
              fill={primaryColor}
              style={{ transformOrigin: '161px 208px' }}
            />
            {/* Bar 3 (Tallest) */}
            <rect
              className="cbudget-bar cbudget-bar-3"
              x="178"
              y="102"
              width="18"
              height="106"
              rx="5"
              fill={primaryColor}
              style={{ transformOrigin: '187px 208px' }}
            />
          </g>

          {/* Floating White Dot */}
          <circle
            className="cbudget-dot"
            cx="214"
            cy="72"
            r="16"
            fill={secondaryColor}
          />

          {/* Cbudget Text */}
          {showText && (
            <text
              className="cbudget-logo-text"
              x="180"
              y="340"
              textAnchor="middle"
              fill={textColor}
              fontSize="52"
              fontWeight="800"
              fontFamily="Inter, system-ui, -apple-system, sans-serif"
              letterSpacing="-0.5"
            >
              Cbudget
            </text>
          )}
        </svg>
      </View>
    );
  }

  // Native Fallback View
  return (
    <View style={[{ width: size, height: computedHeight, alignItems: 'center', justifyContent: 'center' }, style]}>
      <View style={styles.nativeContainer}>
        {showBackgroundCard && (
          <View style={[styles.cardBg, { backgroundColor, borderRadius: 44 }]} />
        )}
      </View>
    </View>
  );
}

const inlineKeyframesCSS = `
/* Keyframes for Cbudget Startup & Feature Animations */
@keyframes cbudgeDrawPath {
  0% { stroke-dashoffset: 800; }
  100% { stroke-dashoffset: 0; }
}

@keyframes cbudgeBarRise {
  0% { transform: scaleY(0); }
  100% { transform: scaleY(1); }
}

@keyframes cbudgeDotDrop {
  0% { opacity: 0; transform: translateY(-30px); }
  100% { opacity: 1; transform: translateY(0); }
}

@keyframes cbudgeTextFadeUp {
  0% { opacity: 0; transform: translateY(20px); }
  100% { opacity: 1; transform: translateY(0); }
}

@keyframes cbudgeBarGrow {
  0% { transform: scaleY(0.5); }
  100% { transform: scaleY(1.15); }
}

@keyframes cbudgeBounceDot {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

@keyframes cbudgeBgFade {
  0% { opacity: 0; }
  100% { opacity: 1; }
}

@keyframes cbudgeSplashExit {
  0% { opacity: 1; transform: scale(1); }
  99% { opacity: 0; transform: scale(1.04); }
  100% { opacity: 0; transform: scale(1.04); visibility: hidden; pointer-events: none; display: none; }
}

/* Startup Sequence Selector */
.cbudget-anim-startup .cbudget-outer-c {
  stroke-dasharray: 800;
  stroke-dashoffset: 800;
  animation: cbudgeDrawPath 1s cubic-bezier(0.4, 0, 0.2, 1) 0.4s forwards;
}

.cbudget-anim-startup .cbudget-inner-c {
  stroke-dasharray: 600;
  stroke-dashoffset: 600;
  animation: cbudgeDrawPath 0.8s cubic-bezier(0.4, 0, 0.2, 1) 1.1s forwards;
}

.cbudget-anim-startup .cbudget-bar-1 {
  transform-origin: 135px 208px;
  transform: scaleY(0);
  animation: cbudgeBarRise 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 1.6s forwards;
}

.cbudget-anim-startup .cbudget-bar-2 {
  transform-origin: 161px 208px;
  transform: scaleY(0);
  animation: cbudgeBarRise 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 1.8s forwards;
}

.cbudget-anim-startup .cbudget-bar-3 {
  transform-origin: 187px 208px;
  transform: scaleY(0);
  animation: cbudgeBarRise 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 2.0s forwards;
}

.cbudget-anim-startup .cbudget-dot {
  opacity: 0;
  transform: translateY(-30px);
  animation: cbudgeDotDrop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 2.3s forwards;
}

.cbudget-anim-startup .cbudget-logo-text {
  opacity: 0;
  transform: translateY(20px);
  animation: cbudgeTextFadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) 2.6s forwards;
}

/* Standalone Feature Animations */
.cbudget-anim-bar-growth .cbudget-bar-1 {
  animation: cbudgeBarGrow 1.2s ease-in-out infinite alternate;
}
.cbudget-anim-bar-growth .cbudget-bar-2 {
  animation: cbudgeBarGrow 1.2s ease-in-out 0.2s infinite alternate;
}
.cbudget-anim-bar-growth .cbudget-bar-3 {
  animation: cbudgeBarGrow 1.2s ease-in-out 0.4s infinite alternate;
}

.cbudget-anim-floating-dot .cbudget-dot {
  animation: cbudgeBounceDot 2s ease-in-out infinite;
}
`;

const styles = StyleSheet.create({
  nativeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  cardBg: {
    ...StyleSheet.absoluteFillObject,
  },
});
