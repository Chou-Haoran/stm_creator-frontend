---
title: "Dev Log — Graph Editor Refactor"
date: "2025-10-04"
author: "Haoran Zhou"
---

## Summary
Refactored the Graph Editor to a modular, hook-driven architecture. **App.tsx** is now a thin composition layer (≈155 lines) that wires a dedicated editor hook and view components. State-transition helpers were split into focused utility modules. React Flow logic was decomposed so no file exceeds **300 lines**.

## Goals
- Improve **separation of concerns** and testability.
- Reduce top-level file size and complexity.
- Make state transitions reusable across loaders and modals.
- Prepare for future features (filters, swimlanes, edge creation modes).

## Key Changes

### 1) Hook Stack
- New directory: `src/app/hooks/`
  - **`useGraphEditor.ts`** — orchestrates editor state, handlers, and side effects.
  - **`useGraphBaseState.ts`** — base atoms/selectors, initial data wiring.
  - **`useGraphEditor.types.ts`** — shared types for hook I/O.
- Result: App logic moves out of the page; hooks own orchestration and keep files <300 lines.

### 2) Slimmer App Shell
- **`src/App.tsx`** reduced to ~**155 lines**.
- Now renders:
  - `GraphToolbar`
  - `EdgeCreationHint`
  - `LoadingState`
  - `ErrorState`
  - `TipsPanel`
- App only wires `useGraphEditor()` outputs into view components; no embedded editor logic.

### 3) State-Transition Utilities Restructure
- Deleted: `src/utils/stateTransitionUtils.tsx`
- New folder: `src/utils/stateTransition/`
  - `types.ts` — transition domain types
  - `layout.ts` — layout/geometry helpers
  - `nodes.ts` — node-level transforms
  - `edges.ts` — edge-level transforms
  - `index.ts` — re-exports for ergonomic imports
- Updated imports:
  - `src/utils/dataLoader.tsx`
  - `src/transitions/transitionModal.tsx`
  - Both now import from `utils/stateTransition`.

### 4) React Flow Decomposition
New helper modules coordinated by `useGraphEditor.ts`:
- `graphConstants.ts`
- `graphFilters.ts`
- `graphModel.ts`
- `graphNodes.ts`
- `graphRebuilder.ts`
- `graphTransitions.ts`
- `graphMutations.ts`
- `useGraphBaseState.ts`
- `useGraphEditor.types.ts`

**Outcome:** no single file exceeds **300 lines**; responsibilities are explicit and testable.

## Developer Notes
- Ensure all consumer imports use `utils/stateTransition` barrel (`index.ts`) to avoid path churn.
- `useGraphEditor` exposes a stable interface consumed by toolbar/panels; avoid reaching into submodules directly from views.
- Keep render-only components stateless; route mutations through the hook.

---

## Entry — Model Version Management
**Branch:** `feature/model-versioning`  
**Status:** Merged

### Summary
Added client-side version snapshots so editors can save, view, restore, and delete STM states without a backend. Versions persist in `localStorage`, letting users safely experiment and roll back.

### Goals
- Provide an explicit “save point” workflow for the STM graph.
- Persist versions locally across page reloads.
- Keep import/export pathways untouched while wiring version state through existing hooks.

### Key Changes
- Created `GraphModelVersion` type and `utils/versionStorage.ts` helper to manage serialized snapshots in `localStorage`.
- Extended `useGraphBaseState` / `useGraphEditor` with version state plus a new `graphVersions.ts` module for save/restore/delete actions.
- Updated `GraphToolbar` and added `VersionManagerModal` so users can trigger saves and manage timestamps within the UI.

### Notes
- History is capped at 50 versions to avoid unbounded storage; tweak the constant in `versionStorage` if requirements change.
- Restoring a version rebuilds nodes and edges via existing utilities, ensuring downstream components stay synchronized.

---

## Entry — EKS JSON Import/Export
**Branch:** `feature/eks-json-import-export`  
**Status:** Merged

### Summary
Added import/export support for the EKS JSON schema so STM graphs can move between this editor and PLANR/legacy STM datasets. Users can export the current graph as JSON or import an external file to redraw the diagram.

### Goals
- Generate schema-compliant JSON containing state condition/estimate data and transition timing/likelihood/delta fields.
- Allow developers to load an EKS JSON file and have the canvas rebuild automatically.
- Surface clear validation errors when the payload is malformed.

### Key Changes
- Introduced `utils/eksJson.ts` with converters between `BMRGData` and the EKS schema, including guard rails for missing fields.
- Added `graphImportExport.ts` and connected it to `useGraphEditor` so export uses the active model and import rebuilds nodes/edges via existing helpers.
- Extended `GraphToolbar` with hidden file input plus “Import EKS” / “Export EKS” buttons to make the workflow accessible in the UI.

### Notes
- Imports currently use `window.alert` for errors; migrate to an in-app toast when a notification system is available.
- Export filenames include ISO timestamps—coordinate with downstream tooling if a different naming convention is needed.


