export function SiteHeader() {
  return (
    <header className="bg-black text-white shadow-md">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-4 flex items-center gap-3">
        <a href="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
          <img src="/logo.svg" alt="QuestSync" className="h-9 w-9 rounded-lg" />
          <div>
            <p className="text-lg font-bold leading-none">QuestSync</p>
            <p className="text-xs text-gray-400 mt-0.5">University of Waterloo</p>
          </div>
        </a>
      </div>
    </header>
  )
}

export function SiteFooter() {
  return (
    <footer className="mt-12 pb-8 text-center text-xs text-gray-400 space-x-1">
      <span>QuestSync — Built for University of Waterloo students</span>
      <span>·</span>
      <a href="/privacy" className="underline underline-offset-2 hover:text-gray-700 transition-colors">Privacy</a>
      <span>·</span>
      <a href="/terms" className="underline underline-offset-2 hover:text-gray-700 transition-colors">Terms</a>
    </footer>
  )
}
