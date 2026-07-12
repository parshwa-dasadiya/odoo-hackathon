const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Generic request wrapper
 */
async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  
  // Setup headers
  const headers = new Headers({
    'Content-Type': 'application/json',
    ...options.headers,
  });

  // Automatically attach JWT token if it exists in localStorage
  const token = localStorage.getItem('token');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, config);
    
    // Parse JSON safely
    let responseData = null;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      responseData = { message: await response.text() };
    }

    if (!response.ok) {
      // If unauthorized (401), we might want to auto-logout the user
      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // Optional: redirect to login if we are in browser
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
          window.location.href = '/login?session_expired=true';
        }
      }
      
      // Throw structured error matching backend shape
      const errorMsg = responseData?.message || responseData?.error || `Request failed with status ${response.status}`;
      const error = new Error(errorMsg);
      error.status = response.status;
      error.data = responseData?.data || null;
      error.success = false;
      throw error;
    }

    // Standardize successful response
    return {
      success: true,
      message: responseData?.message || 'Success',
      data: responseData?.data !== undefined ? responseData.data : responseData,
    };
  } catch (error) {
    // If it's already a structured request error, rethrow it
    if (error.status !== undefined) {
      throw error;
    }
    
    // Otherwise it's a network/connection error
    const networkError = new Error(error.message || 'Network connection failed. Please check your internet connection.');
    networkError.status = 503;
    networkError.success = false;
    networkError.data = null;
    throw networkError;
  }
}

// HTTP helper methods
export const get = (endpoint, options = {}) => request(endpoint, { ...options, method: 'GET' });
export const post = (endpoint, body, options = {}) => request(endpoint, { ...options, method: 'POST', body: JSON.stringify(body) });
export const put = (endpoint, body, options = {}) => request(endpoint, { ...options, method: 'PUT', body: JSON.stringify(body) });
export const del = (endpoint, options = {}) => request(endpoint, { ...options, method: 'DELETE' });

export default {
  get,
  post,
  put,
  delete: del,
};
