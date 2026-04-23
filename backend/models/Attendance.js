const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    date: {
      type: String, // YYYY-MM-DD format for easy querying
      required: true,
    },
    checkInTime: {
      type: Date,
      default: null,
    },
    checkOutTime: {
      type: Date,
      default: null,
    },
    checkInLocation: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
    },
    checkOutLocation: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
    },
    checkInImage: {
      type: String,
      default: null,
    },
    checkOutImage: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ['present', 'late', 'absent'],
      default: 'absent',
    },
    workingHours: {
      type: Number, // in minutes
      default: 0,
    },
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// ─── Compound index for userId + date (one record per user per day) ───────────
attendanceSchema.index({ userId: 1, date: 1 }, { unique: true });

// ─── Calculate working hours when checking out ────────────────────────────────
attendanceSchema.methods.calculateWorkingHours = function () {
  if (this.checkInTime && this.checkOutTime) {
    const diffMs = this.checkOutTime - this.checkInTime;
    this.workingHours = Math.round(diffMs / 60000); // in minutes
  }
};

module.exports = mongoose.model('Attendance', attendanceSchema);