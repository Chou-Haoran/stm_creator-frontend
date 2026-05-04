export const CONDITION_CLASS_COLOURS = {
  'Class I': {
    label: 'Reference',
    background: '#F0FDF4',
    border: '#BBF7D0',
    text: '#15803D',
    accent: '#16A34A',
  },
  'Class II': {
    label: 'Class II',
    background: '#F7FEE7',
    border: '#D9F99D',
    text: '#4D7C0F',
    accent: '#65A30D',
  },
  'Class III': {
    label: 'Class III',
    background: '#FEFCE8',
    border: '#FEF08A',
    text: '#A16207',
    accent: '#CA8A04',
  },
  'Class IV': {
    label: 'Class IV',
    background: '#FFFBEB',
    border: '#FDE68A',
    text: '#B45309',
    accent: '#D97706',
  },
  'Class V': {
    label: 'Class V',
    background: '#FFF7ED',
    border: '#FED7AA',
    text: '#C2410C',
    accent: '#EA580C',
  },
  'Class VI': {
    label: 'Class VI',
    background: '#FEF2F2',
    border: '#FECACA',
    text: '#B91C1C',
    accent: '#DC2626',
  },
  Unknown: {
    label: 'Unknown',
    background: '#F3F4F6',
    border: '#D1D5DB',
    text: '#6B7280',
    accent: '#9CA3AF',
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