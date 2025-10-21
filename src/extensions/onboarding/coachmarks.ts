// src/extensions/onboarding/coachmarks.ts
export type CoachStep = {
  selector: string;
  title: string;
  body: string;
  placement?: 'top' | 'right' | 'bottom' | 'left';
};

export const coachSteps: CoachStep[] = [
  // Primary actions first
  { selector: '[data-tour="add-node"]',      title: 'Add Node',      body: 'Create a new state node. You can edit details later.', placement: 'bottom' },
  { selector: '[data-tour="create-edge"]',   title: 'Create Edge',   body: 'Click to start edge creation. Then pick source and target nodes.', placement: 'bottom' },

  // Filters & tips
  { selector: '[data-tour="filters"]',       title: 'Transition Filters', body: 'Filter by Δ sign, time flags, or probability ranges to focus transitions.', placement: 'bottom' },
  { selector: '[data-tour="tips"]',          title: 'Tips',          body: 'Quick reference of common actions. You can collapse/expand it anytime.', placement: 'left' },

  // Data IO
  { selector: '[data-tour="load-all-edges"]',title: 'Load All Edges',body: 'Load edges that already exist in this model.', placement: 'bottom' },
  { selector: '[data-tour="import-eks"]',    title: 'Import EKS',    body: 'Load an EKS JSON file and rebuild the diagram automatically.', placement: 'bottom' },
  { selector: '[data-tour="export-eks"]',    title: 'Export EKS',    body: 'Export the current graph to an EKS-compatible JSON for sharing.', placement: 'bottom' },

  // Layout
  { selector: '[data-tour="apply-layout"]',  title: 'Apply Layout',  body: 'Choose a layout strategy (force/grid/layered) and apply it to the canvas.', placement: 'bottom' },

  // Save/versions/help
  { selector: '[data-tour="save-model"]',    title: 'Save Model',    body: 'Save your current progress locally. Use frequently while editing.', placement: 'bottom' },
  { selector: '[data-tour="save-version"]',  title: 'Save Version',  body: 'Create a timestamped snapshot you can restore or compare later.', placement: 'bottom' },
  { selector: '[data-tour="versions"]',      title: 'Versions',      body: 'Open the version manager to view, restore, or delete snapshots.', placement: 'bottom' },
  { selector: '[data-tour="help"]',          title: 'Help',          body: 'Open help to review shortcuts and usage notes.', placement: 'bottom' },
];
