import React from 'react';
import {
  Platform,
  Alert,
  Modal,
  View,
  Text,
  TouchableOpacity,
  NativeModules,
  Button
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { DNDManagerModule } = NativeModules;

// Component to handle the DND permission modal
export const DNDModalComponent = ({
  modal,
  setModal,
  dontShowAgain,
  setDontShowAgain,
}) => {
  const handleEnable = async () => {
    try {
      await DNDManagerModule.requestPermission();
      setModal(false);
    } catch (error) {
      console.error('Error requesting permission:', error);
      Alert.alert(
        'Permission Error',
        'Could not enable Do Not Disturb mode. Please check your device settings.',
      );
    }
  };

  const handleCancel = async () => {
    if (dontShowAgain) {
      await AsyncStorage.setItem('isDNDModalShow', "true");
      setModal(false);
    } else {
      await AsyncStorage.setItem('isDNDModalShow', "false");
      setModal(false);
    }
  };

  const handleOnPress = () => {
    setDontShowAgain(prev => !prev);
  };

  return (
    <View>
      <Modal
        transparent={true}
        visible={modal}
        animationType="slide"
        onRequestClose={() => setModal(false)} // Close modal when requested
      >
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <View
            style={{
              width: 300,
              padding: 20,
              backgroundColor: 'white',
              borderRadius: 10,
            }}
          >
            <Text>Enable Do Not Disturb</Text>
            <Text >
              Recording might be disturbed by calls and notifications. For
              better performance, please enable Do Not Disturb mode.
            </Text>
            <TouchableOpacity style={{marginVertical:5}}>
            <Text onPress={handleOnPress}>Don't show this again</Text>
            </TouchableOpacity>
            <Button title="Enable" onPress={handleEnable}>
=            </Button>
            <Button title='Cancel' onPress={handleCancel}>
=            </Button>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default DNDModalComponent;
