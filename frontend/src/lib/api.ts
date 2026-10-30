import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { fetchAuthSession } from 'aws-amplify/auth';
import { awsConfig } from '../lib/amplify';

// ─── Axios instance ────────────────────────────────────
export const apiClient = axios.create({
  baseURL: awsConfig.apiBaseUrl,
  timeout: 30_000,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Auth interceptor: attach Cognito JWT ─────────────
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const session = await fetchAuthSession();
      const token = session.tokens?.accessToken?.toString();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // Not authenticated — let the API reject it
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response interceptor: normalize errors ───────────
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Redirect to login on auth failure
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
