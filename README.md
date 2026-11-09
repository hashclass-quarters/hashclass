# HashCLASS on Supabase

## Go live (about 10 minutes)

1. **Supabase → SQL Editor → New query.** Run these files, in order:
   1. `supabase/01_schema.sql`   – tables, security rules, login system
   2. `supabase/02_storage.sql`  – the `uploads` bucket for photos and files
   3. `supabase/03_create_founder.sql` – **first change the password on the line marked `<<< CHANGE THIS`**, then run it. This creates your FOUNDER & CEO account (`T22-03-05223`).
2. Upload the **contents of the `dist/` folder** to your web host.
3. Open the site, sign in as `T22-03-05223` with the new password.

> The old CEO password was written inside the website's public code. Treat it as exposed:
> change it everywhere you used it (email, bank, phone, other sites).

## What changed

| Area | Before | Now |
|---|---|---|
| Passwords | plain text, readable by anyone | bcrypt hashes, never sent to the browser |
| Access | anyone with the site key could read/write everything | every action checked on the server against your role |
| CEO login | password hardcoded in `app.js` | normal account, set by you in SQL |
| Images / files | base64 stored inside records | Supabase Storage (`uploads` bucket); records hold only a link. Big photos are shrunk to 1600px before upload |
| Forgot password | the student's real password was emailed | CEO approves → a one-time temporary password is created |
| Lockout | none | 5 wrong passwords = 15-minute lock |
| Speed | whole tables downloaded and filtered in the browser; Babel compiled in the browser | server-side lookups; precompiled `dist/` build |
| Chat | polling every few seconds, typing worked on one device only | Realtime (instant, typing works across devices); polling is the fallback |

### Who can do what (enforced in the database, not just hidden buttons)
* **Student:** read own profile; change own phone, email, photo; like/comment/view news; chat; see own attendance.
* **FOUNDER & CEO:** everything, including admins, packages, password requests.
* **Chief Financial Officer:** registered students and payments, packages.
* **General Secretary:** post and manage news.
* **Accountant:** valid-students list.
* **Lecturer / any admin:** view students, record attendance.
* Attendance recorder (`T08-01-02001`) can record attendance.

### Behaviour changes you will notice
* Passwords can no longer be **viewed**. The password column now has a **Reset** link that creates a new temporary password to give to the person.
* Adding a student/admin without typing a password generates a random one and shows it once.
* A failed login says "Incorrect registration number or password" (it no longer reveals which one).
* Removed one-off pages that had hardcoded student data or open admin actions: `admin-cleanup`, `admin-tasks`, `execute-tasks`, `init-founder-admin`, `test-news-post`, and the old `dashboard`.
* `addAdmin` / `deleteAdmin` / `getAllAdmins` were missing from the original project (the Administration page could not work). They are now implemented.

### Optional setting
Sign-up currently accepts any correctly formatted registration number (same as before). To allow **only students listed in "Valid Users"**, edit `app_require_valid_reg()` in `supabase/01_schema.sql` to return `true` and re-run that file.

## Editing the site later
Source files are in the project root (`components/`, `utils/`, `*-app.js`, `*.html`).
After editing run `node build.js` (needs Node 18+ and `npm i esbuild`), then upload `dist/` again.

## Logos
The logos still load from Trickle's servers. To host them yourself, put files in `assets/` named as in `assets/README.txt` and run `node build.js`.

## Not done / things to know
* Your **existing Trickle data is not copied**. Export each table from Trickle and send it if you want an import written.
* Tailwind still loads from its CDN (the project's styles rely on its browser mode).
* Passwords are not reversible: any student who forgot theirs needs the Forgot Password flow or an admin reset.


## Years and packages
Sign-up is open to FIRST, SECOND and THIRD YEAR students. One package is chosen per student (defined in `utils/catalog.js`):
- First year: AF111 & MT1114 (TZS 10,000), AF111 (6,000), MT1114 (6,000)
- Second/Third year: AF211+AF212+MS211 (15,000); any two of them (12,000); any single one (7,000). Third-year students see these as **Carry Over Courses**.
No SQL changes are needed for this.

## Months (payment periods)
Admin panel -> **Months**: set the START DATE and END DATE of Month 1, 2 and 3 and press SAVE (Founder & CEO and Chief Financial Officer only). The student panel and the payment popups follow these dates: a month that has not started shows UPCOMING, a started month shows PAID / PARTIAL / UNPAID. Until dates are set, students see "NOT STARTED". Re-run `supabase/01_schema.sql` once to add the `month_period` table.

## Deploying on Vercel (important)
Upload the whole project (not the `dist` folder) to GitHub. `vercel.json` makes Vercel run `node build.js` and publish `dist/`, so pages load as precompiled JavaScript. If the site is slow with a blank white screen at first, Vercel is serving the unbuilt source: in Vercel -> Project Settings -> Build & Development, set Build Command `node build.js`, Output Directory `dist`, then Redeploy.

## Look and feel
Royal blue + gold theme (colours in `theme.css` and the `--primary-color` variable in each page). Welcome, sign in, sign up, forgot password and dashboard share the layout in `components/AuthShell.js`. Photos used: `assets/students.jpg` (welcome screen) and `assets/udom.jpg` (dashboard footer).

## SQL scripts, in order
01_schema.sql, 02_storage.sql, 03_create_founder.sql (first setup). Later updates: 04_months.sql (payment months), 05_news_actions.sql (safe likes/comments), 06_faster_login.sql (faster sign-in). 01_schema.sql already contains 04, 05 and 06 for new projects.
