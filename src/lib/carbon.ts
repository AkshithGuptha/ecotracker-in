import { saveCarbonEntry, getCarbonStats } from './api';

export type DailyEntry = {
  date: string; // YYYY-MM-DD
  value: number; // kg CO2
  savedAt: number; // timestamp
};

// User scoping helpers
export const getCurrentUserId = (): string => {
  try {
    const v = localStorage.getItem("auth:userId");
    if (v && v.trim().length > 0) return v;
    // fallback to stored user object (set by auth helper)
    const userRaw = localStorage.getItem('user') || localStorage.getItem('userData');
    if (userRaw) {
      try {
        const u = JSON.parse(userRaw);
        if (u && (u.id || u._id)) return String(u.id || u._id);
      } catch (e) {
        // ignore
      }
    }
    return "anon";
  } catch {
    return "anon";
  }
};

export const scopedKey = (base: string): string => `${base}::${getCurrentUserId()}`;

const getEntriesKey = () => scopedKey("carbon:entries");
const getPointsKey = () => scopedKey("carbon:points");

const toISODate = (d: Date) => d.toISOString().slice(0, 10);

const getStartOfDay = (d = new Date()) => {
  const dt = new Date(d);
  dt.setHours(0, 0, 0, 0);
  return dt;
};

const setEntries = (entries: DailyEntry[]) => {
  try {
    localStorage.setItem(getEntriesKey(), JSON.stringify(entries));
  } catch (error) {
    console.error('Error saving entries to local storage:', error);
  }
};

export const addPoints = (points: number) => {
  try {
    const current = Number(localStorage.getItem(getPointsKey()) || '0');
    const newTotal = Math.max(0, current + points);
    localStorage.setItem(getPointsKey(), newTotal.toString());
    window.dispatchEvent(new CustomEvent(POINTS_EVENT, { detail: newTotal }));
    return newTotal;
  } catch (error) {
    console.error('Error updating points:', error);
    return 0;
  }
};

export const POINTS_EVENT = "carbon:points:update";

export const getPoints = (): number => {
  try {
    return Number(localStorage.getItem(getPointsKey()) || '0');
  } catch (error) {
    console.error('Error getting points:', error);
    return 0;
  }
};

export const getCooldownRemainingMs = (lastSavedAt: number): number => {
  const COOLDOWN_PERIOD_MS = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  const now = Date.now();
  const timeSinceLastSave = now - lastSavedAt;
  return Math.max(0, COOLDOWN_PERIOD_MS - timeSinceLastSave);
};


// Fetch user-specific carbon entries (for dashboard)
export async function getEntries(): Promise<DailyEntry[]> {
  try {
    // Fetch user-specific stats from backend
    const { success, data } = await getCarbonStats();
    if (success && data && Array.isArray(data.daily)) {
      // Map backend daily entries to DailyEntry[], converting UTC dates to local date strings
      const localEntries = data.daily.map(entry => {
        const rawDate = entry.date ? String(entry.date) : '';
        let localDateStr = '';
        let savedAt = Date.now();
        if (rawDate) {
          const dt = new Date(rawDate);
          // Convert UTC midnight to local date by adjusting for timezone offset
          const localMs = dt.getTime() - dt.getTimezoneOffset() * 60000;
          const localDt = new Date(localMs);
          localDateStr = localDt.toISOString().slice(0, 10);
          savedAt = dt.getTime();
        }
        return {
          date: localDateStr,
          value: typeof entry.co2 === 'number' ? entry.co2 : 0,
          savedAt,
        };
      });
      // Only overwrite local storage if backend actually returned entries
      if (localEntries.length > 0) {
        setEntries(localEntries);
        return localEntries;
      }
      // else fall through to local storage fallback
    }
    // Fallback to local storage if backend fails
    const raw = localStorage.getItem(getEntriesKey());
    if (!raw) return [];
    const parsed = JSON.parse(raw) as DailyEntry[];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(e => typeof e?.date === "string" && typeof e?.value === "number" && typeof e?.savedAt === "number")
      .sort((a, b) => a.date.localeCompare(b.date));
  } catch (error) {
    console.error('Error getting entries:', error);
    return [];
  }
}

export const saveTodayEmissions = async (value: number) => {
  if (!Number.isFinite(value) || value <= 0) {
    return { saved: false, reason: "invalid" };
  }
  
  const entries = await getEntries();
  const now = Date.now();
  const today = toISODate(new Date());
  const todayEntry = entries.find(e => e.date === today);

  // Check cooldown (24h from last save)
  if (todayEntry) {
    const elapsed = now - todayEntry.savedAt;
    const remaining = 24 * 60 * 60 * 1000 - elapsed;
    if (remaining > 0) {
      return { saved: false, reason: "cooldown", remainingMs: remaining };
    }
  }

  // Try to save to backend first
  try {
    await saveCarbonEntry({
      activityType: 'manual',
      details: { manualEntry: true },
      co2: value
    });
  } catch (error) {
    console.error('Failed to save to backend, using local storage only:', error);
  }

  // Update or add today's entry in local storage
  const updatedEntries = entries.filter(e => e.date !== today);
  updatedEntries.push({ date: today, value, savedAt: now });
  
  // Sort by date
  updatedEntries.sort((a, b) => a.date.localeCompare(b.date));
  
  setEntries(updatedEntries);
  
  // Check yesterday's entry for comparison
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayEntry = updatedEntries.find(e => e.date === toISODate(yesterday));
  
  let comparison: "improved" | "worsened" | "same" | "none" = "none";
  let points = 0;
  
  if (yesterdayEntry) {
    if (value < yesterdayEntry.value) {
      comparison = "improved";
      points = 10;
    } else if (value > yesterdayEntry.value) {
      comparison = "worsened";
      points = -5;
    } else {
      comparison = "same";
      points = -5; // No change is treated as worsened
    }
  }
  
  // Update points if there was a change
  if (points !== 0) {
    addPoints(points);
  }
  
  return { 
    saved: true, 
    comparison,
    pointsAwarded: points,
    previousValue: yesterdayEntry?.value
  };
};

export type WeeklyDatum = { label: string; date: string; value: number };


// Returns data for current week Monday..Sunday
export async function getWeeklyData(): Promise<WeeklyDatum[]> {
  // Fetch user-specific weekly stats from backend
  const { success, data } = await getCarbonStats();
  const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  if (success && data && Array.isArray(data.weekly) && data.weekly.length > 0) {
    // Convert backend dates (UTC) to local dates so the weekday aligns with the client
    return data.weekly.map((d, i) => {
      const rawDate = d.date ? String(d.date) : '';
      let dateStr = rawDate;
      let label = labels[i] || rawDate;
      if (rawDate) {
        const dt = new Date(rawDate);
        const localMs = dt.getTime() - dt.getTimezoneOffset() * 60000;
        const localDt = new Date(localMs);
        dateStr = localDt.toISOString().slice(0,10);
        label = localDt.toLocaleDateString('en-US', { weekday: 'short' });
      }
      return {
        label,
        date: dateStr,
        value: typeof d.co2 === 'number' ? d.co2 : 0,
      };
    });
  }
  // fallback: try to build week from local storage entries
  try {
    const raw = localStorage.getItem(getEntriesKey());
    const entries: DailyEntry[] = raw ? JSON.parse(raw) : [];

    // Determine current week's Monday and create array for 7 days
    const now = new Date();
    const dayOfWeek = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7));
    monday.setHours(0,0,0,0);

    const weekData: WeeklyDatum[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dateStr = d.toISOString().slice(0,10);
      const entry = entries.find(e => e.date === dateStr);
      weekData.push({
        label: labels[i],
        date: dateStr,
        value: entry ? entry.value : 0
      });
    }
    return weekData;
  } catch (error) {
    console.error('Error building weekly data from local storage:', error);
    return labels.map((label) => ({ label, date: '', value: 0 }));
  }
}
