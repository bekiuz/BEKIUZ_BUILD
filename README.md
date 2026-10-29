# BEKIUZ BUILD

**Design file:** [BEKIUZ BUILD UI in Figma](https://www.figma.com/design/0zbg59oMmcbr0Y5vC6wMHu)

**Current state:** The UI has been refreshed to a dark architectural-studio style. The planning form, illustrative 3D house, sample floor plan, demo material estimates, utilities estimate, and AI-planner interface are in the public website. AI integration code now targets the existing Bekiuz AI Cloudflare Worker; the Worker redeploy is pending deployment credentials.

**Plan your home before you build it.**

BEKIUZ BUILD is an early MVP concept for home planning in Uzbekistan. It helps people sketch a home, preview a simple 3D model, and understand approximate construction material quantities and costs before talking to architects and builders.

## Current MVP

- Responsive Uzbek-language interface
- Plot and house dimensions
- One- or two-storey house options
- Editable room-count preferences and roof type
- Illustrative 3D house preview with gable, hip and flat roof options
- Initial material and cost estimates using clearly labeled demo prices
- Initial water/electricity quantity estimates
- Project summary that can be printed or saved as PDF from the browser
- AI planner integration targeting the existing Bekiuz AI Cloudflare Worker

## Important limitations

This MVP is a planning and presentation prototype, not a construction drawing or professional bill of quantities. The demo prices are not verified live market prices. Foundation dimensions, structural design, electrical wiring, plumbing and other safety-critical systems must be checked and designed by qualified professionals using site conditions and applicable local requirements. The AI planner offers concept suggestions only and does not replace an architect or engineer.

## Website

The GitHub Pages site is configured to publish from the `main` branch with GitHub Actions.

- Repository: [bekiuz/BEKIUZ_BUILD](https://github.com/bekiuz/BEKIUZ_BUILD)
- Website: [bekiuz.github.io/BEKIUZ_BUILD](https://bekiuz.github.io/BEKIUZ_BUILD/)
- Validation workflow: [GitHub Actions](https://github.com/bekiuz/BEKIUZ_BUILD/actions)

## AI connection

The web interface calls the existing Bekiuz AI Worker at:

`https://bekiuz-ai.bekiuz282.workers.dev/api`

The worker now has a house-planning route at `/api/plan`, CORS handling for the website and the `/api/health` status route. It uses the existing Cloudflare Workers AI binding, so the BEKIUZ BUILD site does **not** need a separate Gemini API key.

**Important:** The latest Worker source has passed the code-check workflow, but the GitHub deploy workflow skipped its actual deploy because these repository Actions secrets are not configured:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

To enable automatic deployment, open the [Bekiuz AI repository Actions secrets](https://github.com/bekiuz/bekiuz-ai/settings/secrets/actions) and create those two secrets with values from the intended Cloudflare account. Never publish the token in code, commit it to Git, or paste it into a chat. Then run the [Deploy Bekiuz AI Worker workflow](https://github.com/bekiuz/bekiuz-ai/actions/workflows/deploy-worker.yml) or push a new change to the Worker repository. Confirm that `https://bekiuz-ai.bekiuz282.workers.dev/api/health` responds with `configured: true`. Once deployment is active, the website's AI badge should report its connection state.

## Supabase data schema (prepared, not connected)

The SQL migration at `supabase/migrations/20261028000000_house_projects.sql` defines:
- user-owned house projects with row-level security so each signed-in user only sees their own records;
- a read-only material catalogue with region, source and verification-date fields.

Apply this migration only to a dedicated BEKIUZ BUILD Supabase project after choosing the intended Supabase organization. Do not run it against a database used by other apps. The current MVP saves project settings in the local browser; cloud login/synchronization is not active until a dedicated project and public client configuration are connected.

## Roadmap

- Deploy and live-test the Bekiuz AI Worker planner endpoint
- Validate the workflow with real homeowners and builders
- Replace demo prices with a region-aware, dated material price catalogue
- Improve the room editor and plan export
- Refine separate plumbing and electrical planning views
- Test the Android debug APK on a real device

## Local development

Open `index.html` in a browser or use a static web server. The 3D preview imports Three.js from a CDN, so that feature needs internet access. To generate the public-only `dist/` directory, run:

```sh
node scripts/build.mjs
```

The unused Netlify function from the earlier Gemini approach remains in the repository for reference, but the current frontend planner is wired to the Bekiuz AI Worker instead.
