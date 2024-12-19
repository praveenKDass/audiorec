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
  LayoutAnimation,
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
import MediaPlayer from '../../components/MediaPlayer/MediaPlayer';
import { useTranslation } from 'react-i18next';
import { Dropdown } from 'react-native-element-dropdown';

const HomeScreen = () => {
  const [uploadModal, setuploadModal] = useState(false);
  const [recordUpload, setRecordUpload] = useState();
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
  const [showMusicPlayer, setShowMusicPlayer] = useState(false);
  const [selectedMusic, setSelectedMusic] = useState();
  const [language, setLanguage] = useState({
    label:"English",
    value:'en'
  });
  const { t, i18n } = useTranslation();
  const languages = [
    { label: 'English', value: 'en' },
    { label: 'Hindi', value: 'hi' },
  ];

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

  useEffect(() => {
    const loadLanguage = async () => {
      const savedLanguage = await AsyncStorage.getItem('selectedLanguage');
      if (savedLanguage) {
        i18n.changeLanguage(savedLanguage);
        setLanguage({
          label: savedLanguage === 'en' ? 'English' : 'Hindi',
          value: savedLanguage,
        });
      } else {
        i18n.changeLanguage('en');
        setLanguage({ label: 'English', value: 'en' });
      }
    };

    loadLanguage();
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
  const handleUserInformationModalSubmit = data => {
    setUserInformationModal(false);
    startRecording();
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
            t('PERMISSION_REQUIRED'),
            t('PERMISSION_REQUIRED_MSG'),
            [
              {
                text: t('OK'),
                onPress: () => console.log('Permission denied'),
              },
              {
                text: t('GO_TO_SETTINGS'),
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

  const checkRecording = () => {
    setUserInformationModal(true);
  };
  const changeLanguage = async (lang) => {
    await i18n.changeLanguage(lang.value);  
    setLanguage(lang);  
    await AsyncStorage.setItem('selectedLanguage', JSON.parse(lang));
  }
  // Start recording
  const startRecording = async () => {
    const granted = await requestPermission();
    if (!granted) {
      Alert.alert(t('PERMISSION_MICROPHONE'));
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
      setRecordUpload(newRecording);
      const updatedRecordings = [...recordings, newRecording];
      setRecordings(updatedRecordings);
      await saveRecordingsToStorage(updatedRecordings);
      await setuploadModal(true);
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
  // const formatDuration = seconds => {
  //   const mins = Math.floor(seconds / 60);
  //   const secs = seconds % 60;
  //   return `${mins.toString().padStart(2, '0')}:${secs
  //     .toString()
  //     .padStart(2, '0')}`;
  // };

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
  
    const formattedHours = hours.toString().padStart(2, '0');
    const formattedMins = mins.toString().padStart(2, '0');
    const formattedSecs = secs.toString().padStart(2, '0');
  
    return `${formattedHours}:${formattedMins}:${formattedSecs}`;
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
    <>
      <View style={styles.container}>
        {/* Top section with text and button */}
        <View style={styles.topSection}>
          <Text style={styles.headerText}>{t('SHIKSHA_CHAUPAL')}</Text>
          
          <Dropdown
            label={t('LANGUAGE')}
            data={languages}
            labelField="label"
            valueField="value"
            value={language.value}
            onChange={item => changeLanguage(item)} 
            style={styles.dropdown}
            placeholder={t('SELECT_LANGUAGE')}
        />
        </View>

        {/* FlatList or MediaPlayer based on state */}
        {!showMusicPlayer ? (
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
                    <Text style={styles.animationText}>00:00:00</Text>
                  )}
                </View>
                <View style={styles.buttonContainer}>
                  <Button
                    title={t('START_RECORD')}
                    onPress={checkRecording}
                    disabled={isRecording}
                  />
                  <UserInformationModal
                    isVisible={userInformationModal}
                    setIsVisible={setUserInformationModal}
                    onSubmit={handleUserInformationModalSubmit}
                  />
                  <Button
                    title={isPaused ? t('RESUME_RECORD') : t('PAUSE_RECORD')}
                    onPress={togglePauseResume}
                    disabled={!isRecording}
                  />
                  <Button
                    title={t('STOP_RECORD')}
                    onPress={stopRecording}
                    disabled={!isRecording}
                    color="#F44336"
                    />
                {/* <Button
                    title="Clear Recordings"
                    onPress={clearRecordings}
                    disabled={recordings.length === 0}
                  />  */}
                </View>
                <View style={styles.currentDurationContainer}>
                <Text style={styles.listingtitle}>{t("MY_RECORD")}</Text>               
                </View>
              </>
            }
            renderItem={({item}) =>
               item.id ? (
                <Card
                  item={item}
                  setRecordings={setRecordings}
                  setSelectedMusic={setSelectedMusic}
                  setShowMusicPlayer={setShowMusicPlayer}
                />
              ) : null
            }
            contentContainerStyle={styles.flatListContent}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <MediaPlayer
            filePath={selectedMusic.path}
            setShowMusicPlayer={setShowMusicPlayer}
            setSelectedMusic={setSelectedMusic}
            selectedMusic={selectedMusic}
          />
        )}
      </View>
      <DNDModalComponent
        modal={modal}
        setModal={setModal}
        dontShowAgain={dontShowAgain}
        setDontShowAgain={setDontShowAgain}
      />
        <UploadAlert
        visible={uploadModal}
        onClose={() => setuploadModal(false)}
        recordingPath={recordUpload}
        setRecordings={setRecordings}
      />
    </>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'flex-start',
  },
  topSection: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    zIndex: 10,
    height:60
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  dropdown: {
    width: 150,
    marginLeft: 10,
  },
  buttonContainer: {
    marginVertical: 10,
    gap: 10,
    flexDirection: 'column',
    justifyContent: 'space-around',
  },
  animationContainer: {
    width: '100%',
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    alignSelf: 'center',
  },
  circle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#ff5722',
  },
  currentDurationContainer: {
    alignItems: 'left',
    marginVertical: 10,
  },
  listContainer: {
    flex: 1,
    marginTop: 20,
    marginTop: 100, 
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
  animationText: {
    fontSize: 50,
    color: '#2196F3',
    fontWeight: 'bold',
  },
  listingtitle:{
    fontSize: 20,
    color: '#2196F3',
    fontWeight: 'bold',
  }
});

