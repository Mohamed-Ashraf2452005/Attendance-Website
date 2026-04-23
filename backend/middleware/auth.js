const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ─── Authenticate JWT Token ───────────────────────────────────────────────────
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'الوصول مرفوض. يرجى تسجيل الدخول أولاً'
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');

    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'المستخدم غير موجود أو غير نشط'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى'
      });
    }
    return res.status(401).json({
      success: false,
      message: 'رمز التحقق غير صالح'
    });
  }
};

// ─── Authorize Admin Role ─────────────────────────────────────────────────────
const authorizeAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'هذه العملية تتطلب صلاحيات المدير'
    });
  }
  next();
};

module.exports = { authenticate, authorizeAdmin };