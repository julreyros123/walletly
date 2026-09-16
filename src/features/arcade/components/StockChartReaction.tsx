import React, { useEffect } from 'react';
import { StyleSheet, View, Text as RNText, TouchableOpacity } from 'react-native';
import { YStack, XStack, Text as TamaguiText } from 'tamagui';
import { StockHeadline } from '@/constants/gameHeadlines';
import { Fonts } from '@/constants/theme';
import { PhosphorIcon } from '@/components/ui/PhosphorIcon';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { safeHaptic } from '@/utils/haptics';
import { CelebrationFX } from '@/features/arcade/components/CelebrationFX';
import { GameMascotReaction, MascotEmotion } from '@/features/arcade/components/GameMascotReaction';
import { soundFX } from '@/utils/soundEffects';

const Text = (props: any) => <TamaguiText {...props} />;

interface StockChartReactionProps {
  headline: StockHeadline;
  userAction: 'BUY' | 'SELL';
  comboStreak?: number;
  onNext: () => void;
}

export function StockChartReaction({ headline, userAction, comboStreak = 0, onNext }: StockChartReactionProps) {
  const isCorrect = userAction === headline.correctAction;
  const isSurge = headline.actualImpact > 0;
  
  const multiplier = comboStreak >= 3 ? 2 : comboStreak === 2 ? 1.5 : 1;
  const baseProfit = Math.round(headline.virtualBaseBet * (Math.abs(headline.actualImpact) / 100));
  const profitAmount = isCorrect
    ? Math.round(baseProfit * multiplier)
    : -Math.round(headline.virtualBaseBet * 0.1);

  const mascotEmotion: MascotEmotion = isCorrect
    ? comboStreak >= 3
      ? 'combo'
      : 'happy'
    : 'sad';

  useEffect(() => {
    if (isCorrect) {
      if (comboStreak >= 3) {
        soundFX.playCombo();
      } else {
        soundFX.playCorrect();
      }
    } else {
      soundFX.playWrong();
    }
  }, [isCorrect, comboStreak]);

  return (
    <View style={styles.container}>
      {/* Celebration FX if correct */}
      {isCorrect && <CelebrationFX />}

      {/* Mascot Live Animated Reaction */}
      <View style={styles.mascotWrapper}>
        <GameMascotReaction emotion={mascotEmotion} size={76} />
      </View>

      {/* Outcome Banner */}
      <YStack alignItems="center" gap={6} marginBottom={14}>
        <XStack gap={8} alignItems="center">
          <View style={[styles.statusBadge, { backgroundColor: isCorrect ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)' }]}>
            <Text color={isCorrect ? '#10B981' : '#EF4444'} fontSize={12.5} fontFamily={Fonts.bold}>
              {isCorrect ? '🎯 ACCURATE PREDICTION!' : '❌ MARKET REVERSED!'}
            </Text>
          </View>

          {isCorrect && comboStreak >= 2 && (
            <View style={styles.multiplierBadge}>
              <Text color="#FFB703" fontSize={11} fontFamily={Fonts.bold}>
                ⚡ {multiplier}x XP COMBO
              </Text>
            </View>
          )}
        </XStack>

        <Text color="#FFFFFF" fontSize={24} fontFamily={Fonts.bold}>
          {isSurge ? `+${headline.actualImpact}% SURGE` : `${headline.actualImpact}% DROP`}
        </Text>

        <Text color={profitAmount >= 0 ? '#10B981' : '#EF4444'} fontSize={17} fontFamily={Fonts.bold}>
          {profitAmount >= 0 ? `+₱${profitAmount} Virtual Profit` : `-₱${Math.abs(profitAmount)} Loss`}
        </Text>
      </YStack>

      {/* Mini Visual Candlestick Wave SVG */}
      <View style={styles.chartBox}>
        <Svg width="100%" height={90} viewBox="0 0 280 90">
          <Defs>
            <LinearGradient id="chartGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor={isSurge ? '#10B981' : '#EF4444'} stopOpacity={0.4} />
              <Stop offset="100%" stopColor={isSurge ? '#10B981' : '#EF4444'} stopOpacity={0} />
            </LinearGradient>
          </Defs>
          {isSurge ? (
            <>
              <Path
                d="M 10 70 Q 70 65, 130 40 T 260 15 L 260 90 L 10 90 Z"
                fill="url(#chartGrad)"
              />
              <Path
                d="M 10 70 Q 70 65, 130 40 T 260 15"
                fill="none"
                stroke="#10B981"
                strokeWidth={3.5}
                strokeLinecap="round"
              />
            </>
          ) : (
            <>
              <Path
                d="M 10 20 Q 70 30, 130 55 T 260 80 L 260 90 L 10 90 Z"
                fill="url(#chartGrad)"
              />
              <Path
                d="M 10 20 Q 70 30, 130 55 T 260 80"
                fill="none"
                stroke="#EF4444"
                strokeWidth={3.5}
                strokeLinecap="round"
              />
            </>
          )}
        </Svg>
      </View>

      {/* Educational Insight Card */}
      <View style={styles.insightCard}>
        <XStack alignItems="center" gap={6} marginBottom={6}>
          <PhosphorIcon name="Lightbulb" size={15} color="#FBBF24" weight="fill" />
          <Text color="#FBBF24" fontSize={12} fontFamily={Fonts.bold} letterSpacing={0.5}>
            MARKET TAKEAWAY
          </Text>
        </XStack>
        <Text color="#E2E8F0" fontSize={13} fontFamily={Fonts.medium} lineHeight={19}>
          {headline.explanation}
        </Text>
      </View>

      {/* Next Button */}
      <TouchableOpacity onPress={onNext} style={styles.nextBtn} activeOpacity={0.85}>
        <Text color="#FFFFFF" fontSize={15} fontFamily={Fonts.bold}>
          Next Headline ➔
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: '#131D31',
    borderRadius: 24,
    padding: 22,
    borderWidth: 1.5,
    borderColor: '#1E293B',
    alignItems: 'center',
  },
  mascotWrapper: {
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
  },
  multiplierBadge: {
    backgroundColor: 'rgba(255, 183, 3, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  chartBox: {
    width: '100%',
    height: 95,
    backgroundColor: '#0F172A',
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  insightCard: {
    width: '100%',
    backgroundColor: '#0F172A',
    borderRadius: 14,
    padding: 14,
    marginBottom: 18,
    borderLeftWidth: 3.5,
    borderLeftColor: '#FBBF24',
  },
  nextBtn: {
    width: '100%',
    backgroundColor: '#10B981',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
