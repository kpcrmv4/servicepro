'use client';

import { useEffect, useState } from 'react';
import { getServiceReminders, createServiceReminder, updateServiceReminder, deleteServiceReminder, getReminderStats } from '@/lib/actions/reminders';
import { Bell, Plus, Send, Trash2, Calendar, AlertTriangle, CheckCircle, Clock, X, MessageCircle } from 'lucide-react';

export default function RemindersPage() {
  const [reminders, setReminders] = useState<Record<string, unknown>[]>([]);
  const [stats, setStats] = useState({ overdue: 0, thisWeek: 0, thisMonth: 0, totalSent: 0 });
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'overdue' | 'sent'>('all');
  const [form, setForm] = useState({
    vehicle_id: '', customer_id: '', reminder_type: '',
    trigger_date: '', trigger_mileage: 0, message_template: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadData(); }, [filter]);

  async function loadData() {
    try {
      setLoading(true);
      const [remindersData, statsData] = await Promise.all([
        getServiceReminders(filter === 'upcoming' ? { upcoming: true } : filter === 'sent' ? { status: 'sent' } : filter === 'overdue' ? { status: 'pending' } : undefined),
        getReminderStats(),
      ]);

      let filtered = remindersData;
      if (filter === 'overdue') {
        const today = new Date().toISOString().split('T')[0];
        filtered = remindersData.filter(r => String(r.trigger_date) < today && r.status === 'pending');
      }

      setReminders(filtered);
      setStats(statsData);
    } catch (err) {
      console.error('Failed to load reminders:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    if (!form.vehicle_id || !form.customer_id || !form.reminder_type || !form.trigger_date) return;
    try {
      setSaving(true);
      await createServiceReminder({
        vehicle_id: form.vehicle_id,
        customer_id: form.customer_id,
        reminder_type: form.reminder_type,
        trigger_date: form.trigger_date,
        trigger_mileage: form.trigger_mileage || undefined,
        message_template: form.message_template || undefined,
      });
      setShowForm(false);
      setForm({ vehicle_id: '', customer_id: '', reminder_type: '', trigger_date: '', trigger_mileage: 0, message_template: '' });
      await loadData();
    } catch (err) {
      console.error('Failed to create reminder:', err);
    } finally {
      setSaving(false);
    }
  }

  async function handleMarkSent(id: string) {
    try {
      await updateServiceReminder(id, { status: 'sent', sent_at: new Date().toISOString(), sent_via: 'manual' });
      await loadData();
    } catch (err) {
      console.error('Failed to update reminder:', err);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('ลบการแจ้งเตือนนี้?')) return;
    try {
      await deleteServiceReminder(id);
      await loadData();
    } catch (err) {
      console.error('Failed to delete reminder:', err);
    }
  }

  const isOverdue = (date: string) => {
    return new Date(date) < new Date(new Date().toISOString().split('T')[0]);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Bell className="h-7 w-7 text-orange-600" />
            แจ้งเตือนบริการ
          </h1>
          <p className="text-gray-500 mt-1">Smart Service Reminders - แจ้งเตือนลูกค้าเมื่อถึงรอบบริการ</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 bg-orange-600 text-white px-4 py-2.5 rounded-lg hover:bg-orange-700 transition-colors font-medium"
        >
          <Plus className="h-5 w-5" />
          สร้างแจ้งเตือนใหม่
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button onClick={() => setFilter('overdue')} className={`rounded-xl border p-4 text-left transition-colors ${filter === 'overdue' ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200 hover:border-red-200'}`}>
          <AlertTriangle className="h-5 w-5 text-red-500" />
          <p className="text-2xl font-bold text-red-600 mt-1">{stats.overdue}</p>
          <p className="text-xs text-gray-500">เลยกำหนด</p>
        </button>
        <button onClick={() => setFilter('upcoming')} className={`rounded-xl border p-4 text-left transition-colors ${filter === 'upcoming' ? 'bg-orange-50 border-orange-200' : 'bg-white border-gray-200 hover:border-orange-200'}`}>
          <Clock className="h-5 w-5 text-orange-500" />
          <p className="text-2xl font-bold text-orange-600 mt-1">{stats.thisWeek}</p>
          <p className="text-xs text-gray-500">สัปดาห์นี้</p>
        </button>
        <button onClick={() => setFilter('all')} className={`rounded-xl border p-4 text-left transition-colors ${filter === 'all' ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200 hover:border-blue-200'}`}>
          <Calendar className="h-5 w-5 text-blue-500" />
          <p className="text-2xl font-bold text-blue-600 mt-1">{stats.thisMonth}</p>
          <p className="text-xs text-gray-500">เดือนนี้</p>
        </button>
        <button onClick={() => setFilter('sent')} className={`rounded-xl border p-4 text-left transition-colors ${filter === 'sent' ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200 hover:border-green-200'}`}>
          <CheckCircle className="h-5 w-5 text-green-500" />
          <p className="text-2xl font-bold text-green-600 mt-1">{stats.totalSent}</p>
          <p className="text-xs text-gray-500">ส่งแล้ว</p>
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">สร้างแจ้งเตือนใหม่</h2>
              <button onClick={() => setShowForm(false)} className="p-1 hover:bg-gray-100 rounded-lg"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ประเภทแจ้งเตือน *</label>
                <select value={form.reminder_type} onChange={e => setForm({ ...form, reminder_type: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500">
                  <option value="">เลือกประเภท</option>
                  <option value="เปลี่ยนถ่ายน้ำมันเครื่อง">เปลี่ยนถ่ายน้ำมันเครื่อง</option>
                  <option value="ตรวจเช็คระยะ">ตรวจเช็คระยะ</option>
                  <option value="เปลี่ยนผ้าเบรก">เปลี่ยนผ้าเบรก</option>
                  <option value="เปลี่ยนยาง">เปลี่ยนยาง</option>
                  <option value="ตรวจเช็คแอร์">ตรวจเช็คแอร์</option>
                  <option value="ต่อ พ.ร.บ.">ต่อ พ.ร.บ.</option>
                  <option value="ต่อประกันภัย">ต่อประกันภัย</option>
                  <option value="อื่นๆ">อื่นๆ</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">วันที่แจ้งเตือน *</label>
                <input type="date" value={form.trigger_date} onChange={e => setForm({ ...form, trigger_date: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">เลขไมล์ที่แจ้งเตือน (กม.)</label>
                <input type="number" value={form.trigger_mileage || ''} onChange={e => setForm({ ...form, trigger_mileage: Number(e.target.value) })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500" placeholder="เช่น 60000" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ข้อความแจ้งเตือน</label>
                <textarea value={form.message_template} onChange={e => setForm({ ...form, message_template: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500" rows={3} placeholder="ใช้ {{customer_name}} และ {{vehicle}} เป็นตัวแปร" />
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={handleCreate} disabled={saving || !form.reminder_type || !form.trigger_date} className="flex-1 py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 font-medium">
                  {saving ? 'กำลังบันทึก...' : 'สร้างแจ้งเตือน'}
                </button>
                <button onClick={() => setShowForm(false)} className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium">ยกเลิก</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reminders List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
        </div>
      ) : reminders.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <Bell className="h-12 w-12 text-gray-300 mx-auto" />
          <p className="text-gray-500 mt-3">ไม่มีรายการแจ้งเตือน</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reminders.map(reminder => {
            const vehicle = reminder.vehicle as Record<string, unknown> | null;
            const customer = reminder.customer as Record<string, unknown> | null;
            const overdue = reminder.status === 'pending' && isOverdue(String(reminder.trigger_date));

            return (
              <div key={String(reminder.id)} className={`bg-white rounded-xl border p-4 sm:p-5 ${overdue ? 'border-red-200 bg-red-50/30' : reminder.status === 'sent' ? 'border-green-200 bg-green-50/30' : 'border-gray-200'}`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-sm font-semibold px-2.5 py-0.5 rounded-full ${overdue ? 'bg-red-100 text-red-700' : reminder.status === 'sent' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                        {String(reminder.reminder_type)}
                      </span>
                      {overdue && <span className="text-xs text-red-600 font-medium">เลยกำหนด!</span>}
                      {reminder.status === 'sent' && <span className="text-xs text-green-600 font-medium">ส่งแล้ว</span>}
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                      <span>{String(vehicle?.brand || '')} {String(vehicle?.model || '')} ({String(vehicle?.license_plate || '')})</span>
                      <span>{String(customer?.name || '-')}</span>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm">
                      <span className="text-gray-500">
                        <Calendar className="h-3.5 w-3.5 inline mr-1" />
                        {new Date(String(reminder.trigger_date)).toLocaleDateString('th-TH')}
                      </span>
                      {Number(reminder.trigger_mileage) > 0 && (
                        <span className="text-gray-500">{Number(reminder.trigger_mileage).toLocaleString()} กม.</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {reminder.status === 'pending' && (
                      <>
                        <button onClick={() => handleMarkSent(String(reminder.id))} className="inline-flex items-center gap-1.5 px-3 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 text-sm font-medium" title="ส่ง LINE">
                          <MessageCircle className="h-4 w-4" />
                          ส่ง LINE
                        </button>
                        <button onClick={() => handleMarkSent(String(reminder.id))} className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 text-sm font-medium">
                          <Send className="h-4 w-4" />
                          ส่งแล้ว
                        </button>
                      </>
                    )}
                    <button onClick={() => handleDelete(String(reminder.id))} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
