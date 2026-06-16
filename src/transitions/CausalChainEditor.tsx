import { useEffect, useState } from 'react';
import { searchDrivers, type DriverSearchResult } from '../app/api/drivers';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Driver {
    driver_id?: number;
    driver: string;
    driver_group: string;
    description?: string | null;
}

export interface ChainPart {
    chain_part: string;
    drivers: Driver[];
    precondition?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

export const DEFAULT_DRIVER_OPTIONS: Driver[] = [
    { driver_group: 'Climate',     driver: 'Increased temperature' },
    { driver_group: 'Climate',     driver: 'Decreased rainfall' },
    { driver_group: 'Disturbance', driver: 'Fire frequency increase' },
    { driver_group: 'Disturbance', driver: 'Severe fire event' },
    { driver_group: 'Biotic',      driver: 'Invasive species pressure' },
    { driver_group: 'Management',  driver: 'Grazing pressure change' },
    { driver_group: 'Hydrology',   driver: 'Changed inundation regime' },
];

export const CHAIN_PART_OPTIONS = [
    'trigger',
    'disturbance',
    'pressure',
    'management response',
    'ecosystem response',
];

// ─── Driver utilities ─────────────────────────────────────────────────────────

export function driverLabel(driver: Driver): string {
    return `${driver.driver_group} - ${driver.driver}`;
}

export function uniqueDrivers(drivers: Driver[]): Driver[] {
    const seen = new Set<string>();
    return drivers.filter((driver) => {
        const key = `${driver.driver_group}:::${driver.driver}`.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

export function fuzzyScore(query: string, label: string): number {
    const q = query.trim().toLowerCase();
    const value = label.toLowerCase();

    if (!q) return 1;
    if (value.includes(q)) return 100 - value.indexOf(q);

    let cursor = 0;
    let score = 0;
    for (const char of q) {
        const found = value.indexOf(char, cursor);
        if (found === -1) return 0;
        score += 3;
        cursor = found + 1;
    }
    return score;
}

export function parseCustomDriver(raw: string): Driver | null {
    const value = raw.trim();
    if (!value) return null;
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

// ─── Component ────────────────────────────────────────────────────────────────

interface CausalChainEditorProps {
    causalChain: ChainPart[];
    driverOptions: Driver[];
    onRemoveDriver: (partIndex: number, driver: Driver) => void;
    onAddDriver: (partIndex: number, driver: Driver) => void;
    onAddChainPart: (name: string) => void;
    onUpdatePrecondition: (partIndex: number, value: string) => void;
}

export function CausalChainEditor({
    causalChain,
    driverOptions,
    onRemoveDriver,
    onAddDriver,
    onAddChainPart,
    onUpdatePrecondition,
}: CausalChainEditorProps) {
    const [searchByPart, setSearchByPart] = useState<Record<number, string>>({});
    const [newChainPart, setNewChainPart] = useState(CHAIN_PART_OPTIONS[0]);
    const [remoteDriversByPart, setRemoteDriversByPart] = useState<Record<number, Driver[]>>({});
    const [loadingByPart, setLoadingByPart] = useState<Record<number, boolean>>({});

    useEffect(() => {
        const searchableEntries = Object.entries(searchByPart)
            .map(([partIndex, query]) => [Number(partIndex), query.trim()] as const)
            .filter(([, query]) => query.length >= 2);
        const activeIndexes = new Set(searchableEntries.map(([partIndex]) => partIndex));

        setRemoteDriversByPart((prev) =>
            Object.fromEntries(
                Object.entries(prev).filter(([partIndex]) => activeIndexes.has(Number(partIndex))),
            ),
        );

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
                        if (error instanceof DOMException && error.name === 'AbortError') return;
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
            (causalChain[partIndex]?.drivers ?? []).map((d) => driverLabel(d).toLowerCase()),
        );
        const available = uniqueDrivers([
            ...(remoteDriversByPart[partIndex] ?? []),
            ...driverOptions,
        ]);
        return available
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
                    <p className="empty-causal-chain-message">
                        No causal chain defined. Add a chain part first.
                    </p>
                </div>
            )}

            {causalChain.map((chainPart, index) => {
                if (!chainPart.chain_part) return null;

                const groupedDrivers = chainPart.drivers.reduce(
                    (groups, driver) => {
                        const group = driver.driver_group || 'Custom';
                        groups[group] = groups[group] ? [...groups[group], driver] : [driver];
                        return groups;
                    },
                    {} as Record<string, Driver[]>,
                );

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
                                    <p className="empty-causal-chain-message">
                                        No drivers in this chain part.
                                    </p>
                                </div>
                            )}

                            <div className="precondition-section">
                                <label
                                    className="precondition-label"
                                    htmlFor={`precondition-${index}`}
                                >
                                    Precondition
                                </label>
                                <textarea
                                    id={`precondition-${index}`}
                                    className="precondition-input"
                                    value={chainPart.precondition ?? ''}
                                    onChange={(event) =>
                                        onUpdatePrecondition(index, event.target.value)
                                    }
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
}
