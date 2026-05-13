import { useCallback, useState } from 'react'
import { Upload, FileText, Image, X, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface DropZoneProps {
  label: string
  accept: string
  icon: React.ReactNode
  file: File | null
  onFile: (f: File) => void
  onClear: () => void
  hint: string
}

function DropZone({ label, accept, icon, file, onFile, onClear, hint }: DropZoneProps) {
  const [dragging, setDragging] = useState(false)

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragging(false)
      const dropped = e.dataTransfer.files[0]
      if (dropped) onFile(dropped)
    },
    [onFile],
  )

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={cn(
        'relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 transition-colors',
        dragging ? 'border-uw-gold bg-yellow-50' : 'border-gray-300 bg-white hover:border-gray-400',
        file && 'border-green-400 bg-green-50',
      )}
    >
      {file ? (
        <>
          <CheckCircle className="h-8 w-8 text-green-500" />
          <p className="text-sm font-medium text-green-700 text-center break-all max-w-xs">
            {file.name}
          </p>
          <button
            onClick={onClear}
            className="absolute top-2 right-2 p-1 rounded-full hover:bg-green-100 text-green-600"
          >
            <X className="h-4 w-4" />
          </button>
        </>
      ) : (
        <>
          <div className="text-gray-400">{icon}</div>
          <div className="text-center">
            <p className="font-medium text-gray-700">{label}</p>
            <p className="text-xs text-gray-500 mt-1">{hint}</p>
          </div>
          <label className="cursor-pointer">
            <span className="text-sm text-uw-black underline underline-offset-2 hover:text-yellow-600 font-medium">
              Browse file
            </span>
            <input
              type="file"
              accept={accept}
              className="sr-only"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f) }}
            />
          </label>
        </>
      )}
    </div>
  )
}

interface Props {
  outlines: File[]
  schedule: File | null
  onOutlinesChange: (files: File[]) => void
  onScheduleChange: (f: File | null) => void
  onSubmit: () => void
}

export function UploadStep({ outlines, schedule, onOutlinesChange, onScheduleChange, onSubmit }: Props) {
  const handleOutlineFile = useCallback(
    (f: File) => {
      onOutlinesChange([...outlines, f])
    },
    [outlines, onOutlinesChange],
  )

  const removeOutline = (idx: number) => {
    onOutlinesChange(outlines.filter((_, i) => i !== idx))
  }

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">Course Outlines</h2>
        <p className="text-sm text-gray-500">Upload one PDF per course. You can add multiple.</p>

        {outlines.length > 0 && (
          <ul className="space-y-2">
            {outlines.map((f, i) => (
              <li key={i} className="flex items-center justify-between rounded-lg border border-green-300 bg-green-50 px-4 py-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                  <span className="text-sm text-green-800 truncate max-w-xs">{f.name}</span>
                </div>
                <button onClick={() => removeOutline(i)} className="ml-2 text-green-600 hover:text-red-500">
                  <X className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}

        <DropZone
          label="Drop a course outline PDF here"
          accept=".pdf,application/pdf"
          icon={<FileText className="h-10 w-10" />}
          file={null}
          onFile={handleOutlineFile}
          onClear={() => {}}
          hint="PDF files only • drag & drop or browse"
        />
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">Quest Schedule Screenshot</h2>
        <p className="text-sm text-gray-500">Upload a screenshot of your Quest class schedule.</p>
        <DropZone
          label="Drop your Quest screenshot here"
          accept="image/*"
          icon={<Image className="h-10 w-10" />}
          file={schedule}
          onFile={onScheduleChange}
          onClear={() => onScheduleChange(null)}
          hint="PNG, JPG, or WEBP • drag & drop or browse"
        />
      </div>

      <Button
        size="lg"
        className="w-full"
        onClick={onSubmit}
        disabled={outlines.length === 0 && !schedule}
      >
        <Upload className="mr-2 h-5 w-5" />
        Parse My Schedule
      </Button>
    </div>
  )
}
