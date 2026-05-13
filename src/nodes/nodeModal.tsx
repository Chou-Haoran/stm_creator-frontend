import React, { useEffect, useMemo, useState } from 'react';
import {
    BIOMES,
    BIOME_ORDER,
    TEMPLATES_BY_ID,
    listPrimaryGroupOptions,
    listTemplatesForGroup,
    makeTemplateRef,
    primaryGroupKeyOf,
    type BiomeType,
    type TemplateRef,
} from './templates';
import './nodeModal.css';

export interface NodeAttributes {
    stateName: string;
    stateNumber: string;
    vastClass: string;
    condition: string;
    imageUrl?: string;
    imageUrls?: string[];
    note?: string;
    id?: string;
    template?: TemplateRef;
}

interface NodeModalProps {
    readonly isOpen: boolean;
    readonly onClose: () => void;
    readonly onSave: (attributes: NodeAttributes) => void;
    readonly onDelete?: () => void;
    readonly onDuplicate?: () => void;
    readonly initialValues?: NodeAttributes;
    readonly isEditing: boolean;
}

const CONDITION_CLASSES = [
    'Class I',
    'Class II',
    'Class III',
    'Class IV',
    'Class V',
    'Class VI',
];

function normaliseImageUrls(attributes: NodeAttributes | undefined): string[] {
    if (!attributes) {
        return [];
    }
    if (Array.isArray(attributes.imageUrls) && attributes.imageUrls.length > 0) {
        return attributes.imageUrls.filter((url) => typeof url === 'string' && url.trim() !== '');
    }
    return attributes.imageUrl ? [attributes.imageUrl] : [];
}

function parseConditionBounds(condition: string | undefined): { lower: string; upper: string } {
    const regex = /Condition\s*range:\s*([\d.+-]+)\s*-\s*([\d.+-]+)/i;
    const match = regex.exec(condition ?? '');

    return match ? { lower: match[1], upper: match[2] } : { lower: '', upper: '' };
}

function getDraftFingerprint(
    attributes: NodeAttributes,
    lowerBound: string,
    upperBound: string,
): string {
    return JSON.stringify({
        stateName: attributes.stateName.trim(),
        stateNumber: attributes.stateNumber.trim(),
        vastClass: attributes.vastClass,
        note: attributes.note?.trim() ?? '',
        imageUrls: normaliseImageUrls(attributes),
        templateId: attributes.template?.id ?? '',
        lowerBound: lowerBound.trim(),
        upperBound: upperBound.trim(),
    });
}

function getInitialFingerprint(initialValues: NodeAttributes | undefined): string {
    if (!initialValues) {
        return getDraftFingerprint({
            stateName: '',
            stateNumber: '',
            vastClass: '',
            condition: '',
            imageUrl: '',
            imageUrls: [],
            note: '',
        }, '', '');
    }

    const imageUrls = normaliseImageUrls(initialValues);
    const bounds = parseConditionBounds(initialValues.condition);

    return getDraftFingerprint({
        ...initialValues,
        imageUrl: imageUrls[0] ?? '',
        imageUrls,
    }, bounds.lower, bounds.upper);
}

function readFileAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
    });
}

export function NodeModal({
    isOpen,
    onClose,
    onSave,
    onDelete,
    onDuplicate,
    initialValues,
    isEditing,
}: NodeModalProps) {
    const [attributes, setAttributes] = useState<NodeAttributes>({
        stateName: '',
        stateNumber: '',
        vastClass: '',
        condition: '',
        imageUrl: '',
        imageUrls: [],
        note: '',
    });
    const [lowerBound, setLowerBound] = useState<string>('');
    const [upperBound, setUpperBound] = useState<string>('');
    const [biome, setBiome] = useState<BiomeType | ''>('');
    const [primaryGroupKey, setPrimaryGroupKey] = useState<string>('');
    const [templateId, setTemplateId] = useState<string>('');
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    useEffect(() => {
        if (initialValues) {
            const imageUrls = normaliseImageUrls(initialValues);
            setAttributes({
                ...initialValues,
                imageUrl: imageUrls[0] ?? '',
                imageUrls,
            });

            const bounds = parseConditionBounds(initialValues.condition);
            setLowerBound(bounds.lower);
            setUpperBound(bounds.upper);

            const storedRef = initialValues.template;
            const storedTemplate = storedRef ? TEMPLATES_BY_ID[storedRef.id] : undefined;
            if (storedTemplate) {
                setBiome(storedTemplate.biome);
                setPrimaryGroupKey(primaryGroupKeyOf(storedTemplate));
                setTemplateId(storedTemplate.id);
            } else {
                setBiome('');
                setPrimaryGroupKey('');
                setTemplateId('');
            }
        } else {
            setAttributes({
                stateName: '',
                stateNumber: '',
                vastClass: '',
                condition: '',
                imageUrl: '',
                imageUrls: [],
                note: '',
            });
            setLowerBound('');
            setUpperBound('');
            setBiome('');
            setPrimaryGroupKey('');
            setTemplateId('');
        }
        setPreviewImage(null);
    }, [initialValues, isOpen]);

    const primaryGroupOptions = useMemo(
        () => (biome ? listPrimaryGroupOptions(biome) : []),
        [biome],
    );
    const templateOptions = useMemo(
        () => (biome && primaryGroupKey ? listTemplatesForGroup(biome, primaryGroupKey) : []),
        [biome, primaryGroupKey],
    );

    const commitImageUrls = (imageUrls: string[]) => {
        const nextUrls = imageUrls.filter(Boolean);
        const imageUrl = nextUrls[0] ?? '';
        setAttributes((prev) => ({ ...prev, imageUrl, imageUrls: nextUrls }));
    };

    const handleImageUpload = async (files: FileList | null) => {
        if (!files || files.length === 0) {
            return;
        }
        const uploaded = (await Promise.all(Array.from(files).map(readFileAsDataUrl))).filter(Boolean);
        commitImageUrls([...normaliseImageUrls(attributes), ...uploaded]);
    };

    const handleRemoveImage = (indexToRemove: number) => {
        commitImageUrls(normaliseImageUrls(attributes).filter((_, index) => index !== indexToRemove));
    };

    const handleBiomeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value as BiomeType | '';
        setBiome(value);
        setPrimaryGroupKey('');
        setTemplateId('');
        setAttributes((prev) => ({ ...prev, template: undefined }));
    };

    const handlePrimaryGroupChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setPrimaryGroupKey(e.target.value);
        setTemplateId('');
        setAttributes((prev) => ({ ...prev, template: undefined }));
    };

    const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const id = e.target.value;
        setTemplateId(id);
        const template = TEMPLATES_BY_ID[id];
        if (!template) {
            setAttributes((prev) => ({ ...prev, template: undefined }));
            return;
        }

        const ref = makeTemplateRef(template);
        setAttributes((prev) => {
            const shouldPrefillName = !prev.stateName || prev.stateName.trim() === '';
            const next: NodeAttributes = {
                ...prev,
                template: ref,
                stateName: shouldPrefillName ? template.label : prev.stateName,
            };
            return next;
        });
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setAttributes((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const lower = parseFloat(lowerBound);
        const upper = parseFloat(upperBound);
        if (Number.isNaN(lower) || Number.isNaN(upper) || lower >= upper) {
            return;
        }

        const imageUrls = normaliseImageUrls(attributes);
        onSave({
            ...attributes,
            condition: `Condition range: ${lower.toFixed(2)} - ${upper.toFixed(2)}`,
            imageUrl: imageUrls[0] ?? '',
            imageUrls,
        });
    };

    const hasDraftChanges = getDraftFingerprint(attributes, lowerBound, upperBound) !== getInitialFingerprint(initialValues);

    const handleRequestClose = () => {
        if (hasDraftChanges && !window.confirm('Discard your unsaved node changes?')) {
            return;
        }

        onClose();
    };

    if (!isOpen) return null;

    const imageUrls = normaliseImageUrls(attributes);
    const lower = parseFloat(lowerBound);
    const upper = parseFloat(upperBound);
    const boundsInvalid = Number.isNaN(lower) || Number.isNaN(upper) || lower >= upper;

    return (
        <div className="node-modal-overlay">
            <div className="node-modal">
                <header className="node-modal-header">
                    <div>
                        <p className="node-modal-kicker">{isEditing ? 'Node editor' : 'Create node'}</p>
                        <h2>{isEditing ? 'Edit Node' : 'Create Node'}</h2>
                    </div>
                    <button
                        type="button"
                        className="node-modal-close"
                        onClick={handleRequestClose}
                        aria-label="Close node editor"
                        title="Close"
                    >
                        X
                    </button>
                </header>

                <form onSubmit={handleSubmit} className="node-modal-form">
                    <section className="node-modal-section template">
                        <div className="node-modal-section-heading">
                            <div>
                                <h3>
                                    Template
                                    <span className="node-modal-optional-badge">Optional</span>
                                </h3>
                                <p>Optional classification helpers for faster state setup.</p>
                            </div>
                            {attributes.template && (
                                <span className="node-modal-selected-template">{attributes.template.label}</span>
                            )}
                        </div>

                        <div className="node-modal-grid three">
                            <label className="node-field">
                                <span>Biome</span>
                                <select value={biome} onChange={handleBiomeChange}>
                                    <option value="">Select a biome</option>
                                    {BIOME_ORDER.map((b) => (
                                        <option key={b} value={b}>
                                            {BIOMES[b].label}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            <label className="node-field">
                                <span>Primary Layer</span>
                                <select
                                    value={primaryGroupKey}
                                    onChange={handlePrimaryGroupChange}
                                    disabled={!biome}
                                >
                                    <option value="">
                                        {biome ? 'Select a primary layer' : 'Select a biome first'}
                                    </option>
                                    {primaryGroupOptions.map((opt) => (
                                        <option key={opt.key} value={opt.key}>
                                            {opt.label}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            <label className="node-field">
                                <span>Template</span>
                                <select
                                    value={templateId}
                                    onChange={handleTemplateChange}
                                    disabled={!primaryGroupKey}
                                >
                                    <option value="">
                                        {primaryGroupKey ? 'Select a template' : 'Select a primary layer first'}
                                    </option>
                                    {templateOptions.map((template) => (
                                        <option key={template.id} value={template.id}>
                                            {template.shortLabel}
                                        </option>
                                    ))}
                                </select>
                            </label>
                        </div>
                    </section>

                    <section className="node-modal-section">
                        <div className="node-modal-section-heading">
                            <div>
                                <h3>State Details</h3>
                                <p>Core identity and condition values for this state.</p>
                            </div>
                        </div>

                        <div className="node-modal-grid two">
                            <label className="node-field">
                                <span>State Name</span>
                                <input
                                    type="text"
                                    name="stateName"
                                    value={attributes.stateName}
                                    onChange={handleChange}
                                    required
                                />
                            </label>

                            <label className="node-field">
                                <span>State Number</span>
                                <input
                                    type="text"
                                    name="stateNumber"
                                    value={attributes.stateNumber}
                                    onChange={handleChange}
                                />
                            </label>
                        </div>

                        <div className="node-modal-grid three">
                            <label className="node-field">
                                <span>Condition Class</span>
                                <select name="vastClass" value={attributes.vastClass} onChange={handleChange}>
                                    <option value="">Select a class</option>
                                    {CONDITION_CLASSES.map((conditionClass) => (
                                        <option key={conditionClass} value={conditionClass}>
                                            {conditionClass}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            <label className="node-field">
                                <span>Lower Bound</span>
                                <input
                                    type="number"
                                    step="0.01"
                                    name="conditionLower"
                                    id="condition-lower"
                                    value={lowerBound}
                                    onChange={(event) => setLowerBound(event.target.value)}
                                />
                            </label>

                            <label className="node-field">
                                <span>Upper Bound</span>
                                <input
                                    type="number"
                                    step="0.01"
                                    name="conditionUpper"
                                    id="condition-upper"
                                    value={upperBound}
                                    onChange={(event) => setUpperBound(event.target.value)}
                                />
                            </label>
                        </div>

                        {boundsInvalid && lowerBound && upperBound && (
                            <div className="node-modal-error">
                                Lower bound must be less than upper bound.
                            </div>
                        )}
                    </section>

                    <section className="node-modal-section">
                        <div className="node-modal-section-heading">
                            <div>
                                <h3>Notes And Images</h3>
                                <p>Reference material saved only when the node is confirmed.</p>
                            </div>
                        </div>

                        <label className="node-field">
                            <span>Note</span>
                            <textarea
                                name="note"
                                placeholder="Add a brief note about this state"
                                value={attributes.note ?? ''}
                                onChange={handleChange}
                            />
                        </label>

                        <div className="node-image-area">
                            {imageUrls.length > 0 ? (
                                <div className="node-image-gallery">
                                    {imageUrls.map((url, index) => (
                                        <div key={`${url.slice(0, 32)}-${index}`} className="node-image-thumb">
                                            <button
                                                type="button"
                                                onClick={() => setPreviewImage(url)}
                                                className="node-image-preview-button"
                                                title="Preview image"
                                            >
                                                <img src={url} alt={`State preview ${index + 1}`} />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveImage(index)}
                                                className="node-image-remove"
                                                title="Remove image"
                                                aria-label={`Remove image ${index + 1}`}
                                            >
                                                X
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="node-image-empty">No images attached.</div>
                            )}

                            <label className="node-upload-button">
                                <span>Add Images</span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={(event) => {
                                        void handleImageUpload(event.target.files);
                                        event.target.value = '';
                                    }}
                                />
                            </label>
                        </div>
                    </section>

                    <footer className="node-modal-actions">
                        <div className="node-modal-danger-actions">
                            {isEditing && onDuplicate && (
                                <button type="button" onClick={onDuplicate} className="node-button subtle">
                                    Duplicate State
                                </button>
                            )}
                            {isEditing && onDelete && (
                                <button type="button" onClick={onDelete} className="node-button danger">
                                    Delete State
                                </button>
                            )}
                        </div>

                        <div className="node-modal-primary-actions">
                            <button type="button" onClick={handleRequestClose} className="node-button secondary">
                                Cancel
                            </button>
                            <button type="submit" className="node-button primary" disabled={boundsInvalid}>
                                {isEditing ? 'Update Node' : 'Create Node'}
                            </button>
                        </div>
                    </footer>
                </form>

                {previewImage && (
                    <div className="node-preview-overlay" onClick={() => setPreviewImage(null)}>
                        <div className="node-preview-box" onClick={(event) => event.stopPropagation()}>
                            <button type="button" className="node-preview-close" onClick={() => setPreviewImage(null)}>X</button>
                            <img src={previewImage} alt="State image preview" />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
