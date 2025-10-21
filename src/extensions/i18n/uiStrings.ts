// Centralized UI strings (typed). Text binding only — no behavior here.

export type UIText = {
  toolbar: {
    addNode: string;
    createEdge: string;
    loadAllEdges: string;
    saveModel: string;
    saveVersion: string;
    versions: string;
    help: string;
    importEks: string;
    exportEks: string;
    relayout: string;
    showSelf: string;
    hideSelf: string;
    tt: { addNode: string; createEdge: string; relayout: string };
  };
  filters: {
    title: string;
    deltaLabel: string;
    time25: string;
    time100: string;
    probMin: string;
    probMax: string;
    rangeAny: string;
    rangeBoth: string;
    clear: string;
    emptyNoMatch: string;
  };
  edge: {
    tooltipTitle: string;
    tooltipFromTo: string;
    tooltipDelta: string;
    tooltipFlags: string;
    tooltipProbs: string;
  };
  empty: { noEdges: string; ctaCreateEdge: string };
  toasts: { saveSuccess: string; saveFail: string; presetApplied: string };

  // Copy used by the product tour
  tour: {
    addNodeTitle: string;
    addNodeBody: string;
    createEdgeTitle: string;
    createEdgeBody: string;
    filtersTitle: string;
    filtersBody: string;
    saveTitle: string;
    saveBody: string;
  };
};

// Use `satisfies` so keys are strongly typed with auto-complete.
export const t = {
  toolbar: {
    addNode: 'Add Node',
    createEdge: 'Create Edge',
    loadAllEdges: 'Load All Edges',
    saveModel: 'Save Model',
    saveVersion: 'Save Version',
    versions: 'Versions',
    help: 'Help',
    importEks: 'Import EKS',
    exportEks: 'Export EKS',
    relayout: 'Re-layout',
    showSelf: 'Show Self Transitions',
    hideSelf: 'Hide Self Transitions',
    tt: {
      addNode: 'Add a new state node',
      createEdge: 'Enter edge creation mode',
      relayout: 'Auto-arrange nodes',
    },
  },
  filters: {
    title: 'Transition Filters',
    deltaLabel: 'Δ filter',
    time25: 'time_25 = true',
    time100: 'time_100 = true',
    probMin: 'Probability min',
    probMax: 'Probability max',
    rangeAny: 'Either in range',
    rangeBoth: 'Both in range',
    clear: 'Clear',
    emptyNoMatch: 'No matching transitions. Try widening filters.',
  },
  edge: {
    tooltipTitle: 'Transition',
    tooltipFromTo: '{from} → {to}',
    tooltipDelta: 'Δ {value}',
    tooltipFlags: 't25={t25}, t100={t100}',
    tooltipProbs: 'p25={p25}, p100={p100}',
  },
  empty: {
    noEdges: 'No edges yet',
    ctaCreateEdge: 'Use "Create Edge" to add your first transition.',
  },
  toasts: {
    saveSuccess: 'Saved successfully.',
    saveFail: 'Save failed. Please retry.',
    presetApplied: 'Applied preset: {name}',
  },
  tour: {
    addNodeTitle: 'Add Node',
    addNodeBody: 'Create a new state node. You can edit details later.',
    createEdgeTitle: 'Create Edge',
    createEdgeBody: 'Connect two states. Click source then target.',
    filtersTitle: 'Transition Filters',
    filtersBody: 'Filter by Δ sign, time flags, or probability range.',
    saveTitle: 'Save Model',
    saveBody: 'Save your progress locally or as a version.',
  },
} satisfies UIText;
