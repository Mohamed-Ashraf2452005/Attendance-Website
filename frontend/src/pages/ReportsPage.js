import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../utils/api';
import { formatWorkingHours, formatArabicDate, formatArabicTime } from '../utils/helpers';

const ReportsPage = () => {
  const [records, setRecords] = useState([]);
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    type: 'daily',
    date: new Date().toISOString().split('T')[0],
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    userId: '',
  });

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await api.get('/users', { params: { limit: 100 } });
        setUsers(res.data.users);
      } catch {}
    };
    fetchUsers();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await api.get('/reports', { params: filters });
      setRecords(res.data.records);
      setStats(res.data.stats);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [filters]);

  const exportCSV = () => {
    const headers = ['الاسم', 'التاريخ', 'وقت الحضور', 'وقت الانصراف', 'ساعات العمل', 'الحالة'];
    const rows = records.map((r) => [
      r.userId?.name || '',
      r.date,
      r.checkInTime ? new Date(r.checkInTime).toLocaleTimeString('ar-EG') : '',
      r.checkOutTime ? new Date(r.checkOutTime).toLocaleTimeString('ar-EG') : '',
      formatWorkingHours(r.workingHours),
      r.status === 'present' ? 'حاضر' : r.status === 'late' ? 'متأخر' : 'غائب',
    ]);

    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `تقرير_الحضور_${filters.date || filters.month + '_' + filters.year}.csv`;
    a.click();
  };

  const months = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];

  const statusGroups = records.reduce((acc, r) => {
    const name = r.userId?.name || 'غير معروف';
    if (!acc[name]) acc[name] = { name, present: 0, late: 0, absent: 0 };
    acc[name][r.status] = (acc[name][r.status] || 0) + 1;
    return acc;
  }, {});

  const chartData = Object.values(statusGroups).slice(0, 8);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-white">التقارير</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">تقارير الحضور والانصراف</p>
        </div>
        <button onClick={exportCSV} className="btn-secondary flex items-center gap-2 text-sm">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          تصدير CSV
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <h2 className="font-semibold text-slate-700 dark:text-slate-200 mb-4">🔍 تصفية التقارير</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">نوع التقرير</label>
            <select
              value={filters.type}
              onChange={(e) => setFilters((p) => ({ ...p, type: e.target.value }))}
              className="input-field text-sm py-2"
            >
              <option value="daily">يومي</option>
              <option value="monthly">شهري</option>
            </select>
          </div>

          {filters.type === 'daily' ? (
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">التاريخ</label>
              <input
                type="date"
                value={filters.date}
                onChange={(e) => setFilters((p) => ({ ...p, date: e.target.value }))}
                className="input-field text-sm py-2"
              />
            </div>
          ) : (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">الشهر</label>
                <select
                  value={filters.month}
                  onChange={(e) => setFilters((p) => ({ ...p, month: e.target.value }))}
                  className="input-field text-sm py-2"
                >
                  {months.map((m, i) => (
                    <option key={i} value={i + 1}>{m}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">السنة</label>
                <select
                  value={filters.year}
                  onChange={(e) => setFilters((p) => ({ ...p, year: e.target.value }))}
                  className="input-field text-sm py-2"
                >
                  {[2023, 2024, 2025, 2026].map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">الموظف</label>
            <select
              value={filters.userId}
              onChange={(e) => setFilters((p) => ({ ...p, userId: e.target.value }))}
              className="input-field text-sm py-2"
            >
              <option value="">جميع الموظفين</option>
              {users.map((u) => (
                <option key={u._id} value={u._id}>{u.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: 'إجمالي السجلات', value: stats.total, icon: '📋', color: 'text-slate-700' },
            { label: 'حاضر', value: stats.present, icon: '✅', color: 'text-green-600' },
            { label: 'متأخر', value: stats.late, icon: '⏰', color: 'text-amber-600' },
            { label: 'غائب', value: stats.absent, icon: '❌', color: 'text-red-600' },
            { label: 'متوسط العمل', value: formatWorkingHours(stats.avgWorkingHours), icon: '⏱️', color: 'text-primary-600' },
          ].map((s) => (
            <div key={s.label} className="card py-4 text-center">
              <span className="text-2xl">{s.icon}</span>
              <p className={`text-2xl font-black mt-1 ${s.color}`}>{s.value}</p>
              <p className="text-xs text-slate-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Chart */}
      {chartData.length > 0 && (
        <div className="card">
          <h2 className="font-bold text-slate-800 dark:text-white mb-4">📊 توزيع الحضور بالموظف</h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fontFamily: 'Cairo' }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ fontFamily: 'Cairo', borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }} />
              <Bar dataKey="present" name="حاضر" fill="#22c55e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="late" name="متأخر" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              <Bar dataKey="absent" name="غائب" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Records Table */}
      <div className="card p-0 overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-slate-700">
          <h2 className="font-bold text-slate-800 dark:text-white">سجلات الحضور التفصيلية</h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
          </div>
        ) : records.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <span className="text-5xl mb-4 block">📭</span>
            <p>لا توجد سجلات للفترة المحددة</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-100 dark:border-slate-700">
                  <th className="text-right py-3 px-5 font-semibold text-slate-500">الموظف</th>
                  <th className="text-right py-3 px-3 font-semibold text-slate-500">التاريخ</th>
                  <th className="text-right py-3 px-3 font-semibold text-slate-500">حضور</th>
                  <th className="text-right py-3 px-3 font-semibold text-slate-500">انصراف</th>
                  <th className="text-right py-3 px-3 font-semibold text-slate-500 hidden md:table-cell">ساعات العمل</th>
                  <th className="text-right py-3 px-5 font-semibold text-slate-500">الحالة</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <tr key={r._id} className="border-b border-slate-50 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="py-3 px-5">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {r.userId?.name?.charAt(0) || '?'}
                        </div>
                        <div>
                          <p className="font-medium text-slate-800 dark:text-slate-200">{r.userId?.name || '—'}</p>
                          <p className="text-xs text-slate-400">{r.userId?.department || ''}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-400 text-xs">{formatArabicDate(r.date)}</td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-400">{formatArabicTime(r.checkInTime)}</td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-400">{formatArabicTime(r.checkOutTime)}</td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-400 hidden md:table-cell">{formatWorkingHours(r.workingHours)}</td>
                    <td className="py-3 px-5">
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
};

export default ReportsPage;