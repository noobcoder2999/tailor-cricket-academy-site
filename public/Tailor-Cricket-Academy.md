# Tailor Cricket Academy - public scroll edition

**Website:** https://noobcoder2999.github.io/tailor-cricket-academy-site/

Published with the owner's approval. The public edition is read-only; the local owner editor and enquiry records are not exposed.

This is the read-only GitHub Pages edition of the Tailor Cricket Academy concept website. It retains the coach-photo scroll scene, responsive design, motion controls, programmes, galleries, licensed video, the cricket introduction and batting simulator.

The program section contains exactly nine selected pathways: beginner, advanced, batting, personal coaching, pace bowling, spin bowling, summer camp, high-performance and group coaching. The personal option is titled **Ready for the next level - personal coaching** and keeps the `one-to-one` ID. Old image slots remain readable, but retired programs are not listed.

Jaipur-focused page titles/descriptions and the original guide at `/blog/choosing-cricket-coaching-jaipur/` improve the relevance of the content without claiming a "best" ranking. The journal is linked from the homepage and footer. Public pages permit indexing and have canonical URLs and a sitemap. Rankings and inclusion in search results are not guaranteed. The local edition remains noindex.

## Public edition boundaries

- No enquiry collection, bookings, payments, photo uploads or admin editing.
- Enquiry buttons explain that this is a preview; they do not request personal data or issue fake receipts.
- Approved display photographs, actual coach profiles, logo and academy contact details are included in `src/content/published-media.json` and `public/owner-media`. No saved enquiries, credentials, environment secrets or unrelated private files are copied.
- The owner-approved coach-scene photograph and licensed sample assets are included. The separate laptop application and private documentation repository remain intact.
- Sample coaches, testimonials, results, amenities and schedules remain clearly illustrative. This is not a claim that a live academy is accepting bookings.

GitHub Pages serves static files and cannot run the original Node API. Editing and local storage remain in the owner's separate application.

## Run and build

Use Node.js 22 or newer:

```sh
npm ci
npm run dev
```

Open `http://127.0.0.1:3000/tailor-cricket-academy-site/`.

```sh
npm run typecheck
npm run lint
npm run build
```

After building, `npm run test:pages` checks the real static files in a browser. Install Playwright Chromium with `npx playwright install chromium` if it is not already available. Set `PAGES_TEST_CHANNEL=msedge` to use an installed Edge browser, or `PAGES_TEST_URL` to check the deployed site instead of the local export.

The production build creates `out/`. The Pages workflow is manually dispatched; deployment requires `ENABLE_PUBLIC_PAGES=true`. The project path is set in `src/lib/site.ts` and used by `next.config.ts`. `sitePath` and `SiteLink` apply it to assets and navigation. This edition uses ordinary document links so static-host navigation has no server-router dependency.

## Design and motion

The supplied coach photograph is presented as a foreground cutout over a softer ground layer. Native scroll changes position, scale and perspective at different rates, creating a 2.5D impression without inventing footage or a scanned human model. The page's content remains readable above the scene. Pause page motion freezes decorative motion; reduced-motion preferences keep the composition static. There is no scroll hijacking.

References: [Lusion v3](https://www.awwwards.com/sites/lusion-v3), [Unseen Studio](https://www.awwwards.com/sites/unseen-studio), and the earlier [ORYZO](https://oryzo.ai/) editorial direction. No reference-site code or artwork is copied.

The separately selectable cricket introduction and batting lab use procedural, generic athletes. They are educational approximations, not validated biomechanics, motion capture, celebrity replicas or real coaching footage. A lightweight analysis/fallback view remains available when WebGL is unavailable.

## Source map

- `src/app/page.tsx`: homepage and its sections.
- `src/components/CoachScrollBackdrop.tsx`: layered scroll scene.
- `src/app/coach-scroll.css`: coach-photo edition.
- `src/content/academy.ts`: labeled sample academy content.
- `src/components/intro/`: optional cricket introduction.
- `src/components/simulator/` and `src/lib/sim/`: batting lab.
- `src/components/EnquiryForm.tsx`: public read-only notice, not a form.
- `src/components/MediaEditing.tsx`: immutable public media view; editing controls render nothing.
- `src/app/privacy/`, `terms/`, `credits/`: public-specific notices and attribution.

## Media and permissions

The Head Coach/Bowling Coach profiles and academy contact fields are drawn from the owner's approved display snapshot, not an empty catalogue. Photo captions use compact **Photo credits** links; actual photographer credits remain on `/credits`. Owner approval and credit text do not override a photographer's rights. No enquiry records are included.

The About copy attributes RCA affiliation and hosted RCA matches to the academy owner; an independent affiliation record was not available during research.

The coach photograph was provided and approved for this publication by the owner. It and its derived cutout/background are **not CC0** and are not offered under an open redistribution license.

Third-party assets retain their own licenses:

- Venue photographs: Acabashi, CC BY-SA 4.0.
- Archival cricket video: Nomadtales, CC BY-SA 3.0; not academy footage.
- Kohli portrait: Anand Anil, CC BY-SA 4.0; Warne portrait: Tourism Victoria, CC BY 2.0. Editorial inspiration only; no endorsement.
- Programme photographs: CC0 Wikimedia samples, with exact source/creator information in `src/content/program-photos.json`.
- Generic athlete models: adapted MakeHuman CC0 mesh and rig. The complete CC0 text is in `public/models/LICENSE-CC0.txt`.
- Original crest, equipment/player illustrations, procedural scenery and synthesized audio have the attribution documented in `src/content/academy.ts`.

The live **Media credits** page provides exact source and license links. Preserve them and applicable share-alike obligations when reusing licensed assets.

## Privacy

The application does not collect personal information. The optional intro stores only the session preference `tailor-intro`. No analytics or advertising service is included. GitHub Pages may process technical requests under GitHub's privacy policy. Do not post sensitive personal details in repository issues.
