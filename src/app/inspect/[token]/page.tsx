'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getInspectionByShareToken } from '@/lib/actions/inspections';
import { CheckCircle, AlertTriangle, XCircle, ClipboardCheck, Car, User, Calendar, Gauge } from 'lucide-react';
import { CustomerApprovalForm } from '@/components/inspections/customer-approval-form';

const conditionConfig = {
  good: { label: 'ดี', color: 'bg-green-500', textColor: 'text-green-700', bgColor: 'bg-green-50', borderColor: 'border-green-200', icon: CheckCircle },
  fair: { label: 'ควรเปลี่ยน', color: 'bg-yellow-500', textColor: 'text-yellow-700', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-200', icon: AlertTriangle },
  poor: { label: 'ต้องซ่อม', color: 'bg-red-500', textColor: 'text-red-700', bgColor: 'bg-red-50', borderColor: 'border-red-200', icon: XCircle },
};

export default function PublicInspectionPage() {
  const params = useParams();
  const [inspection, setInspection] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const data = await getInspectionByShareToken(params.token as string);
        setInspection(data);
      } catch {
        setError('ไม่พบรายงานตรวจสภาพ หรือลิงก์หมดอายุ');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [params.token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-500 mt-3">กำลังโหลดรายงาน...</p>
        </div>
      </div>
    );
  }

  if (error || !inspection) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center max-w-md">
          <XCircle className="h-16 w-16 text-red-400 mx-auto" />
          <h1 className="text-xl font-bold text-gray-900 mt-4">ไม่พบรายงาน</h1>
          <p className="text-gray-500 mt-2">{error || 'ลิงก์อาจหมดอายุหรือไม่ถูกต้อง'}</p>
        </div>
      </div>
    );
  }

  const vehicle = inspection.vehicle as Record<string, unknown> | null;
  const inspector = inspection.inspector as Record<string, unknown> | null;
  const items = (inspection.items as Record<string, unknown>[]) || [];

  const goodCount = items.filter(i => i.condition === 'good').length;
  const fairCount = items.filter(i => i.condition === 'fair').length;
  const poorCount = items.filter(i => i.condition === 'poor').length;
  const totalEstCost = items.reduce((sum, i) => sum + (Number(i.estimated_cost) || 0), 0);

  // Group by category
  const groupedItems: Record<string, Record<string, unknown>[]> = {};
  items.forEach(item => {
    const cat = String(item.category || 'อื่นๆ');
    if (!groupedItems[cat]) groupedItems[cat] = [];
    groupedItems[cat].push(item);
  });

  const scoreColor = Number(inspection.overall_score) >= 8 ? 'text-green-600' : Number(inspection.overall_score) >= 5 ? 'text-yellow-600' : 'text-red-600';

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="flex items-center gap-3 mb-4">
            <ClipboardCheck className="h-8 w-8" />
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">รายงานตรวจสภาพรถ</h1>
              <p className="text-blue-200 text-sm">Digital Vehicle Inspection Report</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="flex items-center gap-2">
              <Car className="h-5 w-5 text-blue-300" />
              <div>
                <p className="text-xs text-blue-300">รถ</p>
                <p className="font-medium">{String(vehicle?.brand || '')} {String(vehicle?.model || '')}</p>
                <p className="text-sm text-blue-200">{String(vehicle?.license_plate || '')}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-blue-300" />
              <div>
                <p className="text-xs text-blue-300">ผู้ตรวจ</p>
                <p className="font-medium">{String(inspector?.full_name || '-')}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-300" />
              <div>
                <p className="text-xs text-blue-300">วันที่ตรวจ</p>
                <p className="font-medium">{new Date(String(inspection.created_at)).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
            </div>
            {inspection.mileage_at_inspection ? (
              <div className="flex items-center gap-2">
                <Gauge className="h-5 w-5 text-blue-300" />
                <div>
                  <p className="text-xs text-blue-300">เลขไมล์</p>
                  <p className="font-medium">{Number(inspection.mileage_at_inspection).toLocaleString()} กม.</p>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 -mt-6 pb-12 space-y-4">
        {/* Score Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="text-center mb-4">
            {inspection.overall_score !== null ? (
              <div className={`text-5xl font-bold ${scoreColor}`}>
                {Number(inspection.overall_score).toFixed(1)}
                <span className="text-lg text-gray-400">/10</span>
              </div>
            ) : null}
            <p className="text-gray-500 text-sm mt-1">คะแนนสภาพรวม</p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-green-50 rounded-xl p-3 text-center border border-green-200">
              <CheckCircle className="h-6 w-6 text-green-500 mx-auto" />
              <p className="text-2xl font-bold text-green-600 mt-1">{goodCount}</p>
              <p className="text-xs text-green-600">สภาพดี</p>
            </div>
            <div className="bg-yellow-50 rounded-xl p-3 text-center border border-yellow-200">
              <AlertTriangle className="h-6 w-6 text-yellow-500 mx-auto" />
              <p className="text-2xl font-bold text-yellow-600 mt-1">{fairCount}</p>
              <p className="text-xs text-yellow-600">ควรเปลี่ยน</p>
            </div>
            <div className="bg-red-50 rounded-xl p-3 text-center border border-red-200">
              <XCircle className="h-6 w-6 text-red-500 mx-auto" />
              <p className="text-2xl font-bold text-red-600 mt-1">{poorCount}</p>
              <p className="text-xs text-red-600">ต้องซ่อม</p>
            </div>
          </div>
          {totalEstCost > 0 && (
            <div className="mt-4 bg-orange-50 rounded-xl p-4 text-center border border-orange-200">
              <p className="text-sm text-orange-600">ค่าใช้จ่ายโดยประมาณ</p>
              <p className="text-2xl font-bold text-orange-700">฿{totalEstCost.toLocaleString()}</p>
            </div>
          )}
        </div>

        {/* Items by Category */}
        {Object.entries(groupedItems).map(([category, catItems]: [string, Record<string, unknown>[]]) => (
          <div key={category} className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 border-b">
              <h3 className="font-semibold text-gray-900">{category}</h3>
            </div>
            <div className="divide-y divide-gray-50">
              {catItems.sort((a, b) => (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0)).map(item => {
                const cond = conditionConfig[item.condition as keyof typeof conditionConfig] || conditionConfig.good;
                const CondIcon = cond.icon;
                return (
                  <div key={String(item.id)} className={`p-4 ${cond.bgColor} bg-opacity-30`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CondIcon className={`h-5 w-5 ${cond.textColor}`} />
                        <span className="font-medium text-gray-900">{String(item.item_name)}</span>
                      </div>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${cond.bgColor} ${cond.textColor} border ${cond.borderColor}`}>
                        {cond.label}
                      </span>
                    </div>
                    {item.notes ? <p className="text-sm text-gray-600 mt-1 ml-7">{String(item.notes)}</p> : null}
                    {Number(item.estimated_cost) > 0 ? (
                      <p className="text-sm text-orange-600 mt-1 ml-7 font-medium">ค่าใช้จ่าย: ฿{Number(item.estimated_cost).toLocaleString()}</p>
                    ) : null}
                    {item.photo_url ? (
                      <div className="mt-2 ml-7">
                        <img src={String(item.photo_url)} alt={String(item.item_name)} className="rounded-lg max-h-48 object-cover" />
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Customer Approval Form */}
        <CustomerApprovalForm
          shareToken={params.token as string}
          items={items.map(item => ({
            id: String(item.id),
            item_name: String(item.item_name || ''),
            category: String(item.category || 'อื่นๆ'),
            condition: item.condition as 'good' | 'fair' | 'poor',
            estimated_cost: Number(item.estimated_cost) || null,
            customer_approved: item.customer_approved as boolean | null,
            photo_url: item.photo_url ? String(item.photo_url) : null,
            notes: item.notes ? String(item.notes) : null,
          }))}
          isAlreadyApproved={!!inspection.created_job_id}
          createdJobNumber={
            (inspection.created_job as Record<string, unknown> | null)?.job_number
              ? String((inspection.created_job as Record<string, unknown>).job_number)
              : null
          }
        />

        {/* Notes */}
        {inspection.notes ? (
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <h3 className="font-semibold text-gray-900 mb-2">หมายเหตุจากช่าง</h3>
            <p className="text-gray-600 text-sm">{String(inspection.notes)}</p>
          </div>
        ) : null}

        {/* Footer */}
        <div className="text-center text-sm text-gray-400 pt-4">
          <p>รายงานนี้สร้างโดย ServicePro</p>
          <p>ระบบบริหารอู่ซ่อมรถอัจฉริยะ</p>
        </div>
      </div>
    </div>
  );
}
