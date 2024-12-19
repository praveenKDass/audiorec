// src/services/api/audioService.js
import { apiClient } from './config';
import axios from 'axios';
export const audioService = {
  // Get pre-signed URL
  getPreSignedUrl: async (fileDetails) => {
    try {
      const response = await apiClient.get(`v1/cloud-services/getSignedUrl?fileName=${fileDetails}&dynamicPath=shikshachaupal`, 
        {
            headers: {
                 'internal_access_token': 'erg1gigWdxOQPfTz0yr7cf7pal46paL93EhvxFu0uskZZ8H73kZAlydT9MEcLZiz'
            }
          }
      );
      return response.data;
    } catch (error) {
      throw new Error('Failed to get pre-signed URL: ' + error.message);
    }
  },

  // Upload to S3/Storage
  uploadFile: async (preSignedUrl, file) => {
    try {
      const response = await axios.put(preSignedUrl, file, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      console.log(response.status)
      return response.data;
    } catch (error) {
      throw new Error('Failed to upload file: ' + error.message);
    }
  },

  // Create record in your backend
  createAudioRecord: async (audioDetails) => {
    try {
      const response = await apiClient.post('v1/recordings/create', audioDetails,{
        headers: {
            'internal_access_token': 'erg1gigWdxOQPfTz0yr7cf7pal46paL93EhvxFu0uskZZ8H73kZAlydT9MEcLZiz',
             "Content-Type":"application/json"
        }
      });
      return response.data;
    } catch (error) {
      throw new Error('Failed to create audio record: ' + error.message);
    }
  },
};