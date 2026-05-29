# Rhode Logistics Schedule Generator

Static React + Vite frontend for editing Arknights base schedule boards and exporting the 16:9 board as PNG.

## Setup

```bash
npm install
npm run generate:data
npm run dev
```

The app reads generated static assets from `public/`, so run `npm run generate:data` before the first local build.

## Scripts

- `npm run generate:operators`: reads `D:\Code Rep\arknights\avatars\operators.json` and copies portraits from `D:\Code Rep\arknights\avatars\avatars`.
- `npm run generate:building`: reads compact CSV/JSON data from `D:\Code Rep\arknights\arknights-building-data\data`.
- `npm run build`: type-checks and builds the static app.
- `npm run test`: runs Vitest unit/component tests.
- `npm run e2e`: runs Playwright smoke tests against the built preview server.

## UI System

Buttons use `@base-ui/react/button` through `ContourButton`. The visual system adapts the Uriyoo contour button from:

- `D:\Code Rep\Web\uriyoo-2.0\app\_components\home-story\ContourButton.tsx`
- `D:\Code Rep\Web\uriyoo-2.0\app\globals.css`

Supported variants are `dark`, `white`, `yellow`, and `red`. Supported sizes are `default` and `sm`.

## Filters

Room-type filters match `operatorSkills.roomType` from `operator_buffs.csv`.

Production formula filters match parsed `targets_json` from `buffs.csv`. The frontend does not infer formula applicability from Chinese description text.

## Import / Export

The editable JSON format is `ScheduleDocument` version `1`. JSON export can be imported back through the toolbar. PNG export uses `html-to-image` and targets only the `ScheduleCanvas`, not the editor shell.

## Current Limitation

Production totals and efficiency labels are mock estimates. They are deterministic and editable, but they are not real `RhodeLogisticsSteward` formula parity. The planned upgrade path is to port the minimal production calculation to TypeScript and add parity fixtures from `RhodeLogisticsSteward`.
