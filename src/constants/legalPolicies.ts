/**
 * Centralized legal policy text constants for the Cbudget app.
 *
 * All policy text is maintained here so it can be reused across
 * registration consent, the profile Terms & Privacy modal, and
 * any future hosted web version.
 *
 * Update the EFFECTIVE_DATE whenever policy text is changed.
 */

// ── Policy metadata ─────────────────────────────────────────────────
export const POLICY_METADATA = {
  APP_NAME: 'Cbudget',
  COMPANY_NAME: 'Cbudget',
  EFFECTIVE_DATE: 'September 8, 2026',
  CONTACT_EMAIL: 'support@cbudget.app',
  /** Placeholder — replace with actual hosted URL when available */
  PRIVACY_POLICY_URL: 'https://cbudget.app/privacy',
  TERMS_URL: 'https://cbudget.app/terms',
  JURISDICTION: 'Republic of the Philippines',
  MINIMUM_AGE: 13,
  PARENTAL_CONSENT_AGE: 15,
} as const;

// ── Tab identifiers for the legal modal ──────────────────────────────
export type LegalTabId = 'terms' | 'privacy' | 'simulator' | 'rights';

export interface LegalTab {
  id: LegalTabId;
  label: string;
  icon: string; // Phosphor icon name
}

export const LEGAL_TABS: LegalTab[] = [
  { id: 'terms', label: 'Terms', icon: 'FileText' },
  { id: 'privacy', label: 'Privacy', icon: 'ShieldCheck' },
  { id: 'simulator', label: 'Simulator', icon: 'GameController' },
  { id: 'rights', label: 'Your Rights', icon: 'Scales' },
];

// ── Section structure ────────────────────────────────────────────────
export interface PolicySection {
  title: string;
  content: string;
  isWarning?: boolean;
}

// ── TERMS OF SERVICE ─────────────────────────────────────────────────
export const TERMS_OF_SERVICE: PolicySection[] = [
  {
    title: '1. Acceptance of Terms',
    content:
      `By creating an account, accessing, or using ${POLICY_METADATA.APP_NAME}, you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, do not use the application. If you are under ${POLICY_METADATA.PARENTAL_CONSENT_AGE} years old, you must have your parent or legal guardian's consent to use this app.`,
  },
  {
    title: '2. Eligibility',
    content:
      `You must be at least ${POLICY_METADATA.MINIMUM_AGE} years old to create an account. Users between ${POLICY_METADATA.MINIMUM_AGE} and ${POLICY_METADATA.PARENTAL_CONSENT_AGE} years old must obtain verifiable parental or guardian consent before registration. By using ${POLICY_METADATA.APP_NAME}, you represent and warrant that you meet these age requirements.`,
  },
  {
    title: '3. Educational Simulator Disclaimer',
    content:
      `${POLICY_METADATA.APP_NAME} is an educational simulator designed exclusively for financial literacy learning. All assets, balances, margins, stock holdings, cash balances, and transactions within the app are 100% virtual and simulated. No real currency, securities, or financial instruments are ever traded, transacted, transferred, or held within this application. The app is NOT a licensed financial institution, brokerage, bank, or investment platform.`,
  },
  {
    title: '4. No Financial Advice',
    content:
      'The educational content, learning modules, simulated portfolio performance, and financial literacy tools provided within this app are for informational and educational purposes only. They do not constitute professional financial advice, investment recommendations, tax guidance, or any form of regulated financial counsel. Always consult a certified financial planner, licensed broker, or qualified professional for real-life financial decisions.',
  },
  {
    title: '5. Account Responsibilities',
    content:
      'You are responsible for maintaining the confidentiality of your login credentials and for all activities that occur under your account. You agree to (a) provide accurate and complete registration information, (b) notify us immediately of any unauthorized use of your account, and (c) not share your account with other individuals.',
  },
  {
    title: '6. Gamification Elements',
    content:
      'XP points, levels, daily login streaks, financial health grades, sandbox titles (e.g., Smart Saver, Investment Explorer), achievements, and badges are game elements created solely to incentivize positive financial habit-building and educational engagement. They do not constitute any professional banking score, credit rating, financial certification, or real-world qualification. Scores, virtual balances, and gamification rewards cannot be transferred, gifted, sold, or traded between user accounts.',
  },
  {
    title: '7. Simulated Market Data',
    content:
      'All stock prices, market indices, portfolio valuations, dividends, and financial data displayed within the app are entirely fictional and generated for educational simulation purposes. They do not reflect real market conditions, real securities, or actual financial instruments. No correlation to real-world markets should be inferred.',
  },
  {
    title: '8. Intellectual Property',
    content:
      `All content, designs, trademarks, logos, educational materials, gamification systems, and software code within ${POLICY_METADATA.APP_NAME} are the intellectual property of ${POLICY_METADATA.COMPANY_NAME} and are protected by applicable copyright, trademark, and intellectual property laws. You may not copy, modify, distribute, sell, or lease any part of the application without prior written permission.`,
  },
  {
    title: '9. No Regulatory Affiliation',
    content:
      `${POLICY_METADATA.APP_NAME} is not affiliated with, endorsed by, or associated with the Securities and Exchange Commission (SEC), Bangko Sentral ng Pilipinas (BSP), Philippine Deposit Insurance Corporation (PDIC), or any other government financial regulatory body in any jurisdiction. The app operates independently as a private educational tool.`,
  },
  {
    title: '10. Limitation of Liability',
    content:
      `To the maximum extent permitted by applicable law, ${POLICY_METADATA.COMPANY_NAME} shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data, or goodwill, arising out of or related to your use of or inability to use the application. The application is provided on an "as is" and "as available" basis without warranties of any kind.`,
  },
  {
    title: '11. Termination',
    content:
      'We reserve the right to suspend or terminate your account at any time, with or without cause, and with or without notice. Upon termination, your right to use the app ceases immediately. You may also delete your account at any time through the app\'s Settings > Simulated Sandbox Account > Delete Sandbox Account option.',
  },
  {
    title: '12. Governing Law',
    content:
      `These Terms shall be governed by and construed in accordance with the laws of the ${POLICY_METADATA.JURISDICTION}, without regard to conflict of law principles. Any disputes arising under or in connection with these Terms shall be subject to the exclusive jurisdiction of the courts of the ${POLICY_METADATA.JURISDICTION}.`,
  },
  {
    title: '13. Changes to Terms',
    content:
      'We may update these Terms from time to time. We will notify users of material changes through in-app notifications or by updating the effective date. Your continued use of the app after such changes constitutes acceptance of the revised Terms.',
  },
  {
    title: '14. Contact',
    content:
      `For questions or concerns about these Terms, contact us at ${POLICY_METADATA.CONTACT_EMAIL}.`,
  },
];

// ── PRIVACY POLICY ───────────────────────────────────────────────────
export const PRIVACY_POLICY: PolicySection[] = [
  {
    title: '1. Introduction',
    content:
      `${POLICY_METADATA.COMPANY_NAME} ("we", "us", "our") respects your privacy and is committed to protecting the personal data we collect. This Privacy Policy explains what data we collect, how we use it, who we share it with, and your rights as a data subject under the Data Privacy Act of 2012 (Republic Act No. 10173) and other applicable laws.`,
  },
  {
    title: '2. Data We Collect',
    content:
      `We collect the following personal information:\n\n• Email Address — Required for account creation and authentication.\n• Password — Stored securely and hashed by our authentication provider (Supabase). We never have access to your plaintext password.\n• Nickname — A display name you choose during onboarding.\n• Avatar Preferences — Your selected emoji and color for profile customization.\n• Guardian Email — Optionally provided if you choose to link a parent or guardian.\n• Google Profile Data — If you sign in with Google, we receive your name and email address from Google's OAuth service.`,
  },
  {
    title: '3. Data We Do NOT Collect',
    content:
      'We do NOT collect your real name (unless provided via Google), phone number, physical address, financial account numbers, credit card information, government ID numbers, location data, device identifiers for advertising, or biometric data. All simulated financial data (budgets, portfolios, trades, XP) is stored locally on your device.',
  },
  {
    title: '4. How Data Is Stored',
    content:
      `Your data is stored in two locations:\n\n• On-Device Storage: Simulated financial data, learning progress, XP, achievements, avatar settings, and app preferences are stored locally using secure device storage (SecureStore for sensitive keys, AsyncStorage for general data). This data never leaves your device unless you explicitly use account features.\n\n• Cloud Storage (Supabase): Your authentication credentials (email, hashed password) and basic profile information are stored on Supabase's cloud infrastructure to enable account login across devices. Supabase servers are hosted securely and comply with industry-standard security practices.`,
  },
  {
    title: '5. Third-Party Data Processors',
    content:
      `We use the following third-party services that may process your data:\n\n• Supabase (auth.supabase.co) — Authentication and user profile storage. Supabase processes your email and hashed password.\n\n• Google Sign-In (Google LLC) — If you use Google Sign-In, Google provides us your name and email. Google's privacy policy applies to data processed by Google.\n\n• Expo Notifications (Expo/React Native) — If you enable push notifications, Expo's notification service may process a device push token. No personal data is included in notification payloads.\n\nWe do NOT use any analytics, advertising, or tracking SDKs. We do NOT sell, rent, or trade your personal data to any third party.`,
  },
  {
    title: '6. Purpose of Data Processing',
    content:
      `We process your personal data for the following legitimate purposes:\n\n• To create and manage your user account.\n• To authenticate your identity when logging in.\n• To personalize your learning experience (nickname, avatar).\n• To send optional progress reports to a linked guardian.\n• To send optional push notifications (streak reminders, weekly digests).\n• To enable account recovery via password reset email.`,
  },
  {
    title: '7. Children\'s Privacy',
    content:
      `${POLICY_METADATA.APP_NAME} is designed as an educational tool for teens and young adults. We take children's privacy seriously:\n\n• Users must be at least ${POLICY_METADATA.MINIMUM_AGE} years old to create an account.\n• Users under ${POLICY_METADATA.PARENTAL_CONSENT_AGE} should have parental or guardian consent.\n• We collect only the minimum data necessary for the app to function.\n• Parents or guardians can request access to, correction of, or deletion of their child's data at any time by contacting ${POLICY_METADATA.CONTACT_EMAIL}.\n• We comply with the Children's Online Privacy Protection Act (COPPA) for users in the United States and the relevant provisions of R.A. 10173 for users in the Philippines.`,
  },
  {
    title: '8. Data Retention',
    content:
      `We retain your account data for as long as your account is active. On-device data is stored until you reset or uninstall the app. If you delete your account through the app, we will:\n\n• Immediately remove your profile data from Supabase.\n• Clear all locally stored data from your device.\n• Delete your authentication record from our system.\n\nSome data may be retained in encrypted backups for up to 30 days for disaster recovery purposes before being permanently purged.`,
  },
  {
    title: '9. Data Security',
    content:
      'We implement appropriate technical and organizational measures to protect your personal data, including encrypted transmission (HTTPS/TLS), secure password hashing (bcrypt via Supabase Auth), encrypted on-device storage (SecureStore), and row-level security policies on our database.',
  },
  {
    title: '10. Push Notifications',
    content:
      'If you enable push notifications, we use Expo\'s notification service to deliver streak reminders, weekly summaries, and educational alerts. You can disable all notifications at any time through the app\'s Settings. No personal data is transmitted in notification content.',
  },
  {
    title: '11. International Privacy Compliance (GDPR)',
    content:
      `If you are located in the European Economic Area (EEA), United Kingdom, or Switzerland, you may have additional rights under the General Data Protection Regulation (GDPR). We process your data based on your explicit consent (given during registration) and the legitimate interest of providing the educational service. You have the right to access, rectify, erase, restrict, or port your data, and to withdraw consent at any time without affecting prior processing. To exercise these rights, contact ${POLICY_METADATA.CONTACT_EMAIL}. You may also lodge a complaint with your local Data Protection Authority.`,
  },
  {
    title: '12. California Privacy Rights (CCPA/CPRA)',
    content:
      `If you are a California resident, the California Consumer Privacy Act (CCPA) and the California Privacy Rights Act (CPRA) grant you specific rights regarding your personal information. You have the right to know what personal data we collect and why, to request deletion of your personal data, to opt out of the sale or sharing of personal data (we do NOT sell or share your data), and to not be discriminated against for exercising your privacy rights. To submit a verifiable consumer request, contact ${POLICY_METADATA.CONTACT_EMAIL}.`,
  },
  {
    title: '13. Changes to This Policy',
    content:
      'We may update this Privacy Policy from time to time. Material changes will be communicated through in-app notifications. We encourage you to review this policy periodically.',
  },
  {
    title: '14. Contact & Complaints',
    content:
      `If you have questions, concerns, or complaints about this Privacy Policy or our data practices, contact us at ${POLICY_METADATA.CONTACT_EMAIL}. You also have the right to file a complaint with the National Privacy Commission (NPC) of the Philippines if you believe your privacy rights have been violated.`,
  },
];

// ── SIMULATOR RULES ──────────────────────────────────────────────────
export const SIMULATOR_RULES: PolicySection[] = [
  {
    title: '1. Simulated Sandbox Agreement',
    content:
      `${POLICY_METADATA.APP_NAME} is an educational simulator for personal finance, budgeting, and stock trading. All assets, balances, margins, stock holdings, cash balances, and transactions are 100% virtual and simulated. No real currency is ever traded, transacted, or transferred within this application.`,
  },
  {
    title: '2. Virtual Currency',
    content:
      'The simulated Philippine Peso (₱), US Dollar ($), Euro (€), and British Pound (£) displayed in the app are fictional game currencies with no real-world monetary value. They cannot be exchanged, withdrawn, redeemed, or converted into real currency or any asset of value.',
  },
  {
    title: '3. Simulated Market Data',
    content:
      'All stock tickers, prices, dividends, market movements, and portfolio performances shown in the app are entirely fictional. They are generated algorithmically for educational purposes and bear no relation to actual securities traded on any real stock exchange (e.g., PSE, NYSE, NASDAQ).',
  },
  {
    title: '4. Gamification & Achievements',
    content:
      'XP points, levels, daily login streaks, financial health grades, and sandbox titles (e.g., Smart Saver, Investment Explorer) are game elements created solely to incentivize positive financial habit-building and educational course engagement. They do not constitute any professional banking score, credit rating, or real-world financial qualification.',
  },
  {
    title: '5. Premium Features',
    content:
      'Premium tier features (expanded simulator tools, advanced Investment Lab, etc.) are educational enhancements within the sandbox environment. Premium status does not grant access to real financial services, real investment accounts, or real monetary transactions.',
  },
  {
    title: '6. Data Reset',
    content:
      'You can reset your entire simulated sandbox data at any time from Settings. This will revert all budgets, portfolios, XP, achievements, and learning progress to their default state. This action is irreversible.',
  },
];

// ── DATA SUBJECT RIGHTS ──────────────────────────────────────────────
export const DATA_RIGHTS: PolicySection[] = [
  {
    title: '1. Right to Be Informed',
    content:
      'You have the right to be informed about the collection and use of your personal data. This Privacy Policy and Terms of Service serve as your notification of our data practices.',
  },
  {
    title: '2. Right to Access',
    content:
      `You have the right to access your personal data. You can view your profile information (name, email, avatar) directly in the app's Profile section. For a complete data export, contact ${POLICY_METADATA.CONTACT_EMAIL}.`,
  },
  {
    title: '3. Right to Correction',
    content:
      'You have the right to correct inaccurate personal data. You can edit your nickname, email, and avatar directly through the Edit Profile screen in the app.',
  },
  {
    title: '4. Right to Erasure (Deletion)',
    content:
      'You have the right to request deletion of your personal data. You can delete your account directly through the app: Profile > Simulated Sandbox Account > Delete Sandbox Account. This will permanently remove your profile from our servers and clear all local data.',
  },
  {
    title: '5. Right to Object',
    content:
      'You have the right to object to the processing of your personal data for specific purposes. You can disable push notifications, weekly reports, and guardian sharing at any time through the app\'s Settings.',
  },
  {
    title: '6. Right to Data Portability',
    content:
      `You have the right to request a copy of your personal data in a structured, commonly used, machine-readable format. Contact ${POLICY_METADATA.CONTACT_EMAIL} to request a data export.`,
  },
  {
    title: '7. Right to File a Complaint',
    content:
      'If you believe your data privacy rights have been violated, you may file a complaint with the National Privacy Commission (NPC) of the Philippines at complaints@privacy.gov.ph, or with the relevant data protection authority in your jurisdiction.',
  },
  {
    title: '8. Philippine Data Privacy Act (R.A. 10173)',
    content:
      `${POLICY_METADATA.APP_NAME} operates in compliance with the Philippine Data Privacy Act of 2012 and its Implementing Rules and Regulations. As the personal information controller, we are committed to ensuring that all personal data is collected, processed, stored, and disposed of in accordance with the principles of transparency, legitimate purpose, and proportionality.`,
  },
];

// ── Educational Disclaimer (standalone warning box) ──────────────────
export const EDUCATIONAL_DISCLAIMER: PolicySection = {
  title: '⚠️ Educational Disclaimer',
  content:
    'The content inside the learning modules is for educational guidance only and should not be considered professional financial advice. Always consult a certified financial planner for real-life investing.',
  isWarning: true,
};

// ── Mandatory pre-play disclaimer (blocking interstitial) ────────────
export const MANDATORY_DISCLAIMER: PolicySection = {
  title: 'IMPORTANT DISCLAIMER',
  content:
    `This app is a 100% gamified investment simulator intended solely for educational and entertainment purposes. All data, scores, portfolios, and virtual rewards have zero real-world value. Nothing inside this application constitutes professional financial, legal, or investment advice. Simulated performance does not guarantee real-world results. Play at your own risk.`,
  isWarning: true,
};

// ── Consent text for registration ────────────────────────────────────
export const CONSENT_TEXT = {
  TERMS_AGREE: `I agree to the Terms of Service and Privacy Policy`,
  AGE_CONFIRM: `I confirm that I am at least ${POLICY_METADATA.MINIMUM_AGE} years old, or I have parental/guardian consent to use this app`,
} as const;
