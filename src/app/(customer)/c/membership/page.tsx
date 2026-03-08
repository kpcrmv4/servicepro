import { ArrowLeft, Crown, Star, Gift, Percent } from "lucide-react"
import Link from "next/link"

const tiers = [
  {
    name: "Bronze",
    icon: "🥉",
    points: "0 - 999",
    benefits: ["สะสมแต้มทุกการใช้บริการ", "รับส่วนลด 5% ค่าแรง"],
    color: "from-amber-700 to-amber-600",
  },
  {
    name: "Silver",
    icon: "🥈",
    points: "1,000 - 4,999",
    benefits: ["ส่วนลด 10% ค่าแรง", "ตรวจเช็คฟรี 1 ครั้ง/ปี", "แจ้งเตือนเช็คระยะ"],
    color: "from-gray-400 to-gray-500",
  },
  {
    name: "Gold",
    icon: "🥇",
    points: "5,000 - 9,999",
    benefits: ["ส่วนลด 15% ค่าแรง", "ตรวจเช็คฟรี 2 ครั้ง/ปี", "ลำดับความสำคัญในคิว", "ล้างรถฟรี"],
    color: "from-yellow-500 to-amber-500",
  },
  {
    name: "Platinum",
    icon: "💎",
    points: "10,000+",
    benefits: ["ส่วนลด 20% ค่าแรง", "ตรวจเช็คฟรี 4 ครั้ง/ปี", "ช่างเฉพาะทาง", "บริการรับ-ส่งรถ", "ห้อง VIP Lounge"],
    color: "from-purple-600 to-indigo-600",
  },
]

export default function MembershipPage() {
  return (
    <div className="p-4 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/c" className="flex h-8 w-8 items-center justify-center rounded-lg border border-border hover:bg-muted">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-lg font-bold">สมาชิก</h1>
          <p className="text-xs text-muted-foreground">ระดับสมาชิกและสิทธิพิเศษ</p>
        </div>
      </div>

      {/* Tiers */}
      <div className="space-y-4">
        {tiers.map((tier) => (
          <div key={tier.name} className="rounded-xl border border-border bg-card overflow-hidden">
            <div className={`bg-gradient-to-r ${tier.color} p-4 text-white`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{tier.icon}</span>
                  <div>
                    <p className="font-bold">{tier.name}</p>
                    <p className="text-xs opacity-80">{tier.points} แต้ม</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-4">
              <ul className="space-y-2">
                {tier.benefits.map((benefit, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <Star className="h-3 w-3 text-primary shrink-0" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      {/* How to earn */}
      <div className="rounded-xl border border-border bg-card p-4">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Gift className="h-4 w-4 text-primary" /> วิธีสะสมแต้ม
        </h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>ทุกการใช้บริการ 100 บาท = 1 แต้ม</li>
          <li>แนะนำเพื่อน = 100 แต้ม</li>
          <li>รีวิวบน Google = 50 แต้ม</li>
        </ul>
      </div>
    </div>
  )
}
