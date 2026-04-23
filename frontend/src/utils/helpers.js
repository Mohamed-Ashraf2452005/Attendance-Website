/**
 * Haversine formula - client-side GPS validation
 * Returns distance in meters between two coordinates
 */
export const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const toRad = (v) => (v * Math.PI) / 180;

/**
 * Format minutes into Arabic hours/minutes string
 */
export const formatWorkingHours = (minutes) => {
  if (!minutes) return '—';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} دقيقة`;
  if (m === 0) return `${h} ساعة`;
  return `${h}س ${m}د`;
};

/**
 * Format date to Arabic readable format
 */
export const formatArabicDate = (dateStr) => {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  return date.toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

/**
 * Format time to Arabic readable format
 */
export const formatArabicTime = (dateStr) => {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  return date.toLocaleTimeString('ar-EG', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const getStatusLabel = (status) => {
  const labels = { present: 'حاضر', late: 'متأخر', absent: 'غائب' };
  return labels[status] || status;
};

export const getStatusClass = (status) => {
  const classes = {
    present: 'badge-present',
    late: 'badge-late',
    absent: 'badge-absent',
  };
  return classes[status] || '';
};