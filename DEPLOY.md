# SIREEN website — licensing fix (ready to deploy)

Files here are the CORRECTED live site. `index.html` was produced by downloading
the current live page (https://goalaif-wep.vercel.app/) and replacing ONLY the
false open-source / MIT claims with proprietary wording. CSS, JavaScript,
layout, images, all SEO metadata, and all three JSON-LD blocks are byte-identical
to the live page apart from those licensing lines.

## What changed (9 lines)
- og:description / twitter:description: "Local-first, open source." -> "Local-first, proprietary."
- JSON-LD SoftwareApplication license: opensource.org/licenses/MIT -> "Proprietary — All Rights Reserved"
- JSON-LD FAQPage answer + visible FAQ answer to "Is SIREEN open source?":
  "Yes ... open source ..." -> "No. SIREEN is proprietary software. The SIREEN source code is not publicly available."
- nav link "OPEN SOURCE" -> "PROPRIETARY"
- hero credit "LOCAL · FORGE-BACKED · OPEN SOURCE" -> "... PROPRIETARY"
- install kicker "LOCAL-FIRST · FORGE-BACKED · OPEN SOURCE" -> "... PROPRIETARY"
- footer "LOCAL-FIRST · FORGE-BACKED · OPEN SOURCE · © 2026 GOALAIF" -> "... PROPRIETARY · ..."

Left unchanged (not licensing claims): Offer price "0", isAccessibleForFree: true
(SIREEN is proprietary freeware — free to install, not open source).

## Deploy (Vercel — manual, static)
The live site is NOT git-connected and the local Vercel CLI is not logged in,
so deployment must be done by the site owner:

    cd "C:\Users\humos\Goalaif\sireen-website-fix"
    npx vercel login          # opens browser; do not paste tokens anywhere
    npx vercel --prod         # select the existing "goalaif-wep" project when prompted

Or drag this folder into the Vercel dashboard for the goalaif-wep project.

Do NOT deploy any older local copy (Open Design export / myproject_wepsite) —
those predate the live SEO/FAQ/JSON-LD layer.
