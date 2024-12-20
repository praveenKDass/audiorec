import React,{ useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useTranslation} from 'react-i18next';
// import NetInfo from '@react-native-community/netinfo';
import {audioService} from '../../services/api/audioService';
import { sortRecordings } from '../../services/utils/utils';

const UploadAlert = ({visible, onClose, recordingPath, setRecordings}) => {
  const {t} = useTranslation();
  const [loading, setLoading] = useState(false);
  const updateIsuploadKey = async data => {
    try {
      const recordings = await AsyncStorage.getItem('shikshachaupalrecording');
      const parsedItems = recordings ? JSON.parse(recordings) : [];
      let updatedRecordings = parsedItems.map(item =>
        item.id === data.id ? {...item, isUploaded: true} : item,
      );
      let sortRecord = sortRecordings(updatedRecordings)
      console.log(sortRecord,'sortRecord')
      await AsyncStorage.setItem(
        'shikshachaupalrecording',
        JSON.stringify(sortRecord),
      );

      setRecordings(sortRecord);
      Alert.alert(t('SUCCESS'),t('SUCCESS_UPLOAD_RECORD'))
    } catch (error) {
      console.error('Error upadteIsuploadKey item:', error);
      Alert.alert('Error', t('RECORD_UPLOAD_FAIL_MSG'));
    }
  };

  const handleUpload = async () => {
    setLoading(true);
    try {
      // First check internet connectivity
      // const networkState = await NetInfo.fetch();
      // console.log(networkState,"Status")
      // if (!networkState.isConnected) {
      //   // Handle no internet case
      //   Alert.alert(
      //     t('OFFLINE'),
      //     t('OFFLINE_MSG'),
      //   );
      //   return ;
      // }
      let userDetails = await AsyncStorage.getItem('userDetails');
      userDetails = JSON.parse(userDetails);
      console.log(userDetails);
      //  Get pre-signed URL
      const preSignedData = await audioService.getPreSignedUrl({
        fileName: recordingPath.path.split('/').pop(),
      });
      let signedUrl = preSignedData.result.signedUrl;
      let cloudPath = preSignedData.result.filePath;
      let destinationPath = preSignedData.result.destFilePath;
      let uploadAudioFile = await audioService.uploadFile(
        signedUrl,
        recordingPath.path.split('/').pop(),
      );
      let reqBody = {
        name: userDetails.userName,
        cloud_upload_path: cloudPath,
        phone: userDetails.phoneNumber,
        location: userDetails.location,
        type: userDetails.selectedOptions ,
      };
      let createRecord = await audioService.createAudioRecord(reqBody);
      if (createRecord.responseCode === "OK") {
        await updateIsuploadKey(recordingPath);
      } else {
        Alert.alert(
          t('UPLOAD_FAILED'),
          t('OFFLINE_MSG'),
        );
        return;
      }
    } catch (error) {
      console.error('Upload failed:', error);
    }
    setLoading(false);
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
          <Text style={styles.titleText}>{t('UPLOAD_EVIDENCE_RECORDING')}</Text>
          {/* Show loader when uploading */}
          {loading ? (
            <ActivityIndicator size="large" color="#0000ff" style={styles.loader} />
          ) : (
            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                <Text style={styles.buttonText}>{t('CANCEL')}</Text>
              </TouchableOpacity>

            <TouchableOpacity
              style={styles.uploadButton}
              onPress={handleUpload}>
              <Text style={styles.buttonText}>{t('UPLOAD')}</Text>
            </TouchableOpacity>
          </View>
          )}
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
  loader: {
    marginBottom: 20,
  },
});
