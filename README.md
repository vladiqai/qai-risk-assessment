# QAi Assessment MVP (Vercel + Supabase + Resend)

This is a Vercel-ready Next.js App Router project for a partner-facing:
**AI Monitoring & Compliance Risk Assessment**

## What it does
- Serves the assessment page at `/assessment`
- Calculates score and fit band live in the browser
- Submits the completed assessment to `/api/submit-assessment`
- Stores the submission in Supabase
- Sends:
  - an internal notification to `hello@qai-global.com`
  - a confirmation email to the contact email entered in the form
- Supports Vercel Web Analytics and optional custom events

## Quick start

1. Install dependencies
   ```bash
   npm install
   ```

2. Copy env vars
   ```bash
   cp .env.example .env.local
   ```

3. Create the Supabase table
   - Run the SQL in:
     `supabase/migrations/001_assessment_submissions.sql`

4. Start locally
   ```bash
   npm run dev
   ```

5. Open:
   - `http://localhost:3000/assessment`

## Vercel deployment

1. Push this folder to GitHub
2. Import the repo into Vercel
3. Add the environment variables from `.env.example`
4. Enable Vercel Web Analytics in the Vercel dashboard
5. Add your custom domain (for example `assessment.qai-global.com`)

## Notes

- `FROM_EMAIL` must use a domain you have verified in Resend
- The API route recalculates the score server-side before storing it
- The current version stores one JSON payload per submission in `answers`, `notes`, and `poc_gates`
- A future phase can add:
  - PDF generation
  - partner token tracking
  - CRM sync
  - Slack/webhook alerts
