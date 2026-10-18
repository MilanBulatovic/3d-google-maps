# Crna Gora 3D Map

A full-screen photorealistic map of Montenegro. The page uses Google’s 3D Maps in the Maps JavaScript API: real terrain and buildings where Google has coverage, clickable 3D markers, and a native camera flight into a close bird’s-eye view.

## Technology stack

- Next.js 16 (App Router) and React 19
- TypeScript in strict mode
- Tailwind CSS
- Google Maps JavaScript API, weekly channel, `maps3d` and `marker` libraries
- Zod for environment and location validation
- Vitest and Testing Library

There is one route, `/`. The map feature is isolated under `src/features/map`, so later pages can reuse the loader, camera controller, and location types without rewriting them.

## Installation

```bash
npm install
cp .env.example .env.local
```

Put your browser API key in `.env.local`, then start the app:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

| Name | Where it runs | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Browser | Maps JavaScript API key used to load the 3D map |

This is a public key. It is embedded in the client bundle. Do not put server secrets in `NEXT_PUBLIC_` variables. Restrict the key in Google Cloud Console before you share a deployment.

The app does not draw a placeholder map when the key is missing or the API fails. It shows an error with a retry action.

## Google Cloud setup

1. Create or select a Google Cloud project and enable billing.
2. Enable **Maps JavaScript API** and **Geocoding API**. 3D Maps for the web is part of the Maps JavaScript API. World search (`Svijet`) uses Geocoding. Do not use the deprecated Google Earth API, and do not substitute the Map Tiles API or a 2D map.
3. Create an API key for browser use.
4. Restrict the key:
   - Application restriction: HTTP referrers. Include `http://localhost:3000/*` and your production origin.
   - API restriction: Maps JavaScript API and Geocoding API.
5. Restart `npm run dev` after changing `.env.local`. The key is read when the client bundle is built.

3D map sessions are billed as Google Maps Platform usage under the Immersive Maps SKU. Review current pricing in the Cloud Console before leaving a public deployment running. A key without billing, without the Maps JavaScript API, or with a referrer that does not match this site will fail to load the map.

## Map behavior

The opening camera is an elevated view of Montenegro, so pins along the coast and in the north stay in frame. Those values live in `src/features/map/config/camera.ts`. Selecting **Crna Gora** uses that same wide camera.

In this API, tilt `0` looks straight down and tilt `90` looks toward the horizon. Every other place uses two native `flyCameraTo` calls:

1. Approach the coordinates while range and tilt come down.
2. Finish close to the place, near tilt `12` and a range of about 420 meters, so the building and its immediate surroundings stay in frame.

`stopCameraAnimation()` runs before each new flight. A generation token ignores the previous animation’s `gmp-animationend`, so rapid selections replace the flight instead of chaining onto it. The selected place updates in the interface immediately.

If the user prefers reduced motion, the same flight uses `durationMillis: 0`, which the API documents as an immediate camera move.

Map controls call the same controller:

- Overview returns to the Montenegro camera.
- Recenter flies to the selected place’s bird’s-eye camera.
- Satellite and Hybrid are the weekly-channel presentation modes. Roadmap mode is beta-only and is not exposed.
- Heading buttons call `flyCameraTo` with the current range and tilt and a new heading.

Markers are `Marker3DInteractiveElement` instances, not 2D `AdvancedMarkerElement`s. They sit above the ground with extrusion, which the API allows for `RELATIVE_TO_GROUND`. A `PinElement` supplies the selected color. Clicks use `gmp-click`.

## Adding or editing places

Edit `src/features/map/data/locations.ts` for landmarks and the country view. Kindergartens, birthday venues, and children’s workshops live in `src/features/map/data/children-venues.json`. Each place needs a unique id, name, category, description, and real coordinates. Optional fields are altitude, image URL, address, tags, metadata, and `viewRange` / `viewTilt` for a wide camera. Zod checks the list when the module loads, including duplicate ids.

Vrtići are teal, rođendaonice are pink, and dječije radionice are purple. The set is every named OpenStreetMap kindergarten, childcare, and indoor-play place in Montenegro, plus published Podgorica playrooms and workshops whose addresses could be placed. It is not a government register of every kindergarten, and some street pins mark the street rather than a house number.

Search matches name, category, description, and tags. Choosing a search result uses the same selection path as a marker click.

Images may be remote URLs on `upload.wikimedia.org`. The location card shows a fallback if a photo is missing or fails to load.

## Checks

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Unit tests do not call Google and do not need an API key. The map component test substitutes a fake `Map3DElement`.

## 3D coverage and the weekly channel

Photorealistic mesh coverage is uneven. Some blocks in Podgorica show detailed buildings; others stay closer to draped satellite imagery or terrain. Camera distance and tilt cannot create detail Google has not published for that coordinate.

3D Maps for web is generally available on the Maps JavaScript API **weekly** channel (`v=weekly`). This app uses that channel. Weekly receives updates every week, so behavior can change sooner than on the quarterly channel. Alpha-only and beta-only surfaces are intentionally unused, including roadmap mode, `qualityMode`, and `Label3DElement`.

The map element is `Map3DElement` (`gmp-map-3d`). It renders only after `mode` is set. Hardware acceleration must be enabled in the browser.

## Project layout

```text
src/app/                App Router shell
src/features/map/       Map feature: canvas, camera, markers, search, places
src/components/ui/      Shared controls
src/lib/env.ts          Public API key validation
```
