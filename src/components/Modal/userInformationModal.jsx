import React, { useState ,useEffect} from 'react';
import {
  View,
  Button,
  TextInput,
  Text,
  PermissionsAndroid,
  Platform,
  Alert,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import Modal from 'react-native-modal';
import { actions } from '../../constant/actionConstant';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
const options = actions[0]?.OPTIONS || {};

const UserInformationModal = ({ isVisible, setIsVisible, onSubmit }) => {
  const { t } = useTranslation();
  const [location, setLocation] = useState(null);
  const [formData, setFormData] = useState({
    userName: '',
    phoneNumber: '',
    dropdownValue: Object.values(options)[0] || '',
  });
  // get userDetails if its already present in the local storage
  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const jsonValue = await AsyncStorage.getItem('userDetails');
        if (jsonValue !== null) {
          const storedData = JSON.parse(jsonValue);
          setFormData({
            ...formData,
            ...storedData,
          });
        }
      } catch (error) {
        console.error('Error fetching user details from AsyncStorage', error);
      }
    };

    fetchUserDetails();
  }, []); 
  const requestLocationPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: t('LOCATION_PERMISSION'),
            message: t('LOCATION_PERMISSION_MSG'),
            buttonNeutral: t('ASK_ME_LATER'),
            buttonNegative: t('CANCEL'),
            buttonPositive: t('OK'),
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true;
  };

  const checkLocationServices = () => {
    Geolocation.getCurrentPosition(
      (position) => {
        console.log('Position:', position);
        setLocation(position);
      },
      (error) => {
        if (error.code === 2) {
          Alert.alert(
            t('LOCATION_SERVICES_NOT_ENABLED'),
          t('LOCATION_SERVICES_NOT_ENABLED_MSG')
          );
        } else {
          Alert.alert('Error', t('FAILED_TO_GET_LOCATION'));
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  };

  const handleInputChange = (key, value) => {
    setFormData({ ...formData, [key]: value });
  };

  const handleSubmit = async () => {
    const hasPermission = await requestLocationPermission();
    if (hasPermission) {
      checkLocationServices();
    } else {
      Alert.alert(t('LOCATION_PERMISSION_DENIED'), t('LOCATION_PERMISSION_REQUIRED'));
    }

    const dataToSubmit = {
      ...formData,
      location: location
        ? { lat: location.coords.latitude, lon: location.coords.longitude }
        : null,
    };
    onSubmit(dataToSubmit);
    const jsonValue = JSON.stringify(dataToSubmit);
    await AsyncStorage.setItem('userDetails', jsonValue);
    // setFormData({
    //     userName: '',
    //     phoneNumber: '',
    //     dropdownValue: Object.values(options)[0] || '',
    // })
  };

  return (
    <Modal
      isVisible={isVisible}
      onBackdropPress={() => setIsVisible(false)}
      onBackButtonPress={() => setIsVisible(false)}
      style={styles.modalStyle}
    >
      <View style={styles.modalContainer}>
        <TouchableOpacity
          style={styles.closeIcon}
          onPress={() => setIsVisible(false)}
        >
          <Text style={styles.closeIconText}>×</Text>
        </TouchableOpacity>
        <Text style={styles.modalTitle}>{t('USER_INFORMATION')}</Text>

        <TextInput
          style={styles.input}
          placeholder={t('ENTER_YOUR_NAME')}
          placeholderTextColor="#666"
          value={formData.userName}
          onChangeText={(text) => handleInputChange('userName', text)}
        />

        <TextInput
          style={styles.input}
          placeholder={t('ENTER_YOUR_PHONE_NUMBER')}
          placeholderTextColor="#666"
          value={formData.phoneNumber}
          onChangeText={(text) => handleInputChange('phoneNumber', text)}
          keyboardType="phone-pad"
        />

        <Text style={styles.dropdownLabel}>{t('SELECT_AN_OPTION')}</Text>
        <View style={styles.dropdown}>
          {Object.entries(options).map(([key, value]) => (
            <TouchableOpacity
              key={key}
              style={[
                styles.dropdownItem,
                formData.dropdownValue === value && styles.selectedItem,
              ]}
              onPress={() => handleInputChange('dropdownValue', value)}
            >
              <Text style={styles.dropdownText}>{value}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>{t('SUBMIT')}</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalStyle: {
    justifyContent: 'center',
    margin: 0,
  },
  modalContainer: {
    backgroundColor: '#fdfdfd',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  closeIcon: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  closeIconText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  input: {
    height: 50,
    width: '100%',
    borderColor: '#2196F3',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 15,
    paddingHorizontal: 10,
    fontSize: 16,
  },
  dropdownLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 5,
    color: '#555',
  },
  dropdown: {
    borderWidth: 1,
    borderColor: '#2196F3',
    borderRadius: 8,
    width: '100%',
    paddingVertical: 5,
    marginBottom: 20,
  },
  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 3,
    borderRadius: 5,
  },
  selectedItem: {
    backgroundColor: '#2196F3',
  },
  dropdownText: {
    color: '#555',
    fontSize: 16,
  },
  submitButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    width: '100%',
  },
  submitButtonText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default UserInformationModal;
