import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { PhosphorIcon } from '@/components/ui/PhosphorIcon';
import { FormButton } from '@/components/ui/FormButton';
import { Fonts } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { Level } from '../curriculum';

interface LessonReaderProps {
  level: Level;
  isCompleted: boolean;
  onBack: () => void;
  onStartQuiz: () => void;
}

export function LessonReader({ level, isCompleted, onBack, onStartQuiz }: LessonReaderProps) {
  const theme = useTheme();
  const { lesson } = level;

  return (
    <View style={styles.container}>
      {/* Top Navigation Bar */}
      <View style={styles.topBar}>
        <Pressable
          onPress={onBack}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Back to roadmap"
          style={[styles.iconBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
        >
          <PhosphorIcon name="ArrowLeft" size={18} color={theme.text} weight="bold" />
        </Pressable>
        <Text style={[styles.topBarLabel, { color: theme.textSecondary }]}>
          Level {level.levelNumber} of 9
        </Text>
        <View style={styles.iconBtnSpacer} />
      </View>

      {/* Hero Header - Flat, Icon-Only Presentation */}
      <Animated.View
        entering={FadeInDown.duration(350)}
        style={[styles.hero, { backgroundColor: theme.surface, borderColor: theme.border }]}
      >
        <View style={styles.heroHeaderRow}>
          <PhosphorIcon name={level.icon} size={28} color={theme.primary} weight="bold" />
          <View style={styles.heroTitleColumn}>
            <Text style={[styles.eyebrow, { color: theme.primary }]}>
              {level.title.toUpperCase()}
            </Text>
            <Text style={[styles.title, { color: theme.text }]}>
              {lesson.title}
            </Text>
          </View>
        </View>

        <View style={styles.metaRow}>
          <MetaChip icon="Clock" label={`${lesson.estTime} read`} />
          <MetaChip icon="Question" label={`${lesson.questions.length} questions`} />
          <MetaChip icon="Lightning" label={isCompleted ? 'Completed' : `+${lesson.xpReward} XP`} />
        </View>
      </Animated.View>

      {/* Reading Content */}
      <Animated.View entering={FadeInDown.delay(80).duration(350)} style={styles.body}>
        {lesson.content.map((paragraph, i) => (
          <Text key={i} style={[styles.paragraph, { color: theme.text }]}>
            {paragraph}
          </Text>
        ))}
      </Animated.View>

      {/* Example Box */}
      {lesson.example && (
        <Animated.View
          entering={FadeInDown.delay(140).duration(350)}
          style={[styles.example, { backgroundColor: theme.surface, borderColor: theme.border }]}
        >
          <View style={styles.exampleHeader}>
            <PhosphorIcon name="Lightbulb" size={16} color={theme.warning} weight="bold" />
            <Text style={[styles.exampleTitle, { color: theme.text }]}>
              {lesson.example.title}
            </Text>
          </View>
          <Text style={[styles.exampleText, { color: theme.textSecondary }]}>
            {lesson.example.text}
          </Text>
        </Animated.View>
      )}

      {/* Flat Takeaways */}
      <Animated.View
        entering={FadeInDown.delay(200).duration(350)}
        style={[styles.takeaways, { backgroundColor: theme.surface, borderColor: theme.border }]}
      >
        <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>KEY TAKEAWAYS</Text>
        {lesson.keyTakeaways.map((item) => (
          <View key={item} style={styles.takeawayRow}>
            <PhosphorIcon name="Check" size={16} color={theme.primary} weight="bold" />
            <Text style={[styles.takeawayText, { color: theme.text }]}>{item}</Text>
          </View>
        ))}
      </Animated.View>

      {/* CTA */}
      <Animated.View entering={FadeInDown.delay(260).duration(350)} style={styles.cta}>
        <FormButton variant="primary" height={50} rightIcon="CaretRight" onPress={onStartQuiz}>
          {isCompleted ? 'Practice quiz again' : 'Start quiz'}
        </FormButton>
        <Text style={[styles.ctaHint, { color: theme.textSecondary }]}>
          Score {Math.ceil(lesson.questions.length * 0.75)} of {lesson.questions.length} to pass this level
        </Text>
      </Animated.View>
    </View>
  );
}

function MetaChip({ icon, label }: { icon: 'Clock' | 'Question' | 'Lightning'; label: string }) {
  const theme = useTheme();
  return (
    <View style={[styles.chip, { backgroundColor: theme.backgroundElement }]}>
      <PhosphorIcon name={icon} size={12} color={theme.textSecondary} weight="bold" />
      <Text style={[styles.chipText, { color: theme.textSecondary }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 14,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topBarLabel: {
    fontFamily: Fonts.semiBold,
    fontSize: 12,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnSpacer: {
    width: 36,
  },
  hero: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    gap: 12,
  },
  heroHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  heroTitleColumn: {
    flex: 1,
    gap: 2,
  },
  eyebrow: {
    fontFamily: Fonts.extraBold,
    fontSize: 11,
    letterSpacing: 0.8,
  },
  title: {
    fontFamily: Fonts.extraBold,
    fontSize: 20,
    lineHeight: 26,
    letterSpacing: -0.3,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingTop: 4,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 6,
  },
  chipText: {
    fontFamily: Fonts.semiBold,
    fontSize: 11,
  },
  body: {
    gap: 12,
    paddingHorizontal: 2,
  },
  paragraph: {
    fontFamily: Fonts.regular,
    fontSize: 14.5,
    lineHeight: 23,
  },
  example: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    gap: 8,
  },
  exampleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  exampleTitle: {
    fontFamily: Fonts.bold,
    fontSize: 13.5,
  },
  exampleText: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    lineHeight: 20,
  },
  takeaways: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    gap: 10,
  },
  sectionLabel: {
    fontFamily: Fonts.extraBold,
    fontSize: 10.5,
    letterSpacing: 0.8,
  },
  takeawayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  takeawayText: {
    fontFamily: Fonts.medium,
    fontSize: 13.5,
    flex: 1,
  },
  cta: {
    gap: 8,
    marginTop: 4,
  },
  ctaHint: {
    fontFamily: Fonts.medium,
    fontSize: 12,
    textAlign: 'center',
  },
});
