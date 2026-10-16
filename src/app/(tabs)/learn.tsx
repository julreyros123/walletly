import React, { useState, useMemo, useCallback } from 'react';
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  View,
  Text,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { setStatusBarStyle } from 'expo-status-bar';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useTheme } from '@/hooks/use-theme';
import { PhosphorIcon, PhosphorIconName } from '@/components/ui/PhosphorIcon';
import { useGamificationStore } from '@/store/gamificationStore';
import { CbudgetCard } from '@/components/ui/CbudgetCard';
import { Spacing, Fonts } from '@/constants/theme';
import { BackgroundSystem } from '@/components/ui/BackgroundSystem';
import { safeHaptic } from '@/utils/haptics';

import {
  LEVELS,
  CHAPTERS,
  QUIZ_PASS_RATIO,
  shuffleQuestion,
  Level,
  QuizQuestion,
} from '@/features/learn/curriculum';
import { LessonReader } from '@/features/learn/components/LessonReader';
import { QuizRunner } from '@/features/learn/components/QuizRunner';
import { QuizSummary } from '@/features/learn/components/QuizSummary';

type ScreenState = 'roadmap' | 'reading' | 'quiz' | 'completed';
type FilterOption = 'all' | 'in_progress' | 'completed';

export default function LearnScreen() {
  const theme = useTheme();
  const store = useGamificationStore();
  const completeLesson = store.completeLesson;
  const streakDays = store.streakDays;
  const learningScore = store.learningScore;
  const completedIds = store.completedLessonIds || [];

  useFocusEffect(
    useCallback(() => {
      setStatusBarStyle(theme.mode === 'dark' ? 'light' : 'dark');
    }, [theme.mode])
  );

  const [screenState, setScreenState] = useState<ScreenState>('roadmap');
  const [activeLevelIdx, setActiveLevelIdx] = useState(0);
  const [activeQuestions, setActiveQuestions] = useState<QuizQuestion[]>([]);
  const [lastQuizScore, setLastQuizScore] = useState(0);
  const [lastQuizPassed, setLastQuizPassed] = useState(false);
  const [earnedXP, setEarnedXP] = useState(0);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterOption>('all');

  const activeLevel = LEVELS[activeLevelIdx];

  // Completion check with backwards-compatibility for existing users with learningScore
  const isLevelCompleted = useCallback(
    (lvl: Level) => {
      return (
        completedIds.includes(lvl.lesson.id) ||
        learningScore >= lvl.levelNumber * 11 ||
        (lvl.levelNumber === 9 && learningScore >= 99)
      );
    },
    [completedIds, learningScore]
  );

  // Progressive unlock: Level 1 always open; subsequent levels unlocked when previous is completed
  const isLevelUnlocked = useCallback(
    (lvl: Level) => {
      if (lvl.levelNumber === 1) return true;
      const prevLvl = LEVELS[lvl.levelNumber - 2];
      return isLevelCompleted(prevLvl);
    },
    [isLevelCompleted]
  );

  const completedCount = useMemo(() => {
    return LEVELS.filter((lvl) => isLevelCompleted(lvl)).length;
  }, [isLevelCompleted]);

  // Start lesson reading
  const handleStartLesson = (idx: number) => {
    safeHaptic('light');
    setActiveLevelIdx(idx);
    setScreenState('reading');
  };

  // Start quiz with options shuffled fresh
  const handleStartQuiz = () => {
    safeHaptic('medium');
    const shuffled = activeLevel.lesson.questions.map(shuffleQuestion);
    setActiveQuestions(shuffled);
    setScreenState('quiz');
  };

  // Process quiz finish
  const handleQuizFinish = (
    finalScore: number,
    _answers: { questionId: string; selected: number; isCorrect: boolean }[]
  ) => {
    const total = activeQuestions.length;
    const passed = finalScore / total >= QUIZ_PASS_RATIO;
    setLastQuizScore(finalScore);
    setLastQuizPassed(passed);

    if (passed) {
      completeLesson(activeLevel.title, activeLevel.lesson.id);
      setEarnedXP(activeLevel.lesson.xpReward);
    } else {
      setEarnedXP(0);
    }
    setScreenState('completed');
  };

  const handleNextLevel = () => {
    if (activeLevelIdx < LEVELS.length - 1) {
      setActiveLevelIdx((idx) => idx + 1);
      setScreenState('reading');
    } else {
      setScreenState('roadmap');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <BackgroundSystem mode="tabs" height={380} />
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header Title (Roadmap only) */}
          {screenState === 'roadmap' && (
            <Animated.View entering={FadeInDown.duration(300)} style={styles.header}>
              <Text style={[styles.headerTitle, { color: theme.text }]}>Financial Academy</Text>
              <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
                Interactive micro-courses with knowledge-check quizzes. Master cash flow, saving, and investing.
              </Text>
            </Animated.View>
          )}

          {/* ROADMAP VIEW */}
          {screenState === 'roadmap' && (
            <View style={styles.roadmapContent}>
              {/* Progress Summary Card */}
              <CbudgetCard padding={18} gap={14} backgroundColor={`${theme.primary}08` as any}>
                <View style={styles.summaryTop}>
                  <View style={styles.summaryTextGroup}>
                    <View style={styles.summaryBadgeRow}>
                      <PhosphorIcon name="GraduationCap" size={16} color={theme.primary} weight="bold" />
                      <Text style={[styles.summaryBadgeText, { color: theme.primary }]}>
                        PATHWAY PROGRESS
                      </Text>
                    </View>
                    <Text style={[styles.summaryTitle, { color: theme.text }]}>
                      {completedCount === LEVELS.length
                        ? 'Curriculum Completed!'
                        : `${completedCount} of ${LEVELS.length} Levels Mastered`}
                    </Text>
                    <Text style={[styles.summarySubtitle, { color: theme.textSecondary }]}>
                      {completedCount === LEVELS.length
                        ? 'You have completed all 9 levels. Retake quizzes anytime to keep your skills sharp.'
                        : 'Pass each level quiz with 75% or higher to unlock the next level.'}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.scoreCircle,
                      {
                        backgroundColor: `${theme.primary}18`,
                        borderColor: theme.primary,
                      },
                    ]}
                  >
                    <Text style={[styles.scoreValue, { color: theme.primary }]}>
                      {Math.round((completedCount / LEVELS.length) * 100)}%
                    </Text>
                  </View>
                </View>

                {/* Progress Bar */}
                <View style={[styles.summaryProgressBarTrack, { backgroundColor: theme.backgroundElement }]}>
                  <View
                    style={[
                      styles.summaryProgressBarFill,
                      {
                        width: `${Math.max(6, (completedCount / LEVELS.length) * 100)}%`,
                        backgroundColor: theme.primary,
                      },
                    ]}
                  />
                </View>
              </CbudgetCard>

              {/* Search & Status Filters */}
              <View style={styles.filterSection}>
                {/* Search Input Bar */}
                <View
                  style={[
                    styles.searchBar,
                    {
                      backgroundColor: theme.mode === 'dark' ? '#131D31' : '#FFFFFF',
                      borderColor: theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0',
                    },
                  ]}
                >
                  <PhosphorIcon name="MagnifyingGlass" size={16} color={theme.textSecondary} />
                  <TextInput
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder="Search topics, questions, or concepts..."
                    placeholderTextColor={theme.textSecondary}
                    style={[styles.searchInput, { color: theme.text }]}
                  />
                  {searchQuery.length > 0 && (
                    <TouchableOpacity
                      onPress={() => setSearchQuery('')}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <PhosphorIcon name="XCircle" size={16} color={theme.textSecondary} weight="fill" />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Segmented Filter */}
                <View
                  style={[
                    styles.segmentedTrack,
                    {
                      backgroundColor:
                        theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
                    },
                  ]}
                >
                  {(
                    [
                      { id: 'all', label: `All (${LEVELS.length})` },
                      { id: 'in_progress', label: 'In Progress' },
                      { id: 'completed', label: 'Completed' },
                    ] as const
                  ).map((tab) => {
                    const isActive = statusFilter === tab.id;
                    return (
                      <TouchableOpacity
                        key={tab.id}
                        onPress={() => {
                          safeHaptic('light');
                          setStatusFilter(tab.id);
                        }}
                        style={[
                          styles.segmentedTab,
                          {
                            backgroundColor: isActive ? theme.primary : 'transparent',
                          },
                        ]}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.segmentedLabel,
                            {
                              color: isActive ? '#FFFFFF' : theme.textSecondary,
                              fontFamily: isActive ? Fonts.bold : Fonts.semiBold,
                            },
                          ]}
                        >
                          {tab.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Chapters & Levels */}
              <View style={styles.chaptersContainer}>
                {CHAPTERS.map((chapter) => {
                  const chapterLevels = LEVELS.filter((lvl) => {
                    const inRange =
                      lvl.levelNumber >= chapter.levelsRange[0] &&
                      lvl.levelNumber <= chapter.levelsRange[1];
                    if (!inRange) return false;

                    // Query search
                    if (searchQuery.trim()) {
                      const q = searchQuery.trim().toLowerCase();
                      const matchTitle = lvl.title.toLowerCase().includes(q);
                      const matchLesson = lvl.lesson.title.toLowerCase().includes(q);
                      const matchDesc = lvl.description.toLowerCase().includes(q);
                      const matchContent = lvl.lesson.content.some((c) => c.toLowerCase().includes(q));
                      const matchQuestion = lvl.lesson.questions.some((ques) =>
                        ques.question.toLowerCase().includes(q)
                      );
                      if (!matchTitle && !matchLesson && !matchDesc && !matchContent && !matchQuestion) {
                        return false;
                      }
                    }

                    // Status filter
                    const completed = isLevelCompleted(lvl);
                    const unlocked = isLevelUnlocked(lvl);
                    if (statusFilter === 'completed' && !completed) return false;
                    if (statusFilter === 'in_progress' && (!unlocked || completed)) return false;

                    return true;
                  });

                  if (chapterLevels.length === 0) return null;

                  const chapterCompletedCount = chapterLevels.filter((lvl) => isLevelCompleted(lvl)).length;
                  const isChapterAllDone = chapterCompletedCount === chapterLevels.length;

                  return (
                    <View key={chapter.badge} style={styles.chapterSection}>
                      {/* Chapter Header */}
                      <View style={styles.chapterHeader}>
                        <View style={styles.chapterBadgeRow}>
                          <View
                            style={[
                              styles.chapterBadge,
                              {
                                backgroundColor: isChapterAllDone
                                  ? 'rgba(16, 185, 129, 0.15)'
                                  : `${theme.primary}15`,
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.chapterBadgeText,
                                { color: isChapterAllDone ? '#10B981' : theme.primary },
                              ]}
                            >
                              {chapter.badge.toUpperCase()}
                            </Text>
                          </View>
                          <Text style={[styles.chapterProgressText, { color: theme.textSecondary }]}>
                            {chapterCompletedCount} of {chapterLevels.length} Done
                          </Text>
                        </View>
                        <Text style={[styles.chapterTitle, { color: theme.text }]}>{chapter.title}</Text>
                        <Text style={[styles.chapterDesc, { color: theme.textSecondary }]}>
                          {chapter.description}
                        </Text>
                      </View>

                      {/* Timeline Items */}
                      <View style={styles.timelineList}>
                        {chapterLevels.map((lvl, index) => {
                          const originalIdx = LEVELS.findIndex((l) => l.levelNumber === lvl.levelNumber);
                          const unlocked = isLevelUnlocked(lvl);
                          const completed = isLevelCompleted(lvl);
                          const isLast = index === chapterLevels.length - 1;

                          return (
                            <View key={lvl.levelNumber} style={styles.timelineRow}>
                              {/* Left Spine Indicator */}
                              <View style={styles.spineColumn}>
                                {!isLast && (
                                  <View
                                    style={[
                                      styles.spineLine,
                                      {
                                        backgroundColor: completed ? theme.primary : theme.border,
                                      },
                                    ]}
                                  />
                                )}
                                <View
                                  style={[
                                    styles.spineNode,
                                    {
                                      backgroundColor: completed
                                        ? '#10B981'
                                        : unlocked
                                        ? `${theme.primary}18`
                                        : theme.backgroundElement,
                                      borderColor: completed
                                        ? '#10B981'
                                        : unlocked
                                        ? theme.primary
                                        : theme.border,
                                    },
                                  ]}
                                >
                                  <PhosphorIcon
                                    name={completed ? 'Check' : unlocked ? lvl.icon : 'Lock'}
                                    size={13}
                                    color={completed ? '#FFFFFF' : unlocked ? theme.primary : theme.textSecondary}
                                    weight={completed ? 'bold' : 'regular'}
                                  />
                                </View>
                              </View>

                              {/* Right Level Card */}
                              <TouchableOpacity
                                style={styles.cardWrapper}
                                onPress={() => unlocked && handleStartLesson(originalIdx)}
                                disabled={!unlocked}
                                activeOpacity={0.82}
                              >
                                <CbudgetCard
                                  padding={14}
                                  borderRadius={16}
                                  style={{
                                    backgroundColor: completed
                                      ? theme.surface
                                      : unlocked
                                      ? theme.surface
                                      : theme.backgroundElement,
                                    borderColor: completed
                                      ? theme.border
                                      : unlocked
                                      ? theme.primary
                                      : 'transparent',
                                    borderWidth: unlocked ? 1 : 0,
                                  }}
                                >
                                  <View style={styles.cardHeaderRow}>
                                    <View style={styles.levelHeaderLeft}>
                                      <PhosphorIcon
                                        name={lvl.icon}
                                        size={17}
                                        color={unlocked ? theme.primary : theme.textSecondary}
                                        weight="bold"
                                      />
                                      <Text
                                        style={[
                                          styles.levelPillText,
                                          { color: unlocked ? theme.primary : theme.textSecondary },
                                        ]}
                                      >
                                        LEVEL {lvl.levelNumber}
                                      </Text>
                                    </View>

                                    {completed ? (
                                      <View style={styles.statusPillSuccess}>
                                        <PhosphorIcon name="CheckCircle" size={12} color="#059669" weight="bold" />
                                        <Text style={styles.statusPillSuccessText}>MASTERED</Text>
                                      </View>
                                    ) : unlocked ? (
                                      <View style={styles.statusPillActive}>
                                        <View style={styles.statusActiveDot} />
                                        <Text style={styles.statusPillActiveText}>READY</Text>
                                      </View>
                                    ) : (
                                      <View style={styles.statusPillLocked}>
                                        <PhosphorIcon name="Lock" size={11} color={theme.textSecondary} weight="bold" />
                                        <Text style={[styles.statusPillLockedText, { color: theme.textSecondary }]}>
                                          LOCKED
                                        </Text>
                                      </View>
                                    )}
                                  </View>

                                  <Text
                                    style={[
                                      styles.levelTitleText,
                                      { color: unlocked ? theme.text : theme.textSecondary },
                                    ]}
                                    numberOfLines={1}
                                  >
                                    {lvl.lesson.title}
                                  </Text>

                                  <View style={styles.cardMetaRow}>
                                    <View style={styles.cardMetaItem}>
                                      <PhosphorIcon name="Clock" size={12} color={theme.textSecondary} />
                                      <Text style={[styles.cardMetaText, { color: theme.textSecondary }]}>
                                        {lvl.lesson.estTime}
                                      </Text>
                                    </View>

                                    <Text style={[styles.cardMetaDot, { color: theme.textSecondary }]}>•</Text>

                                    <View style={styles.cardMetaItem}>
                                      <PhosphorIcon name="Lightning" size={12} color={theme.primary} />
                                      <Text style={[styles.cardMetaText, { color: theme.primary }]}>
                                        +{lvl.lesson.xpReward} XP
                                      </Text>
                                    </View>

                                    <Text style={[styles.cardMetaDot, { color: theme.textSecondary }]}>•</Text>

                                    <View style={styles.cardMetaItem}>
                                      <PhosphorIcon name="Question" size={12} color={theme.textSecondary} />
                                      <Text style={[styles.cardMetaText, { color: theme.textSecondary }]}>
                                        {lvl.lesson.questions.length} Qs
                                      </Text>
                                    </View>
                                  </View>
                                </CbudgetCard>
                              </TouchableOpacity>
                            </View>
                          );
                        })}
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* READING VIEW */}
          {screenState === 'reading' && (
            <LessonReader
              level={activeLevel}
              isCompleted={isLevelCompleted(activeLevel)}
              onBack={() => setScreenState('roadmap')}
              onStartQuiz={handleStartQuiz}
            />
          )}

          {/* QUIZ VIEW */}
          {screenState === 'quiz' && (
            <QuizRunner
              questions={activeQuestions}
              levelTitle={activeLevel.title}
              onExit={() => setScreenState('reading')}
              onFinish={handleQuizFinish}
            />
          )}

          {/* COMPLETED / SUMMARY VIEW */}
          {screenState === 'completed' && (
            <QuizSummary
              level={activeLevel}
              score={lastQuizScore}
              total={activeQuestions.length}
              passed={lastQuizPassed}
              earnedXP={earnedXP}
              streakDays={streakDays}
              onRetry={handleStartQuiz}
              onReviewLesson={() => setScreenState('reading')}
              onNextLevel={
                activeLevelIdx < LEVELS.length - 1 && lastQuizPassed ? handleNextLevel : undefined
              }
              onReturnToRoadmap={() => setScreenState('roadmap')}
            />
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 18,
    gap: 4,
  },
  headerTitle: {
    fontFamily: Fonts.extraBold,
    fontSize: 24,
    letterSpacing: -0.6,
  },
  headerSubtitle: {
    fontFamily: Fonts.regular,
    fontSize: 13.5,
    lineHeight: 19,
  },
  roadmapContent: {
    gap: 20,
  },
  summaryTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  summaryTextGroup: {
    flex: 1,
    gap: 4,
  },
  summaryBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  summaryBadgeText: {
    fontFamily: Fonts.extraBold,
    fontSize: 10,
    letterSpacing: 0.8,
  },
  summaryTitle: {
    fontFamily: Fonts.bold,
    fontSize: 16,
    letterSpacing: -0.2,
  },
  summarySubtitle: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    lineHeight: 16,
  },
  scoreCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreValue: {
    fontFamily: Fonts.extraBold,
    fontSize: 15,
  },
  summaryProgressBarTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  summaryProgressBarFill: {
    height: 6,
    borderRadius: 3,
  },
  filterSection: {
    gap: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 42,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontFamily: Fonts.regular,
    padding: 0,
  },
  segmentedTrack: {
    flexDirection: 'row',
    borderRadius: 10,
    padding: 3,
    gap: 4,
  },
  segmentedTab: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentedLabel: {
    fontSize: 12,
  },
  chaptersContainer: {
    gap: 22,
  },
  chapterSection: {
    gap: 14,
  },
  chapterHeader: {
    gap: 4,
    paddingHorizontal: 2,
  },
  chapterBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chapterBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  chapterBadgeText: {
    fontFamily: Fonts.extraBold,
    fontSize: 10,
    letterSpacing: 0.6,
  },
  chapterProgressText: {
    fontFamily: Fonts.semiBold,
    fontSize: 11,
  },
  chapterTitle: {
    fontFamily: Fonts.bold,
    fontSize: 17,
    letterSpacing: -0.2,
  },
  chapterDesc: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    lineHeight: 16,
  },
  timelineList: {
    gap: 12,
  },
  timelineRow: {
    flexDirection: 'row',
    gap: 14,
  },
  spineColumn: {
    width: 32,
    alignItems: 'center',
    position: 'relative',
  },
  spineLine: {
    position: 'absolute',
    top: 32,
    bottom: -18,
    width: 2,
  },
  spineNode: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  cardWrapper: {
    flex: 1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  levelHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  levelPillText: {
    fontFamily: Fonts.extraBold,
    fontSize: 10.5,
    letterSpacing: 0.6,
  },
  statusPillSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusPillSuccessText: {
    color: '#059669',
    fontFamily: Fonts.bold,
    fontSize: 9,
    letterSpacing: 0.4,
  },
  statusPillActive: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusActiveDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#10B981',
  },
  statusPillActiveText: {
    color: '#059669',
    fontFamily: Fonts.bold,
    fontSize: 9,
    letterSpacing: 0.4,
  },
  statusPillLocked: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(100, 116, 139, 0.12)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusPillLockedText: {
    fontFamily: Fonts.bold,
    fontSize: 9,
    letterSpacing: 0.4,
  },
  levelTitleText: {
    fontFamily: Fonts.bold,
    fontSize: 14.5,
    marginBottom: 6,
  },
  cardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cardMetaText: {
    fontFamily: Fonts.medium,
    fontSize: 11,
  },
  cardMetaDot: {
    fontSize: 10,
  },
});
