import { format, formatDistance, parseISO, isSameDay, isSameMonth, isSameYear, startOfDay, endOfDay } from 'date-fns';
import { id } from 'date-fns/locale';

// Format date to Indonesian format
export const formatDate = (date, formatStr = 'dd/MM/yyyy') => {
  if (!date) return '';
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, formatStr, { locale: id });
};

// Format date with time
export const formatDateTime = (date) => {
  return formatDate(date, 'dd/MM/yyyy HH:mm');
};

// Format relative time (e.g., "2 jam yang lalu")
export const formatRelativeTime = (date) => {
  if (!date) return '';
  const d = typeof date === 'string' ? parseISO(date) : date;
  return formatDistance(d, new Date(), { addSuffix: true, locale: id });
};

// Check if dates are in same day
export const isToday = (date) => {
  return isSameDay(new Date(), date);
};

// Get date range for filtering
export const getTodayRange = () => {
  return {
    start: startOfDay(new Date()),
    end: endOfDay(new Date())
  };
};

// Get month range
export const getMonthRange = (date = new Date()) => {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  return { start, end };
};

// Get year range
export const getYearRange = (year = new Date().getFullYear()) => {
  const start = new Date(year, 0, 1);
  const end = new Date(year, 11, 31);
  return { start, end };
};

// Group dates by periods
export const groupByDay = (items, dateField = 'createdAt') => {
  const grouped = {};
  items.forEach(item => {
    const date = formatDate(item[dateField], 'yyyy-MM-dd');
    if (!grouped[date]) grouped[date] = [];
    grouped[date].push(item);
  });
  return grouped;
};

export const groupByMonth = (items, dateField = 'createdAt') => {
  const grouped = {};
  items.forEach(item => {
    const date = formatDate(item[dateField], 'yyyy-MM');
    if (!grouped[date]) grouped[date] = [];
    grouped[date].push(item);
  });
  return grouped;
};

export const groupByYear = (items, dateField = 'createdAt') => {
  const grouped = {};
  items.forEach(item => {
    const date = formatDate(item[dateField], 'yyyy');
    if (!grouped[date]) grouped[date] = [];
    grouped[date].push(item);
  });
  return grouped;
};





