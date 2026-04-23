const express = require('express');
const User = require('../models/User');
const { authenticate, authorizeAdmin } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication + admin role
router.use(authenticate, authorizeAdmin);

// ─── GET /api/users ───────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { search, role, page = 1, limit = 20 } = req.query;

    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    if (role) query.role = role;

    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      success: true,
      users,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب الموظفين'
    });
  }
});

// ─── POST /api/users ──────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const { name, email, password, role, phone, department } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'الاسم والبريد الإلكتروني وكلمة المرور مطلوبة'
      });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'البريد الإلكتروني مستخدم بالفعل'
      });
    }

    const user = new User({
      name,
      email: email.toLowerCase(),
      password,
      role: role || 'employee',
      phone,
      department,
    });

    await user.save();

    res.status(201).json({
      success: true,
      message: 'تم إضافة الموظف بنجاح',
      user: user.toJSON(),
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'البريد الإلكتروني مستخدم بالفعل'
      });
    }
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء إضافة الموظف'
    });
  }
});

// ─── PUT /api/users/:id ───────────────────────────────────────────────────────
router.put('/:id', async (req, res) => {
  try {
    const { name, email, password, role, phone, department, isActive } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'الموظف غير موجود'
      });
    }

    if (name) user.name = name;
    if (email) user.email = email.toLowerCase();
    if (phone !== undefined) user.phone = phone;
    if (department !== undefined) user.department = department;
    if (role) user.role = role;
    if (isActive !== undefined) user.isActive = isActive;
    if (password) user.password = password; // Will be re-hashed by pre-save hook

    await user.save();

    res.json({
      success: true,
      message: 'تم تحديث بيانات الموظف بنجاح',
      user: user.toJSON(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء تحديث بيانات الموظف'
    });
  }
});

// ─── DELETE /api/users/:id ────────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    // Prevent deleting yourself
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'لا يمكنك حذف حسابك الخاص'
      });
    }

    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'الموظف غير موجود'
      });
    }

    res.json({
      success: true,
      message: 'تم حذف الموظف بنجاح'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء حذف الموظف'
    });
  }
});

module.exports = router;