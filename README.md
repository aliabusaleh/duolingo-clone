<a name="readme-top"></a>

<div align="center">

# فقيه · Faqih

### Learn the Quran, a few minutes a day

A free, Arabic-first app for memorising and understanding the Quran, with short daily lessons, real recitation and a source behind every question. Built as _sadaqah jariyah_.

**[Open the app](https://faqih-beige.vercel.app)** · [Roadmap](docs/ROADMAP.md) · [Setup](docs/SETUP.md) · [Content rules](content/README.md) · [Project board](https://github.com/users/aliabusaleh/projects/1)

_﴿ وَلَقَدْ يَسَّرْنَا الْقُرْآنَ لِلذِّكْرِ فَهَلْ مِن مُّدَّكِرٍ ﴾_
"And We have certainly made the Quran easy to remember. So is there anyone who will be mindful?" (Al-Qamar 54:17)

</div>

---

## What Faqih is

Faqih (فقيه, "one who has deep understanding") turns the Quran into short, game-like lessons in the style of Duolingo. Learners **read and listen first**, then answer questions on what they just read. Every question is built from the real text, and every wrong answer is another real ayah: **the Quran is never altered**.

It is made for:

| Learner                    | What they get                                                                                                                                       |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| 🧒 **Children**            | A gentle kids mode: the short surahs, big buttons, no hearts or penalties, and everything read aloud by a qari.                                     |
| 🧑 **Adults**              | The whole Quran, all 114 surahs, in short lessons grouped by hizb, with exams per surah and per juz', and a daily review of what they memorised.    |
| 🕌 **Arabic speakers**     | An Arabic, right-to-left interface by default, the Quran exactly as the Madinah mushaf prints it, and lenient typed answers (no diacritics needed). |
| 🌍 **Non-Arabic speakers** | An English interface one tap away, with the meaning of each ayah shown under the Arabic.                                                            |

## Features

**Learning**

- **Courses:** the Whole Quran (114 units), Kids: Short Surahs, Al-Fatiha, an-Nawawi's Forty Hadith (1–10), and the morning and evening adhkar from Hisn al-Muslim.
- **Read first, then answer:** each lesson opens with a few ayat to read and hear, then questions on them.
- **Exercises:**
  - what comes next
  - complete the ayah or the word
  - put the words or the ayat in order
  - match pairs
  - listen and pick the ayah
  - true or false
  - typed answers
- **Exams** close every surah and every juz'. Passing an exam opens what comes next, and surahs can be taken in any order.
- **Daily review and streak:** a few questions a day on ayat already learned, spaced out over time.
- **Read mode:** read and listen to the whole Quran, by surah or by juz', like a mushaf. It remembers the exact ayah you stopped at (on your account, across devices), lets you bookmark an ayah, and shows its tafsir on long-press (al-Muyassar in Arabic, Ibn Kathir in English).
- **The mushaf's own script:** the King Fahd Complex's Hafs text in its KFGQPC font, with the mushaf's marks and ayah markers.

**Gentle motivation**

- Hearts are earned back by reviewing mistakes, never by waiting or paying.
- Kids mode hides points, hearts and rankings.
- Learning modes, a leaderboard, and inviting friends.
- **Daily wird reminder:** a push notification at a time each learner chooses, opening today's lesson.

**Access**

- **Languages:** Arabic (RTL, the default) or English. Each course is built in one language, so no question mixes the two.
- **Phones first:** a bottom tab bar on phones, with Courses one tap away everywhere.
- **Installable** to the Home Screen.
- **Optional offline use:** download the next lessons, or the whole Quran for Read mode, at the press of a button.

**Authentic and reviewed**

- Every question shows its source (surah:ayah, or the hadith reference and who recorded it), with a link.
- Every lesson is a **draft** until a qualified reviewer approves it. Drafts are hidden in production.
- **Recitation:** only from a qari, never a synthetic voice. Al-Husary _muallim_ for kids, Alafasy otherwise.
- **Free:** no paywall on learning. Payments are switched off.

## Content sources

| Content                              | Source                                                                                                                                                                      |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Quran text and font                  | King Fahd Glorious Quran Printing Complex: QPC Hafs text and KFGQPC Uthmanic Script HAFS font, via the [Quran Foundation](https://quran.foundation) (Quran.com API and CDN) |
| Surah names, translation, recitation | [alquran.cloud](https://alquran.cloud/api) (Sahih International), recitations by Alafasy and al-Husary                                                                      |
| Tafsir                               | at-Tafsir al-Muyassar ([alquran.cloud](https://alquran.cloud/api)), Ibn Kathir abridged ([Quran.com](https://quran.com))                                                    |
| an-Nawawi's Forty Hadith             | [fawazahmed0/hadith-api](https://github.com/fawazahmed0/hadith-api), links to sunnah.com                                                                                    |
| Morning and evening adhkar           | [Hisn al-Muslim](https://www.hisnmuslim.com) (al-Qahtani), chapter 27                                                                                                       |

Lessons are generated from these texts by `bun run content:import`. The rules (sources, review status, no altered text) are in [content/README.md](content/README.md). Translation and audio licensing must be cleared before a public launch.

## Getting started

**Requirements:**

- Node.js 20.9 or newer.
- [Bun](https://bun.sh) 1.3.4 (pinned in `package.json`).
- A PostgreSQL database, e.g. [Neon](https://neon.tech) (free tier).

1. Install the exact versions from `bun.lock`. Don't use `npm install`.

   ```bash
   bun install --frozen-lockfile
   ```

   Without Bun installed: `npx bun@1.3.4 install --frozen-lockfile`.

2. Copy `.env.example` to `.env` and set at least `DATABASE_URL`. For local development without Clerk, set `NEXT_PUBLIC_DEV_AUTH=local`: you're signed in automatically as a dev user.

3. Create the tables, import the content and start the app:

   ```bash
   bun run db:push
   bun run content:import
   bun run dev
   ```

   Then open http://localhost:3000.

**Optional settings:**

- Clerk keys for real sign-in.
- `NEXT_PUBLIC_DEFAULT_LOCALE` (`ar` or `en`).
- `NEXT_PUBLIC_SHOW_DRAFTS`.
- The push keys and `CRON_SECRET` for reminders.

Every variable is explained in `.env.example`, and [docs/SETUP.md](docs/SETUP.md) covers deployment.

### Useful scripts

| Script                            | What it does                                                                    |
| --------------------------------- | ------------------------------------------------------------------------------- |
| `bun run dev`                     | Start the app locally                                                           |
| `bun run build`                   | Production build                                                                |
| `bun run lint` / `bun run format` | ESLint and Prettier checks                                                      |
| `bun run db:push`                 | Apply `db/schema.ts` to the database                                            |
| `bun run db:studio`               | Browse the database                                                             |
| `bun run content:import`          | Download the sources and rebuild the courses (`-- --refresh` to download again) |

### Automation (GitHub Actions)

| Workflow                | What it does                                                                                         |
| ----------------------- | ---------------------------------------------------------------------------------------------------- |
| Update database schema  | Applies schema changes to the database when they reach `main` (safe changes only)                    |
| Update lessons          | Rebuilds the lessons when content code changes, keeping learners' progress                           |
| Daily wird reminders    | Sends the reminders that are due                                                                     |
| Sync project board info | Updates the [project board](https://github.com/users/aliabusaleh/projects/1) from `.github/project/` |
| Update README           | Refreshes the folder structure and dependency lists below                                            |

## Tech stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS · Drizzle ORM · Neon Postgres · Clerk · Zustand · web-push · Bun. Hosted on Vercel.

## Folder structure

<!--- FOLDER_STRUCTURE_START --->

```bash
faqih/
  |- actions/
    |-- challenge-progress.ts
    |-- reminders.ts
    |-- review.ts
    |-- user-progress.ts
    |-- user-subscription.ts
  |- app/
    |-- (auth)/
    |-- (main)/
    |-- (marketing)/
    |-- admin/
    |-- api/
    |-- lesson/
    |-- apple-icon.png
    |-- favicon.ico
    |-- globals.css
    |-- icon.svg
    |-- layout.tsx
    |-- manifest.ts
  |- components/
    |-- modals/
    |-- ui/
    |-- arabic-text.tsx
    |-- auth-controls.tsx
    |-- feed-wrapper.tsx
    |-- invite.tsx
    |-- language-switcher.tsx
    |-- locale-provider.tsx
    |-- logo.tsx
    |-- meanings.tsx
    |-- mobile-header.tsx
    |-- mobile-sidebar.tsx
    |-- mode-provider.tsx
    |-- promo.tsx
    |-- read-aloud.tsx
    |-- sidebar-item.tsx
    |-- sidebar.tsx
    |-- sticky-wrapper.tsx
    |-- tour.tsx
    |-- user-progress.tsx
  |- config/
    |-- index.ts
  |- content/
    |-- references/
  |- db/
    |-- drizzle.ts
    |-- queries.ts
    |-- schema.ts
  |- docs/
  |- lib/
    |-- admin.ts
    |-- arabic.ts
    |-- auth.ts
    |-- exercises.ts
    |-- i18n.ts
    |-- juz.ts
    |-- locale.ts
    |-- mode.ts
    |-- preferences.ts
    |-- progress.ts
    |-- recitation.ts
    |-- reminders.ts
    |-- stripe.ts
    |-- utils.ts
  |- public/
  |- scripts/
    |-- content/
    |-- import-content.ts
    |-- prod.ts
  |- store/
    |-- use-exit-modal.ts
    |-- use-hearts-modal.ts
    |-- use-practice-modal.ts
  |- .env.example
  |- .env/.env.local
  |- .gitignore
  |- .prettierrc.json
  |- bun.lock
  |- components.json
  |- constants.ts
  |- drizzle.config.ts
  |- environment.d.ts
  |- eslint.config.mjs
  |- next.config.ts
  |- package.json
  |- postcss.config.js
  |- proxy.ts
  |- tailwind.config.ts
  |- tsconfig.json
  |- vercel.ts
```

<!--- FOLDER_STRUCTURE_END --->

## Contributing

Faqih is built by volunteers, and help is welcome:

- **Developers:** pick a card from **Ready** on the [project board](https://github.com/users/aliabusaleh/projects/1), and link your pull request to it. Check Arabic (RTL) and English, phone and desktop, and kids and full mode. Run `bun run lint` before opening a PR.
- **Content contributors:** follow [content/README.md](content/README.md). Every item needs a source.
- **Scholars and teachers:** content goes live only after your review. Watch the **📿 Scholarly review** column.
- **Found a mistake in a lesson?** [Open an issue](https://github.com/aliabusaleh/faqih/issues) with the lesson, the problem and the correct source.

The principles every change follows (Islamic first, free knowledge, authentic and reviewed, the Quran never altered, gentle motivation) are on the [project board](https://github.com/users/aliabusaleh/projects/1).

## Acknowledgements

- Faqih started as a fork of [Lingo](https://github.com/sanidhyy/duolingo-clone) by Sanidhya Kumar Verma (MIT licence), built on [Code with Antonio](https://codewithantonio.com/)'s course.
- The Quran text and its font are by the King Fahd Glorious Quran Printing Complex, served by the [Quran Foundation](https://quran.foundation); surah data and translations are from [alquran.cloud](https://alquran.cloud), the hadith from [fawazahmed0/hadith-api](https://github.com/fawazahmed0/hadith-api), and the adhkar from [Hisn al-Muslim](https://www.hisnmuslim.com).
- Sound effects: [Kenney](https://kenney.nl/) and [Freesound](https://freesound.org/).

### Dependencies

<!--- DEPENDENCIES_START --->

- [@clerk/localizations](https://www.npmjs.com/package/@clerk/localizations): 4.5.6
- [@clerk/nextjs](https://www.npmjs.com/package/@clerk/nextjs): ^7.2.8
- [@eslint/eslintrc](https://www.npmjs.com/package/@eslint/eslintrc): ^3
- [@neondatabase/serverless](https://www.npmjs.com/package/@neondatabase/serverless): ^1.1.0
- [@radix-ui/react-avatar](https://www.npmjs.com/package/@radix-ui/react-avatar): ^1.1.11
- [@radix-ui/react-dialog](https://www.npmjs.com/package/@radix-ui/react-dialog): ^1.1.15
- [@radix-ui/react-progress](https://www.npmjs.com/package/@radix-ui/react-progress): ^1.1.8
- [@radix-ui/react-separator](https://www.npmjs.com/package/@radix-ui/react-separator): ^1.1.8
- [@radix-ui/react-slot](https://www.npmjs.com/package/@radix-ui/react-slot): ^1.2.4
- [@types/node](https://www.npmjs.com/package/@types/node): ^25.8.0
- [@types/react](https://www.npmjs.com/package/@types/react): ^19.2.14
- [@types/react-dom](https://www.npmjs.com/package/@types/react-dom): ^19.2.3
- [@types/web-push](https://www.npmjs.com/package/@types/web-push): 3.6.4
- [@vercel/config](https://www.npmjs.com/package/@vercel/config): ^0.5.0
- [autoprefixer](https://www.npmjs.com/package/autoprefixer): ^10.5.0
- [class-variance-authority](https://www.npmjs.com/package/class-variance-authority): ^0.7.1
- [clsx](https://www.npmjs.com/package/clsx): ^2.1.0
- [dotenv](https://www.npmjs.com/package/dotenv): ^17.4.2
- [drizzle-kit](https://www.npmjs.com/package/drizzle-kit): ^0.31.10
- [drizzle-orm](https://www.npmjs.com/package/drizzle-orm): ^0.45.1
- [eslint](https://www.npmjs.com/package/eslint): ^10
- [eslint-config-next](https://www.npmjs.com/package/eslint-config-next): 16.2.6
- [eslint-config-prettier](https://www.npmjs.com/package/eslint-config-prettier): ^10.1.8
- [lucide-react](https://www.npmjs.com/package/lucide-react): ^1.14.0
- [next](https://www.npmjs.com/package/next): ^16.2.5
- [pg](https://www.npmjs.com/package/pg): ^8.20.0
- [postcss](https://www.npmjs.com/package/postcss): ^8
- [prettier](https://www.npmjs.com/package/prettier): ^3.8.3
- [prettier-plugin-tailwindcss](https://www.npmjs.com/package/prettier-plugin-tailwindcss): ^0.8.0
- [ra-data-simple-rest](https://www.npmjs.com/package/ra-data-simple-rest): ^5.14.5
- [react](https://www.npmjs.com/package/react): ^19.2.6
- [react-admin](https://www.npmjs.com/package/react-admin): ^4.16.20
- [react-circular-progressbar](https://www.npmjs.com/package/react-circular-progressbar): ^2.2.0
- [react-confetti](https://www.npmjs.com/package/react-confetti): ^6.4.0
- [react-dom](https://www.npmjs.com/package/react-dom): ^19.2.6
- [react-use](https://www.npmjs.com/package/react-use): ^17.6.0
- [sonner](https://www.npmjs.com/package/sonner): ^2.0.7
- [stripe](https://www.npmjs.com/package/stripe): ^22.1.0
- [tailwind-merge](https://www.npmjs.com/package/tailwind-merge): ^3.5.0
- [tailwindcss](https://www.npmjs.com/package/tailwindcss): ^3.4.19
- [tailwindcss-animate](https://www.npmjs.com/package/tailwindcss-animate): ^1.0.7
- [tsx](https://www.npmjs.com/package/tsx): ^4.22.3
- [typescript](https://www.npmjs.com/package/typescript): ^6
- [web-push](https://www.npmjs.com/package/web-push): 3.6.7
- [zustand](https://www.npmjs.com/package/zustand): ^5.0.13

<!--- DEPENDENCIES_END --->

## Licence

MIT. See [LICENSE](LICENSE). The original Lingo code is © 2024 Sanidhya Kumar Verma. Content sources keep their own licences (see [content/README.md](content/README.md)).

<div align="center">

_جزاكم الله خيرا for helping people learn the Book of Allah._
**اللهم اجعل القرآن ربيع قلوبنا**

<p align="right">(<a href="#readme-top">back to top</a>)</p>

</div>
