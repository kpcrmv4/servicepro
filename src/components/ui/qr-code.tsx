"use client"

import { useEffect, useState } from "react"
import QRCode from "qrcode"

export function QRCodeImage({
  value,
  size = 200,
  className,
}: {
  value: string
  size?: number
  className?: string
}) {
  const [dataUrl, setDataUrl] = useState<string>("")

  useEffect(() => {
    QRCode.toDataURL(value, {
      width: size,
      margin: 2,
      color: { dark: "#000000", light: "#FFFFFF" },
    }).then(setDataUrl)
  }, [value, size])

  if (!dataUrl) {
    return (
      <div
        className="animate-pulse bg-muted rounded-lg"
        style={{ width: size, height: size }}
      />
    )
  }

  return (
    <img
      src={dataUrl}
      alt="QR Code"
      width={size}
      height={size}
      className={className}
    />
  )
}
