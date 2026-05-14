import { Download, CalendarClock, Clock } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { AssessmentEvent, CourseSection } from '@/types'

// ── Styles ──────────────────────────────────────────────────────────────────
const BADGE_STYLE: Record<string, string> = {
  exam:       'bg-red-50 text-red-700 ring-1 ring-red-200',
  midterm:    'bg-orange-50 text-orange-700 ring-1 ring-orange-200',
  assignment: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
  project:    'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
  quiz:       'bg-purple-50 text-purple-700 ring-1 ring-purple-200',
  lecture:    'bg-gray-100 text-gray-600 ring-1 ring-gray-200',
  tutorial:   'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200',
}

const LEGEND_ITEMS = [
  { type: 'exam',       label: 'Exam' },
  { type: 'midterm',    label: 'Midterm' },
  { type: 'quiz',       label: 'Quiz' },
  { type: 'assignment', label: 'Assignment' },
  { type: 'lecture',    label: 'Lecture' },
  { type: 'tutorial',   label: 'Tutorial' },
]

const STAT_LABELS: Record<string, string> = {
  exam: 'Exam', midterm: 'Midterm', quiz: 'Quiz',
  assignment: 'Assignment', lecture: 'Class', tutorial: 'Tutorial',
}

// ── Sub-components ───────────────────────────────────────────────────────────
function Badge({ type }: { type: string }) {
  const key = type === 'project' ? 'assignment' : type
  const label = type === 'project' ? 'assignment' : type
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize', BADGE_STYLE[key] ?? 'bg-gray-100 text-gray-600 ring-1 ring-gray-200')}>
      {label}
    </span>
  )
}

function GIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.16 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  )
}

// ── Types ────────────────────────────────────────────────────────────────────
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

// ── Main component ───────────────────────────────────────────────────────────
export function ReviewStep({
  events, sections,
  includeLectures, includeTutorials, includeAssessments, includeAssignments,
  colorCode, eventColors,
  onToggleLectures, onToggleTutorials, onToggleAssessments, onToggleAssignments,
  onToggleColorCode, onColorChange,
  onDownload, downloading,
  onGoogleConnect, onGoogleUpload, googleUploading, googleCreated,
  googleCalendars, selectedCalendarId, onSelectCalendar,
}: Props) {
  const EXAM_TYPES   = new Set(['exam', 'midterm', 'quiz'])
  const ASSIGN_TYPES = new Set(['assignment', 'project'])

  const hasLectures    = sections.some(s => s.type === 'lecture')
  const hasTutorials   = sections.some(s => s.type === 'tutorial')
  const hasExams       = events.some(e => EXAM_TYPES.has(e.type))
  const hasAssignments = events.some(e => ASSIGN_TYPES.has(e.type))
  const presentColorTypes = new Set<string>([
    ...events.map(e => e.type === 'project' ? 'assignment' : e.type),
    ...sections.map(s => s.type),
  ])

  const readyEvents = events.filter(e => {
    if (e.is_tbd || !e.date) return false
    if (EXAM_TYPES.has(e.type)   && !includeAssessments) return false
    if (ASSIGN_TYPES.has(e.type) && !includeAssignments) return false
    return true
  })
  const tbdEvents = events.filter(e => e.is_tbd)
  const visibleSections = sections.filter(s =>
    (s.type === 'lecture'  && includeLectures) ||
    (s.type === 'tutorial' && includeTutorials),
  )

  const totalItems = readyEvents.length + visibleSections.length
  const allOff = !includeLectures && !includeTutorials && !includeAssessments && !includeAssignments

  // Summary stats per type
  const statCounts: Record<string, number> = {}
  readyEvents.forEach(e => {
    const key = ASSIGN_TYPES.has(e.type) ? 'assignment' : e.type
    statCounts[key] = (statCounts[key] ?? 0) + 1
  })
  visibleSections.forEach(s => {
    const key = s.type === 'tutorial' ? 'tutorial' : 'lecture'
    statCounts[key] = (statCounts[key] ?? 0) + 1
  })

  return (
    <div className="space-y-6">

      {/* ── Settings ──────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-gray-100 bg-gray-50 p-5 space-y-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Filters</p>
        <div className="flex flex-wrap gap-x-6 gap-y-3">
          {hasLectures && (
            <label className="flex items-center gap-2.5 cursor-pointer">
              <Switch checked={includeLectures} onCheckedChange={onToggleLectures} />
              <span className="text-sm font-medium text-gray-700">Lectures</span>
            </label>
          )}
          {hasTutorials && (
            <label className="flex items-center gap-2.5 cursor-pointer">
              <Switch checked={includeTutorials} onCheckedChange={onToggleTutorials} />
              <span className="text-sm font-medium text-gray-700">Tutorials</span>
            </label>
          )}
          {hasExams && (
            <label className="flex items-center gap-2.5 cursor-pointer">
              <Switch checked={includeAssessments} onCheckedChange={onToggleAssessments} />
              <span className="text-sm font-medium text-gray-700">Exams / Midterms / Quizzes</span>
            </label>
          )}
          {hasAssignments && (
            <label className="flex items-center gap-2.5 cursor-pointer">
              <Switch checked={includeAssignments} onCheckedChange={onToggleAssignments} />
              <span className="text-sm font-medium text-gray-700">Assignments</span>
            </label>
          )}
        </div>

        <div className="border-t border-gray-200 pt-3 space-y-3">
          <label className="flex items-center gap-2.5 cursor-pointer">
            <Switch checked={colorCode} onCheckedChange={onToggleColorCode} />
            <span className="text-sm font-medium text-gray-700">Color code by type</span>
          </label>
          {colorCode && (
            <div className="flex flex-wrap gap-3 pl-1">
              {LEGEND_ITEMS.filter(({ type }) => presentColorTypes.has(type)).map(({ type, label }) => (
                <label key={type} className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer hover:text-gray-700 transition-colors">
                  <span className="relative inline-block h-5 w-5 rounded-full border border-gray-200 shrink-0 shadow-sm" style={{ backgroundColor: eventColors[type] }}>
                    <input type="color" value={eventColors[type]} onChange={e => onColorChange(type, e.target.value)}
                      className="absolute inset-0 opacity-0 w-full h-full cursor-pointer rounded-full" />
                  </span>
                  {label}
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Ready to add ──────────────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <CalendarClock className="h-5 w-5 text-uw-gold" />
          <h2 className="font-bold text-gray-900">Ready to add</h2>
          <span className="ml-auto text-sm font-semibold text-gray-500">{totalItems} item{totalItems !== 1 ? 's' : ''}</span>
        </div>

        {/* Summary stat chips */}
        {totalItems > 0 && (
          <div className="flex flex-wrap gap-2">
            {Object.entries(statCounts).map(([type, count]) => (
              <span key={type} className="inline-flex items-center gap-1.5 rounded-full bg-white border border-gray-200 px-3 py-1 text-xs font-medium text-gray-600 shadow-sm">
                <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: eventColors[type] ?? '#9CA3AF' }} />
                {count} {STAT_LABELS[type] ?? type}{count !== 1 ? 's' : ''}
              </span>
            ))}
          </div>
        )}

        {totalItems === 0 ? (
          <p className="text-sm text-gray-400 italic py-4 text-center">No events match your current filters.</p>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden sm:block rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
              <table className="min-w-full bg-white text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Course</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Event</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Date / Time</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Type</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {readyEvents.map((ev, i) => (
                    <tr key={`ev-${i}`} className={cn('transition-colors duration-100 hover:bg-yellow-50/40', i % 2 === 1 && 'bg-gray-50/40')}>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          {colorCode && <span className="shrink-0 h-2.5 w-2.5 rounded-full" style={{ backgroundColor: eventColors[ev.type === 'project' ? 'assignment' : ev.type] ?? '#9CA3AF' }} />}
                          <span className="font-mono font-bold text-gray-900 text-xs">{ev.course_code}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-gray-800">{ev.event_name}</p>
                        {ev.location && <p className="text-xs text-gray-400 mt-0.5">{ev.location}</p>}
                      </td>
                      <td className="px-5 py-3.5 text-gray-600">
                        <p>{ev.date}</p>
                        {ev.start_time && <p className="text-xs text-gray-400 mt-0.5">{ev.start_time}{ev.end_time ? `–${ev.end_time}` : ''}</p>}
                      </td>
                      <td className="px-5 py-3.5"><Badge type={ev.type} /></td>
                    </tr>
                  ))}
                  {visibleSections.map((sec, i) => (
                    <tr key={`sec-${i}`} className={cn('transition-colors duration-100 hover:bg-yellow-50/40', (readyEvents.length + i) % 2 === 1 && 'bg-gray-50/40')}>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          {colorCode && <span className="shrink-0 h-2.5 w-2.5 rounded-full" style={{ backgroundColor: eventColors[sec.type] ?? '#9CA3AF' }} />}
                          <span className="font-mono font-bold text-gray-900 text-xs">{sec.course_code}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-gray-800">{sec.type === 'lecture' ? 'LEC' : 'TUT'} {sec.section} — {sec.days.join(', ')}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{sec.location}{sec.professor ? ` · ${sec.professor}` : ''}</p>
                      </td>
                      <td className="px-5 py-3.5 text-gray-600">
                        <p>{sec.start_time}–{sec.end_time}</p>
                      </td>
                      <td className="px-5 py-3.5"><Badge type={sec.type} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile card list */}
            <div className="flex flex-col gap-3 sm:hidden">
              {readyEvents.map((ev, i) => (
                <div key={`mev-${i}`} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm space-y-2 hover:shadow-md transition-shadow duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {colorCode && <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: eventColors[ev.type === 'project' ? 'assignment' : ev.type] ?? '#9CA3AF' }} />}
                      <span className="font-mono font-bold text-gray-900 text-xs">{ev.course_code}</span>
                    </div>
                    <Badge type={ev.type} />
                  </div>
                  <p className="font-medium text-gray-800 text-sm">{ev.event_name}</p>
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    {ev.date && <span>{ev.date}</span>}
                    {ev.start_time && <span>{ev.start_time}{ev.end_time ? `–${ev.end_time}` : ''}</span>}
                    {ev.location && <span>{ev.location}</span>}
                  </div>
                </div>
              ))}
              {visibleSections.map((sec, i) => (
                <div key={`msec-${i}`} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm space-y-2 hover:shadow-md transition-shadow duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {colorCode && <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: eventColors[sec.type] ?? '#9CA3AF' }} />}
                      <span className="font-mono font-bold text-gray-900 text-xs">{sec.course_code}</span>
                    </div>
                    <Badge type={sec.type} />
                  </div>
                  <p className="font-medium text-gray-800 text-sm">{sec.type === 'lecture' ? 'LEC' : 'TUT'} {sec.section} — {sec.days.join(', ')}</p>
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span>{sec.start_time}–{sec.end_time}</span>
                    {sec.location && <span>{sec.location}</span>}
                    {sec.professor && <span>{sec.professor}</span>}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── Dates still pending ───────────────────────────────────────── */}
      {tbdEvents.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-500" />
            <h2 className="font-bold text-gray-900">Dates still pending</h2>
            <span className="ml-auto text-sm text-gray-400">{tbdEvents.length} unresolved item{tbdEvents.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="rounded-2xl border border-amber-100 bg-amber-50/60 p-5 space-y-4">
            <p className="text-sm text-amber-700 leading-relaxed">
              These items were marked TBD or missing in your outline. Check with your professor or course page and add them manually when available.
            </p>
            <div className="flex flex-col gap-2">
              {tbdEvents.map((ev, i) => (
                <div key={i} className="flex items-center justify-between rounded-xl bg-white border border-amber-100 px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-xs text-gray-900">{ev.course_code}</span>
                    <span className="text-sm text-gray-700">{ev.event_name}</span>
                  </div>
                  <Badge type={ev.type} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Export ────────────────────────────────────────────────────── */}
      <div className="space-y-3 pt-2">
        <Button
          size="lg"
          className="w-full h-14 text-base shadow-md hover:shadow-lg transition-all duration-150"
          onClick={onDownload}
          disabled={downloading || allOff}
        >
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
          <div className="flex items-center justify-center gap-2 rounded-2xl border border-green-200 bg-green-50 h-14 px-6 text-green-700 font-semibold text-sm shadow-sm">
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
            </svg>
            {googleCreated} event{googleCreated !== 1 ? 's' : ''} added to Google Calendar
          </div>
        ) : googleCalendars !== null ? (
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5 space-y-3">
            <p className="text-sm font-semibold text-gray-700">Select a calendar</p>
            <select
              value={selectedCalendarId}
              onChange={e => onSelectCalendar(e.target.value)}
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-uw-gold transition-shadow"
            >
              {googleCalendars.map(cal => (
                <option key={cal.id} value={cal.id}>{cal.name}{cal.primary ? ' (primary)' : ''}</option>
              ))}
            </select>
            <button
              onClick={onGoogleUpload}
              disabled={googleUploading}
              className="w-full flex items-center justify-center gap-2 rounded-xl h-12 px-6 text-sm font-medium border border-gray-300 bg-white hover:bg-gray-50 hover:shadow-md disabled:opacity-50 disabled:pointer-events-none transition-all duration-150 text-gray-700"
            >
              {googleUploading ? (
                <><span className="h-4 w-4 rounded-full border-2 border-gray-400 border-t-transparent animate-spin" />Uploading…</>
              ) : (
                <><GIcon className="h-4 w-4" />Add to Google Calendar</>
              )}
            </button>
          </div>
        ) : (
          <button
            onClick={onGoogleConnect}
            disabled={googleUploading || allOff}
            className="w-full flex items-center justify-center gap-3 rounded-2xl h-14 px-8 text-base font-medium border border-gray-200 bg-white hover:bg-gray-50 hover:shadow-md disabled:opacity-50 disabled:pointer-events-none transition-all duration-150 text-gray-700 shadow-sm"
          >
            {googleUploading ? (
              <><span className="h-4 w-4 rounded-full border-2 border-gray-400 border-t-transparent animate-spin" />Connecting…</>
            ) : (
              <><GIcon className="h-5 w-5" />Upload to Google Calendar</>
            )}
          </button>
        )}
      </div>
    </div>
  )
}
