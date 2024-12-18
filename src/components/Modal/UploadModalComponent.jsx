import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const UploadAlert = ({ visible, onClose, recordingPath , setRecordings }) => {

  const updateIsuploadKey =  async (data) => {
    try {
      const recordings = await AsyncStorage.getItem('shikshachaupalrecording');
      const parsedItems = recordings ? JSON.parse(recordings) : [];
      let updatedRecordings = parsedItems.map((item) => item.id === data.id ? { ...item, isUploaded: true } : item);
      await AsyncStorage.setItem('shikshachaupalrecording', JSON.stringify(updatedRecordings));
      setRecordings(updatedRecordings)
    } catch (error) {
      console.error('Error upadteIsuploadKey item:', error);
      Alert.alert('Error', 'Failed to upadteIsuploadKey the Recording.');
    }
  }

  const handleUpload = async () => {
    try {
      const response = await axios.post('https://your-api-endpoint.com/upload', {
        file: recordingPath,
      });
      await updateIsuploadKey(recordingPath)
      console.log('Upload Success', response.data);
      alert('Recording uploaded successfully');
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload recording');
    }
    onClose();
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}>
      <View style={styles.modalContainer}>
        <View style={styles.alertBox}>
          <Text style={styles.titleText}>
            You are uploading the recording of evidence
          </Text>
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}>
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.uploadButton}
              onPress={handleUpload}>
              <Text style={styles.buttonText}>Upload</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default UploadAlert;

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  alertBox: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    width: 300,
    elevation: 5,
  },
  titleText: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  uploadButton: {
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    flex: 1,
    marginLeft: 5,
  },
  cancelButton: {
    backgroundColor: '#F44336',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    flex: 1,
    marginRight: 5,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
