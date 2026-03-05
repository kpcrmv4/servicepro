"use client"

import { useState } from "react"
import {
  Save,
  Store,
  Clock,
  Palette,
  Bell,
  Shield,
  Printer,
  Globe,
  Upload,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs"

export default function SettingsPage() {
  const [shopName, setShopName] = useState("อู่ช่างสมชาย")
  const [phone, setPhone] = useState("02-123-4567")
  const [email, setEmail] = useState("contact@changsamchai.com")
  const [address, setAddress] = useState("123/45 ถ.พหลโยธิน แขวงจตุจักร เขตจตุจักร กรุงเทพฯ 10900")
  const [taxId, setTaxId] = useState("0-1234-56789-01-2")
  const [openTime, setOpenTime] = useState("08:00")
  const [closeTime, setCloseTime] = useState("18:00")

  return (
    <div className="flex flex-col">
      <PageHeader
        title="ตั้งค่า"
        action={
          <Button>
            <Save className="h-4 w-4" />
            บันทึก
          </Button>
        }
      />

      <div className="p-6">
        <Tabs defaultValue="general">
          <TabsList>
            <TabsTrigger value="general">
              <Store className="h-4 w-4 mr-1.5" />
              ทั่วไป
            </TabsTrigger>
            <TabsTrigger value="schedule">
              <Clock className="h-4 w-4 mr-1.5" />
              เวลาทำการ
            </TabsTrigger>
            <TabsTrigger value="notifications">
              <Bell className="h-4 w-4 mr-1.5" />
              การแจ้งเตือน
            </TabsTrigger>
            <TabsTrigger value="printing">
              <Printer className="h-4 w-4 mr-1.5" />
              การพิมพ์
            </TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="rounded-xl border border-border">
                <CardContent className="p-6 space-y-4">
                  <h3 className="font-semibold text-foreground">ข้อมูลร้าน</h3>

                  <div className="space-y-2">
                    <Label htmlFor="shop-logo">โลโก้ร้าน</Label>
                    <div className="flex items-center gap-4">
                      <div className="h-16 w-16 rounded-xl bg-primary flex items-center justify-center text-primary-foreground text-xl font-bold">
                        อู่
                      </div>
                      <Button variant="outline" size="sm">
                        <Upload className="h-4 w-4 mr-1.5" />
                        อัพโหลดโลโก้
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="shop-name">ชื่อร้าน</Label>
                    <Input
                      id="shop-name"
                      value={shopName}
                      onChange={(e) => setShopName(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">โทรศัพท์</Label>
                      <Input
                        id="phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">อีเมล</Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">ที่อยู่</Label>
                    <Textarea
                      id="address"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tax-id">เลขประจำตัวผู้เสียภาษี</Label>
                    <Input
                      id="tax-id"
                      value={taxId}
                      onChange={(e) => setTaxId(e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-xl border border-border">
                <CardContent className="p-6 space-y-4">
                  <h3 className="font-semibold text-foreground">ตั้งค่าระบบ</h3>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">ภาษา</p>
                        <p className="text-xs text-muted-foreground">เลือกภาษาที่แสดงในระบบ</p>
                      </div>
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-input text-sm">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        ไทย
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">สกุลเงิน</p>
                        <p className="text-xs text-muted-foreground">สกุลเงินที่ใช้ในระบบ</p>
                      </div>
                      <span className="text-sm text-muted-foreground">THB (฿)</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">VAT</p>
                        <p className="text-xs text-muted-foreground">อัตราภาษีมูลค่าเพิ่ม</p>
                      </div>
                      <span className="text-sm text-muted-foreground">7%</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">เลขที่ใบงานถัดไป</p>
                        <p className="text-xs text-muted-foreground">รูปแบบ: JOB-YYYY-NNNN</p>
                      </div>
                      <span className="text-sm font-mono text-muted-foreground">JOB-2026-0020</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">เลขที่ใบเสนอราคาถัดไป</p>
                        <p className="text-xs text-muted-foreground">รูปแบบ: QT-YYYY-NNNN</p>
                      </div>
                      <span className="text-sm font-mono text-muted-foreground">QT-2026-0050</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Schedule Settings */}
          <TabsContent value="schedule">
            <Card className="rounded-xl border border-border max-w-xl">
              <CardContent className="p-6 space-y-4">
                <h3 className="font-semibold text-foreground">เวลาทำการ</h3>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="open">เวลาเปิด</Label>
                    <Input id="open" type="time" value={openTime} onChange={(e) => setOpenTime(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="close">เวลาปิด</Label>
                    <Input id="close" type="time" value={closeTime} onChange={(e) => setCloseTime(e.target.value)} />
                  </div>
                </div>

                <h4 className="font-medium text-sm text-foreground pt-2">วันทำการ</h4>
                <div className="space-y-3">
                  {[
                    { day: "จันทร์", enabled: true },
                    { day: "อังคาร", enabled: true },
                    { day: "พุธ", enabled: true },
                    { day: "พฤหัสบดี", enabled: true },
                    { day: "ศุกร์", enabled: true },
                    { day: "เสาร์", enabled: true },
                    { day: "อาทิตย์", enabled: false },
                  ].map((d) => (
                    <div key={d.day} className="flex items-center justify-between">
                      <span className="text-sm">{d.day}</span>
                      <Switch defaultChecked={d.enabled} />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notification Settings */}
          <TabsContent value="notifications">
            <Card className="rounded-xl border border-border max-w-xl">
              <CardContent className="p-6 space-y-4">
                <h3 className="font-semibold text-foreground">ตั้งค่าการแจ้งเตือน</h3>

                <div className="space-y-4">
                  {[
                    { title: "แจ้งเตือนงานใหม่", desc: "เมื่อมีงานซ่อมใหม่เข้ามาในระบบ", defaultOn: true },
                    { title: "แจ้งเตือนงานเสร็จ", desc: "เมื่อช่างอัพเดทสถานะงานเป็นเสร็จสิ้น", defaultOn: true },
                    { title: "แจ้งเตือนสต็อกต่ำ", desc: "เมื่ออะไหล่เหลือน้อยกว่าจุดสั่งซื้อ", defaultOn: true },
                    { title: "แจ้งเตือน LINE", desc: "ส่งการแจ้งเตือนผ่าน LINE Notify", defaultOn: false },
                    { title: "แจ้งเตือนอีเมล", desc: "ส่งสรุปรายวันทางอีเมล", defaultOn: false },
                    { title: "แจ้งเตือนลูกค้า", desc: "ส่ง SMS/LINE แจ้งสถานะงานให้ลูกค้า", defaultOn: true },
                  ].map((item) => (
                    <div key={item.title} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{item.title}</p>
                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                      </div>
                      <Switch defaultChecked={item.defaultOn} />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Printing Settings */}
          <TabsContent value="printing">
            <Card className="rounded-xl border border-border max-w-xl">
              <CardContent className="p-6 space-y-4">
                <h3 className="font-semibold text-foreground">ตั้งค่าการพิมพ์</h3>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">แสดงโลโก้บนเอกสาร</p>
                      <p className="text-xs text-muted-foreground">แสดงโลโก้ร้านบนใบเสนอราคา/ใบแจ้งหนี้</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">ขนาดกระดาษ</p>
                      <p className="text-xs text-muted-foreground">ขนาดกระดาษเริ่มต้น</p>
                    </div>
                    <span className="text-sm text-muted-foreground">A4</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">พิมพ์ใบรับสินค้าอัตโนมัติ</p>
                      <p className="text-xs text-muted-foreground">พิมพ์อัตโนมัติเมื่อรับรถเข้าอู่</p>
                    </div>
                    <Switch defaultChecked={false} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="footer">ข้อความท้ายเอกสาร</Label>
                    <Textarea
                      id="footer"
                      placeholder="เช่น ขอบคุณที่ใช้บริการ..."
                      rows={3}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
