# 🏛️ CBudget (Walletly) System Architecture & Directory Guide

This document explains the technical architecture, folder organization, and design patterns used in the **CBudget** mobile application. Use this as your reference during your capstone defense, adviser consultations, and team onboarding.

---

## 1. 🌐 Where is the Frontend and Where is the Backend?

In modern mobile application development (specifically React Native with Backend-as-a-Service):

| System Role | Location in Project | Technology | What it Does |
|---|---|---|---|
| **Frontend (Client App)** | `src/` | React Native, Expo, Tamagui, TypeScript | The mobile application installed on the user's phone. Handles UI, animations, user input, offline storage, and interactive simulation games. |
| **Backend (Server & Database)** | `supabase/` + Supabase Cloud | PostgreSQL 15, Supabase Auth, Row-Level Security (RLS) | Cloud-hosted backend service. Manages encrypted user accounts, authentication tokens, cloud profile syncing, and database security. |
| **Frontend-Backend Bridge** | `src/utils/supabase.ts` | `@supabase/supabase-js` | The API client that sends secure HTTPS requests from the mobile app to the Supabase cloud backend. |

> [!NOTE]
> **Why is there no `backend/` Node.js server folder with Express?**  
> CBudget uses a **BaaS (Backend-as-a-Service)** architecture powered by Supabase. Instead of maintaining a custom Express.js server that can crash and requires server maintenance, Supabase provides an enterprise-grade cloud backend with built-in PostgreSQL, Auth, and automatic REST/WebSocket APIs guarded by Row-Level Security (RLS). The database structure and policies are fully documented in [`supabase/schema.sql`](file:///c:/Users/acer%20laptop/walletly/supabase/schema.sql).

---

## 2. 🧩 Does this follow OOP or Clean Architecture?

### ❌ It does NOT use classic class-based OOP (Object-Oriented Programming)
- **Why?** Since 2019 (React 16.8+), the entire React and React Native ecosystem moved away from OOP class components (`class Screen extends React.Component`) because classes in JavaScript introduce memory overhead, complex `this` binding bugs, and poor tree-shaking.
- **Paradigm Used:** **Functional Programming (FP) + Component-Driven Architecture**. Everything is built using pure functions, custom hooks (`useTheme`, `useFocusEffect`), and declarative UI components.

### ✅ It DOES follow Clean Architecture (Layered Architecture)
The codebase strictly adheres to **Clean Architecture** by separating concerns into distinct layers:

```
┌─────────────────────────────────────────────────────────────┐
│                    1. PRESENTATION LAYER                    │
│  • Screens & Navigation: src/app/ ((tabs), (auth), arcade)  │
│  • Reusable UI Widgets:  src/components/ui/                 │
│  • Feature Sections:     src/features/                      │
└──────────────────────────────┬──────────────────────────────┘
                               │ uses
┌──────────────────────────────▼──────────────────────────────┐
│             2. DOMAIN / APPLICATION LOGIC LAYER             │
│  • State Management: src/store/ (Zustand)                   │
│  • Gamification Engine: XP, Streaks, Score, Levels          │
│  • Financial Calculations: Budget monitoring, Allocations   │
└──────────────────────────────┬──────────────────────────────┘
                               │ calls
┌──────────────────────────────▼──────────────────────────────┐
│              3. DATA / INFRASTRUCTURE LAYER                │
│  • Cloud API & Auth:  src/utils/supabase.ts                 │
│  • Local Storage:     src/utils/storage.ts (AsyncStorage)   │
│  • Hardware Services: src/utils/haptics.ts, soundEffects.ts │
└──────────────────────────────┬──────────────────────────────┘
                               │ validates against
┌──────────────────────────────▼──────────────────────────────┐
│           4. CONTRACTS, VALIDATION & CONSTANTS              │
│  • Schema Validation: src/validation/ (Zod schemas)         │
│  • Theme & Design:    src/constants/theme.ts                │
│  • Legal Policies:    src/constants/legalPolicies.ts        │
└─────────────────────────────────────────────────────────────┘
```

### Layer Responsibilities

1. **Presentation Layer (`src/app/`, `src/components/`, `src/features/`)**:
   - Only responsible for rendering pixels, user interaction, and layout.
   - It **never** contains direct database queries or raw business rules. It simply reads state from the Domain Layer.

2. **Domain Layer (`src/store/`)**:
   - Implements business logic using **Zustand** stores (`budgetStore`, `savingsStore`, `investStore`, `gamificationStore`, `authStore`, `preferencesStore`).
   - Handles transactions, overspending formulas, investment price updates, and leveling algorithms.

3. **Data / Infrastructure Layer (`src/utils/`, `supabase/`)**:
   - Communicates with outside services: cloud database (`supabase.ts`), native device storage (`storage.ts`), and device haptics/audio.

4. **Contracts & Validation Layer (`src/validation/`, `src/types/`)**:
   - Defines strict TypeScript interfaces and Zod schemas to ensure malformed data never enters the system.

---

## 3. 📂 Why are the File Names Named Like That?

In Expo Router (the official React Native navigation system), file names have specific meanings:

| File / Folder Syntax | Meaning | Example in App | Why it's used |
|---|---|---|---|
| `(parentheses)` | **Route Group** | `src/app/(tabs)`, `src/app/(auth)` | Groups related screens together into a navigation stack **without adding the folder name to the URL path**. For example, `(auth)/login.tsx` opens at `/login`, NOT `/(auth)/login`. |
| `_layout.tsx` | **Layout Shell** | `src/app/_layout.tsx`, `(tabs)/_layout.tsx` | Wraps all screens inside that folder. In `(tabs)/_layout.tsx`, it defines the bottom navigation tab bar that stays visible across tabs. |
| `index.tsx` | **Default Screen** | `src/app/(tabs)/index.tsx` | The root screen for that route. `(tabs)/index.tsx` is the Home/Dashboard tab. |
| `[brackets].tsx` | **Dynamic Route** | `[id].tsx` *(if used)* | Accepts URL parameters, like `user/123`. |

---

## 4. 🗂️ Clean Project Directory Tree

Here is your cleaned directory structure:

```text
walletly/
├── supabase/                          # ☁️ BACKEND DATABASE
│   └── schema.sql                     # PostgreSQL schema, tables & RLS policies
│
├── src/                               # 📱 MOBILE FRONTEND
│   ├── app/                           # Navigation Screens (Expo Router)
│   │   ├── (auth)/                    # Authentication flow (login, register, forgot-pw)
│   │   ├── (onboarding)/              # First-time user intro wizard
│   │   ├── (tabs)/                    # Main bottom-tab screens (Home, Budget, Invest, Learn, Profile)
│   │   ├── auth/callback.tsx          # OAuth / Google Sign-In redirect handler
│   │   ├── arcade.tsx                 # Financial Arcade hub
│   │   ├── crypto-rocket.tsx          # Minigame: Market volatility trading
│   │   ├── dividend-snowball.tsx      # Minigame: Compound interest visualization
│   │   ├── headline-trader.tsx        # Minigame: News & market sentiment simulator
│   │   ├── invest-details.tsx         # Detailed stock simulator sheet
│   │   ├── licenses.tsx               # Open source license notices
│   │   └── portfolio-balancer.tsx     # Asset diversification lab
│   │
│   ├── components/                    # REUSABLE PRESENTATION
│   │   └── ui/                        # Core design system (Buttons, Cards, Inputs, Modals, Mascot)
│   │
│   ├── features/                      # FEATURE-SPECIFIC SLICES
│   │   ├── arcade/                    # Arcade game components
│   │   ├── dashboard/                 # Home dashboard components & charts
│   │   ├── invest/                    # Investment charts & trading sheets
│   │   └── profile/                   # Settings, theme picker & guardian email components
│   │
│   ├── store/                         # 🧠 DOMAIN BUSINESS LOGIC (Zustand)
│   │   ├── authStore.ts               # User sessions & login state
│   │   ├── budgetStore.ts             # Budget tracking & overspending detection
│   │   ├── gamificationStore.ts       # XP, streaks, levels, financial health score
│   │   ├── investStore.ts             # Simulated stocks, prices & portfolio
│   │   ├── preferencesStore.ts        # Theme, sound effects & guardian email sync
│   │   ├── savingsStore.ts            # Custom savings goals & tracking
│   │   └── toastStore.ts              # In-app notification banners
│   │
│   ├── utils/                         # 🔌 DATA & INFRASTRUCTURE
│   │   ├── supabase.ts                # Supabase cloud backend client
│   │   ├── storage.ts                 # Persistent AsyncStorage helper
│   │   ├── haptics.ts                 # Device vibration feedback
│   │   ├── soundEffects.ts            # Audio SFX feedback
│   │   └── currency.ts                # Multi-currency formatting
│   │
│   ├── constants/                     # APP CONSTANTS
│   │   ├── theme.ts                   # Colors, typography & spacing
│   │   ├── assets.ts                  # Stock tickers & market assets
│   │   ├── legalPolicies.ts           # Terms of service, privacy & COPPA disclaimers
│   │   └── gameHeadlines.ts           # News headlines for simulator
│   │
│   └── validation/                    # 🛡️ CONTRACT VALIDATION
│       └── auth.schema.ts             # Zod validation schemas for forms
│
├── assets/                            # Static images, icons & Lottie animations
├── android/                           # Android native build project
├── app.json                           # Expo application manifest
├── eas.json                           # Cloud build configuration (APK / AAB)
├── package.json                       # Project dependencies
└── tsconfig.json                      # TypeScript strict compiler config
```

---

## 5. 🎓 Capstone Defense Cheat-Sheet: How to Answer the Panel

| Common Panel Question | Recommended Answer |
|---|---|
| **"Where is your backend folder?"** | *"Our application uses a modern **Backend-as-a-Service (BaaS)** architecture powered by Supabase (PostgreSQL). All server-side data models, table relations, and Row-Level Security (RLS) policies are managed in our cloud database and version-controlled under `supabase/schema.sql`. The mobile app in `src/` acts as the secure client interfacing through encrypted HTTPS REST APIs."* |
| **"Does this follow Object-Oriented Programming (OOP)?"** | *"No, modern React Native applications follow **Functional Programming (FP) and Component-Driven Architecture**. Instead of stateful classes that cause memory bloat and difficult lifecycle bugs, we use pure functional components, custom hooks, and unidirectional data stores. However, the system strictly follows **Clean Architecture** principles by cleanly decoupling Presentation, Domain Business Logic, and Data Access layers."* |
| **"Why do some folders have parentheses like `(tabs)`?"** | *"Parentheses denote **Route Groups** in Expo Router. They allow us to structure related screens into separate stacks (like authenticated screens vs onboarding screens) without adding artificial segments to the route URL."* |
| **"How is business logic separated from the UI?"** | *"All calculations (such as overspending detection, compound dividend math, level upgrades, and streak protections) are encapsulated inside the Domain Layer (`src/store/`). The presentation components only listen to state changes and never manipulate raw database logic directly."* |
