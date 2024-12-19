// src/services/api/audioService.js
import {apiClient} from './config';
import axios from 'axios';
import RNFS from 'react-native-fs';

export const audioService = {
  // Get pre-signed URL
  getPreSignedUrl: async fileDetails => {
    try {
      const response = await apiClient.get(
        `v1/cloud-services/getSignedUrl?fileName=${fileDetails.fileName}&dynamicPath=shikshachaupal`,
        {
          headers: {
            access_token:
              'erg1gigWdxOQPfTz0yr7cf7pal46paL93EhvxFu0uskZZ8H73kZAlydT9MEcLZiz',
          },
        },
      );
      return response.data;
    } catch (error) {
      throw new Error('Failed to get pre-signed URL: ' + error.message);
    }
  },

  // Upload to S3/Storage
  uploadFile: async (preSignedUrl, file) => {
    try {
      const filePath = `${RNFS.DocumentDirectoryPath}/${file}`;     
      const exists = await RNFS.exists(filePath);
      if (!exists) {
        throw new Error('File does not exist at path: ' + filePath);
      }

      // Read the file
      const fileContent = await RNFS.readFile(filePath, 'base64');
      const binaryData = Uint8Array.from(
        atob(fileContent),
        (char) => char.charCodeAt(0)
      );      
      const response = await axios.put(preSignedUrl, binaryData, {
        headers: {
          'Content-Type': 'audio/mpeg',
        },
      });
      console.log(response)
      return response;
    } catch (error) {
      throw new Error('Failed to upload file: ' + error.message);
    }
  },

   

  // Create record in your backend
  createAudioRecord: async audioDetails => {
    try {
      const response = await apiClient.post(
        'v1/recordings/create',
        audioDetails,
        {
          headers: {
            access_token:
              'erg1gigWdxOQPfTz0yr7cf7pal46paL93EhvxFu0uskZZ8H73kZAlydT9MEcLZiz',
            'Content-Type': 'application/json',
          },
        },
      );
      return response.data;
    } catch (error) {
      throw new Error('Failed to create audio record: ' + error.message);
    }
  },
};
