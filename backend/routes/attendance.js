const express = require('express');
const Attendance = require('../models/Attendance');
const { authenticate } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { validateLocation, getAttendanceStatus } = require('../middleware/gps');

const router = express.Router();

// ─── Helper: get today's date string ─────────────────────────────────────────
const getTodayString = () => new Date().toISOString().split('T')[0];

// ─── POST /api/attendance/check-in ───────────────────────────────────────────
router.post('/check-in', authenticate, upload.single('image'), async (req, res) => {
  try {
    const { lat, lng } = req.body;
    const today = getTodayString();

    // Validate GPS coordinates
    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: 'بيانات الموقع مطلوبة'
      });
    }

    // GPS Validation
    const locationCheck = validateLocation(parseFloat(lat), parseFloat(lng));
    if (!locationCheck.isValid) {
      return res.status(400).json({
        success: false,
        message: `أنت خارج نطاق العمل المسموح به. المسافة الحالية: ${locationCheck.distance} متر (المسموح: ${locationCheck.allowedRadius} متر)`,
        distance: locationCheck.distance,
      });
    }

    // Check if already checked in today
    const existingRecord = await Attendance.findOne({
      userId: req.user._id,
      date: today,
    });

    if (existingRecord && existingRecord.checkInTime) {
      return res.status(400).json({
        success: false,
        message: 'لقد قمت بتسجيل الحضور بالفعل اليوم'
      });
    }

    const checkInTime = new Date();
    const status = getAttendanceStatus(checkInTime);

    // Build image path
    const imagePath = req.file
      ? `/uploads/${req.file.path.split('uploads/')[1]}`
      : null;

    if (existingRecord) {
      existingRecord.checkInTime = checkInTime;
      existingRecord.checkInLocation = { lat: parseFloat(lat), lng: parseFloat(lng) };
      existingRecord.checkInImage = imagePath;
      existingRecord.status = status;
      await existingRecord.save();

      return res.json({
        success: true,
        message: 'تم تسجيل الحضور بنجاح',
        attendance: existingRecord,
        status,
      });
    }

    const attendance = new Attendance({
      userId: req.user._id,
      date: today,
      checkInTime,
      checkInLocation: { lat: parseFloat(lat), lng: parseFloat(lng) },
      checkInImage: imagePath,
      status,
    });

    await attendance.save();

    res.json({
      success: true,
      message: status === 'late' ? 'تم تسجيل الحضور - متأخر' : 'تم تسجيل الحضور بنجاح',
      attendance,
      status,
    });
  } catch (error) {
    console.error('Check-in error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء تسجيل الحضور'
    });
  }
});

// ─── POST /api/attendance/check-out ──────────────────────────────────────────
router.post('/check-out', authenticate, upload.single('image'), async (req, res) => {
  try {
    const { lat, lng } = req.body;
    const today = getTodayString();

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: 'بيانات الموقع مطلوبة'
      });
    }

    // GPS Validation
    const locationCheck = validateLocation(parseFloat(lat), parseFloat(lng));
    if (!locationCheck.isValid) {
      return res.status(400).json({
        success: false,
        message: `أنت خارج نطاق العمل المسموح به. المسافة الحالية: ${locationCheck.distance} متر`,
        distance: locationCheck.distance,
      });
    }

    const record = await Attendance.findOne({
      userId: req.user._id,
      date: today,
    });

    if (!record || !record.checkInTime) {
      return res.status(400).json({
        success: false,
        message: 'لم تقم بتسجيل الحضور بعد اليوم'
      });
    }

    if (record.checkOutTime) {
      return res.status(400).json({
        success: false,
        message: 'لقد قمت بتسجيل الانصراف بالفعل اليوم'
      });
    }

    const checkOutTime = new Date();
    const imagePath = req.file
      ? `/uploads/${req.file.path.split('uploads/')[1]}`
      : null;

    record.checkOutTime = checkOutTime;
    record.checkOutLocation = { lat: parseFloat(lat), lng: parseFloat(lng) };
    record.checkOutImage = imagePath;
    record.calculateWorkingHours();
    await record.save();

    const hours = Math.floor(record.workingHours / 60);
    const minutes = record.workingHours % 60;

    res.json({
      success: true,
      message: `تم تسجيل الانصراف بنجاح. ساعات العمل: ${hours}س ${minutes}د`,
      attendance: record,
      workingHours: { hours, minutes },
    });
  } catch (error) {
    console.error('Check-out error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء تسجيل الانصراف'
    });
  }
});

// ─── GET /api/attendance/my-records ──────────────────────────────────────────
router.get('/my-records', authenticate, async (req, res) => {
  try {
    const { month, year } = req.query;
    const currentDate = new Date();
    const targetMonth = parseInt(month) || currentDate.getMonth() + 1;
    const targetYear = parseInt(year) || currentDate.getFullYear();

    const startDate = `${targetYear}-${String(targetMonth).padStart(2, '0')}-01`;
    const endDate = `${targetYear}-${String(targetMonth).padStart(2, '0')}-31`;

    const records = await Attendance.find({
      userId: req.user._id,
      date: { $gte: startDate, $lte: endDate },
    }).sort({ date: -1 });

    // Today's record specifically
    const today = getTodayString();
    const todayRecord = records.find((r) => r.date === today) || null;

    res.json({
      success: true,
      records,
      todayRecord,
      summary: {
        total: records.length,
        present: records.filter((r) => r.status === 'present').length,
        late: records.filter((r) => r.status === 'late').length,
        absent: records.filter((r) => r.status === 'absent').length,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب السجلات'
    });
  }
});

// ─── GET /api/attendance/today-status ────────────────────────────────────────
router.get('/today-status', authenticate, async (req, res) => {
  try {
    const today = getTodayString();
    const record = await Attendance.findOne({
      userId: req.user._id,
      date: today,
    });

    res.json({
      success: true,
      record,
      hasCheckedIn: !!(record && record.checkInTime),
      hasCheckedOut: !!(record && record.checkOutTime),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'حدث خطأ'
    });
  }
});

module.exports = router;