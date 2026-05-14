import { SiteHeader, SiteFooter } from '@/components/SiteShell'

const EFFECTIVE_DATE = 'May 14, 2026'

const SECTIONS = [
  {
    title: 'Data We Collect',
    body: `We do not collect, store, or retain any personal information. Uploaded course outline PDFs and Quest schedule screenshots are processed temporarily in memory solely to extract calendar dates and are immediately discarded after processing. We never write them to disk or a database.`,
  },
  {
    title: 'Claude API Key',
    body: `Your Claude API key is sent directly to the Anthropic API to process your files. QuestSync never stores, logs, or transmits your API key to any of our own servers.`,
  },
  {
    title: 'Google Calendar Access',
    body: `If you choose to connect Google Calendar, QuestSync requests permission solely to create calendar events on your behalf. We do not read your existing calendar data, store your Google credentials, or retain any tokens beyond your current session. You can revoke QuestSync's access at any time by visiting your Google Account permissions at myaccount.google.com/permissions.`,
  },
  {
    title: 'Third Parties',
    body: `We do not sell, share, or transmit your data to any third parties. The only external services used are the Anthropic API (for file parsing) and Google Calendar API (for event creation), both of which are used solely to provide the core functionality of the app.`,
  },
  {
    title: 'Cookies',
    body: `QuestSync does not use cookies or any tracking technologies.`,
  },
  {
    title: "Children's Privacy",
    body: `QuestSync is intended for university students and is not directed at children under 13.`,
  },
]

export function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-4 sm:px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-gray-900 mb-2">Privacy Policy</h1>
          <p className="text-sm text-gray-400">Effective date: {EFFECTIVE_DATE}</p>
        </div>

        <p className="text-gray-700 leading-relaxed mb-10">
          QuestSync is a tool that helps students import course deadlines and schedules into their calendar. We take your privacy seriously.
        </p>

        <div className="space-y-8">
          {SECTIONS.map(({ title, body }) => (
            <section key={title}>
              <h2 className="text-base font-bold text-gray-900 mb-2">{title}</h2>
              <p className="text-sm text-gray-600 leading-relaxed">{body}</p>
            </section>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-xs text-gray-400">
            If you have any questions about this policy, you can reach us via the{' '}
            <a href="https://github.com/rheaparmar1/QuestSync" target="_blank" rel="noreferrer" className="underline hover:text-gray-600">
              GitHub repository
            </a>.
          </p>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
