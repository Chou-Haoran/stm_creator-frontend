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




---
title: "Dev Log — Transition Attribute & Filtering Panels"
date: "2025-10-07"
author: "Jiandi Mu"
---

## Summary
Added two additive UI panels to the STM editor :

- `src/extensions/TransitionAttributePanel.tsx` — edit `time_25`, `time_100`, `likelihood_25`, `likelihood_100`, `transition_delta`.
- `src/extensions/TransitionFilterPanel.tsx` — filter by `time_25/100` and optional probability range; composes with toolbar **Delta** and **Self-transitions**.
- `src/extensions/extensions.css` — shared lightweight styles.

Panels mount inside `<ReactFlow>`; edits use existing `onSaveTransition`; filtering is DOM show/hide.

## Goals
- Enable consistent editing of transition attributes.
- Provide workshop-friendly filtering by plausibility and probability.
- Avoid touching GraphStore/hook internals; keep integration minimal.
- Keep layout clear (no overlap with toolbar/Tips).

## Key Changes

### 1) Feature — Transition Attribute Panel
- **Files:** `src/extensions/TransitionAttributePanel.tsx`, `src/extensions/extensions.css`
- **Behavior:**
  - Resolves the freshest selection via `bmrgData + transition_id` .
  - Normalizes values: booleans → `0/1`; likelihoods clamped to `[0,1]`.
  - Calls existing `onSaveTransition`; optimistic local sync after save.
  - Collapsible (▾/▸); disabled when no selection.
- **Layout:** top: `76px`, left: `380px`, width: `340px`.

### 2) Feature — Transition Filtering Panel
- **Files:** `src/extensions/TransitionFilterPanel.tsx`, `src/extensions/extensions.css`
- **Filters:**
  - `time_25 = true`, `time_100 = true` (robust truth parsing for `0/1/true/"1"/"true"`).
  - Probability range (min/max, *Either* or *Both*). **Inactive by default** until min/max changed.
  - Intersects with toolbar **Delta** (`positive|neutral|negative|all`) and **Self-transitions**.
- **Rendering:** DOM `style.display` toggle via `[data-id*="transition-"]` (store untouched).
- **UX:** Collapsible (▾/▸), shows `Matches: n`.
- **Layout:** top: `76px`, left: `8px`, width: `360px`.

### 3) Styles
- **File:** `src/extensions/extensions.css`
- Card layout, compact rows/fields, “ghost” collapse button, disabled state for attribute panel.

## QA Checklist
- Select edge → attribute fields populate; **Save** updates edge style/tooltip.
- Toggle `time_25/100`; adjust probability min/max; switch *Either/Both*.
- Composition with toolbar filters works as **intersection**.
-  **Clear** restores visibility and calls `onReset()`.

---

## Entry — Editable Causal Chain in Edit Transition
**Date:** "2025-10-07"  
**Author:** "Edward Zhang"  
**Commit:** `2565b12ff111dfc857735f4eee29e4cc327bbbc7`  
**Status:** Merged

### Summary
Enhanced the transition modal with interactive causal chain editing capabilities. Users can now add and remove drivers from chain parts directly within the transition editing interface, making the causal chain management more intuitive and user-friendly.

### Goals
- Enable dynamic editing of causal chain drivers within the transition modal.
- Provide predefined driver options for easy selection.
- Allow removal of existing drivers with visual feedback.
- Maintain data integrity and prevent duplicate entries.

### Key Changes
- **Files:** `src/transitions/transitionModal.css`, `src/transitions/transitionModal.tsx`
- **Features:**
  - Replaced `CausalChainDisplay` with `CausalChainEditor` component
  - Added predefined driver options with grouped categories (Climate, Disturbance, Biotic)
  - Implemented add/remove driver functionality with inline UI controls
  - Added visual feedback for empty chain parts and driver management
  - Enhanced styling with action buttons, counters, and hover effects
- **UI Improvements:**
  - Inline driver addition with dropdown selection
  - Delete buttons for individual drivers
  - Chain part counters showing driver counts
  - Improved empty state messaging

### Notes
- Predefined drivers are currently hardcoded; consider making them configurable in future iterations.
- Driver addition prevents duplicates by checking both driver name and group.
- UI maintains responsive design with proper spacing and visual hierarchy.

---

## Entry — Help Modal System
**Date:** "2025-10-07"  
**Author:** "Edward Zhang"  
**Commit:** `a3f728e510fae303f0468f52d93420389b68dfda`  
**Status:** Merged

### Summary
Implemented a comprehensive help modal system that allows users to submit help requests directly from the application. The modal includes form fields for issue description, file attachments, and automatic email generation for developer support.

### Goals
- Provide users with an easy way to request help and report issues.
- Enable file attachment support for bug reports and feature requests.
- Generate pre-formatted emails to streamline developer communication.
- Maintain a clean, accessible UI for the help system.

### Key Changes
- **Files:** `src/App.tsx`, `src/app/components/GraphToolbar.tsx`, `src/app/components/HelpModal.tsx`
- **Features:**
  - New `HelpModal` component with form-based interface
  - Title and description fields for issue reporting
  - File attachment support with size display
  - Automatic `mailto:` link generation with pre-filled content
  - Integration with toolbar via "❓ Help" button
- **UI/UX:**
  - Modal overlay with proper z-index layering
  - Responsive design with max-width constraints
  - Form validation and user feedback
  - Clear instructions for file attachment limitations

### Notes
- Email clients don't support auto-attaching files via mailto links; users must attach files manually.
- Developer email is configurable via props (defaults to 'dev@yourcompany.com').
- Modal state is properly managed to prevent memory leaks.

---

## Entry — Image Upload for Node Editing
**Date:** "2025-10-07"  
**Author:** "Edward Zhang"  
**Commit:** `faa98ddce7a9883189ed0932c1494a1eebfb5040`  
**Status:** Merged

### Summary
Added image upload functionality to the node editing modal, allowing users to attach visual representations to state nodes. The feature includes image preview, file validation, and proper data persistence through the BMRG data structure.

### Goals
- Enable visual representation of state nodes through image uploads.
- Provide image preview functionality in the editing interface.
- Ensure proper data persistence and state management.
- Maintain backward compatibility with existing node data.

### Key Changes
- **Files:** `src/app/hooks/graphMutations.ts`, `src/nodes/nodeModal.tsx`, `src/utils/stateTransition/nodes.ts`
- **Features:**
  - Added `imageUrl` field to `NodeAttributes` interface
  - File upload input with image preview functionality
  - Base64 encoding for image data storage
  - Integration with existing node mutation hooks
  - Proper state management for image data
- **Data Flow:**
  - Images are converted to base64 data URLs for storage
  - Image data is persisted in BMRG state attributes
  - Preview functionality shows existing images when editing
  - File validation ensures only image files are accepted

### Notes
- Images are stored as base64 data URLs, which may impact performance with large files.
- Consider implementing image compression or external storage for production use.
- The feature maintains compatibility with existing node editing workflows.


````markdown
---
title: "Dev Log — Auth & Protected API Integration"
date: "2025-10-14"
author: "Haoran Zhou"
output: html_document
---

## Summary

Front-end is now connected to the back-end auth flow. Login/Signup hits `/auth` endpoints and stores the returned JWT. Protected actions (e.g., *Save Model*) now include `Authorization: Bearer <token>` and call the secured `/models/save`. Role-based access is aligned across FE/BE (`Viewer`, `Editor`, `Admin`) with clear UI feedback for 401/403.

## What Changed (Frontend)

- **Auth API & Storage**
  - `stm_creator-frontend/src/app/auth/api.ts`
    - Export `API_BASE` (reads `VITE_API_BASE_URL`, default `http://localhost:3000`).
    - Implement `login()`, `signup()` and local `authStorage` to persist JWT & user.
    - Provide `getAuthHeader()` → `{ Authorization: \`Bearer ${token}\` }`.

- **Auth UI**
  - `stm_creator-frontend/src/app/auth/AuthPage.tsx`
    - Registration password minimum length **8**.
    - Role options unified to **Viewer / Editor / Admin**.

- **Protected Model Save**
  - `stm_creator-frontend/src/utils/dataLoader.tsx`
    - Switch save call to `POST ${API_BASE}/models/save`.
    - Auto-attach `Authorization` header via `getAuthHeader()`.
    - Friendly messages on **401/403** (e.g., “need Editor/Admin rights”).

## Environment & Configuration

- **Backend**: run `tern_backend` (CORS enabled, default port **3000**).
- **Frontend**: optional `.env` at project root:
  ```env
  VITE_API_BASE_URL=http://localhost:3000
````

* Access the app via `npm run dev`.

## How to Use (Step-by-Step)

1. **Start Backend**

   * Launch `tern_backend` on `http://localhost:3000`.

2. **Configure Frontend (optional)**

   * Create `.env` with `VITE_API_BASE_URL=http://localhost:3000`.

3. **Run Frontend**

   * `npm run dev` → open the **Login/Signup** page.

4. **Sign Up or Log In**

   * For saving models, choose **Editor** or **Admin** when signing up.
   * **Viewer** can browse but **cannot** save (will see permission message).

5. **Save a Model**

   * Trigger *Save Model* in the UI.
   * On success, request goes to `POST /models/save` with `Authorization` header.

## Validation & Debugging Checklist

* **Network (Browser DevTools)**

  * Signup/Login: `POST /auth/signup` or `POST /auth/login` returns `200` with `{ token, user }`.
  * Save Model: `POST /models/save` shows `Authorization: Bearer <token>` header.

* **Roles**

  * **Editor/Admin** → Save succeeds (assuming valid backend permissions).
  * **Viewer** → See “need Editor/Admin rights” (403) message.

* **Token Persistence**

  * JWT stored via `authStorage` (survives page refresh).
  * `getAuthHeader()` returns a populated `Authorization` header when logged in.

## Example Requests (for backend verification)

```bash
# Login
curl -i -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"yourpass"}'

# Save model (replace <TOKEN>)
curl -i -X POST http://localhost:3000/models/save \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{"name":"My STM","nodes":[/*...*/],"edges":[/*...*/]}'
```

## UX & Error Handling

* **401** (Unauthenticated): prompt to log in.
* **403** (Forbidden): “need Editor/Admin rights” guidance.
* **Validation**: password policy (min length 8), role selection matches backend.

## Security Notes

* JWT only sent over `Authorization: Bearer` on protected calls.
* Storage is centralized via `authStorage`.
* CORS must remain enabled on the backend for local development.

## Known Limitations / Next Steps

* **Token refresh/expiry**: add silent refresh or re-login flow.
* **Logout**: add explicit `logout()` to clear `authStorage` and headers.
* **Global error surface**: centralize API error mapping (network vs auth vs server).
* **E2E tests**: add Cypress flows for signup → save as Editor/Admin vs Viewer.
* **Role UI states**: disable Save button for Viewer to reduce failed attempts.

## Release Notes (TL;DR)

* ✅ FE ↔ BE auth wired (`/auth`).
* ✅ JWT persisted; `Authorization` header attached.
* ✅ Protected save at `POST /models/save`.
* ✅ Roles aligned (Viewer/Editor/Admin); friendly 401/403 messages.
* ⚠️ Requires Editor/Admin for Save; Viewer is read-only.

---

## Entry — Logout Functionality
**Date:** "2025-01-27"  
**Author:** "Edward Zhang"  
**Branch:** `feat/logout-functionality`  
**Status:** Completed

### Summary
Implemented comprehensive logout functionality for the authentication system. Users can now securely log out from their accounts, clearing all stored authentication data and returning to the login screen. The feature includes proper UI feedback and state management.

### Goals
- Provide secure logout mechanism that clears all authentication data
- Implement intuitive UI controls for logout action
- Ensure proper state management and user feedback
- Maintain clean separation between authenticated and guest modes

### Key Changes
- **Files:** `src/App.tsx`, `src/App.css`, `src/app/auth/api.ts`
- **Features:**
  - Added logout button in authentication panel (top-right corner)
  - Implemented `authStorage.clear()` to remove JWT token and user data from localStorage
  - Added state reset functionality to return user to login screen
  - Enhanced authentication panel with clear user status display
- **UI/UX:**
  - Red logout button with hover effects for clear visual indication
  - User email display when authenticated ("Signed in as user@example.com")
  - Guest mode indicator with sign-in option
  - Responsive authentication panel with proper styling
- **Code Quality:**
  - Fixed TypeScript linting warning in auth API (`safeError` function)
  - Maintained existing authentication flow integrity
  - Proper error handling and state management

### Technical Implementation
- **Logout Flow:**
  1. User clicks logout button
  2. `authStorage.clear()` removes token and user data from localStorage
  3. `setAuth(null)` resets authentication state
  4. App automatically redirects to login screen
- **Authentication Panel:**
  - Positioned in top-right corner using ReactFlow Panel component
  - Shows different UI based on authentication state
  - Includes proper styling with backdrop blur and shadow effects

### Notes
- Logout functionality is fully client-side and doesn't require backend API calls
- Authentication state is properly managed through React state and localStorage
- UI provides clear visual feedback for both authenticated and guest modes
- Feature maintains compatibility with existing authentication system

### Testing Checklist
- ✅ Logout button appears when user is authenticated
- ✅ Clicking logout clears localStorage and resets auth state
- ✅ User is redirected to login screen after logout
- ✅ Guest mode displays appropriate UI elements
- ✅ No linting errors or TypeScript warnings
- ✅ Authentication panel styling is responsive and accessible

---

## Entry — Backend API Migration to Digital Ocean
**Date:** "2025-01-27"  
**Author:** "Edward Zhang"  
**Branch:** `feat/logout-functionality`  
**Status:** Completed

### Summary
Migrated the backend API endpoint from localhost development server to Digital Ocean production environment. The frontend now connects to the deployed backend at `https://hammerhead-app-t8l9y.ondigitalocean.app/` instead of the local `http://localhost:3000` endpoint.

### Goals
- Transition from local development backend to production Digital Ocean deployment
- Update API base URL configuration to point to production environment
- Ensure authentication and model saving functionality works with production backend
- Maintain backward compatibility for local development scenarios

### Key Changes
- **Files:** `src/app/auth/api.ts`
- **API Configuration:**
  - Updated `API_BASE` default URL from `http://localhost:3000` to `https://hammerhead-app-t8l9y.ondigitalocean.app`
  - Maintained environment variable override capability via `VITE_API_BASE_URL`
  - Preserved existing authentication and API call patterns

### Technical Implementation
- **API Base URL:**
  ```typescript
  export const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || 'https://hammerhead-app-t8l9y.ondigitalocean.app';
  ```
- **Environment Configuration:**
  - Production: Uses Digital Ocean URL by default
  - Development: Can override with `.env` file containing `VITE_API_BASE_URL=http://localhost:3000`
  - Maintains flexibility for different deployment scenarios

### Affected Endpoints
- **Authentication:**
  - `POST /auth/login` → `https://hammerhead-app-t8l9y.ondigitalocean.app/auth/login`
  - `POST /auth/signup` → `https://hammerhead-app-t8l9y.ondigitalocean.app/auth/signup`
- **Model Operations:**
  - `POST /models/save` → `https://hammerhead-app-t8l9y.ondigitalocean.app/models/save`
- **All API calls now use HTTPS for secure communication**

### Deployment Considerations
- **CORS Configuration:** Backend must have CORS enabled for the frontend domain
- **SSL/TLS:** All communication now uses HTTPS for security
- **Environment Variables:** Local development can still use localhost via `.env` override
- **Production Readiness:** Frontend is now configured for production deployment

### Migration Benefits
- **Security:** HTTPS encryption for all API communications
- **Reliability:** Production-grade infrastructure on Digital Ocean
- **Scalability:** Cloud-hosted backend can handle increased load
- **Accessibility:** Frontend can be deployed anywhere and connect to production backend

### Notes
- Local development workflow remains unchanged with environment variable override
- All existing authentication flows and model saving functionality preserved
- No breaking changes to frontend API integration patterns
- Backend deployment on Digital Ocean must be properly configured for CORS and SSL

### Testing Checklist
- ✅ Authentication endpoints connect to Digital Ocean backend
- ✅ Model saving functionality works with production API
- ✅ HTTPS communication established successfully
- ✅ Local development override still functional with `.env` file
- ✅ No CORS issues with production backend
- ✅ JWT token handling works with production authentication
