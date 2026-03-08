'use client';

import { useEffect, useState } from 'react';
import { getLineOAConfig, saveLineOAConfig, testLineConnection, getLineFollowers, linkFollowerToCustomer } from '@/lib/actions/line';
import { MessageCircle, Save, TestTube, Users, Link2, CheckCircle, XCircle, ExternalLink, Copy, AlertTriangle, Search } from 'lucide-react';

export default function LineSettingsPage() {
  const [config, setConfig] = useState({
    channel_id: '',
    channel_secret: '',
    channel_access_token: '',
    welcome_message: 'ยินดีต้อนรับสู่ระบบอู่ของเรา! 🚗\n\nพิมพ์ "สถานะ" เพื่อเช็คสถานะงานซ่อม',
    auto_reply_enabled: true,
    notify_job_status: true,
    notify_job_complete: true,
    notify_quotation: true,
    notify_inspection: true,
    notify_reminder: true,
  });
  const [followers, setFollowers] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; botName?: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'config' | 'followers' | 'notifications'>('config');
  const [followerSearch, setFollowerSearch] = useState('');
  const [webhookCopied, setWebhookCopied] = useState(false);

  const webhookUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/api/line/webhook`
    : '/api/line/webhook';

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [configData, followersData] = await Promise.all([
        getLineOAConfig(),
        getLineFollowers(),
      ]);
      if (configData) {
        setConfig({
          channel_id: String(configData.channel_id || ''),
          channel_secret: String(configData.channel_secret || ''),
          channel_access_token: String(configData.channel_access_token || ''),
          welcome_message: String(configData.welcome_message || ''),
          auto_reply_enabled: Boolean(configData.auto_reply_enabled ?? true),
          notify_job_status: Boolean(configData.notify_job_status ?? true),
          notify_job_complete: Boolean(configData.notify_job_complete ?? true),
          notify_quotation: Boolean(configData.notify_quotation ?? true),
          notify_inspection: Boolean(configData.notify_inspection ?? true),
          notify_reminder: Boolean(configData.notify_reminder ?? true),
        });
      }
      setFollowers(followersData);
    } catch (err) {
      console.error('Failed to load LINE config:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    try {
      setSaving(true);
      await saveLineOAConfig(config);
      alert('บันทึกการตั้งค่าสำเร็จ');
    } catch (err) {
      console.error('Failed to save config:', err);
      alert('บันทึกไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  }

  async function handleTest() {
    try {
      setTesting(true);
      setTestResult(null);
      const result = await testLineConnection();
      setTestResult({ success: result.success, message: `เชื่อมต่อสำเร็จ! Bot: ${result.botName || 'Unknown'}`, botName: result.botName });
    } catch {
      setTestResult({ success: false, message: 'ไม่สามารถเชื่อมต่อได้' });
    } finally {
      setTesting(false);
    }
  }

  async function handleLinkCustomer(followerId: string, customerId: string) {
    try {
      await linkFollowerToCustomer(followerId, customerId);
      await loadData();
    } catch (err) {
      console.error('Failed to link customer:', err);
    }
  }

  function copyWebhook() {
    navigator.clipboard.writeText(webhookUrl);
    setWebhookCopied(true);
    setTimeout(() => setWebhookCopied(false), 2000);
  }

  const filteredFollowers = followers.filter(f => {
    if (!followerSearch) return true;
    const s = followerSearch.toLowerCase();
    return String(f.display_name || '').toLowerCase().includes(s);
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <MessageCircle className="h-7 w-7 text-green-600" />
          ตั้งค่า LINE OA
        </h1>
        <p className="text-gray-500 mt-1">เชื่อมต่อ LINE Official Account กับระบบ ServicePro</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl overflow-x-auto">
        {[
          { key: 'config', label: 'การเชื่อมต่อ' },
          { key: 'notifications', label: 'การแจ้งเตือน' },
          { key: 'followers', label: `ผู้ติดตาม (${followers.length})` },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as typeof activeTab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Config Tab */}
      {activeTab === 'config' && (
        <div className="space-y-6">
          {/* Webhook URL */}
          <div className="bg-green-50 rounded-xl border border-green-200 p-4 sm:p-5">
            <h3 className="font-semibold text-green-900 mb-2">Webhook URL</h3>
            <p className="text-sm text-green-700 mb-3">คัดลอก URL นี้ไปวางใน LINE Developers Console</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-white px-3 py-2 rounded-lg text-sm font-mono border border-green-200 truncate">
                {webhookUrl}
              </code>
              <button onClick={copyWebhook} className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-1 text-sm shrink-0">
                {webhookCopied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {webhookCopied ? 'คัดลอกแล้ว' : 'คัดลอก'}
              </button>
            </div>
          </div>

          {/* Setup Guide */}
          <div className="bg-blue-50 rounded-xl border border-blue-200 p-4 sm:p-5">
            <h3 className="font-semibold text-blue-900 mb-2">วิธีตั้งค่า</h3>
            <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
              <li>ไปที่ <a href="https://developers.line.biz" target="_blank" rel="noopener noreferrer" className="underline font-medium inline-flex items-center gap-1">LINE Developers Console <ExternalLink className="h-3 w-3" /></a></li>
              <li>สร้าง Provider และ Messaging API Channel</li>
              <li>คัดลอก Channel ID, Channel Secret และ Channel Access Token มาวางด้านล่าง</li>
              <li>ตั้ง Webhook URL เป็น URL ด้านบน</li>
              <li>เปิดใช้งาน Webhook และปิด Auto-reply messages ใน LINE Console</li>
            </ol>
          </div>

          {/* Credentials */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 space-y-4">
            <h3 className="font-semibold text-gray-900">ข้อมูลการเชื่อมต่อ</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Channel ID</label>
              <input
                type="text"
                value={config.channel_id}
                onChange={e => setConfig({ ...config, channel_id: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                placeholder="เช่น 1234567890"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Channel Secret</label>
              <input
                type="password"
                value={config.channel_secret}
                onChange={e => setConfig({ ...config, channel_secret: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                placeholder="••••••••••"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Channel Access Token</label>
              <input
                type="password"
                value={config.channel_access_token}
                onChange={e => setConfig({ ...config, channel_access_token: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                placeholder="••••••••••"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ข้อความต้อนรับ</label>
              <textarea
                value={config.welcome_message}
                onChange={e => setConfig({ ...config, welcome_message: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                rows={3}
              />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={config.auto_reply_enabled}
                onChange={e => setConfig({ ...config, auto_reply_enabled: e.target.checked })}
                className="rounded text-green-600"
              />
              <span className="text-sm text-gray-700">เปิดระบบตอบกลับอัตโนมัติ</span>
            </label>
          </div>

          {/* Test & Save */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button onClick={handleTest} disabled={testing || !config.channel_access_token} className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium flex items-center justify-center gap-2 disabled:opacity-50">
              <TestTube className="h-5 w-5" />
              {testing ? 'กำลังทดสอบ...' : 'ทดสอบการเชื่อมต่อ'}
            </button>
            <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium flex items-center justify-center gap-2 disabled:opacity-50">
              <Save className="h-5 w-5" />
              {saving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}
            </button>
          </div>

          {testResult && (
            <div className={`rounded-xl p-4 flex items-center gap-3 ${testResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              {testResult.success ? <CheckCircle className="h-5 w-5 text-green-600" /> : <XCircle className="h-5 w-5 text-red-600" />}
              <span className={testResult.success ? 'text-green-700' : 'text-red-700'}>{testResult.message}</span>
            </div>
          )}
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 space-y-4">
          <h3 className="font-semibold text-gray-900 mb-2">เลือกการแจ้งเตือนที่ต้องการส่งผ่าน LINE</h3>
          <p className="text-sm text-gray-500 mb-4">ระบบจะส่งข้อความแจ้งเตือนไปยังลูกค้าผ่าน LINE OA อัตโนมัติ</p>

          {[
            { key: 'notify_job_status', label: 'อัปเดตสถานะงานซ่อม', desc: 'แจ้งเมื่อสถานะงานเปลี่ยน (เช่น กำลังซ่อม, ตรวจสอบคุณภาพ)' },
            { key: 'notify_job_complete', label: 'งานซ่อมเสร็จ', desc: 'แจ้งเมื่อซ่อมเสร็จพร้อมรับรถ' },
            { key: 'notify_quotation', label: 'ส่งใบเสนอราคา', desc: 'ส่ง Flex Message ใบเสนอราคาพร้อมปุ่มอนุมัติ' },
            { key: 'notify_inspection', label: 'ผลตรวจสภาพรถ (DVI)', desc: 'ส่งลิงก์รายงาน DVI ให้ลูกค้าดู' },
            { key: 'notify_reminder', label: 'แจ้งเตือนรอบบริการ', desc: 'แจ้งเตือนเมื่อถึงรอบเช็คระยะหรือเปลี่ยนถ่าย' },
          ].map(item => (
            <label key={item.key} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
              <input
                type="checkbox"
                checked={Boolean(config[item.key as keyof typeof config])}
                onChange={e => setConfig({ ...config, [item.key]: e.target.checked })}
                className="rounded text-green-600 mt-0.5"
              />
              <div>
                <span className="font-medium text-gray-900">{item.label}</span>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </div>
            </label>
          ))}

          <button onClick={handleSave} disabled={saving} className="w-full py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium flex items-center justify-center gap-2 disabled:opacity-50 mt-4">
            <Save className="h-5 w-5" />
            {saving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}
          </button>
        </div>
      )}

      {/* Followers Tab */}
      {activeTab === 'followers' && (
        <div className="space-y-4">
          <div className="bg-yellow-50 rounded-xl border border-yellow-200 p-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <p className="font-medium">เชื่อมโยงผู้ติดตาม LINE กับลูกค้าในระบบ</p>
              <p>เมื่อเชื่อมโยงแล้ว ระบบจะสามารถส่งแจ้งเตือนไปยัง LINE ของลูกค้าได้โดยอัตโนมัติ</p>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="ค้นหาผู้ติดตาม..."
              value={followerSearch}
              onChange={e => setFollowerSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500"
            />
          </div>

          {filteredFollowers.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <Users className="h-12 w-12 text-gray-300 mx-auto" />
              <p className="text-gray-500 mt-3">ยังไม่มีผู้ติดตาม LINE OA</p>
              <p className="text-sm text-gray-400">ผู้ติดตามจะปรากฏเมื่อมีคนเพิ่มเพื่อน LINE OA ของร้าน</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredFollowers.map(follower => {
                const customer = follower.customer as Record<string, unknown> | null;
                return (
                  <div key={String(follower.id)} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
                    {follower.picture_url ? (
                      <img src={String(follower.picture_url)} alt="" className="w-10 h-10 rounded-full" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                        <Users className="h-5 w-5 text-green-600" />
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{String(follower.display_name || 'ไม่ทราบชื่อ')}</p>
                      {customer ? (
                        <p className="text-sm text-green-600 flex items-center gap-1">
                          <Link2 className="h-3.5 w-3.5" />
                          เชื่อมกับ: {String(customer.name)}
                        </p>
                      ) : (
                        <p className="text-sm text-gray-400">ยังไม่ได้เชื่อมกับลูกค้า</p>
                      )}
                    </div>
                    {!customer && (
                      <button
                        onClick={() => {
                          const customerId = prompt('ใส่ Customer ID ที่ต้องการเชื่อม:');
                          if (customerId) handleLinkCustomer(String(follower.id), customerId);
                        }}
                        className="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 text-sm font-medium flex items-center gap-1"
                      >
                        <Link2 className="h-4 w-4" />
                        เชื่อมโยง
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
