import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const API = import.meta.env.VITE_API_URL ?? ''

// ── Mini mock data for product preview ──────────────────────────────────────
const MOCK_ROWS = [
  { course: 'CS 240',   event: 'Midterm 1',      date: 'Jun 15',  type: 'midterm',    color: '#F97316' },
  { course: 'MATH 239', event: 'Assignment 3',   date: 'Jun 22',  type: 'assignment', color: '#3B82F6' },
  { course: 'STAT 231', event: 'Quiz 2',          date: 'Jul 8',   type: 'quiz',       color: '#A855F7' },
  { course: 'ECE 222',  event: 'Final Exam',      date: 'Aug 4',   type: 'exam',       color: '#EF4444' },
  { course: 'CS 240',   event: 'LEC 003 — Mon/Wed/Fri', date: '11:30–12:50', type: 'lecture', color: '#9CA3AF' },
]

const BADGE: Record<string, string> = {
  midterm:    'bg-orange-100 text-orange-700',
  assignment: 'bg-blue-100 text-blue-700',
  quiz:       'bg-purple-100 text-purple-700',
  exam:       'bg-red-100 text-red-700',
  lecture:    'bg-gray-100 text-gray-700',
}

const HOW = [
  {
    n: '1',
    title: 'Upload your outlines',
    desc: 'Drop all your course outline PDFs or HTML files and a screenshot of your Quest schedule. Everything at once.',
  },
  {
    n: '2',
    title: 'Review extracted dates',
    desc: 'Every exam, quiz, assignment, and class time is pulled out automatically. Toggle what you want to include.',
  },
  {
    n: '3',
    title: 'Export to your calendar',
    desc: 'Download a .ics file or sync directly to Google Calendar — colour-coded by type, with location and times.',
  },
]

interface Props {
  onSubmit: (key: string) => void
}

export function ApiKeyStep({ onSubmit }: Props) {
  const [key, setKey]           = useState('')
  const [show, setShow]         = useState(false)
  const [validating, setValidating] = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const formRef = useRef<HTMLDivElement>(null)

  const handleContinue = async () => {
    setValidating(true)
    setError(null)
    try {
      const res = await fetch(`${API}/validate-key`, {
        method: 'POST',
        headers: { 'X-Claude-Key': key.trim() },
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({ detail: 'Invalid key' }))
        setError(data.detail ?? 'Invalid API key. Please check and try again.')
        return
      }
      onSubmit(key.trim())
    } catch {
      setError('Could not reach the server. Please try again.')
    } finally {
      setValidating(false)
    }
  }

  return (
    <div className="space-y-10 pb-8">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div className="text-center space-y-4 pt-2">
        <img src="/logo.svg" alt="QuestSync" className="h-14 w-14 rounded-2xl mx-auto" />
        <h1 className="text-3xl sm:text-4xl font-black text-gray-900 leading-tight">
          Never manually enter<br className="hidden sm:block" /> a deadline again.
        </h1>
        <p className="text-gray-500 text-base max-w-md mx-auto leading-relaxed">
          QuestSync reads your course outlines and Quest schedule, then exports every exam, quiz, assignment, and class time straight to your calendar.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-1">
          <Button
            size="lg"
            className="px-8"
            onClick={() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
          >
            Start syncing →
          </Button>
          <button
            onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
            className="text-sm font-medium text-gray-500 hover:text-gray-800 underline underline-offset-4 transition-colors"
          >
            See how it works ↓
          </button>
        </div>
      </div>

      {/* ── Product preview ──────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-gray-200 shadow-md overflow-hidden">
        {/* Browser chrome */}
        <div className="bg-gray-100 border-b border-gray-200 px-4 py-2.5 flex items-center gap-2">
          <div className="flex gap-1.5">
            <span className="h-3 w-3 rounded-full bg-red-400" />
            <span className="h-3 w-3 rounded-full bg-yellow-400" />
            <span className="h-3 w-3 rounded-full bg-green-400" />
          </div>
          <div className="flex-1 mx-3 rounded-md bg-white border border-gray-200 px-3 py-1 text-xs text-gray-400 text-center">
            quest-sync.vercel.app
          </div>
        </div>
        {/* Mock app content */}
        <div className="bg-white p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-800">Your Schedule</span>
            <span className="text-xs text-gray-400">19 items extracted</span>
          </div>
          <div className="rounded-xl border border-gray-200 overflow-hidden">
            <table className="min-w-full text-xs">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-gray-500">Course</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-500">Event</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-500 hidden sm:table-cell">Date</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-500">Type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {MOCK_ROWS.map((row, i) => (
                  <tr key={i} className="bg-white">
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1.5">
                        <span className="inline-block h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: row.color }} />
                        <span className="font-mono font-semibold text-gray-900">{row.course}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-gray-700">{row.event}</td>
                    <td className="px-3 py-2 text-gray-500 hidden sm:table-cell">{row.date}</td>
                    <td className="px-3 py-2">
                      <span className={cn('inline-block rounded px-2 py-0.5 font-medium capitalize', BADGE[row.type])}>
                        {row.type}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex gap-2">
            <div className="h-8 flex-1 rounded-lg bg-uw-gold opacity-80 flex items-center justify-center text-xs font-semibold text-black">Download .ics</div>
            <div className="h-8 flex-1 rounded-lg border border-gray-200 bg-white flex items-center justify-center text-xs font-medium text-gray-600">Upload to Google Calendar</div>
          </div>
        </div>
      </div>

      {/* ── How it works ─────────────────────────────────────────────────── */}
      <div id="how-it-works" className="space-y-4">
        <h2 className="text-lg font-bold text-gray-900 text-center">How it works</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {HOW.map((step) => (
            <div key={step.n} className="rounded-2xl border border-gray-100 bg-gray-50 p-5 space-y-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-uw-gold text-sm font-black text-black">
                {step.n}
              </div>
              <p className="font-semibold text-gray-900 text-sm">{step.title}</p>
              <p className="text-xs text-gray-500 leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── API key form ─────────────────────────────────────────────────── */}
      <div ref={formRef} className="rounded-2xl border border-gray-200 bg-white shadow-sm p-6 space-y-4">
        <div className="space-y-1">
          <h3 className="font-bold text-gray-900">One quick thing to get started</h3>
          <p className="text-sm text-gray-500 leading-relaxed">
            QuestSync uses AI to read your course documents. Paste your{' '}
            <a href="https://console.anthropic.com" target="_blank" rel="noreferrer" className="underline hover:text-gray-800 font-medium">
              Claude API key
            </a>{' '}
            below — it costs less than $0.20 per session and takes 10 seconds to set up.
          </p>
        </div>

        <div className="space-y-2">
          <div className="relative">
            <input
              type={show ? 'text' : 'password'}
              value={key}
              onChange={(e) => { setKey(e.target.value); setError(null) }}
              onKeyDown={(e) => e.key === 'Enter' && key.startsWith('sk-') && handleContinue()}
              placeholder="sk-ant-..."
              className={cn(
                'w-full rounded-xl border px-4 py-3 pr-16 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-uw-gold transition-colors',
                error ? 'border-red-400 bg-red-50' : 'border-gray-300',
              )}
            />
            <button
              type="button"
              onClick={() => setShow((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-700 font-medium"
            >
              {show ? 'Hide' : 'Show'}
            </button>
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>

        <Button
          size="lg"
          className="w-full"
          disabled={!key.startsWith('sk-') || validating}
          onClick={handleContinue}
        >
          {validating ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 rounded-full border-2 border-black border-t-transparent animate-spin" />
              Checking key…
            </span>
          ) : 'Start syncing →'}
        </Button>

        <p className="text-center text-xs text-gray-400">
          🔒 Your API key is only used in this browser session and is never stored on our servers.
        </p>
      </div>

    </div>
  )
}
