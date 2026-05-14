import { Download, CalendarClock, AlertTriangle } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { AssessmentEvent, CourseSection } from '@/types'

const TYPE_BADGE: Record<string, string> = {
  exam: 'bg-red-100 text-red-700',
  midterm: 'bg-orange-100 text-orange-700',
  assignment: 'bg-blue-100 text-blue-700',
  project: 'bg-blue-100 text-blue-700',
  quiz: 'bg-purple-100 text-purple-700',
  lecture: 'bg-gray-100 text-gray-700',
  tutorial: 'bg-indigo-100 text-indigo-700',
}

const LEGEND_ITEMS = [
  { type: 'exam', label: 'Exam' },
  { type: 'midterm', label: 'Midterm' },
  { type: 'quiz', label: 'Quiz' },
  { type: 'assignment', label: 'Assignment' },
  { type: 'lecture', label: 'Lecture' },
  { type: 'tutorial', label: 'Tutorial' },
]

function Badge({ type }: { type: string }) {
  const key = type === 'project' ? 'assignment' : type
  return (
    <span className={cn('inline-block rounded px-2 py-0.5 text-xs font-medium capitalize', TYPE_BADGE[key] ?? 'bg-gray-100 text-gray-700')}>
      {type}
    </span>
  )
}

interface GoogleCalendar { id: string; name: string; primary: boolean }

interface Props {
  events: AssessmentEvent[]
  sections: CourseSection[]
  includeLectures: boolean
  includeTutorials: boolean
  includeAssessments: boolean
  includeAssignments: boolean
  colorCode: boolean
  eventColors: Record<string, string>
  onToggleLectures: () => void
  onToggleTutorials: () => void
  onToggleAssessments: () => void
  onToggleAssignments: () => void
  onToggleColorCode: () => void
  onColorChange: (type: string, color: string) => void
  onDownload: () => void
  downloading: boolean
  onGoogleConnect: () => void
  onGoogleUpload: () => void
  googleUploading: boolean
  googleCreated: number | null
  googleCalendars: GoogleCalendar[] | null
  selectedCalendarId: string
  onSelectCalendar: (id: string) => void
}

export function ReviewStep({
  events,
  sections,
  includeLectures,
  includeTutorials,
  includeAssessments,
  includeAssignments,
  colorCode,
  eventColors,
  onToggleLectures,
  onToggleTutorials,
  onToggleAssessments,
  onToggleAssignments,
  onToggleColorCode,
  onColorChange,
  onDownload,
  downloading,
  onGoogleConnect,
  onGoogleUpload,
  googleUploading,
  googleCreated,
  googleCalendars,
  selectedCalendarId,
  onSelectCalendar,
}: Props) {
  const EXAM_TYPES = new Set(['exam', 'midterm', 'quiz'])
  const ASSIGN_TYPES = new Set(['assignment', 'project'])

  const readyEvents = events.filter((e) => {
    if (e.is_tbd || !e.date) return false
    if (EXAM_TYPES.has(e.type) && !includeAssessments) return false
    if (ASSIGN_TYPES.has(e.type) && !includeAssignments) return false
    return true
  })
  const tbdEvents = events.filter((e) => e.is_tbd)

  const visibleSections = sections.filter(
    (s) =>
      (s.type === 'lecture' && includeLectures) ||
      (s.type === 'tutorial' && includeTutorials),
  )

  return (
    <div className="space-y-8">
      {/* Toggles */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
        <h2 className="font-semibold text-gray-900">Include in calendar</h2>
        <div className="flex flex-col sm:flex-row flex-wrap gap-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <Switch checked={includeLectures} onCheckedChange={onToggleLectures} />
            <span className="text-sm font-medium">Lectures</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <Switch checked={includeTutorials} onCheckedChange={onToggleTutorials} />
            <span className="text-sm font-medium">Tutorials</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <Switch checked={includeAssessments} onCheckedChange={onToggleAssessments} />
            <span className="text-sm font-medium">Exams / Midterms / Quizzes</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <Switch checked={includeAssignments} onCheckedChange={onToggleAssignments} />
            <span className="text-sm font-medium">Assignments</span>
          </label>
        </div>

        <div className="border-t border-gray-100 pt-4 space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <Switch checked={colorCode} onCheckedChange={onToggleColorCode} />
            <span className="text-sm font-medium">Color code events by type</span>
          </label>
          {colorCode && (
            <div className="flex flex-wrap gap-4 pl-1">
              {LEGEND_ITEMS.map(({ type, label }) => (
                <label key={type} className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
                  <span className="relative inline-block h-5 w-5 rounded-full border border-gray-300 shrink-0" style={{ backgroundColor: eventColors[type] }}>
                    <input
                      type="color"
                      value={eventColors[type]}
                      onChange={(e) => onColorChange(type, e.target.value)}
                      className="absolute inset-0 opacity-0 w-full h-full cursor-pointer rounded-full"
                    />
                  </span>
                  {label}
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Ready to add */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <CalendarClock className="h-5 w-5 text-uw-gold" />
          <h2 className="font-semibold text-gray-900">Ready to add</h2>
          <span className="ml-auto text-xs text-gray-500">
            {readyEvents.length + visibleSections.length} item{readyEvents.length + visibleSections.length !== 1 ? 's' : ''}
          </span>
        </div>

        {readyEvents.length === 0 && visibleSections.length === 0 ? (
          <p className="text-sm text-gray-500 italic">No events to show with current filters.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200 bg-white text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Course</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Event / Details</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Date / Time</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {readyEvents.map((ev, i) => (
                    <tr key={`ev-${i}`} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {colorCode && <span className="shrink-0 inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: eventColors[ev.type === 'project' ? 'assignment' : ev.type] ?? '#9CA3AF' }} />}
                          <span className="font-mono font-semibold text-black">{ev.course_code}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-800">
                        <div>{ev.event_name}</div>
                        {ev.location && <div className="text-xs text-gray-400 mt-0.5">{ev.location}</div>}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        <div>{ev.date}</div>
                        {ev.start_time && (
                          <div className="text-xs text-gray-400 mt-0.5">
                            {ev.start_time}{ev.end_time ? `–${ev.end_time}` : ''}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3"><Badge type={ev.type} /></td>
                    </tr>
                ))}
                {visibleSections.map((sec, i) => (
                  <tr key={`sec-${i}`} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {colorCode && <span className="shrink-0 inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: eventColors[sec.type] ?? '#9CA3AF' }} />}
                        <span className="font-mono font-semibold text-black">{sec.course_code}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-800">
                      <div>{sec.type === 'lecture' ? 'LEC' : 'TUT'} {sec.section} — {sec.days.join(', ')}</div>
                      <div className="text-xs text-gray-400 mt-0.5 space-x-2">
                        {sec.location && <span>{sec.location}</span>}
                        {sec.professor && <span>· {sec.professor}</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {sec.start_time}–{sec.end_time}
                    </td>
                    <td className="px-4 py-3"><Badge type={sec.type} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* TBD Dates */}
      {tbdEvents.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <h2 className="font-semibold text-gray-900">TBD Dates</h2>
            <span className="ml-auto text-xs text-gray-500">{tbdEvents.length} item{tbdEvents.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-2">
            <p className="text-xs text-amber-700 mb-3">
              These dates weren't found in your outlines. Check with your professor or course page and add them manually.
            </p>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-amber-200 text-sm">
                <thead>
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-amber-800">Course</th>
                    <th className="px-3 py-2 text-left font-medium text-amber-800">Event</th>
                    <th className="px-3 py-2 text-left font-medium text-amber-800">Type</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-100">
                  {tbdEvents.map((ev, i) => (
                    <tr key={i}>
                      <td className="px-3 py-2 font-mono font-semibold text-black">{ev.course_code}</td>
                      <td className="px-3 py-2 text-amber-900">{ev.event_name}</td>
                      <td className="px-3 py-2"><Badge type={ev.type} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Export buttons */}
      <div className="space-y-3">
        <Button size="lg" className="w-full" onClick={onDownload} disabled={downloading || (!includeLectures && !includeTutorials && !includeAssessments && !includeAssignments)}>
          {downloading ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 rounded-full border-2 border-black border-t-transparent animate-spin" />
              Generating…
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Download .ics Calendar
            </span>
          )}
        </Button>

        {googleCreated !== null ? (
          <div className="flex items-center justify-center gap-2 rounded-md border border-green-200 bg-green-50 h-12 px-8 text-green-700 font-medium text-sm">
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" /></svg>
            {googleCreated} event{googleCreated !== 1 ? 's' : ''} added to Google Calendar
          </div>
        ) : googleCalendars !== null ? (
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-3">
            <p className="text-sm font-medium text-gray-700">Select a calendar</p>
            <select
              value={selectedCalendarId}
              onChange={(e) => onSelectCalendar(e.target.value)}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-uw-gold"
            >
              {googleCalendars.map((cal) => (
                <option key={cal.id} value={cal.id}>
                  {cal.name}{cal.primary ? ' (primary)' : ''}
                </option>
              ))}
            </select>
            <button
              onClick={onGoogleUpload}
              disabled={googleUploading}
              className="w-full flex items-center justify-center gap-2 rounded-md h-10 px-6 text-sm font-medium border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none transition-colors text-gray-700"
            >
              {googleUploading ? (
                <>
                  <span className="h-4 w-4 rounded-full border-2 border-gray-400 border-t-transparent animate-spin" />
                  Uploading…
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" viewBox="0 0 48 48">
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.16 7.09-10.36 7.09-17.65z"/>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                  </svg>
                  Add to Google Calendar
                </>
              )}
            </button>
          </div>
        ) : (
          <button
            onClick={onGoogleConnect}
            disabled={googleUploading || (!includeLectures && !includeTutorials && !includeAssessments && !includeAssignments)}
            className="w-full flex items-center justify-center gap-3 rounded-md h-12 px-8 text-base font-medium border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none transition-colors text-gray-700"
          >
            {googleUploading ? (
              <>
                <span className="h-4 w-4 rounded-full border-2 border-gray-400 border-t-transparent animate-spin" />
                Connecting…
              </>
            ) : (
              <>
                <svg className="h-5 w-5" viewBox="0 0 48 48">
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.16 7.09-10.36 7.09-17.65z"/>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                </svg>
                Upload to Google Calendar
              </>
            )}
          </button>
        )}
      </div>
    </div>
  )
}
