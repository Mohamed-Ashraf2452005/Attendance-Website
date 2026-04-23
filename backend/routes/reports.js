const express = require('express');
const Attendance = require('../models/Attendance');
const User = require('../models/User');
const { authenticate, authorizeAdmin } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate, authorizeAdmin);

// ─── GET /api/reports - Daily/Monthly reports ─────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { date, month, year, userId, type = 'daily' } = req.query;
    const currentDate = new Date();

    let query = {};

    if (type === 'daily') {
      const targetDate = date || currentDate.toISOString().split('T')[0];
      query.date = targetDate;
    } else if (type === 'monthly') {
      const targetMonth = parseInt(month) || currentDate.getMonth() + 1;
      const targetYear = parseInt(year) || currentDate.getFullYear();
      const startDate = `${targetYear}-${String(targetMonth).padStart(2, '0')}-01`;
      const endDate = `${targetYear}-${String(targetMonth).padStart(2, '0')}-31`;
      query.date = { $gte: startDate, $lte: endDate };
    }

    if (userId) query.userId = userId;

    const records = await Attendance.find(query)
      .populate('userId', 'name email department phone')
      .sort({ date: -1, checkInTime: 1 });

    // Statistics
    const stats = {
      total: records.length,
      present: records.filter((r) => r.status === 'present').length,
      late: records.filter((r) => r.status === 'late').length,
      absent: records.filter((r) => r.status === 'absent').length,
      totalWorkingMinutes: records.reduce((sum, r) => sum + (r.workingHours || 0), 0),
    };

    stats.avgWorkingHours =
      records.length > 0
        ? Math.round(stats.totalWorkingMinutes / records.length)
        : 0;

    res.json({
      success: true,
      records,
      stats,
    });
  } catch (error) {
    console.error('Reports error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب التقارير'
    });
  }
});

// ─── GET /api/reports/dashboard ──────────────────────────────────────────────
router.get('/dashboard', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const totalEmployees = await User.countDocuments({
      role: 'employee',
      isActive: true,
    });

    const todayRecords = await Attendance.find({ date: today }).populate(
      'userId',
      'name'
    );

    const checkedIn = todayRecords.filter((r) => r.checkInTime);
    const present = todayRecords.filter((r) => r.status === 'present').length;
    const late = todayRecords.filter((r) => r.status === 'late').length;
    const absent = totalEmployees - checkedIn.length;

    // Last 7 days trend
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayRecords = await Attendance.find({ date: dateStr });
      last7Days.push({
        date: dateStr,
        present: dayRecords.filter((r) => r.status === 'present').length,
        late: dayRecords.filter((r) => r.status === 'late').length,
        absent: totalEmployees - dayRecords.filter((r) => r.checkInTime).length,
      });
    }

    res.json({
      success: true,
      stats: {
        totalEmployees,
        todayPresent: present,
        todayLate: late,
        todayAbsent: absent,
        todayCheckedIn: checkedIn.length,
      },
      todayRecords,
      last7Days,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب بيانات لوحة التحكم'
    });
  }
});

module.exports = router;