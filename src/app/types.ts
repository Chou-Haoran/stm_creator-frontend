import { BMRGData } from '../utils/stateTransition';

export type DeltaFilterOption = 'all' | 'positive' | 'neutral' | 'negative';

export interface GraphModelVersion {
    id: string;
    name: string;
    savedAt: string;
    data: BMRGData;
}
