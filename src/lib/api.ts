export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export const saveCarbonEntry = async (entry: {
  activityType: string;
  details: Record<string, any>;
  co2: number;
}): Promise<ApiResponse<{ co2: number }>> => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/carbon/calculate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        activityType: entry.activityType,
        details: entry.details,
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to save carbon entry');
    }

    return { success: true, data: { co2: data.co2 || 0 } };
  } catch (error) {
    console.error('Error saving carbon entry:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to save carbon entry' 
    };
  }
};


// Fetch user-specific carbon stats (daily and weekly)
export const getCarbonStats = async (): Promise<ApiResponse<{ daily: any[]; weekly: any[] }>> => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/carbon/stats`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
    });
    if (!response.ok) throw new Error('Failed to fetch carbon stats');
    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('Error fetching carbon stats:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch carbon stats' };
  }
};
