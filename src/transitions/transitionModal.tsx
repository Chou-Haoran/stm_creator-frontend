import React, { useEffect, useMemo, useState } from 'react';
import { TransitionData, calcTransitionDelta } from '../utils/stateTransition';
import {
    CausalChainEditor,
    DEFAULT_DRIVER_OPTIONS,
    uniqueDrivers,
    type ChainPart,
    type Driver,
} from './CausalChainEditor';
import './transitionModal.css';

export type { Driver } from './CausalChainEditor';

interface TransitionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (transitionData: TransitionData) => void;
    onDelete?: (transitionData: TransitionData) => void;
    transition: TransitionData | null;
    stateNames: Record<number, string>;
    driverOptions?: Driver[];
}

export function TransitionModal({
                                    isOpen,
                                    onClose,
                                    onSave,
                                    onDelete,
                                    transition,
                                    stateNames,
                                    driverOptions = [],
                                }: TransitionModalProps) {
    const [transitionData, setTransitionData] = useState<TransitionData | null>(null);
    const [activeTab, setActiveTab] = useState<'basic' | 'causal-chain'>('basic');

    const mergedDriverOptions = useMemo(
        () => uniqueDrivers([...driverOptions, ...DEFAULT_DRIVER_OPTIONS]),
        [driverOptions],
    );

    useEffect(() => {
        if (transition) {
            setTransitionData({ ...transition });
            setActiveTab('basic');
        }
    }, [transition]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        if (!transitionData) return;

        const { name, value } = e.target;
        const numericValue =
            name === 'time_25' ||
            name === 'time_100' ||
            name === 'transition_delta' ||
            name === 'likelihood_25' ||
            name === 'likelihood_100'
                ? parseFloat(value)
                : value;

        setTransitionData((prev) => {
            if (!prev) return null;

            const nextTransition = { ...prev, [name]: numericValue } as TransitionData;

            if (
                name === 'time_25' ||
                name === 'time_100' ||
                name === 'likelihood_25' ||
                name === 'likelihood_100'
            ) {
                const computedDelta = calcTransitionDelta(
                    nextTransition.likelihood_25,
                    nextTransition.likelihood_100,
                    nextTransition.time_25,
                    nextTransition.time_100,
                );
                return {
                    ...nextTransition,
                    transition_delta: computedDelta ?? nextTransition.transition_delta,
                };
            }

            return nextTransition;
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!transitionData) return;

        // const computedDelta = calcTransitionDelta(
        //     transitionData.likelihood_25,
        //     transitionData.likelihood_100,
        //     transitionData.time_25,
        //     transitionData.time_100,
        // );

        const computedDelta = transitionData.transition_delta;

        onSave({
            ...transitionData,
            transition_delta: computedDelta ?? transitionData.transition_delta,
        });
    };

    const handleRemoveDriver = (partIndex: number, driverToRemove: Driver) => {
        setTransitionData((prev) => {
            if (!prev) return prev;
            const nextChain = ((prev.causal_chain ?? []) as ChainPart[]).map((part, index) => {
                if (index !== partIndex) return part;
                return {
                    ...part,
                    drivers: part.drivers.filter(
                        (d) =>
                            d.driver !== driverToRemove.driver ||
                            d.driver_group !== driverToRemove.driver_group,
                    ),
                };
            });
            return { ...prev, causal_chain: nextChain };
        });
    };

    const handleAddDriver = (partIndex: number, driverToAdd: Driver) => {
        setTransitionData((prev) => {
            if (!prev) return prev;
            const nextChain = ((prev.causal_chain ?? []) as ChainPart[]).map((part, index) => {
                if (index !== partIndex) return part;
                const exists = part.drivers.some(
                    (d) => d.driver === driverToAdd.driver && d.driver_group === driverToAdd.driver_group,
                );
                return exists ? part : { ...part, drivers: [...part.drivers, driverToAdd] };
            });
            return { ...prev, causal_chain: nextChain };
        });
    };

    const handleAddChainPart = (name: string) => {
        setTransitionData((prev) => {
            if (!prev) return prev;
            const nextChain = [
                ...((prev.causal_chain ?? []) as ChainPart[]),
                { chain_part: name, drivers: [], precondition: '' },
            ];
            return { ...prev, causal_chain: nextChain };
        });
    };

    const handleUpdatePrecondition = (partIndex: number, value: string) => {
        setTransitionData((prev) => {
            if (!prev) return prev;
            const nextChain = ((prev.causal_chain ?? []) as ChainPart[]).map((part, index) => {
                if (index !== partIndex) return part;
                return { ...part, precondition: value };
            });
            return { ...prev, causal_chain: nextChain };
        });
    };

    if (!isOpen || !transitionData) return null;

    const causalChain = (transitionData.causal_chain ?? []) as ChainPart[];
    const totalDrivers = causalChain.reduce((count, part) => count + part.drivers.length, 0);

    return (
        <div className="transition-modal-overlay">
            <div className="transition-modal-container">
                <h2 className="transition-modal-header">
                    <span>Edit Transition</span>
                    <div
                        className={`transition-delta ${transitionData.transition_delta < 0 ? 'negative' : 'positive'}`}
                    >
                        Delta {transitionData.transition_delta.toFixed(2)}
                    </div>
                </h2>

                {onDelete && (
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: -8 }}>
                        <button
                            className="btn btn-small btn-danger"
                            type="button"
                            onClick={() => onDelete(transitionData)}
                            aria-label="Delete transition"
                        >
                            Delete Transition
                        </button>
                    </div>
                )}

                <div className="transition-info">
                    <div className="transition-id">Transition ID: {transitionData.transition_id}</div>
                    <div
                        className={`transition-status ${transitionData.time_25 === 1 ? 'plausible' : 'implausible'}`}
                    >
                        {transitionData.time_25 === 1 ? 'Plausible' : 'Implausible'}
                    </div>
                </div>

                <div className="states-container">
                    <div className="state-info">
                        <div className="state-name">{stateNames[transitionData.start_state_id]}</div>
                        <div className="state-id">State ID: {transitionData.start_state_id}</div>
                    </div>
                    <div className="state-arrow">-&gt;</div>
                    <div className="state-info">
                        <div className="state-name">{stateNames[transitionData.end_state_id]}</div>
                        <div className="state-id">State ID: {transitionData.end_state_id}</div>
                    </div>
                </div>

                <div className="tab-navigation">
                    <button
                        type="button"
                        onClick={() => setActiveTab('basic')}
                        className={`tab ${activeTab === 'basic' ? 'active' : ''}`}
                    >
                        Basic Info
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('causal-chain')}
                        className={`tab ${activeTab === 'causal-chain' ? 'active' : ''}`}
                    >
                        Causal Chain
                        {totalDrivers > 0 && (
                            <span className="tab-counter">{totalDrivers}</span>
                        )}
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    {activeTab === 'basic' ? (
                        <>
                            <div className="form-group">
                                <label className="form-label">
                                    Time 25:
                                    <input
                                        type="number"
                                        name="time_25"
                                        value={transitionData.time_25}
                                        onChange={handleChange}
                                        min="0"
                                        max="1"
                                        step="1"
                                        className="form-input"
                                    />
                                    <small className="form-hint">
                                        Set to 1 for plausible transitions, 0 for implausible transitions
                                    </small>
                                </label>
                            </div>

                            <div className="form-group">
                                <label className="form-label">
                                    Time 100:
                                    <input
                                        type="number"
                                        name="time_100"
                                        value={transitionData.time_100}
                                        onChange={handleChange}
                                        className="form-input"
                                    />
                                </label>
                            </div>

                            <div className="form-group">
                                <label className="form-label">
                                    Transition Delta:
                                    <input
                                        type="number"
                                        name="transition_delta"
                                        value={transitionData.transition_delta}
                                        onChange={handleChange}
                                        step="0.01"
                                        className="form-input"
                                    />
                                    <small className="form-hint">
                                        Change in condition. Negative values render red, positive values render green.
                                    </small>
                                </label>
                            </div>

                            <div className="form-group">
                                <label className="form-label">
                                    Notes:
                                    <textarea
                                        name="notes"
                                        value={transitionData.notes ?? ''}
                                        onChange={handleChange}
                                        className="form-textarea"
                                    />
                                </label>
                            </div>
                        </>
                    ) : (
                        <CausalChainEditor
                            causalChain={causalChain}
                            driverOptions={mergedDriverOptions}
                            onRemoveDriver={handleRemoveDriver}
                            onAddDriver={handleAddDriver}
                            onAddChainPart={handleAddChainPart}
                            onUpdatePrecondition={handleUpdatePrecondition}
                        />
                    )}

                    <div className="form-buttons">
                        <button type="button" onClick={onClose} className="btn btn-secondary">
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary">
                            Update
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
