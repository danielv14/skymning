# Skymning - Feature Ideas & Improvements

> Generated 2026-02-15 after a deep scan of the full codebase.

---

## Quick Wins (Small effort, big impact)

### 1. Search in reflections
Add full-text search across all entries. Users accumulate hundreds of reflections over time - being able to search for "jobbet", "huvudvärk" or "semester" would make the journal much more useful as a personal knowledge base.

**Implementation:** New server function with `LIKE` query on `entries.summary`, simple search bar on a new `/search` route or integrated into the dashboard.

---

### 2. Streak record (all-time best)
The streak card only shows the current streak. Showing "Personal best: 47 days" alongside the current streak adds long-term motivation.

**Implementation:** Calculate max consecutive streak in `getStreak()` and return both `current` and `allTimeBest`. Minimal DB change - can be computed from existing data.

---

### 3. Mood-only quick entry
Sometimes you just want to log your mood without writing anything. Currently both `/reflect` and `/quick` require a summary.

**Implementation:** Make `summary` optional in `createEntry`. Show a "Bara humör idag" button on the dashboard that opens a minimal mood picker modal.

---

### 4. Entry count milestone celebrations
Show a toast or small animation when hitting entry milestones (10, 25, 50, 100, 200, 365 entries). Similar to how streak milestones work but for total volume.

**Implementation:** Check count after `createEntry`, show confetti or special toast. Could use the existing milestone pattern from `StreakCard`.

---

### 5. Improved time-of-day greeting
`getTimeOfDayGreeting()` already exists but could include mood-aware greetings. If yesterday was a rough day, a gentler "Hoppas idag blir bättre" touch.

**Implementation:** Pass yesterday's mood into the greeting function. Small but thoughtful UX improvement.

---

### 6. Keyboard shortcuts
Add global keyboard shortcuts: `N` for new reflection, `Q` for quick entry, `T` for timeline, `/` for search (if implemented).

**Implementation:** Global `useEffect` with keydown listener on protected layout.

---

### 7. Share insight as image
Let users long-press/click an insight card to generate a shareable image (canvas-rendered card with the insight text, no personal data).

**Implementation:** Use html-to-canvas or a simple SVG template. Good for social sharing without exposing journal content.

---

## Medium Features (A few hours to a day)

### 8. Tagging system
Let users tag entries with custom labels like `#arbete`, `#träning`, `#familj`, `#sömn`. Tags become filterable and searchable, and AI insights could correlate tags with mood patterns.

**Implementation:**
- New `tags` table (id, name) + `entryTags` junction table (entryId, tagId)
- Tag input in both `/reflect` completion modal and `/quick` entry
- Tag filter on timeline/search
- Feed tags into insight prompt for richer analysis

---

### 9. Yearly review ("Wrapped")
A Spotify Wrapped-style year-in-review page. Show total entries, average mood, best month, worst month, longest streak, most common themes (from AI), mood distribution pie chart, and a generated "letter from the year."

**Implementation:** New `/year/$year` route with dedicated server function that aggregates all yearly data. AI generates a personalized narrative summary. Could include animated reveal cards.

---

### 10. Export & backup
Allow users to export all their data as JSON or Markdown. Important for data ownership and peace of mind.

**Implementation:** Server function that queries all entries + summaries, formats as JSON/MD, returns as downloadable file. Add button in `/about-me`.

---

### 11. Gratitude tracking
Add an optional "Tre bra saker idag" (three good things) field alongside mood and summary. Gratitude journaling is one of the most evidence-backed wellbeing interventions.

**Implementation:**
- Add `gratitude` TEXT column to entries (store as JSON array or newline-separated)
- Optional input in both reflection flows
- Show gratitude items on entry cards
- AI can reference gratitude patterns in insights

---

### 12. Custom reflection prompts
Instead of the same open-ended AI conversation, offer themed prompts: "Vad är du tacksam för?", "Vad lärde du dig idag?", "Beskriv ett ögonblick av glädje". Rotate daily or let users choose.

**Implementation:**
- Array of prompt templates in constants
- Pass selected prompt as system context to reflection chat
- Option to "Byt fråga" before starting

---

### 13. Comparison view: this week vs last week
Side-by-side comparison of this week's entries vs last week. Show mood trends, entry completion, and summary differences.

**Implementation:** New component on timeline page. Reuse existing `getEntriesForWeek` for both weeks, display in two-column layout.

---

### 14. Entry for specific past dates (calendar picker)
Currently limited to 5 days back. Allow users to fill in any past date via a calendar date picker. Useful for catching up after vacation.

**Implementation:** Replace the hardcoded `MAX_DAYS_TO_FILL_IN` limit with a date picker component. Keep a reasonable limit (e.g. 30 days) to prevent abuse.

---

### 15. Reading time & word count stats
Show small metadata on entries: word count, average response length over time. Helps users see how their reflection depth changes.

**Implementation:** Calculate on the fly from `summary.split(' ').length`. Show in timeline items and monthly stats.

---

### 16. AI follow-up questions
After saving an entry, the AI could suggest a follow-up question for tomorrow based on what was discussed. "Imorgon kanske du vill reflektera över hur mötet gick?"

**Implementation:** Generate follow-up in `generateDaySummary`, store in a new `followUp` column on entries, show as a gentle nudge next day.

---

### 17. Pinned/starred entries
Let users mark certain entries as important - moments they want to revisit. Show a "Starred" section on the dashboard or a dedicated view.

**Implementation:** Add boolean `starred` column to entries. Star icon on entry cards. Filter view for starred entries.

---

### 18. Dark/light theme toggle
The app is permanently dark. Some users prefer light mode, especially during daytime. The aurora aesthetic could work beautifully in light mode with softer gradients.

**Implementation:** CSS custom properties already in use - add a light theme variant. Toggle in `/about-me` or header. Store preference in `userContext`.

---

## Ambitious Features (Multi-day effort, high impact)

### 19. Weather-mood correlation
Automatically fetch weather data for the user's location and correlate it with mood. "Du mår ofta bättre på soliga dagar" is a powerful insight.

**Implementation:**
- Store weather data (temp, conditions) alongside entries
- Use a free weather API (OpenWeatherMap) with geolocation
- Add weather to insight analysis prompt
- Show weather icon on calendar heatmap cells

---

### 20. Sleep & energy tracking
Add optional daily metrics: sleep hours (slider 0-12) and energy level (1-5). These are the strongest predictors of mood and would make insights dramatically more useful.

**Implementation:**
- Add `sleepHours` (real) and `energyLevel` (integer) columns to entries
- Optional sliders in reflection completion modal
- Correlation analysis in insights
- New dashboard card: "Sleep-mood connection"

---

### 21. AI "letter to yourself"
Once a month (or on demand), the AI writes a compassionate letter to the user based on the month's reflections. Personal, warm, acknowledging struggles and celebrating wins.

**Implementation:** New prompt template + generation function. Could be triggered from monthly overview page. Store as a special type of monthly summary or separate table.

---

### 22. Mood predictions
Based on historical patterns, predict tomorrow's likely mood. "Baserat på att det är måndag och du sovit lite brukar du ligga runt 3.2." Show as a gentle forecast, not a prescription.

**Implementation:**
- Analyze weekday patterns + recent trend
- Simple weighted average model (no ML needed)
- Show on dashboard as "Morgondagens prognos" with weather-metaphor icon
- Compare prediction to actual outcome over time

---

### 23. Time capsule reflections
Write a reflection addressed to your future self. Set a date (1 month, 3 months, 1 year) when it unlocks. "Öppna om 3 månader."

**Implementation:**
- New `timeCapsules` table (content, createdAt, unlockDate, opened)
- Write interface accessible from dashboard
- Notification-style card when a capsule is ready to open
- Beautiful reveal animation

---

### 24. Progressive Web App (PWA) with notifications
Convert to installable PWA with push notifications for daily reflection reminders. "Dags att reflektera!" at the user's preferred time.

**Implementation:**
- Add service worker + web manifest
- Push notification subscription via Web Push API
- Notification time preference in settings
- Basic offline support (read cached entries)

---

### 25. Voice journaling
Let users speak their reflection instead of typing. Transcribe with Whisper API, then process as normal chat.

**Implementation:**
- MediaRecorder API for audio capture
- Send to OpenAI Whisper for transcription
- Feed transcript into existing chat/summary pipeline
- Show waveform visualization during recording

---

### 26. Seasonal & cyclical pattern detection
Go beyond weekday patterns - detect seasonal mood changes (SAD patterns), monthly cycles, holiday effects, and long-term trends over months/years.

**Implementation:**
- Extend insights prompt with seasonal awareness
- Need 3+ months of data for meaningful seasonal analysis
- New visualization: mood over months (line chart with seasonal overlay)
- Could detect "Du mår ofta sämre i november" type insights

---

### 27. AI-suggested activities
When mood dips, suggest activities that have historically correlated with better mood. "Förra gången du kände så här hjälpte det att träna" - based on patterns in actual reflections.

**Implementation:**
- Extract activities from entry summaries using AI
- Build activity-mood correlation model
- Show suggestions as gentle nudges when mood is low
- "Saker som brukar hjälpa dig" card on dashboard

---

### 28. Multi-dimensional mood tracking
Instead of a single 1-5 scale, track multiple dimensions: energy (low-high), pleasantness (unpleasant-pleasant), stress (calm-stressed). This maps to the circumplex model of affect used in psychology.

**Implementation:**
- New columns or JSON field for dimensions
- Radar chart visualization
- Richer insight analysis
- Keep simple 1-5 as default, dimensions as opt-in advanced mode

---

### 29. Relationship mapping
Track who you spent time with (optional mentions in reflections or explicit tags). Over time, show which relationships correlate with different moods. Sensitive feature - frame carefully.

**Implementation:**
- Extract person mentions from reflections (AI-powered)
- Or manual "Idag var jag med..." multi-select
- Relationship-mood correlation in insights
- Privacy-first: all data stays local

---

## UX & Polish

### 30. Onboarding tour
New users see an empty dashboard with a welcome screen, but there's no guided tour explaining the different features. A 3-4 step tooltip tour would help.

**Implementation:** Lightweight tooltip overlay. Track completion in `userContext` or localStorage.

---

### 31. Richer empty states
Empty states currently show generic text. Each empty state could have unique, encouraging copy and a relevant illustration or animation.

**Implementation:** Custom empty state components per context (no entries yet, no insights yet, empty week, etc).

---

### 32. Haptic feedback on mobile
Add subtle vibration feedback when selecting mood, saving entries, hitting streaks. Small detail that makes the app feel premium on mobile.

**Implementation:** `navigator.vibrate()` calls on key interactions. Check for API support first.

---

### 33. Entry edit history
Track when entries were edited. Show a small "Redigerad" badge. Optionally show diff of changes.

**Implementation:** Add `updatedAt` column to entries. Simple badge display. Full history would need a separate `entryHistory` table.

---

### 34. Customizable dashboard layout
Let users choose which cards to show and in what order. Some might not care about streaks but love the weekday patterns.

**Implementation:** Store layout preferences in `userContext` as JSON. Drag-and-drop or simple toggle list in settings.

---

### 35. Animated mood transitions
When navigating between days in timeline, animate the mood emoji transitioning from one state to another. Subtle morphing animation.

**Implementation:** CSS transitions between mood states. Framer Motion or CSS keyframes for emoji/icon morphing.

---

### 36. "On this day" memories
Show what you reflected on exactly 1 week, 1 month, or 1 year ago. Nostalgia is a powerful engagement driver.

**Implementation:** Query entries for matching dates. Show as a dashboard card: "En vecka sedan skrev du..."

---

## Technical Improvements

### 37. Optimistic UI updates
Entry creation and edits could use optimistic updates - show the result immediately while the server processes in the background. Makes the app feel instant.

**Implementation:** TanStack's mutation API with optimistic updates. Rollback on failure.

---

### 38. Better error boundaries
Add React error boundaries around each major section (dashboard cards, timeline, etc.) so a single component failure doesn't crash the whole page.

**Implementation:** `ErrorBoundary` components with friendly fallback UI per section.

---

### 39. Database indexes for performance
As entries grow into hundreds/thousands, queries like streak calculation and mood trends could slow down. Add indexes on commonly queried columns.

**Implementation:** Add indexes on `entries.date`, `chatMessages.date`, `weeklySummaries(year, week)` in schema.

---

### 40. Rate limit persistence
Current rate limiting is in-memory and resets on Worker cold-start. Use D1 or KV for persistent rate limiting.

**Implementation:** Store rate limit data in D1 or Cloudflare KV. More robust against cold starts.

---

### 41. E2E tests
No end-to-end tests exist. Playwright tests for critical flows (login, create entry, view timeline) would catch regressions.

**Implementation:** Add Playwright setup, write tests for: login flow, chat reflection, quick entry, timeline navigation, monthly view.

---

### 42. Accessibility audit
The app uses semantic HTML and focus styles, but a proper screen reader audit would likely reveal gaps. ARIA labels on mood selectors, chart descriptions, etc.

**Implementation:** Audit with axe-core, fix issues. Add `aria-label` to icon-only buttons, mood color descriptions for screen readers.

---

## Wild Ideas

### 43. Mood music
Generate or suggest a Spotify playlist based on your current mood. "Din dag låter som..." with a curated mix.

---

### 44. AI art for your day
Generate a small abstract image that represents your day's reflection. Use DALL-E or Stable Diffusion. Each day gets a unique visual.

---

### 45. Collaborative journaling
Invite a partner or close friend to share selective insights (not full entries). See mood trends together. "Ni mår bättre samma dagar."

---

### 46. Physical journal export
Generate a beautifully formatted PDF of a month/year's reflections, designed for printing and binding as a physical journal.

---

### 47. Mood map
If location data is available, show a map of where you tend to be happiest. Heatmap overlay on a city map.

---

### 48. AI therapist mode
A deeper, more structured conversation mode based on CBT (cognitive behavioral therapy) principles. Identify cognitive distortions, challenge negative thinking patterns, guided exercises.

> **Note:** This needs careful ethical consideration and clear disclaimers that it's not a replacement for professional help.
