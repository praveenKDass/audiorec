import React, {useState, useRef, useEffect} from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  Animated,
  Alert,
  Platform,
  Linking,
  AppState,
  StatusBar,
  SafeAreaView,
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
import {useTranslation} from 'react-i18next';
import {useKeepAwake} from '@sayem314/react-native-keep-awake';
import {sortRecordings} from '../../services/utils/utils';
import notifee, {AndroidImportance} from '@notifee/react-native';

notifee.registerForegroundService(() => {
  return new Promise(() => {});
});

const HomeScreen = () => {
  useKeepAwake();
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
    label: 'English',
    value: 'en',
  });
  const {t, i18n} = useTranslation();
  const languages = [
    {label: 'English', value: 'en'},
    {label: 'हिंदी', value: 'hi'},
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
        setLanguage({label: 'English', value: 'en'});
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
        await notifee.requestPermission();

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
          Alert.alert(t('PERMISSION_REQUIRED'), t('PERMISSION_REQUIRED_MSG'), [
            {
              text: t('OK'),
              onPress: () => console.log('Permission denied'),
            },
            {
              text: t('GO_TO_SETTINGS'),
              onPress: () => Linking.openSettings(),
              style: 'cancel',
            },
          ]);
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
      let sortRecord = await sortRecordings(storedRecordings);
      setRecordings(sortRecord);
    };
    initializeRecordings();
  }, []);

  const checkRecording = () => {
    setUserInformationModal(true);
  };
  const changeLanguage = async lang => {
    await i18n.changeLanguage(lang.value);
    setLanguage(lang);
    await AsyncStorage.setItem('selectedLanguage', JSON.parse(lang));
  };
  // Start recording
  const startRecording = async () => {
    const granted = await requestPermission();
    if (!granted) {
      Alert.alert(t('PERMISSION_MICROPHONE'));
      return;
    }

    try {
      const channelId = await notifee.createChannel({
        id: 'recording',
        name: 'Recording',
      });

      notifee.displayNotification({
        title: 'Android audio background recording',
        body: 'recording...',
        android: {
          channelId,
          asForegroundService: true,
          importance: AndroidImportance.HIGH,
        },
      });

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
      let sortRecord = await sortRecordings(updatedRecordings);
      setRecordings(sortRecord);
      await saveRecordingsToStorage(sortRecord);
      await setuploadModal(true);
      await notifee.stopForegroundService();
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

  const formatDuration = seconds => {
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

  const RecordButton = ({onPress, disabled, label, color, width = 'auto'}) => (
    <TouchableOpacity
      style={[
        styles.recordButton,
        {backgroundColor: color, width},
        disabled && styles.disabledButton,
      ]}
      onPress={onPress}
      disabled={disabled}>
      <Text style={styles.recordButtonText}>{label}</Text>
    </TouchableOpacity>
  );

  const LanguageOption = ({label, selected, onPress}) => (
    <TouchableOpacity
      style={[styles.languageOption, selected && styles.selectedLanguage]}
      onPress={onPress}>
      <Text
        style={[styles.languageText, selected && styles.selectedLanguageText]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerText}>{t('SHIKSHA_CHAUPAL')}</Text>
          <View style={styles.languageContainer}>
            {languages.map(lang => (
              <LanguageOption
                key={lang.value}
                label={lang.label}
                selected={language.value === lang.value}
                onPress={() => changeLanguage(lang)}
              />
            ))}
          </View>
        </View>

        {!showMusicPlayer ? (
          <FlatList
            data={recordings}
            keyExtractor={item => item.id?.toString() || `static-${item.path}`}
            ListHeaderComponent={
              <View style={styles.recordingSection}>
                <View style={styles.timerContainer}>
                  <Text style={styles.timerText}>
                    {isRecording ? formatDuration(currentDuration) : '00:00:00'}
                  </Text>
                  {isRecording && (
                    <Animated.View
                      style={[
                        styles.recordingIndicator,
                        {
                          transform: [
                            {
                              scale: animatedValue.interpolate({
                                inputRange: [0, 1],
                                outputRange: [1, 1.3],
                              }),
                            },
                          ],
                        },
                      ]}
                    />
                  )}
                </View>

                <View style={styles.controlsContainer}>
                  <RecordButton
                    onPress={checkRecording}
                    disabled={isRecording}
                    label={t('START_RECORD')}
                    color="#FF4444"
                    width={100}
                  />
                  <RecordButton
                    onPress={togglePauseResume}
                    disabled={!isRecording}
                    label={isPaused ? t('RESUME_RECORD') : t('PAUSE_RECORD')}
                    color="#2196F3"
                    width={100}
                  />
                  <RecordButton
                    onPress={stopRecording}
                    disabled={!isRecording}
                    label={t('STOP_RECORD')}
                    color="#4CAF50"
                    width={100}
                  />
                </View>

                {recordings.length > 0 && (
                  <Text style={styles.sectionTitle}>{t('MY_RECORD')}</Text>
                )}
              </View>
            }
            renderItem={({item}) => (
              <Card
                item={item}
                setRecordings={setRecordings}
                setSelectedMusic={setSelectedMusic}
                setShowMusicPlayer={setShowMusicPlayer}
              />
            )}
            contentContainerStyle={styles.recordingsList}
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
      <UserInformationModal
        isVisible={userInformationModal}
        setIsVisible={setUserInformationModal}
        onSubmit={handleUserInformationModalSubmit}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  languageContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  languageOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
  },
  selectedLanguage: {
    backgroundColor: '#2196F3',
  },
  languageText: {
    fontSize: 14,
    color: '#666666',
  },
  selectedLanguageText: {
    color: '#ffffff',
  },
  recordingSection: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  timerText: {
    fontSize: 48,
    fontWeight: '600',
    color: '#2196F3',
    fontVariant: ['tabular-nums'],
  },
  recordingIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF4444',
    marginTop: 8,
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 32,
  },
  recordButton: {
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  recordButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
    paddingHorizontal: 12,
  },
  disabledButton: {
    opacity: 0.5,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
    marginTop: 16,
    marginBottom: 8,
  },
  recordingsList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
});

export default HomeScreen;
