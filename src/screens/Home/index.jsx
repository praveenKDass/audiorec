import React, { useState, useRef } from 'react';
import { StyleSheet, Text, View, Button, FlatList, Animated, Alert, PermissionsAndroid } from 'react-native';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';

const HomeScreen = () => {
  const [audioRecorderPlayer] = useState(new AudioRecorderPlayer());
  const [recordingPath, setRecordingPath] = useState('');
  const [recordings, setRecordings] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentDuration, setCurrentDuration] = useState(0);
  const animatedValue = useRef(new Animated.Value(0)).current;
  const durationInterval = useRef(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedRecording, setSelectedRecording] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playProgress, setPlayProgress] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);

  // Request microphone permissions
  const requestMicrophonePermission = async () => {
    try {
      const permission = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        {
          title: 'Microphone Permission',
          message: 'This app needs access to your microphone to record audio.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );
      return permission === PermissionsAndroid.RESULTS.GRANTED;
    } catch (error) {
      console.error('Permission request failed:', error);
      return false;
    }
  };

  // Start recording
  const startRecording = async () => {
    const granted = await requestMicrophonePermission();
    if (!granted) {
      Alert.alert('Microphone permission not granted');
      return;
    }
    try {
      const result = await audioRecorderPlayer.startRecorder();
      setRecordingPath(result);
      setIsRecording(true);
      setIsPaused(false);
      setCurrentDuration(0);
      durationInterval.current = setInterval(() => {
        setCurrentDuration((prev) => prev + 1);
      }, 1000);

      audioRecorderPlayer.addRecordBackListener((e) => {
        const amplitude = e.currentMetering || 0;
        const normalizedAmplitude = Math.max(0, Math.min(amplitude + 160, 160)) / 160;
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
      setRecordings((prevRecordings) => [
        ...prevRecordings,
        {
          id: Date.now(),
          path: result,
          duration: formatDuration(currentDuration),
        },
      ]);
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
        setCurrentDuration((prev) => prev + 1);
      }, 1000);
    } else {
      await audioRecorderPlayer.pauseRecorder();
      setIsPaused(true);
      clearInterval(durationInterval.current);
    }
  };

  // Format duration into mm:ss
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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
    const clearRecordings = () => {
      setRecordings([]);
    };
  

  return (
    <View style={styles.container}>
      <View style={styles.animationContainer}>
        <Animated.View style={[styles.circle, animatedStyle]} />
      </View>
      <View style={styles.buttonContainer}>
        <Button title="Start Recording" onPress={startRecording} disabled={isRecording} />
        <Button
          title={isPaused ? 'Resume Recording' : 'Pause Recording'}
          onPress={togglePauseResume}
          disabled={!isRecording}
        />
        <Button title="Stop Recording" onPress={stopRecording} disabled={!isRecording} />
        <Button title="Clear Recordings" onPress={clearRecordings} disabled={recordings.length === 0} />
      </View>
      <View style={styles.currentDurationContainer}>
        {isRecording && <Text>Recording Duration: {formatDuration(currentDuration)}</Text>}
      </View>
      <View style={styles.listContainer}>
        <Text style={styles.header}>Recordings List:</Text>
        <FlatList
          data={recordings}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.recordingItem}>
              <Text style={styles.recordingText}>
                Recording {item.id} - {item.duration}
              </Text>
              <Button title="Play" onPress={() => audioRecorderPlayer.startPlayer(item.path)} />
            </View>
          )}
        />
      </View>
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
    width: 200,
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