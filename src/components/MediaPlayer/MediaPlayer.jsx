import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Dimensions,
} from 'react-native';
import Sound from 'react-native-sound';
import Svg, { Line } from 'react-native-svg';
import Slider from '@react-native-community/slider';
import { useTranslation } from 'react-i18next';
const { width } = Dimensions.get('window');

const MediaPlayer = ({filePath}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [waveform, setWaveform] = useState(Array(30).fill(0)); // Initial sound wave
  const [currentPosition, setCurrentPosition] = useState(0); // Current position in the audio
  const [duration, setDuration] = useState(0); // Total audio duration
  const soundRef = useRef(null);
  const progressInterval = useRef(null);
  const { t } = useTranslation();
  // Initialize the sound
  useEffect(() => {
    Sound.setCategory('Playback');
    soundRef.current = new Sound(filePath, null, (error) => {
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

  // Simulate the sound wave for visualization
  const simulateWaveform = () => {
    return setInterval(() => {
      const randomWaveform = Array.from({ length: 30 }, () =>
        Math.floor(Math.random() * 100)
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
        soundRef.current.getCurrentTime((seconds) => {
          setCurrentPosition(seconds);
        });
      }, 1000);
    }
  };

  const skipForward = () => {
    soundRef.current.getCurrentTime((seconds) => {
      const newPosition = Math.min(seconds + 10, duration); // Skip 10 seconds ahead
      soundRef.current.setCurrentTime(newPosition);
      setCurrentPosition(newPosition);
    });
  };

  const skipBackward = () => {
    soundRef.current.getCurrentTime((seconds) => {
      const newPosition = Math.max(seconds - 10, 0); // Skip 10 seconds backward
      soundRef.current.setCurrentTime(newPosition);
      setCurrentPosition(newPosition);
    });
  };

   // Format function to convert seconds into mm:ss format
   const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return  `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };
  return (
    <View style={styles.container}>
      {/* Sound Wave Equalizer */}
      <Svg height={200} width={width} style={styles.equalizer}>
        {waveform.map((value, index) => (
          <Line
            key={index}
            x1={(index * (width / waveform.length)) + 5}
            y1={200 - value} // Height depends on waveform value
            x2={(index * (width / waveform.length)) + 5}
            y2={200}
            stroke="teal"
            strokeWidth="4"
          />
        ))}
      </Svg>

      {/* Progress Tracker */}
      <Slider
        style={styles.slider}
        minimumValue={0}
        maximumValue={duration}
        value={currentPosition}
        onSlidingComplete={(value) => {
          soundRef.current.setCurrentTime(value);
          setCurrentPosition(value);
        }}
        minimumTrackTintColor="teal"
        maximumTrackTintColor="gray"
        thumbTintColor="teal"
      />
      <View style={styles.timeContainer}>
        <Text style={styles.timeText}>
        {formatTime(currentPosition)}
        </Text>
        <Text style={styles.timeText}>
        {formatTime(duration)}
        </Text>
      </View>

      {/* Control Buttons */}
      <View style={styles.controls}>
        <TouchableOpacity style={styles.controlButton} onPress={skipBackward}>
          <Text style={styles.buttonText}>{'<<'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.playButton} onPress={togglePlayback}>
          <Text style={styles.buttonText}>{isPlaying ? t('PAUSE') : t('PLAY')}</Text>
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
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },
  equalizer: {
    marginVertical: 20,
    backgroundColor: '#1e1e1e',
  },
  slider: {
    width: width * 0.9,
    height: 40,
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
    backgroundColor: 'teal',
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
});

export default MediaPlayer;
