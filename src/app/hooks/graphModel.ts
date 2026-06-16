import { Dispatch, SetStateAction } from 'react';

import { loadModelData, prepareSavePayload } from '../../utils/dataLoader';
import {getGraphStateId, ModelData, statesToNodes} from '../../utils/stateTransition';
import { API_BASE, apiFetch, authStorage } from '../auth/api';
import { AppNode } from '../../nodes/types';
import { parseStateId } from './graph-utils';

interface ModelDeps {
    getData: () => ModelData | null;
    getNodes: () => AppNode[];
    setIsSaving: Dispatch<SetStateAction<boolean>>;
    setNodes: Dispatch<SetStateAction<AppNode[]>>;
    handleNodeLabelChange: (id: string, label: string) => void;
    handleNodeClick: (id: string) => void;
    setError: Dispatch<SetStateAction<string | null>>;
    setIsLoading: Dispatch<SetStateAction<boolean>>;
    setData: Dispatch<SetStateAction<ModelData | null>>;
    // Rebuilds the edge set from the model's transitions. Accepts overrides so
    // we can pass freshly-built data/nodes before React state has committed.
    rebuildEdges: (options?: { dataOverride?: ModelData | null; nodes?: AppNode[] }) => void;
    onSaveSnapshot?: (data: ModelData) => void;
}


export interface SaveModelResponse {
    success: boolean;
    modelId: unknown;
    message?: string;
    [key: string]: unknown;
}

export function createModelActions({
                                       getData,
                                       getNodes,
                                       setIsSaving,
                                       setNodes,
                                       handleNodeLabelChange,
                                       handleNodeClick,
                                       setError,
                                       setIsLoading,
                                       setData,
                                       rebuildEdges,
                                       onSaveSnapshot,
                                   }: ModelDeps) {
    const initialise = async () => {
        try {
            setIsLoading(true);
            const data = await loadModelData();
            setData(data);
            const initialNodes = statesToNodes(
                data.states,
                handleNodeLabelChange,
                handleNodeClick,
                data.transitions,
            );
            setNodes(initialNodes);
            // Build the edges too. statesToNodes only produces nodes, so without
            // this the canvas loads with zero transitions until the user toggles
            // a filter / presses Clear. Pass the freshly built nodes explicitly
            // because setNodes above hasn't committed to state yet.
            rebuildEdges({ dataOverride: data, nodes: initialNodes });
            setIsLoading(false);
        } catch (err) {
            // This should rarely happen now since loadBMRGData falls back to empty model
            console.error('Failed to load BMRG data:', err);
            setError('Failed to load state transition data. Please check the console for details.');
            setIsLoading(false);
        }
    };

    // Fold the current on-canvas node positions into the model's states as
    // node_x / node_y. ReactFlow's `nodes` state is the source of truth for
    // where states sit (drag updates it via onNodesChange), so we read from
    // there at save time rather than relying on bmrgData being kept in sync.
    const withCurrentPositions = (data: ModelData): ModelData => {
        const positionByGraphId = new Map<number, { x: number; y: number }>();
        for (const node of getNodes()) {
            const graphId = parseStateId(node.id);
            if (graphId !== null && node.position) {
                positionByGraphId.set(graphId, { x: node.position.x, y: node.position.y });
            }
        }

        return {
            ...data,
            states: data.states.map((state) => {
                const pos = positionByGraphId.get(getGraphStateId(state));
                return pos ? { ...state, node_x: pos.x, node_y: pos.y } : state;
            }),
        };
    };

    const handleSaveModel = async (): Promise<SaveModelResponse> => {
        const data = getData();
        if (!data) {
            alert('Nothing to save – load or create a model first.');
            throw new Error('No model data is currently loaded.');
        }

        const token = authStorage.getToken();
        if (!token) {
            alert('You must be signed in with save permissions to store models.');
            throw new Error('Missing authentication token.');
        }

        setIsSaving(true);

        try {
            const payload = prepareSavePayload(withCurrentPositions(data));
            const response = await apiFetch(`${API_BASE}/models/save`, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (response.status === 403) {
                const message = await extractErrorMessage(response) || 'You do not have permission to save this model.';
                throw new Error(message);
            }

            if (response.status === 401) {
                const message = await extractErrorMessage(response) || 'Your session has expired or you do not have permission to save.';
                setError(message);
                throw new Error(message);
            }

            if (response.status >= 500) {
                const message = await extractErrorMessage(response) || 'The server encountered an unexpected error while saving.';
                setError(message);
                throw new Error(message);
            }

            if (!response.ok) {
                const message = await extractErrorMessage(response) || `Failed to save model (${response.status}).`;
                setError(message);
                throw new Error(message);
            }

            const result = (await response.json()) as SaveModelResponse;
            let snapshotData = data;

            // Refresh data after successful save to ensure consistency
            try {
                const refreshed = await loadModelData();
                snapshotData = refreshed;
                setData(refreshed);
                const nodes = statesToNodes(
                    refreshed.states,
                    handleNodeLabelChange,
                    handleNodeClick,
                    refreshed.transitions,
                );
                setNodes(nodes);
                // Keep edges in sync with the refreshed model (matters when the
                // redirect below is skipped because stm_name is absent).
                rebuildEdges({ dataOverride: refreshed, nodes });
            } catch (error_) {
                console.warn('Model saved but failed to refresh latest data', error_);
            }

            // 保存成功后跳转到对应的editor页面
            onSaveSnapshot?.(snapshotData);

            if (data.stm_name) {
                globalThis.location.href = `/editor?model=${encodeURIComponent(data.stm_name)}`;
            }

            return result;
        } catch (err) {
            console.error('Failed to save model:', err);
            throw err;
        } finally {
            setIsSaving(false);
        }
    };

    const handleReLayout = () => {
        const data = getData();
        if (!data) {
            return;
        }

        const relaidNodes = statesToNodes(
            data.states,
            handleNodeLabelChange,
            handleNodeClick,
            data.transitions,
        );
        setNodes(relaidNodes);
    };

    return { initialise, handleSaveModel, handleReLayout };
}

async function extractErrorMessage(response: Response): Promise<string | undefined> {
    try {
        const data = await response.json();
        if (data && typeof data === 'object') {
            const candidate = (data as Record<string, unknown>).message ?? (data as Record<string, unknown>).error;
            return typeof candidate === 'string' ? candidate : undefined;
        }
        return undefined;
    } catch {
        return undefined;
    }
}
