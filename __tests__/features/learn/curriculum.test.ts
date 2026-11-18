import {
  shuffleQuestion,
  QUIZ_PASS_RATIO,
  CHAPTERS,
  LEVELS,
  QuizQuestion,
} from '../../../src/features/learn/curriculum';

describe('curriculum logic', () => {
  const sampleQuestion: QuizQuestion = {
    id: 'test_q1',
    question: 'What is compound interest?',
    options: ['Interest on initial principal only', 'Interest on principal plus accumulated interest', 'Bank fees', 'A tax penalty'],
    correctAnswer: 1, // 'Interest on principal plus accumulated interest'
    explanation: 'Compound interest generates earnings on both initial money and past interest.',
  };

  test('shuffleQuestion preserves correct answer mapping after options shuffle', () => {
    const originalCorrectText = sampleQuestion.options[sampleQuestion.correctAnswer];

    // Run multiple times to verify shuffle behavior across permutations
    for (let i = 0; i < 10; i++) {
      const shuffled = shuffleQuestion(sampleQuestion);
      expect(shuffled.id).toBe(sampleQuestion.id);
      expect(shuffled.question).toBe(sampleQuestion.question);
      expect(shuffled.explanation).toBe(sampleQuestion.explanation);
      expect(shuffled.options).toHaveLength(sampleQuestion.options.length);

      // Verify the new correctAnswer index matches the original text
      const newCorrectText = shuffled.options[shuffled.correctAnswer];
      expect(newCorrectText).toBe(originalCorrectText);
    }
  });

  test('curriculum constants has valid pass ratio 0.75', () => {
    expect(QUIZ_PASS_RATIO).toBe(0.75);
    expect(CHAPTERS.length).toBeGreaterThan(0);
    expect(LEVELS.length).toBeGreaterThan(0);
  });
});
