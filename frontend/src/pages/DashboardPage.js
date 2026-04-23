import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { formatArabicDate } from '../utils/helpers';

const StatCard = ({ title, value, subtitle, icon, color, bg }) => (
  <div className="card animate-slide-up hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-1">{title}</p>
        <p className={`text-4xl font-black ${color}`}>{value ?? '—'}</p>
        {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
      </div>
      <div className={`w-14 h-14 ${bg} rounded-2xl flex items-center justify-center text-2xl shadow-sm`}>
        {icon}
      </div>
    </div>
  </div>
);

const DashboardPage = () => {
  const { user, isAdmin } = useAuth();
  const [stats, setStats] = useState(null);
  const [myRecords, setMyRecords] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (isAdmin) {
          const res = await api.get('/reports/dashboard');
          setStats(res.data);
        } else {
          const res = await api.get('/attendance/my-records');
          setMyRecords(res.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [isAdmin]);

  const today = new Date().toLocaleDateString('ar-EG', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-slate-500">جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  // ─── Admin Dashboard ──────────────────────────────────────────────────────
  if (isAdmin && stats) {
    const { stats: s, last7Days = [], todayRecords = [] } = stats;

    const chartData = last7Days.map((d) => ({
      name: new Date(d.date).toLocaleDateString('ar-EG', { weekday: 'short', day: 'numeric' }),
      حاضر: d.present,
      متأخر: d.late,
      غائب: d.absent,
    }));

    return (
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-white">لوحة التحكم</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{today}</p>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="إجمالي الموظفين"
            value={s?.totalEmployees}
            subtitle="موظف نشط"
            icon="👥"
            color="text-primary-600"
            bg="bg-primary-50"
          />
          <StatCard
            title="حضروا اليوم"
            value={s?.todayCheckedIn}
            subtitle={`حاضر: ${s?.todayPresent}`}
            icon="✅"
            color="text-green-600"
            bg="bg-green-50"
          />
          <StatCard
            title="متأخرون"
            value={s?.todayLate}
            subtitle="اليوم"
            icon="⏰"
            color="text-amber-600"
            bg="bg-amber-50"
          />
          <StatCard
            title="غائبون"
            value={s?.todayAbsent}
            subtitle="اليوم"
            icon="❌"
            color="text-red-600"
            bg="bg-red-50"
          />
        </div>

        {/* Chart */}
        <div className="card">
          <h2 className="font-bold text-slate-800 dark:text-white mb-6">📈 الحضور — آخر 7 أيام</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData} margin={{ top: 5, right: 0, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fontFamily: 'Cairo' }} />
              <YAxis tick={{ fontSize: 12, fontFamily: 'Cairo' }} />
              <Tooltip
                contentStyle={{ fontFamily: 'Cairo', borderRadius: '12px', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }}
              />
              <Legend wrapperStyle={{ fontFamily: 'Cairo', fontSize: 12 }} />
              <Bar dataKey="حاضر" fill="#22c55e" radius={[6, 6, 0, 0]} />
              <Bar dataKey="متأخر" fill="#f59e0b" radius={[6, 6, 0, 0]} />
              <Bar dataKey="غائب" fill="#ef4444" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Today's Attendance Table */}
        <div className="card">
          <h2 className="font-bold text-slate-800 dark:text-white mb-4">📋 سجل حضور اليوم</h2>
          {todayRecords.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
              <span className="text-4xl mb-3 block">📭</span>
              لا توجد سجلات حضور اليوم
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-700">
                    <th className="text-right py-3 px-2 font-semibold text-slate-500 dark:text-slate-400">الاسم</th>
                    <th className="text-right py-3 px-2 font-semibold text-slate-500 dark:text-slate-400">وقت الحضور</th>
                    <th className="text-right py-3 px-2 font-semibold text-slate-500 dark:text-slate-400">وقت الانصراف</th>
                    <th className="text-right py-3 px-2 font-semibold text-slate-500 dark:text-slate-400">الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {todayRecords.map((r) => (
                    <tr key={r._id} className="border-b border-slate-50 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                      <td className="py-3 px-2 font-medium text-slate-800 dark:text-slate-200">
                        {r.userId?.name || '—'}
                      </td>
                      <td className="py-3 px-2 text-slate-600 dark:text-slate-400">
                        {r.checkInTime ? new Date(r.checkInTime).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) : '—'}
                      </td>
                      <td className="py-3 px-2 text-slate-600 dark:text-slate-400">
                        {r.checkOutTime ? new Date(r.checkOutTime).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) : '—'}
                      </td>
                      <td className="py-3 px-2">
                        <span className={`badge-${r.status}`}>
                          {r.status === 'present' ? 'حاضر' : r.status === 'late' ? 'متأخر' : 'غائب'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── Employee Dashboard ───────────────────────────────────────────────────
  const summary = myRecords?.summary || {};
  const recentRecords = (myRecords?.records || []).slice(0, 10);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-800 dark:text-white">
          مرحباً، {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{today}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="أيام هذا الشهر" value={summary.total} icon="📅" color="text-primary-600" bg="bg-primary-50" />
        <StatCard title="أيام الحضور" value={summary.present} icon="✅" color="text-green-600" bg="bg-green-50" />
        <StatCard title="أيام التأخير" value={summary.late} icon="⏰" color="text-amber-600" bg="bg-amber-50" />
        <StatCard title="أيام الغياب" value={summary.absent} icon="❌" color="text-red-600" bg="bg-red-50" />
      </div>

      <div className="card">
        <h2 className="font-bold text-slate-800 dark:text-white mb-4">📋 آخر سجلات الحضور</h2>
        {recentRecords.length === 0 ? (
          <div className="text-center py-10 text-slate-400">
            <span className="text-4xl mb-3 block">📭</span>
            لا توجد سجلات حضور بعد
          </div>
        ) : (
          <div className="space-y-2">
            {recentRecords.map((r) => (
              <div key={r._id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/30 rounded-xl">
                <div>
                  <p className="font-medium text-slate-800 dark:text-slate-200 text-sm">{formatArabicDate(r.date)}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {r.checkInTime ? `دخول: ${new Date(r.checkInTime).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}` : ''}
                    {r.checkOutTime ? ` — خروج: ${new Date(r.checkOutTime).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}` : ''}
                  </p>
                </div>
                <span className={`badge-${r.status}`}>
                  {r.status === 'present' ? 'حاضر' : r.status === 'late' ? 'متأخر' : 'غائب'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;