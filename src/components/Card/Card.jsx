import {StyleSheet, Text, View, TouchableOpacity} from 'react-native';
import React, {useState} from 'react';
import {Alert} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import UploadAlert from '../Modal/UploadModalComponent';
import {useTranslation} from 'react-i18next';
import {sortRecordings} from '../../services/utils/utils';

const Card = ({item, setRecordings, setSelectedMusic, setShowMusicPlayer}) => {
  const [uploadModal, setuploadModal] = useState(false);
  const {t} = useTranslation();

  const ActionButton = ({onPress, label, color, disabled}) => (
    <TouchableOpacity
      style={[
        styles.actionButton,
        {backgroundColor: color},
        disabled && styles.disabledButton,
      ]}
      onPress={onPress}
      disabled={disabled}>
      <Text style={styles.actionButtonText}>{label}</Text>
    </TouchableOpacity>
  );

  const deleteRecording = async recording => {
    let id = recording.id;
    Alert.alert(
      t('CONFIRM_DELETE'),
      recording.isUploaded
        ? t('CONFIRM_DELETE_SUCCESS_MSG')
        : t('CONFIRM_DELETE_FAIL_MSG'),
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
              const recordings = await AsyncStorage.getItem(
                'shikshachaupalrecording',
              );
              const parsedItems = recordings ? JSON.parse(recordings) : [];
              let updatedRecordings = parsedItems.filter(item => item.id !== id);
              let sortRecord = sortRecordings(updatedRecordings);
              await AsyncStorage.setItem(
                'shikshachaupalrecording',
                JSON.stringify(sortRecord),
              );
              setRecordings(sortRecord);
              setSelectedMusic();
              Alert.alert(t('SUCCESS_DELETE'));
            } catch (error) {
              console.error('Error removing item:', error);
              Alert.alert(t('ERROR_DETELE'));
            }
          },
        },
      ],
    );
  };

  const handlePlay = recordings => {
    setSelectedMusic(recordings);
    setShowMusicPlayer(true);
  };

  const formatTimestamp = timestamp => {
    const date = new Date(timestamp);
    const weekday = date.toLocaleString('en-IN', {
      weekday: 'long',
      timeZone: 'Asia/Kolkata',
    });
    const time = date.toLocaleString('en-IN', {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
      timeZone: 'Asia/Kolkata',
    });
    return `${weekday} at ${time}`;
  };

  const formatDateShort = timestamp => {
    const date = new Date(timestamp);
    const options = {
      day: '2-digit',
      month: 'short',
      timeZone: 'Asia/Kolkata',
    };
    return date.toLocaleString('en-IN', options).replace('-', ' ');
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.infoContainer}>
          <Text style={styles.recordingText}>{formatTimestamp(item.id)}</Text>
          <Text style={styles.durationText}>
            {formatDateShort(item.id)} • {item.duration}
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          <ActionButton
            onPress={() => handlePlay(item)}
            label={t('PLAY')}
            color="#2196F3"
          />
          <ActionButton
            onPress={() => deleteRecording(item)}
            label={t('DELETE')}
            color="#F44336"
          />
          {item.isUploaded ? (
            <View style={styles.uploadedStatus}>
              <Text style={styles.uploadedStatusText}>{t('UPLOAD_SUCCESS')}</Text>
            </View>
          ) : (
            <ActionButton
              onPress={() => setuploadModal(true)}
              label={t('UPLOAD')}
              color="#4CAF50"
            />
          )}
        </View>
      </View>
      <UploadAlert
        visible={uploadModal}
        onClose={() => setuploadModal(false)}
        recordingPath={item}
        setRecordings={setRecordings}
      />
    </View>
  );
};

export default Card;

const styles = StyleSheet.create({
  container: {
    paddingVertical: 6,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000000',
    shadowOpacity: 0.1,
    shadowOffset: {width: 0, height: 1},
    shadowRadius: 3,
    padding: 16,
  },
  infoContainer: {
    marginBottom: 12,
  },
  recordingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  durationText: {
    fontSize: 14,
    color: '#666666',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  actionButton: {
    flex: 1,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.5,
  },
  uploadedStatus: {
    flex: 1,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadedStatusText: {
    color: '#2E7D32',
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
});