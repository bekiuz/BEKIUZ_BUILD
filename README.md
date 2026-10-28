# BEKIUZ BUILD

**Design file:** [BEKIUZ BUILD UI in Figma](https://www.figma.com/design/0zbg59oMmcbr0Y5vC6wMHu)

**Current release state:** source and validation pipeline are in GitHub; the Netlify project exists but is not yet connected to this repository or deployed. The Gemini endpoint is implemented but needs the Netlify deployment and server-side API key before it can answer real requests.


**Plan your home before you build it.**

BEKIUZ BUILD is an early MVP concept for home planning in Uzbekistan. The goal is to help people sketch a home, preview a simple 3D model, and understand approximate construction material quantities and costs before talking to architects and builders.

## Current MVP
- Responsive Uzbek-language interface
- Plot and house dimensions
- One- or two-storey house options
- Editable room-count preferences
- Illustrative 3D house preview
- Initial material and cost estimate using clearly labeled demo prices
- Project summary that can be printed or saved as PDF from the browser

## Important limitations
This MVP is a planning and presentation prototype, not a construction drawing or professional bill of quantities. The demo prices are not verified live market prices. Foundation dimensions, structural design, electrical wiring, plumbing and other safety-critical systems must be checked and designed by qualified professionals using site conditions and applicable local requirements.

## Run locally
Open `index.html` in a browser. The 3D preview loads Three.js from a CDN, so an internet connection is required for that feature.

## Deploy with Netlify (recommended)

The AI assistant requires a server-side function, so Netlify is the intended hosting target.

1. Open the [BEKIUZ BUILD Netlify project](https://app.netlify.com/projects/bekiuz-build).
2. In **Project configuration → Build & deploy → Continuous deployment**, connect the GitHub repository `bekiuz/BEKIUZ_BUILD` and branch `main`.
3. Keep the repository's `netlify.toml` build settings: command `node scripts/build.mjs`, publish directory `dist`, and functions directory `netlify/functions`.
4. Add `GEMINI_API_KEY` in **Environment variables** with Functions scope, then trigger a fresh deployment.

GitHub Actions validates the code; it does not deploy to GitHub Pages. A static GitHub Pages deployment cannot execute the server-side AI function.

## Roadmap
- Connect the repository to the Netlify project and test the live AI endpoint
- Validate the workflow with real homeowners and builders
- Replace demo prices with a region-aware, dated material price catalogue
- Improve room editor and plan export
- Refine separate plumbing and electrical planning views
- Package the responsive web app as an Android APK after the web MVP is tested


## Supabase data schema (prepared, not connected yet)

The SQL migration at `supabase/migrations/20261028000000_house_projects.sql` defines:
- user-owned house projects with row-level security so each signed-in user only sees their own records;
- a read-only material catalogue with region, source and verification-date fields.

Apply this migration only to a dedicated BEKIUZ BUILD Supabase project after choosing the intended Supabase organization. Do not run it against a database used by other apps. The current MVP saves project settings in the local browser; cloud login/synchronization is not active until a dedicated project and public client configuration are connected.

## AI planner setup (Netlify)

The AI assistant uses a Netlify Function and the Gemini generateContent API. The API key is read on the server and is never embedded in public JavaScript.

1. Create a Gemini API key in [Google AI Studio](https://aistudio.google.com/apikey). Do not paste it into this chat or commit it to GitHub.
2. In [the Netlify project settings](https://app.netlify.com/projects/bekiuz-build), add an environment variable named `GEMINI_API_KEY` and scope it to Functions.
3. Trigger a fresh deploy after saving the variable. The default model is `gemini-3.8-flash`; optionally set `GEMINI_MODEL` to another supported model.
4. Open the deployed site and submit a prompt in the AI planner.

The AI returns suggestions and a proposed set of house parameters. It does not create an approved architectural drawing. Structural engineering, electrical installation and plumbing details need qualified professional review.

## Local development

Run `node scripts/build.mjs` to generate a public-only `dist/` directory. Install the Netlify CLI and run `netlify dev` to test the function locally. Set `GEMINI_API_KEY` in the local environment; never place it in `app.js`.

Official references: [Gemini generateContent API](https://ai.google.dev/api/generate-content) and [Netlify Functions environment variables](https://docs.netlify.com/build/functions/environment-variables/).
