import type { ExpoConfig } from 'expo/config';

/**
 * Example configuration. Merge it with what create-expo-app generated.
 * The share extension works only in a dev build (not in Expo Go).
 */
const config: ExpoConfig = {
  name: 'Job Copilot',
  slug: 'job-copilot',
  scheme: 'jobcopilot',
  version: '0.1.0',
  orientation: 'portrait',
  userInterfaceStyle: 'automatic',
  ios: {
    bundleIdentifier: 'com.example.jobcopilot', // CHANGE to your own
    supportsTablet: false,
  },
  android: {
    package: 'com.example.jobcopilot', // CHANGE to your own
  },
  plugins: [
    'expo-router',
    'expo-sqlite',
    ['expo-notifications', { color: '#2563eb' }],
    [
      'expo-share-intent',
      {
        iosActivationRules: { NSExtensionActivationSupportsWebURLWithMaxCount: 1, NSExtensionActivationSupportsText: true },
        androidIntentFilters: ['text/*'],
      },
    ],
  ],
  experiments: { typedRoutes: true },
};

export default config;
