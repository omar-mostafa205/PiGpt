# PiGPT - Complete Feature and Stack Reference

PiGPT is an AI study assistant for Math, Physics, Chemistry and Accounting.
A student can type a question, photograph a problem, upload a worksheet, dictate a question aloud, or record a whole lecture, and get a step-by-step explanation back.
The app also generates quizzes, saves lecture notes, and tracks progress over time.

This document describes the repository as it stands in the working tree, including changes not yet committed.

- Repo root: `math-buddy/`
- Product name: **PiGPT** (`app.json` slug `pigpt`, bundle id `com.tp53health.pigpt`, URL scheme `pigpt`)
- Two applications: an Expo mobile app in `mobile/` and an Express API in `backend/`
- Roughly 6,700 lines across 89 mobile source files and 2,050 lines across 34 backend source files

> **Note on the working tree.**
> The AI provider layer was refactored while this document was being written.
> `backend/src/services/ai/provider.ts`, `openrouter.ts`, `types.ts` and `backend/e2e.ts` are untracked, and eight tracked backend and mobile files carry uncommitted changes.
> This document reflects the current on-disk state, not the last commit.

---

## 1. Technology stack

### 1.1 Mobile app (`mobile/`)

| Area | Choice |
| --- | --- |
| Framework | Expo SDK 54, React Native 0.81.5, React 19.1.0 |
| Language | TypeScript 5.9 (strict, `noImplicitAny: false`), path alias `@/*` -> `./src/*` |
| Navigation | `expo-router` 6, file-based routing, `typedRoutes` off, React Compiler on |
| State | Zustand 5 (seven stores) |
| Styling | Three coexisting systems: design-token `StyleSheet` (`constants/theme.ts`), NativeWind 4 + Tailwind 3.4 (auth screens), styled-components 6 (`components/ui/` primitives) |
| Auth | `@clerk/clerk-expo` 2.19 with `expo-secure-store` token cache |
| Networking | `axios` for REST, `expo/fetch` for incremental stream reading |
| Local storage | `@react-native-async-storage/async-storage`, namespaced per account |
| Graphics | `react-native-svg` 15 (all icons, logo, gradients), `expo-linear-gradient`, `expo-glass-effect` |
| Animation | React Native `Animated` API, `react-native-reanimated` 4, `react-native-worklets` |
| Media | `expo-camera`, `expo-image-picker`, `expo-document-picker`, `expo-audio`, `expo-file-system` |
| Icons | 42 hand-authored SVG glyphs in `components/ui/Icon.tsx`, plus Ionicons and `lucide-react-native` |
| Build | EAS Build with `development`, `preview` (Android APK) and `production` (auto-increment) profiles |
| Lint | `eslint-config-expo` 10 |

### 1.2 Backend API (`backend/`)

| Area | Choice |
| --- | --- |
| Runtime | Node.js, ESM (`"type": "module"`), `tsx watch` in dev, compiled `tsc` output in production |
| Framework | Express 5 |
| Language | TypeScript 6 |
| ORM | Prisma 7 with the `@prisma/adapter-neon` driver adapter |
| Database | Neon serverless PostgreSQL (`@neondatabase/serverless`) |
| Auth | `@clerk/express` 2.1, `clerkMiddleware()` plus a custom `authMiddleware` |
| Validation | Zod 4, on every request body and on the environment at boot |
| Uploads | `multer` 2, memory storage, PDF only, 10 MB cap |
| AI - text and images | OpenRouter, OpenAI-compatible HTTP API, default free model `nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free` |
| AI - audio | Google Gemini via `@google/genai` 2.2, default model `gemini-3.6-flash` |
| Dates | `date-fns` 4 |
| Rate limiting | Custom in-process fixed-window limiter |
| Logging | Custom timestamped console logger with a `debug` level gated on `NODE_ENV` |

### 1.3 Infrastructure

- **API hosting:** Render, configured by the `render.yaml` blueprint (free plan, `rootDir: backend`, health check at `/health`).
- **Migrations:** `prisma migrate deploy` runs as part of `npm start`, so every deploy applies pending schema changes.
- **Database:** Neon PostgreSQL, connection string in `DIRECT_URL`.
- **App distribution:** EAS Build. The `preview` profile emits an Android APK for direct install without a store listing.
- **Secrets:** never committed. `.env.example` files document the shape in both packages, and Render/EAS hold the real values.

---

## 2. Repository layout

```
math-buddy/
├─ package.json          # convenience scripts only, not an npm workspace
├─ render.yaml           # Render blueprint for the API
├─ DEPLOY.md             # free-tier deployment guide
├─ backend/
│  ├─ prisma/
│  │  ├─ schema.prisma           # 7 models, 3 enums
│  │  └─ migrations/0_init/      # real SQL migration
│  ├─ scripts/seed.ts            # idempotent demo-data seeder
│  ├─ e2e.ts                     # end-to-end AI smoke test (untracked)
│  └─ src/
│     ├─ index.ts                # Express bootstrap
│     ├─ config/env.ts           # Zod-validated env, exits on failure
│     ├─ routes/                 # 8 routers
│     ├─ controllers/            # 8 controllers
│     ├─ middleware/             # auth, cors, rateLimit, errorHandler
│     ├─ services/ai/            # provider, openrouter, gemini, buildPrompt, parseResponse, types
│     ├─ services/storage/       # neonStorage (Prisma client + helpers), ensureUser
│     ├─ types/index.ts          # shared API types + Express Request augmentation
│     └─ utils/                  # logger, validators
└─ mobile/
   ├─ app.json, eas.json, tailwind.config.js, metro.config.js
   └─ src/
      ├─ app/                    # expo-router routes
      │  ├─ _layout.tsx          # Clerk provider + route guard + per-account scoping
      │  ├─ (auth)/              # sign-in, sign-up
      │  ├─ onboarding/          # welcome, questions
      │  └─ (tabs)/              # index (solver), camera, voice, progress
      ├─ components/             # ui/, shared/, solver/, quiz/, voice/
      ├─ store/                  # 7 Zustand stores
      ├─ hooks/                  # 10 hooks
      ├─ services/api/           # 8 API modules + axios client + stream reader
      ├─ constants/              # theme tokens, colors, subjects, prompts
      ├─ types/                  # chat, progress, quiz, user, voice
      └─ utils/                  # storage, markdown, latex, helpers
```

---

## 3. Feature catalogue

### 3.1 Authentication and accounts

**Sign in** (`mobile/src/app/(auth)/sign-in.tsx`)

- Continue with Google (Clerk `oauth_google`).
- Continue with Apple (Clerk `oauth_apple`).
- Email and password sign-in via `signIn.create`, with inline error surfacing.
- Full-bleed background image with a scrim and bottom-anchored controls.

**Sign up** (`mobile/src/app/(auth)/sign-up.tsx`)

- Google and Apple OAuth.
- Email and password registration.
- Six-digit email verification code screen, with its own dedicated layout.
- Cross-link to sign-in.

**Session handling**

- Tokens are cached in `expo-secure-store`, not AsyncStorage.
- `setApiTokenGetter` wires Clerk's `getToken()` into both the axios request interceptor and the streaming fetch, so every request carries `Authorization: Bearer <jwt>`.
- On sign-out the token getter is cleared.

**Route guard** (`mobile/src/app/_layout.tsx`)

Three rules, evaluated once Clerk has loaded:

1. Not signed in and not in `(auth)` -> redirect to `/(auth)/sign-in`.
2. Signed in but onboarding incomplete and not in `onboarding` -> redirect to `/onboarding/welcome`.
3. Signed in and onboarded but sitting in `(auth)` or `onboarding` -> redirect to `/(tabs)`.

**Per-account data isolation**

Local storage keys are namespaced `u:<userId>:<key>` (`mobile/src/utils/storage.ts`).
When the signed-in user changes, including on sign-out, the app repoints the storage scope and resets the chat, library and user stores in memory.
Without this, a second account on the same device would see the first account's conversations and onboarding answers.
`storageClearScope()` can wipe everything belonging to the current scope.

**Backend auth** (`backend/src/middleware/auth.ts`)

- `clerkMiddleware()` is registered before everything else so Clerk can read cookies and headers.
- Every route under `/api` passes through `authMiddleware`, which returns 401 when the request is unauthenticated.
- `ensureUser(clerkId)` upserts a `User` row keyed by the Clerk id, so every foreign key has a target.
  It is cached in a per-process `Set`, so the Clerk profile lookup happens at most once per user per process, and a lookup failure never blocks the request.
- `GET /api/auth/me` echoes the resolved user id.

---

### 3.2 Onboarding

**Welcome** (`mobile/src/app/onboarding/welcome.tsx`)

Full-bleed image, product headline, and four checkmarked value bullets: step-by-step solutions, photo solving, progress tracking, and AI-generated quizzes.

**Four-question flow** (`mobile/src/app/onboarding/questions.tsx`)

| Question | Type | Options |
| --- | --- | --- |
| What best describes you? | single | High school student, University student, Parent, Teacher, Self-study |
| What is your top goal? | single | Homework help, Acing exams, Understanding the why, Catching up fast |
| Which subjects do you need? | multi | Math, Physics, Chemistry, Statistics, Accounting |
| How did you hear about us? | single | Friend or classmate, Social media, App Store, Teacher or school, Somewhere else |

- Every option carries a label and a one-line subtitle.
- A four-segment progress bar fills as the user advances, and the back button steps backwards through questions before leaving the flow.
- The CTA is disabled until the current question is answered, and reads `Continue with N selected` on the multi-select step.
- SVG page gradient (`#f8f9fc` -> `#f1f3f9` at 55% -> `#e9ecf6`) drawn with `react-native-svg`.

**What the answers drive**

- **Role -> grade level.** `High school student` -> `high_school`, `University student` -> `university`, `Self-study` -> `self_study`, and `Parent`/`Teacher` -> `high_school` since they are usually asking on someone else's behalf.
  The resulting grade level is sent with every solve request and changes how the model calibrates its explanations.
- **Subjects -> camera subject chips.** The camera screen shows only the chosen subjects, falling back to all five when none were picked.
- **Statistics -> `math`.** The backend `Subject` enum has no statistics value, so `toApiSubject` maps it onto `math`.
  The subject store deliberately keeps `activeLabel` and `activeSubject` separate so Math and Statistics do not both highlight at once.
- **Goal and source** are stored on the device only.
  There is no column for them in the schema.

All answers persist to AsyncStorage and reload on next launch.

---

### 3.3 Solver - the main chat

The solver (`mobile/src/app/(tabs)/index.tsx`) is the app's home screen.

**Streaming answers**

- `POST /api/solve/stream` returns NDJSON, one JSON object per line: `{"type":"problem"}`, then many `{"type":"text"}` deltas, then `{"type":"done"}`, or `{"type":"error"}`.
- React Native's global `fetch` cannot read a response body incrementally, so the client uses `expo/fetch` (`mobile/src/services/api/stream.ts`).
  The reader dispatches only complete lines and keeps any partial tail for the next chunk, and a malformed line never kills the stream.
- The store keeps two counters: `streamed` (what the network has delivered) and `displayed` (what the UI has revealed).
  A 16 ms timer reveals `max(2, backlog / 15)` characters per tick, which turns the network's lumpy bursts into an even typewriter cadence.
- The stop button aborts the in-flight request via `AbortController`.
  A user-initiated stop keeps whatever text arrived and is not treated as an error.

**Durability**

The stream controller creates the `Problem` row *before* any text is generated and finishes it in a `finally` block.
An abandoned, aborted or failed stream therefore still leaves the turn in history.

**Conversation model**

- Four independent threads, one per subject: math, physics, chemistry, accounting.
- Each thread is cached in AsyncStorage, capped at the last 50 messages.
- The last 10 non-loading turns are sent as conversation history (the API accepts up to 20).
- Switching subjects switches threads; the other threads are untouched.

**Prompting** (`backend/src/services/ai/buildPrompt.ts`)

The system prompt is assembled from three parts:

1. **Subject persona.** Math tutor, physics professor, chemistry tutor or accounting tutor, each with its own listed specialisms.
2. **Grade calibration.** Five variants from `middle_school` ("analogies a 12-year-old would recognise") through `university` ("full mathematical rigour, reference relevant theorems").
3. **Format instructions.** A required output structure plus a guard.

**The non-question guard.**
Before answering, the model is told to decide whether the message is actually a problem.
For blanks, stray characters (`"Bb"`, `"asdf"`), greetings or anything too vague, it must ask what the student wants help with and give one concrete example, rather than inventing a topic or guessing at the question.

**The answer structure.**

```
**Topic:** [specific sub-topic]
**Step 1 — [short title]**
...
**Final Answer:** [concise answer]
**Tip:** [related concept or follow-up insight]
```

Proper mathematical notation is required throughout, and the model is told to explain the *why* behind each step rather than just the calculation.

**Response parsing** (`backend/src/services/ai/parseResponse.ts`)

Regex extraction of topic, numbered steps with titles, final answer and tip, with graceful fallbacks at every stage.
If no `Final Answer` marker is present, the last non-empty line is used.

**Chat UI**

- **User turns** render as a right-aligned grey bubble.
  **Assistant turns** render as plain text on the page, with no card and no border.
- **Thinking label** (`components/solver/ThinkingLabel.tsx`) while an answer is still empty.
  Six status lines per subject, rotating every 2.6 s ("Balancing the equation", "Matching debits and credits", "Checking the units"), each rendered with a per-character opacity sweep that reads as a travelling glow, alongside a rotating six-point asterisk spinner.
- **Follow-up chips** under every finished answer: **Practice Test** and **Practice Question**.
  These feed the conversation rather than navigating away.
- **Empty state** offers two entry points: Scan a problem and Upload a worksheet.
- `ChatBubble` is memoised on id, content and loading state, so typing in the composer does not re-render the whole transcript.
- The keyboard is dismissed on submit so the composer settles at the bottom while the answer streams in.

**Composer**

A single rounded surface holding a multiline input plus two button groups:

- Left: `+` attach sheet, `Σ Math Input` toggle, `Tools` sheet.
- Right: microphone (dictation), and a send button that becomes a stop square while streaming.
- Every control is a fixed 34x34 box so the row stays aligned.
- The line under the composer is a disclaimer by default, and becomes the dictation status ("Listening - tap the mic to stop") or the dictation error when relevant.

**Chat overflow menu** (`components/shared/ChatMenu.tsx`)

Appears once the chat has messages: Share, Pin, Uploaded files, Find in chat, Archive, Delete.
Find in chat opens the search sheet and Delete clears the thread; the rest are presentational for now.

---

### 3.4 Math input keyboard

`components/solver/MathKeyboard.tsx` - a seven-tab symbol palette that inserts directly into the composer.

| Tab | Contents |
| --- | --- |
| Popular | `+ − × ÷ = ^ √ x² x⁻¹ eˣ log ln ! π ( ) \|x\| ∑ ∏ ∞ %` |
| sin cos | trig, inverse trig, hyperbolics, common angles |
| Calculus | `∫ ∬ d/dx ∂ lim ∇ Σ dx dy dt → ∞ ′ ″ ∆ ε δ ∮ f(x) g(x) C` |
| ≥ ≠ | comparisons, `±`, `∝`, roots, `∴`, `∵`, `∎` |
| ∈ ⊂ | set theory, number sets `ℝ ℕ ℤ ℚ ℂ`, logic |
| → | arrows, geometry relations |
| ΩΔ | the Greek alphabet |

Twenty-one keys per tab in a seven-column grid whose key width is computed from the screen width, so seven keys always fit exactly.
Keycaps use Georgia italic, matching the design's treatment of every equation.

---

### 3.5 Camera and photo solving

`mobile/src/app/(tabs)/camera.tsx`

- Live `CameraView` preview inside a blue-bordered viewfinder with top-left and bottom-right corner marks.
- Permission is requested on mount so the preview is live as soon as the screen opens.
  If permission is denied but re-askable, an "Allow camera" button appears; if it is permanently denied, the copy points the user at Settings.
- Shutter captures at `quality: 0.7` with base64 output.
- A gallery button opens the photo library as an alternative.
- Horizontal subject chips reflect the onboarding selection, comparing labels rather than API subjects so Statistics does not light up alongside Math.
- Taking or picking a photo navigates back to the solver and immediately sends the image with a subject-specific prompt ("Solve this chemistry problem from my photo").
- Photos can also be attached from the composer's `+` sheet or the Tools sheet without leaving the chat.

Images travel as base64 and are converted to a provider-native part: a `data:` URI for OpenRouter, `inlineData` for Gemini.

---

### 3.6 Voice - dictation and lecture recording

Two distinct capabilities that deliberately do not share a screen.

**Dictation** (`hooks/useDictation.ts`, the composer microphone)

- Tap to record, tap again to stop.
- The recording is read as base64 and posted to `POST /api/transcribe`.
- The transcript is appended to whatever is already in the composer.
- The mic button turns solid red while live, and shows a spinner while transcribing.
- The transcription prompt asks for plain text with spoken maths written in normal notation ("x squared" -> `x^2`, "integral of" -> `∫`), and an empty string when there is no discernible speech.
- This hook never navigates. It only hands text back to its caller.

**Lecture recorder** (`mobile/src/app/(tabs)/voice.tsx`)

- Recordings are auto-named the way Voice Memos does it: "New Recording 1", "New Recording 2", with the counter persisted across sessions.
- **Live recording sheet** (`components/voice/RecordingSheet.tsx`):
  - Hundredths-precision timer in `mm:ss.hh`.
  - A live waveform built from dBFS input metering, polled every 80 ms.
    Levels are mapped from a -55 dB floor onto 0..1, older bars scroll off the left edge, and silence renders as a visible hairline rather than nothing.
  - A stop button and a playhead marker.
- A slow breathing halo pulses behind the record button while capturing.
- The empty state shows a hand-drawn SVG arrow pointing at the record button.
- After stopping: **Generate summary** or **Discard**.
- The recording length is captured before stopping, because `useAudioRecorderState` zeroes `durationMillis` once the recorder halts.

**Lecture summary** (`POST /api/summarize`)

The audio is sent inline (base64, up to roughly 25 MB) with a strict JSON schema, and the model returns:

| Field | Meaning |
| --- | --- |
| `title` | Short lecture title |
| `summary` | Three to five sentence overview |
| `keyPoints` | Four to eight concrete takeaways |
| `topics` | Two to five topic labels |
| `followUps` | Two to four questions the student should be able to answer |

If the audio contains no discernible speech, the model returns the same shape with an empty `keyPoints` array and a summary saying nothing could be heard.

**Result screen**

Four cards: the lecture overview, numbered key points, topic chips, and a "Check yourself" list of follow-up questions.
All of it renders through the markdown renderer, so equations inside a summary display correctly.
Three actions follow: **Quiz me on this lecture**, **Open in Notes**, **Record another**.

Every generated summary is saved to the `Note` table automatically, and the library store refreshes so the Notes panel reflects it immediately.
The status line reads "Saved to Notes" once the note id comes back.

Accepted audio MIME types: `audio/m4a`, `audio/mp4`, `audio/mpeg`, `audio/wav`, `audio/webm`.
The summarize request uses a 180 s client timeout and transcription a 120 s timeout, since both take far longer than a solve.

---

### 3.7 Notes

`components/shared/NotesPanel.tsx` - a second-level drawer reached from the sidebar's Notes entry, with a back button returning to the sidebar.

- A prominent **Record a lecture** CTA jumps to the voice tab.
- **Lecture notes** section: title, first topic, key-point count, and relative time ("just now", "5h ago", "yesterday", "3d ago").
- **Saved solutions** section: the question, its subject, its topic and relative time.
  Tapping one reopens that problem as a full conversation.
- Both sections have their own empty-state copy explaining how to fill them.
- The panel refetches from the server every time it opens.

API: `GET /api/notes` returns the 50 newest notes, and `DELETE /api/notes/:id` deletes one.
The delete is scoped by `userId` in the `where` clause, so one account cannot delete another's note, and returns 404 when nothing matched.

---

### 3.8 Quizzes and exams

`components/quiz/QuizSheet.tsx` - the quiz runs as a window over whatever screen you were on, never as a separate tab, so the conversation behind it is never lost.

**Generation**

- Opening the quiz auto-generates one for the current subject: medium difficulty, five questions, using a per-subject default topic ("calculus: limits, derivatives and integration", "double-entry bookkeeping and financial statements", and so on).
- `POST /api/quiz` asks the model for strict JSON and nothing else:

```json
{ "title": string,
  "questions": [
    { "id": number, "question": string,
      "options": [string, string, string, string],
      "correctIndex": number, "explanation": string } ] }
```

- Markdown fences are stripped before parsing.
- The API accepts a free-text topic, `easy` / `medium` / `hard` difficulty, and 5 to 30 questions.
  The current UI only exercises a subset of that range.

**Taking a quiz**

- One question at a time, four radio options.
- **Check** locks the answer and reveals the outcome: correct options go green, a wrong pick goes red, and the explanation appears below with a "Correct" or "Not quite" verdict.
- **Show Steps** reveals the same explanation.
- Previous / next chevrons navigate freely, and a segmented bar tracks position.
- A running score reads `N / M points attempted`, and the header status changes between "Let's start!", "Keep going" and "Nice work!".
- The last question's button becomes **Finish · N/M correct**.
- A loading state ("Building your quiz") and an error state with a **Try again** button cover generation failures.

**Scoring and persistence**

- Closing a completed quiz submits it: `POST /api/quiz/submit` stores subject, topic, difficulty, the question texts and the percentage score.
- A failed sync never blocks the user from finishing.
- After each submission, `updateSubjectAccuracy` recomputes the rolling average score across every quiz in that subject and writes it to `Progress.accuracy`.
- `GET /api/quiz/history` returns the 20 most recent attempts, which feed the sidebar's Pinned section and the search sheet.

**Entry points**

Sidebar Quiz item, Tools sheet ("Create practice test", "Create practice question"), the chat's follow-up chips, the progress screen's "Quiz me on these", the voice screen's "Quiz me on this lecture", and search results for past quizzes.

---

### 3.9 Progress and analytics

`mobile/src/app/(tabs)/progress.tsx`, backed by five endpoints.

**Three stat cards:** problems solved this week, overall accuracy, and current day streak.

**Daily streak calendar.**
Seven cells for the last seven days, checkmarked on days with activity, labelled with day letters derived from the actual dates.

**Accuracy by subject.**
Horizontal bars with per-subject colours (math blue `#2f80ed`, physics purple `#7b61d9`, chemistry green `#3f9e6b`, accounting amber `#d99a3f`) and a percentage readout.

**Needs work.**
Topics from the last seven days scoring under 60%, sorted worst-first and capped at five, each with a percentage pill and a **Quiz me on these** button.

**Recent activity.**
The latest problems with a green check or red cross icon, the subject, the correct/incorrect/solved state, and relative time.

**Pull to refresh** re-fetches progress and resets recent problems to page one.

**Streak computation** (`backend/src/services/storage/neonStorage.ts`)

Unique calendar days are extracted from the user's `Problem` rows and walked backwards, counting consecutive days.
The streak resets to zero unless the most recent activity was today or yesterday.

**Endpoints**

| Endpoint | Returns |
| --- | --- |
| `GET /api/progress` | weekly problem count, overall accuracy, max streak, per-subject breakdown |
| `GET /api/progress/recent?page=N` | paginated problems, 10 per page, with `{page, limit, total, pages}` |
| `GET /api/progress/problem/:id` | one problem including its full answer, for reopening a chat |
| `GET /api/progress/weak-topics` | up to five sub-60% topics from the last seven days |
| `GET /api/progress/streak` | seven-day active/inactive calendar |

---

### 3.10 Search

`components/shared/SearchSheet.tsx` - a full-screen sheet with the search bar anchored at the bottom above the keyboard, autofocused on open.

- Searches solved problems by question text and topic, and quizzes by topic.
- Results show a title and a meta line (`Math · Integration by parts`, `Physics quiz · 78%`).
- Selecting a problem reopens it as a conversation; selecting a quiz opens the quiz window.
- Distinct empty states for "nothing typed yet" and "no matches for X".
- Reachable from the sidebar magnifier and from the chat overflow menu's **Find in chat**.

---

### 3.11 Navigation, library and overlays

**Tab bar is hidden.**
Navigation happens through the sidebar and the header's segmented control, because the quiz is a window rather than a destination.
The four routes are `index` (solver), `camera`, `voice` and `progress`, with a fade transition between them.

**Header** (`components/shared/AppHeader.tsx`)

A hamburger on the left, a Camera / Chat / Voice segmented control in the middle with a white active pill on a `#f1f2f5` track, and on the right either an **Upgrade** button or, once a chat has messages, compose and overflow buttons.

**Sidebar** (`components/shared/Sidebar.tsx`)

A 322 px left drawer containing:

- Brand row with the PiGPT logo and a search button.
- Nav: Solve, Camera, Voice, Quiz, Notes, Progress, with the active route highlighted.
- **Pinned:** the two most recent quizzes.
- **Recents:** recent problems with subject and relative time, each reopening the saved chat.
- Footer: a blue **Chat** button that clears the current thread and returns to the solver, plus a gear button.
- Refetches the library on every open, so a chat created since the last open shows up.

**Overlay system** (`store/uiStore.ts`, `hooks/useOverlayAnimation.ts`)

Seven overlays share one store: sidebar, tools, attach, quiz, search, notes and chat menu.
Opening any one closes the others and dismisses the keyboard first, so it never covers the bottom of the overlay.

The animation hook solves two ordering problems explicitly:

- The view must stay mounted while it animates *out*, so `mounted` remains true until the closing animation finishes.
- The view must already be mounted before it animates *in*, otherwise the value advances while nothing is on screen and the overlay appears already part-way open.

Mount and animation therefore live in separate effects.
Enter is 300 ms `ease-out-cubic`, exit is 220 ms `ease-in-cubic`, with a parallel scrim fade.

**`AppScreen`** hosts every overlay for whichever screen is mounted, keeping open state simple while still drawing above that screen's content.
Z-indices are layered deliberately: tools 70, attach 75, chat menu 78, sidebar 80, notes 82, quiz 85, recording sheet 90, search 95.

---

### 3.12 Attachments and worksheets

**Attach sheet** (the composer's `+`): Camera, Photos, Files.

**Tools sheet:** Math input keyboard, Choose a photo, Upload a worksheet, Scan a problem, Record a lecture, Create practice test, Create practice question.
Composer-bound tools are filtered out on screens that do not provide a handler for them, so the camera screen never offers "Math input keyboard".

**PDF worksheets** (`POST /api/upload`)

- `multer` with memory storage, so nothing touches disk.
- PDF MIME type only; anything else is rejected with 415.
- 10 MB size cap, rejected with 413.
- Text is extracted, whitespace-collapsed and truncated to 8,000 characters.
- An empty extraction returns 422.
- The extracted text is then submitted to the solver as "Please solve the following from my worksheet: ...".

---

### 3.13 Markdown and mathematical notation rendering

Model output arrives as markdown with TeX fragments mixed in.
Rendering that raw would leave `\n$\mathrm{...}$` visible on screen, so two utilities handle it.

**Block parser** (`utils/markdown.ts`) - React-free and unit-testable by design.
Supports `#`/`##`/`###` headings, bullet and numbered lists with one level of nesting, `---` rules, and paragraphs.
It normalises the literal two-character sequence `\n` that models frequently emit instead of a real newline, and preserves single newlines as line breaks so labelled fields do not merge into one run-on paragraph.

**TeX to Unicode** (`utils/latex.ts`) - there is no TeX engine in the app, so this converts the subset that actually appears in tutoring answers.

- Superscript and subscript mapping for digits, operators and common letters (`x^2` -> `x²`, `H_2O` -> `H₂O`).
- Roughly 120 symbol macros: the full Greek alphabet, `\int \iint \oint \sum \prod \infty \partial \nabla`, comparisons, arrows, set theory, logic, and function names.
- Group reading that honours nesting, so `\frac{a}{b}` and `\mathrm{...}` resolve correctly.
- Anything unmappable falls through unchanged rather than producing mangled output.

**Renderer** (`components/solver/Markdown.tsx`) splits inline text on `**bold**`, `*italic*` and `` `code` ``, then converts maths within each token, keeping the entire answer in one typeface.
An optional `mathColor` prop can tint maths spans.

---

## 4. API reference

Every route under `/api` requires a valid Clerk session.
`/health` is the only public endpoint.

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/health` | Liveness probe, returns `{status, timestamp}` |
| `GET` | `/api/auth/me` | The authenticated user id |
| `POST` | `/api/solve` | One-shot solve, returns parsed steps, final answer, tip, topic and raw text |
| `POST` | `/api/solve/stream` | NDJSON token stream |
| `POST` | `/api/quiz` | Generate a quiz |
| `POST` | `/api/quiz/submit` | Persist a completed quiz and recompute subject accuracy |
| `GET` | `/api/quiz/history` | The 20 most recent attempts |
| `GET` | `/api/progress` | Aggregate stats and per-subject breakdown |
| `GET` | `/api/progress/recent?page=N` | Paginated problem history |
| `GET` | `/api/progress/problem/:id` | One problem with its full answer |
| `GET` | `/api/progress/weak-topics` | Sub-60% topics from the last seven days |
| `GET` | `/api/progress/streak` | Seven-day activity calendar |
| `POST` | `/api/summarize` | Audio in, structured lecture summary out, saved as a Note |
| `POST` | `/api/transcribe` | Audio in, plain text out |
| `GET` | `/api/notes` | The 50 newest saved notes |
| `DELETE` | `/api/notes/:id` | Delete one note, scoped to the caller |
| `POST` | `/api/upload` | PDF in, extracted text out |

**Request limits enforced by Zod**

- Question: 1 to 5,000 characters.
- History: at most 20 turns.
- Quiz topic: 1 to 200 characters; question count 5 to 30.
- Quiz score: 0 to 100.
- Audio: 100 to 34,000,000 base64 characters, roughly 25 MB.
- Recording duration: 0 to 24 hours.

---

## 5. Data model

`backend/prisma/schema.prisma`, PostgreSQL on Neon, with a real SQL migration in `prisma/migrations/0_init/`.

### Enums

- `Subject`: `math`, `physics`, `chemistry`, `accounting`
- `GradeLevel`: `middle_school`, `high_school`, `ap_ib`, `university`, `self_study`
- `Difficulty`: `easy`, `medium`, `hard`

### Tables

**`User`** - mirrors Clerk, with `clerkId` as the source of truth.
Holds email, first and last name, grade level and a `Subject[]` array chosen during onboarding.
Every other table cascades on delete from here.

**`Problem`** - every question submitted to the solver.
Stores subject, question, the full answer, an extracted `topic` label, and a nullable `correct` flag.
Indexed on `userId`, `(userId, subject)`, `(userId, createdAt)` and `(userId, correct)`.
This table powers the progress tab, weak topics and the activity feed.

**`Progress`** - one row per user per subject, uniquely constrained on `(userId, subject)`.
Holds a 0-100 rolling accuracy, a consecutive-day streak and a lifetime `totalSolved` count.

**`Streak`** - one row per user, holding current streak, all-time longest, and `lastSolvedAt`.

**`Quiz`** - a completed attempt: subject, topic, difficulty, grade level, the question texts, a 0-100 score, an `isCustom` flag, and completion time.

**`QuizQuestion`** - the per-question breakdown intended for answer review: question text, four options as JSON, correct index, explanation, the user's answer and whether it was right.

**`Note`** - a saved lecture summary: title, summary body, `keyPoints[]`, `topics[]`, `followUps[]`, optional subject and recording duration.

### Seeding

`backend/scripts/seed.ts` populates the demo data that used to be hardcoded in the sidebar and progress screens.

```bash
npm run seed              # seeds every existing user
npm run seed -- user_xxx  # seeds one user, creating the row if needed
```

It is idempotent - it clears the seeded rows for that user first - and writes 12 problems spread across seven days, four quizzes, per-subject progress rows and a streak record.

---

## 6. The AI layer

### 6.1 Provider-neutral message shape

`backend/src/services/ai/types.ts` defines one shape that every controller builds against:

```ts
type AIPart =
  | { kind: "text";  text: string }
  | { kind: "image"; base64: string; mimeType: string }
  | { kind: "audio"; base64: string; mimeType: string }
```

Each adapter converts this into its own wire format, so a controller never needs to know which provider will serve it.

### 6.2 Routing

`provider.ts` picks a provider per request:

- **Audio -> Gemini.** OpenRouter rejects audio input without a credit balance (`402 "This request requires at least $0.50 in balance for audio"`).
- **Everything else -> OpenRouter,** on a free model.
- `AI_PROVIDER=gemini` forces every request through Gemini.

### 6.3 OpenRouter adapter

- OpenAI-compatible `/chat/completions`.
- The system prompt becomes a `system` message; images become `image_url` parts carrying `data:` URIs.
- A lone text part collapses to a plain string so simple turns stay simple.
- Streaming reads server-sent events, skipping `:` keep-alive comment lines and terminating on `data: [DONE]`.
  A malformed keep-alive does not kill the stream, but a real error carried in a payload does surface.
- Attribution headers (`HTTP-Referer`, `X-Title`) are sent for OpenRouter's dashboards.

### 6.4 Gemini adapter

- `@google/genai`, with the system prompt passed as `systemInstruction` and media as `inlineData` parts.
- Streaming sets `thinkingConfig: { thinkingLevel: LOW }`.
  Thinking runs before any text is emitted, so it directly sets time-to-first-token; LOW keeps step quality while roughly halving the wait before words appear.
- `gemini-2.5-flash` was retired for new API users and now 404s, so the default is `gemini-3.6-flash`, overridable via `GEMINI_MODEL`.

### 6.5 End-to-end smoke test

`backend/e2e.ts` exercises the whole AI path in one run: a text solve with parsed output, a stream with delta count and time-to-first-delta, an image request, and a quiz generation with JSON shape assertions.

---

## 7. Reliability, errors and security

**Rate limiting** (`middleware/rateLimit.ts`)
Fixed window per client IP, resolved from `x-forwarded-for` and falling back to the socket address.
Defaults to 100 requests per 60 s, configurable.
Returns 429 with a `Retry-After` header, and expired entries are pruned every minute.
It is in-process, so it resets on deploy and is not shared across replicas.

**Error handling** (`middleware/errorHandler.ts`)

| Condition | Status | Behaviour |
| --- | --- | --- |
| Provider quota or rate limit | 429 | Plain-language message explaining the free tier limit |
| Non-PDF upload | 415 | "Only PDF files are supported" |
| Oversized upload | 413 | "File exceeds 10 MB limit" |
| Zod validation failure | 400 | Flattened field errors |
| Upstream AI failure | 503 | "AI service temporarily unavailable" |
| Anything else | 500 | Generic message, with `detail` only in development |

**CORS** (`middleware/cors.ts`)
A native app sends no `Origin` header, so requests from the iOS and Android builds are always allowed.
The `CORS_ORIGINS` allow-list only constrains browsers, and only in production.
A warning is logged at boot if production starts with an empty list.

**Client-side**

- The axios response interceptor converts server errors into readable `Error` messages before they reach the UI.
- An `ErrorBoundary` component and an `EmptyState` component cover render failures and blank states.
- Store fetches that are non-critical (weak topics, streak calendar, recent problems) swallow their errors rather than blanking the screen.
- The library store uses `Promise.allSettled`, so one failing endpoint does not empty the other two sections.

---

## 8. Design system

`mobile/src/constants/theme.ts` holds tokens taken verbatim from the PiGPT design canvas, so screens can be checked against the spec.
Light mode only, no emoji, per the design's own note.

- **Primary blue** `#2f80ed`, with dimmed variants for pre-enabled CTAs (`#a9bdea`) and the empty send button (`#c4d9f6`).
- **Ink ramp:** `#0b0d12` -> `#15181f` -> `#2b3140` -> `#3c4149` -> `#5b6069`.
- **Muted ramp:** `#6b7280` -> `#8b9099` -> `#9aa0a8` -> `#b6bac0`.
- **Surfaces:** white, canvas `#f7f8fa`, chip track `#f1f2f5`, tint backgrounds `#f4f9ff` / `#e8f1fe` / `#f2f7ff`.
- **Semantic:** good `#4caf72`, bad `#d9705a`, each with a background and a foreground variant.
- **Radii:** option 14, card 16, cardLg 18, bubble 18, pill 26, sheet 22.
- **Georgia italic** for every piece of maths, kept in one `SERIF` constant, which is what gives equations their textbook look.

**Icons** - 42 stroked SVG glyphs authored as path data in `components/ui/Icon.tsx`.
Circles and rounded rects are written as arc paths so a single renderer covers every glyph.

**Primitive components** (`components/ui/`) - `Button` (four variants, loading state), `Card`, `Badge` (five colours), `ProgressBar` (animated), `Skeleton` (pulsing), `Avatar`, `BottomSheet`, `Logo`, `Icon`.
These are built with styled-components against `constants/colors.ts`.

`tailwind.config.js` mirrors `constants/colors.ts`, so Tailwind classes and styled-components resolve to the same palette.

---

## 9. Configuration

### Backend environment (`backend/.env.example`)

Validated by Zod at boot. The process exits and prints exactly what is wrong if a required variable is missing.

**Required**

| Variable | Purpose |
| --- | --- |
| `DIRECT_URL` | Neon connection string including `?sslmode=require` |
| `GEMINI_API_KEY` | Google AI Studio key, used for audio |
| `OPENROUTER_API_KEY` | OpenRouter key, used for text and images |
| `CLERK_SECRET_KEY` | Clerk backend key |
| `CLERK_PUBLISHABLE_KEY` | Clerk publishable key |

**Optional, with defaults**

| Variable | Default |
| --- | --- |
| `GEMINI_MODEL` | `gemini-3.6-flash` |
| `OPENROUTER_MODEL` | `nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free` |
| `AI_PROVIDER` | unset; set to `gemini` to force all traffic through Gemini |
| `PORT` | `3000` |
| `NODE_ENV` | `development` (enables Prisma query logging, verbose error detail, permissive CORS) |
| `CORS_ORIGINS` | empty |
| `RATE_LIMIT_MAX` | `100` |
| `RATE_LIMIT_WINDOW_MS` | `60000` |

### Mobile environment (`mobile/.env.example`)

Only `EXPO_PUBLIC_*` variables reach the bundle, and everything here ships inside it, so no secret belongs in this file.

| Variable | Notes |
| --- | --- |
| `EXPO_PUBLIC_API_URL` | On a physical device this must be the machine's LAN IP, not localhost, with the phone on the same network |
| `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` | Must come from the same Clerk instance as the backend secret key |

### Commands

From the repo root:

```bash
npm run setup    # install both packages
npm run api      # backend dev server with watch
npm start        # Expo dev server
npm run ios      # Expo on iOS
npm run android  # Expo on Android
npm run seed     # seed demo data
npm run lint     # lint the mobile app
```

---

## 10. Deployment

`DEPLOY.md` documents the free path in full. In summary:

1. **Enable Gemini billing.** The free tier allows 20 requests per day, which is not enough to use the app at all. Flash models are inexpensive per token, but the current rates should be checked rather than assumed.
2. **Deploy the API to Render** via the `render.yaml` blueprint. Fill in the four secrets Render marks required, then confirm `/health` returns `{"status":"ok"}`. Build runs `npm ci && npm run build`; start runs `prisma migrate deploy` before booting, so schema changes apply on every deploy.
3. **Point the app at the API** by editing `EXPO_PUBLIC_API_URL` in the `preview` profile of `eas.json`. The Clerk key goes in as an EAS secret rather than into the file.
4. **Build an Android APK** with `eas build --profile preview --platform android`. The preview profile is already set to produce an APK rather than an AAB, which is what allows direct install without a store.

**Known constraints of the free path**

- Free Render services sleep after about 15 minutes of inactivity, and the next request waits roughly a minute while the service wakes. For a chat app that first request feels broken even though it is not. The paid instance removes this without any code change.
- No iOS distribution without the Apple developer account.
- No public listing and no automatic updates, although `eas update` can push JavaScript-only changes over the air for free.

**Before a real release**

- Clerk is on test keys (`pk_test_` / `sk_test_`), which have strict limits. Swap to a production instance.
- Rate limiting is in-process and resets on deploy. Move it to Redis before scaling past one instance.
- `CORS_ORIGINS` is empty, which is correct while only the mobile app calls the API, but must be set if a web client is ever added.

---

## 11. Known gaps and unwired surfaces

These are accurate observations about the current code, listed so nothing in this document reads as more complete than it is.

**Accuracy is not driven by solves.**
Nothing ever sets `Problem.correct` - there is no endpoint to mark an answer right or wrong.
`upsertProgress` computes accuracy from graded problems only, so with none graded it writes `0` and overwrites whatever the quiz path had stored.
In practice a solve performed after a quiz resets that subject's accuracy to zero.
Weak topics has the same root cause: every topic computes to 0% accuracy, so the list is either empty or shows everything at 0%.

**`pdf-parse` is not installed.**
`uploadController.ts` calls `require("pdf-parse")` but the package is absent from `backend/package.json` and from `node_modules`.
PDF worksheet upload will throw at runtime until it is added.

**Unused schema.**
`QuizQuestion` is defined with indexes and a foreign key but nothing writes it, so per-question answer review is not yet possible.
`Streak` is written only by the seed script; the live streak shown in the UI is derived from `Problem` rows instead.

**Dead file.**
`backend/src/utils/validators.ts` imports from `hono`, which is not this project's framework, and nothing imports it.

**Presentational controls.**
The chat overflow menu's Share, Pin, Uploaded files and Archive rows close the sheet without doing anything.
The header's **Upgrade** button has no billing behind it.
The sidebar's gear button closes the drawer rather than opening settings.

**Quiz UI does not expose the full API.**
The backend accepts a free-text topic, three difficulty levels and 5 to 30 questions, but the sheet always requests medium difficulty and five questions on a per-subject default topic.
`Quiz.isCustom` and `Quiz.gradeLevel` are never set to anything but their defaults.

**Statistics is not a real subject.**
It appears in onboarding and on the camera chips but maps onto `math` on the way to the API, because the `Subject` enum has no statistics value.

**Placeholders.**
`eas.json` still contains `https://REPLACE-WITH-YOUR-API.example.com` in the preview and production profiles, and `mobile/README.md` is still the unmodified Expo template.

**Onboarding answers are partly device-only.**
`goal` and `source` have no column in the schema and never leave the phone, so they are lost if the app is reinstalled and are not available for analytics.
