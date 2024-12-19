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

const ProfileScreen = () => {
  const [location, setLocation] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [formData, setFormData] = useState({
    userName: '',
    phoneNumber: '',
    secretCode: '',
    dropdownValue: 'Option 1',
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
    } else {
      return true;
    }
  };

  const checkLocationServices = () => {
    Geolocation.getCurrentPosition(
      (position) => {
        setLocation(position);
        setIsModalVisible(true);
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

  const handleButtonPress = async () => {
    const hasPermission = await requestLocationPermission();
    if (hasPermission) {
      checkLocationServices();
    } else {
      Alert.alert('Permission Denied', 'Location permission is required to proceed.');
    }
  };

  const handleInputChange = (key, value) => {
    setFormData({ ...formData, [key]: value });
  };

  const handleSubmit = () => {
    const dataToSubmit = {
      ...formData,
      location: location ? { lat: location.coords.latitude, lon: location.coords.longitude } : null,
    };
    Alert.alert('Data Submitted', JSON.stringify(dataToSubmit));
    setFormData({
      userName: '',
      phoneNumber: '',
      secretCode: '',
      dropdownValue: 'Option 1',
    })
    setIsModalVisible(false);
  };

  return (
    <View style={styles.container}>
      <Button title="OpenModal" onPress={handleButtonPress} />
      <Modal
        isVisible={isModalVisible}
        onBackdropPress={() => setIsModalVisible(false)}
        onBackButtonPress={() => setIsModalVisible(false)}
        style={styles.modalStyle}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.closeIcon}
            onPress={() => setIsModalVisible(false)}
          >
            <Text style={styles.closeIconText}>×</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>User Information</Text>
          <TextInput
            style={styles.input}
            placeholder="User Name"
            value={formData.userName}
            onChangeText={(text) => handleInputChange('userName', text)}
          />
          <TextInput
            style={styles.input}
            placeholder="Phone Number"
            value={formData.phoneNumber}
            onChangeText={(text) => handleInputChange('phoneNumber', text)}
            keyboardType="phone-pad"
          />
          <TextInput
            style={styles.input}
            placeholder="Secret Code"
            value={formData.secretCode}
            onChangeText={(text) => handleInputChange('secretCode', text)}
            keyboardType="number-pad"
          />
          <Text style={styles.dropdownLabel}>Select Option</Text>
          <View style={styles.dropdown}>
            <Text
              style={styles.dropdownItem}
              onPress={() => handleInputChange('dropdownValue', 'Option 1')}
            >
              Option 1
            </Text>
            <Text
              style={styles.dropdownItem}
              onPress={() => handleInputChange('dropdownValue', 'Option 2')}
            >
              Option 2
            </Text>
            <Text
              style={styles.dropdownItem}
              onPress={() => handleInputChange('dropdownValue', 'Option 3')}
            >
              Option 3
            </Text>
          </View>
          <Text>Selected: {formData.dropdownValue}</Text>
          <Button title="Submit" onPress={handleSubmit} />
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationText: {
    marginTop: 20,
    fontSize: 16,
  },
  modalStyle: {
    justifyContent: 'center',
    margin: 0,
  },
  modalContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    position: 'relative',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center', 
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 15,
    paddingHorizontal: 10,
    width: '100%', 
  },
  dropdownLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  dropdown: {
    borderWidth: 1,
    borderRadius: 5,
    borderColor: 'gray',
    marginBottom: 10,
    padding: 5,
    width: '100%',
  },
  dropdownItem: {
    paddingVertical: 5,
  },
  closeIcon: {
    position: 'absolute',
    top: 10,
    left: 10,
  },
  closeIconText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'black',
  },
});

export default ProfileScreen;
