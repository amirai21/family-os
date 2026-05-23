# Family OS — Test Catalog

A line-item record of every test executed in the QA pass of 2026-05-23, plus the
catalogue of features that already work correctly (either verified now or fixed
in earlier sessions per the CLAUDE.md session log).

For full bug reproduction steps and code references see [QA_REPORT.md](QA_REPORT.md).

---

## 1. Tests executed

### 1.1 Authentication & Onboarding (Phase 1)

| # | Test | Platform | Result |
|---|---|---|---|
| 1.1.1 | Login screen renders correctly when no session exists | Web | PASS |
| 1.1.2 | Validation hints stay hidden until user starts typing | Web | PASS (visual); FAIL (a11y — see [BUG #13](QA_REPORT.md#bug-13--hidden-helper-text-still-announced)) |
| 1.1.3 | Short username (<3 chars) triggers inline error, button stays disabled | Web | PASS |
| 1.1.4 | Short password (<4 chars) triggers inline error, button stays disabled | Web | PASS |
| 1.1.5 | Wrong password returns "סיסמה שגויה" — no crash | Web | PASS |
| 1.1.6 | Correct credentials → login + pullAll + Today screen | Web | PASS |
| 1.1.7 | Duplicate username on register returns 409 + "שם המשתמש תפוס" | Web | PASS |
| 1.1.8 | Hebrew characters accepted in username, password, family name | Web | PASS |
| 1.1.9 | Mixed Hebrew + Latin family name renders | Web | PASS with caveat — see [BUG #10](QA_REPORT.md#bug-10--bidi-mixed-family-name-renders-awkwardly) |
| 1.1.10 | Fresh registration with new username → onboarding wizard step 2 | Web | PASS (step 1 auto-skipped after register, per CLAUDE.md fix) |
| 1.1.11 | Refresh browser mid-wizard preserves wizard state | Web | PASS |
| 1.1.12 | Wizard step 2 (Self) — name, role, emoji, color save correctly | Web | PASS |
| 1.1.13 | Wizard step 2 (Partner sub-step) — can skip with "Next" | Web | PASS |
| 1.1.14 | Wizard step 3 (Kids) — initial state opens the add-kid form unprompted | Web | FAIL — see [BUG #4](QA_REPORT.md#bug-4--onboarding-wizard-step-3-opens-the-kid-form-immediately) |
| 1.1.15 | Wizard step 3 — cancel kid-entry shows cleaner "+ הוסף ילד/ה" CTA | Web | PASS |
| 1.1.16 | Wizard step 3 — skip with zero kids | Web | FAIL — see [BUG #3](QA_REPORT.md#bug-3--wizard-blocks-progress-without-a-kid) |
| 1.1.17 | Wizard step 4 (Invite) — three-button row layout (חזרה / אעשה אחר כך / הבא) | Web | FAIL — see [BUG #15](QA_REPORT.md#bug-15--bottom-button-row-cramped-in-wizard-step-4) |
| 1.1.18 | Wizard step 5 (Telegram) — "סיום" exits wizard to Today | Web | PASS |
| 1.1.19 | Step indicator dots advance right→left correctly (RTL) | Web | PASS |
| 1.1.20 | New family lands on Today with empty state "אין אירועים להיום" | Web | PASS |

### 1.2 Session handling (Phase 2)

| # | Test | Platform | Result |
|---|---|---|---|
| 1.2.1 | Logout → returns to login screen | Web | PASS |
| 1.2.2 | After logout, `family-os-store-v2` is reset to empty defaults | Web | PASS |
| 1.2.3 | After logout, `familyos_auth_session` is removed | Web | PASS |
| 1.2.4 | Browser refresh on a nested route (`/calendar`) keeps you logged in and on that route | Web | PASS |
| 1.2.5 | Login user A → logout → login user B → no user-A data visible | Web | PASS — no leak |
| 1.2.6 | Two browser tabs simultaneously editing | Web | NOT RUN — single browser context |

### 1.3 Multi-Member Sync (Phase 3)

NOT RUN this pass. Single browser context can't host two simultaneous user
sessions. Refer to the **Two-Member QA Flow** in CLAUDE.md and run manually.

### 1.4 Offline / network flapping (Phase 4)

NOT RUN. Android-only; deferred to the user.

### 1.5 RTL (Phase 5)

| # | Test | Platform | Result |
|---|---|---|---|
| 1.5.1 | Login screen Hebrew text right-aligned | Web | PASS |
| 1.5.2 | Today screen Hebrew text + emoji icons render correctly | Web | PASS |
| 1.5.3 | Grocery row labels right-aligned, categories on right | Web | PASS |
| 1.5.4 | Grocery quantity bidi rendering ("x3" vs "3x") | Web | FAIL — see [BUG #11](QA_REPORT.md#bug-11--bidi-quirk-in-grocery-quantity-display) |
| 1.5.5 | Home screen kid cards right-aligned, chevron mirroring | Web | PASS |
| 1.5.6 | Settings family-member rows right-aligned | Web | PASS |
| 1.5.7 | Settings "admin" role label appears in English | Web | FAIL — see [BUG #5](QA_REPORT.md#bug-5--english-admin-string-in-settings) |
| 1.5.8 | Calendar Month view — day headers right-to-left order | Web | PASS |
| 1.5.9 | Calendar Day view — hour axis on the right | Web | FAIL — see [BUG #6](QA_REPORT.md#bug-6--calendar-rtl-hour-axis-on-the-wrong-side) (axis is on the LEFT) |
| 1.5.10 | Calendar Week view — hour axis on the right | Web | FAIL (same root cause as 1.5.9) |
| 1.5.11 | Calendar Week view — event titles fit in column | Web | FAIL — see [BUG #7](QA_REPORT.md#bug-7--week-view-event-titles-truncate-to-a-single-character) |
| 1.5.12 | Onboarding wizard step indicator advances right→left | Web | PASS |
| 1.5.13 | Family badge with Hebrew + Latin chars renders sanely | Web | FAIL — see [BUG #10](QA_REPORT.md#bug-10--bidi-mixed-family-name-renders-awkwardly) |

### 1.6 Modal stress (Phase 6)

| # | Test | Platform | Result |
|---|---|---|---|
| 1.6.1 | Grocery add modal opens and accepts input | Web | PASS |
| 1.6.2 | 5× rapid click on Save creates 5 duplicates locally | Web | FAIL — see [BUG #2](QA_REPORT.md#bug-2--rapid-modal-save-creates-duplicates) |
| 1.6.3 | 5× rapid click also creates 5 rows on the server (verified via direct API call) | Web | FAIL (same bug) |
| 1.6.4 | Other modals (NoteModal, ChoreAddModal, FamilyEventModal, ProjectModal) | Web | NOT EXECUTED — code-audited: same bug pattern present |
| 1.6.5 | Modal escape / dismiss behavior | Web | PASS for grocery (clicked Cancel cleared form) |

### 1.7 Android (Phase 7)

Emulator booted to `emulator-5554` (Pixel_7, Android 15). No visual tests run by
me — handoff checklist in [QA_REPORT.md > Android handoff](QA_REPORT.md#android-handoff)
covers what to check by hand.

### 1.8 Web-specific (Phase 8)

| # | Test | Platform | Result |
|---|---|---|---|
| 1.8.1 | Refresh on `/today` re-renders correctly | Web | PASS |
| 1.8.2 | Refresh on `/calendar` re-renders correctly | Web | PASS |
| 1.8.3 | Resize to desktop preset — layout stays mobile-width (intentional) | Web | PASS (no breakage) |
| 1.8.4 | Multiple browser tabs simultaneously | Web | NOT RUN — single context |

### 1.9 Data persistence (Phase 9)

| # | Test | Platform | Result |
|---|---|---|---|
| 1.9.1 | Logout fully clears local store (no user-A data visible after user-B login) | Web | PASS |
| 1.9.2 | `localStorage.setItem('family-os-store-v2', '{invalid json'); reload();` | Web | FAIL — see [BUG #1](QA_REPORT.md#bug-1--corrupted-localstorage--unrecoverable-blank-screen) (blank screen forever) |
| 1.9.3 | Manual `localStorage.removeItem('family-os-store-v2')` recovers the app | Web | PASS (verified after BUG #1) |

### 1.10 Visual polish (Phase 10)

| # | Test | Platform | Result |
|---|---|---|---|
| 1.10.1 | Pinned-notes carousel renders cards cleanly | Web | FAIL — see [BUG #9](QA_REPORT.md#bug-9--pinned-notes-carousel-clips-next-card-peek) |
| 1.10.2 | Bottom tab bar accent colors per tab | Web | PASS |
| 1.10.3 | Empty states (Today, no events) render | Web | PASS |
| 1.10.4 | FAB/add button placement (calendar Day view) | Web | FAIL — overlaps the delete-trash icon on the event card |
| 1.10.5 | Calendar event card layout | Web | PASS |
| 1.10.6 | Console deprecation warnings | Web | FAIL — see [BUG #14](QA_REPORT.md#bug-14--deprecation-warnings-flooding-console) |

### 1.11 Performance / stress (Phase 11)

| # | Test | Platform | Result |
|---|---|---|---|
| 1.11.1 | 5× rapid Save click | Web | FAIL (covered above as 1.6.2) |
| 1.11.2 | 5-minute sustained tab-switching / rapid create | Web | NOT RUN |

### 1.12 Code audit / unfinished features (Phase 12)

| # | Check | Result |
|---|---|---|
| 1.12.1 | TODO / FIXME / HACK comments in source | NONE FOUND |
| 1.12.2 | Empty event handlers (`onPress={() => {}}`) | NONE FOUND |
| 1.12.3 | Hardcoded English UI strings in JSX | NONE in main UI (the "admin" string is data-driven, see [BUG #5](QA_REPORT.md#bug-5--english-admin-string-in-settings)) |
| 1.12.4 | Hardcoded hex colors instead of `tokens.ts` | 39+ instances found (Carousel, DatePicker, FamilyBadge, WheelTimePicker, modalStyles) |
| 1.12.5 | Bare `flexDirection: "row"` instead of `RTL_ROW` | Found in Calendar/DayCalendar.tsx, WeekCalendar.tsx, MonthCalendar.tsx, OnboardingWizard.tsx, CustomTabBar.tsx, SectionHeader.tsx |
| 1.12.6 | Missing a11y props on Pressables | Found on grocery "הוספה" Pressable + DatePicker arrows |
| 1.12.7 | Unused store slices / dead API endpoints / unused components | NONE FOUND — all wired |
| 1.12.8 | Modal Save buttons lack `loading` state | Found in 5 modals — confirmed at runtime as [BUG #2](QA_REPORT.md#bug-2--rapid-modal-save-creates-duplicates) |
| 1.12.9 | Files > 500 LOC | OnboardingWizard 1018, useFamilyStore 629, WeekCalendar 611, remoteCrud 524, FamilyEventModal 494, ScheduleBlockModal 466 |
| 1.12.10 | `fireAndForget` error reporting wired up | YES — `setSyncErrorHandler` set in `_layout.tsx:105` |
| 1.12.11 | Loading indicators during `pullAll()` | NONE — app shows nothing while initial pull is in flight |
| 1.12.12 | `as any` / `@ts-ignore` casts outside `rtl.ts` | 20 instances — mostly web-platform polyfills, low concern |

---

## 2. Pending fixes (open bugs)

See [QA_REPORT.md](QA_REPORT.md) for full details. Summary table:

| # | Severity | Title | Code ref |
|---|---|---|---|
| BUG #1 | CRITICAL | Corrupted localStorage → unrecoverable blank screen | [src/store/useFamilyStore.ts](src/store/useFamilyStore.ts) |
| BUG #2 | HIGH | Rapid Save click creates duplicates on client AND server | [GroceryAddModal.tsx:180](src/components/GroceryAddModal.tsx), and 4 others |
| BUG #3 | HIGH | Wizard blocks completion without a kid | [OnboardingWizard.tsx](src/components/OnboardingWizard.tsx) |
| BUG #4 | MEDIUM | Wizard step 3 opens kid form immediately, "ביטול" is ambiguous | [OnboardingWizard.tsx](src/components/OnboardingWizard.tsx) |
| BUG #5 | MEDIUM | English "admin" string visible in Settings family-member list | Settings screen (`app/(tabs)/settings.tsx`) + role enum mapping |
| BUG #6 | MEDIUM | Calendar Day/Week views: hour axis on the LEFT (should be right for RTL) | [DayCalendar.tsx:328,352,375](src/components/Calendar/DayCalendar.tsx), [WeekCalendar.tsx:480,494,542,566](src/components/Calendar/WeekCalendar.tsx) |
| BUG #7 | MEDIUM | Week view event titles truncate to a single character | [WeekCalendar.tsx](src/components/Calendar/WeekCalendar.tsx) |
| BUG #8 | MEDIUM | Add buttons missing `accessibilityRole` / `accessibilityLabel` / `testID` | [app/(tabs)/grocery.tsx:211](app/(tabs)/grocery.tsx), [DatePicker.tsx:68,74](src/components/DatePicker.tsx) |
| BUG #9 | LOW | Pinned-notes carousel clips next-card peek on Today | [PinnedNotesCarousel.tsx](src/components/PinnedNotesCarousel.tsx) |
| BUG #10 | LOW | Bidi-mixed family name renders awkwardly (Latin + Hebrew) | Family badge component |
| BUG #11 | LOW | Bidi quirk in grocery quantity ("3x" instead of "x3") | Grocery item row |
| BUG #12 | LOW | Tab bar `data-testid` includes a space (`tab-לוח שנה`) | [CustomTabBar.tsx](src/components/CustomTabBar.tsx) |
| BUG #13 | LOW | RNP `HelperText` keeps hidden text in DOM (a11y noise) | [(auth)/login.tsx:62,76](app/(auth)/login.tsx) |
| BUG #14 | LOW | Deprecation warnings (`shadow*`, `pointerEvents`, `useNativeDriver`) flooding console | Various components |
| BUG #15 | LOW | Wizard step 4 button row cramped on 414 px | [OnboardingWizard.tsx](src/components/OnboardingWizard.tsx) |

Plus a non-bug data observation: the `כהן` family in the test DB has two
members both named "אבא" — confusing but not a code defect.

---

## 3. Already fixed / working correctly

### 3.1 Verified working in this pass

- Login validation: button stays disabled until both fields are valid.
- Login error handling: wrong password shows "סיסמה שגויה" without crashing.
- Logout fully resets the persisted store and routes back to the login screen.
- No cross-user data leak: logging out of user A and into user B shows only B's data.
- Optimistic mutations are instant; `lastSyncedAt` updates on every successful write.
- Browser refresh preserves authentication and current route.
- Browser refresh mid-onboarding preserves wizard state.
- 409 Conflict on duplicate username surfaces the correct Hebrew error.
- Tab bar navigation between Today / Calendar / Grocery / Home / Settings — all
  five screens render with correct content and no console errors.
- Empty states render where they exist (e.g. Today on a new family,
  "אין אירועים להיום").
- All 9 resource types in `useFamilyStore` have UI screens — no dead slices.
- All `*Remote` mutations in `remoteCrud.ts` have call sites — no dead code.
- All endpoints in `endpoints.ts` are consumed — no dead endpoints.
- All 19 components in `src/components/` are imported somewhere — no orphans.
- `fireAndForget` error wiring: `setSyncErrorHandler(showSnack)` is installed at
  `app/_layout.tsx:105`, mutations route errors to a snackbar.
- No `TODO` / `FIXME` / `HACK` comments in the codebase.
- No `console.log` left in production paths outside intentional sync/auth/push
  prefixes.
- No empty event handlers; every `onPress` does real work.
- `testID` attributes on the bottom tab bar (`tab-היום` etc.) and the logout
  button work correctly with automation.
- Backend health endpoint `GET /health` returns OK on `npm run dev`.

### 3.2 Fixed in earlier sessions (per CLAUDE.md session log, 2026-05-23)

- `register.tsx` temporal-dead-zone bug (`joiningFamily` / `familyNameError`
  used before declaration).
- All 5 web tabs render cleanly (today / calendar / grocery / home / settings).
- `/session-log` skill for automatic progress tracking.
- Onboarding wizard redesigned into 5 steps (Family Name → About You + Partner
  → Kids → Invite → Telegram).
- Step 2 now guides user to create self first, then optionally add partner.
- Step 4 invite-partner screen with generate / copy / share code.
- `_layout.tsx` only skips onboarding for users who already claimed a member.
- Invite share converted from plain text to deep link
  (`/register?invite=CODE`), with `window.location.origin` fallback on web.
- Env config restructured: `.env.development` (gitignored) + `.env.production`
  (committed, empty values for same-origin pattern); Dockerfile now `COPY`s
  `.env.production` instead of inline `ENV` directives.
- `eas.json` env blocks per profile so native builds get explicit Cloud Run URLs.
- Wizard step 1 redundancy fixed (auto-advance on `familyName` load) — verified
  during my QA, the step is skipped after register.
- Wizard backdrop opacity polish.
- Grocery default category inference via `inferGrocerySubcategory()` (Hebrew
  keyword map at `src/lib/groceryCategoryInfer.ts`).
- `fireAndForget()` now updates `lastSyncedAt` on mutation success — verified
  during my QA.
- `testID` + `accessibilityRole` added to `CustomTabBar` + logout button —
  verified working with automation. (Other Pressables still missing these — see
  BUG #8.)
- Xiaomi nav-bar overlapping bottom tab bar fixed via `SafeAreaProvider` at
  `_layout.tsx` root and `useSafeAreaInsets()` in `CustomTabBar`.
- Cross-platform parity principle codified in CLAUDE.md.
- Android RTL bugs fixed (calendar event modal + grocery modal section labels
  appearing LTR): added `textAlign: TEXT_RIGHT` + `writingDirection: "rtl"` to
  `MS.sectionLabel`, dropped `textTransform: "uppercase"` and reduced
  `letterSpacing` to avoid Android text-shaper bug.
- Root-cause Android RTL fix: `_layout.tsx` calls `Updates.reloadAsync()` after
  `forceRTL` in production builds so the in-memory `isRTL` flag flips on first
  install.
- Defense-in-depth: `writingDirection: "rtl"` added to all shared `MS.*` text
  styles.
- Security incident remediation: rotated Neon DB password, JWT_SECRET, and
  SCHEDULER_SECRET; rewrote git history to purge the leaked
  `.claude/settings.local.json`; gitignored the file; added pre-commit grep
  heuristic + Security Standards section to CLAUDE.md.

### 3.3 Working but worth re-checking on Android

These features pass on web but were NOT visually verified on Android in this
pass. The Android emulator is running as `emulator-5554` — manual checklist
above:

- First-install RTL behavior (relies on `Updates.reloadAsync()`).
- Bottom tab bar safe-area on phones with 3-button nav (Xiaomi/Redmi style).
- Keyboard avoidance over add modals (iOS `padding` vs Android `height`).
- Calendar Day/Week hour-axis position — may render differently than web.
- Modal duplicate bug — should reproduce identically.

---

## 4. Test environment

| | |
|---|---|
| Date | 2026-05-23 |
| Backend | `localhost:3000` (Hono via `npm run dev`), Neon dev DB |
| Frontend | `localhost:8083` (Expo web, port 8083) |
| Browser | Claude Preview (Chromium, viewport 414×868) |
| Android emulator | Pixel_7 (Android 15, arm64) on `emulator-5554` — booted but not visually tested |
| Test users | `כהן / 123456` (seed family with 3 kids), `qaA4170 / test1234` (created during this pass, family `טסטQA`, 1 kid `ילד QA`) |
| Cleanup done | 5 grocery duplicates from BUG #2 stress test were DELETE'd via direct API call |
| Cleanup pending | The `טסטQA` family is still in the DB — delete from Settings or leave |
