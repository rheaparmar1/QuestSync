import { Download, CalendarClock, AlertTriangle } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { AssessmentEvent, CourseSection } from '@/types'

const TYPE_COLORS: Record<string, string> = {
  exam: 'bg-red-100 text-red-700',
  midterm: 'bg-orange-100 text-orange-700',
  assignment: 'bg-blue-100 text-blue-700',
  quiz: 'bg-purple-100 text-purple-700',
  project: 'bg-teal-100 text-teal-700',
  lecture: 'bg-gray-100 text-gray-700',
  tutorial: 'bg-indigo-100 text-indigo-700',
}

function Badge({ type }: { type: string }) {
  return (
    <span className={cn('inline-block rounded px-2 py-0.5 text-xs font-medium capitalize', TYPE_COLORS[type] ?? 'bg-gray-100 text-gray-700')}>
      {type}
    </span>
  )
}

interface Props {
  events: AssessmentEvent[]
  sections: CourseSection[]
  includeLectures: boolean
  includeTutorials: boolean
  includeAssessments: boolean
  onToggleLectures: () => void
  onToggleTutorials: () => void
  onToggleAssessments: () => void
  onDownload: () => void
  downloading: boolean
}

export function ReviewStep({
  events,
  sections,
  includeLectures,
  includeTutorials,
  includeAssessments,
  onToggleLectures,
  onToggleTutorials,
  onToggleAssessments,
  onDownload,
  downloading,
}: Props) {
  const readyEvents = events.filter((e) => !e.is_tbd && e.date)
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
        <div className="flex flex-col sm:flex-row gap-4">
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
            <span className="text-sm font-medium">Exams / Midterms / Tests</span>
          </label>
        </div>
      </div>

      {/* Ready to add */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <CalendarClock className="h-5 w-5 text-uw-gold" />
          <h2 className="font-semibold text-gray-900">Ready to add</h2>
          <span className="ml-auto text-xs text-gray-500">
            {(includeAssessments ? readyEvents.length : 0) + visibleSections.length} item{(includeAssessments ? readyEvents.length : 0) + visibleSections.length !== 1 ? 's' : ''}
          </span>
        </div>

        {(includeAssessments ? readyEvents.length : 0) === 0 && visibleSections.length === 0 ? (
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
                {includeAssessments &&
                  readyEvents.map((ev, i) => (
                    <tr key={`ev-${i}`} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono font-semibold text-black">{ev.course_code}</td>
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
                    <td className="px-4 py-3 font-mono font-semibold text-black">{sec.course_code}</td>
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

      {/* Download */}
      <Button size="lg" className="w-full" onClick={onDownload} disabled={downloading || (!includeLectures && !includeTutorials && !includeAssessments)}>
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
    </div>
  )
}
