import React, { useEffect, useMemo, useState } from 'react';
import { searchDrivers, type DriverSearchResult } from '../app/api/drivers';
import { TransitionData, calcTransitionDelta } from '../utils/stateTransition';
import './transitionModal.css';

export interface Driver {
    driver_id?: number;
    driver: string;
    driver_group: string;
    description?: string | null;
}

interface ChainPart {
    chain_part: string;
    drivers: Driver[];
    precondition?: string;
}

interface TransitionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (transitionData: TransitionData) => void;
    onDelete?: (transitionData: TransitionData) => void;
    transition: TransitionData | null;
    stateNames: Record<number, string>;
    driverOptions?: Driver[];
}

const DEFAULT_DRIVER_OPTIONS: Driver[] = [
    { driver_group: 'Climate', driver: 'Increased temperature' },
    { driver_group: 'Climate', driver: 'Decreased rainfall' },
    { driver_group: 'Disturbance', driver: 'Fire frequency increase' },
    { driver_group: 'Disturbance', driver: 'Severe fire event' },
    { driver_group: 'Biotic', driver: 'Invasive species pressure' },
    { driver_group: 'Management', driver: 'Grazing pressure change' },
    { driver_group: 'Hydrology', driver: 'Changed inundation regime' },
];

const CHAIN_PART_OPTIONS = [
    'trigger',
    'disturbance',
    'pressure',
    'management response',
    'ecosystem response',
];

function uniqueDrivers(drivers: Driver[]): Driver[] {
    const seen = new Set<string>();
    return drivers.filter((driver) => {
        const key = `${driver.driver_group}:::${driver.driver}`.toLowerCase();
        if (seen.has(key)) {
            return false;
        }
        seen.add(key);
        return true;
    });
}

function fuzzyScore(query: string, label: string): number {
    const q = query.trim().toLowerCase();
    const value = label.toLowerCase();

    if (!q) {
        return 1;
    }

    if (value.includes(q)) {
        return 100 - value.indexOf(q);
    }

    let cursor = 0;
    let score = 0;

    for (const char of q) {
        const found = value.indexOf(char, cursor);
        if (found === -1) {
            return 0;
        }
        score += 3;
        cursor = found + 1;
    }

    return score;
}

function driverLabel(driver: Driver): string {
    return `${driver.driver_group} - ${driver.driver}`;
}

function parseCustomDriver(raw: string): Driver | null {
    const value = raw.trim();

    if (!value) {
        return null;
    }

    const [group, ...rest] = value.includes(':') ? value.split(':') : ['Custom', value];
    const name = rest.join(':').trim();

    return name ? { driver_group: group.trim() || 'Custom', driver: name } : null;
}

function driverFromSearchResult(result: DriverSearchResult): Driver {
    return {
        driver_id: result.id,
        driver: result.name,
        driver_group: result.driver_group?.trim() || 'Uncategorised',
        description: result.description,
    };
}

const CausalChainEditor = ({
    causalChain,
    driverOptions,
    onRemoveDriver,
    onAddDriver,
    onAddChainPart,
    onUpdatePrecondition,
}: {
    causalChain: ChainPart[];
    driverOptions: Driver[];
    onRemoveDriver: (partIndex: number, driver: Driver) => void;
    onAddDriver: (partIndex: number, driver: Driver) => void;
    onAddChainPart: (name: string) => void;
    onUpdatePrecondition: (partIndex: number, value: string) => void;
}) => {
    const [searchByPart, setSearchByPart] = useState<Record<number, string>>({});
    const [newChainPart, setNewChainPart] = useState(CHAIN_PART_OPTIONS[0]);
    const [remoteDriversByPart, setRemoteDriversByPart] = useState<Record<number, Driver[]>>({});
    const [loadingByPart, setLoadingByPart] = useState<Record<number, boolean>>({});

    useEffect(() => {
        const searchableEntries = Object.entries(searchByPart)
            .map(([partIndex, query]) => [Number(partIndex), query.trim()] as const)
            .filter(([, query]) => query.length >= 2);
        const activeIndexes = new Set(searchableEntries.map(([partIndex]) => partIndex));

        setRemoteDriversByPart((prev) => Object.fromEntries(
            Object.entries(prev).filter(([partIndex]) => activeIndexes.has(Number(partIndex))),
        ));

        if (searchableEntries.length === 0) {
            setLoadingByPart({});
            return;
        }

        const controller = new AbortController();
        const timer = window.setTimeout(() => {
            searchableEntries.forEach(([partIndex, query]) => {
                setLoadingByPart((prev) => ({ ...prev, [partIndex]: true }));
                searchDrivers(query, { limit: 12, signal: controller.signal })
                    .then((results) => {
                        setRemoteDriversByPart((prev) => ({
                            ...prev,
                            [partIndex]: results.map(driverFromSearchResult),
                        }));
                    })
                    .catch((error: unknown) => {
                        if (error instanceof DOMException && error.name === 'AbortError') {
                            return;
                        }
                        setRemoteDriversByPart((prev) => ({ ...prev, [partIndex]: [] }));
                    })
                    .finally(() => {
                        if (!controller.signal.aborted) {
                            setLoadingByPart((prev) => ({ ...prev, [partIndex]: false }));
                        }
                    });
            });
        }, 250);

        return () => {
            window.clearTimeout(timer);
            controller.abort();
        };
    }, [searchByPart]);

    const getSuggestions = (partIndex: number, query: string): Driver[] => {
        const existing = new Set(
            (causalChain[partIndex]?.drivers ?? []).map((driver) => driverLabel(driver).toLowerCase()),
        );
        const availableDrivers = uniqueDrivers([
            ...(remoteDriversByPart[partIndex] ?? []),
            ...driverOptions,
        ]);

        return availableDrivers
            .map((driver) => ({ driver, score: fuzzyScore(query, driverLabel(driver)) }))
            .filter(({ driver, score }) => score > 0 && !existing.has(driverLabel(driver).toLowerCase()))
            .sort((a, b) => b.score - a.score || driverLabel(a.driver).localeCompare(driverLabel(b.driver)))
            .slice(0, 6)
            .map(({ driver }) => driver);
    };

    return (
        <div className="causal-chain-container">
            <div className="causal-chain-heading">
                <h4 className="causal-chain-title">Causal Chain Drivers</h4>

                <div className="add-chain-part">
                    <select
                        value={newChainPart}
                        onChange={(event) => setNewChainPart(event.target.value)}
                        className="add-chain-part-select"
                    >
                        {CHAIN_PART_OPTIONS.map((part) => (
                            <option key={part} value={part}>
                                {part}
                            </option>
                        ))}
                    </select>

                    <button
                        type="button"
                        className="btn btn-small btn-primary"
                        onClick={() => onAddChainPart(newChainPart)}
                    >
                        Add Part
                    </button>
                </div>
            </div>

            {causalChain.length === 0 && (
                <div className="empty-causal-chain">
                    <p className="empty-causal-chain-message">No causal chain defined. Add a chain part first.</p>
                </div>
            )}

            {causalChain.map((chainPart, index) => {
                if (!chainPart.chain_part) return null;

                const groupedDrivers = chainPart.drivers.reduce((groups, driver) => {
                    const group = driver.driver_group || 'Custom';
                    groups[group] = groups[group] ? [...groups[group], driver] : [driver];
                    return groups;
                }, {} as Record<string, Driver[]>);

                const query = searchByPart[index] ?? '';
                const suggestions = getSuggestions(index, query);
                const customDriver = parseCustomDriver(query);

                return (
                    <div key={`${chainPart.chain_part}-${index}`} className="chain-part">
                        <div className="chain-part-header">
                            <span>{chainPart.chain_part}</span>
                            <span className="chain-part-counter">{chainPart.drivers.length}</span>
                        </div>

                        <div className="chain-part-content">
                            <div className="driver-search-row">
                                <input
                                    value={query}
                                    onChange={(event) =>
                                        setSearchByPart((prev) => ({
                                            ...prev,
                                            [index]: event.target.value,
                                        }))
                                    }
                                    placeholder="Search or type Group: driver"
                                    className="driver-search-input"
                                />

                                <button
                                    type="button"
                                    className="btn btn-small btn-primary"
                                    onClick={() => {
                                        const driver = suggestions[0] ?? customDriver;
                                        if (!driver) return;

                                        onAddDriver(index, driver);
                                        setSearchByPart((prev) => ({ ...prev, [index]: '' }));
                                    }}
                                >
                                    Add
                                </button>
                            </div>

                            {query && suggestions.length > 0 && (
                                <div className="driver-suggestions">
                                    {suggestions.map((driver) => (
                                        <button
                                            key={driverLabel(driver)}
                                            type="button"
                                            className="driver-suggestion"
                                            onClick={() => {
                                                onAddDriver(index, driver);
                                                setSearchByPart((prev) => ({ ...prev, [index]: '' }));
                                            }}
                                        >
                                            <span>{driver.driver}</span>
                                            <small>{driver.driver_group}</small>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {query && suggestions.length === 0 && loadingByPart[index] && (
                                <div className="driver-suggestions">
                                    <div className="driver-suggestion-status">Searching drivers...</div>
                                </div>
                            )}

                            {Object.entries(groupedDrivers).map(([groupName, drivers]) => (
                                <div key={groupName} className="driver-group">
                                    <div className="driver-group-content">
                                        <div className="driver-group-name">{groupName}</div>

                                        <ul className="driver-list">
                                            {drivers.map((driver) => (
                                                <li key={driverLabel(driver)} className="driver-item">
                                                    <span className="driver-name">{driver.driver}</span>

                                                    <button
                                                        type="button"
                                                        className="driver-delete"
                                                        aria-label="Remove driver"
                                                        title="Remove"
                                                        onClick={() => onRemoveDriver(index, driver)}
                                                    >
                                                        x
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            ))}

                            {chainPart.drivers.length === 0 && (
                                <div className="empty-causal-chain inline">
                                    <p className="empty-causal-chain-message">No drivers in this chain part.</p>
                                </div>
                            )}

                            <div className="precondition-section">
                                <label className="precondition-label" htmlFor={`precondition-${index}`}>
                                    Precondition
                                </label>

                                <textarea
                                    id={`precondition-${index}`}
                                    className="precondition-input"
                                    value={chainPart.precondition ?? ''}
                                    onChange={(event) => onUpdatePrecondition(index, event.target.value)}
                                    placeholder="Example: high fuel load, dry season, recent drought..."
                                    rows={2}
                                />
                            </div>
                        </div>
                    </div>
                );
            })}


        </div>
    );
};

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

        if (transitionData) {
            const computedDelta = calcTransitionDelta(
                transitionData.likelihood_25,
                transitionData.likelihood_100,
                transitionData.time_25,
                transitionData.time_100,
            );

            onSave({
                ...transitionData,
                transition_delta: computedDelta ?? transitionData.transition_delta,
            });
        }
    };

    const handleRemoveDriver = (partIndex: number, driverToRemove: Driver) => {
        setTransitionData((prev) => {
            if (!prev) return prev;

            const nextChain = ((prev.causal_chain ?? []) as ChainPart[]).map((part, index) => {
                if (index !== partIndex) return part;

                return {
                    ...part,
                    drivers: part.drivers.filter(
                        (driver) =>
                            driver.driver !== driverToRemove.driver ||
                            driver.driver_group !== driverToRemove.driver_group,
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
                    (driver) =>
                        driver.driver === driverToAdd.driver &&
                        driver.driver_group === driverToAdd.driver_group,
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
                {
                    chain_part: name,
                    drivers: [],
                    precondition: '',
                },
            ];

            return { ...prev, causal_chain: nextChain };
        });
    };

    const handleUpdatePrecondition = (partIndex: number, value: string) => {
        setTransitionData((prev) => {
            if (!prev) return prev;

            const nextChain = ((prev.causal_chain ?? []) as ChainPart[]).map((part, index) => {
                if (index !== partIndex) return part;

                return {
                    ...part,
                    precondition: value,
                };
            });

            return {
                ...prev,
                causal_chain: nextChain,
            };
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
                    <div className={`transition-delta ${transitionData.transition_delta < 0 ? 'negative' : 'positive'}`}>
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
                    <div className={`transition-status ${transitionData.time_25 === 1 ? 'plausible' : 'implausible'}`}>
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
                        {totalDrivers > 0 && <span className="tab-counter">{totalDrivers}</span>}
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
