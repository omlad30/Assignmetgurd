import axios from 'axios';
import { toast } from 'react-toastify';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;
    
    // Check if error is Network Error or 5xx server error
    const isNetworkError = !error.response || error.message === 'Network Error';
    const isServerError = error.response && error.response.status >= 500;

    if (config && (isNetworkError || isServerError)) {
      config._retryCount = config._retryCount || 0;
      
      if (config._retryCount < 3) {
        // Show info toast on first retry
        if (config._retryCount === 0) {
          toast.info("Server is waking up (may take up to 50s). Please wait...", { 
            autoClose: 10000, 
            toastId: 'server-wakeup' 
          });
        }

        config._retryCount += 1;
        
        // Exponential backoff or static delay (3 seconds)
        await new Promise((resolve) => setTimeout(resolve, 3000));
        
        return api(config);
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
