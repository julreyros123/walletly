import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { YStack, XStack, Text as TamaguiText } from 'tamagui';
import { Fonts } from '@/constants/theme';
import { useRouter } from 'expo-router';
import { CelebrationFX } from '@/features/arcade/components/CelebrationFX';
import { useCurrency } from '@/utils/currency';

const Text = (props: any) => <TamaguiText {...props} />;

interface GameRoundSummaryProps {
  score: number;
  totalQuestions: number;
  totalProfit: number;
  xpEarned: number;
  onPlayAgain: () => void;
}

export function GameRoundSummary({
  score,
  totalQuestions,
  totalProfit,
  xpEarned,
  onPlayAgain,
}: GameRoundSummaryProps) {
  const router = useRouter();
  const { symbol: currencySymbol } = useCurrency();
  const accuracy = Math.round((score / totalQuestions) * 100);

  const getRankBadge = () => {
    if (accuracy >= 80) return { title: '🏆 Alpha Market Guru', color: '#FBBF24' };
    if (accuracy >= 60) return { title: '📈 Sharp Momentum Trader', color: '#10B981' };
    return { title: '🌱 Learning Investor', color: '#38BDF8' };
  };

  const rank = getRankBadge();

  return (
    <View style={styles.container}>
      <CelebrationFX />

      <YStack alignItems="center" gap={8} marginBottom={18}>
        <View style={[styles.rankPill, { backgroundColor: `${rank.color}20` }]}>
          <Text color={rank.color} fontSize={13} fontFamily={Fonts.bold}>
            {rank.title}
          </Text>
        </View>

        <Text color="#FFFFFF" fontSize={28} fontFamily={Fonts.bold} textAlign="center">
          Round Completed!
        </Text>

        <Text color="#94A3B8" fontSize={13} fontFamily={Fonts.medium}>
          You correctly predicted {score} out of {totalQuestions} stock swings
        </Text>
      </YStack>

      {/* 3-Stat Metric Cards */}
      <XStack gap={10} width="100%" marginBottom={20}>
        {/* Accuracy */}
        <View style={styles.metricCard}>
          <Text color="#94A3B8" fontSize={10.5} fontFamily={Fonts.bold}>
            ACCURACY
          </Text>
          <Text color="#FFFFFF" fontSize={19} fontFamily={Fonts.bold}>
            {accuracy}%
          </Text>
        </View>

        {/* Profit */}
        <View style={styles.metricCard}>
          <Text color="#94A3B8" fontSize={10.5} fontFamily={Fonts.bold}>
            NET PROFIT
          </Text>
          <Text color={totalProfit >= 0 ? '#10B981' : '#EF4444'} fontSize={19} fontFamily={Fonts.bold}>
            {totalProfit >= 0 ? `+${currencySymbol}${totalProfit}` : `-${currencySymbol}${Math.abs(totalProfit)}`}
          </Text>
        </View>

        {/* XP */}
        <View style={styles.metricCard}>
          <Text color="#94A3B8" fontSize={10.5} fontFamily={Fonts.bold}>
            XP EARNED
          </Text>
          <Text color="#FBBF24" fontSize={19} fontFamily={Fonts.bold}>
            +{xpEarned} XP
          </Text>
        </View>
      </XStack>

      {/* Action Buttons */}
      <YStack gap={10} width="100%">
        <TouchableOpacity onPress={onPlayAgain} style={styles.playAgainBtn} activeOpacity={0.85}>
          <Text color="#FFFFFF" fontSize={15} fontFamily={Fonts.bold}>
            🎮 Play Another Round
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()} style={styles.exitBtn} activeOpacity={0.85}>
          <Text color="#94A3B8" fontSize={14} fontFamily={Fonts.bold}>
            Back to Portfolio
          </Text>
        </TouchableOpacity>
      </YStack>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: '#131D31',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1.5,
    borderColor: '#1E293B',
    alignItems: 'center',
  },
  rankPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 10,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#0F172A',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  playAgainBtn: {
    width: '100%',
    backgroundColor: '#10B981',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exitBtn: {
    width: '100%',
    backgroundColor: '#0F172A',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#1E293B',
  },
});
