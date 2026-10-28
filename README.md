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
2. Under **Build and deployment**, choose **Deploy from a branch**.
3. Select branch `main` and folder `/ (root)`.
4. Save and wait for the first deployment.

## Roadmap
- Validate the workflow with real homeowners and builders
- Replace demo prices with a region-aware, dated material price catalogue
- Improve room editor and plan export
- Add separate plumbing and electrical planning views
- Package the responsive web app as an Android APK after the web MVP is tested
