---
name: Clean Code Conventions
description: Follow these conventions to avoid common anti-patterns, memory leaks, and silent errors in the walletly/cbudget codebase.
---

# Clean Code Conventions for walletly / cbudget

When modifying or creating code in this repository, strictly adhere to the following guidelines based on past codebase audits:

## 1. Avoid Magic Strings
- Do not hardcode repeated strings (e.g., storage keys like `'cbudget_auth_token'`, `'cbudget_user'`).
- Extract them into well-named constants at the top of the file or in a dedicated constants file.

## 2. Clean Up Event Listeners
- Whenever registering an event listener (like Supabase's `onAuthStateChange`), **always** store the returned subscription.
- Ensure the subscription is properly unsubscribed before re-registering or when the component/store unmounts or re-hydrates to prevent memory leaks and duplicate triggers.

## 3. No Silent `catch` Blocks
- Empty catch blocks `catch (e) {}` hide critical failures (like JSON parsing or SecureStore errors) and make debugging impossible.
- At a minimum, use `console.warn` or `console.error` to log the failure, including a descriptive message and the error object itself.

## 4. Proper Pressable Components
- Tamagui's `View` component does not reliably support `onPress` in all contexts (e.g., overlays).
- Always use React Native's `Pressable` or `TouchableOpacity` when you need an element to be interactive and respond to press events.

## 5. Avoid `any` Type Casting
- Refrain from bypassing TypeScript's strict mode with `as any`.
- Create proper interfaces or type definitions. If the type is truly unknown at runtime, use the `unknown` type and perform type checking/narrowing instead.

## 6. Tamagui Strict Typing
- Tamagui throws TypeScript errors when you pass generic strings to shorthand props (e.g., `backgroundColor={theme.primary}` or `fontFamily="Inter_700Bold"`).
- **Rule:** If you must pass a raw hex string or a custom font literal, do **not** use the shorthand prop. Instead, use React Native's `style` prop: `style={{ backgroundColor: theme.primary }}`. 

## 7. Decompose Large Monoliths
- Avoid creating files that grow excessively large (e.g., over 500 lines) by putting too many distinct responsibilities (like multiple UI tabs, complex onboarding wizards, and many modals) into one file.
- Break down monolithic components into smaller, focused, and reusable components.
