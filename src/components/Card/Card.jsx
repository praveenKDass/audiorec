import {StyleSheet, Text, View,Button} from 'react-native';
import React, { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import UploadAlert from '../Modal/UploadModalComponent';
const Card = ({item,setRecordings}) => {
  const [uploadModal, setuploadModal] = useState(false);
const navigation = useNavigation()
//Function to delete the recording from the local storage
const deleteRecording = async (recording) => {
  let id = recording.id
  Alert.alert(
    'Confirm Delete',
    recording.isUploaded
    ? 'Are you sure you want to delete this recording?'
    : 'This recording has not been uploaded yet. Are you sure you want to delete it?',
    [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Delete',
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
            Alert.alert('Success', `Recording with id '${id}' has been deleted.`);
          } catch (error) {
            console.error('Error removing item:', error);
            Alert.alert('Error', 'Failed to delete the Recording.');
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
            Recording ID: {item.id}
          </Text>
          <Text style={styles.durationText}>
            Duration: {item.duration}
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          <View style={styles.buttonWrapper}>
            <Button
              title="Play"
              onPress={() => navigation.navigate('Audio', { data: item })}
            />
          </View>
          <View style={styles.buttonWrapper}>
            <Button
              title="Delete"
              color="#F44336"
              onPress={()=>deleteRecording(item)}
            />
          </View>
          {item.isUploaded ? (
            <View style={styles.uploadSuccessContainer}>
              <Text style={styles.uploadSuccessText}>Upload Success</Text>
            </View>
          ) : (
            <View style={styles.buttonWrapper}>
              <Button
                title="Upload"
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
