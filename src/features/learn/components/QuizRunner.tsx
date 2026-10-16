import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { PhosphorIcon } from '@/components/ui/PhosphorIcon';
import { FormButton } from '@/components/ui/FormButton';
import { Fonts } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { safeHaptic } from '@/utils/haptics';
import type { QuizQuestion } from '../curriculum';

interface QuizRunnerProps {
  questions: QuizQuestion[];
  levelTitle: string;
  onExit: () => void;
  onFinish: (score: number, answers: { questionId: string; selected: number; isCorrect: boolean }[]) => void;
}

export function QuizRunner({ questions, levelTitle, onExit, onFinish }: QuizRunnerProps) {
  const theme = useTheme();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [answers, setAnswers] = useState<{ questionId: string; selected: number; isCorrect: boolean }[]>([]);

  const currentQ = questions[currentIdx];
  const total = questions.length;
  const progressPercent = ((currentIdx + (isAnswerRevealed ? 1 : 0.4)) / total) * 100;

  const handleSelect = (idx: number) => {
    if (isAnswerRevealed) return;
    safeHaptic('light');
    setSelectedOption(idx);
  };

  const handleCheck = () => {
    if (selectedOption === null) return;
    const isCorrect = selectedOption === currentQ.correctAnswer;
    safeHaptic(isCorrect ? 'success' : 'warning');
    setIsAnswerRevealed(true);

    const record = {
      questionId: currentQ.id,
      selected: selectedOption,
      isCorrect,
    };
    setAnswers((prev) => [...prev, record]);
  };

  const handleContinue = () => {
    if (currentIdx < total - 1) {
      setCurrentIdx((c) => c + 1);
      setSelectedOption(null);
      setIsAnswerRevealed(false);
    } else {
      const finalAnswers = answers;
      const finalScore = finalAnswers.filter((a) => a.isCorrect).length;
      onFinish(finalScore, finalAnswers);
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Bar with exit button and progress */}
      <View style={styles.topRow}>
        <Pressable
          onPress={onExit}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Exit quiz"
          style={[styles.exitBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
        >
          <PhosphorIcon name="X" size={16} color={theme.textSecondary} />
        </Pressable>

        <View style={styles.progressTrackContainer}>
          <View style={[styles.progressTrack, { backgroundColor: theme.backgroundElement }]}>
            <View
              style={[
                styles.progressBar,
                { width: `${Math.min(100, Math.max(8, progressPercent))}%`, backgroundColor: theme.primary },
              ]}
            />
          </View>
        </View>

        <Text style={[styles.counterText, { color: theme.textSecondary }]}>
          {currentIdx + 1}/{total}
        </Text>
      </View>

      {/* Question Card */}
      <Animated.View
        key={currentQ.id}
        entering={FadeInDown.duration(300)}
        style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}
      >
        <Text style={[styles.levelTag, { color: theme.primary }]}>{levelTitle.toUpperCase()} • QUIZ</Text>
        <Text style={[styles.questionText, { color: theme.text }]}>{currentQ.question}</Text>

        {/* Options */}
        <View style={styles.optionsList}>
          {currentQ.options.map((optionText, optIdx) => {
            const isSelected = selectedOption === optIdx;
            const isCorrectAnswer = optIdx === currentQ.correctAnswer;

            // Styles depending on answered state
            let optionBg: string = theme.backgroundElement;
            let optionBorder: string = 'transparent';
            let iconColor: string = theme.textSecondary;
            let iconName: 'Check' | 'X' | null = null;

            if (!isAnswerRevealed) {
              if (isSelected) {
                optionBg = `${theme.primary}15`;
                optionBorder = theme.primary;
              }
            } else {
              if (isCorrectAnswer) {
                optionBg = 'rgba(16, 185, 129, 0.15)';
                optionBorder = '#10B981';
                iconColor = '#10B981';
                iconName = 'Check';
              } else if (isSelected && !isCorrectAnswer) {
                optionBg = 'rgba(239, 68, 68, 0.15)';
                optionBorder = '#EF4444';
                iconColor = '#EF4444';
                iconName = 'X';
              }
            }

            return (
              <Pressable
                key={optIdx}
                onPress={() => handleSelect(optIdx)}
                disabled={isAnswerRevealed}
                style={[
                  styles.optionButton,
                  {
                    backgroundColor: optionBg,
                    borderColor: optionBorder,
                  },
                ]}
              >
                <View
                  style={[
                    styles.radioIndicator,
                    {
                      borderColor: isSelected || (isAnswerRevealed && isCorrectAnswer) ? optionBorder : theme.border,
                      backgroundColor:
                        isSelected && !isAnswerRevealed
                          ? theme.primary
                          : isAnswerRevealed && isCorrectAnswer
                          ? '#10B981'
                          : isAnswerRevealed && isSelected
                          ? '#EF4444'
                          : 'transparent',
                    },
                  ]}
                >
                  {iconName ? (
                    <PhosphorIcon name={iconName} size={11} color="#FFFFFF" weight="bold" />
                  ) : isSelected ? (
                    <View style={styles.radioDot} />
                  ) : (
                    <Text style={[styles.optionIndexLetter, { color: theme.textSecondary }]}>
                      {String.fromCharCode(65 + optIdx)}
                    </Text>
                  )}
                </View>

                <Text
                  style={[
                    styles.optionText,
                    {
                      color: theme.text,
                      fontFamily: isSelected || (isAnswerRevealed && isCorrectAnswer) ? Fonts.bold : Fonts.regular,
                    },
                  ]}
                >
                  {optionText}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Explanation Callout (appears on review) */}
        {isAnswerRevealed && (
          <Animated.View
            entering={FadeIn.duration(250)}
            style={[
              styles.explanationBox,
              {
                backgroundColor:
                  selectedOption === currentQ.correctAnswer
                    ? 'rgba(16, 185, 129, 0.1)'
                    : 'rgba(239, 68, 68, 0.08)',
                borderColor:
                  selectedOption === currentQ.correctAnswer
                    ? 'rgba(16, 185, 129, 0.3)'
                    : 'rgba(239, 68, 68, 0.25)',
              },
            ]}
          >
            <View style={styles.explanationHeader}>
              <PhosphorIcon
                name={selectedOption === currentQ.correctAnswer ? 'CheckCircle' : 'XCircle'}
                size={16}
                color={selectedOption === currentQ.correctAnswer ? '#10B981' : '#EF4444'}
                weight="bold"
              />
              <Text
                style={[
                  styles.explanationTitle,
                  { color: selectedOption === currentQ.correctAnswer ? '#10B981' : '#EF4444' },
                ]}
              >
                {selectedOption === currentQ.correctAnswer ? 'Correct!' : 'Incorrect'}
              </Text>
            </View>
            <Text style={[styles.explanationText, { color: theme.text }]}>{currentQ.explanation}</Text>
          </Animated.View>
        )}
      </Animated.View>

      {/* Action CTA */}
      <View style={styles.actionContainer}>
        {!isAnswerRevealed ? (
          <FormButton
            variant="primary"
            height={50}
            disabled={selectedOption === null}
            onPress={handleCheck}
          >
            Confirm Answer
          </FormButton>
        ) : (
          <FormButton
            variant="primary"
            height={50}
            glow
            rightIcon={currentIdx < total - 1 ? 'CaretRight' : 'Check'}
            onPress={handleContinue}
          >
            {currentIdx < total - 1 ? 'Next Question' : 'View Results'}
          </FormButton>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  exitBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressTrackContainer: {
    flex: 1,
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  counterText: {
    fontFamily: Fonts.bold,
    fontSize: 13,
    minWidth: 32,
    textAlign: 'right',
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    gap: 16,
  },
  levelTag: {
    fontFamily: Fonts.extraBold,
    fontSize: 10.5,
    letterSpacing: 0.8,
  },
  questionText: {
    fontFamily: Fonts.bold,
    fontSize: 17,
    lineHeight: 24,
    letterSpacing: -0.2,
  },
  optionsList: {
    gap: 10,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  radioIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  optionIndexLetter: {
    fontFamily: Fonts.bold,
    fontSize: 11,
  },
  optionText: {
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
  explanationBox: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    gap: 6,
    marginTop: 4,
  },
  explanationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  explanationTitle: {
    fontFamily: Fonts.bold,
    fontSize: 13,
  },
  explanationText: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    lineHeight: 19,
  },
  actionContainer: {
    marginTop: 4,
  },
});
