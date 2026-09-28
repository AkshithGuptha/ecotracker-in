export interface DailyEntry {
  date: string;
  value: number;
  savedAt: number;
}

export interface WeeklyDatum {
  label: string;
  date: string;
  value: number;
}

export interface DashboardData {
  entries: DailyEntry[];
  weeklyData: WeeklyDatum[];
  isLoading: boolean;
  error: string | null;
  pointsToday: number;
  currentStreak: number;
  actionsToday: number;
  refresh: () => Promise<void>;
}
