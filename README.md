# Taskline Telegram Assistant

A Next.js (App Router) deployment ready for Vercel that powers a Telegram bot capable of turning free-form text or voice notes into organised tasks. The bot automatically extracts due dates, times, tags, and priorities in Indian Standard Time, persists everything in Postgres through Prisma, and delivers reminders plus an 8:00 AM IST daily briefing.

## ✨ Key Capabilities

- Accepts text, commands, and Telegram voice notes (powered by OpenAI Whisper via `gpt-4o-mini-transcribe`).
- Breaks multi-task messages into individual entries with inferred timing, tags, and priority levels.
- Stores tasks with `dueAt`, reminder windows, tags, and completion status using Prisma/Postgres.
- Provides `/add`, `/next`, `/today`, `/done`, and `/snooze` commands, alongside natural prompts like “What’s next?”.
- Sends reminders at due time, early notifications for high-priority work, and a daily digest at 08:00 IST.

## 🧱 Stack

- **Framework:** Next.js 14 (App Router, TypeScript, Tailwind)
- **Database:** PostgreSQL (managed via Prisma)
- **AI:** OpenAI SDK for transcription + task extraction (JSON schema response)
- **Scheduling:** Vercel Cron Jobs hitting serverless routes
- **Deployment target:** `https://agentic-3b496b34.vercel.app`

## ⚙️ Configuration

### Required environment variables

Set these locally in `.env.local` and in Vercel project settings:

```
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DB?sslmode=require"
OPENAI_API_KEY="sk-..."
TELEGRAM_BOT_TOKEN="123456:ABCDEF"
TELEGRAM_WEBHOOK_SECRET="shared-secret"
```

### Database migrations

Generate client & apply migrations:

```bash
npm run prisma:generate
npm run prisma:migrate  # runs `prisma migrate deploy`
```

`prisma/migrations/000_init/migration.sql` contains the initial `Task` table plus enums/indexes.

### Local development

```bash
cd web
npm install
npm run dev
```

Provide placeholder environment values when running `npm run build` locally (the build checks that tokens exist when the API handlers execute).

## 🤖 Telegram setup

1. Create a bot with [@BotFather](https://core.telegram.org/bots#botfather) and grab the API token.
2. After deploying to Vercel, register the webhook (replace tokens and secrets):
   ```bash
   curl "https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook" \
     --data-urlencode "url=https://agentic-3b496b34.vercel.app/api/telegram" \
     --data-urlencode "secret_token=<TELEGRAM_WEBHOOK_SECRET>"
   ```
3. Telegram will now deliver updates to the Vercel function. The secret header is validated automatically.

### Supported commands & phrases

| Command / phrase           | Result |
| -------------------------- | ------ |
| `/add Pay rent tomorrow 10am` | Parses and stores with confirmation reply |
| `/next` or “What’s next?”     | Shows the next five open tasks |
| `/today` or “Show me today”   | Lists tasks due today |
| `/done 3` / “Mark task 3 as done” | Marks the third upcoming task complete |
| `/snooze 2 45m`               | Pushes task 2 forward by 45 minutes |

Any free-form text or transcribed voice note is parsed for tasks. High-priority work receives an extra reminder 30 minutes before the due time by default.

## ⏰ Scheduling (Vercel Cron)

Add the following Vercel Cron jobs (UTC timings):

- `30 2 * * * https://agentic-3b496b34.vercel.app/api/cron/daily` – triggers the 08:00 IST digest
- `*/5 * * * * https://agentic-3b496b34.vercel.app/api/cron/reminders` – processes reminders and early nudges

Both routes accept `GET` or `POST`, so the default Vercel Cron webhook works out of the box.

## 📦 Deployment workflow

```bash
npm run lint
npm run build
vercel deploy --prod --yes --token $VERCEL_TOKEN --name agentic-3b496b34
```

After the deployment settles, verify the production URL:

```bash
curl https://agentic-3b496b34.vercel.app
```

If the curl check fails due to propagation lag, retry after a brief pause.

## 🗂️ Repository structure

```
web/
  prisma/
    schema.prisma
    migrations/000_init/migration.sql
  src/
    app/api/telegram/route.ts        # Telegram webhook entry
    app/api/cron/reminders/route.ts  # Reminder processor
    app/api/cron/daily/route.ts      # Daily digest sender
    server/telegram/*                # Telegram helpers + voice transcription
    server/tasks/*                   # Task extraction & persistence
    server/reminders.ts              # Reminder orchestration
    server/daily.ts                  # Daily digest orchestration
    lib/*                            # Time and parsing utilities
```

## ✅ Manual testing checklist

- [x] `npm run lint`
- [x] `npm run build` with placeholder environment values

Once deployed, send messages from Telegram to confirm:

1. `/add Call Mini at 10 AM tomorrow`
2. Voice note with multiple tasks
3. `/next`, `/done 1`, `/snooze 1 2h`

Each should produce confirmations or list responses exactly once.

---

Built to keep your day organised the moment inspiration strikes.
