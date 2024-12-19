// src/services/api/config.js
import axios from 'axios';

// export const API_BASE_URL = 'https://dev.elevate-apis.shikshalokam.org/mentoring/';
export const API_BASE_URL = 'https://qa.elevate-apis.shikshalokam.org/shiksha-chaupal/';


export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});