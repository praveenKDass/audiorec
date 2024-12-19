import React, {useState, useEffect} from 'react';
import {
  View,
  TextInput,
  Text,
  PermissionsAndroid,
  Platform,
  Alert,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import Modal from 'react-native-modal';
import {useTranslation} from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {ACTION_OPTIONS, OPTIONS} from '../../constant/actionConstant';

const {width} = Dimensions.get('window');
const MODAL_WIDTH = Math.min(width * 0.9, 400); // Cap the width at 400 or 90% of screen width

const UserInformationModal = ({isVisible, setIsVisible, onSubmit}) => {
  const {t} = useTranslation();
  const [location, setLocation] = useState(null);
  const [formData, setFormData] = useState({
    userName: '',
    phoneNumber: '',
    selectedOptions: [],
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const jsonValue = await AsyncStorage.getItem('userDetails');
        if (jsonValue !== null) {
          const storedData = JSON.parse(jsonValue);
          setFormData({
            ...formData,
            ...storedData,
            selectedOptions: storedData.selectedOptions || [], // Ensure array exists
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
          },
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
      async position => {
        let updateLocation = await AsyncStorage.getItem('userDetails');
        let newUserInformation = updateLocation
          ? JSON.parse(updateLocation)
          : {};
        let updateData = {
          ...newUserInformation,
          location: {
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          },
        };
        let data = JSON.stringify(updateData);
        await AsyncStorage.setItem('userDetails', data);
        console.log('update data', await AsyncStorage.getItem('userDetails'));
      },
      error => {
        if (error.code === 2) {
          Alert.alert(
            t('LOCATION_SERVICES_NOT_ENABLED'),
            t('LOCATION_SERVICES_NOT_ENABLED_MSG'),
          );
        } else {
          Alert.alert('Error', t('FAILED_TO_GET_LOCATION'));
        }
      },
      {enableHighAccuracy: true, timeout: 15000, maximumAge: 10000},
    );
  };

  const handleInputChange = (key, value) => {
    setFormData({...formData, [key]: value});
  };

  const toggleOption = optionId => {
    setFormData(prevData => {
      const currentSelections = prevData.selectedOptions || [];
      const newSelections = currentSelections.includes(optionId)
        ? currentSelections.filter(id => id !== optionId)
        : [...currentSelections, optionId];

      return {
        ...prevData,
        selectedOptions: newSelections,
      };
    });
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.userName) {
      newErrors.userName = t('USER_NAME_REQUIRED');
    }
    if (!formData.phoneNumber) {
      newErrors.phoneNumber = t('PHONE_NUMBER_REQUIRED');
    }
    if (!formData.selectedOptions || formData.selectedOptions.length === 0) {
      newErrors.selectedOptions = t('SELECT_AN_OPTION_REQUIRED');
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    const hasPermission = await requestLocationPermission();
    if (hasPermission) {
      checkLocationServices();
    } else {
      Alert.alert(
        t('LOCATION_PERMISSION_DENIED'),
        t('LOCATION_PERMISSION_REQUIRED'),
      );
    }

    const dataToSubmit = {
      ...formData,
      location: location
        ? {lat: location.coords.latitude, lon: location.coords.longitude}
        : null,
    };
    console.log('DataToSubmit', dataToSubmit);
    onSubmit(dataToSubmit);
    const jsonValue = JSON.stringify(dataToSubmit);
    await AsyncStorage.setItem('userDetails', jsonValue);
  };

  const checkboxData = OPTIONS.map(option => ({
    id: option.id,
    label: t(option.key),
    value: option.id,
    selected: formData.selectedOptions?.includes(option.id),
  }));

  return (
    <Modal
      isVisible={isVisible}
      onBackdropPress={() => setIsVisible(false)}
      onBackButtonPress={() => setIsVisible(false)}
      style={styles.modalStyle}>
      <View style={styles.modalContainer}>
        <TouchableOpacity
          style={styles.closeIcon}
          onPress={() => setIsVisible(false)}>
          <Text style={styles.closeIconText}>×</Text>
        </TouchableOpacity>

        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{t('USER_INFORMATION')}</Text>

        <TextInput
          style={[styles.input, errors.userName && styles.inputError]}
          placeholder={t('ENTER_YOUR_NAME')}
          placeholderTextColor="#666"
          value={formData.userName}
          onChangeText={(text) => handleInputChange('userName', text)}
        />
        {errors.userName && <Text style={styles.errorText}>{errors.userName}</Text>}

          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, errors.phoneNumber && styles.inputError]}
              placeholder={t('ENTER_YOUR_PHONE_NUMBER')}
              placeholderTextColor="#666"
              value={formData.phoneNumber}
              onChangeText={text => handleInputChange('phoneNumber', text)}
              keyboardType="phone-pad"
            />
            {errors.phoneNumber && (
              <Text style={styles.errorText}>{errors.phoneNumber}</Text>
            )}
          </View>

        <Text style={styles.dropdownLabel}>{t('SELECT_OPTION')}</Text>
        <View style={styles.radioGroup}>
          {radioButtonsData.map((button) => (
            <TouchableOpacity
              key={button.id}
              style={styles.radioButtonContainer}
              onPress={() => handleInputChange('radioButtonsValue', button.value)}
            >
              <View
                style={[
                  styles.radioButton,
                  button.selected && styles.radioButtonSelected,
                ]}
              />
              <Text style={styles.radioButtonLabel}>{button.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        {errors.radioButtonsValue && <Text style={styles.errorText}>{errors.radioButtonsValue}</Text>}

          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitButtonText}>{t('START_RECORD')}</Text>
          </TouchableOpacity>
        </View>
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
    borderRadius: 15,
    alignSelf: 'center',
    width: MODAL_WIDTH,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  modalContent: {
    padding: 20,
    width: '100%',
  },
  closeIcon: {
    position: 'absolute',
    top: -10,
    right: 20,
    zIndex: 1,
  },
  closeIconText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#333',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
    textAlign: 'center',
  },
  inputContainer: {
    width: '100%',
    marginBottom: 15,
  },
  input: {
    height: 50,
    width: '100%',
    borderColor: '#2196F3',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  inputError: {
    borderColor: 'red',
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginTop: 5,
    textAlign: 'left',
  },
  dropdownLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 10,
    color: '#555',
    width: '100%',
  },
  checkboxGroup: {
    width: '100%',
    marginBottom: 20,
  },
  checkboxContainer: {
    flexDirection: 'row',
    marginBottom: 15,
    width: '100%',
  },
  checkboxWrapper: {
    paddingTop: 2,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#2196F3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#2196F3',
  },
  checkmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  labelContainer: {
    flex: 1,
    marginLeft: 10,
    marginRight: 10,
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#555',
    flexShrink: 1,
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
