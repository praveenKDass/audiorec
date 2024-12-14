import { StyleSheet, Text, View ,Button,Animated,AppState, Alert,PermissionsAndroid} from 'react-native'
import React, { useState,useEffect, useRef } from 'react'
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import AsyncStorage from '@react-native-async-storage/async-storage'; // For local storage

const HomeScreen = () => {
  // const [audioRecorderPlayer] = useState(new AudioRecorderPlayer());
  const [audioRecorderPlayer] = useState(new AudioRecorderPlayer());
  const [recordingPath, setRecordingPath] = useState('');
  const [playTime, setPlayTime] = useState('');
  const [duration, setDuration] = useState('')
  const animatedValue = useRef(new Animated.Value(0)).current;
  const [isRecording, setIsRecording] = useState(false);
  const [appState, setAppState] = useState(AppState.currentState);

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
    try {
      const granted = await requestMicrophonePermission();
      if (!granted) {
        console.error('Microphone permission not granted');
        return;
      }
      setIsRecording(true);
      animatedValue.setValue(0);

      const result = await audioRecorderPlayer.startRecorder();
      console.log('Recording started:', result);

      // Store file path in AsyncStorage
      await AsyncStorage.setItem('recordingPath', result);

      audioRecorderPlayer.addRecordBackListener((e) => {
        const amplitude = e.currentMetering || 0;
        const normalizedAmplitude = Math.max(0, Math.min(amplitude + 160, 160)) / 160;

        Animated.spring(animatedValue, {
          toValue: normalizedAmplitude,
          useNativeDriver: true,
          speed: 20,
        }).start();

        return;
      });
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  };

  // Stop recording and store the path in local storage
  const stopRecording = async () => {
    try {
      const result = await audioRecorderPlayer.stopRecorder();
      audioRecorderPlayer.removeRecordBackListener();
      console.log('Recording stopped:', result);

      setIsRecording(false);

      // Store the recording path in AsyncStorage
      await AsyncStorage.setItem('recordingPath', result);
      console.log('Recording path stored:', result);

      Animated.spring(animatedValue, {
        toValue: 0,
        useNativeDriver: true,
        speed: 20,
      }).start();
    } catch (error) {
      console.error('Failed to stop recording:', error);
    }
  };

  // Play the recorded audio
  const playRecording = async () => {
    try {
      const recordingPath = await AsyncStorage.getItem('recordingPath');
      if (recordingPath) {
        console.log('Playing recording from:', recordingPath);
        await audioRecorderPlayer.startPlayer(recordingPath);
      } else {
        console.log('No recording found in local storage');
      }
    } catch (error) {
      console.error('Failed to play recording:', error);
    }
  };
  useEffect(() => {
    const handleAppStateChange = (nextAppState) => {
      if (nextAppState === 'background') {
        audioRecorderPlayer.pausePlayer();
      } else if (nextAppState === 'active') {
        const recordingPath = AsyncStorage.getItem('recordingPath');
        if (recordingPath) {
          audioRecorderPlayer.resumePlayer();
        }
      }
      setAppState(nextAppState);
    };

    AppState.addEventListener('change', handleAppStateChange);

    return () => {
      AppState.removeEventListener('change', handleAppStateChange);
    };
  }, [audioRecorderPlayer]);
  // Animated styles
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
  // const onStartPlay = async () => {
  //   try {
  //     console.log('onStartPlay');
  //     const msg = await audioRecorderPlayer.startPlayer();
  //     console.log('Playback started:', msg);
  //     audioRecorderPlayer.addPlayBackListener((e) => {
  //       setCurrentPositionSec(e.currentPosition);
  //       setCurrentDurationSec(e.duration);
  //       setPlayTime(audioRecorderPlayer.mmssss(Math.floor(e.currentPosition)));
  //       setDuration(audioRecorderPlayer.mmssss(Math.floor(e.duration)));
  //       return;
  //     });
  //   } catch (error) {
  //     console.error('Failed to start playback:', error);
  //   }
  // };
  // const onPausePlay = async () => {
  //   try {
  //     await audioRecorderPlayer.pausePlayer();
  //     console.log('Playback paused');
  //   } catch (error) {
  //     console.error('Failed to pause playback:', error);
  //   }
  // };

  // const onStopPlay = async () => {
  //   try {
  //     console.log('onStopPlay');
  //     await audioRecorderPlayer.stopPlayer();
  //     audioRecorderPlayer.removePlayBackListener();
  //     console.log('Playback stopped');
  //   } catch (error) {
  //     console.error('Failed to stop playback:', error);
  //   }
  // };

  return (
    <View style={styles.container}>
      <View style={styles.animationContainer}>
        <Animated.View style={[styles.circle, animatedStyle]} />
      </View>
       <View style={styles.buttonContainer}>
        <Button title="Start Recording" onPress={startRecording} />
        <Button title="Stop Recording" onPress={stopRecording} />
        <Button title="Play Recording" onPress={playRecording} />

      </View>
      <View style={styles.buttonContainer}>
        {/* <Button title="Start Playing" onPress={onStartPlay} /> */}
        {/* <Button title="Pause Playing" onPress={onPausePlay} />
        <Button title="Stop Playing" onPress={onStopPlay} /> */}
      </View>
      <View style={styles.infoContainer}>
        <Text>Play Time: {playTime}</Text>
        <Text>Duration: {duration}</Text>
      </View>
    </View>
  )
}

export default HomeScreen

const styles = StyleSheet.create({
  
    container: {
      flex: 1,
      padding: 20,
      justifyContent: 'center',
    },
    buttonContainer: {
      marginVertical: 10,
      gap:10,
      flexDirection: 'column',
      justifyContent: 'space-around',
    },
    infoContainer: {
      marginTop: 20,
      alignItems: 'center',
    },
    animationContainer: {
      width: 200,
      height: 200,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 40,
    },
    circle: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: '#ff5722',
    },
      
})
