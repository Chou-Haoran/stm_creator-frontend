import { useEffect, useMemo, useState } from 'react';
import { GraphModelVersion } from '../types';
import { ModelData, StateData, getGraphStateId } from '../../utils/stateTransition';
import './VersionComparisonModal.css';

interface VersionComparisonModalProps {
    isOpen: boolean;
    versions: GraphModelVersion[];
    currentData: ModelData | null;
    onClose: () => void;
}

interface ComparisonOption {
    id: string;
    label: string;
    data: ModelData;
}

interface PreviewNode {
    id: number;
    label: string;
    className: string;
    x: number;
    y: number;
}

const CLASS_ORDER: Record<string, number> = {
    'Class I': 1,
    'Class II': 2,
    'Class III': 3,
    'Class IV': 4,
    'Class V': 5,
    'Class VI': 6,
};

export function VersionComparisonModal({
    isOpen,
    versions,
    currentData,
    onClose,
}: VersionComparisonModalProps) {
    const options = useMemo<ComparisonOption[]>(() => {
        const current = currentData ? [{ id: 'current', label: 'Current canvas', data: currentData }] : [];
        return [
            ...current,
            ...versions.map((version) => ({
                id: version.id,
                label: `${version.name} (${new Date(version.savedAt).toLocaleString()})`,
                data: version.data,
            })),
        ];
    }, [currentData, versions]);

    const [leftId, setLeftId] = useState('current');
    const [rightId, setRightId] = useState('current');

    useEffect(() => {
        if (!isOpen || options.length === 0) {
            return;
        }
        setLeftId((previous) => options.some((option) => option.id === previous) ? previous : options[0].id);
        setRightId((previous) => {
            if (options.some((option) => option.id === previous) && previous !== leftId) {
                return previous;
            }
            return options[1]?.id ?? options[0].id;
        });
    }, [isOpen, options, leftId]);

    if (!isOpen) {
        return null;
    }

    const left = options.find((option) => option.id === leftId) ?? options[0];
    const right = options.find((option) => option.id === rightId) ?? options[1] ?? options[0];
    const diffs = left && right ? compareModels(left.data, right.data) : [];

    return (
        <div className="version-compare-overlay">
            <div className="version-compare-modal">
                <div className="version-compare-header">
                    <div>
                        <h2>Version Comparison</h2>
                        <p>Compare state and transition changes side by side.</p>
                    </div>
                    <button type="button" className="version-compare-close" onClick={onClose}>x</button>
                </div>

                {options.length < 2 ? (
                    <div className="version-compare-empty">
                        Save at least one milestone to compare it with the current canvas.
                    </div>
                ) : (
                    <>
                        <div className="version-compare-selectors">
                            <label>
                                Left
                                <select value={left?.id ?? ''} onChange={(event) => setLeftId(event.target.value)}>
                                    {options.map((option) => (
                                        <option key={option.id} value={option.id}>{option.label}</option>
                                    ))}
                                </select>
                            </label>
                            <label>
                                Right
                                <select value={right?.id ?? ''} onChange={(event) => setRightId(event.target.value)}>
                                    {options.map((option) => (
                                        <option key={option.id} value={option.id}>{option.label}</option>
                                    ))}
                                </select>
                            </label>
                        </div>

                        <div className="version-compare-grid">
                            <PreviewCanvas title={left.label} data={left.data} />
                            <PreviewCanvas title={right.label} data={right.data} />
                        </div>

                        <div className="version-diff-panel">
                            <h3>Changes</h3>
                            {diffs.length === 0 ? (
                                <div className="version-diff-empty">No structural differences detected.</div>
                            ) : (
                                <ul>
                                    {diffs.map((diff, index) => (
                                        <li key={`${diff}-${index}`}>{diff}</li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

function PreviewCanvas({ title, data }: { title: string; data: ModelData }) {
    const nodes = buildPreviewNodes(data.states);

    return (
        <div className="version-preview">
            <div className="version-preview-title">{title}</div>
            <div className="version-preview-meta">
                {data.states.length} states | {data.transitions.length} transitions
            </div>
            <div className="version-preview-canvas">
                {nodes.map((node) => (
                    <div
                        key={node.id}
                        className="version-preview-node"
                        style={{ left: `${node.x}%`, top: `${node.y}%` }}
                        title={`${node.label} (${node.className})`}
                    >
                        <span>{node.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function buildPreviewNodes(states: StateData[]): PreviewNode[] {
    const sortedStates = [...states].sort((a, b) => {
        const classDelta = (CLASS_ORDER[a.vast_state?.vast_class] ?? 99) - (CLASS_ORDER[b.vast_state?.vast_class] ?? 99);
        return classDelta !== 0 ? classDelta : a.state_name.localeCompare(b.state_name);
    });
    const grouped = new Map<string, StateData[]>();
    sortedStates.forEach((state) => {
        const key = state.vast_state?.vast_class || 'Unknown';
        grouped.set(key, [...(grouped.get(key) ?? []), state]);
    });

    const classes = Array.from(grouped.keys()).sort((a, b) => (CLASS_ORDER[a] ?? 99) - (CLASS_ORDER[b] ?? 99));
    return classes.flatMap((className, classIndex) => {
        const classStates = grouped.get(className) ?? [];
        return classStates.map((state, rowIndex) => ({
            id: getGraphStateId(state),
            label: state.state_name,
            className,
            x: 8 + classIndex * Math.max(16, 84 / Math.max(classes.length, 1)),
            y: 10 + rowIndex * Math.max(10, 78 / Math.max(classStates.length, 1)),
        }));
    });
}

function compareModels(left: ModelData, right: ModelData): string[] {
    const diffs: string[] = [];
    const leftStates = stateMap(left.states);
    const rightStates = stateMap(right.states);

    rightStates.forEach((rightState, id) => {
        const leftState = leftStates.get(id);
        if (!leftState) {
            diffs.push(`State added: ${rightState.state_name} (#${id})`);
            return;
        }
        if (leftState.state_name !== rightState.state_name) {
            diffs.push(`State renamed #${id}: ${leftState.state_name} -> ${rightState.state_name}`);
        }
        if (leftState.vast_state?.vast_class !== rightState.vast_state?.vast_class) {
            diffs.push(`State class changed #${id}: ${leftState.vast_state?.vast_class || 'None'} -> ${rightState.vast_state?.vast_class || 'None'}`);
        }
        if (leftState.condition_lower !== rightState.condition_lower || leftState.condition_upper !== rightState.condition_upper) {
            diffs.push(`Condition range changed #${id}: ${formatRange(leftState)} -> ${formatRange(rightState)}`);
        }
    });

    leftStates.forEach((leftState, id) => {
        if (!rightStates.has(id)) {
            diffs.push(`State removed: ${leftState.state_name} (#${id})`);
        }
    });

    const leftTransitions = transitionMap(left);
    const rightTransitions = transitionMap(right);
    rightTransitions.forEach((rightTransition, key) => {
        const leftTransition = leftTransitions.get(key);
        if (!leftTransition) {
            diffs.push(`Transition added: ${key}`);
            return;
        }
        if (leftTransition.transition_delta !== rightTransition.transition_delta) {
            diffs.push(`Transition delta changed ${key}: ${leftTransition.transition_delta} -> ${rightTransition.transition_delta}`);
        }
        if (leftTransition.time_25 !== rightTransition.time_25) {
            diffs.push(`Transition plausibility changed ${key}: ${leftTransition.time_25} -> ${rightTransition.time_25}`);
        }
    });
    leftTransitions.forEach((_leftTransition, key) => {
        if (!rightTransitions.has(key)) {
            diffs.push(`Transition removed: ${key}`);
        }
    });

    return diffs;
}

function stateMap(states: StateData[]): Map<number, StateData> {
    return new Map(states.map((state) => [getGraphStateId(state), state]));
}

function transitionMap(data: ModelData) {
    return new Map(data.transitions.map((transition) => [
        `${stateName(data, transition.start_state_id)} -> ${stateName(data, transition.end_state_id)}`,
        transition,
    ]));
}

function stateName(data: ModelData, id: number): string {
    const state = data.states.find((item) => getGraphStateId(item) === id);
    return state ? `${state.state_name} (#${id})` : `State #${id}`;
}

function formatRange(state: StateData): string {
    return `${state.condition_lower.toFixed(2)}-${state.condition_upper.toFixed(2)}`;
}
