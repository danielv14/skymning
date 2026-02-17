# Skymning - Feature Ideas & Improvements

> Generated 2026-02-15 after a deep scan of the full codebase.

---

## Quick Wins (Small effort, big impact)

### 1. Search in reflections

Add full-text search across all entries. Users accumulate hundreds of reflections over time - being able to search for "jobbet", "huvudvärk" or "semester" would make the journal much more useful as a personal knowledge base.

**Implementation:** New server function with `LIKE` query on `entries.summary`, simple search bar on a new `/search` route or integrated into the dashboard.

---

### 2. Entry count milestone card

Show a celebratory card on the dashboard every 10th reflection (10, 20, 30, ...). A small recognition of consistency that appears on the day you hit the milestone.

**Implementation:** Check count after `createEntry`, show a special dashboard card that day. Could use the existing milestone pattern from `StreakCard`.

---

### 3. Improved time-of-day greeting

`getTimeOfDayGreeting()` already exists but could include mood-aware greetings. If yesterday was a rough day, a gentler "Hoppas idag blir bättre" touch.

**Implementation:** Pass yesterday's mood into the greeting function. Small but thoughtful UX improvement.

---

## Medium Features (A few hours to a day)

### 4. Yearly review ("Wrapped")

A Spotify Wrapped-style year-in-review page. Show total entries, average mood, best month, worst month, longest streak, most common themes (from AI), mood distribution pie chart, and a generated "letter from the year."

**Implementation:** New `/year/$year` route with dedicated server function that aggregates all yearly data. AI generates a personalized narrative summary. Could include animated reveal cards.

---

### 5. Gratitude tracking

Add an optional "Tre bra saker idag" (three good things) field alongside mood and summary. Gratitude journaling is one of the most evidence-backed wellbeing interventions.

**Implementation:**

- Add `gratitude` TEXT column to entries (store as JSON array or newline-separated)
- Optional input in both reflection flows
- Show gratitude items on entry cards
- AI can reference gratitude patterns in insights

---

### 6. Custom reflection prompts

Instead of the same open-ended AI conversation, offer themed prompts: "Vad är du tacksam för?", "Vad lärde du dig idag?", "Beskriv ett ögonblick av glädje". Rotate daily or let users choose.

**Implementation:**

- Array of prompt templates in constants
- Pass selected prompt as system context to reflection chat
- Option to "Byt fråga" before starting

---

### 7. AI follow-up questions

After saving an entry, the AI could suggest a follow-up question for tomorrow based on what was discussed. "Imorgon kanske du vill reflektera över hur mötet gick?"

**Implementation:** Generate follow-up in `generateDaySummary`, store in a new `followUp` column on entries, show as a gentle nudge next day.

---

### 8. Pinned/starred entries

Let users mark certain entries as important - moments they want to revisit. Show a "Starred" section on the dashboard or a dedicated view.

**Implementation:** Add boolean `starred` column to entries. Star icon on entry cards. Filter view for starred entries.

---

## Ambitious Features (Multi-day effort, high impact)

### 9. Sleep & energy tracking

Add optional daily metrics: sleep hours (slider 0-12) and energy level (1-5). These are the strongest predictors of mood and would make insights dramatically more useful.

**Implementation:**

- Add `sleepHours` (real) and `energyLevel` (integer) columns to entries
- Optional sliders in reflection completion modal
- Correlation analysis in insights
- New dashboard card: "Sleep-mood connection"

---

### 10. Time capsule reflections

Write a reflection addressed to your future self. Set a date (1 month, 3 months, 1 year) when it unlocks. "Öppna om 3 månader."

**Implementation:**

- New `timeCapsules` table (content, createdAt, unlockDate, opened)
- Write interface accessible from dashboard
- Notification-style card when a capsule is ready to open
- Beautiful reveal animation

---

### 11. AI-suggested activities

When mood dips, suggest activities that have historically correlated with better mood. "Förra gången du kände så här hjälpte det att träna" - based on patterns in actual reflections.

**Implementation:**

- Extract activities from entry summaries using AI
- Build activity-mood correlation model
- Show suggestions as gentle nudges when mood is low
- "Saker som brukar hjälpa dig" card on dashboard

---

### 12. Multi-dimensional mood tracking

Instead of a single 1-5 scale, track multiple dimensions: energy (low-high), pleasantness (unpleasant-pleasant), stress (calm-stressed). This maps to the circumplex model of affect used in psychology.

**Implementation:**

- New columns or JSON field for dimensions
- Radar chart visualization
- Richer insight analysis
- Keep simple 1-5 as default, dimensions as opt-in advanced mode

---

## UX & Polish

### 13. Richer empty states

Empty states currently show generic text. Each empty state could have unique, encouraging copy and a relevant illustration or animation.

**Implementation:** Custom empty state components per context (no entries yet, no insights yet, empty week, etc).

---

### 14. Haptic feedback on mobile

Add subtle vibration feedback when selecting mood, saving entries, hitting streaks. Small detail that makes the app feel premium on mobile.

**Implementation:** `navigator.vibrate()` calls on key interactions. Check for API support first.

---

### 15. Animated mood transitions

When navigating between days in timeline, animate the mood emoji transitioning from one state to another. Subtle morphing animation.

**Implementation:** CSS transitions between mood states. Framer Motion or CSS keyframes for emoji/icon morphing.

---

### 16. User context staleness reminder

Add an `updatedAt` timestamp to the `userContext` table. If it's been more than ~30 days since the user last updated their personal context ("Om mig"), show a gentle reminder card on the dashboard encouraging them to review it. Life changes and the AI context should keep up.

**Implementation:**

- Add `updatedAt` TEXT column to `userContext` (set on save)
- New server function to check staleness (e.g. > 30 days since last update)
- Dashboard card: "Det var ett tag sedan du uppdaterade din beskrivning — stämmer den fortfarande?"
- Card links to the user context settings page
- Dismiss option so it doesn't nag

---

### 17. "On this day" memories

Show what you reflected on exactly 1 week, 1 month, or 1 year ago. Nostalgia is a powerful engagement driver.

**Implementation:** Query entries for matching dates. Show as a dashboard card: "En vecka sedan skrev du..."

---

## Technical Improvements

### 18. Better error boundaries

Add React error boundaries around each major section (dashboard cards, timeline, etc.) so a single component failure doesn't crash the whole page.

**Implementation:** `ErrorBoundary` components with friendly fallback UI per section.

---

### 19. Database indexes for performance

As entries grow into hundreds/thousands, queries like streak calculation and mood trends could slow down. Add indexes on commonly queried columns.

**Implementation:** Add indexes on `entries.date`, `chatMessages.date`, `weeklySummaries(year, week)` in schema.

---

### 20. Rate limit persistence

Current rate limiting is in-memory and resets on Worker cold-start. Use D1 or KV for persistent rate limiting.

**Implementation:** Store rate limit data in D1 or Cloudflare KV. More robust against cold starts.

---

### 21. E2E tests

No end-to-end tests exist. Playwright tests for critical flows (login, create entry, view timeline) would catch regressions.

**Implementation:** Add Playwright setup, write tests for: login flow, chat reflection, quick entry, timeline navigation, monthly view.

---

## Wild Ideas

### 22. Mood music

Generate or suggest a Spotify playlist based on your current mood. "Din dag låter som..." with a curated mix.

---

### 23. AI art for your day

Generate a small abstract image that represents your day's reflection. Use DALL-E or Stable Diffusion. Each day gets a unique visual.

---

### 24. Physical journal export

Generate a beautifully formatted PDF of a month/year's reflections, designed for printing and binding as a physical journal.

---

### 25. AI therapist mode

A deeper, more structured conversation mode based on CBT (cognitive behavioral therapy) principles. Identify cognitive distortions, challenge negative thinking patterns, guided exercises.

> **Note:** This needs careful ethical consideration and clear disclaimers that it's not a replacement for professional help.
