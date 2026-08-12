import React, { useState } from 'react';
import { ScrollView, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { YStack, XStack, Text, Button, Progress, View } from 'tamagui';
import { useTheme } from '@/hooks/use-theme';
import { SymbolView } from 'expo-symbols';
import { useGamificationStore } from '@/store/gamificationStore';
import { CbudgetCard } from '@/components/ui/CbudgetCard';
import { FormButton } from '@/components/ui/FormButton';
import { AppHeader } from '@/components/ui/AppHeader';
import { Spacing } from '@/constants/theme';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import { BackgroundSystem } from '@/components/ui/BackgroundSystem';

interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
}

interface Lesson {
  id: string;
  title: string;
  estTime: string;
  xpReward: number;
  content: string[];
  example?: { title: string; text: string };
  questions: Question[];
}

interface Level {
  levelNumber: number;
  title: string;
  description: string;
  lesson: Lesson;
}

export default function LearnScreen() {
  const theme = useTheme() as any;
  const store = useGamificationStore();
  const completeLesson = store.completeLesson;
  const streakDays = store.streakDays;

  // 9-Level Academy Pathway Curriculum
  const levels: Level[] = [
    {
      levelNumber: 1,
      title: 'Level 1: Budgeting Basics',
      description: 'Master cash-flow basics and the zero-based budgeting framework.',
      lesson: {
        id: 'lvl1_l1',
        title: 'Zero-Based Budgeting Principles',
        estTime: '4 mins',
        xpReward: 50,
        content: [
          'Zero-based budgeting is a method where your income minus your expenditures and savings goals equals exactly zero.',
          'Instead of leaving money sitting randomly in your account (which often leads to impulsive spending), you assign every single peso a job before you spend it.',
          'By dividing your income into essential categories early on, you prevent lazy money habits and make sure your savings are taken care of first.'
        ],
        example: {
          title: 'Giving Every Peso a Job',
          text: 'If your monthly income is ₱10,000, you assign ₱5,000 to Needs, ₱2,500 to Wants, and ₱2,500 to Savings. Total allocated = ₱10,000. Unallocated = ₱0.'
        },
        questions: [
          {
            id: 1,
            question: 'What is the core rule of zero-based budgeting?',
            options: [
              'Keep your bank account balance at zero at all times.',
              'Assign every peso of income a specific category so that income minus expenses/savings equals zero.',
              'Spend all your money on shopping and entertainment.'
            ],
            correctAnswer: 1
          }
        ]
      }
    },
    {
      levelNumber: 2,
      title: 'Level 2: Expense Tracking',
      description: 'Learn to track daily expenses and identify spending leaks.',
      lesson: {
        id: 'lvl2_l1',
        title: 'Controlling Discretionary Leakage',
        estTime: '3 mins',
        xpReward: 50,
        content: [
          'Small, unrecorded purchases are the most common reason budgets fail. This is often called the "latte effect" or spending leaks.',
          'Logging every simulated expense takes under 5 seconds, but it provides complete visibility into where your money goes.',
          'Understanding your actual spending habits is the only way to make realistic cuts and free up money to build your savings.'
        ],
        example: {
          title: 'The Daily Leak',
          text: 'Buying a ₱150 specialty coffee every single day adds up to ₱4,500 a month. Tracking this leak allows you to redirect it to an emergency fund.'
        },
        questions: [
          {
            id: 1,
            question: 'Why is logging small daily purchases important?',
            options: [
              'To avoid paying bank transfer fees.',
              'To identify hidden spending leaks and gain complete visibility of cash flow.',
              'To show off your transactions to friends.'
            ],
            correctAnswer: 1
          }
        ]
      }
    },
    {
      levelNumber: 3,
      title: 'Level 3: Saving Strategies',
      description: 'Discover the power of pay-yourself-first and auto-saving.',
      lesson: {
        id: 'lvl3_l1',
        title: 'Pay Yourself First Method',
        estTime: '4 mins',
        xpReward: 50,
        content: [
          'Most people save what is left over after spending. Usually, nothing is left over.',
          'The "Pay Yourself First" strategy flips this: you save a portion of your income immediately when you receive it, and then live off the remainder.',
          'By putting savings first, you enforce discipline and treat your future self as the most important bill you have to pay.'
        ],
        example: {
          title: 'Flipped Savings',
          text: 'On payday, transfer 15% of your income (e.g., ₱1,500 out of ₱10,000) directly into your savings goals. Live on the remaining ₱8,500 for the rest of the month.'
        },
        questions: [
          {
            id: 1,
            question: 'What does "Pay Yourself First" mean?',
            options: [
              'Buying new clothes immediately on payday.',
              'Saving a designated portion of your income before paying bills or spending on wants.',
              'Paying back simulated debts to friends first.'
            ],
            correctAnswer: 1
          }
        ]
      }
    },
    {
      levelNumber: 4,
      title: 'Level 4: Emergency Funds',
      description: 'Build your safety buffer against unexpected life crises.',
      lesson: {
        id: 'lvl4_l1',
        title: 'Creating Your Financial Shield',
        estTime: '5 mins',
        xpReward: 50,
        content: [
          'An emergency fund is a cash reserve set aside exclusively for unplanned life events, such as medical emergencies, car repairs, or job loss.',
          'Having an emergency fund creates a financial shield, preventing you from borrowing money or going into high-interest debt when a crisis occurs.',
          'Financial experts recommend starting with a small goal (like ₱5,000) and gradually building it to cover 3 to 6 months of essential living costs.'
        ],
        example: {
          title: 'The Shield in Action',
          text: 'If your essential bills cost ₱5,000 per month, a fully funded emergency fund of ₱15,000 to ₱30,000 will protect you during major life interruptions.'
        },
        questions: [
          {
            id: 1,
            question: 'What is the primary benefit of an emergency fund?',
            options: [
              'It provides capital to make high-risk trades.',
              'It acts as a buffer to cover unexpected expenses without accumulating high-interest debt.',
              'It earns the highest returns in the stock market.'
            ],
            correctAnswer: 1
          }
        ]
      }
    },
    {
      levelNumber: 5,
      title: 'Level 5: Financial Planning',
      description: 'Set S.M.A.R.T savings targets for short and long term goals.',
      lesson: {
        id: 'lvl5_l1',
        title: 'Goal-Based Wealth Accumulation',
        estTime: '4 mins',
        xpReward: 50,
        content: [
          'Savings goals give your money direction. Vague savings plans often fail because they lack urgency and structure.',
          'S.M.A.R.T savings goals are Specific, Measurable, Achievable, Relevant, and Time-bound. Having a target amount and deadline keeps you motivated.',
          'Cbudget requires savings goals contribution before you can practice investing, matching real-world wealth priorities.'
        ],
        example: {
          title: 'S.M.A.R.T Savings Goal',
          text: 'Instead of saying "I want to save for a laptop," set a goal: "Save ₱20,000 (Measurable) for a Laptop (Specific) in 180 Days (Time-bound) by allocating ₱111 per day."'
        },
        questions: [
          {
            id: 1,
            question: 'Which of the following is a S.M.A.R.T savings goal?',
            options: [
              '"I cbudget to save some money next month."',
              '"I will save ₱6,000 for an Emergency Fund by contributing ₱50 per day for 120 days."',
              '"I want to become rich in the future."'
            ],
            correctAnswer: 1
          }
        ]
      }
    },
    {
      levelNumber: 6,
      title: 'Level 6: Investment Fundamentals',
      description: 'Unlock compounding interest and capital growth concepts.',
      lesson: {
        id: 'lvl6_l1',
        title: 'The Compounding Machine',
        estTime: '5 mins',
        xpReward: 50,
        content: [
          'Welcome to the Investment Lab! Investing is the practice of allocating capital to assets with the goal of generating future returns.',
          'Unlike saving (which focuses on safety and liquidity), investing takes controlled risks to beat inflation and compound wealth over time.',
          'Compound interest is earning returns on your initial capital plus all the returns you earned previously—effectively "returns on returns".'
        ],
        example: {
          title: 'The Power of Compounding',
          text: 'If you invest ₱1,000 at a simulated 10% interest rate, you have ₱1,100 after 1 year. In Year 2, you earn 10% on ₱1,100, which is ₱110. Your total becomes ₱1,210!'
        },
        questions: [
          {
            id: 1,
            question: 'How does compounding interest build long-term wealth?',
            options: [
              'By paying out high cash dividends every day.',
              'By generating returns on both your initial capital and prior accumulated returns over time.',
              'By reducing the tax rate on simulated stocks.'
            ],
            correctAnswer: 1
          }
        ]
      }
    },
    {
      levelNumber: 7,
      title: 'Level 7: Risk Management',
      description: 'Assess risk tolerance and understand return relationships.',
      lesson: {
        id: 'lvl7_l1',
        title: 'The Risk-Return Tradeoff',
        estTime: '4 mins',
        xpReward: 50,
        content: [
          'Every investment involves some degree of risk. Risk is the possibility of losing some or all of your original capital.',
          'The Risk-Return Tradeoff states that potential return rises with an increase in risk. High-return assets (like individual stocks) have high risk and volatility.',
          'Understanding your risk tolerance—how much price drop you can stand without panicking—is critical to building a stable long-term portfolio.'
        ],
        example: {
          title: 'Risk Tolerance Scenario',
          text: 'If your portfolio drops 20% in a simulator, would you sell in panic or see it as an allocation opportunity? Knowing this prevents emotional mistakes.'
        },
        questions: [
          {
            id: 1,
            question: 'What is the relationship between risk and return?',
            options: [
              'Higher potential returns generally require taking on higher potential risks.',
              'Low-risk investments always yield the highest returns.',
              'There is no relationship between risk and return.'
            ],
            correctAnswer: 0
          }
        ]
      }
    },
    {
      levelNumber: 8,
      title: 'Level 8: Diversification',
      description: 'Learn allocation strategies across different simulated asset classes.',
      lesson: {
        id: 'lvl8_l1',
        title: 'Spreading the Eggs',
        estTime: '5 mins',
        xpReward: 50,
        content: [
          'Diversification is the management practice of allocating investment cash across different assets to minimize overall risk.',
          'If you invest 100% of your simulator cash into a single simulated EV stock and it crashes, you lose everything. If you spread it across Index Funds and Gold, the others cushion the blow.',
          'By holding non-correlated assets (assets that move differently in response to the economy), you achieve a smoother wealth-building path.'
        ],
        example: {
          title: 'A Diversified Portfolio Mix',
          text: 'A common lab allocation is: 60% S&P 500 Index Fund (Simulated Equity), 30% Gold Reserve (Commodities), and 10% Cash.'
        },
        questions: [
          {
            id: 1,
            question: 'What is the primary objective of diversification?',
            options: [
              'To guarantee that you never lose money.',
              'To reduce overall portfolio risk and cushion losses by spreading capital across different asset classes.',
              'To make tracking asset price charts more complicated.'
            ],
            correctAnswer: 1
          }
        ]
      }
    },
    {
      levelNumber: 9,
      title: 'Level 9: Long-Term Wealth Building',
      description: 'Develop the mindset of patience, compound growth, and discipline.',
      lesson: {
        id: 'lvl9_l1',
        title: 'The Long-Term Horizon',
        estTime: '5 mins',
        xpReward: 50,
        content: [
          'Wealth building is not about quick trading or timing the market. It is about consistency and time in the market.',
          'By maintaining healthy budgeting and savings habits, you generate a constant stream of leftover funds to allocate to your long-term portfolio.',
          'Patience and compound growth are the ultimate keys to financial freedom. This completes the core Cbudget journey!'
        ],
        example: {
          title: 'The Lifetime Compounder',
          text: 'Investing ₱1,000 monthly in a diversified fund at 8% compound growth for 30 years results in over ₱1.4 Million, although you only put in ₱360,000!'
        },
        questions: [
          {
            id: 1,
            question: 'What is the most effective mindset for long-term wealth building?',
            options: [
              'Trading speculative assets daily based on social media trends.',
              'Consistent saving, disciplined asset allocation, and letting compounding work over decades.',
              'Keeping all your cash under the mattress.'
            ],
            correctAnswer: 1
          }
        ]
      }
    }
  ];

  const [quizState, setQuizState] = useState<'roadmap' | 'reading' | 'quiz' | 'completed'>('roadmap');
  const [activeLevelIdx, setActiveLevelIdx] = useState(0);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [earnedXP, setEarnedXP] = useState(0);

  const activeLevel = levels[activeLevelIdx];
  const activeLesson = activeLevel.lesson;
  const questions = activeLesson.questions;

  // Determine if a level is unlocked
  // We lock Level N if the user's learningScore is not high enough.
  // Each completed level adds ~11 to the learningScore (9 levels total).
  const isLevelUnlocked = (levelNum: number) => {
    if (levelNum === 1) return true;
    const requiredScore = (levelNum - 1) * 11;
    return store.learningScore >= requiredScore;
  };

  const handleStartLesson = (idx: number) => {
    setActiveLevelIdx(idx);
    setQuizState('reading');
  };

  const handleStartQuiz = () => {
    setQuizState('quiz');
    setCurrentQuestionIdx(0);
    setSelectedOption(null);
    setScore(0);
  };

  const handleOptionSelect = (idx: number) => {
    setSelectedOption(idx);
  };

  const handleNextQuestion = () => {
    if (selectedOption === null) return;

    let newScore = score;
    if (selectedOption === questions[currentQuestionIdx].correctAnswer) {
      newScore = score + 1;
      setScore(newScore);
    }

    if (currentQuestionIdx < questions.length - 1) {
      setCurrentQuestionIdx((c) => c + 1);
      setSelectedOption(null);
    } else {
      // Complete lesson & award XP in store
      completeLesson(activeLevel.title);
      setEarnedXP(activeLesson.xpReward);
      setQuizState('completed');
    }
  };

  return (
    <YStack flex={1} backgroundColor={theme.background}>
      <BackgroundSystem mode="tabs" />
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* Header */}
          <YStack gap={4} marginBottom={20}>
            <Text color={theme.text} fontSize={22} fontWeight="700" letterSpacing={-0.5}>
              Academy Roadmap
            </Text>
            <Text color={theme.textSecondary} fontSize={14}>
              Master the financial journey in order: Budget → Save → Invest.
            </Text>
          </YStack>

          {/* ROADMAP VIEW */}
          {quizState === 'roadmap' && (
            <YStack gap={Spacing[16]}>
              {levels.map((lvl, idx) => {
                const unlocked = isLevelUnlocked(lvl.levelNumber);
                const isInvestLevel = lvl.levelNumber >= 6;
                const cardBg = unlocked ? theme.surface : theme.backgroundElement;
                const borderCol = unlocked ? theme.border : 'transparent';
                const titleColor = unlocked ? theme.text : theme.textSecondary;
                
                // Alert if investment is locked specifically
                const showLockWarning = isInvestLevel && !unlocked;

                return (
                  <Animated.View key={lvl.levelNumber} entering={FadeInDown.delay(60 * idx).duration(400)}>
                    <Button
                      padding={0}
                      height="auto"
                      backgroundColor="transparent"
                      pressStyle={{ opacity: unlocked ? 0.9 : 1 }}
                      onPress={() => unlocked && handleStartLesson(idx)}
                      borderWidth={0}
                      disabled={!unlocked}
                    >
                      <CbudgetCard
                        width="100%"
                        padding={14}
                        backgroundColor={cardBg}
                        borderColor={borderCol}
                        borderWidth={unlocked ? 1 : 0}
                        borderLeftWidth={unlocked ? 5 : 0}
                        borderLeftColor={unlocked ? theme.primary : 'transparent'}
                      >
                        <XStack gap={12} alignItems="center">
                          <YStack
                            width={38}
                            height={38}
                            borderRadius={10}
                            backgroundColor={(unlocked ? `${theme.primary}12` : `${theme.textSecondary}10`) as any}
                            alignItems="center"
                            justifyContent="center"
                          >
                            <SymbolView
                              name={
                                unlocked 
                                  ? ({ ios: 'book.closed.fill', android: 'book', web: 'book' } as const)
                                  : ({ ios: 'lock.fill', android: 'lock', web: 'lock' } as const)
                              }
                              size={16}
                              tintColor={unlocked ? theme.primary : theme.textSecondary}
                            />
                          </YStack>

                          <YStack flex={1} gap={2} alignItems="flex-start">
                            <Text color={titleColor} fontSize={14} fontWeight="700" textAlign="left">
                              {lvl.title}
                            </Text>
                            <Text color={theme.textSecondary} fontSize={11} textAlign="left">
                              {unlocked 
                                ? `Est. Time: ${lvl.lesson.estTime} • +${lvl.lesson.xpReward} XP` 
                                : showLockWarning 
                                ? 'Locked • Finish budgeting & savings (Levels 1-5) first'
                                : 'Locked • Complete preceding level'
                              }
                            </Text>
                          </YStack>

                          {unlocked && (
                            <SymbolView
                              name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' } as const}
                              size={14}
                              tintColor={theme.textSecondary}
                            />
                          )}
                        </XStack>
                      </CbudgetCard>
                    </Button>
                  </Animated.View>
                );
              })}
            </YStack>
          )}

          {/* READING VIEW */}
          {quizState === 'reading' && (
            <Animated.View entering={FadeInDown.duration(400)}>
              <CbudgetCard gap={16}>
                <XStack justifyContent="space-between" alignItems="center">
                  <XStack
                    backgroundColor={`${theme.primary}12` as any}
                    paddingHorizontal={10}
                    paddingVertical={4}
                    borderRadius={100}
                  >
                    <Text color={theme.primary} fontSize={10} fontWeight="700" letterSpacing={0.5}>
                      {activeLevel.title.toUpperCase()}
                    </Text>
                  </XStack>
                  <Text color={theme.textSecondary} fontSize={11}>
                    {activeLesson.estTime} read
                  </Text>
                </XStack>

                <YStack gap={6}>
                  <Text color={theme.text} fontSize={20} fontWeight="700" lineHeight={26}>
                    {activeLesson.title}
                  </Text>
                  <View height={2} backgroundColor={theme.border} width="15%" />
                </YStack>

                <YStack gap={12}>
                  {activeLesson.content.map((paragraph, pIdx) => (
                    <Text key={pIdx} color={theme.text} fontSize={14} lineHeight={22}>
                      {paragraph}
                    </Text>
                  ))}

                  {activeLesson.example && (
                    <YStack
                      backgroundColor={theme.backgroundElement}
                      padding={14}
                      borderRadius={12}
                      borderLeftWidth={4}
                      borderLeftColor={theme.primary}
                      gap={6}
                      marginVertical={4}
                    >
                      <XStack gap={6} alignItems="center">
                        <SymbolView
                          name={{ ios: 'lightbulb.fill', android: 'lightbulb', web: 'lightbulb' } as const}
                          size={14}
                          tintColor={theme.warning}
                        />
                        <Text color={theme.text} fontSize={13} fontWeight="700">
                          {activeLesson.example.title}:
                        </Text>
                      </XStack>
                      <Text color={theme.textSecondary} fontSize={12} lineHeight={18}>
                        {activeLesson.example.text}
                      </Text>
                    </YStack>
                  )}
                </YStack>

                <XStack gap={10} marginTop={6}>
                  <Button
                    flex={1}
                    backgroundColor={theme.backgroundElement}
                    borderRadius={10}
                    height={44}
                    onPress={() => setQuizState('roadmap')}
                  >
                    <Text color={theme.text} fontWeight="700">
                      Back
                    </Text>
                  </Button>
                  <FormButton
                    flex={1.8}
                    variant="primary"
                    height={44}
                    onPress={handleStartQuiz}
                  >
                    Take Quiz
                  </FormButton>
                </XStack>
              </CbudgetCard>
            </Animated.View>
          )}

          {/* QUIZ VIEW */}
          {quizState === 'quiz' && (
            <Animated.View entering={FadeInDown.duration(400)}>
              <CbudgetCard gap={16}>
                <XStack justifyContent="space-between" alignItems="center">
                  <Text color={theme.primary} fontSize={11} fontWeight="700" letterSpacing={0.5}>
                    QUESTION {questions[currentQuestionIdx].id} OF {questions.length}
                  </Text>
                  <Text color={theme.textSecondary} fontSize={11} fontWeight="600">
                    Current Score: {score}
                  </Text>
                </XStack>

                <Progress
                  value={((currentQuestionIdx + 1) / questions.length) * 100}
                  height={4}
                  backgroundColor={theme.backgroundElement}
                  borderRadius={2}
                >
                  <Progress.Indicator backgroundColor={theme.primary} borderRadius={2} />
                </Progress>

                <Text color={theme.text} fontSize={16} fontWeight="700" lineHeight={22}>
                  {questions[currentQuestionIdx].question}
                </Text>

                <YStack gap={8}>
                  {questions[currentQuestionIdx].options.map((opt, idx) => {
                    const isSelected = selectedOption === idx;
                    return (
                      <Button
                        key={opt}
                        backgroundColor={isSelected ? (`${theme.primary}12` as any) : theme.backgroundElement}
                        borderColor={isSelected ? theme.primary : 'transparent'}
                        borderWidth={1.5}
                        borderRadius={10}
                        padding={12}
                        alignItems="flex-start"
                        justifyContent="flex-start"
                        onPress={() => handleOptionSelect(idx)}
                        height="auto"
                      >
                        <XStack gap={10} alignItems="center" width="100%">
                          <View
                            width={18}
                            height={18}
                            borderRadius={9}
                            borderWidth={2}
                            borderColor={isSelected ? theme.primary : theme.textSecondary}
                            backgroundColor={isSelected ? theme.primary : 'transparent'}
                            alignItems="center"
                            justifyContent="center"
                          >
                            {isSelected && (
                              <View width={6} height={6} borderRadius={3} backgroundColor="#FFFFFF" />
                            )}
                          </View>
                          <Text color={theme.text} fontSize={13} fontWeight={isSelected ? '700' : '400'} flex={1} style={{ textAlign: 'left' }}>
                            {opt}
                          </Text>
                        </XStack>
                      </Button>
                    );
                  })}
                </YStack>

                <FormButton
                  variant="primary"
                  height={46}
                  disabled={selectedOption === null}
                  onPress={handleNextQuestion}
                  marginTop={6}
                >
                  {currentQuestionIdx < questions.length - 1 ? 'Next Question' : 'Finish Quiz'}
                </FormButton>
              </CbudgetCard>
            </Animated.View>
          )}

          {/* QUIZ COMPLETED */}
          {quizState === 'completed' && (
            <Animated.View entering={ZoomIn.duration(500)}>
              <CbudgetCard alignItems="center" gap={16} padding={24}>
                <YStack position="relative" alignItems="center" justifyContent="center">
                  <YStack
                    width={70}
                    height={70}
                    borderRadius={35}
                    backgroundColor={`${theme.warning}15` as any}
                    alignItems="center"
                    justifyContent="center"
                    borderWidth={2}
                    borderColor={`${theme.warning}40` as any}
                  >
                    <SymbolView
                      name={{ ios: 'checkmark.seal.fill', android: 'verified', web: 'verified' } as const}
                      size={36}
                      tintColor={theme.warning}
                    />
                  </YStack>
                </YStack>

                <YStack gap={2} alignItems="center">
                  <Text color={theme.text} fontSize={18} fontWeight="700">
                    Level Completed!
                  </Text>
                  <Text color={theme.textSecondary} fontSize={13} textAlign="center">
                    You answered {score} of {questions.length} questions correctly.
                  </Text>
                </YStack>

                <YStack
                  backgroundColor={theme.backgroundElement}
                  padding={12}
                  borderRadius={12}
                  width="100%"
                  gap={10}
                  borderWidth={1}
                  borderColor={theme.border}
                >
                  <XStack justifyContent="space-between" alignItems="center">
                    <Text color={theme.text} fontSize={13} fontWeight="600">Learning Reward</Text>
                    <Text color={theme.primary as any} fontSize={13} fontWeight="800">+{earnedXP} XP</Text>
                  </XStack>
                  <XStack justifyContent="space-between" alignItems="center" borderTopWidth={1} borderTopColor={theme.border} paddingTop={10}>
                    <Text color={theme.text} fontSize={13} fontWeight="600">Streak Status</Text>
                    <Text color={theme.warning} fontSize={13} fontWeight="800">{streakDays} Active Days</Text>
                  </XStack>
                </YStack>

                <FormButton variant="primary" height={44} onPress={() => setQuizState('roadmap')}>
                  Academy Roadmap
                </FormButton>
              </CbudgetCard>
            </Animated.View>
          )}

        </ScrollView>
      </SafeAreaView>
    </YStack>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 32,
  },
});
