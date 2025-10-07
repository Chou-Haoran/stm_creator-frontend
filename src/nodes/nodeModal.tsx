import React, { useState, useEffect } from 'react';

export interface NodeAttributes {
    stateName: string;
    stateNumber: string;
    vastClass: string;
    condition: string;
	imageUrl?: string;
    note?: string;
    id?: string; // Optional for editing existing nodes
}

interface NodeModalProps {
    readonly isOpen: boolean;
    readonly onClose: () => void;
    readonly onSave: (attributes: NodeAttributes) => void;
    readonly initialValues?: NodeAttributes;
    readonly isEditing: boolean;
}

// VAST classes from the JSON data
const VAST_CLASSES = [
    "Class I",
    "Class II",
    "Class III",
    "Class IV",
    "Class V",
    "Class VI"
];

export function NodeModal({ isOpen, onClose, onSave, initialValues, isEditing }: NodeModalProps) {
    const [attributes, setAttributes] = useState<NodeAttributes>({
        stateName: '',
        stateNumber: '',
        vastClass: '',
        condition: '',
		imageUrl: '',
        note: '',
    });

    // Local state for condition bounds displayed in the UI
    const [lowerBound, setLowerBound] = useState<string>('');
    const [upperBound, setUpperBound] = useState<string>('');

    // Update form when initialValues changes (when editing an existing node)
	useEffect(() => {
        if (initialValues) {
			setAttributes(initialValues);

            // Try to parse defaults from existing condition string like:
            // "Condition range: 0.50 - 0.60"
            const regex = /Condition\s*range:\s*([\d.+-]+)\s*-\s*([\d.+-]+)/i;
            const match = regex.exec(initialValues.condition ?? '');
            if (match) {
                setLowerBound(match[1]);
                setUpperBound(match[2]);
            } else {
                setLowerBound('');
                setUpperBound('');
            }
		} else {
            // Reset form when opening for a new node
            setAttributes({
                stateName: '',
                stateNumber: '',
                vastClass: '',
                condition: '',
				imageUrl: '',
                note: '',
            });
            setLowerBound('');
            setUpperBound('');
        }
    }, [initialValues, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setAttributes(prev => ({
            ...prev,
            [name]: value
        }));
    };

	const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const lower = parseFloat(lowerBound);
        const upper = parseFloat(upperBound);
        const hasNumbers = !Number.isNaN(lower) && !Number.isNaN(upper);
        const isValid = hasNumbers && lower < upper;

        if (!isValid) {
            return; // Prevent submit if invalid
        }

        const formatted = `Condition range: ${lower.toFixed(2)} - ${upper.toFixed(2)}`;
		onSave({
			...attributes,
			condition: formatted,
		});
    };

    if (!isOpen) return null;

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 1000,
            }}
        >
            <div
                style={{
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    padding: '20px',
                    width: '400px',
                    maxWidth: '90%',
                    maxHeight: '80vh',
                    overflowY: 'auto',
                }}
            >
                <h2 style={{ marginTop: 0 }}>{isEditing ? 'Edit Node' : 'Add New Node'}</h2>

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px' }}>
                            State Name:
                            <input
                                type="text"
                                name="stateName"
                                value={attributes.stateName}
                                onChange={handleChange}
                                style={{
                                    width: '100%',
                                    padding: '8px',
                                    borderRadius: '4px',
                                    border: '1px solid #ccc'
                                }}
                                required
                            />
                        </label>
                    </div>

                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px' }}>
                            State Number:
                            <input
                                type="text"
                                name="stateNumber"
                                value={attributes.stateNumber}
                                onChange={handleChange}
                                style={{
                                    width: '100%',
                                    padding: '8px',
                                    borderRadius: '4px',
                                    border: '1px solid #ccc'
                                }}
                            />
                        </label>
                    </div>

                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px' }}>
                            VAST Class:
                            <select
                                name="vastClass"
                                value={attributes.vastClass}
                                onChange={handleChange}
                                style={{
                                    width: '100%',
                                    padding: '8px',
                                    borderRadius: '4px',
                                    border: '1px solid #ccc'
                                }}
                            >
                                <option value="">Select a class</option>
                                {VAST_CLASSES.map(vastClass => (
                                    <option key={vastClass} value={vastClass}>
                                        {vastClass}
                                    </option>
                                ))}
                            </select>
                        </label>
                    </div>

                    <div style={{ marginBottom: '15px' }}>
                        <label htmlFor="condition-lower" style={{ display: 'block', marginBottom: '5px' }}>Condition Lower Bond:</label>
                        <input
                            type="number"
                            step="0.01"
                            name="conditionLower"
                            id="condition-lower"
                            value={lowerBound}
                            onChange={(e) => setLowerBound(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '8px',
                                borderRadius: '4px',
                                border: '1px solid #ccc'
                            }}
                        />
                    </div>

                    <div style={{ marginBottom: '15px' }}>
                        <label htmlFor="condition-upper" style={{ display: 'block', marginBottom: '5px' }}>Condition Upper Bond:</label>
                        <input
                            type="number"
                            step="0.01"
                            name="conditionUpper"
                            id="condition-upper"
                            value={upperBound}
                            onChange={(e) => setUpperBound(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '8px',
                                borderRadius: '4px',
                                border: '1px solid #ccc'
                            }}
                        />
                    </div>

                    {(() => {
                        const l = parseFloat(lowerBound);
                        const u = parseFloat(upperBound);
                        if (Number.isNaN(l) || Number.isNaN(u)) {
                            return null;
                        }
                        if (l >= u) {
                            return (
                                <div style={{ color: '#d9534f', marginBottom: '10px' }}>
                                    Lower Bond must be less than Upper Bond.
                                </div>
                            );
                        }
                        return null;
                    })()}

					{/* Image section at the bottom: show existing and allow upload */}
				{/* Note input placed above State Image */}
				<div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #eee' }}>
					<div style={{ marginBottom: '8px', fontWeight: 600 }}>Note</div>
					<textarea
						name="note"
						placeholder="Add a brief note about this state"
						value={attributes.note ?? ''}
						onChange={handleChange}
						style={{ width: '100%', minHeight: '64px', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', resize: 'vertical' }}
					/>
				</div>

				<div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #eee' }}>
						<div style={{ marginBottom: '8px', fontWeight: 600 }}>State Image</div>
						{attributes.imageUrl ? (
							<div style={{ marginBottom: '10px' }}>
								<img
									src={attributes.imageUrl}
									alt="State preview"
									style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'contain', border: '1px solid #ddd', borderRadius: '4px' }}
								/>
							</div>
						) : (
							<div style={{ marginBottom: '10px', color: '#666' }}>No image set.</div>
						)}
						<label style={{ display: 'block' }}>
							<span style={{ display: 'block', marginBottom: '6px' }}>Upload image:</span>
							<input
								type="file"
								accept="image/*"
								onChange={(e) => {
									const file = e.target.files?.[0];
									if (!file) return;
									const reader = new FileReader();
									reader.onload = () => {
										const result = typeof reader.result === 'string' ? reader.result : '';
										setAttributes(prev => ({ ...prev, imageUrl: result }));
									};
									reader.readAsDataURL(file);
								}}
								style={{ cursor: 'pointer' }}
							/>
						</label>
					</div>

					<div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                        <button
                            type="button"
                            onClick={onClose}
                            style={{
                                padding: '8px 16px',
                                borderRadius: '4px',
                                border: '1px solid #ccc',
                                backgroundColor: '#f5f5f5',
                                cursor: 'pointer'
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            style={{
                                padding: '8px 16px',
                                borderRadius: '4px',
                                border: 'none',
                                backgroundColor: '#007bff',
                                color: 'white',
                                cursor: 'pointer',
                            }}
                            disabled={(() => {
                                const l = parseFloat(lowerBound);
                                const u = parseFloat(upperBound);
                                return Number.isNaN(l) || Number.isNaN(u) || l >= u;
                            })()}
                        >
                            {isEditing ? 'Update' : 'Add'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}