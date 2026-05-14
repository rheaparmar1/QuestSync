import { useState, useRef } from 'react'
import { PlayCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const API = import.meta.env.VITE_API_URL ?? ''

const MOCK_ROWS = [
  { course: 'CS 240',   event: 'Midterm 1',            date: 'Jun 15', type: 'midterm',    color: '#F97316' },
  { course: 'MATH 239', event: 'Assignment 3',          date: 'Jun 22', type: 'assignment', color: '#3B82F6' },
  { course: 'STAT 231', event: 'Quiz 2',                date: 'Jul 8',  type: 'quiz',       color: '#A855F7' },
  { course: 'ECE 222',  event: 'Final Exam',            date: 'Aug 4',  type: 'exam',       color: '#EF4444' },
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
    desc: 'Drop all your course outline PDFs or HTML files and a screenshot of your Quest schedule. Everything in one go.',
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

const PAIN_POINTS = [
  'Manually copying deadlines from 5 different course outlines',
  'Missing hidden dates buried on page 8 of a PDF',
  'Re-entering the same class schedule every single term',
]

// Google Calendar logo SVG
function GCalLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <rect x="6" y="6" width="36" height="36" rx="4" fill="white"/>
      <path fill="#4285F4" d="M34 10H14a4 4 0 00-4 4v3h28v-3a4 4 0 00-4-4z"/>
      <rect x="10" y="17" width="28" height="21" rx="0" fill="white"/>
      <rect x="10" y="17" width="28" height="21" rx="0" fill="white"/>
      <path fill="#EA4335" d="M14 10h4v7h-4z"/>
      <path fill="#EA4335" d="M30 10h4v7h-4z"/>
      <text x="24" y="33" textAnchor="middle" fontSize="11" fontWeight="700" fill="#4285F4">24</text>
    </svg>
  )
}

interface Props {
  onSubmit: (key: string) => void
}

export function ApiKeyStep({ onSubmit }: Props) {
  const [key, setKey]               = useState('')
  const [show, setShow]             = useState(false)
  const [validating, setValidating] = useState(false)
  const [error, setError]           = useState<string | null>(null)
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

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <div className="text-center space-y-5 pt-2">
        <img src="/logo.svg" alt="QuestSync" className="h-14 w-14 rounded-2xl mx-auto" />
        <div className="space-y-3">
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 leading-tight tracking-tight">
            Never manually enter<br className="hidden sm:block" /> a deadline again.
          </h1>
          <p className="text-gray-700 text-base sm:text-lg max-w-xl mx-auto leading-relaxed font-normal">
            QuestSync reads your course outlines and Quest schedule, then exports every exam, quiz, assignment, and class time straight to your calendar — in minutes.
          </p>
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-1">
          <Button
            size="lg"
            className="px-8 shadow-sm hover:shadow-md transition-all duration-150"
            onClick={() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
          >
            Start syncing →
          </Button>
          <button
            onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
            className="inline-flex items-center justify-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 border border-gray-300 hover:border-gray-500 rounded-full px-5 py-2.5 transition-all duration-150 hover:bg-gray-50"
          >
            <PlayCircle className="h-4 w-4" />
            See how it works
          </button>
        </div>
      </div>

      {/* ── Pain points ───────────────────────────────────────────────── */}
      <div className="rounded-2xl bg-gray-950 text-white px-6 py-5 space-y-3">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Sound familiar?</p>
        <ul className="space-y-2.5">
          {PAIN_POINTS.map((p, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-gray-300">
              <span className="mt-0.5 text-gray-600 shrink-0">✗</span>
              {p}
            </li>
          ))}
        </ul>
        <p className="text-uw-gold font-bold text-sm pt-1">QuestSync handles all of it automatically.</p>
      </div>

      {/* ── Product preview ───────────────────────────────────────────── */}
      <div className="rounded-2xl border border-gray-200 shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
        {/* Browser chrome */}
        <div className="bg-gray-100 border-b border-gray-200 px-4 py-2.5 flex items-center gap-2">
          <div className="flex gap-1.5">
            <span className="h-3 w-3 rounded-full bg-red-400" />
            <span className="h-3 w-3 rounded-full bg-yellow-400" />
            <span className="h-3 w-3 rounded-full bg-green-400" />
          </div>
          <div className="flex-1 mx-3 rounded-md bg-white border border-gray-200 px-3 py-1 text-xs text-gray-400 text-center select-none">
            quest-sync.vercel.app
          </div>
        </div>

        {/* Mock app */}
        <div className="bg-white p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-800">Your Schedule</span>
            <span className="text-xs font-medium text-green-600 bg-green-50 border border-green-200 rounded-full px-2.5 py-0.5">
              ✓ 19 items extracted
            </span>
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
                  <tr key={i} className="bg-white hover:bg-gray-50 transition-colors duration-100">
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1.5">
                        <span className="inline-block h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: row.color }} />
                        <span className="font-mono font-bold text-gray-900">{row.course}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-gray-700">{row.event}</td>
                    <td className="px-3 py-2 text-gray-500 hidden sm:table-cell">{row.date}</td>
                    <td className="px-3 py-2">
                      <span className={cn('inline-block rounded-md px-2 py-0.5 font-medium capitalize', BADGE[row.type])}>
                        {row.type}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex gap-2 pt-1">
            <div className="h-9 flex-1 rounded-xl bg-uw-gold flex items-center justify-center gap-1.5 text-xs font-semibold text-black shadow-sm">
              ↓ Download .ics
            </div>
            <div className="h-9 flex-1 rounded-xl border border-gray-200 bg-white flex items-center justify-center gap-1.5 text-xs font-medium text-gray-600">
              <GCalLogo className="h-4 w-4" />
              Google Calendar
            </div>
          </div>
        </div>
      </div>

      {/* ── How it works ──────────────────────────────────────────────── */}
      <div id="how-it-works" className="space-y-5">
        <h2 className="text-xl font-bold text-gray-900 text-center">How it works</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {HOW.map((step) => (
            <div
              key={step.n}
              className="rounded-2xl border border-gray-100 bg-gray-50 p-6 space-y-3 hover:-translate-y-1 hover:shadow-md transition-all duration-200"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-uw-gold text-base font-black text-black shadow-sm">
                {step.n}
              </div>
              <p className="font-bold text-gray-900 text-sm">{step.title}</p>
              <p className="text-xs text-gray-500 leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── API key form ──────────────────────────────────────────────── */}
      <div ref={formRef} className="rounded-2xl border border-gray-200 bg-white shadow-sm p-6 space-y-4">
        <div className="space-y-1">
          <h3 className="font-bold text-gray-900 text-base">Connect Claude to continue</h3>
          <p className="text-sm text-gray-500 leading-relaxed">
            QuestSync uses Claude AI to extract assignments, exams, and deadlines from your outlines.
            Enter your{' '}
            <a
              href="https://console.anthropic.com"
              target="_blank"
              rel="noreferrer"
              className="text-gray-800 font-medium underline underline-offset-2 hover:text-black"
            >
              Claude API key
            </a>{' '}
            below to start syncing.
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
                error ? 'border-red-400 bg-red-50' : 'border-gray-300 hover:border-gray-400',
              )}
            />
            <button
              type="button"
              onClick={() => setShow((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-700 font-medium transition-colors"
            >
              {show ? 'Hide' : 'Show'}
            </button>
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>

        <Button
          size="lg"
          className="w-full shadow-sm hover:shadow-md transition-all duration-150"
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
