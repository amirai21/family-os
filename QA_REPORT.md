# Family OS — QA Report

**Date:** 2026-05-23
**Scope:** Web (Chrome via Claude Preview, viewport 414×868) + repo-level code audit
**Tester:** Automated (Claude) — single browser context, no second device
**Auth used:** existing seed user `כהן / 123456`, plus fresh registration `qaA4170 / test1234`
**Backend:** local `npm run dev` at `http://localhost:3000` against dev Neon DB
**Frontend:** local `npx expo start --web --port 8083`

---

## Coverage summary

| Phase | Status | Notes |
|---|---|---|
| 1. Auth & Onboarding | ✅ Covered | Login, wrong-pw, duplicate username, refresh-mid-wizard, full 5-step wizard end-to-end |
| 2. Login / sessions | ⚠️ Partial | Logout/login cycle covered; two-tab sync **not testable** (single browser context). localStorage clear-mid-session covered. |
| 3. Multi-Member Sync | ❌ Skipped | Single browser context; cannot run two simultaneous user sessions. Recommend manual run from CLAUDE.md "Two-Member QA Flow". |
| 4. Offline / network flapping | ❌ Skipped | Android-only, deferred to user. |
| 5. RTL | ✅ Covered | Web visual + code review. |
| 6. Modal stress | ✅ Covered | Grocery modal stress-tested. |
| 7. Android | 🟡 Handoff | Emulator booted (`emulator-5554`); reproduction checklist below. |
| 8. Web-specific | ✅ Covered | Resize, refresh-on-nested-route. |
| 9. Data persistence | ✅ Covered | Logout leak, corrupted storage. |
| 10. Visual polish | ✅ Covered | Inline with phases 1/5/6/8. |
| 11. Perf / stress | 🟡 Spot only | 5x rapid Save covered (revealed bug); 5-min sustained rapid interaction not run. |
| 12. Unfinished features hunt | ✅ Covered | Repo-wide code audit. |

---

## TOP 5 most important issues

1. **[CRITICAL] Corrupted `family-os-store-v2` in localStorage produces a permanent blank screen.** App fetches data successfully from the server (network log shows 200 OKs on every pull), but renders nothing. There is no recovery path inside the app — the user is stuck unless they manually clear localStorage from DevTools. Real users will not know how to do that. → [BUG #1](#bug-1-corrupted-localstorage--unrecoverable-blank-screen)
2. **[HIGH] Rapid clicks on modal Save = duplicate writes both locally and on the server.** Five clicks on the grocery add modal's "הוסף" button created 5 identical rows in the local store *and* on the backend (verified via direct API query). The Save button is not disabled while a mutation is in flight. Same anti-pattern exists in code for `NoteModal`, `ChoreAddModal`, `FamilyEventModal`, `ProjectModal`. → [BUG #2](#bug-2-rapid-modal-save-creates-duplicates)
3. **[HIGH] Onboarding wizard requires at least one child** ("יש להוסיף לפחות ילד/ה אחד/ת"). Childless families, single parents whose kids are grown, or two adults living together cannot finish setup. This is a real product-fit blocker, not a polish issue. → [BUG #3](#bug-3-wizard-blocks-progress-without-a-kid)
4. **[MEDIUM] Settings shows the literal English string "admin"** as a member role label in a Hebrew-only app — visible to every user who reaches Settings. Violates the "no English UI strings" rule in CLAUDE.md. → [BUG #5](#bug-5-english-admin-string-in-settings)
5. **[MEDIUM] Calendar Day/Week views render hour labels on the LEFT, not the RIGHT.** In a Hebrew RTL app the time scale should hug the right edge so it reads naturally for users. This is a positional violation, not a string-direction one — the `flexDirection` inside `WeekCalendar.tsx` / `DayCalendar.tsx` is hardcoded `"row"` instead of `RTL_ROW`. → [BUG #6](#bug-6-calendar-rtl-hour-axis-on-the-wrong-side)

---

## Bug list (sorted by severity)

### CRITICAL

#### BUG #1 — Corrupted localStorage → unrecoverable blank screen
- **Severity:** Critical
- **Platform:** Web (likely also Android via AsyncStorage corruption)
- **Steps to reproduce:**
  1. Log in as `כהן / 123456`.
  2. In DevTools console: `localStorage.setItem('family-os-store-v2', '{"corrupted":"yes",invalid_json');`
  3. `window.location.reload()`.
- **Actual:** Page renders to an empty white screen indefinitely. `document.body.innerText` is `""`. Console shows zero errors. Network log confirms `GET /v1/auth/me → 200` and all 8 pull requests succeed. Auth session is intact in localStorage; the JS just never finishes mounting the tree.
- **Expected:** App should detect the unparseable value, drop it, and either (a) re-fetch from server cleanly, or (b) fall back to the login screen with a "data reset" toast. The current behavior is indistinguishable from a hung app.
- **Root cause hint:** Zustand's `persist` middleware throws when `JSON.parse` fails. The middleware is wrapped in [src/store/useFamilyStore.ts](src/store/useFamilyStore.ts) but no `onRehydrateStorage` error handler is installed to fall back to defaults.
- **Recovery from the bug:** `localStorage.removeItem('family-os-store-v2')` then reload — verified.

---

### HIGH

#### BUG #2 — Rapid modal Save creates duplicates
- **Severity:** High
- **Platform:** Both (verified web; same code path used on native)
- **Steps to reproduce:**
  1. Open the grocery tab.
  2. Click the "הוספה" Pressable at the bottom.
  3. Type a name in "שם הפריט".
  4. Click the "הוסף" save button 5 times in quick succession.
- **Actual:** 5 identical rows appear locally and 5 separate `POST /v1/family/.../grocery` records are created on the backend (verified by direct API call after the test — `matchedOnServer: 5`). The modal does not close on the first click, leaving the button armed for the next four.
- **Expected:** Either disable the Save button on click, set the modal's `loading` state, or close the modal immediately on optimistic write. One click = one record.
- **Code refs:** the bug pattern exists in every add modal — `disabled={!title.trim()}` is the only guard, no in-flight state:
  - [src/components/GroceryAddModal.tsx:180](src/components/GroceryAddModal.tsx)
  - [src/components/ChoreAddModal.tsx:101](src/components/ChoreAddModal.tsx)
  - [src/components/NoteModal.tsx:76](src/components/NoteModal.tsx)
  - [src/components/FamilyEventModal.tsx:483](src/components/FamilyEventModal.tsx)
  - [src/components/ProjectModal.tsx](src/components/ProjectModal.tsx)

#### BUG #3 — Wizard blocks progress without a kid
- **Severity:** High (product-fit blocker for non-parent users)
- **Platform:** Both
- **Steps to reproduce:**
  1. Register a new family.
  2. Complete steps 1 & 2 of the wizard ("Family Name", "About You").
  3. On the "ומי הילדים?" step, do **not** add any child.
  4. Click "הבא" (Next).
- **Actual:** Inline error appears: "יש להוסיף לפחות ילד/ה אחד/ת" (You must add at least one child). User cannot advance.
- **Expected:** The kids step should be optional — child-free couples, empty-nesters, single adults sharing a household are all valid users of a "family OS". Provide a skip button or accept zero kids.
- **Code ref:** [src/components/OnboardingWizard.tsx](src/components/OnboardingWizard.tsx) — search for the i18n key.

---

### MEDIUM

#### BUG #4 — Onboarding wizard step 3 opens the kid form immediately
On entering step 3 ("ומי הילדים?"), the wizard shows the **add-kid form first** (name input + emoji grid + color grid) rather than the cleaner "click to add a kid" CTA. Users can hit "ביטול" to reveal the simpler view. The label "ביטול" (Cancel) is ambiguous — it doesn't make clear whether you're cancelling the wizard or just the in-progress kid entry. Suggest opening with the "+ הוסף ילד/ה" CTA, expand on click.

#### BUG #5 — English "admin" string in Settings
- **Severity:** Medium
- **Platform:** Both
- **Steps to reproduce:**
  1. Log in as `כהן`.
  2. Go to הגדרות → חברי משפחה.
- **Actual:** Both "אמא" and the second "אבא" cards display "admin" (English) as a role/claim label. The unclaimed first "אבא" shows "הורה" — inconsistent.
- **Expected:** Hebrew label, e.g. "מנהל/ת" for claimed/admin members. Per CLAUDE.md, no English UI strings.
- **Note:** Independent finding — the seed/test data also contains two members named "אבא" in the same family with no disambiguation. Not strictly a bug but worth flagging.

#### BUG #6 — Calendar RTL: hour axis on the wrong side
- **Severity:** Medium
- **Platform:** Web confirmed (RN Web does not auto-mirror absolute positioning); native may differ.
- **Steps to reproduce:**
  1. לוח שנה → יום (Day view).
- **Actual:** Hour labels (`07:00`, `08:00`, …) align to the LEFT edge of the grid; grid lines extend RIGHT from them.
- **Expected:** In RTL, the time axis should be on the RIGHT.
- **Code ref:** [src/components/Calendar/DayCalendar.tsx:328,352,375](src/components/Calendar/DayCalendar.tsx) and [WeekCalendar.tsx:480,494,542,566](src/components/Calendar/WeekCalendar.tsx) use bare `flexDirection: "row"` instead of `RTL_ROW`. CLAUDE.md explicitly forbids this.

#### BUG #7 — Week-view event titles truncate to a single character
- **Severity:** Medium
- **Platform:** Web (likely Android too)
- Going to לוח שנה → שבוע: events render as `ר…`, `ה…`, `ס…` because columns are ~50 px wide. Users can't tell events apart without tapping.
- **Suggestion:** Show the time on a small badge but no title; or rotate the title; or rely on the existing "אירועים ליום שבת" list below the grid as the source of truth (and shrink the grid to just hour-coloured bars).

#### BUG #8 — Add buttons missing a11y props
- **Severity:** Medium (blocks automation + screen reader use)
- **Steps to reproduce:** Inspect the grocery "הוספה" Pressable, calendar `+` FAB, DatePicker arrows.
- **Actual:** No `accessibilityRole`, no `accessibilityLabel`, no `testID`.
- **Code refs:**
  - [app/(tabs)/grocery.tsx:211](app/(tabs)/grocery.tsx) — grocery "הוספה" Pressable
  - [src/components/DatePicker.tsx:68,74](src/components/DatePicker.tsx) — month arrows
- CLAUDE.md says every interactive Pressable must have these. The tab bar + logout button were fixed in a previous pass; the rest were missed.

---

### LOW

#### BUG #9 — Pinned-notes carousel clips next-card peek
On the Today screen the second pinned note appears partially clipped on the LEFT edge ("טלפונים חש…") with no rounded corners — looks like a layout bug rather than an intentional peek.
- **Code ref:** [src/components/PinnedNotesCarousel.tsx](src/components/PinnedNotesCarousel.tsx)

#### BUG #10 — Bidi-mixed family name renders awkwardly
Family name "טסטQA" (Hebrew + Latin) on the family badge renders the "QA" on the left of "משפחת". Two-line carousel/badge text doesn't isolate Latin segments. Recommend either disallowing Latin chars in family names or wrapping mixed segments in a `<bdi>`-equivalent.

#### BUG #11 — Bidi quirk in grocery quantity display
"כמות 3" reads naturally but ends up rendered as `קופסאות 3x` (Latin `x` before number in RTL flow) when it should be `x3` or "×3" or "3 יח'". Affects every grocery row with a quantity prefix.

#### BUG #12 — Tab bar `data-testid` includes a space
`data-testid="tab-לוח שנה"` (space in the value). Works but makes CSS selectors painful: `[data-testid="tab-לוח שנה"]` requires quoting. Replace spaces with hyphens.

#### BUG #13 — Hidden helper text still announced
React Native Paper's `HelperText` keeps the text node in the DOM with display:none when `visible={false}`. Login screen's a11y tree includes "שם משתמש חייב להכיל לפחות 3 תווים" before the user types anything. Screen readers will read it. Use `aria-hidden` or skip rendering entirely when invisible.

#### BUG #14 — Deprecation warnings flooding console
Repeated console warns: `"shadow*" style props are deprecated. Use "boxShadow"`, `props.pointerEvents is deprecated`, `useNativeDriver not supported`. They don't break anything but clutter the dev console and indicate upcoming RN-Web compat work.

#### BUG #15 — Bottom button row cramped in wizard step 4
The "invite partner" step shows three buttons (`חזרה` / `אעשה את זה אחר כך` / `הבא`) in a row with no spacing or stacking — they sit tight against each other on a 414 px viewport. Consider stacking, or making the middle "I'll do this later" a secondary text link.

---

## Cross-platform notes

- **Web only verified** in this run. Android emulator was booted (`emulator-5554`) but no app installed/tested visually — see [Android handoff](#android-handoff) below.
- The grocery duplicate bug (#2) will reproduce identically on Android (same shared code path in `remoteCrud.ts`).
- The corrupted-storage bug (#1) may behave differently on Android because AsyncStorage and localStorage have different failure modes; needs separate verification.
- The calendar RTL issue (#6) may actually look *correct* on Android since `RTL_ROW` resolves to `"row"` when `I18nManager.isRTL` is true and Android RN auto-mirrors `row`. Hardcoded `"row"` happens to render the same — but the convention violation makes it brittle.

---

## UX / improvement suggestions

1. **Wizard step 3 ("Kids") should be optional** and start with the cleaner "+ Add kid" CTA, not the form.
2. **Modal Save buttons need a `loading` prop** and should close-on-success. Standardize across all 5 add modals.
3. **Add a "data reset" recovery path** — `_layout.tsx` could wrap rehydration in a try/catch, drop on failure, and route to a "we cleared your local cache, please re-sync" screen.
4. **Day/Week calendar** — flip the hour axis to the right side; replace truncated event titles with coloured time bars; consider clicking-to-expand for week events.
5. **Settings family-member role labels** — translate `admin` / `parent` / `caregiver` consistently into Hebrew. Right now the inconsistent mix (`admin` vs `הורה`) reads like a bug.
6. **Bidi safety** — wrap Latin segments in family/kid names with a Unicode RTL-isolate or disallow Latin entirely.
7. **A11y baseline** — add a lint rule (or grep CI check) for `<Pressable` / `<TouchableOpacity` without `accessibilityRole`. Catches every future regression.
8. **Deprecation cleanup** — migrate `shadow*` → `boxShadow`, `pointerEvents` prop → `style.pointerEvents`. Quiets the console and futures-proofs against RN-Web breaking changes.

---

## Things that worked well

- Login flow: error messages clear, button correctly disabled on short input, no crashes on wrong password.
- Logout properly clears local store; no data leak verified across user accounts (`qaA4170` ↔ `כהן`).
- Refresh during onboarding preserves wizard state at the correct step.
- Refresh on a nested route (`/calendar`) re-hydrates correctly.
- Backend returns 409 on duplicate username with a clear UI message ("שם המשתמש תפוס").
- 5-step wizard step indicator is correctly RTL-ordered (filled dot moves right→left).
- Empty states render correctly on Today ("אין אירועים להיום") and on the new-family home screen.
- Optimistic mutations feel instant; the `lastSyncedAt` timestamp updates on every change.
- `testID` attributes on the bottom tab bar and logout button work — confirmed via automation.
- Tab navigation between Today / Calendar / Grocery / Home / Settings is fast and stateless.

---

## Android handoff

The emulator is running as `emulator-5554`. Recommended manual checklist (the user said they'd watch the screen):

1. `~/Library/Android/sdk/platform-tools/adb devices` — confirm emulator-5554 is `device`.
2. Run `npx expo start --android` in the family-os root (separate terminal). Expo will push Metro to the running emulator.
3. **Critical Android checks** (these are the ones that cannot be done from web):
   - First-install RTL: kill the app, clear data, reinstall. Verify the app reloads itself automatically (see `Updates.reloadAsync()` in `app/_layout.tsx`) and renders Hebrew right-aligned on the very first launch.
   - Bottom tab bar not overlapped by 3-button nav on Xiaomi/Redmi-style devices — emulator's Pixel 7 doesn't reproduce this, but it's documented as a previous incident in CLAUDE.md.
   - Keyboard does NOT cover the Save button on any add modal (grocery, note, event). Try opening each, focusing the name input, and confirm the Save button stays reachable.
   - Calendar Day/Week view — verify whether hour labels appear on the right (correct for RTL) or left (bug, same as web).
   - Reproduce **BUG #2** (rapid Save → duplicates) on Android. Should be identical.
   - Reproduce **BUG #1** (corrupted storage) by hand-editing the AsyncStorage SQLite via `adb shell` — optional, lower-priority since the root cause is the same.

If anything looks different from this web report on Android, capture a screenshot and add a note to this file under a new "Android-specific findings" section.

---

## Test data state

After this QA pass, the `כהן` family's grocery list contains a `נקנו` section with previous test items but the 5 stress-test duplicates (`פריט-סטרס-1779555688637`) **were cleaned up via direct DELETE calls** — verified the count returned to 22 - 5 = 17 active items + cleared section.

A second family (`טסטQA`, family id `e354bf05-...`) was created during onboarding QA with username `qaA4170 / test1234` and one kid `ילד QA`. Safe to delete from Settings or leave; solo dev, no real users.

---

## Notes & limitations of this pass

- Single browser context — could not run two-user simultaneous sync (Phase 3) or two-tab cross-update (Phase 2 test 4). Run those manually via the CLAUDE.md "Two-Member QA Flow" section.
- No iOS coverage.
- No 5-minute sustained interaction stress (Phase 11 test 1). Quick 5-click rapid was enough to expose the duplicate bug.
- Did not test Telegram bot wiring on the Settings page (would need a real Telegram account); the UI is there.
- Did not test the invite-deep-link flow end-to-end (would need a second browser session).

