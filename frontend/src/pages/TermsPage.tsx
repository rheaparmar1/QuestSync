import { SiteHeader, SiteFooter } from '@/components/SiteShell'

const EFFECTIVE_DATE = 'May 14, 2026'

const SECTIONS = [
  {
    title: 'No Warranty',
    body: `QuestSync is provided as-is without any warranties. We do not guarantee the accuracy of extracted dates or calendar events. Users are responsible for verifying all imported dates against their official course outlines.`,
  },
  {
    title: 'Not Affiliated with the University of Waterloo',
    body: `QuestSync is an independent student project and is not affiliated with, endorsed by, or connected to the University of Waterloo or any other university.`,
  },
  {
    title: 'User Responsibility',
    body: `Users are responsible for ensuring their use of QuestSync complies with their institution's policies. Users are responsible for any API costs incurred through their own Claude API key.`,
  },
  {
    title: 'Google Calendar',
    body: `By connecting Google Calendar, you authorize QuestSync to create events in your calendar. You can revoke this access at any time by visiting myaccount.google.com/permissions.`,
  },
  {
    title: 'Limitation of Liability',
    body: `QuestSync and its creators are not liable for any missed deadlines, incorrect calendar entries, or any damages arising from use of the service.`,
  },
  {
    title: 'Service Availability',
    body: `QuestSync is a student side project. The service may change, go down, or become unavailable at any time without notice.`,
  },
]

export function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-4 sm:px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-gray-900 mb-2">Terms of Service</h1>
          <p className="text-sm text-gray-400">Effective date: {EFFECTIVE_DATE}</p>
        </div>

        <p className="text-gray-700 leading-relaxed mb-10">
          By using QuestSync you agree to these terms.
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
            If you have any questions about these terms, you can reach us via the{' '}
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
