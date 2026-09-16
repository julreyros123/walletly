import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, TouchableOpacity, Animated, Easing, Modal, Alert } from 'react-native';
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
import Svg, { Path, Rect, Circle, Line, Defs, LinearGradient, Stop, G } from 'react-native-svg';

const Text = (props: any) => <TamaguiText {...props} />;
const BET_OPTIONS = [100, 250, 500, 1000];

export default function CryptoRocketScreen() {
  const router = useRouter();
  const store = useGamificationStore();

  const [gameState, setGameState] = useState<'idle' | 'flying' | 'cashed_out' | 'crashed'>('idle');
  const [betAmount, setBetAmount] = useState(500);
  const [multiplier, setMultiplier] = useState(1.0);
  const [crashPoint, setCrashPoint] = useState(2.0);
  const [profit, setProfit] = useState(0);
  const [xpWon, setXpWon] = useState(0);
  const [showRulesModal, setShowRulesModal] = useState(false);

  // Animations
  const rocketHover = useRef(new Animated.Value(0)).current;
  const flameFlicker = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const starsScroll = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<any>(null);

  // Idle hover animation
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(rocketHover, { toValue: -8, duration: 1000, useNativeDriver: true }),
        Animated.timing(rocketHover, { toValue: 0, duration: 1000, useNativeDriver: true }),
      ])
    ).start();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startFlight = () => {
    // Check and deduct bet from simulated virtual balance
    const betSuccess = store.deductBet(betAmount);
    if (!betSuccess) {
      Alert.alert(
        'Insufficient Balance',
        `You need at least ₱${betAmount.toLocaleString()} in your simulation balance to launch the rocket.`
      );
      return;
    }

    safeHaptic('heavy');
    soundFX.playSwipe();

    // Random crash point with realistic distribution
    const rand = Math.random();
    const randomCrash = rand < 0.3
      ? Number((1.15 + Math.random() * 0.8).toFixed(2)) // 1.15x - 1.95x
      : rand < 0.75
      ? Number((2.0 + Math.random() * 2.5).toFixed(2)) // 2.0x - 4.5x
      : Number((4.5 + Math.random() * 5.0).toFixed(2)); // 4.5x - 9.5x (Moon shot!)

    setCrashPoint(randomCrash);
    setMultiplier(1.0);
    setGameState('flying');

    // Continuous star scrolling for speed sensation
    starsScroll.setValue(0);
    Animated.loop(
      Animated.timing(starsScroll, {
        toValue: 200,
        duration: 800,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Flame flicker animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(flameFlicker, { toValue: 1.4, duration: 120, useNativeDriver: true }),
        Animated.timing(flameFlicker, { toValue: 0.9, duration: 120, useNativeDriver: true }),
      ])
    ).start();

    // Rocket intensity shake
    Animated.loop(
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 2, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -2, duration: 50, useNativeDriver: true }),
      ])
    ).start();

    let currentMult = 1.0;
    const intervalTime = 55;

    timerRef.current = setInterval(() => {
      currentMult = Number((currentMult + 0.03 + currentMult * 0.015).toFixed(2));

      if (currentMult >= randomCrash) {
        // CRASH EVENT
        clearInterval(timerRef.current);
        setMultiplier(randomCrash);
        setGameState('crashed');
        soundFX.playWrong();
        safeHaptic('error');
      } else {
        setMultiplier(currentMult);
        safeHaptic('light');
      }
    }, intervalTime);
  };

  const handleCashOut = () => {
    if (gameState !== 'flying') return;

    clearInterval(timerRef.current);
    const winProfit = Math.round(betAmount * (multiplier - 1));
    const earnedXP = Math.round(multiplier * 35);
    const totalPayout = betAmount + winProfit;

    setProfit(winProfit);
    setXpWon(earnedXP);
    setGameState('cashed_out');

    store.creditGameReward(earnedXP, totalPayout);
    if (multiplier >= 3.0) {
      store.unlockAchievement('moon_shot_master');
    }
    if (multiplier >= 2.0) {
      store.unlockAchievement('streak_champion');
    }

    soundFX.playCorrect();
    safeHaptic('heavy');
  };

  const resetGame = () => {
    safeHaptic('light');
    setGameState('idle');
    setMultiplier(1.0);
    setProfit(0);
  };

  return (
    <View style={styles.container}>
      <BackgroundSystem />
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
        {/* Header Bar */}
        <XStack justifyContent="space-between" alignItems="center" paddingHorizontal={18} paddingTop={10} paddingBottom={14}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.headerIconBtn}
            activeOpacity={0.7}
          >
            <PhosphorIcon name="X" size={18} color="#94A3B8" />
          </TouchableOpacity>

          <YStack alignItems="center">
            <Text color="#FFFFFF" fontSize={16} fontFamily={Fonts.bold}>
              Crypto Rocket 🚀
            </Text>
            <Text color="#94A3B8" fontSize={11} fontFamily={Fonts.medium}>
              Timing & Multiplier Cash Out
            </Text>
          </YStack>

          {/* Rules / Mechanics Button */}
          <TouchableOpacity
            onPress={() => {
              safeHaptic('light');
              setShowRulesModal(true);
            }}
            style={styles.headerIconBtn}
            activeOpacity={0.7}
          >
            <PhosphorIcon name="Question" size={20} color="#38BDF8" weight="fill" />
          </TouchableOpacity>
        </XStack>

        {/* Game Stage Area */}
        <View style={styles.stage}>
          {/* Confetti on Cash Out */}
          {gameState === 'cashed_out' && <CelebrationFX />}

          {/* Top Multiplier Card */}
          <YStack alignItems="center" gap={4} marginBottom={10}>
            <Text
              color={
                gameState === 'crashed'
                  ? '#EF4444'
                  : gameState === 'cashed_out'
                  ? '#10B981'
                  : gameState === 'flying'
                  ? '#FBBF24'
                  : '#FFFFFF'
              }
              fontSize={46}
              fontFamily={Fonts.bold}
              letterSpacing={1}
            >
              {multiplier.toFixed(2)}x
            </Text>

            <Text color="#94A3B8" fontSize={12.5} fontFamily={Fonts.medium}>
              {gameState === 'flying'
                ? '🚀 Rocket climbing! Cash out before the crash!'
                : gameState === 'crashed'
                ? `💥 CRASHED AT ${crashPoint.toFixed(2)}x!`
                : gameState === 'cashed_out'
                ? `🎉 CASHED OUT AT ${multiplier.toFixed(2)}x!`
                : 'Select your bet & launch to start!'}
            </Text>
          </YStack>

          {/* Center Rocket Launch Flight Arena */}
          <View style={styles.arena}>
            {/* Background Moving Stars Grid */}
            <Animated.View
              style={[
                StyleSheet.absoluteFill,
                { transform: [{ translateY: gameState === 'flying' ? starsScroll : 0 }] },
              ]}
            >
              <Svg width="100%" height="100%">
                <Circle cx="30" cy="30" r="1.5" fill="#38BDF8" opacity={0.6} />
                <Circle cx="280" cy="60" r="2" fill="#FBBF24" opacity={0.7} />
                <Circle cx="80" cy="140" r="1.5" fill="#FFFFFF" opacity={0.5} />
                <Circle cx="240" cy="180" r="2.5" fill="#A855F7" opacity={0.6} />
                <Circle cx="160" cy="40" r="1.2" fill="#FFFFFF" opacity={0.4} />
              </Svg>
            </Animated.View>

            {/* Glowing Moon in Distance */}
            <View style={styles.moon}>
              <Text fontSize={28}>🌕</Text>
            </View>

            {/* The Animated Rocket Ship Visual */}
            {gameState !== 'crashed' ? (
              <Animated.View
                style={[
                  styles.rocketContainer,
                  {
                    transform: [
                      { translateY: rocketHover },
                      { translateX: gameState === 'flying' ? shakeAnim : 0 },
                    ],
                  },
                ]}
              >
                <Svg width={110} height={140} viewBox="0 0 100 130">
                  <Defs>
                    <LinearGradient id="rocketBodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <Stop offset="0%" stopColor="#FFFFFF" />
                      <Stop offset="60%" stopColor="#E2E8F0" />
                      <Stop offset="100%" stopColor="#94A3B8" />
                    </LinearGradient>
                    <LinearGradient id="finGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <Stop offset="0%" stopColor="#EF4444" />
                      <Stop offset="100%" stopColor="#B91C1C" />
                    </LinearGradient>
                    <LinearGradient id="thrusterFire" x1="0%" y1="0%" x2="0%" y2="100%">
                      <Stop offset="0%" stopColor="#FEF08A" />
                      <Stop offset="40%" stopColor="#F59E0B" />
                      <Stop offset="100%" stopColor="#EF4444" />
                    </LinearGradient>
                  </Defs>

                  {/* Rocket Left & Right Fins */}
                  <Path d="M 28 85 L 10 105 L 28 100 Z" fill="url(#finGrad)" stroke="#7F1D1D" strokeWidth={1.5} />
                  <Path d="M 72 85 L 90 105 L 72 100 Z" fill="url(#finGrad)" stroke="#7F1D1D" strokeWidth={1.5} />

                  {/* Rocket Main Hull */}
                  <Path
                    d="M 50 10 C 32 30, 26 65, 28 95 L 72 95 C 74 65, 68 30, 50 10 Z"
                    fill="url(#rocketBodyGrad)"
                    stroke="#1E293B"
                    strokeWidth={2.5}
                  />

                  {/* Nose Cone Red Cap */}
                  <Path d="M 50 10 C 44 20, 39 32, 38 40 L 62 40 C 61 32, 56 20, 50 10 Z" fill="url(#finGrad)" />

                  {/* Porthole Cockpit Window with Mascot */}
                  <Circle cx={50} cy={60} r={14} fill="#0F172A" stroke="#38BDF8" strokeWidth={2.5} />
                  <Circle cx={50} cy={60} r={11} fill="#10B981" />
                  {/* Cute Astronaut Eyes */}
                  <Circle cx={46} cy={59} r={2} fill="#064E3B" />
                  <Circle cx={54} cy={59} r={2} fill="#064E3B" />
                  <Circle cx={47} cy={58} r={0.7} fill="#FFFFFF" />
                  <Circle cx={55} cy={58} r={0.7} fill="#FFFFFF" />
                  <Path d="M 48 64 Q 50 67 52 64" fill="none" stroke="#064E3B" strokeWidth={1.5} strokeLinecap="round" />

                  {/* Rocket Engine Nozzle */}
                  <Rect x={38} y={95} width={24} height={8} rx={2} fill="#475569" stroke="#1E293B" strokeWidth={1.5} />

                  {/* Thruster Flames (Flickering when flying) */}
                  {gameState === 'flying' && (
                    <G transform="translate(0, 103)">
                      <Path d="M 42 0 Q 50 32 58 0 Z" fill="url(#thrusterFire)" />
                      <Path d="M 45 0 Q 50 18 55 0 Z" fill="#FFFFFF" />
                    </G>
                  )}
                </Svg>
              </Animated.View>
            ) : (
              /* Crash Explosion Visual */
              <View style={styles.explosionContainer}>
                <Text fontSize={64}>💥</Text>
                <Text color="#EF4444" fontSize={18} fontFamily={Fonts.bold} marginTop={4}>
                  BOOM!
                </Text>
              </View>
            )}
          </View>

          {/* Outcome Info Banner */}
          {gameState === 'cashed_out' && (
            <View style={styles.outcomeCard}>
              <XStack justifyContent="space-between" alignItems="center" width="100%">
                <YStack gap={2}>
                  <Text color="#10B981" fontSize={16} fontFamily={Fonts.bold}>
                    +₱{profit} Profit Won!
                  </Text>
                  <Text color="#94A3B8" fontSize={12} fontFamily={Fonts.medium}>
                    +{xpWon} XP added to your wallet
                  </Text>
                </YStack>
                <View style={styles.multiplierTag}>
                  <Text color="#047857" fontSize={13} fontFamily={Fonts.bold}>
                    {multiplier.toFixed(2)}x
                  </Text>
                </View>
              </XStack>
            </View>
          )}

          {gameState === 'crashed' && (
            <View style={[styles.outcomeCard, { borderColor: 'rgba(239, 68, 68, 0.4)' }]}>
              <XStack justifyContent="space-between" alignItems="center" width="100%">
                <YStack gap={2}>
                  <Text color="#EF4444" fontSize={16} fontFamily={Fonts.bold}>
                    -₱{betAmount} Bet Lost
                  </Text>
                  <Text color="#94A3B8" fontSize={12} fontFamily={Fonts.medium}>
                    Crashed before cash out! Manage greed!
                  </Text>
                </YStack>
                <View style={[styles.multiplierTag, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
                  <Text color="#EF4444" fontSize={13} fontFamily={Fonts.bold}>
                    0.00x
                  </Text>
                </View>
              </XStack>
            </View>
          )}

          {/* Bet Amount Selector (Visible when Idle) */}
          {gameState === 'idle' && (
            <YStack gap={8} marginTop={10}>
              <Text color="#94A3B8" fontSize={11.5} fontFamily={Fonts.bold} letterSpacing={0.5} textTransform="uppercase">
                CHOOSE VIRTUAL BET
              </Text>
              <XStack gap={8}>
                {BET_OPTIONS.map((amt) => (
                  <TouchableOpacity
                    key={amt}
                    onPress={() => {
                      safeHaptic('light');
                      setBetAmount(amt);
                    }}
                    style={[
                      styles.betChip,
                      betAmount === amt && styles.betChipActive,
                    ]}
                    activeOpacity={0.75}
                  >
                    <Text
                      color={betAmount === amt ? '#047857' : '#FFFFFF'}
                      fontSize={13}
                      fontFamily={Fonts.bold}
                    >
                      ₱{amt}
                    </Text>
                  </TouchableOpacity>
                ))}
              </XStack>
            </YStack>
          )}

          {/* Bottom Interactive Launch & Cash Out Controls */}
          <View style={styles.bottomControls}>
            {gameState === 'idle' && (
              <TouchableOpacity
                onPress={startFlight}
                style={styles.launchBtn}
                activeOpacity={0.85}
              >
                <Text color="#FFFFFF" fontSize={17} fontFamily={Fonts.bold}>
                  🚀 LAUNCH ROCKET (₱{betAmount})
                </Text>
              </TouchableOpacity>
            )}

            {gameState === 'flying' && (
              <TouchableOpacity
                onPress={handleCashOut}
                style={styles.cashOutBtn}
                activeOpacity={0.85}
              >
                <YStack alignItems="center" gap={2}>
                  <Text color="#FFFFFF" fontSize={18} fontFamily={Fonts.bold}>
                    💰 CASH OUT ₱{Math.round(betAmount * multiplier)}
                  </Text>
                  <Text color="rgba(255, 255, 255, 0.9)" fontSize={12} fontFamily={Fonts.medium}>
                    Lock in {multiplier.toFixed(2)}x Profit
                  </Text>
                </YStack>
              </TouchableOpacity>
            )}

            {(gameState === 'cashed_out' || gameState === 'crashed') && (
              <TouchableOpacity
                onPress={resetGame}
                style={styles.playAgainBtn}
                activeOpacity={0.85}
              >
                <Text color="#FFFFFF" fontSize={16} fontFamily={Fonts.bold}>
                  Play Next Round ➔
                </Text>
              </TouchableOpacity>
            )}
          </View>
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
                <Text fontSize={20}>🚀</Text>
                <Text color="#FFFFFF" fontSize={18} fontFamily={Fonts.bold}>
                  How to Play Crypto Rocket
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
                  <Text color="#38BDF8" fontSize={12} fontFamily={Fonts.bold}>1</Text>
                </View>
                <YStack flex={1}>
                  <Text color="#FFFFFF" fontSize={13.5} fontFamily={Fonts.bold}>
                    Select Your Bet
                  </Text>
                  <Text color="#94A3B8" fontSize={12} fontFamily={Fonts.medium} lineHeight={17}>
                    Pick a virtual bet amount (₱100 to ₱1,000) before launch.
                  </Text>
                </YStack>
              </XStack>

              {/* Step 2 */}
              <XStack gap={10} alignItems="flex-start">
                <View style={styles.stepNum}>
                  <Text color="#38BDF8" fontSize={12} fontFamily={Fonts.bold}>2</Text>
                </View>
                <YStack flex={1}>
                  <Text color="#FFFFFF" fontSize={13.5} fontFamily={Fonts.bold}>
                    Watch the Multiplier Climb
                  </Text>
                  <Text color="#94A3B8" fontSize={12} fontFamily={Fonts.medium} lineHeight={17}>
                    The rocket ascends rapidly, increasing your multiplier (up to 10x!).
                  </Text>
                </YStack>
              </XStack>

              {/* Step 3 */}
              <XStack gap={10} alignItems="flex-start">
                <View style={styles.stepNum}>
                  <Text color="#38BDF8" fontSize={12} fontFamily={Fonts.bold}>3</Text>
                </View>
                <YStack flex={1}>
                  <Text color="#FFFFFF" fontSize={13.5} fontFamily={Fonts.bold}>
                    Tap Cash Out in Time
                  </Text>
                  <Text color="#94A3B8" fontSize={12} fontFamily={Fonts.medium} lineHeight={17}>
                    Lock in your profits! If the rocket crashes before you cash out, you lose the bet.
                  </Text>
                </YStack>
              </XStack>

              {/* Financial Takeaway */}
              <View style={styles.takeawayBox}>
                <Text color="#FBBF24" fontSize={11.5} fontFamily={Fonts.bold} marginBottom={2}>
                  💡 INVESTOR LESSON
                </Text>
                <Text color="#E2E8F0" fontSize={12} fontFamily={Fonts.medium} lineHeight={17}>
                  Teaches risk vs. reward, greed management, and the discipline of taking profits during volatile market runs.
                </Text>
              </View>

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
  headerIconBtn: {
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
    paddingHorizontal: 18,
    paddingBottom: 16,
    justifyContent: 'space-between',
  },
  arena: {
    height: 230,
    backgroundColor: '#131D31',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  moon: {
    position: 'absolute',
    top: 14,
    right: 18,
    opacity: 0.8,
  },
  rocketContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  explosionContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  outcomeCard: {
    backgroundColor: '#131D31',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(16, 185, 129, 0.4)',
    marginTop: 6,
  },
  multiplierTag: {
    backgroundColor: '#A7F3D0',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  betChip: {
    flex: 1,
    backgroundColor: '#131D31',
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.2,
    borderColor: '#1E293B',
  },
  betChipActive: {
    backgroundColor: '#A7F3D0',
    borderColor: '#10B981',
  },
  bottomControls: {
    width: '100%',
    marginTop: 10,
  },
  launchBtn: {
    backgroundColor: '#10B981',
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  cashOutBtn: {
    backgroundColor: '#F59E0B',
    height: 60,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  playAgainBtn: {
    backgroundColor: '#38BDF8',
    height: 54,
    borderRadius: 18,
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
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  takeawayBox: {
    backgroundColor: '#0F172A',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.3)',
    marginTop: 4,
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
