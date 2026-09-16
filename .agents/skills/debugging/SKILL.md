---
name: debugging
description: Diagnostic runbook and debugging workflows for resolving Expo, React Native (Fabric/New Architecture), Metro bundler, native module, Zustand state hydration, and UI runtime errors in the walletly/cbudget codebase.
---

# Codebase Debugging Runbook for walletly / cbudget

Use this skill when investigating errors, crashes, bundling failures, or unexpected runtime behaviors in the application.

---

## 1. Quick Diagnostic Checklist

When an error or crash occurs, execute these verification commands in order:

```powershell
# 1. Check TypeScript compilation
npm run typecheck

# 2. Re-run custom postinstall patches (phosphor & async-storage)
node ./scripts/fix-phosphor.js

# 3. Clear Metro cache if bundling hangs or fails
npx expo start --clear
```

---

## 2. Metro Bundling & Package Resolution Errors

### Symptoms
- `Unable to resolve "<package-name>" from "src/..."`
- `Cannot find module '<package-name>'`
- Bundling hangs at `Android Bundling failed ... entry.js`

### Common Causes & Fixes
1. **NPM Package Omits `src/` but specifies `"react-native": "src/..."`**:
   - **Problem**: Libraries like `phosphor-react-native` declare `"react-native": "src/index.tsx"` in their `package.json`, but only distribute `lib/`. Metro prioritizes `"react-native"` and fails to find the missing source directory.
   - **Fix**: Check `metro.config.js`. Use `config.resolver.resolveRequest` to remap the module to its compiled entry point (e.g., `lib/module/index.js`), or run `node ./scripts/fix-phosphor.js`.
2. **Missing File Extensions in Imports**:
   - Ensure relative imports resolve correctly. Check `metro.config.js` and `tsconfig.json` paths.
3. **Stale Metro Cache**:
   - Run `npx expo start -c` to clear the bundler cache.

---

## 3. NativeModule is Null & TurboModule Linking Crashes

### Symptoms
- `ERROR [Error: [@RNC/AsyncStorage]: NativeModule: AsyncStorage is null]`
- `NativeModule: <Name> is null`
- App crashes immediately upon launch on Android or iOS (often in ReactFabric/TurboModules).

### Common Causes & Fixes
1. **Outdated Native Binary / Missing Native Link**:
   - The JavaScript bundle is trying to access a native module (e.g., SQLite, AsyncStorage, SecureStore) that was not compiled into the currently installed APK or dev client.
2. **Prevention in JS Layer**:
   - **Never** perform raw static imports of unlinked native modules at the top level of shared utility files (like `src/utils/storage.ts`).
   - Wrap dynamic module acquisition in `try / catch`:
     ```ts
     let nativeMod: any = null;
     try {
       const mod = require('native-library-name');
       nativeMod = mod?.default || mod;
     } catch (e) {
       console.warn('[ModuleName] Native module unavailable, using fallback:', e);
     }
     ```
   - Provide an in-memory `Map` or `expo-secure-store` fallback so the app continues running even if the native build lacks the library.
3. **To Rebuild Native Code**:
   - Run `npx expo run:android` (or `npx expo prebuild --clean`) to compile the native bindings into a fresh APK.

---

## 4. Expo Router: `Cannot read property 'ErrorBoundary' of undefined`

### Symptoms
- `ERROR [TypeError: Cannot read property 'ErrorBoundary' of undefined]`
- Occurs inside `useScreens.js` or `fromImport` in Expo Router.

### Root Cause
- This is **almost always a secondary symptom** caused by a preceding module evaluation error.
- If a route component or `_layout.tsx` crashes while executing its top-level imports (e.g., failed native module, missing export, syntax error), the module exports `undefined`. Expo Router attempts to access `Component.ErrorBoundary` on `undefined`, triggering this crash.

### How to Diagnose
1. Look at the **very first error** in the Metro console or terminal log before `ErrorBoundary`. That first error is the actual culprit.
2. Inspect the top-level imports in the screen or layout where the error originated.
3. Verify that the file has a valid `export default function ScreenName() { ... }`.

---

## 5. React Stale Closures & Timer Memory Leaks

### Symptoms
- Game scores, balances, or dividends reset to 0 upon round completion.
- Timers continue ticking after navigating back or unmounting.
- High CPU usage or multiple interval timers stacking up.

### Common Causes & Fixes
1. **`setInterval` Stale Closures**:
   - Callbacks inside `setInterval` or `setTimeout` capture the state from the render cycle where the interval was initialized.
   - **Fix**: Use React `useRef` for live values that timers must read (e.g. `totalDividendsRef`, `scoreRef`):
     ```ts
     const scoreRef = useRef(0);
     
     // Update both state and ref
     setScore((s) => {
       const next = s + 1;
       scoreRef.current = next;
       return next;
     });
     ```
2. **Timer Cleanup**:
   - Always clear timers in `useEffect` cleanup return:
     ```ts
     useEffect(() => {
       return () => {
         if (timerRef.current) clearInterval(timerRef.current);
       };
     }, []);
     ```

---

## 6. Zustand State Hydration & Persistence Bugs

### Symptoms
- Logged expenses, budget settings, or simulation cash vanish when the app is restarted.
- "Reset Data" or "Delete Account" appears to work, but old data reappears on app reload.

### Common Causes & Fixes
1. **Bypassing `persistState`**:
   - Calling raw `useGamificationStore.setState({ ... })` directly in UI components does **not** call `storage.setItem(...)`. On the next app launch, `hydrate()` reads the old data from storage and overwrites the state.
   - **Fix**: Always call defined store actions (e.g. `store.resetAllData()`, `store.addSimulationCash()`, `store.addExpense()`) which explicitly execute `persistState({ ...state, ...next })`.
2. **Storage Key Limits**:
   - On Android, `expo-secure-store` has a 2048-byte limit. Large state objects (`cbudget_gamification_state`) must use `AsyncStorage` (or the resilient fallback in `src/utils/storage.ts`), keeping `SecureStore` strictly for sensitive tokens (`cbudget_auth_token`).

---

## 7. Tamagui & React Native Styling Pitfalls

### Common Pitfalls
1. **Strict Shorthand Props**:
   - Tamagui throws TypeScript errors when passing custom hex strings or fonts to shorthand props (e.g., `backgroundColor={theme.primary}` or `fontFamily="Inter_700Bold"`).
   - **Fix**: Use the standard `style` prop:
     ```tsx
     <View style={{ backgroundColor: theme.primary, fontFamily: Fonts.bold }} />
     ```
2. **Unresponsive Pressables**:
   - Tamagui `View` does not reliably capture `onPress` events inside modal sheets or overlays.
   - **Fix**: Use React Native's `Pressable` or `TouchableOpacity` (or `InteractivePressable`).

---

## 8. Audio and Haptics Native Safety

### Common Pitfalls
- Calling `Haptics.impactAsync()` directly on Web or unsupported Android devices can throw unhandled exceptions.
- **Fix**: Always import and use `safeHaptic('light' | 'medium' | 'heavy' | 'success' | 'error')` from `@/utils/haptics`.
- Always wrap audio playback calls (`soundFX.play...()`) with internal try/catch so audio subsystem failures never crash the UI.
