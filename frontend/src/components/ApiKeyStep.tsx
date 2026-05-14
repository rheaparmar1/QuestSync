import { useState } from 'react'
import { Upload, Sparkles, CalendarCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'

const API = import.meta.env.VITE_API_URL ?? ''

const STEPS = [
  {
    icon: <Upload className="h-5 w-5 text-black" />,
    title: 'Upload your outlines',
    desc: 'Drop all your course outline PDFs or HTML files and your Quest schedule screenshot.',
  },
  {
    icon: <Sparkles className="h-5 w-5 text-black" />,
    title: 'Claude reads everything',
    desc: 'Claude AI extracts every exam, midterm, quiz, assignment, and class time automatically.',
  },
  {
    icon: <CalendarCheck className="h-5 w-5 text-black" />,
    title: 'Export to your calendar',
    desc: 'Download a .ics file or upload directly to Google Calendar — colour coded by type.',
  },
]

interface Props {
  onSubmit: (key: string) => void
}

export function ApiKeyStep({ onSubmit }: Props) {
  const [key, setKey] = useState('')
  const [show, setShow] = useState(false)
  const [validating, setValidating] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
    <div className="space-y-8">
      {/* Hero */}
      <div className="text-center space-y-2">
        <div className="flex justify-center mb-3">
          <img src="/logo.svg" alt="QuestSync" className="h-14 w-14 rounded-2xl" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Welcome to QuestSync</h1>
        <p className="text-gray-500 text-sm max-w-sm mx-auto">
          The fastest way to get your University of Waterloo courses into your calendar.
        </p>
      </div>

      {/* How it works */}
      <div className="space-y-3">
        {STEPS.map((step, i) => (
          <div key={i} className="flex items-start gap-4 rounded-xl bg-gray-50 border border-gray-100 px-4 py-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-uw-gold">
              {step.icon}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">{step.title}</p>
              <p className="text-xs text-gray-500 mt-0.5">{step.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* API key input */}
      <div className="space-y-3 rounded-xl border border-gray-200 bg-white p-5">
        <div>
          <p className="text-sm font-semibold text-gray-900">Enter your Claude API key to get started</p>
          <p className="text-xs text-gray-400 mt-0.5">
            QuestSync uses Claude AI to read your documents. Your key is used only for this session and never stored.{' '}
            <a href="https://console.anthropic.com" target="_blank" rel="noreferrer" className="underline hover:text-gray-600">
              Get a key
            </a>
            {' '}— you need at least $1 in credits (~10 sessions).
          </p>
        </div>
        <div className="relative">
          <input
            type={show ? 'text' : 'password'}
            value={key}
            onChange={(e) => { setKey(e.target.value); setError(null) }}
            onKeyDown={(e) => e.key === 'Enter' && key.startsWith('sk-') && handleContinue()}
            placeholder="sk-ant-..."
            className={`w-full rounded-xl border px-4 py-3 pr-20 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-uw-gold ${error ? 'border-red-400' : 'border-gray-300'}`}
          />
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600"
          >
            {show ? 'Hide' : 'Show'}
          </button>
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
        <Button
          size="lg"
          className="w-full"
          disabled={!key.startsWith('sk-') || validating}
          onClick={handleContinue}
        >
          {validating ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 rounded-full border-2 border-black border-t-transparent animate-spin" />
              Validating…
            </span>
          ) : 'Get Started →'}
        </Button>
      </div>
    </div>
  )
}
