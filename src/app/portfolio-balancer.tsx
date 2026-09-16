import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { YStack, XStack, Text as TamaguiText } from 'tamagui';
import { useRouter } from 'expo-router';
import { Fonts } from '@/constants/theme';
import { BackgroundSystem } from '@/components/ui/BackgroundSystem';
import { PhosphorIcon } from '@/components/ui/PhosphorIcon';
import { MotionIcon } from '@/components/ui/MotionIcon';
import { CelebrationFX } from '@/features/arcade/components/CelebrationFX';
import { useGamificationStore } from '@/store/gamificationStore';
import { soundFX } from '@/utils/soundEffects';
import { safeHaptic } from '@/utils/haptics';
import Svg, { Circle, G, Path, Line, Defs, LinearGradient, Stop } from 'react-native-svg';

const Text = (props: any) => <TamaguiText {...props} />;
const VIRTUAL_PORTFOLIO = 10000;

interface MarketScenario {
  id: string;
  title: string;
  headline: string;
  badge: string;
  badgeBg: string;
  badgeColor: string;
  returns: {
    tech: number; // e.g. +45%
    dividends: number; // e.g. +8%
    gold: number; // e.g. +2%
    cash: number; // 0%
  };
  lesson: string;
}

const SCENARIOS: MarketScenario[] = [
  {
    id: 's1',
    title: 'AI & Tech Hyper-Growth',
    headline: 'Generative AI breakthroughs and cloud software demand hit record highs!',
    badge: 'BOOM CYCLE 🚀',
    badgeBg: '#A7F3D0',
    badgeColor: '#047857',
    returns: { tech: 42, dividends: 8, gold: -2, cash: 0 },
    lesson: 'Tech growth stocks deliver massive capital gains during technological revolutions, while cash stays flat.',
  },
  {
    id: 's2',
    title: 'Global Recession & Rate Hikes',
    headline: 'Consumer spending slows down and central banks tighten liquidity.',
    badge: 'RECESSION CRISIS 📉',
    badgeBg: '#FECDD3',
    badgeColor: '#BE123C',
    returns: { tech: -32, dividends: 14, gold: 22, cash: 0 },
    lesson: 'Defensive dividend stocks and gold act as safety cushions when aggressive tech multiples compress.',
  },
  {
    id: 's3',
    title: 'High Inflation & Commodity Crunch',
    headline: 'Supply shortages trigger an energy shock and raw material price spikes.',
    badge: 'INFLATION SURGE ⚡',
    badgeBg: '#FEF08A',
    badgeColor: '#854D0E',
    returns: { tech: -16, dividends: 6, gold: 38, cash: -4 },
    lesson: 'Commodities and real assets hedge against inflation, while holding too much idle cash loses purchasing power.',
  },
  {
    id: 's4',
    title: 'Green Tech & Sustainable Shift',
    headline: 'Government subsidies accelerate electric vehicles and renewable solar infrastructure.',
    badge: 'ENERGY TRANSITION 🌱',
    badgeBg: '#BAE6FD',
    badgeColor: '#0369A1',
    returns: { tech: 28, dividends: 18, gold: 5, cash: 0 },
    lesson: 'Balanced sector exposure captures emerging structural trends without taking catastrophic single-stock risk.',
  },
];

export default function PortfolioBalancerScreen() {
  const router = useRouter();
  const store = useGamificationStore();

  const [currentRound, setCurrentRound] = useState(0);
  const [gameState, setGameState] = useState<'allocating' | 'simulating' | 'outcome' | 'summary'>('allocating');
  const [showRulesModal, setShowRulesModal] = useState(false);

  // Asset allocations in percentages (must sum to 100)
  const [techAlloc, setTechAlloc] = useState(25);
  const [divAlloc, setDivAlloc] = useState(25);
  const [goldAlloc, setGoldAlloc] = useState(25);
  const [cashAlloc, setCashAlloc] = useState(25);

  // Round stats
  const [totalSimulatedProfit, setTotalSimulatedProfit] = useState(0);
  const [roundReturnPct, setRoundReturnPct] = useState(0);
  const [roundProfit, setRoundProfit] = useState(0);

  const scenario = SCENARIOS[currentRound];
  const totalAlloc = techAlloc + divAlloc + goldAlloc + cashAlloc;

  // Preset Allocation Buttons
  const applyPreset = (tech: number, div: number, gold: number, cash: number) => {
    safeHaptic('light');
    setTechAlloc(tech);
    setDivAlloc(div);
    setGoldAlloc(gold);
    setCashAlloc(cash);
  };

  const simulateMarketYear = () => {
    if (totalAlloc !== 100) {
      safeHaptic('error');
      return;
    }

    safeHaptic('heavy');
    soundFX.playSwipe();
    setGameState('simulating');

    setTimeout(() => {
      // Calculate weighted return
      const ret = (
        (techAlloc * scenario.returns.tech +
          divAlloc * scenario.returns.dividends +
          goldAlloc * scenario.returns.gold +
          cashAlloc * scenario.returns.cash) /
        100
      );
      const calculatedProfit = Math.round((VIRTUAL_PORTFOLIO * ret) / 100);

      setRoundReturnPct(Number(ret.toFixed(1)));
      setRoundProfit(calculatedProfit);
      setTotalSimulatedProfit((p) => p + calculatedProfit);

      const xpEarned = Math.max(20, Math.round(ret * 5 + 40));
      store.addXP(xpEarned);

      if (ret >= 0) {
        soundFX.playCorrect();
        safeHaptic('heavy');
      } else {
        soundFX.playWrong();
        safeHaptic('error');
      }

      setGameState('outcome');
    }, 1200);
  };

  const handleNextRound = () => {
    safeHaptic('light');
    if (currentRound + 1 >= SCENARIOS.length) {
      soundFX.playRoundComplete();
      if (totalSimulatedProfit > 0) {
        store.creditGameReward(50, totalSimulatedProfit);
      }
      setGameState('summary');
    } else {
      setCurrentRound((r) => r + 1);
      setGameState('allocating');
    }
  };

  const resetAll = () => {
    safeHaptic('light');
    setCurrentRound(0);
    setTotalSimulatedProfit(0);
    setTechAlloc(25);
    setDivAlloc(25);
    setGoldAlloc(25);
    setCashAlloc(25);
    setGameState('allocating');
  };

  return (
    <View style={styles.container}>
      <BackgroundSystem />
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
        {/* Header Bar */}
        <XStack justifyContent="space-between" alignItems="center" paddingHorizontal={18} paddingTop={10} paddingBottom={14}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.headerBtn}
            activeOpacity={0.7}
          >
            <PhosphorIcon name="X" size={18} color="#94A3B8" />
          </TouchableOpacity>

          <YStack alignItems="center">
            <Text color="#FFFFFF" fontSize={16} fontFamily={Fonts.bold}>
              Portfolio Balancer 🥧
            </Text>
            <Text color="#94A3B8" fontSize={11} fontFamily={Fonts.medium}>
              Cycle {currentRound + 1} of {SCENARIOS.length}
            </Text>
          </YStack>

          <TouchableOpacity
            onPress={() => {
              safeHaptic('light');
              setShowRulesModal(true);
            }}
            style={styles.headerBtn}
            activeOpacity={0.7}
          >
            <PhosphorIcon name="Question" size={20} color="#38BDF8" weight="fill" />
          </TouchableOpacity>
        </XStack>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {gameState === 'outcome' && roundReturnPct >= 0 && <CelebrationFX />}

          {/* Scenario Headline Card */}
          <View style={styles.scenarioCard}>
            <XStack justifyContent="space-between" alignItems="center" marginBottom={8}>
              <View style={[styles.scenarioBadge, { backgroundColor: scenario.badgeBg }]}>
                <Text color={scenario.badgeColor} fontSize={10} fontFamily={Fonts.bold}>
                  {scenario.badge}
                </Text>
              </View>

              <Text color="#94A3B8" fontSize={11} fontFamily={Fonts.bold}>
                PORTFOLIO: ₱{VIRTUAL_PORTFOLIO.toLocaleString()}
              </Text>
            </XStack>

            <Text color="#FFFFFF" fontSize={18} fontFamily={Fonts.bold} marginBottom={4}>
              {scenario.title}
            </Text>
            <Text color="#94A3B8" fontSize={12.5} fontFamily={Fonts.medium} lineHeight={18}>
              "{scenario.headline}"
            </Text>
          </View>

          {/* ==================== ALLOCATING STATE ==================== */}
          {(gameState === 'allocating' || gameState === 'simulating') && (
            <YStack gap={14} marginTop={12}>
              {/* Presets Row */}
              <XStack gap={8} justifyContent="space-between">
                <TouchableOpacity
                  onPress={() => applyPreset(25, 25, 25, 25)}
                  style={styles.presetBtn}
                  activeOpacity={0.75}
                >
                  <Text color="#E2E8F0" fontSize={11} fontFamily={Fonts.bold}>
                    ⚖️ 25% Equal
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => applyPreset(60, 20, 10, 10)}
                  style={styles.presetBtn}
                  activeOpacity={0.75}
                >
                  <Text color="#38BDF8" fontSize={11} fontFamily={Fonts.bold}>
                    🚀 60% Tech
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => applyPreset(10, 40, 40, 10)}
                  style={styles.presetBtn}
                  activeOpacity={0.75}
                >
                  <Text color="#FBBF24" fontSize={11} fontFamily={Fonts.bold}>
                    🛡️ Defensive
                  </Text>
                </TouchableOpacity>
              </XStack>

              {/* 4 Asset Sliders / Steppers */}
              <YStack gap={10} backgroundColor="#131D31" padding={14} borderRadius={18} borderWidth={1.5} borderColor="#1E293B">
                {/* 1. Tech Growth */}
                <XStack justifyContent="space-between" alignItems="center">
                  <XStack alignItems="center" gap={8}>
                    <Text fontSize={18}>🚀</Text>
                    <YStack>
                      <Text color="#FFFFFF" fontSize={13.5} fontFamily={Fonts.bold}>
                        Tech Growth
                      </Text>
                      <Text color="#38BDF8" fontSize={10.5} fontFamily={Fonts.medium}>
                        AI & High-Risk Apps
                      </Text>
                    </YStack>
                  </XStack>
                  <XStack alignItems="center" gap={8}>
                    <TouchableOpacity
                      onPress={() => setTechAlloc((v) => Math.max(0, v - 5))}
                      style={styles.adjustBtn}
                    >
                      <Text color="#FFFFFF" fontSize={16} fontFamily={Fonts.bold}>-</Text>
                    </TouchableOpacity>
                    <Text color="#38BDF8" fontSize={14} fontFamily={Fonts.bold} width={38} textAlign="center">
                      {techAlloc}%
                    </Text>
                    <TouchableOpacity
                      onPress={() => setTechAlloc((v) => Math.min(100, v + 5))}
                      style={styles.adjustBtn}
                    >
                      <Text color="#FFFFFF" fontSize={16} fontFamily={Fonts.bold}>+</Text>
                    </TouchableOpacity>
                  </XStack>
                </XStack>

                {/* 2. Dividend Giants */}
                <XStack justifyContent="space-between" alignItems="center">
                  <XStack alignItems="center" gap={8}>
                    <Text fontSize={18}>🛡️</Text>
                    <YStack>
                      <Text color="#FFFFFF" fontSize={13.5} fontFamily={Fonts.bold}>
                        Dividend Giants
                      </Text>
                      <Text color="#10B981" fontSize={10.5} fontFamily={Fonts.medium}>
                        Banks, Coffee, Blue-Chips
                      </Text>
                    </YStack>
                  </XStack>
                  <XStack alignItems="center" gap={8}>
                    <TouchableOpacity
                      onPress={() => setDivAlloc((v) => Math.max(0, v - 5))}
                      style={styles.adjustBtn}
                    >
                      <Text color="#FFFFFF" fontSize={16} fontFamily={Fonts.bold}>-</Text>
                    </TouchableOpacity>
                    <Text color="#10B981" fontSize={14} fontFamily={Fonts.bold} width={38} textAlign="center">
                      {divAlloc}%
                    </Text>
                    <TouchableOpacity
                      onPress={() => setDivAlloc((v) => Math.min(100, v + 5))}
                      style={styles.adjustBtn}
                    >
                      <Text color="#FFFFFF" fontSize={16} fontFamily={Fonts.bold}>+</Text>
                    </TouchableOpacity>
                  </XStack>
                </XStack>

                {/* 3. Gold & Commodities */}
                <XStack justifyContent="space-between" alignItems="center">
                  <XStack alignItems="center" gap={8}>
                    <Text fontSize={18}>🪙</Text>
                    <YStack>
                      <Text color="#FFFFFF" fontSize={13.5} fontFamily={Fonts.bold}>
                        Gold & Commodities
                      </Text>
                      <Text color="#FBBF24" fontSize={10.5} fontFamily={Fonts.medium}>
                        Inflation Hedge
                      </Text>
                    </YStack>
                  </XStack>
                  <XStack alignItems="center" gap={8}>
                    <TouchableOpacity
                      onPress={() => setGoldAlloc((v) => Math.max(0, v - 5))}
                      style={styles.adjustBtn}
                    >
                      <Text color="#FFFFFF" fontSize={16} fontFamily={Fonts.bold}>-</Text>
                    </TouchableOpacity>
                    <Text color="#FBBF24" fontSize={14} fontFamily={Fonts.bold} width={38} textAlign="center">
                      {goldAlloc}%
                    </Text>
                    <TouchableOpacity
                      onPress={() => setGoldAlloc((v) => Math.min(100, v + 5))}
                      style={styles.adjustBtn}
                    >
                      <Text color="#FFFFFF" fontSize={16} fontFamily={Fonts.bold}>+</Text>
                    </TouchableOpacity>
                  </XStack>
                </XStack>

                {/* 4. Safe Cash */}
                <XStack justifyContent="space-between" alignItems="center">
                  <XStack alignItems="center" gap={8}>
                    <Text fontSize={18}>💵</Text>
                    <YStack>
                      <Text color="#FFFFFF" fontSize={13.5} fontFamily={Fonts.bold}>
                        Cash Reserve
                      </Text>
                      <Text color="#94A3B8" fontSize={10.5} fontFamily={Fonts.medium}>
                        0% Risk Savings
                      </Text>
                    </YStack>
                  </XStack>
                  <XStack alignItems="center" gap={8}>
                    <TouchableOpacity
                      onPress={() => setCashAlloc((v) => Math.max(0, v - 5))}
                      style={styles.adjustBtn}
                    >
                      <Text color="#FFFFFF" fontSize={16} fontFamily={Fonts.bold}>-</Text>
                    </TouchableOpacity>
                    <Text color="#94A3B8" fontSize={14} fontFamily={Fonts.bold} width={38} textAlign="center">
                      {cashAlloc}%
                    </Text>
                    <TouchableOpacity
                      onPress={() => setCashAlloc((v) => Math.min(100, v + 5))}
                      style={styles.adjustBtn}
                    >
                      <Text color="#FFFFFF" fontSize={16} fontFamily={Fonts.bold}>+</Text>
                    </TouchableOpacity>
                  </XStack>
                </XStack>
              </YStack>

              {/* Total Percentage Gauge */}
              <XStack justifyContent="space-between" alignItems="center" paddingHorizontal={6}>
                <Text color="#94A3B8" fontSize={12} fontFamily={Fonts.medium}>
                  Total Allocated:
                </Text>
                <Text
                  color={totalAlloc === 100 ? '#10B981' : '#EF4444'}
                  fontSize={14}
                  fontFamily={Fonts.bold}
                >
                  {totalAlloc}% / 100% {totalAlloc === 100 ? '✅' : '(Must equal 100%)'}
                </Text>
              </XStack>

              {/* Action Button */}
              <TouchableOpacity
                onPress={simulateMarketYear}
                style={[
                  styles.simulateBtn,
                  totalAlloc !== 100 && { opacity: 0.5 },
                ]}
                disabled={totalAlloc !== 100 || gameState === 'simulating'}
                activeOpacity={0.85}
              >
                <Text color="#FFFFFF" fontSize={16} fontFamily={Fonts.bold}>
                  {gameState === 'simulating' ? '⚡ Simulating 12 Months...' : '⚡ SIMULATE MARKET YEAR'}
                </Text>
              </TouchableOpacity>
            </YStack>
          )}

          {/* ==================== OUTCOME STATE ==================== */}
          {gameState === 'outcome' && (
            <YStack gap={14} marginTop={12}>
              <View style={styles.outcomeResultCard}>
                <Text color="#94A3B8" fontSize={11.5} fontFamily={Fonts.bold} textTransform="uppercase">
                  ANNUAL PORTFOLIO RETURN
                </Text>
                <Text
                  color={roundReturnPct >= 0 ? '#10B981' : '#EF4444'}
                  fontSize={38}
                  fontFamily={Fonts.bold}
                  marginVertical={4}
                >
                  {roundReturnPct >= 0 ? `+${roundReturnPct}%` : `${roundReturnPct}%`}
                </Text>
                <Text color={roundProfit >= 0 ? '#10B981' : '#EF4444'} fontSize={16} fontFamily={Fonts.bold}>
                  {roundProfit >= 0 ? `+₱${roundProfit} Virtual Gain` : `-₱${Math.abs(roundProfit)} Net Loss`}
                </Text>
              </View>

              {/* Educational Takeaway Card */}
              <View style={styles.lessonBox}>
                <XStack alignItems="center" gap={6} marginBottom={6}>
                  <PhosphorIcon name="Lightbulb" size={15} color="#FBBF24" weight="fill" />
                  <Text color="#FBBF24" fontSize={12} fontFamily={Fonts.bold}>
                    FINANCIAL TAKEAWAY
                  </Text>
                </XStack>
                <Text color="#E2E8F0" fontSize={13} fontFamily={Fonts.medium} lineHeight={19}>
                  {scenario.lesson}
                </Text>
              </View>

              <TouchableOpacity
                onPress={handleNextRound}
                style={styles.nextRoundBtn}
                activeOpacity={0.85}
              >
                <Text color="#FFFFFF" fontSize={15} fontFamily={Fonts.bold}>
                  Next Market Cycle ➔
                </Text>
              </TouchableOpacity>
            </YStack>
          )}

          {/* ==================== SUMMARY STATE ==================== */}
          {gameState === 'summary' && (
            <YStack gap={14} marginTop={14} alignItems="center">
              <Text fontSize={48}>🏆</Text>
              <Text color="#FFFFFF" fontSize={24} fontFamily={Fonts.bold}>
                4-Cycle Simulation Complete!
              </Text>
              <Text
                color={totalSimulatedProfit >= 0 ? '#10B981' : '#EF4444'}
                fontSize={20}
                fontFamily={Fonts.bold}
              >
                {totalSimulatedProfit >= 0 ? `+₱${totalSimulatedProfit} Total Profits` : `-₱${Math.abs(totalSimulatedProfit)} Loss`}
              </Text>

              <TouchableOpacity
                onPress={resetAll}
                style={styles.nextRoundBtn}
                activeOpacity={0.85}
              >
                <Text color="#FFFFFF" fontSize={15} fontFamily={Fonts.bold}>
                  Play Again ➔
                </Text>
              </TouchableOpacity>
            </YStack>
          )}
        </ScrollView>
      </SafeAreaView>

      {/* ==================== RULES MODAL ==================== */}
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
                <Text fontSize={20}>🥧</Text>
                <Text color="#FFFFFF" fontSize={18} fontFamily={Fonts.bold}>
                  Portfolio Balancer Rules
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
              <XStack gap={10} alignItems="flex-start">
                <View style={styles.stepNum}>
                  <Text color="#FBBF24" fontSize={12} fontFamily={Fonts.bold}>1</Text>
                </View>
                <YStack flex={1}>
                  <Text color="#FFFFFF" fontSize={13.5} fontFamily={Fonts.bold}>
                    Inspect the Market Cycle
                  </Text>
                  <Text color="#94A3B8" fontSize={12} fontFamily={Fonts.medium} lineHeight={17}>
                    Read if the year is facing an AI Boom, High Inflation, or a Market Crash.
                  </Text>
                </YStack>
              </XStack>

              <XStack gap={10} alignItems="flex-start">
                <View style={styles.stepNum}>
                  <Text color="#FBBF24" fontSize={12} fontFamily={Fonts.bold}>2</Text>
                </View>
                <YStack flex={1}>
                  <Text color="#FFFFFF" fontSize={13.5} fontFamily={Fonts.bold}>
                    Distribute 100% Allocation
                  </Text>
                  <Text color="#94A3B8" fontSize={12} fontFamily={Fonts.medium} lineHeight={17}>
                    Allocate across Tech Growth, Dividends, Gold, and Cash until total equals 100%.
                  </Text>
                </YStack>
              </XStack>

              <XStack gap={10} alignItems="flex-start">
                <View style={styles.stepNum}>
                  <Text color="#FBBF24" fontSize={12} fontFamily={Fonts.bold}>3</Text>
                </View>
                <YStack flex={1}>
                  <Text color="#FFFFFF" fontSize={13.5} fontFamily={Fonts.bold}>
                    Simulate & Earn XP
                  </Text>
                  <Text color="#94A3B8" fontSize={12} fontFamily={Fonts.medium} lineHeight={17}>
                    Simulate 12 months of returns. Higher positive returns reward more XP!
                  </Text>
                </YStack>
              </XStack>

              <TouchableOpacity
                onPress={() => setShowRulesModal(false)}
                style={styles.gotItBtn}
                activeOpacity={0.85}
              >
                <Text color="#FFFFFF" fontSize={14} fontFamily={Fonts.bold}>
                  Got It, Let's Balance!
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
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#131D31',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  scenarioCard: {
    backgroundColor: '#131D31',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#1E293B',
  },
  scenarioBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  presetBtn: {
    flex: 1,
    backgroundColor: '#131D31',
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  adjustBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  simulateBtn: {
    backgroundColor: '#10B981',
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  outcomeResultCard: {
    backgroundColor: '#131D31',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  lessonBox: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.3)',
  },
  nextRoundBtn: {
    backgroundColor: '#38BDF8',
    height: 50,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
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
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
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
    marginTop: 6,
  },
});
