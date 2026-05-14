import { useState } from 'react'
import { Key } from 'lucide-react'
import { Button } from '@/components/ui/button'

const API = import.meta.env.VITE_API_URL ?? ''

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
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-uw-gold">
          <Key className="h-5 w-5 text-black" />
        </div>
        <div>
          <h2 className="text-lg font-bold">Enter your Claude API key</h2>
          <p className="text-sm text-gray-500">Your key is used only for this session and never stored.</p>
        </div>
      </div>

      <div className="space-y-2">
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
        <p className="text-xs text-gray-400">
          Get a key at{' '}
          <a href="https://console.anthropic.com" target="_blank" rel="noreferrer" className="underline hover:text-gray-600">
            console.anthropic.com
          </a>
          . You need at least $1 in credits.
        </p>
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
            Validating…
          </span>
        ) : 'Continue'}
      </Button>
    </div>
  )
}
