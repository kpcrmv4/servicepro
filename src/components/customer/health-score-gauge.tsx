"use client"

import { formatDateShort } from "@/lib/utils"

interface HealthScoreGaugeProps {
  score: number
  label: string
  color: string
  lastInspectionDate?: string
}

function getStrokeColor(color: string): string {
  switch (color) {
    case "text-success":
      return "stroke-success"
    case "text-info":
      return "stroke-info"
    case "text-warning":
      return "stroke-warning"
    case "text-error":
      return "stroke-error"
    default:
      return "stroke-primary"
  }
}

function getTrailColor(color: string): string {
  switch (color) {
    case "text-success":
      return "stroke-success/20"
    case "text-info":
      return "stroke-info/20"
    case "text-warning":
      return "stroke-warning/20"
    case "text-error":
      return "stroke-error/20"
    default:
      return "stroke-primary/20"
  }
}

export default function HealthScoreGauge({
  score,
  label,
  color,
  lastInspectionDate,
}: HealthScoreGaugeProps) {
  // SVG circle parameters
  const size = 120
  const strokeWidth = 8
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const progress = (score / 100) * circumference
  const dashOffset = circumference - progress

  return (
    <div className="rounded-xl border border-border bg-card p-4 w-full">
      <h3 className="text-sm font-semibold text-foreground mb-3">
        คะแนนสุขภาพรถ
      </h3>
      <div className="flex flex-col items-center gap-2">
        <div className="relative" style={{ width: size, height: size }}>
          <svg
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            className="transform -rotate-90"
          >
            {/* Background circle */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              strokeWidth={strokeWidth}
              className={getTrailColor(color)}
            />
            {/* Progress circle */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              className={`${getStrokeColor(color)} transition-all duration-700 ease-out`}
            />
          </svg>
          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-3xl font-bold ${color}`}>{score}</span>
          </div>
        </div>
        <span className={`text-sm font-medium ${color}`}>{label}</span>
        {lastInspectionDate && (
          <span className="text-xs text-muted-foreground">
            ตรวจล่าสุด: {formatDateShort(lastInspectionDate)}
          </span>
        )}
      </div>
    </div>
  )
}
