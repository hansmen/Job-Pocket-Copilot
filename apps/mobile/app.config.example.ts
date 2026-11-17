import type { ExpoConfig } from 'expo/config';

/**
 * Example configuration. Merge it with what create-expo-app generated.
 * The share extension works only in a dev build (not in Expo Go).
 */
const config: ExpoConfig = {
  name: 'Job Pocket Copilot',
  slug: 'job-pocket-copilot',
  scheme: 'jobpocketcopilot',
  version: '0.1.0',
  orientation: 'portrait',
  userInterfaceStyle: 'light',
  backgroundColor: '#ffffff',
  ios: {
    bundleIdentifier: 'com.example.jobpocketcopilot', // CHANGE to your own
    supportsTablet: false,
  },
  android: {
    package: 'com.example.jobpocketcopilot', // CHANGE to your own
  },
  plugins: [
    'expo-router',
    ['expo-status-bar', { style: 'dark' }],
    'expo-sqlite',
    ['expo-notifications', { color: '#2563eb' }],
    [
      'expo-share-intent',
      {
        iosActivationRules: {
          NSExtensionActivationSupportsWebURLWithMaxCount: 1,
          NSExtensionActivationSupportsText: true,
        },
        androidIntentFilters: ['text/*'],
      },
    ],
  ],
  experiments: { typedRoutes: true },
};

export default config;
