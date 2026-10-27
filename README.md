# CareerPulse AI

AI mock interview coach + offline spaced-repetition certification prep. React Native (Expo), TypeScript, SQLite, Node.js, Google Gemini.

## Architecture

```
careerpulse-ai/
├── docs/schema.sql                  # source of truth for the local SQLite DDL
├── scripts/sync-schema.sh           # regenerates mobile/src/shared/db/schema.ts from schema.sql
├── backend/                         # Node + Express; the ONLY place the Gemini key lives
│   └── src/
│       ├── server.ts                # helmet, CORS, rate limit, error mapping
│       ├── gemini.ts                # JSON-mode call, Zod validation, one self-repair retry
│       ├── prompts.ts               # system prompts + injection-fenced prompt builders
│       ├── schemas.ts               # request + model-output Zod schemas
│       └── routes/interview.ts      # /start, /turn, /summary (server computes the final score)
└── mobile/                          # Expo app
    ├── App.tsx / index.ts
    └── src/
        ├── app/bootstrap.ts         # open + migrate DB, seed starter decks
        ├── config.ts  theme/
        ├── navigation/              # tabs (Dashboard, Decks) + stack (setup, session, review)
        ├── shared/
        │   ├── db/                  # database.ts (singleton + migrations), schema.ts (generated)
        │   └── components/          # Button, Card, ProgressBar, ScoreRing, Screen
        └── modules/
            ├── flashcards/          # 100% offline
            │   ├── sm2.ts (+ sm2.test.ts)   # pure SM-2 engine
            │   ├── streak.ts                # pure streak maths
            │   ├── repository.ts            # all SQLite reads/writes for decks/cards/reviews
            │   ├── seedData.ts
            │   ├── DecksScreen.tsx
            │   └── FlashcardReviewScreen.tsx   # flip animation + Again/Hard/Good/Easy
            ├── interview/
            │   ├── api.ts  types.ts
            │   ├── history.ts               # interview_history table
            │   ├── weaknessSync.ts          # interview -> "Interview Gaps" flashcard deck
            │   ├── InterviewSetupScreen.tsx
            │   └── InterviewSessionScreen.tsx  # Q&A, instant feedback modal, final study plan
            └── dashboard/
                ├── readiness.ts             # 60% interview avg + 40% flashcard mastery
                ├── dashboardService.ts
                └── DashboardScreen.tsx
```

Design rules: the flashcard module has no network code, the interview module is the only one that talks to the API, and the two meet in exactly one place (`weaknessSync.ts`).

## Run it

### 1. Backend
```bash
cd backend
cp .env.example .env        # paste your Gemini key from https://aistudio.google.com/apikey
npm install
npm run dev                 # http://localhost:8787  (check /health)
```

### 2. Mobile
```bash
cd mobile
cp .env.example .env        # set EXPO_PUBLIC_API_URL (see comments in the file)
npm install
npx expo install --fix      # aligns native package versions with your installed Expo SDK
npx expo start
```
Run `npm test` in `mobile/` for the SM-2 unit tests.

> Phone + backend must be on the same Wi-Fi when testing on a real device. Android emulator uses `http://10.0.2.2:8787`.

## How the pieces work

**SM-2** (`sm2.ts`): buttons map to quality Again=1, Hard=3, Good=4, Easy=5. Pass (>=3): 1 day, then 6 days, then `round(interval x EF)`. Fail: repetitions reset, 1 day. `EF' = EF + (0.1 - (5-q)(0.08 + (5-q)0.02))`, floor 1.3. A card marked Again is also re-queued at the end of the current session.

**Interview -> flashcards**: `/summary` returns weak topics and 6-10 self-contained cards. `syncInterviewResult()` stores the session in `interview_history`, then inserts the cards into a deck named `Interview Gaps: <role>` (duplicates ignored via a unique index). They are due immediately.

**Scoring**: Gemini scores technical accuracy, clarity and (for behavioral questions) STAR usage on an anchored rubric; the server combines them (technical 65/35 clarity, behavioral 40/25/35 with STAR). A candidate cannot prompt the model into awarding a flat 100.

**Readiness** = `0.6 x avg(last 5 interview scores) + 0.4 x flashcard mastery`, where mastery is the mean of `min(interval/21, 1)` over all cards.

## Security notes
- The Gemini key stays in `backend/.env`. Never use an `EXPO_PUBLIC_` variable for it; those are bundled into the app.
- Candidate text and job descriptions are fenced as untrusted data in prompts, and request sizes are capped.
- Before a public release add real authentication (e.g. Firebase Auth / JWT) and per-user quotas. The included IP rate limit is only a basic guard.
- Deploy the backend (Render, Railway, Fly.io, Cloud Run) and point `EXPO_PUBLIC_API_URL` at the HTTPS URL.

## Roadmap ideas
- Voice answers: add `expo-speech-recognition` (needs a dev build, not Expo Go) and feed the transcript into the existing answer box. Spoken questions already work via `expo-speech`.
- Cloud backup/sync of `reviews` and `interview_history`.
- Custom decks and card editing; daily new-card limits.
- Stream Gemini responses for faster feedback.
