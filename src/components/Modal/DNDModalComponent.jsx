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
import { useTranslation } from 'react-i18next';

const { DNDManagerModule } = NativeModules;

// Component to handle the DND permission modal
export const DNDModalComponent = ({
  modal,
  setModal,
  dontShowAgain,
  setDontShowAgain,
}) => {
  const { t } = useTranslation();
  const handleEnable = async () => {
    try {
      await DNDManagerModule.requestPermission();
      setModal(false);
    } catch (error) {
      console.error('Error requesting permission:', error);
      Alert.alert(
        t('ENABLE_DND'),
        t('PERMISSION_ERROR')
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
            <Text>{t('ENABLE_DND')}</Text>
            <Text >{t('MODAL_DESCRIPTION')}</Text>
            <TouchableOpacity style={{marginVertical:5}}>
            <Text onPress={handleOnPress}>{t('DONT_SHOW_AGAIN')}</Text>
            </TouchableOpacity>
            <Button title={t('ENABLE')} onPress={handleEnable}>
=            </Button>
            <Button title={t('CANCEL')} onPress={handleCancel}>
=            </Button>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default DNDModalComponent;
