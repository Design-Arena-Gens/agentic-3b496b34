export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-500/30 via-slate-900 to-slate-950">
        <div className="mx-auto max-w-5xl px-6 py-24">
          <div className="max-w-3xl">
            <p className="mb-4 text-sm uppercase tracking-[0.3em] text-indigo-300">
              Telegram Task Assistant
            </p>
            <h1 className="text-4xl font-bold leading-tight sm:text-5xl">
              Capture text or voice, get smart reminders, and wake up to a ready-made to-do list.
            </h1>
            <p className="mt-6 text-lg text-slate-200">
              Send natural language notes to your bot — it understands timing, tags, priority, and keeps everything in Indian Standard Time. Daily digests go out at 8:00 AM IST so you start the morning focused.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <span className="rounded-full border border-indigo-400/60 px-4 py-1 text-sm text-indigo-200">
                Text &amp; voice intake
              </span>
              <span className="rounded-full border border-indigo-400/60 px-4 py-1 text-sm text-indigo-200">
                Auto-tag &amp; prioritise
              </span>
              <span className="rounded-full border border-indigo-400/60 px-4 py-1 text-sm text-indigo-200">
                Smart reminders
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-16">
        <h2 className="text-2xl font-semibold text-indigo-200">How it works</h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          {[
            {
              title: "Understand any message",
              detail:
                "Type or dictate tasks. The bot splits combined requests, converts voice notes to text, and picks up due times even from phrases like “tomorrow morning”.",
            },
            {
              title: "Smart defaults in IST",
              detail:
                "When timings are vague, the assistant chooses sensible defaults (morning = 9 AM, afternoon = 3 PM, evening = 7 PM) and keeps every task anchored to Asia/Kolkata.",
            },
            {
              title: "Focused daily briefing",
              detail:
                "At 08:00 AM IST you receive a clean list of everything due today with quick status indicators and categories.",
            },
            {
              title: "Ahead-of-time nudges",
              detail:
                "Important tasks trigger an early heads-up 30 minutes before the main alert, so nothing slips when the day gets busy.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-white/10 bg-white/5 px-6 py-6 shadow-xl shadow-indigo-900/20 backdrop-blur"
            >
              <h3 className="text-xl font-semibold text-indigo-100">{item.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-200">{item.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-slate-900/60">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <h2 className="text-2xl font-semibold text-indigo-200">Telegram commands</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {[
              {
                command: "/add Pay rent tomorrow 10am",
                description: "Creates a task instantly with the parsed date, time, tags, and confirmation reply.",
              },
              {
                command: "/next",
                description: "Shows the next five open tasks sorted by urgency.",
              },
              {
                command: "/done 2",
                description: "Marks the second upcoming task as completed and sends a quick high-five.",
              },
              {
                command: "/snooze 3 2h",
                description: "Pushes task three out by two hours. Accepts minutes, hours, or days.",
              },
            ].map((item) => (
              <div
                key={item.command}
                className="rounded-xl border border-indigo-400/20 bg-slate-950/50 px-6 py-5"
              >
                <p className="font-mono text-sm text-indigo-300">{item.command}</p>
                <p className="mt-3 text-sm text-slate-200">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-16">
        <h2 className="text-2xl font-semibold text-indigo-200">Deploy checklist</h2>
        <ol className="mt-6 space-y-4 text-sm text-slate-200">
          <li className="rounded-xl border border-white/10 bg-white/5 px-5 py-4">
            <strong className="block text-indigo-200">1. Environment</strong>
            <span>
              Set <code className="font-mono text-xs text-indigo-200">DATABASE_URL</code>,{" "}
              <code className="font-mono text-xs text-indigo-200">OPENAI_API_KEY</code>,{" "}
              <code className="font-mono text-xs text-indigo-200">TELEGRAM_BOT_TOKEN</code>, and{" "}
              <code className="font-mono text-xs text-indigo-200">TELEGRAM_WEBHOOK_SECRET</code> on Vercel.
            </span>
          </li>
          <li className="rounded-xl border border-white/10 bg-white/5 px-5 py-4">
            <strong className="block text-indigo-200">2. Prisma schema</strong>
            <span>
              <code className="font-mono text-xs text-indigo-200">npx prisma migrate deploy</code> runs automatically on build to sync tables for Postgres.
            </span>
          </li>
          <li className="rounded-xl border border-white/10 bg-white/5 px-5 py-4">
            <strong className="block text-indigo-200">3. Telegram webhook</strong>
            <span>
              Call{" "}
              <code className="font-mono text-xs text-indigo-200">
                https://api.telegram.org/bot&lt;token&gt;/setWebhook?url=https://agentic-3b496b34.vercel.app/api/telegram&amp;secret_token=&lt;secret&gt;
              </code>{" "}
              so Telegram sends updates securely.
            </span>
          </li>
          <li className="rounded-xl border border-white/10 bg-white/5 px-5 py-4">
            <strong className="block text-indigo-200">4. Vercel cron jobs</strong>
            <span className="block">
              Add cron rules (UTC):
              <br />
              <code className="font-mono text-xs text-indigo-200">
                30 2 * * * https://agentic-3b496b34.vercel.app/api/cron/daily
              </code>{" "}
              (08:00 IST daily)
              <br />
              <code className="font-mono text-xs text-indigo-200">
                */5 * * * * https://agentic-3b496b34.vercel.app/api/cron/reminders
              </code>{" "}
              (recurring reminders).
            </span>
          </li>
        </ol>
      </section>

      <footer className="border-t border-white/10 bg-slate-950/80">
        <div className="mx-auto flex max-w-5xl flex-col gap-2 px-6 py-6 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <p>Built with Next.js, Prisma, OpenAI, and the Telegram Bot API.</p>
          <p className="text-slate-500">All timestamps default to Asia/Kolkata (IST).</p>
        </div>
      </footer>
    </main>
  );
}
