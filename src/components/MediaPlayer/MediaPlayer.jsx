import React, {useEffect, useRef, useState} from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Dimensions,
  BackHandler,
} from 'react-native';
import Sound from 'react-native-sound';
import Svg, {Line} from 'react-native-svg';
import Slider from '@react-native-community/slider';
import {useTranslation} from 'react-i18next';
const {width} = Dimensions.get('window');

const MediaPlayer = ({
  filePath,
  setShowMusicPlayer,
  setSelectedMusic,
  selectedMusic,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [waveform, setWaveform] = useState(Array(30).fill(30)); // Initial sound wave
  const [currentPosition, setCurrentPosition] = useState(0); // Current position in the audio
  const [duration, setDuration] = useState(0); // Total audio duration
  const soundRef = useRef(null);
  const progressInterval = useRef(null);
  const {t} = useTranslation();
  const [currentWaveform, setCurrentWaveform] = useState(waveform);

  // Initialize the sound
  useEffect(() => {
    Sound.setCategory('Playback');
    soundRef.current = new Sound(filePath, null, error => {
      if (error) {
        console.log('Failed to load sound:', error);
        return;
      }
      setDuration(soundRef.current.getDuration());
    });
    return () => {
      if (soundRef.current) {
        soundRef.current.release();
      }
      clearInterval(progressInterval.current);
    };
  }, [filePath]);

  useEffect(() => {
    const backAction = () => {
      setShowMusicPlayer(false);
      setSelectedMusic();
      return true; // Prevent default back button behavior (closing the app)
    };
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction,
    );
    return () => backHandler.remove(); // Cleanup the listener
  }, []);

  useEffect(() => {
    if (isPlaying) {
      setCurrentWaveform(waveform);
    }
  }, [waveform, isPlaying]);
  const onClose = () => {
    setShowMusicPlayer(false);
    setSelectedMusic();
  };

  // Simulate the sound wave for visualization
  const simulateWaveform = () => {
    return setInterval(() => {
      const randomWaveform = Array.from({length: 30}, () =>
        Math.floor(Math.random() * 100),
      );
      setWaveform(randomWaveform);
    }, 300); // Update every 300ms
  };

  const togglePlayback = () => {
    if (isPlaying) {
      soundRef.current.pause();
      setIsPlaying(false);
      clearInterval(progressInterval.current);
    } else {
      soundRef.current.play(() => {
        setIsPlaying(false); // Reset when playback finishes
        clearInterval(progressInterval.current);
        setCurrentPosition(0);
      });
      setIsPlaying(true);
      simulateWaveform(); // Start waveform simulation

      // Update progress every second
      progressInterval.current = setInterval(() => {
        soundRef.current.getCurrentTime(seconds => {
          setCurrentPosition(seconds);
        });
      }, 1000);
    }
  };

  const skipForward = () => {
    soundRef.current.getCurrentTime(seconds => {
      const newPosition = Math.min(seconds + 10, duration); // Skip 10 seconds ahead
      soundRef.current.setCurrentTime(newPosition);
      setCurrentPosition(newPosition);
    });
  };

  const skipBackward = () => {
    soundRef.current.getCurrentTime(seconds => {
      const newPosition = Math.max(seconds - 10, 0); // Skip 10 seconds backward
      soundRef.current.setCurrentTime(newPosition);
      setCurrentPosition(newPosition);
    });
  };

  const formatDate = timestamp => {
    // Convert the timestamp to a Date object
    const date = new Date(timestamp);

    // Format the date as "DD-MMM-YYYY"
    const options = {day: '2-digit', month: 'short', year: 'numeric'};
    return new Intl.DateTimeFormat('en-GB', options).format(date);
  };

  // Format function to convert seconds into mm:ss format
  const formatTime = time => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(
      2,
      '0',
    )}`;
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    
    const weekday = date.toLocaleString('en-IN', {
      weekday: 'long',
      timeZone: 'Asia/Kolkata'
    });
    
    const time = date.toLocaleString('en-IN', {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
      timeZone: 'Asia/Kolkata'
    });
  
    return `${weekday} at ${time}`;
  };
  
  const formatDateShort = (timestamp) => {
    const date = new Date(timestamp);
    
    const options = {
      day: '2-digit',
      month: 'short',
      timeZone: 'Asia/Kolkata'
    };
  
    return date.toLocaleString('en-IN', options).replace('-', ' ');
  };
  return (
    <View style={styles.container}>
      {/* Close Button */}
      <TouchableOpacity style={styles.closeButton} onPress={onClose}>
        <Text style={styles.closeButtonText}>X</Text>
      </TouchableOpacity>
      <View style={styles.titleContainer}>
        <Text style={[styles.titleText, styles.greyText]}>
          {formatTimestamp(selectedMusic.id)}
        </Text>
        <Text style={[styles.infoText, styles.greyText]}>
          {formatDateShort(selectedMusic.id)} - {selectedMusic.duration}
        </Text>
        {/* <Text style={[styles.infoText, styles.greyText]}>
          {t('CREATED_AT')} : {formatDate(selectedMusic.id)}
        </Text> */}
      </View>

      {/* Sound Wave Equalizer */}
      <Svg height={200} width={width * 0.9} style={styles.equalizer}>
        {currentWaveform.map((value, index) => (
          <Line
            key={index}
            x1={index * (width / currentWaveform.length) + 5}
            y1={200 - value} // Height depends on waveform value
            x2={index * (width / currentWaveform.length) + 5}
            y2={200}
            stroke="#2196F3"
            strokeWidth="3"
          />
        ))}
      </Svg>

      {/* Progress Tracker */}
      <Slider
        style={styles.slider}
        minimumValue={0}
        maximumValue={duration}
        value={currentPosition}
        onSlidingComplete={value => {
          soundRef.current.setCurrentTime(value);
          setCurrentPosition(value);
        }}
        minimumTrackTintColor="#2196F3"
        maximumTrackTintColor="gray"
        thumbTintColor="#2196F3"
      />
      <View style={styles.timeContainer}>
        <Text style={styles.timeText}>{formatTime(currentPosition)}</Text>
        <Text style={styles.timeText}>{formatTime(duration)}</Text>
      </View>

      {/* Control Buttons */}
      <View style={styles.controls}>
        <TouchableOpacity style={styles.controlButton} onPress={skipBackward}>
          <Text style={styles.buttonText}>{'<<'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.playButton} onPress={togglePlayback}>
          <Text style={styles.buttonText}>
            {isPlaying ? t('PAUSE') : t('PLAY')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlButton} onPress={skipForward}>
          <Text style={styles.buttonText}>{'>>'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  equalizer: {
    marginVertical: 10,
    marginHorizontal: 10,
  },
  slider: {
    width: width * 0.9,
    height: 40,
    color: '#2196F3',
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: width * 0.9,
    marginBottom: 10,
  },
  timeText: {
    color: 'black',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: width * 0.8,
    marginVertical: 20,
  },
  playButton: {
    width: 80,
    height: 80,
    backgroundColor: '#2196F3',
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
  },
  controlButton: {
    width: 60,
    height: 60,
    backgroundColor: 'gray',
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  closeButton: {
    position: 'absolute',
    right: 10, 
    top: 60,
    backgroundColor: '#2196F3',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  titleContainer: {
    flex: 0.2,
    flexDirection: 'column',
    padding: 10,
    alignItems: "left",
    width: "100%",
  },
  titleText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 16,
    marginBottom: 4,
  },
  greyText: {
    color: '#666666',
  }
});

export default MediaPlayer;
