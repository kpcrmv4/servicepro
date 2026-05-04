'use client';

import { useEffect, useRef, useState } from 'react';
import { Eraser, Pen } from 'lucide-react';

interface Props {
  onChange?: (dataUrl: string | null) => void;
  height?: number;
  className?: string;
}

/**
 * Lightweight HTML5 canvas signature pad. Returns a data: URL on
 * change so the parent can either upload it or just keep it in state.
 *
 * No external library — keeps the bundle small. Touch + mouse + pen
 * supported via PointerEvents.
 */
export function SignaturePad({ onChange, height = 180, className = '' }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#0f172a';
  }, []);

  const getPoint = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const handleDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const p = getPoint(e);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    setIsDrawing(true);
    canvasRef.current?.setPointerCapture(e.pointerId);
  };

  const handleMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const p = getPoint(e);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    if (isEmpty) setIsEmpty(false);
  };

  const handleUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    setIsDrawing(false);
    canvasRef.current?.releasePointerCapture(e.pointerId);
    const dataUrl = canvasRef.current?.toDataURL('image/png');
    onChange?.(dataUrl || null);
  };

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setIsEmpty(true);
    onChange?.(null);
  };

  return (
    <div className={`rounded-lg border border-border bg-card ${className}`}>
      <div className="flex items-center justify-between border-b border-border px-3 py-2 text-xs">
        <span className="flex items-center gap-1 text-muted-foreground">
          <Pen className="h-3 w-3" />
          ลายเซ็นลูกค้า
        </span>
        {!isEmpty && (
          <button
            type="button"
            onClick={clear}
            className="flex items-center gap-1 rounded border border-border px-2 py-1 hover:bg-muted"
          >
            <Eraser className="h-3 w-3" />
            ล้าง
          </button>
        )}
      </div>
      <canvas
        ref={canvasRef}
        style={{ height, touchAction: 'none' }}
        className="block w-full cursor-crosshair bg-white"
        onPointerDown={handleDown}
        onPointerMove={handleMove}
        onPointerUp={handleUp}
        onPointerCancel={handleUp}
      />
    </div>
  );
}

/**
 * Convert a data: URL to a File. Used when uploading the signature
 * to Supabase Storage via the existing uploadGenericPhoto helper.
 */
export async function dataUrlToFile(dataUrl: string, filename: string): Promise<File> {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  return new File([blob], filename, { type: blob.type || 'image/png' });
}
