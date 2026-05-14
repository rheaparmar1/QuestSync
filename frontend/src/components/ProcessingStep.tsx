import { Loader2 } from 'lucide-react'

interface Props {
  message: string
}

export function ProcessingStep({ message }: Props) {
  return (
    <div className="flex flex-col items-center justify-center gap-6 py-16">
      <div className="relative">
        <div className="h-16 w-16 rounded-full border-4 border-gray-200" />
        <div className="absolute inset-0 h-16 w-16 rounded-full border-4 border-uw-gold border-t-transparent animate-spin" />
      </div>
      <div className="text-center space-y-1">
        <p className="font-semibold text-gray-800">{message}</p>
      </div>
    </div>
  )
}
