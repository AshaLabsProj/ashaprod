# Asha Coach

A mobile app (iOS + Android) for youth soccer coaches to track players and keep
parents updated. Every time a coach logs a session, the player's parent gets an
update automatically.

Built with **Expo (React Native + TypeScript)** and **Supabase** (Postgres,
Auth, Storage, Realtime).

> Status: **foundation scaffold.** Auth, roles, roster, session logging, the
> auto parent-update loop, and the parent feed are implemented end-to-end
> against the schema in `supabase/migrations/0001_init.sql`. Push notifications,
> media upload, invites UI, and assessments are the next phases.

## How it works (the core loop)

```
Coach logs a Session  ──►  DB trigger fans it out  ──►  one ParentUpdate per
(player, focus, note)      (fan_out_parent_updates)     guardian  ──► parent
                                                          sees it in their feed
                                                          (push next)
```

One data model serves all three personas:
- **Club coach** — many teams, many players
- **Team coach** — one team
- **1:1 private coach** — players with no team (`team_id = NULL`)

## Project layout

```
app/                     # screens (expo-router, file-based)
  (auth)/                #   login, signup (role picker)
  (coach)/               #   roster, log-session, player timeline, settings
  (parent)/              #   updates feed, settings
  _layout.tsx            #   auth gate: routes by signed-in state + role
components/ui.tsx        # Button, Field, Card
lib/
  supabase.ts            # Supabase client
  auth.tsx               # AuthProvider + useAuth (session + profile/role)
  database.types.ts      # typed schema (regenerate with `npm run db:types`)
  theme.ts               # design tokens
supabase/migrations/     # SQL schema + RLS + triggers
```

## Local setup

1. **Install deps**
   ```bash
   npm install
   ```
2. **Create a Supabase project** at supabase.com, then run the migrations
   **in order**:
   - Easiest: open the SQL editor in the dashboard and paste, one at a time,
     `supabase/migrations/0001_init.sql` then `supabase/migrations/0002_invites_consent_media.sql`.
   - Or with the CLI: `supabase link` then `supabase db push`.
3. **Configure env** — copy `.env.example` to `.env` and fill in your project's
   URL and anon key (Supabase → Project Settings → API):
   ```
   EXPO_PUBLIC_SUPABASE_URL=...
   EXPO_PUBLIC_SUPABASE_ANON_KEY=...
   ```
4. **Run it**
   ```bash
   npm start          # then press i (iOS) / a (Android), or scan with Expo Go
   ```

## Push notifications (Phase B)

Remote push needs a real device build — **it does not work in Expo Go** (SDK 53+).

1. Deploy the edge function that sends the push:
   ```bash
   supabase functions deploy notify-parents
   ```
2. Add a **Database Webhook** (Dashboard → Database → Webhooks): table
   `parent_updates`, event `INSERT`, type *Supabase Edge Function* →
   `notify-parents`.
3. Make a **dev build** so the device can register a push token:
   ```bash
   eas build --profile development --platform ios   # or android
   ```
The app registers the device's Expo push token on login (`profiles.push_token`);
the function reads it and posts to Expo's push API on every new parent update.

## Testing the loop quickly

1. Sign up as a **coach**, add a player, open the player → **Invite parent** →
   *Generate invite code*.
2. Sign up (different email) as a **parent** → **Claim an invite** → enter the
   code, tick consent, connect.
3. As the coach, **log a session** (optionally attach photos). As the parent,
   pull-to-refresh **Updates** — the session, note, and photos are there.

---

## Publishing to the App Store & Google Play

You build and submit with **EAS** (Expo Application Services); no local Xcode or
Android Studio required.

### One-time accounts (start early — verification can take days)
- **Apple Developer Program** — $99/year. Company enrollment needs a **D-U-N-S
  number** (free; can take days–weeks — request it first).
- **Google Play Console** — $25 one-time. New accounts require identity
  verification.

### Steps
```bash
npm install -g eas-cli
eas login
eas build:configure          # creates eas.json, sets project id

# Builds (cloud — no Mac needed for iOS)
eas build --platform ios
eas build --platform android

# Submit to the stores
eas submit --platform ios
eas submit --platform android
```
Then in **App Store Connect** / **Play Console**: add screenshots, description,
privacy policy URL, age rating, and a content/data-safety questionnaire. Ship to
**TestFlight** / **Internal Testing** first, then submit for review.

### Compliance — important: this app handles data about minors
You likely fall under **COPPA** (US) and possibly **GDPR-K** (EU). Before launch:
- Publish a **privacy policy** and **terms of service** (hosted URLs).
- Build **parental consent** into the guardian invite/claim flow.
- Do **not** add behavioral ad tracking on minors.
- Complete Apple's **App Privacy** label and Google's **Data Safety** form
  accurately.
Consider a brief legal review given the youth-data focus.

## Roadmap
- [x] Auth + roles, roster, session logging, auto parent updates, parent feed
- [x] In-app invite + parental-consent claim flow (Phase A)
- [x] Expo push notifications on new parent update (Phase B)
- [x] Photo upload to Supabase Storage + display in timeline/feed (Phase C)
- [ ] Skill assessments over time (charts) + development goals (Phase D —
      pending the scoring metrics from the legacy `skilltracker` app)
- [ ] Teams/club management, multi-coach roles
- [ ] Subscriptions (RevenueCat)
