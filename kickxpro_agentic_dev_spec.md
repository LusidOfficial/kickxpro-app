# KickXPro Implementation Spec (Immediate Additions on Top of Current App)

**Document type:** Product + engineering implementation brief  
**Audience:** Agentic developer / full-stack implementer  
**Project context:** Extend the current KickXPro app without breaking the existing Coach Portal and Player Portal structure.  
**Current stack assumption:** Next.js App Router + Supabase Auth + Supabase Postgres + existing role-based routes (`/coach`, `/player`) based on the current walkthrough.

---

## 1) Goal

Implement the highest-value features that fit the current KickXPro structure **right now**, with minimal architecture churn and maximum usefulness for:

1. Individual coaches  
2. Academy-hired coaches  
3. Players / students  
4. Parents / guardians  
5. Academy admins (lightweight, not full ERP)

The app should become a **weekly operating system** for football training:

**Create session -> collect RSVP -> mark attendance -> evaluate player -> assign goal -> show progress -> notify player/parent**

---

## 2) Product principles

1. **Do not rebuild the app.** Add on top of the current structure.
2. **Optimize for speed of use.** A coach should complete session admin in minutes, not in a bureaucratic death spiral.
3. **Make progress visible.** Players and parents should see what improved and what comes next.
4. **Support both solo coach and academy mode.**
5. **Keep advanced analytics out of scope for now.**
6. **Prefer simple database tables and clear RLS over clever abstractions.**

---

## 3) Current application structure (already present)

### Authentication
- `/register`
- `/login`
- Role-based redirection into Coach or Player portal

### Coach Portal
- `/coach` dashboard
- `/coach/roster`
- `/coach/sessions`
- `/coach/evaluate`
- `/coach/match-iq` (future / mocked)
- `/coach/earnings` (visible / mocked)

### Player Portal
- `/player` dashboard
- `/player/discipline`
- `/player/match-iq` (future / mocked)

### Existing app behavior
- Coach can create sessions and mark attendance
- Coach can evaluate players
- Player can view dashboard and discipline/progress
- Player dashboard already has active goals conceptually
- Data is already intended to flow from coach activity to player view

---

## 4) Scope to implement now

This implementation is split into priorities.

## P0 - Must implement now
1. Team / Batch Mapping
2. Session RSVP / Availability
3. Attendance History Upgrade
4. Quick Evaluation V2
5. Goal Tracking
6. Lightweight Coach Messaging / Notifications

## P1 - Implement next if time allows in same cycle
7. Parent / Guardian Lite View
8. Fee Status Tracking
9. Player Status / Selection Tracking

## P2 - Explicitly out of scope for now
- Full Match IQ system
- Advanced tactical analytics
- Full video analysis suite
- Complex finance dashboard
- Deep gamification system
- Full academy ERP / payroll / HR / inventory

---

## 5) User roles

Implement these roles cleanly:

### A. Coach
Can manage only their assigned teams/batches and players.

### B. Player
Can view only their own progress, attendance, goals, evaluations, and notifications.

### C. Parent / Guardian (lite)
Can view only linked child's attendance, sessions, fee status, and latest coach updates.

### D. Academy Admin (lite)
Can manage teams/batches, assign coaches, view aggregated attendance and fee status.

> If admin role does not yet exist, implement it as `role = 'academy_admin'` in profiles and keep the UI minimal.

---

## 6) Simplest end-to-end flow

### Coach flow
1. Login
2. Select batch/team
3. Create session
4. View RSVP counts
5. Mark attendance
6. Quick-evaluate players
7. Assign/update goals
8. Send summary/update

### Player flow
1. Login
2. View upcoming sessions
3. RSVP
4. Attend session
5. View evaluation
6. View active goals
7. Submit self-reflection (optional if implemented later)
8. Read coach updates

### Parent flow
1. Login / linked access
2. View upcoming sessions
3. RSVP for child
4. View attendance and latest coach note
5. View fee status

---

## 7) Feature specs

# 7.1 Team / Batch Mapping (P0)

## Why
This is required for:
- solo coaches with multiple groups
- academy-hired coaches
- academy admins assigning coaches to squads
- players being grouped correctly

## Functional requirements
- Create one or more teams/batches under an academy
- Assign players to exactly one active batch/team
- Assign one or more coaches to a batch/team
- Allow academy admin to view all teams
- Allow coach to view only assigned teams
- Add team filter to roster, sessions, evaluation, attendance views

## UI changes
### Coach Portal
- `/coach/roster`
  - add `Team / Batch` selector
  - roster table filters by selected team

### Optional Admin View
- `/admin/teams`
  - create/edit team
  - assign coach(es)
  - assign players

## Data model
### New tables
#### `academies`
- `id uuid pk`
- `name text not null`
- `created_by uuid not null`
- `created_at timestamptz default now()`

#### `teams`
- `id uuid pk`
- `academy_id uuid references academies(id)`
- `name text not null`
- `age_group text null`
- `level text null`
- `status text default 'active'`
- `created_at timestamptz default now()`

#### `team_coaches`
- `id uuid pk`
- `team_id uuid references teams(id)`
- `coach_id uuid references profiles(id)`
- `role text default 'coach'`  -- `coach`, `assistant`
- `created_at timestamptz default now()`
- unique(`team_id`, `coach_id`)

#### `team_players`
- `id uuid pk`
- `team_id uuid references teams(id)`
- `player_id uuid references profiles(id)`
- `joined_at timestamptz default now()`
- `is_active boolean default true`
- unique(`team_id`, `player_id`)

## Notes
- If existing players are linked to coach directly, do **not** delete that flow immediately. Migrate gradually by mapping them into `team_players`.

---

# 7.2 Session RSVP / Availability (P0)

## Why
Attendance alone is too late. Coaches need to know who is expected **before** the session.

## Functional requirements
- Player can respond to each upcoming session:
  - `going`
  - `not_going`
  - `late`
- Optional note field
- Coach can view response counts and list
- Coach can send reminder to players who have not responded
- Parent can respond on behalf of child if guardian view exists

## UI changes
### Coach Portal
- `/coach/sessions`
  - session card shows:
    - total invited
    - going
    - late
    - not going
    - no response
  - button: `Send Reminder`

### Player Portal
- `/player`
  - upcoming sessions widget
  - each session has RSVP controls

## Data model
### New table `session_responses`
- `id uuid pk`
- `session_id uuid references sessions(id) on delete cascade`
- `player_id uuid references profiles(id)`
- `status text check (status in ('going','not_going','late'))`
- `note text null`
- `responded_by uuid references profiles(id)` -- player or guardian/admin
- `updated_at timestamptz default now()`
- unique(`session_id`, `player_id`)

## Rules
- Session response can be updated until session start time
- Coach can override a response if needed
- Response status should not overwrite actual attendance; it is a pre-session signal

---

# 7.3 Attendance History Upgrade (P0)

## Why
Attendance exists conceptually but needs better visibility and better historical value.

## Functional requirements
- Track session-level attendance with statuses:
  - `present`
  - `late`
  - `absent`
  - `excused` (optional)
- Show attendance history by date
- Show totals and percentage
- Show streak count
- Player can view their own history
- Parent can view linked child history
- Coach can filter attendance by team and player

## UI changes
### Coach Portal
- `/coach/sessions`
  - better attendance marker UI
  - bulk save attendance
- `/coach/roster/[playerId]` (new optional detail page)
  - attendance summary

### Player Portal
- `/player/discipline`
  - date-based timeline
  - summary cards:
    - attendance %
    - present count
    - late count
    - absence count
    - streak

## Data model
### If current attendance is stored as JSON in sessions:
**Migrate away from JSON blobs** into a normalized table.

### New table `attendance_logs`
- `id uuid pk`
- `session_id uuid references sessions(id) on delete cascade`
- `player_id uuid references profiles(id)`
- `status text check (status in ('present','late','absent','excused'))`
- `marked_by uuid references profiles(id)`
- `marked_at timestamptz default now()`
- unique(`session_id`, `player_id`)

## Derived metrics
- attendance % = present / total eligible sessions
- punctuality % = non-late present / total attended
- streak = consecutive sessions marked present

---

# 7.4 Quick Evaluation V2 (P0)

## Why
The evaluation feature already exists and should become the main differentiator.

## Product rule
Do not overload coaches with 15 sliders. Start with 6 max.

## Functional requirements
- Coach selects player and session
- Coach rates 4-6 attributes
- Coach adds:
  - 1 strength
  - 1 improvement area
  - 1 short note
- Coach optionally adds badge/tag
- Latest evaluation updates player dashboard summary

## Suggested attributes
Keep these for MVP:
- Technical
- Tactical
- Physical
- Communication
- Discipline
- Confidence

## UI changes
### Coach Portal
- `/coach/evaluate`
  - team selector
  - player selector
  - evaluation form
  - quick-save action
  - reuse last template option (optional)

### Player Portal
- `/player`
  - latest evaluation card
  - radar chart or bar summary
  - last updated date
  - coach note preview

## Data model
### Recommended normalized design
#### `evaluations`
- `id uuid pk`
- `session_id uuid references sessions(id) null`
- `player_id uuid references profiles(id)`
- `coach_id uuid references profiles(id)`
- `team_id uuid references teams(id) null`
- `strength text null`
- `improvement_area text null`
- `coach_note text null`
- `badge text null`
- `created_at timestamptz default now()`

#### `evaluation_scores`
- `id uuid pk`
- `evaluation_id uuid references evaluations(id) on delete cascade`
- `metric_key text`
- `score integer check (score >= 1 and score <= 100)`
- unique(`evaluation_id`, `metric_key`)

## Rules
- If existing UI uses 1-10 sliders, migrate to 1-100 only if that is already part of product direction; otherwise keep current scale and map later.
- Latest evaluation should be easy to fetch with an indexed query.

---

# 7.5 Goal Tracking (P0)

## Why
Ratings without next steps are half a product.

## Functional requirements
- Coach can assign 1-3 active goals per player
- Goal categories:
  - technical
  - tactical
  - physical
  - discipline
- Goal contains:
  - title
  - description
  - due date
  - status
  - created_by
- Player can update progress note
- Coach can close or revise goal

## UI changes
### Coach Portal
- add goal assignment within evaluation flow
- separate `Manage Goals` section optional

### Player Portal
- `/player`
  - active goals widget
  - progress state
  - submit note button

## Data model
### New table `goals`
- `id uuid pk`
- `player_id uuid references profiles(id)`
- `coach_id uuid references profiles(id)`
- `team_id uuid references teams(id) null`
- `category text check (category in ('technical','tactical','physical','discipline'))`
- `title text not null`
- `description text null`
- `due_date date null`
- `status text check (status in ('not_started','in_progress','achieved','archived')) default 'not_started'`
- `created_at timestamptz default now()`
- `updated_at timestamptz default now()`

### Optional `goal_updates`
- `id uuid pk`
- `goal_id uuid references goals(id) on delete cascade`
- `author_id uuid references profiles(id)`
- `note text`
- `created_at timestamptz default now()`

---

# 7.6 Messaging / Notifications Lite (P0)

## Why
Coaches need communication without building a full chat app right now.

## Functional requirements
Implement only these message types:
1. Coach -> team announcement
2. Coach -> individual player note
3. Session reminder
4. Missed session follow-up
5. Goal assigned notification

## MVP rules
- In-app notification center first
- Optional deep-link button to WhatsApp for external contact
- Do **not** build full real-time chat in this cycle

## UI changes
### Coach Portal
- `Send Reminder` button on session page
- `Send Update` button after evaluation
- `Announcements` card or modal

### Player Portal
- notification inbox
- unread count badge

## Data model
### New table `notifications`
- `id uuid pk`
- `recipient_id uuid references profiles(id)`
- `type text`
- `title text`
- `body text`
- `entity_type text null`
- `entity_id uuid null`
- `is_read boolean default false`
- `created_at timestamptz default now()`

### Optional `message_templates`
- `id uuid pk`
- `template_key text unique`
- `title text`
- `body text`

## Suggested template keys
- `session_reminder`
- `attendance_missed`
- `goal_assigned`
- `evaluation_posted`
- `payment_due`

---

# 7.7 Parent / Guardian Lite View (P1)

## Why
For youth academies this materially improves retention and payment collection.

## Functional requirements
- Link a guardian to one player
- Guardian can:
  - view upcoming sessions
  - RSVP for player
  - view attendance history
  - view latest coach note
  - view fee status
- Guardian cannot edit evaluations or goals except RSVP

## Data model
### New table `guardian_links`
- `id uuid pk`
- `guardian_id uuid references profiles(id)`
- `player_id uuid references profiles(id)`
- `relationship text null`
- unique(`guardian_id`, `player_id`)

## UI
### New route
- `/guardian`
  - child summary card
  - upcoming sessions
  - latest evaluation summary
  - fee widget

> If guardian auth is too much for this sprint, allow academy admin/coach to generate a temporary read-only link as a stopgap, but full auth is preferred.

---

# 7.8 Fee Status Tracking (P1)

## Why
This adds immediate operational value without building accounting software.

## Functional requirements
- Track per-player fee state:
  - paid
  - pending
  - overdue
- Show last payment date
- Show next due date
- Allow admin/coach to update status manually for now
- Trigger reminder notification

## UI changes
### Coach / Admin
- `/coach/earnings` or `/admin/fees`
  - list of players with fee status
  - filters by team and status

### Parent / Player
- small fee status widget

## Data model
### New table `fee_status`
- `id uuid pk`
- `player_id uuid references profiles(id)`
- `team_id uuid references teams(id) null`
- `amount numeric(10,2) null`
- `currency text default 'INR'`
- `billing_period text null`
- `status text check (status in ('paid','pending','overdue'))`
- `last_paid_at timestamptz null`
- `next_due_at timestamptz null`
- `notes text null`
- `updated_at timestamptz default now()`

---

# 7.9 Player Status / Selection Tracking (P1)

## Why
More serious players want pathway clarity and coaches need a simple status layer.

## Functional requirements
- Coach can assign status:
  - training_squad
  - match_squad
  - starter
  - watchlist
  - injured
  - unavailable
- Coach can add public note and private note
- Player sees only public note

## Data model
### New table `player_status`
- `id uuid pk`
- `player_id uuid references profiles(id)`
- `team_id uuid references teams(id)`
- `status text`
- `public_note text null`
- `private_note text null`
- `updated_by uuid references profiles(id)`
- `updated_at timestamptz default now()`

---

## 8) Route / file structure suggestion

Use current role-based routing and avoid breaking existing URLs.

### Suggested additions
```text
app/
  (auth)/
    login/
    register/

  (coach)/
    coach/
      page.tsx
      roster/
        page.tsx
        [playerId]/
          page.tsx
      sessions/
        page.tsx
        [sessionId]/
          page.tsx
      evaluate/
        page.tsx
      goals/
        page.tsx
      notifications/
        page.tsx
      earnings/
        page.tsx

  (player)/
    player/
      page.tsx
      discipline/
        page.tsx
      goals/
        page.tsx
      notifications/
        page.tsx

  (guardian)/
    guardian/
      page.tsx

  (admin)/
    admin/
      teams/
        page.tsx
      fees/
        page.tsx
```

## Notes
- Use route groups only for organization, not URL changes.
- Keep `/coach` and `/player` stable.
- Add detail pages only where they improve UX materially.

---

## 9) Supabase / backend rules

## 9.1 RLS requirements
Enable RLS on every exposed table and write explicit policies.

### Minimum policy intent
- Player can read only own records
- Coach can read/write only for players in their assigned teams
- Guardian can read only linked child data
- Academy admin can read/write only within their academy
- Unauthenticated users can read nothing

## 9.2 Recommended authorization model
Use `profiles` with:
- `id uuid pk` (same as auth user id)
- `role text`
- `academy_id uuid null`

Then derive access from:
- `team_coaches`
- `team_players`
- `guardian_links`

## 9.3 Important technical rule
Do not depend on the frontend alone for authorization. Enforce with RLS and server-side checks.

---

## 10) Migration strategy

## Step 1
Create new tables:
- academies
- teams
- team_coaches
- team_players
- session_responses
- attendance_logs
- evaluations / evaluation_scores (if not already normalized)
- goals
- notifications
- guardian_links
- fee_status
- player_status

## Step 2
Backfill existing coach-player relationships into teams:
- create a default team per coach if needed, e.g. `Coach Name - Main Squad`
- assign all currently linked players into that team

## Step 3
Move attendance from JSON blobs into `attendance_logs`

## Step 4
Update pages progressively:
1. roster filters
2. sessions RSVP + attendance
3. evaluate + goals
4. notifications
5. guardian / fees / player status

## Step 5
Deprecate legacy direct coach-player assumptions only after migration is stable

---

## 11) Detailed engineering tasks

# 11.1 Database
- [ ] Create all new tables
- [ ] Add indexes on foreign keys and high-read fields
- [ ] Enable RLS on all tables
- [ ] Create select/insert/update policies by role
- [ ] Backfill existing records
- [ ] Add SQL views if needed for dashboard summaries

## Suggested indexes
- `team_players(player_id)`
- `team_players(team_id)`
- `team_coaches(coach_id)`
- `sessions(team_id, session_date)`
- `session_responses(session_id, player_id)`
- `attendance_logs(player_id, session_id)`
- `evaluations(player_id, created_at desc)`
- `goals(player_id, status)`
- `notifications(recipient_id, is_read, created_at desc)`

# 11.2 Coach UI
- [ ] Add team selector on roster
- [ ] Add RSVP counts on sessions page
- [ ] Add attendance bulk marking UI
- [ ] Add evaluation V2 form
- [ ] Add goal assignment UI
- [ ] Add send reminder / send update actions

# 11.3 Player UI
- [ ] Add upcoming sessions widget with RSVP
- [ ] Add attendance timeline
- [ ] Add latest evaluation card
- [ ] Add active goals section
- [ ] Add notification center

# 11.4 Guardian UI
- [ ] Add basic dashboard
- [ ] Add child session list
- [ ] Add RSVP action
- [ ] Add attendance + fee summary

# 11.5 Admin UI
- [ ] Add team creation/edit page
- [ ] Add coach assignment
- [ ] Add player assignment
- [ ] Add fee summary page

---

## 12) Acceptance criteria

### Team / Batch Mapping
- Coach can filter roster by team
- Admin can assign coach and player to a team
- Player appears only in assigned team views

### RSVP
- Player can mark going / not going / late
- Coach can see counts and response list
- Reminder creates notification for non-responders

### Attendance
- Coach can mark attendance for a session
- Player can see date-wise attendance history
- Attendance summary metrics render correctly

### Evaluation
- Coach can save evaluation tied to player and optionally session
- Player sees latest evaluation on dashboard
- Scores persist and render reliably

### Goals
- Coach can create a goal
- Player can see active goals
- Goal status can be updated without breaking history

### Notifications
- System creates notifications for reminder, evaluation, goal assignment
- User can mark notification as read

### Guardian / Fees / Status (if implemented)
- Guardian sees only linked child
- Fee status displays correctly
- Player status is visible to coach and public note visible to player

---

## 13) Suggested dashboard summaries

### Coach dashboard
- total players
- teams managed
- upcoming sessions
- no-response count
- pending evaluations
- overdue fees count

### Player dashboard
- next session
- attendance %
- latest evaluation summary
- active goals
- unread notifications

### Guardian dashboard
- next session
- child attendance %
- latest coach note
- fee status

### Admin dashboard
- total teams
- total active players
- attendance this week
- overdue fee count

---

## 14) UX notes

1. Prefer **buttons and segmented controls** over long forms.
2. Use **bulk actions** wherever coaches handle many players.
3. Show **latest updated date** on evaluations and goals.
4. Keep labels simple:
   - Going
   - Late
   - Not Going
   - Present
   - Late
   - Absent
5. Avoid cluttered enterprise layouts.
6. Mobile-first matters for coaches marking attendance on the field.

---

## 15) API / service layer suggestion

If using server actions:
- create typed server actions per feature

Examples:
- `createTeam`
- `assignCoachToTeam`
- `assignPlayerToTeam`
- `createSession`
- `updateSessionResponse`
- `markAttendance`
- `createEvaluation`
- `createGoal`
- `updateGoalStatus`
- `createNotification`
- `updateFeeStatus`

If using route handlers:
- keep them grouped by feature, not by database table

---

## 16) Analytics / event tracking (optional but recommended)

Track these events:
- session_created
- rsvp_submitted
- attendance_marked
- evaluation_saved
- goal_created
- goal_updated
- reminder_sent
- fee_status_updated

This will help identify actual app usage instead of guessing based on vibes and optimism.

---

## 17) Definition of done

This phase is complete when:
1. Existing auth and portals still work
2. Team mapping works end-to-end
3. Sessions support RSVP + attendance
4. Evaluations and goals are visible on player side
5. Notifications are delivered in-app
6. RLS prevents cross-user data leaks
7. One coach can operate weekly workflow without using WhatsApp/spreadsheets for the same tasks

---

## 18) Out-of-scope notes for future phase

Document these but do not build now:
- match analytics
- AI-generated tactical reports
- video annotation suite
- parent chat
- payroll / salary logic
- tournament ops
- marketplace / recruitment layer
- coach rating system
- advanced leaderboards

---

## 19) Recommended implementation order

### Sprint 1
- database tables
- RLS
- team mapping
- roster team filter

### Sprint 2
- session RSVP
- attendance_logs
- player attendance timeline

### Sprint 3
- evaluation V2
- goals
- player dashboard updates

### Sprint 4
- notifications
- reminder actions
- lightweight admin polish

### Sprint 5
- guardian lite
- fee status
- player status tracking

---

## 20) Source-informed rationale (for product priority)

These priorities are consistent with how leading team-management and player-development tools are structured:

- Team management apps emphasize **messaging, schedules, availability, and payments**
- Guardian/parent support is important for youth sport workflows
- Video/advanced analysis is valuable, but better as a later premium layer
- Sport psychology research supports **communication, support, and goal-setting** as important for athlete satisfaction and development

### Reference links
- TeamSnap Messaging: https://www.teamsnap.com/teams/features/messages
- TeamSnap Payments: https://www.teamsnap.com/teams/features/payments
- TeamSnap Features: https://www.teamsnap.com/teams/features
- TeamSnap Availability Help: https://helpme.teamsnap.com/article/94-set-game-and-event-availability
- Spond Overview: https://www.spond.com/
- Hudl Product Overview: https://www.hudl.com/products/hudl
- Hudl Video Review Guide: https://www.hudl.com/support/athletes-guide-to-hudl/guides/video-review
- Supabase RLS Docs: https://supabase.com/docs/guides/database/postgres/row-level-security
- Next.js Route Groups: https://nextjs.org/docs/app/api-reference/file-conventions/route-groups
- Coach-athlete communication study (Frontiers, 2019): https://www.frontiersin.org/articles/10.3389/fpsyg.2019.02156/full

---

## 21) Final instruction to implementing agent

Build the app around this weekly loop:

**Team -> Session -> RSVP -> Attendance -> Evaluation -> Goal -> Notification -> Parent visibility**

Do not start with advanced analytics, full chat, or fancy tactical modules.

Ship the boring operational backbone first.
That is the thing coaches actually pay for.
