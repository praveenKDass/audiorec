import React, { useState } from 'react';
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

const options = actions[0]?.OPTIONS || {};

const UserInformationModal = ({ isVisible, setIsVisible, onSubmit }) => {
  const [location, setLocation] = useState(null);
  const [formData, setFormData] = useState({
    userName: '',
    phoneNumber: '',
    dropdownValue: Object.values(options)[0] || '',
  });

  const requestLocationPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'We need access to your location to proceed.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
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
            'Location services are not enabled',
            'Please enable location services and try again.'
          );
        } else {
          Alert.alert('Error', 'Failed to get location');
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
      Alert.alert('Permission Denied', 'Location permission is required to proceed.');
    }

    const dataToSubmit = {
      ...formData,
      location: location
        ? { lat: location.coords.latitude, lon: location.coords.longitude }
        : null,
    };
    onSubmit(dataToSubmit);
    setFormData({
        userName: '',
        phoneNumber: '',
        dropdownValue: Object.values(options)[0] || '',
    })
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
        <Text style={styles.modalTitle}>User Information</Text>

        <TextInput
          style={styles.input}
          placeholder="Enter Your Name"
          placeholderTextColor="#666"
          value={formData.userName}
          onChangeText={(text) => handleInputChange('userName', text)}
        />

        <TextInput
          style={styles.input}
          placeholder="Enter Your Phone Number"
          placeholderTextColor="#666"
          value={formData.phoneNumber}
          onChangeText={(text) => handleInputChange('phoneNumber', text)}
          keyboardType="phone-pad"
        />

        <Text style={styles.dropdownLabel}>Select an Option</Text>
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
          <Text style={styles.submitButtonText}>Submit</Text>
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
    borderColor: '#8e44ad',
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
    borderColor: '#8e44ad',
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
    backgroundColor: '#d2b4de',
  },
  dropdownText: {
    color: '#555',
    fontSize: 16,
  },
  submitButton: {
    backgroundColor: '#8e44ad',
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
