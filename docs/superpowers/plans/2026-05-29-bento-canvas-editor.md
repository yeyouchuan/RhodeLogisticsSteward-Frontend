# Bento Canvas Editor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the cramped schedule table with a strict-layout Bento canvas editor where facilities are draggable/resizable widgets and operators are selected from an in-room slot picker dialog.

**Architecture:** The schedule document moves to `version: 2` with shared canvas room nodes plus per-queue assignments. Facility placement is shared by all queues; queue tabs only change assigned operators. The left sidebar becomes a facility/layout palette only, while operator selection moves fully into `OperatorPickerDialog`.

**Tech Stack:** React 19, TypeScript, Vite, Vitest, Playwright, `@dnd-kit/core`, `@base-ui/react`, `html-to-image`.

---

## Fixed Product Decisions

- Branch: `feat/bento-canvas-editor`.
- Canvas ratio: keep fixed `16 / 9` export canvas.
- Grid: use a `24 x 12` logical grid; all movement and resizing snaps to grid cells.
- Queue model: 1-3 queues still exist, but all queues share the same facility positions and sizes.
- Sidebar: facility/layout controls only; no operator pool in sidebar.
- Operator selection: click an empty or filled facility slot, open picker dialog, assign or clear operator there.
- Picker dialog filters: room skill, production formula, assigned-only toggle, and name search.
- Facility set for this version: `CONTROL`, `TRADING`, `MANUFACTURE`, `POWER`, `MEETING`, `HIRE`.
- Excluded from this version: `DORMITORY`, `TRAINING`, `WORKSHOP`, `PRIVATE`, `ELEVATOR`, `CORRIDOR`.
- Operator art: use existing `portraitPath`; no multi-skin or alternate portrait source in this version.

## Layout Rules

- `153`: 1 trading, 5 manufacturing, 3 power.
- `243`: 2 trading, 4 manufacturing, 3 power.
- `252`: 2 trading, 5 manufacturing, 2 power.
- `333`: 3 trading, 3 manufacturing, 3 power.
- `342`: 3 trading, 4 manufacturing, 2 power.
- Every layout also includes exactly one control center, one reception room, and one office.
- Strict mode means users cannot add more than the layout allows.
- A room can be removed during editing only if the palette then shows it as missing and allows re-adding it.
- PNG export is allowed for incomplete drafts, but the editor must show a visible validation warning when required rooms are missing.

## Facility Definitions

```ts
export type BentoRoomTypeId =
  | "CONTROL"
  | "TRADING"
  | "MANUFACTURE"
  | "POWER"
  | "MEETING"
  | "HIRE";

export const bentoRoomDefinitions = {
  CONTROL: { label: "控制中枢", slotCount: 5, colorRole: "other", defaultSize: { w: 10, h: 4 }, minSize: { w: 8, h: 3 } },
  TRADING: { label: "贸易站", slotCount: 3, colorRole: "trade", defaultProduct: "Money", defaultSize: { w: 7, h: 3 }, minSize: { w: 6, h: 3 } },
  MANUFACTURE: { label: "制造站", slotCount: 3, colorRole: "manufacture", defaultProduct: "PureGold", defaultSize: { w: 7, h: 3 }, minSize: { w: 6, h: 3 } },
  POWER: { label: "发电站", slotCount: 1, colorRole: "power", defaultSize: { w: 5, h: 3 }, minSize: { w: 4, h: 2 } },
  MEETING: { label: "会客室", slotCount: 2, colorRole: "other", defaultSize: { w: 7, h: 3 }, minSize: { w: 5, h: 2 } },
  HIRE: { label: "办公室", slotCount: 1, colorRole: "other", defaultSize: { w: 5, h: 3 }, minSize: { w: 4, h: 2 } },
} as const;
```

## Data Model

```ts
export interface GridRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface BentoCanvasGrid {
  columns: 24;
  rows: 12;
}

export interface BentoRoomNode {
  roomNodeId: string;
  roomType: BentoRoomTypeId;
  roomIndex: number;
  label: string;
  slotCount: number;
  product?: ProductKind;
  rect: GridRect;
}

export interface BentoCanvasState {
  grid: BentoCanvasGrid;
  rooms: BentoRoomNode[];
}

export interface RoomAssignment {
  assignmentId: string;
  roomNodeId: string;
  roomType: string;
  roomIndex: number;
  product?: string;
  operators: SlotAssignment[];
  paperEfficiencyLabel: string;
  effectiveEfficiencyLabel: string;
  notes: string[];
}

export interface ScheduleDocument {
  version: 2;
  title: string;
  subtitle: string;
  authorText: string;
  layoutId: string;
  queueCount: number;
  activeQueueId: string;
  canvas: BentoCanvasState;
  queues: ScheduleQueue[];
  productionSummary: ProductionSummary;
  droneSummary: DroneSummary;
  notes: string[];
  updatedAt: string;
}
```

## Files

- Create `src/domain/bentoDefinitions.ts`: facility definitions, layout counts, color roles, product defaults.
- Create `src/domain/bentoGrid.ts`: snap, clamp, overlap detection, and first-fit packing.
- Create `src/domain/createBentoSchedule.ts`: default v2 schedule creation.
- Create `src/domain/migrateScheduleDocument.ts`: v1 and MAA import migration into v2.
- Modify `src/domain/scheduleDocument.ts`: v2 validation and mutation helpers.
- Modify `src/state/useScheduleStore.ts`: active queue, room movement, resize, add/remove room, product updates.
- Replace `src/components/editor/OperatorPanel.tsx` with `src/components/editor/BuildingPalette.tsx`.
- Create `src/components/canvas/BentoCanvas.tsx`, `BentoRoomCard.tsx`, `BentoRoomSlot.tsx`, `QueueTabs.tsx`.
- Modify `src/components/picker/OperatorPickerDialog.tsx`: move all operator filters into the dialog.
- Replace table-specific CSS in `src/styles/canvas.module.css` and editor sidebar CSS in `src/styles/editor.module.css`.
- Update tests under `tests/domain`, `tests/components`, and `tests/e2e`.

## Implementation Tasks

### Task 1: Branch And Baseline

- [ ] Create branch: `git checkout -b feat/bento-canvas-editor`.
- [ ] Run baseline tests: `bun run test`.
- [ ] Expected: `9 passed (9)` test files.
- [ ] Run baseline build: `bun run build`.
- [ ] Expected: Vite build completes with no TypeScript errors.

### Task 2: Define Bento Domain

- [ ] Add `src/domain/bentoDefinitions.ts` with layout counts, fixed rooms, excluded rooms, room definitions, and product-to-formula mapping.
- [ ] Add `src/domain/bentoGrid.ts` with these exported functions: `snapRect`, `clampRect`, `rectsOverlap`, `canPlaceRect`, `packRooms`.
- [ ] Add tests in `tests/domain/bentoDefinitions.test.ts` proving every supported layout expands to the exact room counts.
- [ ] Add tests in `tests/domain/bentoGrid.test.ts` proving snap/clamp/overlap behavior.
- [ ] Run: `bun run test -- tests/domain/bentoDefinitions.test.ts tests/domain/bentoGrid.test.ts`.
- [ ] Expected: both test files pass.

### Task 3: Upgrade Schedule Document To V2

- [ ] Modify `src/domain/types.ts` with `BentoRoomTypeId`, `GridRect`, `BentoRoomNode`, `BentoCanvasState`, and v2 `ScheduleDocument`.
- [ ] Create `src/domain/createBentoSchedule.ts`.
- [ ] Keep `createDefaultSchedule()` as a compatibility wrapper that calls `createBentoSchedule()`.
- [ ] Generate v2 assignments using `roomNodeId` so each queue references the same canvas rooms.
- [ ] Update `validateScheduleDocument()` to require `version === 2`, valid canvas grid, unique `roomNodeId`, and assignment `roomNodeId` references.
- [ ] Add tests proving `createBentoSchedule("243", 3)` creates 12 rooms: 1 control, 2 trading, 4 manufacturing, 3 power, 1 meeting, 1 office.
- [ ] Run: `bun run test -- tests/domain/scheduleDocument.test.ts tests/domain/layoutPresets.test.ts`.
- [ ] Expected: updated tests pass.

### Task 4: Import And Migration

- [ ] Add `src/domain/migrateScheduleDocument.ts`.
- [ ] Move old v1 shape validation into this migration file.
- [ ] Modify `src/export/importJson.ts` so it returns migrated v2 documents for v1 JSON and MAA JSON.
- [ ] Modify `src/export/maaCustomInfrast.ts` so MAA imports create v2 Bento schedules directly.
- [ ] Preserve queue names, periods, drone summary, operator IDs, override names, and products.
- [ ] Add tests for v1 JSON import and MAA `243` import.
- [ ] Run: `bun run test -- tests/domain/maaCustomInfrast.test.ts tests/domain/scheduleDocument.test.ts`.
- [ ] Expected: imports return `version: 2`.

### Task 5: Store Mutations

- [ ] Update `src/state/useLocalDraft.ts` storage key to `rhode-logistics-schedule-draft-v2`.
- [ ] Update `src/state/useScheduleStore.ts` with:
  - `setActiveQueue(queueId)`
  - `moveRoom(roomNodeId, rect)`
  - `resizeRoom(roomNodeId, rect)`
  - `addRoom(roomType)`
  - `removeRoom(roomNodeId)`
  - `setRoomProduct(roomNodeId, product)`
- [ ] Keep existing slot actions: assign, clear, elite phase, swap.
- [ ] Add domain tests proving moving/resizing one room updates shared canvas but not operator assignments.
- [ ] Run: `bun run test -- tests/domain/scheduleDocument.test.ts`.
- [ ] Expected: all document mutation tests pass.

### Task 6: Facility Palette Sidebar

- [ ] Replace operator sidebar with `BuildingPalette`.
- [ ] Palette shows layout selector, import-layout/reset action, and facility templates.
- [ ] Each template shows `placed / required`.
- [ ] Dragging a facility from palette adds a missing room of that type if strict count allows it.
- [ ] Disable templates when placed count equals required count.
- [ ] No operator cards appear in sidebar.
- [ ] Add component tests proving the sidebar does not render operator pool cards and disables full facility types.
- [ ] Run: `bun run test -- tests/components/BuildingPalette.test.tsx`.
- [ ] Expected: tests pass.

### Task 7: Bento Canvas And Room Cards

- [ ] Replace `ScheduleCanvas` internals with `BentoCanvas`.
- [ ] Render only the active queue's assignments.
- [ ] Room cards render title, product selector when relevant, efficiency labels, and slots.
- [ ] Slot layout inside card auto-fits based on card `w/h` and slot count.
- [ ] Use colors:
  - trade: blue
  - manufacture: yellow-orange
  - power: light green
  - other: white
- [ ] Add drag movement using `@dnd-kit/core`; drop rect snaps to grid.
- [ ] Add resize handles with pointer events; resize rect snaps to grid and clamps to min size.
- [ ] If a move/resize overlaps another room, revert to previous rect.
- [ ] Add component tests for card capacity, product selector, and active queue rendering.
- [ ] Run: `bun run test -- tests/components/BentoCanvas.test.tsx`.
- [ ] Expected: tests pass.

### Task 8: In-Room Operator Picker

- [ ] Modify `OperatorPickerDialog` so it owns filter state locally.
- [ ] Dialog controls include:
  - name search input
  - room skill checkboxes from `reference.roomTypes`
  - production formula checkboxes from `reference.productionFormulaTypes`
  - assigned-only toggle
  - elite phase selector for filled slots
- [ ] When opened from a room slot, preselect matching room skill:
  - `CONTROL`, `TRADING`, `MANUFACTURE`, `POWER`, `MEETING`, `HIRE`.
- [ ] When opened from a manufacturing product, preselect formula:
  - `PureGold -> F_GOLD`
  - `CombatRecord -> F_EXP`
- [ ] Assigning an operator closes the dialog.
- [ ] Clearing a slot closes the dialog.
- [ ] Add tests for all four required filters.
- [ ] Run: `bun run test -- tests/components/OperatorPickerDialog.test.tsx`.
- [ ] Expected: tests pass.

### Task 9: Toolbar, Tabs, Import, Export

- [ ] Replace queue count dropdown with `QueueTabs`.
- [ ] Keep JSON import, JSON export, PNG export, reset.
- [ ] Keep layout selector, but changing layout creates a new v2 Bento document for that layout.
- [ ] PNG export targets `[data-canvas-root]` and excludes palette, toolbar, picker, and resize handles if hidden in export mode.
- [ ] Add warning text when required room counts are incomplete.
- [ ] Run: `bun run test -- tests/components/ScheduleCanvas.test.tsx`.
- [ ] Expected: tests pass with updated Bento expectations.

### Task 10: E2E And Polish

- [ ] Update `tests/e2e/canvas-layout.spec.ts` for Bento behavior.
- [ ] E2E must cover:
  - `/sample/243` renders a Bento canvas.
  - Sidebar contains facilities, not operators.
  - Clicking a slot opens operator picker.
  - Picker search filters by name.
  - Room movement snaps to grid.
  - Room resize snaps to grid.
  - Queue switch preserves room positions and changes assignments.
  - PNG export button remains outside canvas.
- [ ] Run: `bun run test`.
- [ ] Expected: all Vitest tests pass.
- [ ] Run: `bun run build`.
- [ ] Expected: TypeScript and Vite build pass.
- [ ] Run: `bun run e2e`.
- [ ] Expected: Playwright tests pass.

## Acceptance Criteria

- The app no longer shows the old cramped table layout.
- The left sidebar contains layout/facility controls only.
- Operators are assigned only by clicking slots inside facility cards and using the dialog.
- The dialog supports room skill filters, production formula filters, assigned-only, and name search.
- `243` and the other layout IDs enforce exact trading/manufacturing/power limits.
- Facilities snap to a fixed grid when moved or resized.
- All queues share one canvas layout.
- JSON import/export supports v2; v1 and MAA imports migrate to v2.
- PNG export captures only the current active queue canvas.
- `bun run test`, `bun run build`, and `bun run e2e` pass.

## Assumptions

- This version intentionally excludes dormitory, training room, and workshop from the Bento scheme.
- This version uses existing generated operator portraits only.
- Efficiency calculation remains the existing mock calculation unless a separate real calculator task is requested.
- Existing public operator and building reference data remain the source of picker filters.
