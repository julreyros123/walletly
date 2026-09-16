import React, { useState } from 'react';
import {
  Modal,
  StyleSheet,
  View,
  Text,
  ScrollView,
  Platform,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PhosphorIcon } from '@/components/ui/PhosphorIcon';
import { Fonts } from '@/constants/theme';
import { InteractivePressable } from '@/components/ui/InteractivePressable';
import { useGamificationStore } from '@/store/gamificationStore';
import { toast } from '@/store/toastStore';

interface RiskAssessmentModalProps {
  visible: boolean;
  onClose: () => void;
  onComplete: (profile: 'Conservative' | 'Moderate' | 'Aggressive') => void;
}

interface Question {
  id: number;
  title: string;
  subtitle: string;
  options: { label: string; desc: string; score: number }[];
}

const QUESTIONS: Question[] = [
  {
    id: 1,
    title: 'Primary Investment Goal',
    subtitle: 'What is the main objective for your simulated investment portfolio?',
    options: [
      {
        label: 'Capital Preservation',
        desc: 'Protect every Peso and avoid any risk of losing money.',
        score: 1,
      },
      {
        label: 'Balanced Growth',
        desc: 'Steady long-term growth that safely beats inflation.',
        score: 2,
      },
      {
        label: 'Maximum Capital Gain',
        desc: 'Aggressive wealth accumulation, accepting high volatility.',
        score: 3,
      },
    ],
  },
  {
    id: 2,
    title: 'Investment Time Horizon',
    subtitle: 'How long do you plan to let your money stay invested before withdrawing?',
    options: [
      {
        label: 'Short-Term (< 1 Year)',
        desc: 'I might need this cash in the near future for expenses.',
        score: 1,
      },
      {
        label: 'Medium-Term (1 – 3 Years)',
        desc: 'Building funds for specific mid-term life milestones.',
        score: 2,
      },
      {
        label: 'Long-Term (5+ Years)',
        desc: 'Letting compound interest work across market cycles.',
        score: 3,
      },
    ],
  },
  {
    id: 3,
    title: 'Market Volatility Reaction',
    subtitle: 'If your portfolio drops 20% in two weeks due to a market correction, what would you do?',
    options: [
      {
        label: 'Sell Immediately',
        desc: 'Cut losses and move back into safe cash buffer.',
        score: 1,
      },
      {
        label: 'Hold Patiently',
        desc: 'Wait for market recovery without making emotional trades.',
        score: 2,
      },
      {
        label: 'Buy the Dip',
        desc: 'Treat the discount as a buying opportunity and accumulate.',
        score: 3,
      },
    ],
  },
  {
    id: 4,
    title: 'Stock Market Experience',
    subtitle: 'How familiar are you with reading financial charts and analyzing companies?',
    options: [
      {
        label: 'First-Timer / Beginner',
        desc: 'New to stock trading, exploring the fundamentals.',
        score: 1,
      },
      {
        label: 'Intermediate',
        desc: 'Understand P/E ratios, index funds, and sector diversification.',
        score: 2,
      },
      {
        label: 'Advanced',
        desc: 'Comfortable with volatility, market orders, and trend technicals.',
        score: 3,
      },
    ],
  },
];

export function RiskAssessmentModal({
  visible,
  onClose,
  onComplete,
}: RiskAssessmentModalProps) {
  const insets = useSafeAreaInsets();
  const store = useGamificationStore();
  const [currentStep, setCurrentStep] = useState(0); // 0-3 for questions, 4 for result
  const [answers, setAnswers] = useState<number[]>([]);
  const [calculatedProfile, setCalculatedProfile] = useState<
    'Conservative' | 'Moderate' | 'Aggressive'
  >('Moderate');

  const handleSelectOption = (score: number) => {
    const updated = [...answers, score];
    setAnswers(updated);

    if (currentStep < QUESTIONS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Calculate final profile
      const totalScore = updated.reduce((a, b) => a + b, 0);
      let profile: 'Conservative' | 'Moderate' | 'Aggressive' = 'Moderate';
      if (totalScore <= 6) profile = 'Conservative';
      else if (totalScore >= 10) profile = 'Aggressive';

      setCalculatedProfile(profile);
      setCurrentStep(4); // Results view
    }
  };

  const handleFinish = () => {
    store.setRiskProfile(calculatedProfile);
    store.addXP(25);
    toast.success('🎯 Profile Assigned!', `Risk Profile set to ${calculatedProfile} (+25 XP)`);
    onComplete(calculatedProfile);
    handleReset();
    onClose();
  };

  const handleReset = () => {
    setCurrentStep(0);
    setAnswers([]);
  };

  const question = QUESTIONS[currentStep];

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View
          style={[
            styles.sheetContainer,
            {
              paddingBottom: Math.max(insets.bottom, 24) + 20,
              marginBottom: Platform.OS === 'android' ? Math.max(insets.bottom, 16) : 0,
            },
          ]}
        >
          {/* Header */}
          <View style={styles.sheetHandle} />
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.modalTitle}>
                {currentStep === 4 ? 'Your Investor Profile' : 'Investor Risk Profiler'}
              </Text>
              <Text style={styles.modalSubtitle}>
                {currentStep === 4
                  ? 'Personalized asset allocation & strategy'
                  : `Question ${currentStep + 1} of ${QUESTIONS.length}`}
              </Text>
            </View>
            <InteractivePressable onPress={onClose}>
              <PhosphorIcon
                name="XCircle"
                size={22}
                color="#64748B"
                weight="fill"
              />
            </InteractivePressable>
          </View>

          {/* Progress bar for questions */}
          {currentStep < 4 && (
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${((currentStep + 1) / QUESTIONS.length) * 100}%` },
                ]}
              />
            </View>
          )}

          {/* Questions Body */}
          {currentStep < 4 && question && (
            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 440 }}>
              <View style={styles.questionBox}>
                <Text style={styles.questionTitle}>{question.title}</Text>
                <Text style={styles.questionSubtitle}>{question.subtitle}</Text>

                <View style={styles.optionsList}>
                  {question.options.map((opt, idx) => (
                    <InteractivePressable
                      key={idx}
                      onPress={() => handleSelectOption(opt.score)}
                      style={styles.optionCard}
                    >
                      <View style={styles.optionHeader}>
                        <View style={styles.optionBadge}>
                          <Text style={styles.optionBadgeText}>
                            {String.fromCharCode(65 + idx)}
                          </Text>
                        </View>
                        <Text style={styles.optionLabel}>{opt.label}</Text>
                      </View>
                      <Text style={styles.optionDesc}>{opt.desc}</Text>
                    </InteractivePressable>
                  ))}
                </View>
              </View>
            </ScrollView>
          )}

          {/* Results View */}
          {currentStep === 4 && (
            <View style={styles.resultsBox}>
              <View style={styles.resultBadgeContainer}>
                <PhosphorIcon
                  name={
                    calculatedProfile === 'Conservative'
                      ? 'ShieldCheck'
                      : calculatedProfile === 'Moderate'
                      ? 'ChartLineUp'
                      : 'Fire'
                  }
                  size={36}
                  color={
                    calculatedProfile === 'Conservative'
                      ? '#10B981'
                      : calculatedProfile === 'Moderate'
                      ? '#F59E0B'
                      : '#EF4444'
                  }
                  weight="fill"
                />
                <Text
                  style={[
                    styles.resultProfileName,
                    {
                      color:
                        calculatedProfile === 'Conservative'
                          ? '#10B981'
                          : calculatedProfile === 'Moderate'
                          ? '#F59E0B'
                          : '#EF4444',
                    },
                  ]}
                >
                  {calculatedProfile} Investor
                </Text>
                <Text style={styles.resultProfileDesc}>
                  {calculatedProfile === 'Conservative'
                    ? 'Capital Protector: Focus on stable blue-chip companies, utilities, and high cash reserves.'
                    : calculatedProfile === 'Moderate'
                    ? 'Balanced Wealth Builder: Equal blend of steady dividend earners, index giants, and selective growth stocks.'
                    : 'High-Growth Tech Strategist: Heavy exposure to AI, clean energy, and high-beta breakout market leaders.'}
                </Text>
              </View>

              {/* Recommended Target Allocation */}
              <View style={styles.allocationBox}>
                <Text style={styles.allocationTitle}>RECOMMENDED TARGET ALLOCATION</Text>
                <View style={styles.allocationBars}>
                  <View style={styles.allocationRow}>
                    <Text style={styles.allocLabel}>
                      {calculatedProfile === 'Conservative'
                        ? 'Blue Chip & Core (APEX, SOLR)'
                        : calculatedProfile === 'Moderate'
                        ? 'Core & Index (APEX, SOLR)'
                        : 'High Growth & Tech (NOVA, VOLT)'}
                    </Text>
                    <Text style={styles.allocVal}>
                      {calculatedProfile === 'Conservative' ? '60%' : calculatedProfile === 'Moderate' ? '40%' : '70%'}
                    </Text>
                  </View>
                  <View style={styles.allocationRow}>
                    <Text style={styles.allocLabel}>
                      {calculatedProfile === 'Conservative'
                        ? 'Steady Consumer (BREW)'
                        : calculatedProfile === 'Moderate'
                        ? 'Growth Assets (NOVA, BREW)'
                        : 'Core Holdings (APEX)'}
                    </Text>
                    <Text style={styles.allocVal}>
                      {calculatedProfile === 'Conservative' ? '20%' : calculatedProfile === 'Moderate' ? '40%' : '20%'}
                    </Text>
                  </View>
                  <View style={styles.allocationRow}>
                    <Text style={styles.allocLabel}>Sandbox Cash Reserve</Text>
                    <Text style={styles.allocVal}>
                      {calculatedProfile === 'Aggressive' ? '10%' : '20%'}
                    </Text>
                  </View>
                </View>
              </View>

              <InteractivePressable onPress={handleFinish} style={styles.confirmButton}>
                <Text style={styles.confirmButtonText}>Apply Profile & Enter Lab (+25 XP)</Text>
              </InteractivePressable>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#0F172A',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  sheetHandle: {
    width: 38,
    height: 4,
    backgroundColor: '#475569',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 14,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: Fonts.bold,
  },
  modalSubtitle: {
    color: '#94A3B8',
    fontSize: 12,
    fontFamily: Fonts.medium,
    marginTop: 2,
  },
  progressTrack: {
    height: 4,
    backgroundColor: '#1E293B',
    borderRadius: 2,
    marginBottom: 18,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 2,
  },
  questionBox: {
    gap: 12,
  },
  questionTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: Fonts.bold,
  },
  questionSubtitle: {
    color: '#94A3B8',
    fontSize: 13,
    fontFamily: Fonts.regular,
    lineHeight: 18,
    marginBottom: 6,
  },
  optionsList: {
    gap: 10,
    paddingBottom: 10,
  },
  optionCard: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 6,
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  optionBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionBadgeText: {
    color: '#10B981',
    fontSize: 12,
    fontFamily: Fonts.bold,
  },
  optionLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: Fonts.bold,
  },
  optionDesc: {
    color: '#94A3B8',
    fontSize: 12,
    fontFamily: Fonts.regular,
    lineHeight: 16,
    paddingLeft: 34,
  },
  resultsBox: {
    gap: 16,
    paddingTop: 8,
  },
  resultBadgeContainer: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  resultProfileName: {
    fontSize: 20,
    fontFamily: Fonts.bold,
    letterSpacing: -0.3,
  },
  resultProfileDesc: {
    color: '#CBD5E1',
    fontSize: 12.5,
    fontFamily: Fonts.medium,
    textAlign: 'center',
    lineHeight: 18,
  },
  allocationBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 14,
    padding: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  allocationTitle: {
    color: '#A7F3D0',
    fontSize: 10.5,
    fontFamily: Fonts.bold,
    letterSpacing: 0.8,
  },
  allocationBars: {
    gap: 6,
  },
  allocationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  allocLabel: {
    color: '#E2E8F0',
    fontSize: 12,
    fontFamily: Fonts.medium,
  },
  allocVal: {
    color: '#10B981',
    fontSize: 12,
    fontFamily: Fonts.bold,
  },
  confirmButton: {
    backgroundColor: '#10B981',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontFamily: Fonts.bold,
  },
});

export default RiskAssessmentModal;
