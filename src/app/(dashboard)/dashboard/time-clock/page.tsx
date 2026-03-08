'use client';

import { useEffect, useState, useCallback } from 'react';
import { getCurrentClockStatus, clockIn, clockOut, startBreak, endBreak, getTimeClockSummaries } from '@/lib/actions/time-clock';
import { Timer, Play, Square, Coffee, CoffeeIcon, Clock, Calendar, TrendingUp, Users } from 'lucide-react';

export default function TimeClockPage() {
  const [status, setStatus] = useState<Record<string, unknown> | null>(null);
  const [summaries, setSummaries] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [elapsed, setElapsed] = useState('00:00:00');
  const [viewMode, setViewMode] = useState<'my' | 'team'>('my');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [statusData, summariesData] = await Promise.all([
        getCurrentClockStatus(),
        getTimeClockSummaries({
          dateFrom: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        }),
      ]);
      setStatus(statusData);
      setSummaries(summariesData);
    } catch (err) {
      console.error('Failed to load time clock data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Timer effect
  useEffect(() => {
    if (!status) return;
    const isClockedIn = Boolean(status.isClockedIn);
    const isOnBreak = Boolean(status.isOnBreak);

    if (!isClockedIn && !isOnBreak) {
      setElapsed('00:00:00');
      return;
    }

    const todayEntries = (status.todayEntries as Record<string, unknown>[]) || [];
    const firstClockIn = todayEntries.find(e => e.clock_type === 'clock_in');
    if (!firstClockIn) return;

    const startTime = new Date(String(firstClockIn.timestamp)).getTime();

    const interval = setInterval(() => {
      const now = Date.now();
      const diff = now - startTime;
      const hours = Math.floor(diff / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setElapsed(`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`);
    }, 1000);

    return () => clearInterval(interval);
  }, [status]);

  async function handleClockIn() {
    try {
      setActing(true);
      await clockIn();
      await loadData();
    } catch (err) {
      console.error('Clock in failed:', err);
      alert('ไม่สามารถลงเวลาเข้าได้');
    } finally {
      setActing(false);
    }
  }

  async function handleClockOut() {
    if (!confirm('ยืนยันลงเวลาออก?')) return;
    try {
      setActing(true);
      await clockOut();
      await loadData();
    } catch (err) {
      console.error('Clock out failed:', err);
    } finally {
      setActing(false);
    }
  }

  async function handleStartBreak() {
    try {
      setActing(true);
      await startBreak();
      await loadData();
    } catch (err) {
      console.error('Start break failed:', err);
    } finally {
      setActing(false);
    }
  }

  async function handleEndBreak() {
    try {
      setActing(true);
      await endBreak();
      await loadData();
    } catch (err) {
      console.error('End break failed:', err);
    } finally {
      setActing(false);
    }
  }

  const isClockedIn = Boolean(status?.isClockedIn);
  const isOnBreak = Boolean(status?.isOnBreak);
  const todayEntries = (status?.todayEntries as Record<string, unknown>[]) || [];
  const summary = status?.summary as Record<string, unknown> | null;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Timer className="h-7 w-7 text-indigo-600" />
            บันทึกเวลาทำงาน
          </h1>
          <p className="text-gray-500 mt-1">Technician Time Clock - ลงเวลาเข้า-ออก และพักเบรก</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setViewMode('my')} className={`px-3 py-2 rounded-lg text-sm font-medium ${viewMode === 'my' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
            ของฉัน
          </button>
          <button onClick={() => setViewMode('team')} className={`px-3 py-2 rounded-lg text-sm font-medium ${viewMode === 'team' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
            <Users className="h-4 w-4 inline mr-1" />
            ทีม
          </button>
        </div>
      </div>

      {/* Clock Widget */}
      <div className={`rounded-2xl p-6 sm:p-8 text-center ${isOnBreak ? 'bg-gradient-to-br from-yellow-400 to-orange-500' : isClockedIn ? 'bg-gradient-to-br from-green-500 to-emerald-600' : 'bg-gradient-to-br from-gray-700 to-gray-900'} text-white`}>
        <p className="text-sm opacity-80">
          {isOnBreak ? 'กำลังพักเบรก' : isClockedIn ? 'กำลังทำงาน' : 'ยังไม่ได้ลงเวลา'}
        </p>
        <p className="text-5xl sm:text-6xl font-mono font-bold mt-2 tracking-wider">{elapsed}</p>
        <p className="text-sm opacity-80 mt-2">
          {new Date().toLocaleDateString('th-TH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>

        <div className="flex items-center justify-center gap-3 mt-6">
          {!isClockedIn && !isOnBreak && (
            <button
              onClick={handleClockIn}
              disabled={acting}
              className="px-8 py-3 bg-white text-green-700 rounded-xl font-bold text-lg hover:bg-green-50 transition-colors flex items-center gap-2 shadow-lg"
            >
              <Play className="h-6 w-6" />
              {acting ? 'กำลังลงเวลา...' : 'ลงเวลาเข้า'}
            </button>
          )}
          {isClockedIn && (
            <>
              <button
                onClick={handleStartBreak}
                disabled={acting}
                className="px-6 py-3 bg-white/20 text-white rounded-xl font-medium hover:bg-white/30 transition-colors flex items-center gap-2 backdrop-blur-sm"
              >
                <Coffee className="h-5 w-5" />
                พักเบรก
              </button>
              <button
                onClick={handleClockOut}
                disabled={acting}
                className="px-8 py-3 bg-white text-red-700 rounded-xl font-bold text-lg hover:bg-red-50 transition-colors flex items-center gap-2 shadow-lg"
              >
                <Square className="h-6 w-6" />
                {acting ? 'กำลังลงเวลา...' : 'ลงเวลาออก'}
              </button>
            </>
          )}
          {isOnBreak && (
            <button
              onClick={handleEndBreak}
              disabled={acting}
              className="px-8 py-3 bg-white text-orange-700 rounded-xl font-bold text-lg hover:bg-orange-50 transition-colors flex items-center gap-2 shadow-lg"
            >
              <CoffeeIcon className="h-6 w-6" />
              {acting ? 'กำลังลงเวลา...' : 'กลับมาทำงาน'}
            </button>
          )}
        </div>
      </div>

      {/* Today's Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <Clock className="h-5 w-5 text-blue-500" />
          <p className="text-2xl font-bold text-gray-900 mt-1">{summary ? `${Number(summary.total_hours).toFixed(1)}` : '0'}</p>
          <p className="text-xs text-gray-500">ชั่วโมงรวม</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <TrendingUp className="h-5 w-5 text-green-500" />
          <p className="text-2xl font-bold text-gray-900 mt-1">{summary ? `${Number(summary.productive_hours).toFixed(1)}` : '0'}</p>
          <p className="text-xs text-gray-500">ชั่วโมงทำงาน</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <Coffee className="h-5 w-5 text-yellow-500" />
          <p className="text-2xl font-bold text-gray-900 mt-1">{summary ? `${Number(summary.break_hours).toFixed(1)}` : '0'}</p>
          <p className="text-xs text-gray-500">ชั่วโมงพัก</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <Calendar className="h-5 w-5 text-purple-500" />
          <p className="text-2xl font-bold text-gray-900 mt-1">{summary ? Number(summary.jobs_completed) : '0'}</p>
          <p className="text-xs text-gray-500">งานเสร็จวันนี้</p>
        </div>
      </div>

      {/* Today's Timeline */}
      {todayEntries.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5">
          <h3 className="font-semibold text-gray-900 mb-4">ไทม์ไลน์วันนี้</h3>
          <div className="space-y-3">
            {todayEntries.map((entry, idx) => {
              const typeConfig: Record<string, { label: string; color: string; icon: string }> = {
                clock_in: { label: 'ลงเวลาเข้า', color: 'bg-green-500', icon: '▶' },
                clock_out: { label: 'ลงเวลาออก', color: 'bg-red-500', icon: '■' },
                break_start: { label: 'เริ่มพัก', color: 'bg-yellow-500', icon: '☕' },
                break_end: { label: 'กลับมาทำงาน', color: 'bg-blue-500', icon: '↩' },
              };
              const config = typeConfig[String(entry.clock_type)] || { label: String(entry.clock_type), color: 'bg-gray-500', icon: '•' };

              return (
                <div key={idx} className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full ${config.color} flex items-center justify-center text-white text-sm`}>
                    {config.icon}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 text-sm">{config.label}</p>
                    {Boolean(entry.notes) && <p className="text-xs text-gray-500">{String(entry.notes)}</p>}
                  </div>
                  <span className="text-sm font-mono text-gray-500">
                    {new Date(String(entry.timestamp)).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Weekly Summary */}
      {viewMode === 'team' && summaries.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b">
            <h3 className="font-semibold text-gray-900">สรุปเวลาทำงานทีม (7 วันล่าสุด)</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">พนักงาน</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">วันที่</th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-gray-500">ชม.รวม</th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-gray-500">ชม.ทำงาน</th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-gray-500">ชม.พัก</th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-gray-500">OT</th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-gray-500">งานเสร็จ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {summaries.map((s, idx) => {
                  const user = s.user as Record<string, unknown> | null;
                  return (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{String(user?.full_name || '-')}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{new Date(String(s.date)).toLocaleDateString('th-TH')}</td>
                      <td className="px-4 py-3 text-sm text-right">{Number(s.total_hours).toFixed(1)}</td>
                      <td className="px-4 py-3 text-sm text-right font-medium">{Number(s.productive_hours).toFixed(1)}</td>
                      <td className="px-4 py-3 text-sm text-right text-yellow-600">{Number(s.break_hours).toFixed(1)}</td>
                      <td className="px-4 py-3 text-sm text-right text-red-600">{Number(s.overtime_hours) > 0 ? Number(s.overtime_hours).toFixed(1) : '-'}</td>
                      <td className="px-4 py-3 text-sm text-right">{Number(s.jobs_completed)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
