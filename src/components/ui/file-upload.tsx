"use client"

import * as React from "react"
import { Upload, X, FileText, Image as ImageIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export interface UploadedFile {
  /** Stable id used for diffing/removal */
  id: string
  file: File
  /** Object URL for previewing images — caller is responsible for revoking on unmount */
  previewUrl?: string
}

interface FileUploadProps {
  /** Controlled list of files; if omitted, the component manages its own list */
  value?: UploadedFile[]
  onChange?: (files: UploadedFile[]) => void

  /** Allow multiple files — defaults to true */
  multiple?: boolean
  /** MIME types — defaults to "image/*" */
  accept?: string
  /** Per-file size cap in bytes — defaults to 10 MB */
  maxSize?: number
  /** Total file count cap (enforced for multiple mode) */
  maxFiles?: number

  disabled?: boolean
  error?: boolean
  className?: string

  /** Label rendered inside the dropzone */
  label?: React.ReactNode
  /** Sub-text rendered below label */
  hint?: React.ReactNode
  /** Triggered when user attempts to add an oversized file */
  onSizeExceeded?: (file: File) => void
}

const DEFAULT_MAX = 10 * 1024 * 1024

function makeId(): string {
  return Math.random().toString(36).slice(2, 9)
}

function isImage(file: File): boolean {
  return file.type.startsWith("image/")
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export function FileUpload({
  value: controlledValue,
  onChange,
  multiple = true,
  accept = "image/*",
  maxSize = DEFAULT_MAX,
  maxFiles,
  disabled,
  error,
  className,
  label = "ลากและวางไฟล์ที่นี่ หรือคลิกเพื่อเลือก",
  hint,
  onSizeExceeded,
}: FileUploadProps) {
  const [uncontrolled, setUncontrolled] = React.useState<UploadedFile[]>([])
  const value = controlledValue ?? uncontrolled
  const [isDragging, setDragging] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const commit = React.useCallback(
    (next: UploadedFile[]) => {
      if (onChange) onChange(next)
      else setUncontrolled(next)
    },
    [onChange],
  )

  // Revoke object URLs when files leave the list (only for uncontrolled mode)
  React.useEffect(() => {
    if (controlledValue) return
    return () => {
      uncontrolled.forEach((u) => {
        if (u.previewUrl) URL.revokeObjectURL(u.previewUrl)
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function addFiles(list: FileList | File[]) {
    const incoming = Array.from(list)
    const accepted: UploadedFile[] = []
    for (const file of incoming) {
      if (file.size > maxSize) {
        onSizeExceeded?.(file)
        continue
      }
      accepted.push({
        id: makeId(),
        file,
        previewUrl: isImage(file) ? URL.createObjectURL(file) : undefined,
      })
    }
    let next = multiple ? [...value, ...accepted] : accepted.slice(0, 1)
    if (maxFiles && next.length > maxFiles) next = next.slice(0, maxFiles)
    commit(next)
  }

  function remove(id: string) {
    const removed = value.find((u) => u.id === id)
    if (removed?.previewUrl && !controlledValue) URL.revokeObjectURL(removed.previewUrl)
    commit(value.filter((u) => u.id !== id))
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    if (disabled) return
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files)
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    if (disabled) return
    const items = e.clipboardData?.items
    if (!items) return
    const files: File[] = []
    for (const item of Array.from(items)) {
      if (item.kind === "file") {
        const f = item.getAsFile()
        if (f) files.push(f)
      }
    }
    if (files.length > 0) addFiles(files)
  }

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div
        role="button"
        tabIndex={0}
        aria-disabled={disabled || undefined}
        onClick={() => !disabled && inputRef.current?.click()}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && !disabled) {
            e.preventDefault()
            inputRef.current?.click()
          }
        }}
        onDragOver={(e) => {
          e.preventDefault()
          if (!disabled) setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onPaste={handlePaste}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          isDragging
            ? "border-primary bg-primary/5"
            : error
              ? "border-destructive bg-destructive/5"
              : "border-border bg-muted/30 hover:bg-muted/50",
          disabled && "cursor-not-allowed opacity-50",
        )}
      >
        <Upload className="h-6 w-6 text-muted-foreground" />
        <div>
          <p className="text-sm font-medium">{label}</p>
          {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          className="sr-only"
          onChange={(e) => {
            if (e.target.files) addFiles(e.target.files)
            e.target.value = "" // allow re-selecting same file
          }}
        />
      </div>

      {value.length > 0 && (
        <ul
          className={cn(
            "grid gap-2",
            multiple ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4" : "grid-cols-1",
          )}
        >
          {value.map((f) => (
            <FilePreview key={f.id} file={f} onRemove={() => remove(f.id)} />
          ))}
        </ul>
      )}
    </div>
  )
}

function FilePreview({
  file,
  onRemove,
}: {
  file: UploadedFile
  onRemove: () => void
}) {
  return (
    <li className="group relative overflow-hidden rounded-xl border border-border bg-card">
      <div className="aspect-square w-full">
        {file.previewUrl ? (
          <img
            src={file.previewUrl}
            alt={file.file.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-muted text-muted-foreground">
            {isImage(file.file) ? (
              <ImageIcon className="h-8 w-8" />
            ) : (
              <FileText className="h-8 w-8" />
            )}
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white opacity-100 transition-opacity hover:bg-black/80 sm:opacity-0 sm:group-hover:opacity-100"
        aria-label={`ลบ ${file.file.name}`}
      >
        <X className="h-3.5 w-3.5" />
      </button>
      <div className="border-t border-border bg-card px-2 py-1.5">
        <p className="truncate text-[11px] font-medium" title={file.file.name}>
          {file.file.name}
        </p>
        <p className="text-[10px] text-muted-foreground">
          {formatBytes(file.file.size)}
        </p>
      </div>
    </li>
  )
}
