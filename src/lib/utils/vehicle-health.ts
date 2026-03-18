export interface VehicleHealthInput {
  latestInspection: { items: Array<{ condition: string }> } | null
  inspectionAgeDays: number
  overdueReminders: number
  vehicleYear: number | null
  activeWarranties: number
}

export interface VehicleHealthResult {
  score: number
  label: string
  color: string
}

export function calculateVehicleHealthScore(data: VehicleHealthInput): VehicleHealthResult {
  let score = 100

  // --- DVI condition penalties ---
  if (data.latestInspection && data.latestInspection.items.length > 0) {
    const items = data.latestInspection.items
    const total = items.length
    const poorCount = items.filter((i) => i.condition === "poor").length
    const fairCount = items.filter((i) => i.condition === "fair").length

    score -= (poorCount / total) * 40
    score -= (fairCount / total) * 15
  }

  // --- Inspection age penalties ---
  if (data.latestInspection === null) {
    // No inspection ever recorded
    score -= 15
  } else if (data.inspectionAgeDays > 365) {
    score -= 20
  } else if (data.inspectionAgeDays > 180) {
    score -= 10
  } else if (data.inspectionAgeDays > 90) {
    score -= 5
  }

  // --- Overdue reminders penalty (max -15) ---
  const reminderPenalty = Math.min(data.overdueReminders * 5, 15)
  score -= reminderPenalty

  // --- Vehicle age penalty ---
  if (data.vehicleYear) {
    const currentYear = new Date().getFullYear()
    const age = currentYear - data.vehicleYear
    if (age > 15) {
      score -= 10
    } else if (age > 10) {
      score -= 5
    } else if (age > 7) {
      score -= 3
    }
  }

  // --- Active warranties bonus ---
  if (data.activeWarranties > 0) {
    score += 5
  }

  // Clamp to 0-100
  score = Math.max(0, Math.min(100, Math.round(score)))

  // Determine label and color
  let label: string
  let color: string

  if (score >= 80) {
    label = "สภาพดีมาก"
    color = "text-success"
  } else if (score >= 60) {
    label = "สภาพดี"
    color = "text-info"
  } else if (score >= 40) {
    label = "ควรตรวจเช็ค"
    color = "text-warning"
  } else {
    label = "ต้องดูแลด่วน"
    color = "text-error"
  }

  return { score, label, color }
}
