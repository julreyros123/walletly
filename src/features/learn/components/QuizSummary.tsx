import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { PhosphorIcon } from '@/components/ui/PhosphorIcon';
import { FormButton } from '@/components/ui/FormButton';
import { Fonts } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { Level } from '../curriculum';

interface QuizSummaryProps {
  level: Level;
  score: number;
  total: number;
  passed: boolean;
  earnedXP: number;
  streakDays: number;
  onRetry: () => void;
  onReviewLesson: () => void;
  onNextLevel?: () => void;
  onReturnToRoadmap: () => void;
}

export function QuizSummary({
  level,
  score,
  total,
  passed,
  earnedXP,
  streakDays,
  onRetry,
  onReviewLesson,
  onNextLevel,
  onReturnToRoadmap,
}: QuizSummaryProps) {
  const theme = useTheme();
  const percentage = Math.round((score / total) * 100);

  return (
    <Animated.View
      entering={FadeInDown.duration(350)}
      style={[styles.container, { backgroundColor: theme.surface, borderColor: theme.border }]}
    >
      {/* Flat icon only - no bubbly badge container */}
      <View style={styles.iconContainer}>
        <PhosphorIcon
          name={passed ? 'CheckCircle' : 'ArrowClockwise'}
          size={56}
          color={passed ? theme.primary : '#EF4444'}
          weight="bold"
        />
      </View>

      {/* Headings */}
      <View style={styles.headerText}>
        <Text style={[styles.title, { color: theme.text }]}>
          {passed ? 'Level Completed!' : 'Keep Practicing'}
        </Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          {passed
            ? `You scored ${score} of ${total} (${percentage}%). Great work on mastering ${level.title}!`
            : `You scored ${score} of ${total} (${percentage}%). Review the key takeaways and try again to unlock the next level.`}
        </Text>
      </View>

      {/* Flat Stats Card */}
      <View style={[styles.statsCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
        <View style={styles.statRow}>
          <View style={styles.statLabelGroup}>
            <PhosphorIcon name="Trophy" size={16} color={theme.primary} weight="bold" />
            <Text style={[styles.statLabel, { color: theme.text }]}>Reward</Text>
          </View>
          <Text style={[styles.statValue, { color: theme.primary }]}>
            {passed ? `+${earnedXP} XP` : '0 XP'}
          </Text>
        </View>

        <View style={[styles.statDivider, { backgroundColor: theme.border }]} />

        <View style={styles.statRow}>
          <View style={styles.statLabelGroup}>
            <PhosphorIcon name="Fire" size={16} color={theme.warning} weight="bold" />
            <Text style={[styles.statLabel, { color: theme.text }]}>Streak</Text>
          </View>
          <Text style={[styles.statValue, { color: theme.warning }]}>
            {streakDays} {streakDays === 1 ? 'Day' : 'Days'}
          </Text>
        </View>

        <View style={[styles.statDivider, { backgroundColor: theme.border }]} />

        <View style={styles.statRow}>
          <View style={styles.statLabelGroup}>
            <PhosphorIcon name="Target" size={16} color={theme.textSecondary} weight="bold" />
            <Text style={[styles.statLabel, { color: theme.text }]}>Passing Target</Text>
          </View>
          <Text style={[styles.statValue, { color: theme.textSecondary }]}>
            {Math.ceil(total * 0.75)} of {total} (75%)
          </Text>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        {passed ? (
          <>
            {onNextLevel && (
              <FormButton variant="primary" height={48} rightIcon="CaretRight" onPress={onNextLevel}>
                Next Level
              </FormButton>
            )}
            <FormButton
              variant={onNextLevel ? 'secondary' : 'primary'}
              height={48}
              onPress={onReturnToRoadmap}
            >
              Academy Roadmap
            </FormButton>
          </>
        ) : (
          <>
            <FormButton variant="primary" height={48} leftIcon="ArrowClockwise" onPress={onRetry}>
              Retake Quiz
            </FormButton>
            <FormButton variant="secondary" height={48} onPress={onReviewLesson}>
              Review Key Concepts
            </FormButton>
          </>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    alignItems: 'center',
    gap: 16,
  },
  iconContainer: {
    paddingTop: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    alignItems: 'center',
    gap: 6,
  },
  title: {
    fontFamily: Fonts.extraBold,
    fontSize: 20,
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: Fonts.regular,
    fontSize: 13.5,
    lineHeight: 19,
    textAlign: 'center',
    paddingHorizontal: 4,
  },
  statsCard: {
    width: '100%',
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statLabel: {
    fontFamily: Fonts.medium,
    fontSize: 13,
  },
  statValue: {
    fontFamily: Fonts.bold,
    fontSize: 13.5,
  },
  statDivider: {
    height: 1,
    width: '100%',
  },
  actions: {
    width: '100%',
    gap: 8,
    marginTop: 2,
  },
});
