import React, {useState, useRef, useEffect} from 'react';
import {
  StyleSheet,
  Text,
  View,
  Button,
  FlatList,
  Animated,
  Alert,
  Platform,
  Linking,
  AppState,
} from 'react-native';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-get-random-values';
import {v4 as uuidv4} from 'uuid';
import RNFS from 'react-native-fs';
import {request, PERMISSIONS, RESULTS} from 'react-native-permissions';
import {
  checkDNDPermission,
  setDNDMode,
} from '../../components/checkDNDPermission/checkDNDPermission';
import Card from '../../components/Card/Card';
import DNDModalComponent from '../../components/Modal/DNDModalComponent';
import UploadAlert from '../../components/Modal/UploadModalComponent';
import UserInformationModal from '../../components/Modal/userInformationModal';

const HomeScreen = ({navigation}) => {
  const [uploadModal, setuploadModal] = useState(false);
  const [recordUpload,setRecordUpload] = useState();
  const [userInformationModal, setUserInformationModal] = useState(false);
  const [audioRecorderPlayer] = useState(new AudioRecorderPlayer());
  const [recordingPath, setRecordingPath] = useState('');
  const [recordings, setRecordings] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentDuration, setCurrentDuration] = useState(0);
  const animatedValue = useRef(new Animated.Value(0)).current;
  const durationInterval = useRef(null);
  const [appState, setAppState] = useState(AppState.currentState);
  const [modal, setModal] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  useEffect(() => {
    // Check and request DND permission when the app starts
    if (Platform.OS === 'android') {
      checkDNDPermission().then(hasPermission => {
        AsyncStorage.getItem('isDNDModalShow').then(checkDNDModalPermission => {
          let booleanValue = JSON.parse(checkDNDModalPermission);
          if (!hasPermission && !booleanValue) {
            setModal(true);
          }
        });
      });
    }

    // Initial check for DND mode on app startup
    if (appState === 'active') {
      setDNDMode('PRIORITY_MODE');
    }

    // Listen for app state changes
    const subscription = AppState.addEventListener(
      'change',
      handleAppStateChange,
    );

    return () => {
      subscription.remove(); // Clean up listener
    };
  }, []);

  const handleAppStateChange = nextAppState => {
    if (nextAppState === 'active') {
      setDNDMode('PRIORITY_MODE'); // Enable DND mode
    } else if (nextAppState === 'background' || nextAppState === 'inactive') {
      setDNDMode('NORMAL_MODE'); // Disable DND mode
    }
    setAppState(nextAppState);
};

//on submited the userInformationModal 
const handleUserInformationModalSubmit = (data) => {
  console.log('Data received from modal:', data);
  setUserInformationModal(false);
  startRecording()
};

  //above line for dnd mode
  // Request microphone permissions
  const requestPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const recordAudioPermission = PERMISSIONS.ANDROID.RECORD_AUDIO;
        let fineLocation = PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION;

        // Request each permission individually
        const fineLocationStaus = await request(fineLocation);
        const recordAudioPermissionStatus = await request(
          recordAudioPermission,
        );
        if (
          recordAudioPermissionStatus === RESULTS.GRANTED &&
          fineLocationStaus === RESULTS.GRANTED
        ) {
          return true;
        } else {
          Alert.alert(
            'Permissions Required',
            'Please grant the required permissions to use this feature.',
            [
              {
                text: 'OK',
                onPress: () => console.log('Permission denied'),
              },
              {
                text: 'Go to Settings',
                onPress: () => Linking.openSettings(),
                style: 'cancel',
              },
            ],
          );
        }
      } catch (err) {
        console.warn(err);
        return;
      }
    }
  };

  // Save recordings to local storage
  const saveRecordingsToStorage = async recordings => {
    try {
      const jsonValue = JSON.stringify(recordings);
      await AsyncStorage.setItem('shikshachaupalrecording', jsonValue);
    } catch (error) {
      console.error('Failed to save recordings:', error);
    }
  };

  // Load recordings from local storage
  const loadRecordingsFromStorage = async () => {
    try {
      const jsonValue = await AsyncStorage.getItem('shikshachaupalrecording');
      return jsonValue != null ? JSON.parse(jsonValue) : [];
    } catch (error) {
      console.error('Failed to load recordings:', error);
      return [];
    }
  };

  // Use `useEffect` to load recordings on component mount
  useEffect(() => {
    const initializeRecordings = async () => {
      const storedRecordings = await loadRecordingsFromStorage();
      setRecordings(storedRecordings);
    };
    initializeRecordings();
  }, []);

  const checkRecording = ()=>{
    setUserInformationModal(true)
  }
  // Start recording
  const startRecording = async () => {
      const granted = await requestPermission();
      if (!granted) {
        Alert.alert('Microphone permission not granted');
        return;
      }
  
      try {
        const uniqueFileName = `recording_${Date.now()}_${uuidv4()}.mp3`;
        const recordingPath = Platform.select({
          ios: `${RNFS.DocumentDirectoryPath}/${uniqueFileName}`,
          android: `${RNFS.DocumentDirectoryPath}/${uniqueFileName}`,
        });
        const result = await audioRecorderPlayer.startRecorder(recordingPath);
        setRecordingPath(result);
        setIsRecording(true);
        setIsPaused(false);
        setCurrentDuration(0);
        durationInterval.current = setInterval(() => {
          setCurrentDuration(prev => prev + 1);
        }, 1000);
  
        audioRecorderPlayer.addRecordBackListener(e => {
          const amplitude = e.currentMetering || 0;
          const normalizedAmplitude =
            Math.max(0, Math.min(amplitude + 160, 160)) / 160;
          Animated.spring(animatedValue, {
            toValue: normalizedAmplitude,
            useNativeDriver: true,
            speed: 20,
          }).start();
        });
      } catch (error) {
        console.error('Failed to start recording:', error);
      }
  };

  // Stop recording
  const stopRecording = async () => {
    try {
      const result = await audioRecorderPlayer.stopRecorder();
      clearInterval(durationInterval.current);
      audioRecorderPlayer.removeRecordBackListener();
      setIsRecording(false);
      setIsPaused(false);
      setCurrentDuration(0);
      // Generate a unique identifier
      let newRecording = {
        id: Date.now(),
        path: result,
        duration: formatDuration(currentDuration),
        isUploaded: false,
      };
      setRecordUpload(newRecording)
      const updatedRecordings = [...recordings, newRecording];
      setRecordings(updatedRecordings);
      await saveRecordingsToStorage(updatedRecordings);
      await setuploadModal(true)
      Animated.spring(animatedValue, {
        toValue: 0,
        useNativeDriver: true,
        speed: 20,
      }).start();
    } catch (error) {
      console.error('Failed to stop recording:', error);
    }
  };

  // Toggle Pause and Resume
  const togglePauseResume = async () => {
    if (isPaused) {
      await audioRecorderPlayer.resumeRecorder();
      setIsPaused(false);
      durationInterval.current = setInterval(() => {
        setCurrentDuration(prev => prev + 1);
      }, 1000);
    } else {
      await audioRecorderPlayer.pauseRecorder();
      setIsPaused(true);
      clearInterval(durationInterval.current);
    }
  };

  // Format duration into mm:ss
  const formatDuration = seconds => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
  
    return `${hrs.toString().padStart(2, '0')}:${mins
      .toString()
      .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const animatedStyle = {
    transform: [
      {
        scale: animatedValue.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 2.5],
        }),
      },
    ],
    opacity: animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0.5, 1],
    }),
  };
  // Clear recordings list
  const clearRecordings = async () => {
    try {
      await AsyncStorage.clear();
      setRecordings([]);
    } catch (error) {
      console.error('Failed to clear AsyncStorage:', error);
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={[...recordings]} // Add dummy data for non-list items
        keyExtractor={(item, index) =>
          item.id ? item.id.toString() : `static-${index}`
        }
        ListHeaderComponent={
          <>
            <View style={styles.animationContainer}>
              {isRecording ? (
                <Text style={styles.animationText}>
                  {formatDuration(currentDuration)}
                </Text>
              ) : (
                <Text style={styles.animationText}>
                  00:00:00
                </Text>
              )}
            </View>
            <View style={styles.buttonContainer}>
              <Button
                title="Start Recording"
                onPress={startRecording}
                disabled={isRecording}
              />
              <Button
                title={isPaused ? 'Resume Recording' : 'Pause Recording'}
                onPress={togglePauseResume}
                disabled={!isRecording}
              />
              <Button
                title="Stop Recording"
                onPress={stopRecording}
                disabled={!isRecording}
              />
              <Button
                title="Clear Recordings"
                onPress={clearRecordings}
                disabled={recordings.length === 0}
              />
            </View>
            <View style={styles.currentDurationContainer}>
              {isRecording && (
                <Text>
                  Recording Duration: {formatDuration(currentDuration)}
                </Text>
              )}
            </View>
          </>
        }
        renderItem={({item}) =>
          item.id ? <Card item={item} setRecordings={setRecordings} /> : null
        }
        contentContainerStyle={styles.flatListContent}
        showsVerticalScrollIndicator={false}
      />
      <DNDModalComponent
        modal={modal}
        setModal={setModal}
        dontShowAgain={dontShowAgain}
        setDontShowAgain={setDontShowAgain}
      />
    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  buttonContainer: {
    marginVertical: 10,
    gap: 10,
    flexDirection: 'column',
    justifyContent: 'space-around',
  },
  animationContainer: {
    marginVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    alignSelf: 'center',
  },
  animationText: {
    fontSize: 50,
    color:"#2196F3"
  },

  circle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#ff5722',
  },
  currentDurationContainer: {
    alignItems: 'center',
    marginVertical: 10,
  },
  listContainer: {
    flex: 1,
    marginTop: 20,
  },
  header: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  recordingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 5,
    alignItems: 'center',
  },
  recordingText: {
    fontSize: 16,
  },
});
