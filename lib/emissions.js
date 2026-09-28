// API configuration
const getApiBaseUrl = () => {
  // In the browser, use relative URL
  if (typeof window !== 'undefined') return '';
  // On the server, use the environment variable or default to localhost:3000
  return process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';
};

const API_BASE = getApiBaseUrl();
const API_PREFIX = `${API_BASE}${API_BASE ? '' : '/'}api`;

/**
 * Save daily emissions
 * @param {number} emissions - The emissions value to save
 * @returns {Promise<Object>} - The response data
 */
export const saveDailyEmission = async (emissions) => {
  try {
    const url = `${API_PREFIX}/emissions/save`;
    console.log('Saving emissions to:', url);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ emissions }),
    });

    // Handle non-JSON responses
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('Non-JSON response:', text);
      throw new Error('Invalid response from server');
    }

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error('Error saving emissions:', error);
    throw error;
  }
};

// Get emission history
export const getEmissionHistory = async () => {
  try {
    const response = await fetch('/api/emissions/history', {
      credentials: 'include',
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch emission history');
    }

    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error fetching emission history:', error);
    return []; // Return empty array on error to prevent UI breakage
  }
};

// Check if emissions were saved today
export const hasSavedEmissionsToday = (lastEmissionDate) => {
  if (!lastEmissionDate) return false;
  
  const today = new Date();
  const lastDate = new Date(lastEmissionDate);
  
  return (
    lastDate.getDate() === today.getDate() &&
    lastDate.getMonth() === today.getMonth() &&
    lastDate.getFullYear() === today.getFullYear()
  );
  
  return lastDate.getTime() === today.getTime();
};
