import { Dispatch, SetStateAction } from 'react';

import { AppNode } from '../../nodes/types';
import { BMRGData } from '../../utils/stateTransition';
import { fromEKSModel, toEKSModel, EKSModel } from '../../utils/eksJson';

interface Dependencies {
    getData: () => BMRGData | null;
    setData: Dispatch<SetStateAction<BMRGData | null>>;
    setNodes: Dispatch<SetStateAction<AppNode[]>>;
    rebuildEdges: (options?: { transitions?: BMRGData['transitions']; dataOverride?: BMRGData | null }) => void;
    handleNodeLabelChange: (id: string, label: string) => void;
    handleNodeClick: (id: string) => void;
    statesToNodes: (
        states: BMRGData['states'],
        onLabelChange: (id: string, newLabel: string) => void,
        onNodeClick: (id: string) => void,
        transitions: BMRGData['transitions'],
    ) => AppNode[];
}

function downloadJsonFile(filename: string, content: string) {
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
}

export function createImportExportActions({
    getData,
    setData,
    setNodes,
    rebuildEdges,
    handleNodeLabelChange,
    handleNodeClick,
    statesToNodes,
}: Dependencies) {
    const exportToEKS = () => {
        const data = getData();
        if (!data) {
            window.alert('No model available to export.');
            return;
        }

        const eksModel = toEKSModel(data);
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `${eksModel.name ?? 'stm-model'}-${timestamp}.json`;
        downloadJsonFile(filename, JSON.stringify(eksModel, null, 2));
    };

    const importFromEKS = async (file: File) => {
        try {
            const text = await file.text();
            const parsed = JSON.parse(text) as EKSModel;
            const bmrgData = fromEKSModel(parsed);
            setData(bmrgData);
            const nodes = statesToNodes(
                bmrgData.states,
                handleNodeLabelChange,
                handleNodeClick,
                bmrgData.transitions,
            );
            setNodes(nodes);
            rebuildEdges({ transitions: bmrgData.transitions, dataOverride: bmrgData });
        } catch (error) {
            console.error('Failed to import EKS JSON', error);
            const message =
                error instanceof Error ? error.message : 'Unknown error while importing JSON.';
            window.alert(`Invalid EKS JSON: ${message}`);
        }
    };

    return {
        exportToEKS,
        importFromEKS,
    };
}
