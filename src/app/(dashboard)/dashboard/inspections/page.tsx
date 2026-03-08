'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getInspections } from '@/lib/actions/inspections';
import { ClipboardCheck, Plus, Eye, Send, Search, Filter } from 'lucide-react';

export default function InspectionsPage() {
  const [inspections, setInspections] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadInspections();
  }, [statusFilter]);

  async function loadInspections() {
    try {
      setLoading(true);
      const filters: { status?: string } = {};
      if (statusFilter !== 'all') filters.status = statusFilter;
      const data = await getInspections(filters);
      setInspections(data);
    } catch (err) {
      console.error('Failed to load inspections:', err);
    } finally {
      setLoading(false);
    }
  }

  const filteredInspections = inspections.filter(i => {
    if (!search) return true;
    const vehicle = i.vehicle as Record<string, unknown> | null;
    const searchLower = search.toLowerCase();
    return (
      String(vehicle?.license_plate || '').toLowerCase().includes(searchLower) ||
      String(vehicle?.brand || '').toLowerCase().includes(searchLower) ||
      String(vehicle?.model || '').toLowerCase().includes(searchLower) ||
      String((vehicle?.customer as Record<string, unknown>)?.name || '').toLowerCase().includes(searchLower)
    );
  });

  const getConditionCounts = (items: Record<string, unknown>[]) => {
    const good = items.filter(i => i.condition === 'good').length;
    const fair = items.filter(i => i.condition === 'fair').length;
    const poor = items.filter(i => i.condition === 'poor').length;
    return { good, fair, poor };
  };

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-700',
      in_progress: 'bg-blue-100 text-blue-700',
      completed: 'bg-green-100 text-green-700',
      sent: 'bg-purple-100 text-purple-700',
    };
    const labels: Record<string, string> = {
      draft: 'แบบร่าง',
      in_progress: 'กำลังตรวจ',
      completed: 'ตรวจเสร็จ',
      sent: 'ส่งลูกค้าแล้ว',
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-700'}`}>
        {labels[status] || status}
      </span>
    );
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ClipboardCheck className="h-7 w-7 text-blue-600" />
            ตรวจสภาพรถ (DVI)
          </h1>
          <p className="text-gray-500 mt-1">Digital Vehicle Inspection - ตรวจสภาพรถดิจิทัล</p>
        </div>
        <Link
          href="/dashboard/inspections/new"
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          <Plus className="h-5 w-5" />
          สร้างรายการตรวจใหม่
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="ค้นหาทะเบียน, ยี่ห้อ, ชื่อลูกค้า..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-400" />
          {['all', 'draft', 'in_progress', 'completed', 'sent'].map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {status === 'all' ? 'ทั้งหมด' : status === 'draft' ? 'แบบร่าง' : status === 'in_progress' ? 'กำลังตรวจ' : status === 'completed' ? 'ตรวจเสร็จ' : 'ส่งแล้ว'}
            </button>
          ))}
        </div>
      </div>

      {/* Inspections List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-500 mt-2">กำลังโหลด...</p>
        </div>
      ) : filteredInspections.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <ClipboardCheck className="h-12 w-12 text-gray-300 mx-auto" />
          <p className="text-gray-500 mt-3">ยังไม่มีรายการตรวจสภาพ</p>
          <Link href="/dashboard/inspections/new" className="text-blue-600 hover:underline text-sm mt-1 inline-block">
            สร้างรายการตรวจใหม่
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredInspections.map((inspection) => {
            const vehicle = inspection.vehicle as Record<string, unknown> | null;
            const customer = vehicle?.customer as Record<string, unknown> | null;
            const inspector = inspection.inspector as Record<string, unknown> | null;
            const items = (inspection.items as Record<string, unknown>[]) || [];
            const { good, fair, poor } = getConditionCounts(items);

            return (
              <div key={String(inspection.id)} className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 hover:shadow-md transition-shadow">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="font-semibold text-gray-900">
                        {String(vehicle?.brand || '')} {String(vehicle?.model || '')}
                      </h3>
                      <span className="text-sm bg-gray-100 px-2 py-0.5 rounded font-mono">
                        {String(vehicle?.license_plate || '-')}
                      </span>
                      {statusBadge(String(inspection.status))}
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                      <span>ลูกค้า: {String(customer?.name || '-')}</span>
                      <span>ช่าง: {String(inspector?.full_name || '-')}</span>
                      <span>{new Date(String(inspection.created_at)).toLocaleDateString('th-TH')}</span>
                    </div>
                    {items.length > 0 && (
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-xs font-medium text-gray-500">{items.length} รายการ:</span>
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 text-xs">
                            <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
                            {good} ดี
                          </span>
                          <span className="inline-flex items-center gap-1 text-xs">
                            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500"></span>
                            {fair} พอใช้
                          </span>
                          <span className="inline-flex items-center gap-1 text-xs">
                            <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                            {poor} ต้องซ่อม
                          </span>
                        </div>
                        {inspection.overall_score !== null && (
                          <span className="text-xs font-bold text-blue-600">
                            คะแนน: {Number(inspection.overall_score).toFixed(1)}/10
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/dashboard/inspections/${inspection.id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 text-sm font-medium"
                    >
                      <Eye className="h-4 w-4" />
                      ดูรายละเอียด
                    </Link>
                    {Boolean(inspection.share_token) && (
                      <Link
                        href={`/inspect/${inspection.share_token}`}
                        target="_blank"
                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 text-sm font-medium"
                      >
                        <Send className="h-4 w-4" />
                        ลิงก์ลูกค้า
                      </Link>
                    )}
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
