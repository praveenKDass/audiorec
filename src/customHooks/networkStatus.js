import { useState, useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';

/**
 * Custom hook to monitor network online/offline status
 * @returns {boolean} - True if the device is online, false otherwise
 */
const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(true);  // Default state to online

  useEffect(() => {
    // Function to handle online status
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected);  // Update the state based on the network status
    });

    // Cleanup function to remove the listener when component unmounts
    return () => unsubscribe();
  }, []);

  return isOnline;
};

export default useNetworkStatus;
