'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createInspection, bulkAddInspectionItems } from '@/lib/actions/inspections';

const defaultInspectionTemplate = [
  { category: 'ภายนอก', items: ['สีตัวถัง', 'กระจกหน้า', 'กระจกหลัง', 'กระจกข้าง', 'ไฟหน้า', 'ไฟท้าย', 'ไฟเลี้ยว', 'กันชนหน้า', 'กันชนหลัง', 'ยางล้อ', 'ล้อแม็ก', 'ใบปัดน้ำฝน'] },
  { category: 'ภายใน', items: ['เบาะนั่ง', 'พวงมาลัย', 'แอร์', 'วิทยุ/จอ', 'กระจกมองหลัง', 'เข็มขัดนิรภัย', 'มาตรวัด', 'ไฟเตือนหน้าปัด'] },
  { category: 'ใต้ฝากระโปรง', items: ['น้ำมันเครื่อง', 'น้ำหล่อเย็น', 'น้ำมันเบรก', 'น้ำมันพวงมาลัย', 'แบตเตอรี่', 'สายพาน', 'ท่อยาง', 'กรองอากาศ'] },
  { category: 'ใต้ท้องรถ', items: ['ระบบเบรก', 'โช้คอัพ', 'ลูกหมาก', 'ระบบไอเสีย', 'ซีลน้ำมัน', 'ยางกันโคลง'] },
  { category: 'ระบบขับเคลื่อน', items: ['เกียร์', 'คลัตช์', 'เพลาขับ', 'ลูกปืนล้อ'] },
];
import { getVehicles } from '@/lib/actions/vehicles';
import { ArrowLeft, ClipboardCheck, Search } from 'lucide-react';

export default function NewInspectionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedVehicleId = searchParams.get('vehicle_id');
  const preselectedJobId = searchParams.get('job_id');

  const [vehicles, setVehicles] = useState<Record<string, unknown>[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<string>(preselectedVehicleId || '');
  const [mileage, setMileage] = useState('');
  const [notes, setNotes] = useState('');
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);
  const [useTemplate, setUseTemplate] = useState(true);

  useEffect(() => {
    loadVehicles();
  }, []);

  async function loadVehicles() {
    try {
      const data = await getVehicles();
      setVehicles(data);
    } catch (err) {
      console.error('Failed to load vehicles:', err);
    }
  }

  async function handleCreate() {
    if (!selectedVehicle) return;
    try {
      setCreating(true);
      const inspection = await createInspection({
        vehicle_id: selectedVehicle,
        job_id: preselectedJobId || undefined,
        mileage_at_inspection: mileage ? Number(mileage) : undefined,
        notes: notes || undefined,
      });

      // Add template items
      if (useTemplate) {
        const template = defaultInspectionTemplate;
        const items: Array<{
          category: string;
          item_name: string;
          condition: 'good' | 'fair' | 'poor';
          sort_order: number;
        }> = [];
        let sortOrder = 0;
        template.forEach(cat => {
          cat.items.forEach(itemName => {
            items.push({
              category: cat.category,
              item_name: itemName,
              condition: 'good',
              sort_order: sortOrder++,
            });
          });
        });
        await bulkAddInspectionItems(inspection.id, items);
      }

      router.push(`/dashboard/inspections/${inspection.id}`);
    } catch (err) {
      console.error('Failed to create inspection:', err);
      alert('ไม่สามารถสร้างรายการตรวจได้');
    } finally {
      setCreating(false);
    }
  }

  const filteredVehicles = vehicles.filter(v => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      String(v.license_plate || '').toLowerCase().includes(s) ||
      String(v.brand || '').toLowerCase().includes(s) ||
      String(v.model || '').toLowerCase().includes(s) ||
      String((v.customer as Record<string, unknown>)?.name || '').toLowerCase().includes(s)
    );
  });

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ClipboardCheck className="h-6 w-6 text-blue-600" />
            สร้างรายการตรวจสภาพใหม่
          </h1>
          <p className="text-sm text-gray-500">เลือกรถที่ต้องการตรวจสภาพ</p>
        </div>
      </div>

      {/* Vehicle Selection */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5">
        <h2 className="font-semibold text-gray-900 mb-3">เลือกรถ</h2>
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="ค้นหาทะเบียน, ยี่ห้อ, ชื่อลูกค้า..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="max-h-60 overflow-y-auto space-y-2">
          {filteredVehicles.map(v => {
            const customer = v.customer as Record<string, unknown> | null;
            return (
              <label
                key={String(v.id)}
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedVehicle === String(v.id)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="vehicle"
                  value={String(v.id)}
                  checked={selectedVehicle === String(v.id)}
                  onChange={(e) => setSelectedVehicle(e.target.value)}
                  className="text-blue-600"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{String(v.brand)} {String(v.model)}</span>
                    <span className="text-sm bg-gray-100 px-2 py-0.5 rounded font-mono">{String(v.license_plate)}</span>
                  </div>
                  <p className="text-sm text-gray-500">{String(customer?.name || '-')}</p>
                </div>
              </label>
            );
          })}
          {filteredVehicles.length === 0 && (
            <p className="text-center text-gray-500 py-4">ไม่พบรถที่ค้นหา</p>
          )}
        </div>
      </div>

      {/* Additional Info */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 space-y-4">
        <h2 className="font-semibold text-gray-900">ข้อมูลเพิ่มเติม</h2>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">เลขไมล์ปัจจุบัน (กม.)</label>
          <input
            type="number"
            value={mileage}
            onChange={(e) => setMileage(e.target.value)}
            placeholder="เช่น 50000"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">หมายเหตุ</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="หมายเหตุเพิ่มเติม..."
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
            rows={3}
          />
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={useTemplate}
            onChange={(e) => setUseTemplate(e.target.checked)}
            className="rounded text-blue-600"
          />
          <span className="text-sm text-gray-700">ใช้เทมเพลตรายการตรวจมาตรฐาน (40+ รายการ)</span>
        </label>
      </div>

      {/* Create Button */}
      <button
        onClick={handleCreate}
        disabled={!selectedVehicle || creating}
        className="w-full py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 font-medium text-lg transition-colors"
      >
        {creating ? 'กำลังสร้าง...' : 'สร้างรายการตรวจสภาพ'}
      </button>
    </div>
  );
}
