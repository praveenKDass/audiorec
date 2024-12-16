import { NativeModules, Platform } from 'react-native';

const { DNDManagerModule } = NativeModules;

export const checkDNDPermission = async () => {
  if (Platform.OS !== 'android') return;

  try {
    const hasPermission = await DNDManagerModule.checkPermission();
    if (!hasPermission) {
      DNDManagerModule.requestPermission();
    }
  } catch (error) {
    console.error('Error checking permission:', error);
  }
};

export const setDNDMode = async (mode) => {
  if (Platform.OS !== 'android') return;

  try {
    const result = await DNDManagerModule.setDNDMode(mode);
    console.log(`DND Mode Set to ${mode}:`, result);
  } catch (error) {
    console.error('Error setting DND mode:', error);
  }
};

export const getDNDMode = async () => {
  if (Platform.OS !== 'android') return;

  try {
    const mode = await DNDManagerModule.getDNDMode();
    console.log('Current DND Mode:', mode);
  } catch (error) {
    console.error('Error getting DND mode:', error);
  }
};
