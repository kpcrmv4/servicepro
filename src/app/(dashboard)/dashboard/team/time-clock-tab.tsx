'use client'

import { useEffect, useState, useCallback } from 'react'
import { getCurrentClockStatus, clockIn, clockOut, startBreak, endBreak, getTimeClockSummaries } from '@/lib/actions/time-clock'
import { Timer, Play, Square, Coffee, CoffeeIcon, Clock, Calendar, TrendingUp, Users } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TimeClockTabProps {
  defaultView?: 'my' | 'team'
}

export function TimeClockTab({ defaultView = 'my' }: TimeClockTabProps) {
  const [status, setStatus] = useState<Record<string, unknown> | null>(null)
  const [summaries, setSummaries] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState(false)
  const [elapsed, setElapsed] = useState('00:00:00')
  const [viewMode, setViewMode] = useState<'my' | 'team'>(defaultView)

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const [statusData, summariesData] = await Promise.all([
        getCurrentClockStatus(),
        getTimeClockSummaries({
          dateFrom: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        }),
      ])
      setStatus(statusData)
      setSummaries(summariesData)
    } catch (err) {
      console.error('Failed to load time clock data:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  useEffect(() => {
    if (!status) return
    const isClockedIn = Boolean(status.isClockedIn)
    const isOnBreak = Boolean(status.isOnBreak)

    if (!isClockedIn && !isOnBreak) {
      setElapsed('00:00:00')
      return
    }

    const todayEntries = (status.todayEntries as Record<string, unknown>[]) || []
    const firstClockIn = todayEntries.find(e => e.clock_type === 'clock_in')
    if (!firstClockIn) return

    const startTime = new Date(String(firstClockIn.timestamp)).getTime()

    const interval = setInterval(() => {
      const now = Date.now()
      const diff = now - startTime
      const hours = Math.floor(diff / 3600000)
      const minutes = Math.floor((diff % 3600000) / 60000)
      const seconds = Math.floor((diff % 60000) / 1000)
      setElapsed(`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`)
    }, 1000)

    return () => clearInterval(interval)
  }, [status])

  async function handleClockIn() {
    try { setActing(true); await clockIn(); await loadData() }
    catch { alert('ไม่สามารถลงเวลาเข้าได้') }
    finally { setActing(false) }
  }

  async function handleClockOut() {
    if (!confirm('ยืนยันลงเวลาออก?')) return
    try { setActing(true); await clockOut(); await loadData() }
    catch { /* noop */ }
    finally { setActing(false) }
  }

  async function handleStartBreak() {
    try { setActing(true); await startBreak(); await loadData() }
    catch { /* noop */ }
    finally { setActing(false) }
  }

  async function handleEndBreak() {
    try { setActing(true); await endBreak(); await loadData() }
    catch { /* noop */ }
    finally { setActing(false) }
  }

  const isClockedIn = Boolean(status?.isClockedIn)
  const isOnBreak = Boolean(status?.isOnBreak)
  const todayEntries = (status?.todayEntries as Record<string, unknown>[]) || []
  const summary = status?.summary as Record<string, unknown> | null

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="px-4 sm:px-6 space-y-6">
      {/* View mode toggle */}
      <div className="flex items-center gap-2">
        <button onClick={() => setViewMode('my')} className={cn("px-3 py-2 rounded-lg text-sm font-medium transition-colors", viewMode === 'my' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground')}>
          ของฉัน
        </button>
        <button onClick={() => setViewMode('team')} className={cn("px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1", viewMode === 'team' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground')}>
          <Users className="h-4 w-4" />
          ทีม
        </button>
      </div>

      {/* Clock Widget */}
      {viewMode === 'my' && (
        <div className={cn(
          "rounded-2xl p-6 sm:p-8 text-center text-white",
          isOnBreak ? 'bg-gradient-to-br from-yellow-400 to-orange-500' : isClockedIn ? 'bg-gradient-to-br from-green-500 to-emerald-600' : 'bg-gradient-to-br from-gray-700 to-gray-900'
        )}>
          <p className="text-sm opacity-80">
            {isOnBreak ? 'กำลังพักเบรก' : isClockedIn ? 'กำลังทำงาน' : 'ยังไม่ได้ลงเวลา'}
          </p>
          <p className="text-5xl sm:text-6xl font-mono font-bold mt-2 tracking-wider">{elapsed}</p>
          <p className="text-sm opacity-80 mt-2">
            {new Date().toLocaleDateString('th-TH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>

          <div className="flex items-center justify-center gap-3 mt-6">
            {!isClockedIn && !isOnBreak && (
              <button onClick={handleClockIn} disabled={acting} className="px-8 py-3 bg-white text-green-700 rounded-xl font-bold text-lg hover:bg-green-50 transition-colors flex items-center gap-2 shadow-lg">
                <Play className="h-6 w-6" />
                {acting ? 'กำลังลงเวลา...' : 'ลงเวลาเข้า'}
              </button>
            )}
            {isClockedIn && (
              <>
                <button onClick={handleStartBreak} disabled={acting} className="px-6 py-3 bg-white/20 text-white rounded-xl font-medium hover:bg-white/30 transition-colors flex items-center gap-2 backdrop-blur-sm">
                  <Coffee className="h-5 w-5" />
                  พักเบรก
                </button>
                <button onClick={handleClockOut} disabled={acting} className="px-8 py-3 bg-white text-red-700 rounded-xl font-bold text-lg hover:bg-red-50 transition-colors flex items-center gap-2 shadow-lg">
                  <Square className="h-6 w-6" />
                  {acting ? 'กำลังลงเวลา...' : 'ลงเวลาออก'}
                </button>
              </>
            )}
            {isOnBreak && (
              <button onClick={handleEndBreak} disabled={acting} className="px-8 py-3 bg-white text-orange-700 rounded-xl font-bold text-lg hover:bg-orange-50 transition-colors flex items-center gap-2 shadow-lg">
                <CoffeeIcon className="h-6 w-6" />
                {acting ? 'กำลังลงเวลา...' : 'กลับมาทำงาน'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Summary Cards */}
      {viewMode === 'my' && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-xl border border-border bg-card p-4">
            <Clock className="h-5 w-5 text-blue-500" />
            <p className="text-2xl font-bold mt-1">{summary ? `${Number(summary.total_hours).toFixed(1)}` : '0'}</p>
            <p className="text-xs text-muted-foreground">ชั่วโมงรวม</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <TrendingUp className="h-5 w-5 text-green-500" />
            <p className="text-2xl font-bold mt-1">{summary ? `${Number(summary.productive_hours).toFixed(1)}` : '0'}</p>
            <p className="text-xs text-muted-foreground">ชั่วโมงทำงาน</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <Coffee className="h-5 w-5 text-yellow-500" />
            <p className="text-2xl font-bold mt-1">{summary ? `${Number(summary.break_hours).toFixed(1)}` : '0'}</p>
            <p className="text-xs text-muted-foreground">ชั่วโมงพัก</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <Calendar className="h-5 w-5 text-purple-500" />
            <p className="text-2xl font-bold mt-1">{summary ? Number(summary.jobs_completed) : '0'}</p>
            <p className="text-xs text-muted-foreground">งานเสร็จวันนี้</p>
          </div>
        </div>
      )}

      {/* Today's Timeline */}
      {viewMode === 'my' && todayEntries.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
          <h3 className="font-semibold mb-4">ไทม์ไลน์วันนี้</h3>
          <div className="space-y-3">
            {todayEntries.map((entry, idx) => {
              const typeConfig: Record<string, { label: string; color: string; icon: string }> = {
                clock_in: { label: 'ลงเวลาเข้า', color: 'bg-green-500', icon: '▶' },
                clock_out: { label: 'ลงเวลาออก', color: 'bg-red-500', icon: '■' },
                break_start: { label: 'เริ่มพัก', color: 'bg-yellow-500', icon: '☕' },
                break_end: { label: 'กลับมาทำงาน', color: 'bg-blue-500', icon: '↩' },
              }
              const config = typeConfig[String(entry.clock_type)] || { label: String(entry.clock_type), color: 'bg-gray-500', icon: '•' }
              return (
                <div key={idx} className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full ${config.color} flex items-center justify-center text-white text-sm`}>
                    {config.icon}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{config.label}</p>
                    {Boolean(entry.notes) && <p className="text-xs text-muted-foreground">{String(entry.notes)}</p>}
                  </div>
                  <span className="text-sm font-mono text-muted-foreground">
                    {new Date(String(entry.timestamp)).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Weekly Summary Table (Team view) */}
      {viewMode === 'team' && summaries.length > 0 && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="px-4 py-3 bg-muted/50 border-b border-border">
            <h3 className="font-semibold">สรุปเวลาทำงานทีม (7 วันล่าสุด)</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">พนักงาน</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">วันที่</th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-muted-foreground">ชม.รวม</th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-muted-foreground">ชม.ทำงาน</th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-muted-foreground">ชม.พัก</th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-muted-foreground">OT</th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-muted-foreground">งานเสร็จ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {summaries.map((s, idx) => {
                  const user = s.user as Record<string, unknown> | null
                  return (
                    <tr key={idx} className="hover:bg-muted/50">
                      <td className="px-4 py-3 text-sm font-medium">{String(user?.full_name || '-')}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{new Date(String(s.date)).toLocaleDateString('th-TH')}</td>
                      <td className="px-4 py-3 text-sm text-right">{Number(s.total_hours).toFixed(1)}</td>
                      <td className="px-4 py-3 text-sm text-right font-medium">{Number(s.productive_hours).toFixed(1)}</td>
                      <td className="px-4 py-3 text-sm text-right text-yellow-600">{Number(s.break_hours).toFixed(1)}</td>
                      <td className="px-4 py-3 text-sm text-right text-red-600">{Number(s.overtime_hours) > 0 ? Number(s.overtime_hours).toFixed(1) : '-'}</td>
                      <td className="px-4 py-3 text-sm text-right">{Number(s.jobs_completed)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {viewMode === 'team' && summaries.length === 0 && (
        <div className="rounded-xl border border-dashed border-border bg-muted/30 p-8 text-center text-sm text-muted-foreground">
          ไม่มีข้อมูลเวลาทำงาน
        </div>
      )}
    </div>
  )
}
