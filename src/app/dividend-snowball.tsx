import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, TouchableOpacity, Animated, Modal, Dimensions } from 'react-native';
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
import Svg, { Circle, Rect, Path, Defs, LinearGradient, Stop, Line, G } from 'react-native-svg';

const Text = (props: any) => <TamaguiText {...props} />;
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ROUND_TIME = 25;

type TrapType = 'none' | 'impulse' | 'debt' | 'decoy';

interface DividendItem {
  id: number;
  company: string;
  amount: number;
  icon: string;
  x: number;
  y: number;
  trapType: TrapType;
}

export default function DividendSnowballScreen() {
  const router = useRouter();
  const store = useGamificationStore();

  const [gameState, setGameState] = useState<'ready' | 'playing' | 'summary'>('ready');
  const [timeLeft, setTimeLeft] = useState(ROUND_TIME);
  const [snowballTier, setSnowballTier] = useState(1);
  const [totalDividends, setTotalDividends] = useState(0);
  const [reinvestCount, setReinvestCount] = useState(0);
  const [comboStreak, setComboStreak] = useState(0);
  const [activeItems, setActiveItems] = useState<DividendItem[]>([]);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [floatText, setFloatText] = useState<string | null>(null);

  // Animations
  const snowballScale = useRef(new Animated.Value(1)).current;
  const mascotHover = useRef(new Animated.Value(0)).current;
  const arenaShake = useRef(new Animated.Value(0)).current;
  const itemIdRef = useRef(1);
  const timerRef = useRef<any>(null);
  const spawnerRef = useRef<any>(null);
  const totalDividendsRef = useRef(0);
  const comboStreakRef = useRef(0);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(mascotHover, { toValue: -6, duration: 800, useNativeDriver: true }),
        Animated.timing(mascotHover, { toValue: 0, duration: 800, useNativeDriver: true }),
      ])
    ).start();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (spawnerRef.current) clearInterval(spawnerRef.current);
    };
  }, []);

  const triggerScreenShake = () => {
    Animated.sequence([
      Animated.timing(arenaShake, { toValue: 6, duration: 40, useNativeDriver: true }),
      Animated.timing(arenaShake, { toValue: -6, duration: 40, useNativeDriver: true }),
      Animated.timing(arenaShake, { toValue: 4, duration: 40, useNativeDriver: true }),
      Animated.timing(arenaShake, { toValue: 0, duration: 40, useNativeDriver: true }),
    ]).start();
  };

  const startGame = () => {
    safeHaptic('heavy');
    soundFX.playSwipe();

    setTimeLeft(ROUND_TIME);
    setSnowballTier(1);
    setTotalDividends(0);
    totalDividendsRef.current = 0;
    setReinvestCount(0);
    setComboStreak(0);
    comboStreakRef.current = 0;
    setActiveItems([]);
    setFloatText(null);
    setGameState('playing');

    // 1. Countdown timer
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    // 2. Dynamic Spawner
    spawnerRef.current = setInterval(() => {
      spawnItem();
    }, 600);
  };

  const spawnItem = () => {
    const trapRand = Math.random();
    let trapType: TrapType = 'none';

    if (trapRand < 0.12) {
      trapType = 'impulse';
    } else if (trapRand < 0.22) {
      trapType = 'debt';
    } else if (trapRand < 0.32) {
      trapType = 'decoy'; 
    }

    const dividendPool = [
      { name: 'NovaChip Drip', icon: '💻', amount: 25 },
      { name: 'Volt Quarterly', icon: '⚡', amount: 35 },
      { name: 'StarBrew Payout', icon: '☕', amount: 15 },
      { name: 'Apex Logistics Yield', icon: '📦', amount: 45 },
      { name: 'Solaris Sun Yield', icon: '☀️', amount: 30 },
    ];

    const pick = dividendPool[Math.floor(Math.random() * dividendPool.length)];
    const newItem: DividendItem = {
      id: itemIdRef.current++,
      company: trapType !== 'none' ? (trapType === 'debt' ? 'Credit Debt Trap' : trapType === 'decoy' ? 'Fake Dividend Scam' : 'Hype Drop Trap') : pick.name,
      amount: trapType !== 'none' ? (trapType === 'debt' ? -100 : trapType === 'decoy' ? -60 : -75) : pick.amount,
      icon: trapType !== 'none' ? (trapType === 'debt' ? '💳' : trapType === 'decoy' ? '⚠️' : '🛍️') : pick.icon,
      x: 16 + Math.random() * (SCREEN_WIDTH - 110),
      y: 20 + Math.random() * 180,
      trapType,
    };

    setActiveItems((prev) => [...prev.slice(-5), newItem]);
  };

  const handleItemTap = (item: DividendItem) => {
    setActiveItems((prev) => prev.filter((i) => i.id !== item.id));

    if (item.trapType !== 'none') {
      // HIT A TRAP!
      soundFX.playWrong();
      safeHaptic('error');
      triggerScreenShake();
      comboStreakRef.current = 0;
      setComboStreak(0);

      const penalty = Math.abs(item.amount);
      const label = item.trapType === 'debt' ? '-₱100 DEBT!' : item.trapType === 'decoy' ? '-₱60 SCAM!' : '-₱75 HYPE FEE!';
      setFloatText(label);
      setTotalDividends((d) => {
        const next = Math.max(0, d - penalty);
        totalDividendsRef.current = next;
        return next;
      });
    } else {
      // SUCCESSFUL REINVESTMENT
      soundFX.playCorrect();
      safeHaptic('medium');

      const isFever = comboStreakRef.current >= 3;
      const multiplier = isFever ? 2 : 1;
      const gain = item.amount * multiplier;

      setComboStreak((s) => {
        const next = s + 1;
        comboStreakRef.current = next;
        return next;
      });
      setFloatText(isFever ? `🔥 +₱${gain} 2x FEVER!` : `+₱${gain} DRIP!`);

      setTotalDividends((d) => {
        const next = d + gain;
        totalDividendsRef.current = next;
        if (next >= 850) setSnowballTier(4);
        else if (next >= 500) setSnowballTier(3);
        else if (next >= 220) setSnowballTier(2);
        return next;
      });
      setReinvestCount((c) => c + 1);

      Animated.sequence([
        Animated.timing(snowballScale, { toValue: 1.3, duration: 100, useNativeDriver: true }),
        Animated.timing(snowballScale, { toValue: 1.0, duration: 150, useNativeDriver: true }),
      ]).start();
    }

    setTimeout(() => setFloatText(null), 800);
  };

  const endGame = () => {
    clearInterval(timerRef.current);
    clearInterval(spawnerRef.current);
    setActiveItems([]);
    setGameState('summary');

    soundFX.playRoundComplete();
    safeHaptic('heavy');

    const finalDividends = totalDividendsRef.current;
    const finalStreak = comboStreakRef.current;
    const xpEarned = Math.max(30, Math.round(finalDividends * 0.45));
    const cashWon = Math.max(0, finalDividends);
    store.creditGameReward(xpEarned, cashWon);
    if (finalStreak >= 5) {
      store.unlockAchievement('streak_champion');
    }
  };

  useEffect(() => {
    if (timeLeft === 0 && gameState === 'playing') {
      endGame();
    }
  }, [timeLeft, gameState]);

  const isFeverMode = comboStreak >= 4;
  const tierNames = [
    'Seed Investor (1.0x)',
    'Compound Builder (1.5x)',
    'Passive Cashflow (2.0x)',
    'Dividend Tycoon (3.0x)',
  ];

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
              Dividend Snowball ❄️
            </Text>
            <Text color="#94A3B8" fontSize={11} fontFamily={Fonts.medium}>
              Tap to Reinvest • Avoid Traps
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

        {/* Game Arena Stage */}
        <View style={styles.stage}>
          {gameState === 'summary' && <CelebrationFX />}

          {/* Top Status HUD */}
          <XStack justifyContent="space-between" alignItems="center" backgroundColor="#131D31" padding={12} borderRadius={18} borderWidth={1.5} borderColor={isFeverMode ? '#FFB703' : '#1E293B'}>
            <YStack gap={2}>
              <XStack alignItems="center" gap={4}>
                <Text color={isFeverMode ? '#FFB703' : '#94A3B8'} fontSize={9.5} fontFamily={Fonts.bold} textTransform="uppercase">
                  {isFeverMode ? '🔥 2X FEVER ACTIVE' : 'SNOWBALL TIER'}
                </Text>
              </XStack>
              <Text color={isFeverMode ? '#FFB703' : '#38BDF8'} fontSize={13} fontFamily={Fonts.bold}>
                {tierNames[snowballTier - 1]}
              </Text>
            </YStack>

            <YStack alignItems="center" gap={2}>
              <Text color="#94A3B8" fontSize={9.5} fontFamily={Fonts.bold} textTransform="uppercase">
                REINVESTED DRIP
              </Text>
              <Text color="#10B981" fontSize={16} fontFamily={Fonts.bold}>
                ₱{totalDividends}
              </Text>
            </YStack>

            <YStack alignItems="flex-end" gap={2}>
              <Text color="#94A3B8" fontSize={9.5} fontFamily={Fonts.bold} textTransform="uppercase">
                TIME LEFT
              </Text>
              <Text color={timeLeft <= 5 ? '#EF4444' : '#FFFFFF'} fontSize={16} fontFamily={Fonts.bold}>
                {timeLeft}s
              </Text>
            </YStack>
          </XStack>

          {/* Center Alpine Slope Arena */}
          <Animated.View
            style={[
              styles.slopeArena,
              {
                transform: [{ translateX: arenaShake }],
                borderColor: isFeverMode ? 'rgba(255, 183, 3, 0.5)' : '#1E293B',
              },
            ]}
          >
            {/* Mountain Slope & Snow Trail Background */}
            <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
              <Defs>
                <LinearGradient id="slopeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <Stop offset="0%" stopColor="#1E293B" stopOpacity={0.6} />
                  <Stop offset="100%" stopColor="#0F172A" stopOpacity={0.9} />
                </LinearGradient>
              </Defs>
              <Path d="M 0 40 Q 160 120 340 180 L 340 320 L 0 320 Z" fill="url(#slopeGrad)" />
              <Line x1="10" y1="50" x2="330" y2="190" stroke={isFeverMode ? '#FFB703' : '#38BDF8'} strokeWidth={1.5} strokeDasharray="6,6" opacity={0.5} />
            </Svg>

            {/* Float Text indicator on tap */}
            {floatText && (
              <View style={styles.floatTextBox}>
                <Text
                  color={floatText.includes('-') ? '#EF4444' : '#10B981'}
                  fontSize={16}
                  fontFamily={Fonts.bold}
                >
                  {floatText}
                </Text>
              </View>
            )}

            {/* Ready State Welcome */}
            {gameState === 'ready' && (
              <YStack alignItems="center" gap={12} paddingHorizontal={20}>
                <Text fontSize={44}>🏔️</Text>
                <Text color="#FFFFFF" fontSize={20} fontFamily={Fonts.bold} textAlign="center">
                  Compound Your Dividends!
                </Text>
                <Text color="#94A3B8" fontSize={12.5} fontFamily={Fonts.medium} textAlign="center" lineHeight={18}>
                  Tap falling dividend coins to reinvest (**DRIP**). Beware of **Debt Traps 💳**, **Hype Fees 🛍️**, and **Decoy Scams ⚠️**!
                </Text>
              </YStack>
            )}

            {/* Active Floating Dividend & Trap Bubbles */}
            {gameState === 'playing' &&
              activeItems.map((item) => {
                const isTrap = item.trapType !== 'none';
                const isDecoy = item.trapType === 'decoy';

                return (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => handleItemTap(item)}
                    activeOpacity={0.7}
                    style={[
                      styles.bubble,
                      {
                        left: item.x,
                        top: item.y,
                        backgroundColor: isTrap
                          ? isDecoy
                            ? 'rgba(245, 158, 11, 0.22)'
                            : 'rgba(239, 68, 68, 0.25)'
                          : 'rgba(16, 185, 129, 0.22)',
                        borderColor: isTrap
                          ? isDecoy
                            ? '#F59E0B'
                            : '#EF4444'
                          : '#10B981',
                      },
                    ]}
                  >
                    <Text fontSize={20}>{item.icon}</Text>
                    <Text
                      color={isTrap ? (isDecoy ? '#FBBF24' : '#EF4444') : '#10B981'}
                      fontSize={11}
                      fontFamily={Fonts.bold}
                    >
                      {isDecoy ? '+₱150?' : isTrap ? `-₱${Math.abs(item.amount)}` : `+₱${item.amount}`}
                    </Text>
                    <Text color="#94A3B8" fontSize={8.5} fontFamily={Fonts.medium} numberOfLines={1}>
                      {item.company}
                    </Text>
                  </TouchableOpacity>
                );
              })}

            {/* Center Animated Mascot & Growing Snowball */}
            {gameState === 'playing' && (
              <Animated.View
                style={[
                  styles.mascotSnowballRow,
                  {
                    transform: [{ translateY: mascotHover }, { scale: snowballScale }],
                  },
                ]}
              >
                {/* Rolling Glowing Dividend Snowball */}
                <Svg width={80} height={80} viewBox="0 0 80 80">
                  <Defs>
                    <LinearGradient id="snowballGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <Stop offset="0%" stopColor={isFeverMode ? '#FEF08A' : '#E0F2FE'} />
                      <Stop offset="50%" stopColor={isFeverMode ? '#FBBF24' : '#7DD3FC'} />
                      <Stop offset="100%" stopColor={isFeverMode ? '#D97706' : '#0284C7'} />
                    </LinearGradient>
                  </Defs>
                  <Circle cx={40} cy={40} r={36} fill="url(#snowballGrad)" stroke={isFeverMode ? '#B45309' : '#0369A1'} strokeWidth={3} />
                  <Circle cx={40} cy={40} r={24} fill={isFeverMode ? '#FDE047' : '#BAE6FD'} opacity={0.6} />
                  <Circle cx={40} cy={40} r={14} fill="#FEF08A" stroke="#CA8A04" strokeWidth={2} />
                  <Path d="M 36 40 L 44 40 M 40 34 L 40 46" stroke="#78350F" strokeWidth={2} strokeLinecap="round" />
                </Svg>
              </Animated.View>
            )}

            {/* Summary State */}
            {gameState === 'summary' && (
              <YStack alignItems="center" gap={10} paddingHorizontal={20}>
                <Text fontSize={44}>🎉</Text>
                <Text color="#FFFFFF" fontSize={22} fontFamily={Fonts.bold}>
                  Snowball Finished!
                </Text>
                <Text color="#10B981" fontSize={30} fontFamily={Fonts.bold}>
                  ₱{totalDividends} Reinvested
                </Text>
                <Text color="#94A3B8" fontSize={13} fontFamily={Fonts.medium} textAlign="center" lineHeight={18}>
                  You tapped {reinvestCount} dividend payouts!
                </Text>
              </YStack>
            )}
          </Animated.View>

          {/* Bottom Action Controls */}
          <View style={styles.bottomControls}>
            {gameState === 'ready' && (
              <TouchableOpacity
                onPress={startGame}
                style={styles.startBtn}
                activeOpacity={0.85}
              >
                <Text color="#FFFFFF" fontSize={17} fontFamily={Fonts.bold}>
                  ❄️ START SNOWBALL RUN
                </Text>
              </TouchableOpacity>
            )}

            {gameState === 'playing' && (
              <View style={styles.playingTipBox}>
                <Text color={isFeverMode ? '#FFB703' : '#38BDF8'} fontSize={12.5} fontFamily={Fonts.bold} textAlign="center">
                  {isFeverMode ? '🔥 2X FEVER MULTIPLIER ACTIVE! AVOID TRAPS!' : '⚡ CHAIN 4 CONSECUTIVE DIVIDENDS FOR 2X FEVER!'}
                </Text>
              </View>
            )}

            {gameState === 'summary' && (
              <TouchableOpacity
                onPress={startGame}
                style={styles.startBtn}
                activeOpacity={0.85}
              >
                <Text color="#FFFFFF" fontSize={16} fontFamily={Fonts.bold}>
                  Play Again ➔
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
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
                <Text fontSize={20}>❄️</Text>
                <Text color="#FFFFFF" fontSize={18} fontFamily={Fonts.bold}>
                  Dividend Snowball Rules & Traps
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
                  <Text color="#38BDF8" fontSize={12} fontFamily={Fonts.bold}>1</Text>
                </View>
                <YStack flex={1}>
                  <Text color="#FFFFFF" fontSize={13.5} fontFamily={Fonts.bold}>
                    Tap Legitimate Dividends
                  </Text>
                  <Text color="#94A3B8" fontSize={12} fontFamily={Fonts.medium} lineHeight={17}>
                    Stocks pay cash quarterly. Reinvesting (**DRIP**) multiplies your passive payout snowball!
                  </Text>
                </YStack>
              </XStack>

              <XStack gap={10} alignItems="flex-start">
                <View style={styles.stepNum}>
                  <Text color="#EF4444" fontSize={12} fontFamily={Fonts.bold}>2</Text>
                </View>
                <YStack flex={1}>
                  <Text color="#EF4444" fontSize={13.5} fontFamily={Fonts.bold}>
                    Avoid 3 Dangerous Traps!
                  </Text>
                  <Text color="#94A3B8" fontSize={12} fontFamily={Fonts.medium} lineHeight={17}>
                    • 🛍️ **Hype Drop Fee**: -₱75 penalty{'\n'}
                    • 💳 **Credit Debt Trap**: -₱100 penalty{'\n'}
                    • ⚠️ **Fake Dividend Scam**: Decoy bubble that steals -₱60!
                  </Text>
                </YStack>
              </XStack>

              <XStack gap={10} alignItems="flex-start">
                <View style={styles.stepNum}>
                  <Text color="#FFB703" fontSize={12} fontFamily={Fonts.bold}>3</Text>
                </View>
                <YStack flex={1}>
                  <Text color="#FFB703" fontSize={13.5} fontFamily={Fonts.bold}>
                    Unlock 2x Fever Mode 🔥
                  </Text>
                  <Text color="#94A3B8" fontSize={12} fontFamily={Fonts.medium} lineHeight={17}>
                    Chain 4 clean dividend taps in a row to double all payouts! Hitting a trap breaks the fever.
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
  stage: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 16,
    justifyContent: 'space-between',
  },
  slopeArena: {
    height: 310,
    backgroundColor: '#131D31',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
    marginVertical: 10,
  },
  bubble: {
    position: 'absolute',
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 5,
  },
  floatTextBox: {
    position: 'absolute',
    top: 14,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    zIndex: 10,
  },
  mascotSnowballRow: {
    position: 'absolute',
    bottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomControls: {
    width: '100%',
  },
  startBtn: {
    backgroundColor: '#06B6D4',
    height: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#06B6D4',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  playingTipBox: {
    backgroundColor: '#131D31',
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
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
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  gotItBtn: {
    backgroundColor: '#06B6D4',
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
});
