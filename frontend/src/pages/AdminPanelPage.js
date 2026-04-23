import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../utils/api';

const EMPTY_FORM = { name: '', email: '', password: '', role: 'employee', phone: '', department: '', isActive: true };

const Modal = ({ title, onClose, children }) => (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-md animate-slide-up">
      <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-700">
        <h2 className="font-bold text-slate-800 dark:text-white text-lg">{title}</h2>
        <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors text-slate-500">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="p-6">{children}</div>
    </div>
  </div>
);

const EmployeeForm = ({ initial, onSubmit, onCancel, loading, isEdit }) => {
  const [form, setForm] = useState(initial || EMPTY_FORM);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">الاسم الكامل *</label>
          <input name="name" value={form.name} onChange={handleChange} required className="input-field" placeholder="محمد أحمد" />
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">البريد الإلكتروني *</label>
          <input name="email" type="email" value={form.email} onChange={handleChange} required className="input-field" placeholder="employee@example.com" />
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
            كلمة المرور {isEdit && <span className="text-slate-400 font-normal">(اتركها فارغة للإبقاء على القديمة)</span>}
          </label>
          <input name="password" type="password" value={form.password} onChange={handleChange} required={!isEdit} className="input-field" placeholder="••••••••" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">الدور</label>
          <select name="role" value={form.role} onChange={handleChange} className="input-field">
            <option value="employee">موظف</option>
            <option value="admin">مدير</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">رقم الهاتف</label>
          <input name="phone" value={form.phone} onChange={handleChange} className="input-field" placeholder="01XXXXXXXXX" />
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">القسم</label>
          <input name="department" value={form.department} onChange={handleChange} className="input-field" placeholder="المبيعات، المخزن..." />
        </div>
        {isEdit && (
          <div className="col-span-2 flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/30 rounded-xl">
            <input type="checkbox" name="isActive" id="isActive" checked={form.isActive} onChange={handleChange} className="w-4 h-4 accent-primary-600" />
            <label htmlFor="isActive" className="text-sm font-medium text-slate-700 dark:text-slate-300">الحساب نشط</label>
          </div>
        )}
      </div>

      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={loading} className="flex-1 btn-primary flex items-center justify-center gap-2">
          {loading ? <><div className="spinner w-4 h-4"></div> جاري الحفظ...</> : (isEdit ? '💾 حفظ التعديلات' : '➕ إضافة موظف')}
        </button>
        <button type="button" onClick={onCancel} className="btn-secondary px-5">إلغاء</button>
      </div>
    </form>
  );
};

const AdminPanelPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [modal, setModal] = useState(null); // 'add' | 'edit' | null
  const [editUser, setEditUser] = useState(null);
  const [search, setSearch] = useState('');
  const [deleting, setDeleting] = useState(null);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users', { params: { search, limit: 50 } });
      setUsers(res.data.users);
    } catch (err) {
      toast.error('حدث خطأ أثناء جلب الموظفين');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [search]);

  const handleAdd = async (form) => {
    setSubmitting(true);
    try {
      await api.post('/users', form);
      toast.success('تم إضافة الموظف بنجاح ✅');
      setModal(null);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'حدث خطأ');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (form) => {
    setSubmitting(true);
    try {
      if (!form.password) delete form.password;
      await api.put(`/users/${editUser._id}`, form);
      toast.success('تم تحديث بيانات الموظف ✅');
      setModal(null);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'حدث خطأ');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (userId, name) => {
    if (!window.confirm(`هل أنت متأكد من حذف الموظف "${name}"؟`)) return;
    setDeleting(userId);
    try {
      await api.delete(`/users/${userId}`);
      toast.success('تم حذف الموظف بنجاح');
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'حدث خطأ أثناء الحذف');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Add Modal */}
      {modal === 'add' && (
        <Modal title="إضافة موظف جديد" onClose={() => setModal(null)}>
          <EmployeeForm onSubmit={handleAdd} onCancel={() => setModal(null)} loading={submitting} />
        </Modal>
      )}

      {/* Edit Modal */}
      {modal === 'edit' && editUser && (
        <Modal title="تعديل بيانات الموظف" onClose={() => setModal(null)}>
          <EmployeeForm
            initial={{ ...editUser, password: '' }}
            onSubmit={handleEdit}
            onCancel={() => setModal(null)}
            loading={submitting}
            isEdit
          />
        </Modal>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-white">إدارة الموظفين</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{users.length} موظف مسجل</p>
        </div>
        <button
          onClick={() => setModal('add')}
          className="btn-primary flex items-center gap-2 self-start sm:self-auto"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          إضافة موظف
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="البحث بالاسم أو البريد الإلكتروني..."
          className="input-field pr-12"
        />
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </span>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <span className="text-5xl mb-4 block">👥</span>
            <p className="font-medium">{search ? 'لا توجد نتائج مطابقة' : 'لا يوجد موظفون بعد'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-100 dark:border-slate-700">
                  <th className="text-right py-4 px-5 font-semibold text-slate-500 dark:text-slate-400">الموظف</th>
                  <th className="text-right py-4 px-3 font-semibold text-slate-500 dark:text-slate-400 hidden md:table-cell">القسم</th>
                  <th className="text-right py-4 px-3 font-semibold text-slate-500 dark:text-slate-400">الدور</th>
                  <th className="text-right py-4 px-3 font-semibold text-slate-500 dark:text-slate-400">الحالة</th>
                  <th className="text-right py-4 px-5 font-semibold text-slate-500 dark:text-slate-400">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id} className="border-b border-slate-50 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                          {u.name?.charAt(0) || '?'}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800 dark:text-slate-200">{u.name}</p>
                          <p className="text-xs text-slate-400">{u.email}</p>
                          {u.phone && <p className="text-xs text-slate-400">{u.phone}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-3 text-slate-600 dark:text-slate-400 hidden md:table-cell">
                      {u.department || '—'}
                    </td>
                    <td className="py-4 px-3">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                        u.role === 'admin'
                          ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                          : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                      }`}>
                        {u.role === 'admin' ? '👑 مدير' : '👤 موظف'}
                      </span>
                    </td>
                    <td className="py-4 px-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        u.isActive
                          ? 'bg-green-100 text-green-700'
                          : 'bg-slate-100 text-slate-500'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${u.isActive ? 'bg-green-500' : 'bg-slate-400'}`}></span>
                        {u.isActive ? 'نشط' : 'معطل'}
                      </span>
                    </td>
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => { setEditUser(u); setModal('edit'); }}
                          className="p-2 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-xl transition-colors"
                          title="تعديل"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(u._id, u.name)}
                          disabled={deleting === u._id}
                          className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors disabled:opacity-50"
                          title="حذف"
                        >
                          {deleting === u._id ? (
                            <div className="w-4 h-4 border-2 border-red-300 border-t-red-500 rounded-full animate-spin"></div>
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          )}
                        </button>
                      </div>
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

export default AdminPanelPage;