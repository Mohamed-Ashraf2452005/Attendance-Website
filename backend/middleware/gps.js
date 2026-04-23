/**
 * Haversine Formula - Calculate distance between two GPS coordinates
 * Returns distance in meters
 */
const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371000; // Earth's radius in meters
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in meters
};

const toRad = (value) => (value * Math.PI) / 180;

/**
 * Validate if employee is within allowed radius of the company
 */
const validateLocation = (employeeLat, employeeLng) => {
  const companyLat = parseFloat(process.env.COMPANY_LAT || '30.7065');
  const companyLng = parseFloat(process.env.COMPANY_LNG || '28.0870');
  const allowedRadius = parseFloat(process.env.COMPANY_RADIUS || '50');

  const distance = calculateDistance(employeeLat, employeeLng, companyLat, companyLng);

  return {
    isValid: distance <= allowedRadius,
    distance: Math.round(distance),
    allowedRadius,
  };
};

/**
 * Determine attendance status based on check-in time
 */
const getAttendanceStatus = (checkInTime) => {
  const workStartHour = parseInt(process.env.WORK_START_HOUR || '9');
  const workStartMinute = parseInt(process.env.WORK_START_MINUTE || '0');

  const checkIn = new Date(checkInTime);
  const workStart = new Date(checkIn);
  workStart.setHours(workStartHour, workStartMinute, 0, 0);

  // Grace period of 15 minutes
  const gracePeriod = 15 * 60 * 1000;

  if (checkIn <= new Date(workStart.getTime() + gracePeriod)) {
    return 'present';
  }
  return 'late';
};

module.exports = { calculateDistance, validateLocation, getAttendanceStatus };