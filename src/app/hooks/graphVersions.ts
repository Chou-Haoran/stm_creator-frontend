import { Dispatch, SetStateAction } from 'react';

import { AppNode } from '../../nodes/types';
import { statesToNodes, BMRGData } from '../../utils/stateTransition';
import {
    loadVersions,
    saveVersion as persistVersion,
    deleteVersion as persistDeleteVersion,
} from '../../utils/versionStorage';
import { GraphModelVersion } from '../types';

interface Dependencies {
    getData: () => BMRGData | null;
    setData: Dispatch<SetStateAction<BMRGData | null>>;
    setNodes: Dispatch<SetStateAction<AppNode[]>>;
    handleNodeLabelChange: (id: string, label: string) => void;
    handleNodeClick: (id: string) => void;
    rebuildEdges: (options?: { transitions?: BMRGData['transitions']; dataOverride?: BMRGData | null }) => void;
    getVersions: () => GraphModelVersion[];
    setVersions: Dispatch<SetStateAction<GraphModelVersion[]>>;
    setIsVersionModalOpen: Dispatch<SetStateAction<boolean>>;
}

function cloneData(data: BMRGData): BMRGData {
    return JSON.parse(JSON.stringify(data)) as BMRGData;
}

function createVersionName(timestamp: Date, existing: GraphModelVersion[]): string {
    const base = `Version ${timestamp.toLocaleString()}`;
    const duplicates = existing.filter((version) => version.name.startsWith(base)).length;
    return duplicates ? `${base} (${duplicates + 1})` : base;
}

function createId(): string {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
        return crypto.randomUUID();
    }
    return `version-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

export function createVersionActions({
    getData,
    setData,
    setNodes,
    handleNodeLabelChange,
    handleNodeClick,
    rebuildEdges,
    getVersions,
    setVersions,
    setIsVersionModalOpen,
}: Dependencies) {
    const initialise = () => {
        const stored = loadVersions();
        setVersions(stored);
    };

    const openVersionManager = () => setIsVersionModalOpen(true);
    const closeVersionManager = () => setIsVersionModalOpen(false);

    const saveCurrentVersion = () => {
        const data = getData();
        if (!data) {
            return;
        }

        const timestamp = new Date();
        const existing = getVersions();
        const version: GraphModelVersion = {
            id: createId(),
            name: createVersionName(timestamp, existing),
            savedAt: timestamp.toISOString(),
            data: cloneData(data),
        };

        const next = persistVersion(version);
        setVersions(next);
        setIsVersionModalOpen(true);
    };

    const restoreVersion = (id: string) => {
        const version = getVersions().find((item) => item.id === id);
        if (!version) {
            return;
        }

        const cloned = cloneData(version.data);
        setData(cloned);
        const nextNodes = statesToNodes(
            cloned.states,
            handleNodeLabelChange,
            handleNodeClick,
            cloned.transitions,
        );
        setNodes(nextNodes);
        rebuildEdges({ transitions: cloned.transitions, dataOverride: cloned });
        setIsVersionModalOpen(false);
    };

    const deleteVersion = (id: string) => {
        const next = persistDeleteVersion(id);
        setVersions(next);
    };

    return {
        initialise,
        openVersionManager,
        closeVersionManager,
        saveCurrentVersion,
        restoreVersion,
        deleteVersion,
    };
}
