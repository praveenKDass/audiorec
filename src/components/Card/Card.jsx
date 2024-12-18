import {StyleSheet, Text, View,Button} from 'react-native';
import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
const Card = ({item,setRecordings}) => {
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
      <View style={styles.recordingItem}>
        <Text style={styles.recordingText}>
          Recording {item.id} - {item.duration}
        </Text>
        <View style={styles.buttonContainer}>
          <Button
            title="Play"
            onPress={() => navigation.navigate('Audio', {data: item})}
          />
          <Button
            title="Delete"
            onPress={()=>deleteRecording(item)}
          />
        </View>
      </View>
    </View>
  );
};

export default Card;

const styles = StyleSheet.create({
  container:{
    borderRadius:10,
    alignItems: "center",
    gap:5,
    justifyContent: "center",
    backgroundColor: 'rgba(161, 241, 217, 0.5)', // White with 50% transparency
    shadowColor: '#000',
    shadowOpacity: 0.3,
    marginVertical:5
  },
  recordingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 5,
    alignItems: 'center',
  },
  recordingText: {
    fontSize: 16,
    color:"red",
  },
});
