// Mock Environment Variables
process.env.EXPO_PUBLIC_FINNHUB_API_KEY = 'test_finnhub_key';
process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://gvridjyyjcvdniwqyjnu.supabase.co';
process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = 'mock-anon-key';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => {
  let store: Record<string, string> = {};
  return {
    __esModule: true,
    default: {
      getItem: jest.fn(async (key: string) => store[key] ?? null),
      setItem: jest.fn(async (key: string, val: string) => {
        store[key] = String(val);
      }),
      removeItem: jest.fn(async (key: string) => {
        delete store[key];
      }),
      clear: jest.fn(async () => {
        store = {};
      }),
      getAllKeys: jest.fn(async () => Object.keys(store)),
      multiGet: jest.fn(async (keys: string[]) => keys.map((k) => [k, store[k] ?? null])),
      multiSet: jest.fn(async (entries: [string, string][]) => {
        entries.forEach(([k, v]) => {
          store[k] = String(v);
        });
      }),
      multiRemove: jest.fn(async (keys: string[]) => {
        keys.forEach((k) => delete store[k]);
      }),
    },
    getItem: jest.fn(async (key: string) => store[key] ?? null),
    setItem: jest.fn(async (key: string, val: string) => {
      store[key] = String(val);
    }),
    removeItem: jest.fn(async (key: string) => {
      delete store[key];
    }),
    clear: jest.fn(async () => {
      store = {};
    }),
    getAllKeys: jest.fn(async () => Object.keys(store)),
  };
});

// Mock SecureStore
jest.mock('expo-secure-store', () => {
  let secureStore: Record<string, string> = {};
  return {
    getItemAsync: jest.fn(async (key: string) => secureStore[key] ?? null),
    setItemAsync: jest.fn(async (key: string, val: string) => {
      secureStore[key] = String(val);
    }),
    deleteItemAsync: jest.fn(async (key: string) => {
      delete secureStore[key];
    }),
    WHEN_UNLOCKED: 'WHEN_UNLOCKED',
    AFTER_FIRST_UNLOCK: 'AFTER_FIRST_UNLOCK',
    ALWAYS: 'ALWAYS',
  };
});

// Mock expo-haptics
jest.mock('expo-haptics', () => ({
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
    Heavy: 'heavy',
  },
  NotificationFeedbackType: {
    Success: 'success',
    Warning: 'warning',
    Error: 'error',
  },
  impactAsync: jest.fn().mockResolvedValue(undefined),
  notificationAsync: jest.fn().mockResolvedValue(undefined),
  selectionAsync: jest.fn().mockResolvedValue(undefined),
}));

// Mock expo-audio
jest.mock('expo-audio', () => ({
  createAudioPlayer: jest.fn(() => ({
    play: jest.fn(),
    pause: jest.fn(),
    seekTo: jest.fn(),
    remove: jest.fn(),
  })),
}));

// Mock expo-notifications
jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  setNotificationChannelAsync: jest.fn().mockResolvedValue(undefined),
  getPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  requestPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  getExpoPushTokenAsync: jest.fn().mockResolvedValue({ data: 'mock-expo-push-token' }),
  scheduleNotificationAsync: jest.fn().mockResolvedValue('mock-notification-id'),
  cancelScheduledNotificationAsync: jest.fn().mockResolvedValue(undefined),
  cancelAllScheduledNotificationsAsync: jest.fn().mockResolvedValue(undefined),
  AndroidImportance: { MAX: 5, HIGH: 4, DEFAULT: 3 },
  AndroidNotificationVisibility: { PUBLIC: 1 },
  AndroidNotificationPriority: { MAX: 'max', HIGH: 'high' },
  SchedulableTriggerInputTypes: {
    TIME_INTERVAL: 'timeInterval',
    DAILY: 'daily',
    WEEKLY: 'weekly',
  },
}));

// Mock expo-device
jest.mock('expo-device', () => ({
  isDevice: true,
}));

// Mock expo-constants
jest.mock('expo-constants', () => ({
  appOwnership: 'standalone',
  expoConfig: {
    extra: {
      eas: {
        projectId: 'test-project-id',
      },
    },
  },
  easConfig: {
    projectId: 'test-project-id',
  },
}));

// Mock expo-sqlite
jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn(async () => ({
    execAsync: jest.fn().mockResolvedValue(undefined),
    runAsync: jest.fn().mockResolvedValue({ changes: 1, lastInsertRowId: 1 }),
    getFirstAsync: jest.fn().mockResolvedValue(null),
    getAllAsync: jest.fn().mockResolvedValue([]),
    withTransactionAsync: jest.fn(async (cb: () => Promise<unknown>) => cb()),
  })),
}));

// Mock @react-native-google-signin/google-signin
jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: {
    configure: jest.fn(),
    hasPlayServices: jest.fn().mockResolvedValue(true),
    signIn: jest.fn().mockResolvedValue({ data: { idToken: 'mock-google-id-token' } }),
    signOut: jest.fn().mockResolvedValue(undefined),
    isSignedIn: jest.fn().mockResolvedValue(false),
  },
  statusCodes: {
    SIGN_IN_CANCELLED: 'SIGN_IN_CANCELLED',
    IN_PROGRESS: 'IN_PROGRESS',
    PLAY_SERVICES_NOT_AVAILABLE: 'PLAY_SERVICES_NOT_AVAILABLE',
  },
}));

// Silence React Native Alert and Linking in tests
const ReactNative = require('react-native');
if (ReactNative.Alert) {
  jest.spyOn(ReactNative.Alert, 'alert').mockImplementation(() => {});
}
if (ReactNative.Linking) {
  jest.spyOn(ReactNative.Linking, 'openURL').mockImplementation(async () => true);
  jest.spyOn(ReactNative.Linking, 'canOpenURL').mockImplementation(async () => true);
}
