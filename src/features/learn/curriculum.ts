import type { PhosphorIconName } from '@/components/ui/PhosphorIcon';

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  /** Index into `options` of the correct answer (before any runtime shuffling). */
  correctAnswer: number;
  /** Shown after the learner answers, whether right or wrong. */
  explanation: string;
}

export interface Lesson {
  id: string;
  title: string;
  estTime: string;
  xpReward: number;
  content: string[];
  example?: { title: string; text: string };
  keyTakeaways: string[];
  questions: QuizQuestion[];
}

export interface Level {
  levelNumber: number;
  title: string;
  description: string;
  icon: PhosphorIconName;
  lesson: Lesson;
}

export interface Chapter {
  badge: string;
  title: string;
  description: string;
  levelsRange: [number, number];
}

/** Fraction of questions that must be answered correctly to pass a lesson. */
export const QUIZ_PASS_RATIO = 0.75;

/** Legacy progression: each completed level used to add 11 to learningScore. */
export const LEGACY_SCORE_PER_LEVEL = 11;

export const CHAPTERS: Chapter[] = [
  {
    badge: 'Chapter 1',
    title: 'Budgeting Foundations',
    description: 'Master cash-flow principles and log daily expenses.',
    levelsRange: [1, 2],
  },
  {
    badge: 'Chapter 2',
    title: 'Saving & Security',
    description: 'Build your emergency shield and set savings goals.',
    levelsRange: [3, 5],
  },
  {
    badge: 'Chapter 3',
    title: 'Wealth & Investment Lab',
    description: 'Learn compounding, risk profiles, and asset allocation.',
    levelsRange: [6, 9],
  },
];

export const LEVELS: Level[] = [
  {
    levelNumber: 1,
    title: 'Budgeting Basics',
    description: 'Master cash-flow basics and the zero-based budgeting framework.',
    icon: 'Wallet',
    lesson: {
      id: 'lvl1_l1',
      title: 'Zero-Based Budgeting Principles',
      estTime: '4 min',
      xpReward: 50,
      content: [
        'Zero-based budgeting means your income minus your spending and savings equals exactly zero. It does not mean your bank balance is zero — it means every peso has been assigned a purpose.',
        'Money without a job tends to disappear on impulse purchases. Deciding in advance where each peso goes puts you in control instead of your habits.',
        'A popular starting split is the 50/30/20 rule: 50% for needs, 30% for wants, and 20% for savings. Adjust it to your situation, but always plan savings up front.',
      ],
      example: {
        title: 'Giving Every Peso a Job',
        text: 'Monthly allowance of ₱10,000 → ₱5,000 Needs, ₱3,000 Wants, ₱2,000 Savings. Total assigned: ₱10,000. Unassigned: ₱0.',
      },
      keyTakeaways: [
        'Income − (spending + savings) = ₱0',
        'Assign every peso before the month starts',
        '50/30/20 is a solid starting point',
      ],
      questions: [
        {
          id: 'l1q1',
          question: 'What does "zero" mean in zero-based budgeting?',
          options: [
            'Your bank account should hit ₱0 by the end of the month.',
            'Every peso of income is assigned to spending or savings, leaving nothing unplanned.',
            'You should spend zero pesos on wants.',
            'You start every month with no savings.',
          ],
          correctAnswer: 1,
          explanation:
            'The "zero" is income minus planned allocations — not your balance. Savings count as an allocation, so you can have money in the bank and still be at zero.',
        },
        {
          id: 'l1q2',
          question:
            'You earn ₱12,000. You planned ₱6,000 for needs, ₱3,000 for wants, and ₱2,000 for savings. What should you do next?',
          options: [
            'Nothing — the budget is complete.',
            'Leave the extra ₱1,000 in your wallet for whatever comes up.',
            'Give the remaining ₱1,000 a specific job, like savings or a planned expense.',
            'Cut your needs budget to make the numbers smaller.',
          ],
          correctAnswer: 2,
          explanation:
            '₱6,000 + ₱3,000 + ₱2,000 = ₱11,000, so ₱1,000 is still unassigned. In a zero-based budget, that ₱1,000 needs a job too.',
        },
        {
          id: 'l1q3',
          question: 'Using the 50/30/20 rule, how much of a ₱15,000 monthly income goes to savings?',
          options: ['₱1,500', '₱4,500', '₱7,500', '₱3,000'],
          correctAnswer: 3,
          explanation: '20% of ₱15,000 = ₱3,000. Needs would get ₱7,500 (50%) and wants ₱4,500 (30%).',
        },
        {
          id: 'l1q4',
          question: 'Why does leaving money "unassigned" often hurt your budget?',
          options: [
            'Unassigned money tends to get spent on impulse without you noticing.',
            'Banks charge fees on unassigned money.',
            'It lowers your credit score automatically.',
            'It has no effect at all.',
          ],
          correctAnswer: 0,
          explanation:
            'Money without a plan is the easiest to spend on impulse. Assigning it up front protects it.',
        },
      ],
    },
  },
  {
    levelNumber: 2,
    title: 'Expense Tracking',
    description: 'Learn to track daily expenses and identify spending leaks.',
    icon: 'Receipt',
    lesson: {
      id: 'lvl2_l1',
      title: 'Finding Your Spending Leaks',
      estTime: '3 min',
      xpReward: 50,
      content: [
        'Small, unrecorded purchases are the most common reason budgets fail. This is often called the "latte effect" — tiny amounts that add up to a big leak.',
        'Logging an expense takes under 5 seconds, but it gives you an honest picture of where your money actually goes, not where you think it goes.',
        'Once you can see your spending, sort it into needs (things you must pay for) and wants (things that are nice to have). Wants are where realistic cuts usually come from.',
      ],
      example: {
        title: 'The Daily Leak',
        text: 'A ₱150 milk tea every school day (about 20 days) costs ₱3,000 a month — ₱36,000 a year. Cutting it to twice a week frees up ₱1,800 monthly.',
      },
      keyTakeaways: [
        'Small purchases add up fast',
        'Log every expense — it takes seconds',
        'Separate needs from wants to find cuts',
      ],
      questions: [
        {
          id: 'l2q1',
          question: 'Why is logging small daily purchases important?',
          options: [
            'It avoids bank transfer fees.',
            'It reveals hidden spending leaks and shows where your money really goes.',
            'It is required by law.',
            'It automatically increases your income.',
          ],
          correctAnswer: 1,
          explanation:
            'Small purchases are easy to forget, which is exactly why they leak money. Tracking makes them visible.',
        },
        {
          id: 'l2q2',
          question: 'You buy a ₱120 snack every school day (20 days a month). How much is that per month?',
          options: ['₱1,200', '₱2,400', '₱3,600', '₱840'],
          correctAnswer: 1,
          explanation: '₱120 × 20 days = ₱2,400 per month — that is ₱28,800 a year from one small habit.',
        },
        {
          id: 'l2q3',
          question: 'Which of these is a WANT rather than a NEED?',
          options: [
            'Jeepney fare to get to school',
            'Your share of the electricity bill',
            'Upgrading to the latest phone when yours still works',
            'Basic groceries for the week',
          ],
          correctAnswer: 2,
          explanation:
            'Transport, utilities, and food are needs. Replacing a working phone is a want — nice to have, but optional.',
        },
        {
          id: 'l2q4',
          question: 'After a month of tracking, you see you overspent on food delivery. What is the best next step?',
          options: [
            'Stop tracking so you do not feel bad.',
            'Set a realistic delivery limit for next month and track against it.',
            'Delete the expense records.',
            'Borrow money to cover it.',
          ],
          correctAnswer: 1,
          explanation:
            'Tracking is only useful if you act on it. Setting a specific limit turns insight into a better habit.',
        },
      ],
    },
  },
  {
    levelNumber: 3,
    title: 'Saving Strategies',
    description: 'Discover the power of pay-yourself-first and auto-saving.',
    icon: 'PiggyBank',
    lesson: {
      id: 'lvl3_l1',
      title: 'Pay Yourself First',
      estTime: '4 min',
      xpReward: 50,
      content: [
        'Most people save whatever is left after spending — and usually nothing is left.',
        '"Pay Yourself First" flips the order: the moment money comes in, you move a set portion into savings, then live on the rest.',
        'Automating this transfer (for example, a scheduled transfer on payday) removes willpower from the equation. You cannot spend what you never see.',
      ],
      example: {
        title: 'Flipped Savings',
        text: 'On allowance day, move 15% (₱1,500 of ₱10,000) straight into your savings goal. Budget the remaining ₱8,500 for the month.',
      },
      keyTakeaways: [
        'Save first, spend what remains',
        'Automate transfers on payday',
        'Treat savings like a fixed bill',
      ],
      questions: [
        {
          id: 'l3q1',
          question: 'What does "Pay Yourself First" mean?',
          options: [
            'Buy something for yourself as soon as you get paid.',
            'Pay off friends before paying bills.',
            'Move a set portion of income to savings before spending on anything else.',
            'Save only what is left at the end of the month.',
          ],
          correctAnswer: 2,
          explanation:
            'The "you" being paid is your future self. Savings come out first, then spending is planned around what remains.',
        },
        {
          id: 'l3q2',
          question: 'You receive ₱8,000 and want to pay yourself first at 15%. How much do you save?',
          options: ['₱800', '₱1,200', '₱1,500', '₱6,800'],
          correctAnswer: 1,
          explanation: '15% of ₱8,000 = ₱1,200. You would then budget the remaining ₱6,800.',
        },
        {
          id: 'l3q3',
          question: 'Why is automating your savings transfer so effective?',
          options: [
            'It removes the need for willpower — the money moves before you can spend it.',
            'Banks pay double interest on automated transfers.',
            'It makes your savings impossible to withdraw.',
            'It reduces your taxes.',
          ],
          correctAnswer: 0,
          explanation:
            'Automation turns saving into a default. You never have to decide to save, so you never forget or talk yourself out of it.',
        },
        {
          id: 'l3q4',
          question: 'Ana saves whatever is left at month-end. Ben saves 10% on payday. Who is more likely to save consistently?',
          options: [
            'Ana, because she saves more when she spends less.',
            'Both will save exactly the same.',
            'Neither — saving is about luck.',
            'Ben, because saving first guarantees money is set aside every month.',
          ],
          correctAnswer: 3,
          explanation:
            'Leftover money is unpredictable and often zero. Saving a fixed percentage first makes it consistent.',
        },
      ],
    },
  },
  {
    levelNumber: 4,
    title: 'Emergency Funds',
    description: 'Build your safety buffer against unexpected life crises.',
    icon: 'ShieldCheck',
    lesson: {
      id: 'lvl4_l1',
      title: 'Creating Your Financial Shield',
      estTime: '5 min',
      xpReward: 50,
      content: [
        'An emergency fund is cash set aside only for unplanned events — medical bills, urgent repairs, or losing a source of income.',
        'It acts as a shield: when a crisis hits, you use your own money instead of borrowing at high interest.',
        'Start small (₱5,000 is a great first target), then build toward 3 to 6 months of essential expenses. Keep it somewhere safe and easy to access, like a savings account — not in stocks, which can drop right when you need the money.',
      ],
      example: {
        title: 'The Shield in Action',
        text: 'If your essential costs are ₱5,000 a month, a full emergency fund is ₱15,000–₱30,000 (3 to 6 months).',
      },
      keyTakeaways: [
        'Only for true emergencies',
        'Target 3–6 months of essentials',
        'Keep it safe and easy to access',
      ],
      questions: [
        {
          id: 'l4q1',
          question: 'What is the main purpose of an emergency fund?',
          options: [
            'To have extra money for high-risk trades.',
            'To cover unexpected expenses without going into debt.',
            'To earn the highest possible returns.',
            'To pay for planned vacations.',
          ],
          correctAnswer: 1,
          explanation:
            'An emergency fund protects you from borrowing when something unexpected happens. Returns are not its job — safety is.',
        },
        {
          id: 'l4q2',
          question: 'Your essential expenses are ₱6,000 a month. What is a fully funded emergency fund range?',
          options: ['₱6,000–₱12,000', '₱60,000–₱120,000', '₱18,000–₱36,000', '₱3,000–₱6,000'],
          correctAnswer: 2,
          explanation: '3 to 6 months × ₱6,000 = ₱18,000 to ₱36,000.',
        },
        {
          id: 'l4q3',
          question: 'Which of these is a valid use of an emergency fund?',
          options: [
            'Concert tickets that are about to sell out',
            'A sudden hospital bill',
            'A big sale on sneakers',
            'Buying a stock that is trending',
          ],
          correctAnswer: 1,
          explanation:
            'Only unplanned, necessary expenses qualify. Sales and events feel urgent, but they are wants.',
        },
        {
          id: 'l4q4',
          question: 'Where is the best place to keep your emergency fund?',
          options: [
            'A savings account you can access quickly',
            'Individual stocks for higher growth',
            'Lent out to a friend',
            'Cryptocurrency',
          ],
          correctAnswer: 0,
          explanation:
            'Emergency money must be safe and available immediately. Stocks and crypto can fall in value exactly when you need to withdraw.',
        },
      ],
    },
  },
  {
    levelNumber: 5,
    title: 'Financial Planning',
    description: 'Set S.M.A.R.T. savings targets for short- and long-term goals.',
    icon: 'Target',
    lesson: {
      id: 'lvl5_l1',
      title: 'Setting S.M.A.R.T. Goals',
      estTime: '4 min',
      xpReward: 50,
      content: [
        'Savings goals give your money direction. Vague plans like "save more" usually fail because there is no target and no deadline.',
        'S.M.A.R.T. goals are Specific, Measurable, Achievable, Relevant, and Time-bound. A clear amount and date tell you exactly how much to save each week or month.',
        'In Cbudget, building savings habits comes before investing — just like in real life, your foundation comes first.',
      ],
      example: {
        title: 'Vague vs. S.M.A.R.T.',
        text: 'Vague: "I want to save for a laptop." S.M.A.R.T.: "Save ₱20,000 for a laptop in 10 months by setting aside ₱2,000 every month."',
      },
      keyTakeaways: [
        'Specific amount + clear deadline',
        'Break it down into monthly targets',
        'Foundations first, investing second',
      ],
      questions: [
        {
          id: 'l5q1',
          question: 'Which of these is a S.M.A.R.T. savings goal?',
          options: [
            '"I want to save some money next month."',
            '"I want to be rich someday."',
            '"I will save as much as I can this year."',
            '"I will save ₱6,000 for an emergency fund by setting aside ₱50 a day for 120 days."',
          ],
          correctAnswer: 3,
          explanation:
            'It has a specific purpose, a measurable amount, a realistic daily target, and a clear timeframe.',
        },
        {
          id: 'l5q2',
          question: 'You want ₱9,000 for a new bike in 6 months. How much should you save each month?',
          options: ['₱1,000', '₱1,500', '₱2,000', '₱900'],
          correctAnswer: 1,
          explanation: '₱9,000 ÷ 6 months = ₱1,500 per month.',
        },
        {
          id: 'l5q3',
          question: 'In "Save ₱5,000 by December," which part makes the goal Time-bound?',
          options: ['"Save"', '"₱5,000"', '"by December"', 'None of it'],
          correctAnswer: 2,
          explanation: 'The deadline — "by December" — is what makes it time-bound. "₱5,000" makes it measurable.',
        },
        {
          id: 'l5q4',
          question: 'Your allowance is ₱3,000 a month. Which goal is the most Achievable?',
          options: [
            'Save ₱500 a month for 6 months',
            'Save ₱3,000 a month for a year',
            'Save ₱10,000 by next week',
            'Save ₱2,900 a month starting today',
          ],
          correctAnswer: 0,
          explanation:
            'Saving about 17% of your allowance is realistic. Saving all or nearly all of it leaves nothing for needs.',
        },
      ],
    },
  },
  {
    levelNumber: 6,
    title: 'Investment Fundamentals',
    description: 'Unlock compound interest and capital growth concepts.',
    icon: 'ChartLineUp',
    lesson: {
      id: 'lvl6_l1',
      title: 'The Compounding Machine',
      estTime: '5 min',
      xpReward: 50,
      content: [
        'Investing means putting money into assets with the goal of growing it over time. Unlike saving (which focuses on safety), investing takes controlled risks to beat inflation.',
        'Inflation slowly reduces what your money can buy. If prices rise 4% a year and your money earns 1%, you are actually losing purchasing power.',
        'Compound interest is earning returns on your original money plus the returns you already earned — "returns on returns." The earlier you start, the more time compounding has to work.',
      ],
      example: {
        title: 'The Power of Compounding',
        text: '₱1,000 at 10% per year becomes ₱1,100 after year 1. In year 2 you earn 10% on ₱1,100 (₱110), not just ₱100 — so you end with ₱1,210.',
      },
      keyTakeaways: [
        'Investing aims to beat inflation',
        'Compounding = returns on returns',
        'Time is your biggest advantage',
      ],
      questions: [
        {
          id: 'l6q1',
          question: 'How does compound interest grow wealth?',
          options: [
            'It pays you a fixed amount every day.',
            'You earn returns on both your original money and the returns already earned.',
            'It lowers the taxes on your investments.',
            'It guarantees you will never lose money.',
          ],
          correctAnswer: 1,
          explanation:
            'Each year\'s gains get added to your base, so the next year\'s return is calculated on a bigger amount.',
        },
        {
          id: 'l6q2',
          question: 'You invest ₱10,000 at 10% per year, compounded yearly. How much do you have after 2 years?',
          options: ['₱12,000', '₱11,000', '₱12,100', '₱20,000'],
          correctAnswer: 2,
          explanation: 'Year 1: ₱10,000 × 1.10 = ₱11,000. Year 2: ₱11,000 × 1.10 = ₱12,100.',
        },
        {
          id: 'l6q3',
          question: 'Your savings earn 1% a year while prices rise 4% a year. What is happening?',
          options: [
            'Your money is losing purchasing power.',
            'Your money is growing faster than prices.',
            'Nothing — the two cancel out.',
            'You are earning 5% in total.',
          ],
          correctAnswer: 0,
          explanation:
            'If prices rise faster than your money grows, each peso buys less over time. This is why investing matters for long-term goals.',
        },
        {
          id: 'l6q4',
          question: 'Using the Rule of 72, about how long does money take to double at 8% per year?',
          options: ['8 years', '72 years', '4 years', '9 years'],
          correctAnswer: 3,
          explanation: 'Divide 72 by the yearly return: 72 ÷ 8 = 9 years. It is a quick way to estimate doubling time.',
        },
      ],
    },
  },
  {
    levelNumber: 7,
    title: 'Risk Management',
    description: 'Assess your risk tolerance and the risk–return relationship.',
    icon: 'Scales',
    lesson: {
      id: 'lvl7_l1',
      title: 'The Risk–Return Tradeoff',
      estTime: '4 min',
      xpReward: 50,
      content: [
        'Every investment carries risk — the chance of losing some or all of your money, or of its value swinging up and down (volatility).',
        'The risk–return tradeoff says higher potential returns come with higher risk. Individual stocks can grow fast but also fall hard; government bonds and savings accounts grow slowly but are steadier.',
        'Your risk tolerance is how much of a drop you can handle without panicking. Your time horizon matters too: money you need soon belongs in safer assets, while long-term money can ride out ups and downs.',
      ],
      example: {
        title: 'Risk Tolerance Check',
        text: 'Your portfolio drops 20% in two weeks. Do you sell in panic, hold, or buy more? Knowing your answer before it happens prevents emotional mistakes.',
      },
      keyTakeaways: [
        'Higher return potential = higher risk',
        'Match risk to your time horizon',
        'Know your tolerance before markets drop',
      ],
      questions: [
        {
          id: 'l7q1',
          question: 'What is the relationship between risk and return?',
          options: [
            'Low-risk investments always give the highest returns.',
            'There is no relationship.',
            'Higher potential returns generally come with higher risk.',
            'Risk only matters for large investments.',
          ],
          correctAnswer: 2,
          explanation:
            'Investors expect to be paid more for accepting more uncertainty. There is no high return without risk.',
        },
        {
          id: 'l7q2',
          question: 'Which of these is typically the HIGHEST risk?',
          options: [
            'A bank savings account',
            'A single small tech company stock',
            'A government bond',
            'A diversified index fund',
          ],
          correctAnswer: 1,
          explanation:
            'A single small company can lose most of its value quickly. Index funds spread risk; bonds and savings accounts are steadier.',
        },
        {
          id: 'l7q3',
          question: 'You need ₱20,000 for tuition in 6 months. Where should that money go?',
          options: [
            'A safe, low-risk option like a savings account',
            'A volatile stock that might double',
            'Cryptocurrency',
            'Split it among trending stocks',
          ],
          correctAnswer: 0,
          explanation:
            'Short time horizon means no time to recover from a drop. Money needed soon should stay safe.',
        },
        {
          id: 'l7q4',
          question: 'Your long-term portfolio drops 15% in a market dip. What usually leads to worse results?',
          options: [
            'Reviewing why you invested in the first place',
            'Holding and sticking to your plan',
            'Continuing regular contributions',
            'Panic-selling everything at the bottom',
          ],
          correctAnswer: 3,
          explanation:
            'Selling in panic locks in the loss and often means missing the recovery. A plan made in calm times helps you stay steady.',
        },
      ],
    },
  },
  {
    levelNumber: 8,
    title: 'Diversification',
    description: 'Learn allocation strategies across different asset classes.',
    icon: 'ChartPie',
    lesson: {
      id: 'lvl8_l1',
      title: 'Spreading the Eggs',
      estTime: '5 min',
      xpReward: 50,
      content: [
        'Diversification means spreading your money across different investments so one bad performer cannot sink your whole portfolio.',
        'If 100% of your money is in one stock and it crashes, you lose big. Spread across index funds, bonds, and gold, the other assets cushion the blow.',
        'Over time, some assets grow faster than others and your mix drifts. Rebalancing — selling a bit of what grew and buying what lagged — brings you back to your target.',
      ],
      example: {
        title: 'A Diversified Mix',
        text: 'A sample allocation: 60% index fund (stocks), 30% bonds or gold, 10% cash. Each part reacts differently to the economy.',
      },
      keyTakeaways: [
        'Do not put all your eggs in one basket',
        'Mix assets that behave differently',
        'Rebalance when your mix drifts',
      ],
      questions: [
        {
          id: 'l8q1',
          question: 'What is the main goal of diversification?',
          options: [
            'To guarantee you never lose money.',
            'To reduce overall risk by spreading money across different assets.',
            'To make your portfolio harder to track.',
            'To only invest in the fastest-growing stock.',
          ],
          correctAnswer: 1,
          explanation:
            'Diversification reduces risk — it does not eliminate it. Losses in one area are softened by others.',
        },
        {
          id: 'l8q2',
          question: 'Which portfolio is the MOST diversified?',
          options: [
            '100% in one popular tech stock',
            '50% in two tech stocks, 50% in another tech stock',
            'A mix of a stock index fund, bonds, and some cash',
            '100% in cash under the mattress',
          ],
          correctAnswer: 2,
          explanation:
            'It spreads money across different asset types. Owning several stocks in the same industry is still concentrated.',
        },
        {
          id: 'l8q3',
          question: 'Why does an index fund help with diversification?',
          options: [
            'It holds many companies in a single investment.',
            'It only invests in one company.',
            'It never goes down in value.',
            'It is the same as a savings account.',
          ],
          correctAnswer: 0,
          explanation:
            'One index fund can hold hundreds of companies, so a single company failing has a small effect.',
        },
        {
          id: 'l8q4',
          question: 'Your target is 60% stocks / 40% bonds, but stocks grew and now you are at 70% / 30%. What does rebalancing mean?',
          options: [
            'Buying even more stocks since they are winning.',
            'Selling everything and starting over.',
            'Doing nothing ever again.',
            'Selling some stocks and buying bonds to get back to 60/40.',
          ],
          correctAnswer: 3,
          explanation:
            'Rebalancing restores your chosen risk level. Without it, your portfolio slowly becomes riskier than you planned.',
        },
      ],
    },
  },
  {
    levelNumber: 9,
    title: 'Long-Term Wealth Building',
    description: 'Develop patience, consistency, and discipline.',
    icon: 'Hourglass',
    lesson: {
      id: 'lvl9_l1',
      title: 'The Long-Term Horizon',
      estTime: '5 min',
      xpReward: 50,
      content: [
        'Wealth building is not about quick trades or timing the market. It is about consistency and time in the market.',
        'Dollar-cost averaging (DCA) means investing a fixed amount on a regular schedule. When prices are low you automatically buy more; when they are high you buy less.',
        'Watch out for high fees and hype. A 2% yearly fee can eat a large share of long-term growth, and "hot tips" on social media are often how beginners lose money.',
      ],
      example: {
        title: 'The Lifetime Compounder',
        text: 'Investing ₱1,000 monthly at 8% average growth for 30 years grows to roughly ₱1.49 million — even though you only put in ₱360,000.',
      },
      keyTakeaways: [
        'Time in the market beats timing it',
        'Invest a fixed amount regularly (DCA)',
        'Keep fees low and ignore the hype',
      ],
      questions: [
        {
          id: 'l9q1',
          question: 'What is the most effective mindset for long-term wealth?',
          options: [
            'Trading daily based on social media trends.',
            'Keeping all cash at home.',
            'Saving consistently, investing regularly, and letting compounding work over years.',
            'Waiting for the "perfect" time to invest.',
          ],
          correctAnswer: 2,
          explanation:
            'Consistency and patience beat trying to predict the market. Most wealth comes from time, not timing.',
        },
        {
          id: 'l9q2',
          question:
            'With DCA, you invest ₱1,000 when a fund costs ₱50 per share, and ₱1,000 the next month when it costs ₱25. What is your average cost per share?',
          options: ['₱37.50', '₱33.33', '₱25.00', '₱50.00'],
          correctAnswer: 1,
          explanation:
            'You bought 20 shares + 40 shares = 60 shares for ₱2,000. ₱2,000 ÷ 60 = ₱33.33 — lower than the simple average of the two prices.',
        },
        {
          id: 'l9q3',
          question: 'On ₱100,000 invested, how much more per year does a 2% fee cost than a 0.2% fee?',
          options: ['₱200', '₱2,000', '₱18', '₱1,800'],
          correctAnswer: 3,
          explanation: '2% = ₱2,000 and 0.2% = ₱200, so the higher fee costs ₱1,800 more every year — and that gap compounds.',
        },
        {
          id: 'l9q4',
          question: 'A post says a coin will "10× by next week, guaranteed!" What is the smartest response?',
          options: [
            'Be skeptical — guaranteed high returns are a classic red flag.',
            'Invest your emergency fund quickly before it is too late.',
            'Borrow money to buy more.',
            'Share it with friends so they can get in too.',
          ],
          correctAnswer: 0,
          explanation:
            'No legitimate investment guarantees huge, fast returns. Hype and urgency are common signs of scams or pump-and-dumps.',
        },
      ],
    },
  },
];

/** Returns a copy of the question with its options shuffled and `correctAnswer` remapped. */
export function shuffleQuestion(q: QuizQuestion): QuizQuestion {
  const order = q.options.map((_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return {
    ...q,
    options: order.map((i) => q.options[i]),
    correctAnswer: order.indexOf(q.correctAnswer),
  };
}
