export const CONDITION_CLASS_COLOURS = {
  'Class I': {
    label: 'Reference',
    background: '#93d9e7',
    border: '#5BB8CC',
    text: '#0C6170',
    accent: '#1A8A9A',
  },
  'Class II': {
    label: 'Class II',
    background: '#a2cdc7',
    border: '#6AADA5',
    text: '#1D5E59',
    accent: '#2E8078',
  },
  'Class III': {
    label: 'Class III',
    background: '#efdeaf',
    border: '#D4BC72',
    text: '#7A5A0A',
    accent: '#A07815',
  },
  'Class IV': {
    label: 'Class IV',
    background: '#fad7c1',
    border: '#E8A87A',
    text: '#8C4A1A',
    accent: '#B85F20',
  },
  'Class V': {
    label: 'Class V',
    background: '#f6b9ab',
    border: '#E07E6A',
    text: '#8C3020',
    accent: '#B84040',
  },
  'Class VI': {
    label: 'Class VI',
    background: '#df9090',
    border: '#C45C5C',
    text: '#6B1A1A',
    accent: '#8F2525',
  },
  Unknown: {
    label: 'Unknown',
    background: '#E8E9EB',
    border: '#B0B4BA',
    text: '#4A4F57',
    accent: '#6B717A',
  },
} as const;

export type ConditionClassName = keyof typeof CONDITION_CLASS_COLOURS;

export const CONDITION_CLASS_ORDER: ConditionClassName[] = [
  'Class I',
  'Class II',
  'Class III',
  'Class IV',
  'Class V',
  'Class VI',
  'Unknown',
];

export function getConditionClassColour(className?: string) {
  if (className && className in CONDITION_CLASS_COLOURS) {
    return CONDITION_CLASS_COLOURS[className as ConditionClassName];
  }

  return CONDITION_CLASS_COLOURS.Unknown;
}
