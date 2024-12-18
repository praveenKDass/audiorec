import { NativeModules, Platform,Alert } from 'react-native';
const { DNDManagerModule } = NativeModules;



// Function to check and request DND permissions
export const checkDNDPermission = async () => {
  if (Platform.OS !== 'android') return;
  try {
    const hasPermission = await DNDManagerModule.checkPermission();
    return hasPermission
  } catch (error) {
    console.error('Error checking permission:', error);
    Alert.alert(
      'Permission Check Error',
      'An error occurred while checking Do Not Disturb permissions. Please try again later.'
    );
  }
};

export const setDNDMode = async (mode) => {
  const hasPermission = await DNDManagerModule.checkPermission();
  if (Platform.OS !== 'android' || !hasPermission) return ;

  try {
    const result = await DNDManagerModule.setDNDMode(mode);
  } catch (error) {
    console.error('Error setting DND mode:', error);
  }
};

export const getDNDMode = async () => {
  if (Platform.OS !== 'android') return;
  try {
    const mode = await DNDManagerModule.getDNDMode();
  } catch (error) {
    console.error('Error getting DND mode:', error);
  }
};
