import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import useCamera from '../hooks/useCamera';
import useGeolocation from '../hooks/useGeolocation';
import { formatWorkingHours } from '../utils/helpers';

const StepIndicator = ({ step, current, label }) => (
  <div className="flex flex-col items-center">
    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
      current > step ? 'bg-green-500 text-white' :
      current === step ? 'bg-primary-600 text-white shadow-lg shadow-primary-200' :
      'bg-slate-200 dark:bg-slate-600 text-slate-400'
    }`}>
      {current > step ? '✓' : step}
    </div>
    <span className="text-xs text-slate-500 mt-1 text-center">{label}</span>
  </div>
);

const AttendanceFlow = ({ type, onComplete, onCancel }) => {
  const [step, setStep] = useState(1); // 1=camera, 2=capture, 3=gps, 4=submit
  const [submitting, setSubmitting] = useState(false);

  const {
    videoRef, canvasRef, stream, capturedImage, error: camError,
    isActive, startCamera, capturePhoto, retake, dataUrlToBlob
  } = useCamera();

  const { error: gpsError, loading: gpsLoading, getLocation } = useGeolocation();
  const [location, setLocation] = useState(null);

  const typeLabel = type === 'checkin' ? 'الحضور' : 'الانصراف';
  const typeColor = type === 'checkin' ? 'bg-green-500 hover:bg-green-600' : 'bg-rose-500 hover:bg-rose-600';

  // Start camera on mount
  useEffect(() => {
    startCamera();
    return () => {}; // cleanup handled in hook
  }, []);

  const handleCapture = () => {
    const photo = capturePhoto();
    if (photo) {
      setStep(2);
    }
  };

  const handleGetLocation = async () => {
    setStep(3);
    try {
      const coords = await getLocation();
      setLocation(coords);
      setStep(4);
    } catch (err) {
      toast.error(err.message);
      setStep(2);
    }
  };

  const handleSubmit = async () => {
    if (!capturedImage || !location) return;
    setSubmitting(true);

    try {
      const formData = new FormData();
      const blob = dataUrlToBlob(capturedImage);
      formData.append('image', blob, 'attendance.jpg');
      formData.append('lat', location.lat);
      formData.append('lng', location.lng);

      const endpoint = type === 'checkin' ? '/attendance/check-in' : '/attendance/check-out';
      const res = await api.post(endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success(res.data.message);
      onComplete(res.data);
    } catch (err) {
      const msg = err.response?.data?.message || 'حدث خطأ أثناء التسجيل';
      toast.error(msg);
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-slide-up">
        {/* Header */}
        <div className={`p-5 text-white ${type === 'checkin' ? 'bg-gradient-to-l from-green-600 to-green-500' : 'bg-gradient-to-l from-rose-600 to-rose-500'}`}>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">تسجيل {typeLabel}</h2>
            <button onClick={onCancel} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Steps */}
          <div className="flex items-center justify-between mt-4 px-4">
            <StepIndicator step={1} current={step} label="الكاميرا" />
            <div className={`flex-1 h-0.5 mx-2 transition-colors ${step >= 2 ? 'bg-white' : 'bg-white/30'}`} />
            <StepIndicator step={2} current={step} label="التقاط" />
            <div className={`flex-1 h-0.5 mx-2 transition-colors ${step >= 3 ? 'bg-white' : 'bg-white/30'}`} />
            <StepIndicator step={3} current={step} label="الموقع" />
            <div className={`flex-1 h-0.5 mx-2 transition-colors ${step >= 4 ? 'bg-white' : 'bg-white/30'}`} />
            <StepIndicator step={4} current={step} label="تأكيد" />
          </div>
        </div>

        <div className="p-5 space-y-4">
          {/* Camera error */}
          {camError && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-red-700 text-sm flex gap-2">
              <span className="text-lg">⚠️</span>
              <div>
                <p className="font-semibold">خطأ في الكاميرا</p>
                <p>{camError}</p>
              </div>
            </div>
          )}

          {/* Camera view */}
          {!capturedImage && !camError && (
            <div className="relative bg-black rounded-2xl overflow-hidden aspect-video">
              <video
                id="camera-video"
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              {!isActive && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
              {/* Capture guide overlay */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-8 border-2 border-white/40 rounded-2xl"></div>
              </div>
            </div>
          )}

          {/* Captured photo */}
          {capturedImage && (
            <div className="relative rounded-2xl overflow-hidden aspect-video">
              <img src={capturedImage} alt="صورة الحضور" className="w-full h-full object-cover" />
              <div className="absolute top-3 right-3 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                <span>✓</span> تم الالتقاط
              </div>
            </div>
          )}

          {/* Hidden canvas for capture */}
          <canvas ref={canvasRef} className="hidden" />

          {/* GPS info */}
          {location && (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-3 flex items-center gap-3">
              <span className="text-2xl">📍</span>
              <div className="text-sm">
                <p className="font-semibold text-green-700">تم تحديد موقعك بنجاح</p>
                <p className="text-green-600">دقة: ±{Math.round(location.accuracy || 0)} متر</p>
              </div>
            </div>
          )}

          {/* GPS Error */}
          {gpsError && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-3 text-red-700 text-sm">
              <p className="font-semibold">⚠️ خطأ في GPS</p>
              <p>{gpsError}</p>
            </div>
          )}

          {/* Action buttons */}
          <div className="space-y-2">
            {/* Step 1: Capture */}
            {!capturedImage && !camError && isActive && step === 1 && (
              <button
                onClick={handleCapture}
                className={`w-full text-white font-bold py-4 rounded-2xl transition-all active:scale-95 shadow-lg text-lg ${typeColor}`}
              >
                📸 التقاط الصورة
              </button>
            )}

            {/* Step 2: Get location */}
            {capturedImage && !location && step === 2 && (
              <>
                <button
                  onClick={handleGetLocation}
                  disabled={gpsLoading}
                  className={`w-full text-white font-bold py-4 rounded-2xl transition-all active:scale-95 shadow-lg flex items-center justify-center gap-3 ${typeColor} disabled:opacity-60`}
                >
                  {gpsLoading ? (
                    <><div className="spinner w-5 h-5"></div> جاري تحديد الموقع...</>
                  ) : (
                    <>📍 تحديد الموقع</>
                  )}
                </button>
                <button
                  onClick={retake}
                  className="w-full btn-secondary py-3"
                >
                  🔄 إعادة التقاط
                </button>
              </>
            )}

            {/* Step 4: Submit */}
            {capturedImage && location && step === 4 && (
              <>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className={`w-full text-white font-bold py-4 rounded-2xl transition-all active:scale-95 shadow-lg flex items-center justify-center gap-3 ${typeColor} disabled:opacity-60`}
                >
                  {submitting ? (
                    <><div className="spinner"></div> جاري التسجيل...</>
                  ) : (
                    <>✅ تأكيد تسجيل {typeLabel}</>
                  )}
                </button>
                <button
                  onClick={() => { setStep(1); retake(); setLocation(null); }}
                  className="w-full btn-secondary py-3"
                >
                  🔄 إعادة من البداية
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const EmployeePanelPage = () => {
  const [todayStatus, setTodayStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeFlow, setActiveFlow] = useState(null); // 'checkin' | 'checkout' | null

  const fetchTodayStatus = async () => {
    try {
      const res = await api.get('/attendance/today-status');
      setTodayStatus(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodayStatus();
  }, []);

  const handleFlowComplete = (data) => {
    setActiveFlow(null);
    fetchTodayStatus();
  };

  const now = new Date();
  const timeStr = now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
  const dateStr = now.toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const record = todayStatus?.record;
  const hasCheckedIn = todayStatus?.hasCheckedIn;
  const hasCheckedOut = todayStatus?.hasCheckedOut;

  const workingMins = record?.workingHours;
  const checkinTime = record?.checkInTime ? new Date(record.checkInTime).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) : null;
  const checkoutTime = record?.checkOutTime ? new Date(record.checkOutTime).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      {/* Flow Modal */}
      {activeFlow && (
        <AttendanceFlow
          type={activeFlow}
          onComplete={handleFlowComplete}
          onCancel={() => setActiveFlow(null)}
        />
      )}

      {/* Date/Time Header */}
      <div className="text-center">
        <p className="text-4xl font-black text-slate-800 dark:text-white">{timeStr}</p>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{dateStr}</p>
      </div>

      {/* Status Card */}
      <div className="card">
        <h2 className="font-bold text-slate-700 dark:text-slate-200 mb-4 text-center">حالة اليوم</h2>

        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className={`p-3 rounded-2xl text-center transition-all ${hasCheckedIn ? 'bg-green-50 border-2 border-green-200' : 'bg-slate-50 dark:bg-slate-700/30 border-2 border-transparent'}`}>
            <p className="text-2xl mb-1">{hasCheckedIn ? '✅' : '⭕'}</p>
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">الحضور</p>
            {checkinTime && <p className="text-xs text-green-600 font-bold mt-1">{checkinTime}</p>}
          </div>

          <div className={`p-3 rounded-2xl text-center transition-all ${record?.status ? (record.status === 'present' ? 'bg-green-50 border-2 border-green-200' : 'bg-amber-50 border-2 border-amber-200') : 'bg-slate-50 dark:bg-slate-700/30 border-2 border-transparent'}`}>
            <p className="text-2xl mb-1">
              {!record ? '❓' : record.status === 'present' ? '🟢' : '🟡'}
            </p>
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">الحالة</p>
            {record?.status && (
              <p className={`text-xs font-bold mt-1 ${record.status === 'present' ? 'text-green-600' : 'text-amber-600'}`}>
                {record.status === 'present' ? 'حاضر' : 'متأخر'}
              </p>
            )}
          </div>

          <div className={`p-3 rounded-2xl text-center transition-all ${hasCheckedOut ? 'bg-blue-50 border-2 border-blue-200' : 'bg-slate-50 dark:bg-slate-700/30 border-2 border-transparent'}`}>
            <p className="text-2xl mb-1">{hasCheckedOut ? '✅' : '⭕'}</p>
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">الانصراف</p>
            {checkoutTime && <p className="text-xs text-blue-600 font-bold mt-1">{checkoutTime}</p>}
          </div>
        </div>

        {/* Working hours */}
        {hasCheckedOut && workingMins > 0 && (
          <div className="bg-primary-50 dark:bg-primary-900/20 rounded-2xl p-4 text-center border border-primary-100">
            <p className="text-sm text-primary-600 dark:text-primary-400 font-medium mb-1">ساعات العمل اليوم</p>
            <p className="text-3xl font-black text-primary-700 dark:text-primary-300">{formatWorkingHours(workingMins)}</p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        {/* Check-in Button */}
        <button
          onClick={() => setActiveFlow('checkin')}
          disabled={hasCheckedIn}
          className={`w-full py-5 rounded-2xl font-bold text-xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-3 ${
            hasCheckedIn
              ? 'bg-slate-100 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
              : 'bg-gradient-to-l from-green-600 to-green-500 text-white hover:from-green-700 hover:to-green-600 shadow-green-200'
          }`}
        >
          {hasCheckedIn ? (
            <><span>✅</span> تم تسجيل الحضور</>
          ) : (
            <><span>👆</span> تسجيل الحضور</>
          )}
        </button>

        {/* Check-out Button */}
        <button
          onClick={() => setActiveFlow('checkout')}
          disabled={!hasCheckedIn || hasCheckedOut}
          className={`w-full py-5 rounded-2xl font-bold text-xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-3 ${
            !hasCheckedIn || hasCheckedOut
              ? 'bg-slate-100 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
              : 'bg-gradient-to-l from-rose-600 to-rose-500 text-white hover:from-rose-700 hover:to-rose-600 shadow-rose-200'
          }`}
        >
          {hasCheckedOut ? (
            <><span>✅</span> تم تسجيل الانصراف</>
          ) : (
            <><span>👇</span> تسجيل الانصراف</>
          )}
        </button>
      </div>

      {/* Info Card */}
      <div className="card bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800">
        <h3 className="font-semibold text-blue-700 dark:text-blue-300 mb-3 flex items-center gap-2">
          <span>ℹ️</span> تعليمات التسجيل
        </h3>
        <ul className="space-y-2 text-sm text-blue-600 dark:text-blue-400">
          <li className="flex items-start gap-2"><span>📸</span> <span>سيتم التقاط صورتك عند التسجيل</span></li>
          <li className="flex items-start gap-2"><span>📍</span> <span>يجب أن تكون داخل نطاق 50 متر من موقع المحل</span></li>
          <li className="flex items-start gap-2"><span>🔒</span> <span>يرجى السماح بالوصول إلى الكاميرا والموقع</span></li>
          <li className="flex items-start gap-2"><span>⏰</span> <span>التأخير يحسب بعد 9:15 صباحاً</span></li>
        </ul>
      </div>
    </div>
  );
};

export default EmployeePanelPage;