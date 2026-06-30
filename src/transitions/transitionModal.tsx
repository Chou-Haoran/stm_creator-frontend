import React, { useEffect, useState } from 'react';
import { TransitionData } from '../utils/stateTransition';
import {
    CausalChainEditor,
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
                                }: TransitionModalProps) {
    const [transitionData, setTransitionData] = useState<TransitionData | null>(null);
    const [activeTab, setActiveTab] = useState<'basic' | 'causal-chain'>('basic');

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

            // Do NOT recompute transition_delta from time/likelihood here. The
            // delta is derived from the connected states' condition ranges at
            // creation; editing a transition doesn't change those states, so the
            // value must be preserved. (The manual transition_delta input still
            // updates it directly via the spread above.)
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
                            value={causalChain}
                            onChange={(next) =>
                                setTransitionData((prev) => (prev ? { ...prev, causal_chain: next } : prev))
                            }
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
