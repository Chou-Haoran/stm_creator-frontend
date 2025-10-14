// Pure config for a 5-step lightweight tour (rendering逻辑可后加)
export type CoachStep = {
  id: string;
  anchor: string; // CSS selector, e.g. '[data-tour="create-edge"]'
  title: string;
  body: string;
  placement?: 'top' | 'right' | 'bottom' | 'left';
};

export const coachSteps: CoachStep[] = [
  { id: 'welcome',        anchor: '[data-tour="toolbar"]',      title: 'Welcome',           body: 'Let’s create your first transition.' },
  { id: 'create-edge',    anchor: '[data-tour="create-edge"]',  title: 'Create Edge',       body: 'Click to start edge creation.' },
  { id: 'edit-transition',anchor: '[data-tour="edge"]',         title: 'Edit transition',   body: 'Double-click an edge to edit attributes.' },
  { id: 'filters',        anchor: '[data-tour="filters"]',      title: 'Filters',           body: 'Apply Δ/time/probability filters.' },
  { id: 'save',           anchor: '[data-tour="save-model"]',   title: 'Save',              body: 'Save when you’re done.' },
];
