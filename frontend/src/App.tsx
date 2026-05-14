import { useState, useCallback, useEffect } from 'react'

const API = import.meta.env.VITE_API_URL ?? ''
import { ApiKeyStep } from '@/components/ApiKeyStep'
import { UploadStep } from '@/components/UploadStep'
import { ProcessingStep } from '@/components/ProcessingStep'
import { ReviewStep } from '@/components/ReviewStep'
import type { AssessmentEvent, CourseSection } from '@/types'

type Step = 'apikey' | 'upload' | 'processing' | 'review'

const STEP_LABELS = ['Upload', 'Processing', 'Review & Export']

function StepIndicator({ current }: { current: Step }) {
  const idx = current === 'upload' ? 0 : current === 'processing' ? 1 : 2
  return (
    <div className="flex items-center gap-2 mb-8">
      {STEP_LABELS.map((label, i) => (
        <div key={label} className="flex items-center gap-2">
          <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors ${i <= idx ? 'bg-uw-gold text-black' : 'bg-gray-200 text-gray-400'}`}>
            {i + 1}
          </div>
          <span className={`text-sm font-medium ${i <= idx ? 'text-gray-900' : 'text-gray-400'}`}>
            {label}
          </span>
          {i < STEP_LABELS.length - 1 && (
            <div className={`h-px w-6 ${i < idx ? 'bg-uw-gold' : 'bg-gray-200'}`} />
          )}
        </div>
      ))}
    </div>
  )
}

export default function App() {
  const [step, setStep] = useState<Step>('apikey')
  const [claudeKey, setClaudeKey] = useState('')
  const [processingMsg, setProcessingMsg] = useState('')

  const [outlines, setOutlines] = useState<File[]>([])
  const [schedule, setSchedule] = useState<File | null>(null)

  const [events, setEvents] = useState<AssessmentEvent[]>([])
  const [sections, setSections] = useState<CourseSection[]>([])

  const [includeLectures, setIncludeLectures] = useState(true)
  const [includeTutorials, setIncludeTutorials] = useState(true)
  const [includeAssessments, setIncludeAssessments] = useState(true)
  const [includeAssignments, setIncludeAssignments] = useState(true)
  const [colorCode, setColorCode] = useState(true)
  const [eventColors, setEventColors] = useState<Record<string, string>>({
    exam:       '#EF4444',
    midterm:    '#F97316',
    quiz:       '#A855F7',
    assignment: '#3B82F6',
    lecture:    '#9CA3AF',
    tutorial:   '#6366F1',
  })

  const [error, setError] = useState<string | null>(null)
  const [downloading, setDownloading] = useState(false)
  const [googleUploading, setGoogleUploading] = useState(false)
  const [googleCreated, setGoogleCreated] = useState<number | null>(null)
  const [googleCalendars, setGoogleCalendars] = useState<Array<{id: string, name: string, primary: boolean}> | null>(null)
  const [selectedCalendarId, setSelectedCalendarId] = useState('primary')

  // Detect OAuth callback redirect in popup and notify parent
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('google_auth') === '1' && window.opener) {
      window.opener.postMessage({ type: 'google_auth_complete' }, window.location.origin)
      window.close()
    }
  }, [])

  const handleSubmit = useCallback(async () => {
    setError(null)
    setStep('processing')

    const allEvents: AssessmentEvent[] = []
    const allSections: CourseSection[] = []

    try {
      for (let i = 0; i < outlines.length; i++) {
        if (i > 0) await new Promise((r) => setTimeout(r, 2000))
        setProcessingMsg(`Parsing outline ${i + 1} of ${outlines.length}…`)
        const form = new FormData()
        form.append('file', outlines[i])
        const res = await fetch(`${API}/parse-outline`, { method: 'POST', body: form, headers: { 'X-Claude-Key': claudeKey } })
        if (!res.ok) {
          const data = await res.json().catch(() => ({ detail: 'Unknown error' }))
          throw new Error(data.detail ?? `Failed to parse ${outlines[i].name}`)
        }
        const data = await res.json()
        allEvents.push(...(data.events ?? []))
      }

      if (schedule) {
        setProcessingMsg('Parsing Quest schedule…')
        const form = new FormData()
        form.append('file', schedule)
        const res = await fetch(`${API}/parse-schedule`, { method: 'POST', body: form, headers: { 'X-Claude-Key': claudeKey } })
        if (!res.ok) {
          const data = await res.json().catch(() => ({ detail: 'Unknown error' }))
          throw new Error(data.detail ?? 'Failed to parse schedule screenshot')
        }
        const data = await res.json()
        allSections.push(...(data.sections ?? []))
      }

      setEvents(allEvents)
      setSections(allSections)
      setStep('review')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
      setStep('upload')
    }
  }, [outlines, schedule, claudeKey])

  const handleDownload = useCallback(async () => {
    setDownloading(true)
    setError(null)
    try {
      const res = await fetch(`${API}/generate-ics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          events,
          sections,
          include_lectures: includeLectures,
          include_tutorials: includeTutorials,
          include_assessments: includeAssessments,
          include_assignments: includeAssignments,
          color_code: colorCode,
          custom_colors: colorCode ? eventColors : {},
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({ detail: 'Unknown error' }))
        throw new Error(data.detail ?? 'Failed to generate calendar')
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'uw-schedule.ics'
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Download failed. Please try again.')
    } finally {
      setDownloading(false)
    }
  }, [events, sections, includeLectures, includeTutorials, includeAssessments, includeAssignments, colorCode, eventColors])

  const handleGoogleConnect = useCallback(async () => {
    setGoogleUploading(true)
    setGoogleCreated(null)
    setError(null)
    try {
      const statusRes = await fetch(`${API}/auth/google/status`)
      const { authenticated } = await statusRes.json()

      if (!authenticated) {
        const popup = window.open(
          `${API || 'http://localhost:8000'}/auth/google`,
          'google_auth',
          'width=500,height=650,left=200,top=100',
        )
        if (!popup) throw new Error('Popup blocked — please allow popups for this site and try again.')
        await new Promise<void>((resolve, reject) => {
          const timer = setTimeout(() => {
            window.removeEventListener('message', handler)
            reject(new Error('Google authentication timed out.'))
          }, 300_000)
          function handler(e: MessageEvent) {
            if (e.data?.type === 'google_auth_complete') {
              clearTimeout(timer)
              window.removeEventListener('message', handler)
              resolve()
            }
          }
          window.addEventListener('message', handler)
        })
      }

      const calRes = await fetch(`${API}/auth/google/calendars`)
      if (!calRes.ok) throw new Error('Failed to fetch calendars')
      const { calendars } = await calRes.json()
      setGoogleCalendars(calendars)
      const primary = calendars.find((c: {primary: boolean}) => c.primary)
      if (primary) setSelectedCalendarId(primary.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google Calendar connection failed.')
    } finally {
      setGoogleUploading(false)
    }
  }, [])

  const handleGoogleUpload = useCallback(async () => {
    setGoogleUploading(true)
    setError(null)
    try {
      const res = await fetch(`${API}/upload-to-google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          events,
          sections,
          include_lectures: includeLectures,
          include_tutorials: includeTutorials,
          include_assessments: includeAssessments,
          include_assignments: includeAssignments,
          color_code: colorCode,
          custom_colors: colorCode ? eventColors : {},
          calendar_id: selectedCalendarId,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({ detail: 'Unknown error' }))
        throw new Error(data.detail ?? 'Failed to upload to Google Calendar')
      }
      const data = await res.json()
      setGoogleCreated(data.created)
      setGoogleCalendars(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google Calendar upload failed.')
    } finally {
      setGoogleUploading(false)
    }
  }, [events, sections, includeLectures, includeTutorials, includeAssessments, includeAssignments, colorCode, eventColors, selectedCalendarId])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-black text-white shadow-md">
        <div className="mx-auto max-w-3xl px-4 py-4 flex items-center gap-3">
          <img src="/logo.svg" alt="QuestSync" className="h-9 w-9 rounded-lg" />
          <div>
            <h1 className="text-lg font-bold leading-none">QuestSync</h1>
            <p className="text-xs text-gray-400 mt-0.5">University of Waterloo</p>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto max-w-3xl px-4 py-8">
        {step !== 'apikey' && <StepIndicator current={step} />}

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {step === 'apikey' && (
          <ApiKeyStep onSubmit={(key) => { setClaudeKey(key); setStep('upload') }} />
        )}

        {step === 'upload' && (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <UploadStep
              outlines={outlines}
              schedule={schedule}
              onOutlinesChange={setOutlines}
              onScheduleChange={setSchedule}
              onSubmit={handleSubmit}
            />
          </div>
        )}

        {step === 'processing' && (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <ProcessingStep message={processingMsg} />
          </div>
        )}

        {step === 'review' && (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold">Your Schedule</h2>
              <button
                onClick={() => setStep('upload')}
                className="text-sm text-gray-500 underline underline-offset-2 hover:text-gray-700"
              >
                ← Start over
              </button>
            </div>
            <ReviewStep
              events={events}
              sections={sections}
              includeLectures={includeLectures}
              includeTutorials={includeTutorials}
              includeAssessments={includeAssessments}
              colorCode={colorCode}
              includeAssignments={includeAssignments}
              eventColors={eventColors}
              onToggleLectures={() => setIncludeLectures((v) => !v)}
              onToggleTutorials={() => setIncludeTutorials((v) => !v)}
              onToggleAssessments={() => setIncludeAssessments((v) => !v)}
              onToggleAssignments={() => setIncludeAssignments((v) => !v)}
              onToggleColorCode={() => setColorCode((v) => !v)}
              onColorChange={(type, color) => setEventColors((prev) => ({ ...prev, [type]: color }))}
              onDownload={handleDownload}
              downloading={downloading}
              onGoogleConnect={handleGoogleConnect}
              onGoogleUpload={handleGoogleUpload}
              googleUploading={googleUploading}
              googleCreated={googleCreated}
              googleCalendars={googleCalendars}
              selectedCalendarId={selectedCalendarId}
              onSelectCalendar={setSelectedCalendarId}
            />
          </div>
        )}
      </main>

      <footer className="mt-12 pb-8 text-center text-xs text-gray-400">
        QuestSync — Built for University of Waterloo students
      </footer>
    </div>
  )
}
