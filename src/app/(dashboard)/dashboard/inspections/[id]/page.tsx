'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getInspection, updateInspectionItem, addInspectionItem, deleteInspectionItem, updateInspectionStatus } from '@/lib/actions/inspections';
import { sendDVIReportNotification } from '@/lib/actions/line';
import { ArrowLeft, ClipboardCheck, Camera, Trash2, Plus, Send, CheckCircle, AlertTriangle, XCircle, MessageCircle } from 'lucide-react';

const conditionConfig = {
  good: { label: 'ดี', color: 'bg-green-500', textColor: 'text-green-700', bgColor: 'bg-green-50', icon: CheckCircle },
  fair: { label: 'พอใช้', color: 'bg-yellow-500', textColor: 'text-yellow-700', bgColor: 'bg-yellow-50', icon: AlertTriangle },
  poor: { label: 'ต้องซ่อม', color: 'bg-red-500', textColor: 'text-red-700', bgColor: 'bg-red-50', icon: XCircle },
};

export default function InspectionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [inspection, setInspection] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newItem, setNewItem] = useState({ category: '', item_name: '', condition: 'good' as 'good' | 'fair' | 'poor', notes: '', estimated_cost: 0 });
  const [showAddItem, setShowAddItem] = useState(false);
  const [sendingLine, setSendingLine] = useState(false);

  const loadInspection = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getInspection(params.id as string);
      setInspection(data);
    } catch (err) {
      console.error('Failed to load inspection:', err);
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    loadInspection();
  }, [loadInspection]);

  async function handleConditionChange(itemId: string, condition: 'good' | 'fair' | 'poor') {
    try {
      await updateInspectionItem(itemId, { condition });
      await loadInspection();
    } catch (err) {
      console.error('Failed to update item:', err);
    }
  }

  async function handleAddItem() {
    if (!newItem.category || !newItem.item_name) return;
    try {
      setSaving(true);
      await addInspectionItem({
        inspection_id: params.id as string,
        ...newItem,
        estimated_cost: newItem.estimated_cost || undefined,
        sort_order: ((inspection?.items as unknown[]) || []).length,
      });
      setNewItem({ category: '', item_name: '', condition: 'good', notes: '', estimated_cost: 0 });
      setShowAddItem(false);
      await loadInspection();
    } catch (err) {
      console.error('Failed to add item:', err);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteItem(itemId: string) {
    if (!confirm('ลบรายการนี้?')) return;
    try {
      await deleteInspectionItem(itemId);
      await loadInspection();
    } catch (err) {
      console.error('Failed to delete item:', err);
    }
  }

  async function handleUpdateStatus(status: string) {
    try {
      setSaving(true);
      await updateInspectionStatus(params.id as string, status);
      await loadInspection();
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setSaving(false);
    }
  }

  async function handleSendToLine() {
    try {
      setSendingLine(true);
      const shareUrl = `${window.location.origin}/inspect/${inspection?.share_token}`;
      await sendDVIReportNotification(params.id as string, shareUrl);
      alert('ส่งรายงานผ่าน LINE สำเร็จ!');
    } catch (err) {
      console.error('Failed to send LINE notification:', err);
      alert('ไม่สามารถส่ง LINE ได้ (ลูกค้าอาจยังไม่ได้เชื่อมต่อ LINE)');
    } finally {
      setSendingLine(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!inspection) {
    return (
      <div className="p-4 sm:p-6 text-center py-12">
        <p className="text-gray-500">ไม่พบรายการตรวจสภาพ</p>
        <button onClick={() => router.back()} className="text-blue-600 hover:underline mt-2">กลับ</button>
      </div>
    );
  }

  const vehicle = inspection.vehicle as Record<string, unknown> | null;
  const customer = vehicle?.customer as Record<string, unknown> | null;
  const inspector = inspection.inspector as Record<string, unknown> | null;
  const items = (inspection.items as Record<string, unknown>[]) || [];

  // Group items by category
  const groupedItems: Record<string, Record<string, unknown>[]> = {};
  items.forEach(item => {
    const cat = String(item.category || 'อื่นๆ');
    if (!groupedItems[cat]) groupedItems[cat] = [];
    groupedItems[cat].push(item);
  });

  const goodCount = items.filter(i => i.condition === 'good').length;
  const fairCount = items.filter(i => i.condition === 'fair').length;
  const poorCount = items.filter(i => i.condition === 'poor').length;
  const totalEstCost = items.reduce((sum, i) => sum + (Number(i.estimated_cost) || 0), 0);

  return (
    <div className="p-4 sm:p-6 space-y-6 pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
              <ClipboardCheck className="h-6 w-6 text-blue-600" />
              รายงานตรวจสภาพรถ
            </h1>
            <p className="text-sm text-gray-500">
              {String(vehicle?.brand || '')} {String(vehicle?.model || '')} ({String(vehicle?.license_plate || '')})
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {inspection.status === 'draft' && (
            <button
              onClick={() => handleUpdateStatus('in_progress')}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
            >
              เริ่มตรวจ
            </button>
          )}
          {(inspection.status === 'in_progress' || inspection.status === 'draft') && (
            <button
              onClick={() => handleUpdateStatus('completed')}
              disabled={saving}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
            >
              ตรวจเสร็จ
            </button>
          )}
          {inspection.status === 'completed' && (
            <>
              <button
                onClick={() => handleUpdateStatus('sent')}
                disabled={saving}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium flex items-center gap-2"
              >
                <Send className="h-4 w-4" />
                ส่งลิงก์ลูกค้า
              </button>
              <button
                onClick={handleSendToLine}
                disabled={sendingLine}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm font-medium flex items-center gap-2"
              >
                <MessageCircle className="h-4 w-4" />
                {sendingLine ? 'กำลังส่ง...' : 'ส่งผ่าน LINE'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{items.length}</p>
          <p className="text-xs text-gray-500">รายการทั้งหมด</p>
        </div>
        <div className="bg-green-50 rounded-xl border border-green-200 p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{goodCount}</p>
          <p className="text-xs text-green-600">สภาพดี</p>
        </div>
        <div className="bg-yellow-50 rounded-xl border border-yellow-200 p-4 text-center">
          <p className="text-2xl font-bold text-yellow-600">{fairCount}</p>
          <p className="text-xs text-yellow-600">พอใช้</p>
        </div>
        <div className="bg-red-50 rounded-xl border border-red-200 p-4 text-center">
          <p className="text-2xl font-bold text-red-600">{poorCount}</p>
          <p className="text-xs text-red-600">ต้องซ่อม</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center col-span-2 sm:col-span-1">
          <p className="text-2xl font-bold text-gray-900">฿{totalEstCost.toLocaleString()}</p>
          <p className="text-xs text-gray-500">ค่าใช้จ่ายโดยประมาณ</p>
        </div>
      </div>

      {/* Info */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-gray-500">ลูกค้า:</span>
            <span className="ml-2 font-medium">{String(customer?.name || '-')}</span>
          </div>
          <div>
            <span className="text-gray-500">ผู้ตรวจ:</span>
            <span className="ml-2 font-medium">{String(inspector?.full_name || '-')}</span>
          </div>
          <div>
            <span className="text-gray-500">เลขไมล์:</span>
            <span className="ml-2 font-medium">{inspection.mileage_at_inspection ? `${Number(inspection.mileage_at_inspection).toLocaleString()} กม.` : '-'}</span>
          </div>
        </div>
        {Boolean(inspection.notes) && (
          <p className="mt-3 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">{String(inspection.notes)}</p>
        )}
      </div>

      {/* Inspection Items by Category */}
      {Object.entries(groupedItems).map(([category, catItems]) => (
        <div key={category} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">{category}</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {catItems.sort((a, b) => (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0)).map(item => {
              const cond = conditionConfig[item.condition as keyof typeof conditionConfig] || conditionConfig.good;
              const CondIcon = cond.icon;
              return (
                <div key={String(item.id)} className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <CondIcon className={`h-5 w-5 ${cond.textColor}`} />
                      <span className="font-medium text-gray-900">{String(item.item_name)}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cond.bgColor} ${cond.textColor}`}>
                        {cond.label}
                      </span>
                    </div>
                    {Boolean(item.notes) && <p className="text-sm text-gray-500 mt-1 ml-7">{String(item.notes)}</p>}
                    {Number(item.estimated_cost) > 0 && (
                      <p className="text-sm text-orange-600 mt-1 ml-7">ค่าใช้จ่ายโดยประมาณ: ฿{Number(item.estimated_cost).toLocaleString()}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-7 sm:ml-0">
                    {/* Traffic Light Buttons */}
                    {(['good', 'fair', 'poor'] as const).map(c => (
                      <button
                        key={c}
                        onClick={() => handleConditionChange(String(item.id), c)}
                        className={`w-8 h-8 rounded-full border-2 transition-all ${
                          item.condition === c
                            ? `${conditionConfig[c].color} border-transparent scale-110 shadow-lg`
                            : 'bg-white border-gray-300 hover:border-gray-400'
                        }`}
                        title={conditionConfig[c].label}
                      />
                    ))}
                    <button className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                      <Camera className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteItem(String(item.id))}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Add Item */}
      {showAddItem ? (
        <div className="bg-white rounded-xl border border-blue-200 p-4 sm:p-5">
          <h3 className="font-semibold text-gray-900 mb-4">เพิ่มรายการตรวจ</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="หมวดหมู่ (เช่น ภายนอก, ใต้ฝากระโปรง)"
              value={newItem.category}
              onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              placeholder="ชื่อรายการ (เช่น น้ำมันเครื่อง, ผ้าเบรก)"
              value={newItem.item_name}
              onChange={(e) => setNewItem({ ...newItem, item_name: e.target.value })}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">สภาพ:</span>
              {(['good', 'fair', 'poor'] as const).map(c => (
                <button
                  key={c}
                  onClick={() => setNewItem({ ...newItem, condition: c })}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    newItem.condition === c
                      ? `${conditionConfig[c].bgColor} ${conditionConfig[c].textColor} ring-2 ring-offset-1`
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {conditionConfig[c].label}
                </button>
              ))}
            </div>
            <input
              type="number"
              placeholder="ค่าใช้จ่ายโดยประมาณ (บาท)"
              value={newItem.estimated_cost || ''}
              onChange={(e) => setNewItem({ ...newItem, estimated_cost: Number(e.target.value) })}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <textarea
              placeholder="หมายเหตุ"
              value={newItem.notes}
              onChange={(e) => setNewItem({ ...newItem, notes: e.target.value })}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 sm:col-span-2"
              rows={2}
            />
          </div>
          <div className="flex items-center gap-2 mt-4">
            <button
              onClick={handleAddItem}
              disabled={saving || !newItem.category || !newItem.item_name}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
            >
              {saving ? 'กำลังบันทึก...' : 'เพิ่มรายการ'}
            </button>
            <button
              onClick={() => setShowAddItem(false)}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium"
            >
              ยกเลิก
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowAddItem(true)}
          className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="h-5 w-5" />
          เพิ่มรายการตรวจ
        </button>
      )}
    </div>
  );
}
