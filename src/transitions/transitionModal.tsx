import React, { useState, useEffect } from 'react';
import { TransitionData } from '../utils/stateTransition';
import './transitionModal.css';

interface TransitionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (transitionData: TransitionData) => void;
    transition: TransitionData | null;
    stateNames: Record<number, string>; // Map state IDs to names for display
}

// Interface for Driver data
interface Driver {
    driver: string;
    driver_group: string;
}

// Interface for Chain Part
interface ChainPart {
    chain_part: string;
    drivers: Driver[];
}

// Predefined driver options (TBD: replace with real options when available)
const PREDEFINED_DRIVERS: Driver[] = [
    { driver_group: 'Climate', driver: 'Increased temperature' },
    { driver_group: 'Climate', driver: 'Decreased rainfall' },
    { driver_group: 'Disturbance', driver: 'Fire frequency increase' },
    { driver_group: 'Biotic', driver: 'Invasive species pressure' },
];

// Editable causal chain component with add/remove interactions
const CausalChainEditor = ({
    causalChain,
    onRemoveDriver,
    onAddDriver,
}: {
    causalChain: ChainPart[];
    onRemoveDriver: (partIndex: number, driver: Driver) => void;
    onAddDriver: (partIndex: number, driver: Driver) => void;
}) => {
    const totalDrivers = causalChain.reduce((count, part) => count + part.drivers.length, 0);

    if (!causalChain || causalChain.length === 0) {
        return (
            <div className="empty-causal-chain">
                <p className="empty-causal-chain-message">No causal chain defined. Add drivers under a chain part.</p>
            </div>
        );
    }

    return (
        <div className="causal-chain-container">
            <h4 className="causal-chain-title">Causal Chain Drivers:</h4>

            {causalChain.map((chainPart, index) => {
                if (!chainPart.chain_part) return null;

                // Local UI state per part for selected driver to add
                const selectId = `add-driver-select-${index}`;

                // Group drivers by driver_group for display
                const groupedDrivers = chainPart.drivers.reduce((groups, driver) => {
                    const group = driver.driver_group;
                    if (!groups[group]) {
                        groups[group] = [] as Driver[];
                    }
                    groups[group].push(driver);
                    return groups;
                }, {} as Record<string, Driver[]>);

                return (
                    <div key={index} className="chain-part">
                        <div className="chain-part-header">
                            <span>{chainPart.chain_part}</span>
                            <div className="chain-part-actions">
                                <span className="chain-part-counter">{chainPart.drivers.length}</span>
                                <div className="add-driver-inline">
                                    <select
                                        id={selectId}
                                        className="add-driver-select"
                                        defaultValue=""
                                        aria-label="Select a driver to add"
                                    >
                                        <option value="" disabled>Add Driver…</option>
                                        {PREDEFINED_DRIVERS.map((opt, i) => (
                                            <option key={i} value={`${opt.driver_group}|||${opt.driver}`}>
                                                {opt.driver_group} — {opt.driver}
                                            </option>
                                        ))}
                                    </select>
                                    <button
                                        type="button"
                                        className="btn btn-small btn-primary add-driver-btn"
                                        onClick={() => {
                                            const select = document.getElementById(selectId) as HTMLSelectElement | null;
                                            if (!select || !select.value) return;
                                            const [group, name] = select.value.split('|||');
                                            onAddDriver(index, { driver_group: group, driver: name });
                                            select.value = '';
                                        }}
                                    >
                                        Add
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="chain-part-content">
                            {Object.entries(groupedDrivers).map(([groupName, drivers], groupIndex) => (
                                <div key={groupIndex} className="driver-group">
                                    <div className={`driver-group-content ${groupIndex < Object.keys(groupedDrivers).length - 1 ? 'with-border' : ''}`}>
                                        <div className="driver-group-name">
                                            {groupName}
                                        </div>
                                        <ul className="driver-list">
                                            {drivers.map((driver, driverIndex) => (
                                                <li key={driverIndex} className="driver-item">
                                                    <span className="driver-name">{driver.driver}</span>
                                                    <button
                                                        type="button"
                                                        className="driver-delete"
                                                        aria-label="Remove driver"
                                                        title="Remove"
                                                        onClick={() => onRemoveDriver(index, driver)}
                                                    >
                                                        ×
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            ))}
                            {chainPart.drivers.length === 0 && (
                                <div className="empty-causal-chain">
                                    <p className="empty-causal-chain-message">No drivers in this chain part.</p>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}

            {totalDrivers === 0 && (
                <div className="empty-causal-chain">
                    <p className="empty-causal-chain-message">No causal chain drivers available for this transition.</p>
                </div>
            )}
        </div>
    );
};

export function TransitionModal({ isOpen, onClose, onSave, transition, stateNames }: TransitionModalProps) {
    const [transitionData, setTransitionData] = useState<TransitionData | null>(null);
    const [activeTab, setActiveTab] = useState<'basic' | 'causal-chain'>('basic');

    // Update form when transition changes
    useEffect(() => {
        if (transition) {
            setTransitionData({...transition});
        }
    }, [transition]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        if (!transitionData) return;

        const { name, value } = e.target;
        const numericValue = name === 'time_25' || name === 'time_100' || name === 'transition_delta'
            ? parseFloat(value)
            : value;

        setTransitionData(prev => {
            if (!prev) return null;
            return {
                ...prev,
                [name]: numericValue
            };
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (transitionData) {
            onSave(transitionData);
        }
    };

    if (!isOpen || !transitionData) return null;

    // Count total drivers for badge display
    const totalDrivers = transitionData.causal_chain
        ? transitionData.causal_chain.reduce((count, part) => count + part.drivers.length, 0)
        : 0;

    const handleRemoveDriver = (partIndex: number, driverToRemove: Driver) => {
        setTransitionData((prev) => {
            if (!prev) return prev;
            const nextChain = (prev.causal_chain ?? []).map((p, idx) => {
                if (idx !== partIndex) return p;
                const driverIndex = p.drivers.indexOf(driverToRemove);
                if (driverIndex === -1) return p;
                const nextDrivers = [...p.drivers.slice(0, driverIndex), ...p.drivers.slice(driverIndex + 1)];
                return { ...p, drivers: nextDrivers } as ChainPart;
            });
            return { ...prev, causal_chain: nextChain };
        });
    };

    const handleAddDriver = (partIndex: number, driverToAdd: Driver) => {
        setTransitionData((prev) => {
            if (!prev) return prev;
            const nextChain = (prev.causal_chain ?? []).map((p, idx) => {
                if (idx !== partIndex) return p;
                // Avoid duplicates of exact same driver object
                const exists = p.drivers.some(
                    (d) => d.driver === driverToAdd.driver && d.driver_group === driverToAdd.driver_group,
                );
                const nextDrivers = exists ? p.drivers : [...p.drivers, driverToAdd];
                return { ...p, drivers: nextDrivers } as ChainPart;
            });
            return { ...prev, causal_chain: nextChain };
        });
    };

    return (
        <div className="transition-modal-overlay">
            <div className="transition-modal-container">
                <h2 className="transition-modal-header">
                    <span>Edit Transition</span>
                    <div className={`transition-delta ${transitionData.transition_delta < 0 ? 'negative' : 'positive'}`}>
                        Δ {transitionData.transition_delta.toFixed(2)}
                    </div>
                </h2>

                <div className="transition-info">
                    <div className="transition-id">
                        Transition ID: {transitionData.transition_id}
                    </div>

                    <div className={`transition-status ${transitionData.time_25 === 1 ? 'plausible' : 'implausible'}`}>
                        {transitionData.time_25 === 1 ? 'Plausible' : 'Implausible'}
                    </div>
                </div>

                <div className="states-container">
                    <div className="state-info">
                        <div className="state-name">{stateNames[transitionData.start_state_id]}</div>
                        <div className="state-id">State ID: {transitionData.start_state_id}</div>
                    </div>
                    <div className="state-arrow">→</div>
                    <div className="state-info">
                        <div className="state-name">{stateNames[transitionData.end_state_id]}</div>
                        <div className="state-id">State ID: {transitionData.end_state_id}</div>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="tab-navigation">
                    <div
                        onClick={() => setActiveTab('basic')}
                        className={`tab ${activeTab === 'basic' ? 'active' : ''}`}
                    >
                        Basic Info
                    </div>
                    <div
                        onClick={() => setActiveTab('causal-chain')}
                        className={`tab ${activeTab === 'causal-chain' ? 'active' : ''}`}
                    >
                        Causal Chain
                        {totalDrivers > 0 && (
                            <span className="tab-counter">{totalDrivers}</span>
                        )}
                    </div>
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
                                        Change in condition (negative values shown in red, positive in green)
                                    </small>
                                </label>
                            </div>

                            <div className="form-group">
                                <label className="form-label">
                                    Notes:
                                    <textarea
                                        name="notes"
                                        value={transitionData.notes}
                                        onChange={handleChange}
                                        className="form-textarea"
                                    />
                                </label>
                            </div>
                        </>
                    ) : (
                        <CausalChainEditor
                            causalChain={transitionData.causal_chain || []}
                            onRemoveDriver={handleRemoveDriver}
                            onAddDriver={handleAddDriver}
                        />
                    )}

                    <div className="form-buttons">
                        <button
                            type="button"
                            onClick={onClose}
                            className="btn btn-secondary"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                        >
                            Update
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}