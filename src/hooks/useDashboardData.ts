import { useState, useEffect, useCallback } from 'react';
import { getEntries as getCarbonEntries, getWeeklyData as getCarbonWeeklyData } from '@/lib/carbon';
import { DailyEntry, WeeklyDatum } from '@/lib/carbon';

export const useDashboardData = () => {
  const [entries, setEntries] = useState<DailyEntry[]>([]);
  const [weeklyData, setWeeklyData] = useState<WeeklyDatum[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      // Fetch entries and weekly data in parallel (now user-specific)
      const [entriesData, weeklyData] = await Promise.all([
        getCarbonEntries(),
        getCarbonWeeklyData()
      ]);
      setEntries(entriesData);
      setWeeklyData(weeklyData);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Calculate derived state
  const pointsToday = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    const todayEntries = entries.filter(entry => entry.date === today);
    return todayEntries.reduce((sum, entry) => sum + (entry.value || 0), 0);
  }, [entries]);

  const currentStreak = useCallback(() => {
    // Implementation of streak calculation
    // This is a simplified version - you might want to enhance it
    if (entries.length === 0) return 0;
    
    // Sort entries by date in descending order
    const sorted = [...entries].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    
    let streak = 0;
    let prevDate = new Date();
    
    for (const entry of sorted) {
      const entryDate = new Date(entry.date);
      const diffTime = Math.abs(prevDate.getTime() - entryDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        streak++;
      } else if (diffDays > 1) {
        break; // Streak broken
      }
      
      prevDate = entryDate;
    }
    
    return streak;
  }, [entries]);

  const actionsToday = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    return entries.filter(entry => entry.date === today).length;
  }, [entries]);

  return {
    entries,
    weeklyData,
    isLoading,
    error,
    pointsToday: pointsToday(),
    currentStreak: currentStreak(),
    actionsToday: actionsToday(),
    refresh: fetchData
  };
};

export default useDashboardData;
