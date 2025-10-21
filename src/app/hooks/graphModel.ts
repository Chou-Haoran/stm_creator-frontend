import { Dispatch, SetStateAction } from 'react';

import { loadBMRGData } from '../../utils/dataLoader';
import { BMRGData, statesToNodes } from '../../utils/stateTransition';
import { API_BASE, authStorage } from '../auth/api';
import { AppNode } from '../../nodes/types';

interface ModelDeps {
    getData: () => BMRGData | null;
    setIsSaving: Dispatch<SetStateAction<boolean>>;
    setNodes: Dispatch<SetStateAction<AppNode[]>>;
    handleNodeLabelChange: (id: string, label: string) => void;
    handleNodeClick: (id: string) => void;
    setError: Dispatch<SetStateAction<string | null>>;
    setIsLoading: Dispatch<SetStateAction<boolean>>;
    setData: Dispatch<SetStateAction<BMRGData | null>>;
}

export interface SaveModelResponse {
    success: boolean;
    modelId: unknown;
    message?: string;
    [key: string]: unknown;
}

export function createModelActions({
    getData,
    setIsSaving,
    setNodes,
    handleNodeLabelChange,
    handleNodeClick,
    setError,
    setIsLoading,
    setData,
}: ModelDeps) {
    const initialise = async () => {
        try {
            setIsLoading(true);
            const data = await loadBMRGData();
            setData(data);
            const initialNodes = statesToNodes(
                data.states,
                handleNodeLabelChange,
                handleNodeClick,
                data.transitions,
            );
            setNodes(initialNodes);
            setIsLoading(false);
        } catch (err) {
            console.error('Failed to load BMRG data:', err);
            setError('Failed to load state transition data. Please check the console for details.');
            setIsLoading(false);
        }
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
            const response = await fetch(`${API_BASE}/models/save`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(data),
            });

            if (response.status === 401 || response.status === 403) {
                const message = await extractErrorMessage(response) || 'Your session has expired or you do not have permission to save.';
                alert(message);
                throw new Error(message);
            }

            if (response.status >= 500) {
                const message = await extractErrorMessage(response) || 'The server encountered an unexpected error while saving.';
                alert(message);
                throw new Error(message);
            }

            if (!response.ok) {
                const message = await extractErrorMessage(response) || `Failed to save model (${response.status}).`;
                alert(message);
                throw new Error(message);
            }

            const payload = (await response.json()) as SaveModelResponse;
            return payload;
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
