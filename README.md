# BEKIUZ BUILD

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

## Deploy with GitHub Pages
1. Open repository **Settings → Pages**.
2. Under **Build and deployment → Source**, select **GitHub Actions**.
3. Open the **Actions** tab and select **Deploy BEKIUZ BUILD to GitHub Pages**.
4. Choose the latest run and click **Re-run all jobs**.
5. After a successful deploy, the project site should be available at `https://bekiuz.github.io/BEKIUZ_BUILD/`.

## Roadmap
- Validate the workflow with real homeowners and builders
- Replace demo prices with a region-aware, dated material price catalogue
- Improve room editor and plan export
- Add separate plumbing and electrical planning views
- Package the responsive web app as an Android APK after the web MVP is tested


## AI planner setup (Netlify)

The AI assistant is implemented as a server-side Netlify Function. The Gemini key is never placed in browser JavaScript.

1. Connect this repository to a new Netlify site using the Netlify dashboard.
2. In the site's environment variables, add `GEMINI_API_KEY` with a Gemini API key created in Google AI Studio. Scope it to Functions.
3. Optionally set `GEMINI_MODEL`; the default in this project is `gemini-3.8-flash`.
4. Trigger a fresh deployment after saving the environment variables.
5. Test the AI planner on the deployed site. The AI assistant intentionally displays a setup message until the server key is configured.

See the official [Gemini generateContent API](https://ai.google.dev/api/generate-content) and [Netlify Functions environment variables](https://docs.netlify.com/build/functions/environment-variables/).

## Local function development

Install the Netlify CLI, then run `netlify dev` from the repository root. Set `GEMINI_API_KEY` in the local Netlify development environment; never commit the key into GitHub or put it in `app.js`.

GitHub Pages can host the static prototype, but it does not execute this Netlify Function. The AI endpoint requires the project to be deployed with Netlify Functions enabled.
