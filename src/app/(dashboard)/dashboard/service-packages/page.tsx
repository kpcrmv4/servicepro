'use client';

import { useEffect, useState } from 'react';
import { getServicePackages, createServicePackage, updateServicePackage, deleteServicePackage } from '@/lib/actions/service-packages';
import { Package, Plus, Edit, Trash2, Star, Clock, Tag, X } from 'lucide-react';

export default function ServicePackagesPage() {
  const [packages, setPackages] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '', description: '', category: '', base_price: 0,
    estimated_duration_minutes: 60, is_popular: false,
    compatible_brands: '' as string, compatible_models: '' as string,
  });
  const [saving, setSaving] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('all');

  useEffect(() => { loadPackages(); }, []);

  async function loadPackages() {
    try {
      setLoading(true);
      const data = await getServicePackages();
      setPackages(data);
    } catch (err) {
      console.error('Failed to load packages:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    try {
      setSaving(true);
      const data = {
        name: form.name,
        description: form.description || undefined,
        category: form.category || undefined,
        base_price: form.base_price,
        estimated_duration_minutes: form.estimated_duration_minutes,
        is_popular: form.is_popular,
        compatible_brands: form.compatible_brands ? form.compatible_brands.split(',').map(s => s.trim()) : undefined,
        compatible_models: form.compatible_models ? form.compatible_models.split(',').map(s => s.trim()) : undefined,
      };

      if (editingId) {
        await updateServicePackage(editingId, data);
      } else {
        await createServicePackage(data);
      }
      setShowForm(false);
      setEditingId(null);
      resetForm();
      await loadPackages();
    } catch (err) {
      console.error('Failed to save package:', err);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('ลบแพ็กเกจนี้?')) return;
    try {
      await deleteServicePackage(id);
      await loadPackages();
    } catch (err) {
      console.error('Failed to delete package:', err);
    }
  }

  function handleEdit(pkg: Record<string, unknown>) {
    setEditingId(String(pkg.id));
    setForm({
      name: String(pkg.name || ''),
      description: String(pkg.description || ''),
      category: String(pkg.category || ''),
      base_price: Number(pkg.base_price || 0),
      estimated_duration_minutes: Number(pkg.estimated_duration_minutes || 60),
      is_popular: Boolean(pkg.is_popular),
      compatible_brands: Array.isArray(pkg.compatible_brands) ? pkg.compatible_brands.join(', ') : '',
      compatible_models: Array.isArray(pkg.compatible_models) ? pkg.compatible_models.join(', ') : '',
    });
    setShowForm(true);
  }

  function resetForm() {
    setForm({ name: '', description: '', category: '', base_price: 0, estimated_duration_minutes: 60, is_popular: false, compatible_brands: '', compatible_models: '' });
  }

  const categories = [...new Set(packages.map(p => String(p.category || 'ไม่ระบุ')))];
  const filtered = categoryFilter === 'all' ? packages : packages.filter(p => String(p.category || 'ไม่ระบุ') === categoryFilter);

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Package className="h-7 w-7 text-purple-600" />
            แพ็กเกจบริการ
          </h1>
          <p className="text-gray-500 mt-1">จัดการแพ็กเกจบริการสำเร็จรูปสำหรับลูกค้า</p>
        </div>
        <button
          onClick={() => { resetForm(); setEditingId(null); setShowForm(true); }}
          className="inline-flex items-center gap-2 bg-purple-600 text-white px-4 py-2.5 rounded-lg hover:bg-purple-700 transition-colors font-medium"
        >
          <Plus className="h-5 w-5" />
          สร้างแพ็กเกจใหม่
        </button>
      </div>

      {/* Category Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <Tag className="h-4 w-4 text-gray-400 shrink-0" />
        <button onClick={() => setCategoryFilter('all')} className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap ${categoryFilter === 'all' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
          ทั้งหมด ({packages.length})
        </button>
        {categories.map(cat => (
          <button key={cat} onClick={() => setCategoryFilter(cat)} className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap ${categoryFilter === cat ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {cat} ({packages.filter(p => String(p.category || 'ไม่ระบุ') === cat).length})
          </button>
        ))}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">{editingId ? 'แก้ไขแพ็กเกจ' : 'สร้างแพ็กเกจใหม่'}</h2>
              <button onClick={() => setShowForm(false)} className="p-1 hover:bg-gray-100 rounded-lg"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อแพ็กเกจ *</label>
                <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500" placeholder="เช่น เปลี่ยนถ่ายน้ำมันเครื่อง" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">รายละเอียด</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500" rows={3} placeholder="รายละเอียดแพ็กเกจ..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">หมวดหมู่</label>
                  <input type="text" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500" placeholder="เช่น บำรุงรักษา" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ราคา (บาท) *</label>
                  <input type="number" value={form.base_price || ''} onChange={e => setForm({ ...form, base_price: Number(e.target.value) })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ระยะเวลา (นาที)</label>
                <input type="number" value={form.estimated_duration_minutes || ''} onChange={e => setForm({ ...form, estimated_duration_minutes: Number(e.target.value) })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ยี่ห้อที่รองรับ (คั่นด้วย ,)</label>
                <input type="text" value={form.compatible_brands} onChange={e => setForm({ ...form, compatible_brands: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500" placeholder="เช่น Toyota, Honda, Nissan" />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_popular} onChange={e => setForm({ ...form, is_popular: e.target.checked })} className="rounded text-purple-600" />
                <span className="text-sm text-gray-700">แพ็กเกจยอดนิยม</span>
              </label>
              <div className="flex gap-2 pt-2">
                <button onClick={handleSave} disabled={saving || !form.name || !form.base_price} className="flex-1 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 font-medium">
                  {saving ? 'กำลังบันทึก...' : editingId ? 'บันทึก' : 'สร้างแพ็กเกจ'}
                </button>
                <button onClick={() => setShowForm(false)} className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium">ยกเลิก</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Packages Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <Package className="h-12 w-12 text-gray-300 mx-auto" />
          <p className="text-gray-500 mt-3">ยังไม่มีแพ็กเกจบริการ</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(pkg => (
            <div key={String(pkg.id)} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">{String(pkg.name)}</h3>
                      {Boolean(pkg.is_popular) && <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />}
                    </div>
                    {Boolean(pkg.category) && (
                      <span className="inline-block text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded mt-1">{String(pkg.category)}</span>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-purple-600">฿{Number(pkg.base_price).toLocaleString()}</p>
                  </div>
                </div>
                {Boolean(pkg.description) && (
                  <p className="text-sm text-gray-500 mt-2 line-clamp-2">{String(pkg.description)}</p>
                )}
                <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                  {Boolean(pkg.estimated_duration_minutes) && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {Number(pkg.estimated_duration_minutes)} นาที
                    </span>
                  )}
                  {Array.isArray(pkg.compatible_brands) && pkg.compatible_brands.length > 0 && (
                    <span className="text-xs">{(pkg.compatible_brands as string[]).join(', ')}</span>
                  )}
                </div>
                {Array.isArray(pkg.items) && (pkg.items as unknown[]).length > 0 && (
                  <p className="text-xs text-gray-400 mt-2">{(pkg.items as unknown[]).length} รายการย่อย</p>
                )}
              </div>
              <div className="border-t border-gray-100 px-5 py-3 flex items-center justify-between bg-gray-50">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${pkg.is_active !== false ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {pkg.is_active !== false ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                </span>
                <div className="flex items-center gap-1">
                  <button onClick={() => handleEdit(pkg)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                    <Edit className="h-4 w-4" />
                  </button>
                  <button onClick={() => handleDelete(String(pkg.id))} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
