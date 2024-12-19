import {StyleSheet, Text, View,Button} from 'react-native';
import React, { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import UploadAlert from '../Modal/UploadModalComponent';
import { useTranslation } from 'react-i18next';
const Card = ({item,setRecordings}) => {
  const [uploadModal, setuploadModal] = useState(false);
const navigation = useNavigation()
const { t } = useTranslation();
//Function to delete the recording from the local storage
const deleteRecording = async (recording) => {
  let id = recording.id
  Alert.alert(
    t('CONFIRM_DELETE'),
    recording.isUploaded
    ? t('CONFIRM_DELETE_SUCCESS_MSG')
    : t('CONFIRM_DETELE_FAIL_MSG'),
    [
      {
        text: t('CANCEL'),
        style: 'cancel',
      },
      {
        text: t('DELETE'),
        style: 'destructive',
        onPress: async () => {
          try {
            // Retrieve all stored recordings
            const recordings = await AsyncStorage.getItem('shikshachaupalrecording');
            const parsedItems = recordings ? JSON.parse(recordings) : [];
            // Filter out the recordings to be deleted
            let updatedRecordings = parsedItems.filter((item) => item.id !== id);
            // Save updated list back to AsyncStorage
            await AsyncStorage.setItem('shikshachaupalrecording', JSON.stringify(updatedRecordings));
            setRecordings(updatedRecordings)
            Alert.alert(t('SUCCESS_DELETE'));
          } catch (error) {
            console.error('Error removing item:', error);
            Alert.alert(t('ERROR_DETELE'));
          }
        },
      },
    ]
  );
};

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.infoContainer}>
          <Text style={styles.recordingText}>
          {t('RECORD_ID')} {item.id}
          </Text>
          <Text style={styles.durationText}>
          {t('DURATION')}{item.duration}
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          <View style={styles.buttonWrapper}>
            <Button
              title={t('PLAY')}
              onPress={() => navigation.navigate('Audio', { data: item })}
            />
          </View>
          <View style={styles.buttonWrapper}>
            <Button
              title={t('DELETE')}
              color="#F44336"
              onPress={()=>deleteRecording(item)}
            />
          </View>
          {item.isUploaded ? (
            <View style={styles.uploadSuccessContainer}>
              <Text style={styles.uploadSuccessText}>{t('UPLOAD_SUCCESS')}</Text>
            </View>
          ) : (
            <View style={styles.buttonWrapper}>
              <Button
                title={t('UPLOAD')}
                color="#4CAF50"
                onPress={() => setuploadModal(true)}
              />
            </View>
          )}
           <UploadAlert
          visible={uploadModal}
          onClose={() => setuploadModal(false)}
          recordingPath={item}
          setRecordings={setRecordings}
        />
        </View>
      </View>
    </View>
  );
};

export default Card;

const styles = StyleSheet.create({
  container:{
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  card:{
    backgroundColor: 'rgba(240, 248, 255, 0.9)',
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
    padding: 15,
    marginBottom: 10,
  },
  infoContainer: {
    marginBottom: 10,
  },
  recordingText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  durationText: {
    fontSize: 14,
    color: '#555',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  buttonWrapper: {
    flex: 1,
    marginRight: 5,
    justifyContent: 'center',
  },
  uploadSuccessContainer: {
    flex: 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  uploadSuccessText: {
    color: 'green',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
