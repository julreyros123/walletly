import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { YStack, XStack, Text as TamaguiText } from 'tamagui';
import { useRouter } from 'expo-router';
import { Fonts } from '@/constants/theme';
import { BackgroundSystem } from '@/components/ui/BackgroundSystem';
import { PhosphorIcon } from '@/components/ui/PhosphorIcon';
import { MotionIcon } from '@/components/ui/MotionIcon';
import { getRandomHeadlineRound, StockHeadline } from '@/constants/gameHeadlines';
import { HeadlineCard } from '@/features/arcade/components/HeadlineCard';
import { StockChartReaction } from '@/features/arcade/components/StockChartReaction';
import { GameRoundSummary } from '@/features/arcade/components/GameRoundSummary';
import { useGamificationStore } from '@/store/gamificationStore';
import { soundFX } from '@/utils/soundEffects';
import { safeHaptic } from '@/utils/haptics';

const Text = (props: any) => <TamaguiText {...props} />;
const ROUND_SIZE = 5;

export default function HeadlineTraderScreen() {
  const router = useRouter();
  const store = useGamificationStore();

  const [deck, setDeck] = useState<StockHeadline[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [gameState, setGameState] = useState<'playing' | 'reaction' | 'summary'>('playing');
  const [lastUserAction, setLastUserAction] = useState<'BUY' | 'SELL'>('BUY');

  // Round stats
  const [score, setScore] = useState(0);
  const [totalProfit, setTotalProfit] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [showRulesModal, setShowRulesModal] = useState(false);

  useEffect(() => {
    startNewGame();
  }, []);

  const startNewGame = () => {
    setDeck(getRandomHeadlineRound(ROUND_SIZE));
    setCurrentIndex(0);
    setScore(0);
    setTotalProfit(0);
    setCurrentStreak(0);
    setGameState('playing');
  };

  const handleUserSwipe = (action: 'BUY' | 'SELL') => {
    const currentCard = deck[currentIndex];
    if (!currentCard) return;

    setLastUserAction(action);
    const isCorrect = action === currentCard.correctAction;
    const newStreak = isCorrect ? currentStreak + 1 : 0;
    setCurrentStreak(newStreak);

    const multiplier = newStreak >= 3 ? 2 : newStreak === 2 ? 1.5 : 1;
    const baseProfit = Math.round(currentCard.virtualBaseBet * (Math.abs(currentCard.actualImpact) / 100));
    const roundProfit = isCorrect
      ? Math.round(baseProfit * multiplier)
      : -Math.round(currentCard.virtualBaseBet * 0.1);

    if (isCorrect) {
      setScore((s) => s + 1);
    }

    setTotalProfit((p) => p + roundProfit);
    setGameState('reaction');
  };

  const handleNextCard = () => {
    if (currentIndex + 1 >= deck.length) {
      // Game Round Finished with combo bonuses
      const baseXP = score * 30;
      const perfectBonus = score === ROUND_SIZE ? 60 : 0;
      const streakBonus = currentStreak >= 3 ? 40 : 0;
      const xpEarned = baseXP + perfectBonus + streakBonus;

      store.creditGameReward(xpEarned, Math.max(0, totalProfit));
      if (score === ROUND_SIZE) {
        store.unlockAchievement('alpha_guru');
      }
      if (currentStreak >= 3) {
        store.unlockAchievement('streak_champion');
      }

      soundFX.playRoundComplete();
      setGameState('summary');
    } else {
      setCurrentIndex((i) => i + 1);
      setGameState('playing');
    }
  };

  const currentCard = deck[currentIndex];
  const progressRatio = deck.length > 0 ? (currentIndex + 1) / deck.length : 0;

  return (
    <View style={styles.container}>
      <BackgroundSystem />
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
        {/* Header Bar */}
        <XStack justifyContent="space-between" alignItems="center" paddingHorizontal={18} paddingTop={10} paddingBottom={14}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.closeBtn}
            activeOpacity={0.7}
          >
            <PhosphorIcon name="X" size={18} color="#94A3B8" />
          </TouchableOpacity>

          {/* Progress Tracker */}
          <YStack alignItems="center" gap={4}>
            <Text color="#FFFFFF" fontSize={14} fontFamily={Fonts.bold}>
              Headline Trader
            </Text>
            <Text color="#94A3B8" fontSize={11} fontFamily={Fonts.medium}>
              Card {currentIndex + 1} of {ROUND_SIZE}
            </Text>
          </YStack>

          <XStack alignItems="center" gap={8}>
            {/* Rules Button */}
            <TouchableOpacity
              onPress={() => {
                safeHaptic('light');
                setShowRulesModal(true);
              }}
              style={styles.closeBtn}
              activeOpacity={0.7}
            >
              <PhosphorIcon name="Question" size={18} color="#38BDF8" weight="fill" />
            </TouchableOpacity>

            {/* Streak Combo Pill */}
            <XStack alignItems="center" gap={4} style={[styles.comboPill, currentStreak >= 3 && styles.comboPillFire]}>
              <MotionIcon name="flame" size={14} autoPlay={true} loop={true} color={currentStreak >= 3 ? '#FFB703' : '#94A3B8'} />
              <Text color={currentStreak >= 3 ? '#FFB703' : '#94A3B8'} fontSize={12} fontFamily={Fonts.bold}>
                {currentStreak}
              </Text>
            </XStack>
          </XStack>
        </XStack>

        {/* Progress Bar Line */}
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${progressRatio * 100}%` }]} />
        </View>

        {/* Main Game Stage */}
        <View style={styles.stage}>
          {gameState === 'playing' && currentCard && (
            <YStack alignItems="center" justifyContent="center" gap={18} flex={1}>
              <HeadlineCard
                headline={currentCard}
                onSwipe={handleUserSwipe}
                isCurrent={true}
              />

              {/* Bottom Quick-Tap Accessibility Action Buttons */}
              <XStack gap={14} width="100%" paddingHorizontal={18}>
                <TouchableOpacity
                  onPress={() => {
                    soundFX.playSwipe();
                    handleUserSwipe('SELL');
                  }}
                  style={styles.sellActionBtn}
                  activeOpacity={0.8}
                >
                  <XStack alignItems="center" justifyContent="center" gap={8}>
                    <PhosphorIcon name="TrendDown" size={18} color="#EF4444" weight="bold" />
                    <Text color="#EF4444" fontSize={15} fontFamily={Fonts.bold}>
                      SHORT / SELL
                    </Text>
                  </XStack>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    soundFX.playSwipe();
                    handleUserSwipe('BUY');
                  }}
                  style={styles.buyActionBtn}
                  activeOpacity={0.8}
                >
                  <XStack alignItems="center" justifyContent="center" gap={8}>
                    <PhosphorIcon name="TrendUp" size={18} color="#10B981" weight="bold" />
                    <Text color="#10B981" fontSize={15} fontFamily={Fonts.bold}>
                      BUY STOCK
                    </Text>
                  </XStack>
                </TouchableOpacity>
              </XStack>
            </YStack>
          )}

          {gameState === 'reaction' && currentCard && (
            <View style={styles.reactionWrapper}>
              <StockChartReaction
                headline={currentCard}
                userAction={lastUserAction}
                comboStreak={currentStreak}
                onNext={handleNextCard}
              />
            </View>
          )}

          {gameState === 'summary' && (
            <View style={styles.summaryWrapper}>
              <GameRoundSummary
                score={score}
                totalQuestions={ROUND_SIZE}
                totalProfit={totalProfit}
                xpEarned={score * 30 + (score === ROUND_SIZE ? 60 : 0) + (currentStreak >= 3 ? 40 : 0)}
                onPlayAgain={startNewGame}
              />
            </View>
          )}
        </View>
      </SafeAreaView>

      {/* ==================== HOW TO PLAY / RULES MODAL ==================== */}
      <Modal
        visible={showRulesModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRulesModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.rulesCard}>
            <XStack justifyContent="space-between" alignItems="center" marginBottom={14}>
              <XStack alignItems="center" gap={8}>
                <Text fontSize={20}>📰</Text>
                <Text color="#FFFFFF" fontSize={18} fontFamily={Fonts.bold}>
                  Headline Trader Rules
                </Text>
              </XStack>
              <TouchableOpacity
                onPress={() => setShowRulesModal(false)}
                style={styles.modalCloseBtn}
                activeOpacity={0.7}
              >
                <PhosphorIcon name="X" size={16} color="#94A3B8" />
              </TouchableOpacity>
            </XStack>

            <YStack gap={12}>
              {/* Step 1 */}
              <XStack gap={10} alignItems="flex-start">
                <View style={styles.stepNum}>
                  <Text color="#10B981" fontSize={12} fontFamily={Fonts.bold}>1</Text>
                </View>
                <YStack flex={1}>
                  <Text color="#FFFFFF" fontSize={13.5} fontFamily={Fonts.bold}>
                    Read Breaking News
                  </Text>
                  <Text color="#94A3B8" fontSize={12} fontFamily={Fonts.medium} lineHeight={17}>
                    Inspect brand announcements, viral K-Pop collabs, product delays, and scandals.
                  </Text>
                </YStack>
              </XStack>

              {/* Step 2 */}
              <XStack gap={10} alignItems="flex-start">
                <View style={styles.stepNum}>
                  <Text color="#10B981" fontSize={12} fontFamily={Fonts.bold}>2</Text>
                </View>
                <YStack flex={1}>
                  <Text color="#FFFFFF" fontSize={13.5} fontFamily={Fonts.bold}>
                    Swipe to Trade
                  </Text>
                  <Text color="#94A3B8" fontSize={12} fontFamily={Fonts.medium} lineHeight={17}>
                    Swipe <Text color="#10B981" fontFamily={Fonts.bold}>RIGHT to BUY 📈</Text> if good news, or <Text color="#EF4444" fontFamily={Fonts.bold}>LEFT to SELL 📉</Text> if bad news.
                  </Text>
                </YStack>
              </XStack>

              {/* Step 3 */}
              <XStack gap={10} alignItems="flex-start">
                <View style={styles.stepNum}>
                  <Text color="#10B981" fontSize={12} fontFamily={Fonts.bold}>3</Text>
                </View>
                <YStack flex={1}>
                  <Text color="#FFFFFF" fontSize={13.5} fontFamily={Fonts.bold}>
                    Build Fire Streaks (2x XP)
                  </Text>
                  <Text color="#94A3B8" fontSize={12} fontFamily={Fonts.medium} lineHeight={17}>
                    Chain consecutive correct calls to trigger 1.5x - 2x combo multipliers and earn big XP!
                  </Text>
                </YStack>
              </XStack>

              <TouchableOpacity
                onPress={() => setShowRulesModal(false)}
                style={styles.gotItBtn}
                activeOpacity={0.85}
              >
                <Text color="#FFFFFF" fontSize={14} fontFamily={Fonts.bold}>
                  Got It, Let's Play!
                </Text>
              </TouchableOpacity>
            </YStack>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0F1D',
  },
  safeArea: {
    flex: 1,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#131D31',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  comboPill: {
    backgroundColor: 'rgba(255, 183, 3, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 183, 3, 0.25)',
  },
  comboPillFire: {
    backgroundColor: 'rgba(255, 183, 3, 0.25)',
    borderColor: '#FFB703',
  },
  progressBarBg: {
    width: '100%',
    height: 4,
    backgroundColor: '#1E293B',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#10B981',
  },
  stage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  reactionWrapper: {
    width: '100%',
    maxWidth: 380,
  },
  summaryWrapper: {
    width: '100%',
    maxWidth: 380,
  },
  sellActionBtn: {
    flex: 1,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1.5,
    borderColor: '#EF4444',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buyActionBtn: {
    flex: 1,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1.5,
    borderColor: '#10B981',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  rulesCard: {
    width: '100%',
    backgroundColor: '#131D31',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1.5,
    borderColor: '#1E293B',
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNum: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  gotItBtn: {
    backgroundColor: '#10B981',
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
});
