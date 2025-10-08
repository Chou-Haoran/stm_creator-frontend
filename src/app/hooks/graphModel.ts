
import { Dispatch, SetStateAction } from 'react';

import { loadBMRGData, saveBMRGData } from '../../utils/dataLoader';
import { BMRGData, statesToNodes } from '../../utils/stateTransition';
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

    const handleSaveModel = async () => {
        const data = getData();
        if (!data) {
            return;
        }

        try {
            setIsSaving(true);
            await saveBMRGData(data);
        } catch (err) {
            console.error('Failed to save model:', err);
            alert('Failed to save the model. See console for details.');
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
