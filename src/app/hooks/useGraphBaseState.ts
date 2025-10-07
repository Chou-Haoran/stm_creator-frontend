
import { useState } from 'react';
import {
    Edge,
    OnNodesChange,
    useEdgesState,
    useNodesState,
} from '@xyflow/react';

import { NodeAttributes } from '../../nodes/nodeModal';
import { AppNode } from '../../nodes/types';
import { BMRGData, TransitionData } from '../../utils/stateTransition';
import { DeltaFilterOption, GraphModelVersion } from '../types';

export interface GraphBaseState {
    nodes: AppNode[];
    setNodes: React.Dispatch<React.SetStateAction<AppNode[]>>;
    onNodesChange: OnNodesChange<AppNode>;
    edges: Edge[];
    setEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
    edgeCreationMode: boolean;
    setEdgeCreationMode: React.Dispatch<React.SetStateAction<boolean>>;
    startNodeId: string | null;
    setStartNodeId: React.Dispatch<React.SetStateAction<string | null>>;
    showSelfTransitions: boolean;
    setShowSelfTransitions: React.Dispatch<React.SetStateAction<boolean>>;
    deltaFilter: DeltaFilterOption;
    setDeltaFilter: React.Dispatch<React.SetStateAction<DeltaFilterOption>>;
    isNodeModalOpen: boolean;
    setIsNodeModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
    isTransitionModalOpen: boolean;
    setIsTransitionModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
    isEditing: boolean;
    setIsEditing: React.Dispatch<React.SetStateAction<boolean>>;
    currentNodeId: string | null;
    setCurrentNodeId: React.Dispatch<React.SetStateAction<string | null>>;
    initialNodeValues: NodeAttributes | undefined;
    setInitialNodeValues: React.Dispatch<React.SetStateAction<NodeAttributes | undefined>>;
    currentTransition: TransitionData | null;
    setCurrentTransition: React.Dispatch<React.SetStateAction<TransitionData | null>>;
    bmrgData: BMRGData | null;
    setBmrgData: React.Dispatch<React.SetStateAction<BMRGData | null>>;
    isLoading: boolean;
    setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
    error: string | null;
    setError: React.Dispatch<React.SetStateAction<string | null>>;
    isSaving: boolean;
    setIsSaving: React.Dispatch<React.SetStateAction<boolean>>;
    versions: GraphModelVersion[];
    setVersions: React.Dispatch<React.SetStateAction<GraphModelVersion[]>>;
    isVersionModalOpen: boolean;
    setIsVersionModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export function useGraphBaseState(): GraphBaseState {
    const [nodes, setNodes, onNodesChange] = useNodesState<AppNode>([]);
    const [edges, setEdges] = useEdgesState<Edge>([]);

    const [edgeCreationMode, setEdgeCreationMode] = useState(false);
    const [startNodeId, setStartNodeId] = useState<string | null>(null);
    const [showSelfTransitions, setShowSelfTransitions] = useState(false);
    const [deltaFilter, setDeltaFilter] = useState<DeltaFilterOption>('all');

    const [isNodeModalOpen, setIsNodeModalOpen] = useState(false);
    const [isTransitionModalOpen, setIsTransitionModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentNodeId, setCurrentNodeId] = useState<string | null>(null);
    const [initialNodeValues, setInitialNodeValues] = useState<NodeAttributes | undefined>(
        undefined,
    );
    const [currentTransition, setCurrentTransition] = useState<TransitionData | null>(null);

    const [bmrgData, setBmrgData] = useState<BMRGData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [versions, setVersions] = useState<GraphModelVersion[]>([]);
    const [isVersionModalOpen, setIsVersionModalOpen] = useState(false);

    return {
        nodes,
        setNodes,
        onNodesChange,
        edges,
        setEdges,
        edgeCreationMode,
        setEdgeCreationMode,
        startNodeId,
        setStartNodeId,
        showSelfTransitions,
        setShowSelfTransitions,
        deltaFilter,
        setDeltaFilter,
        isNodeModalOpen,
        setIsNodeModalOpen,
        isTransitionModalOpen,
        setIsTransitionModalOpen,
        isEditing,
        setIsEditing,
        currentNodeId,
        setCurrentNodeId,
        initialNodeValues,
        setInitialNodeValues,
        currentTransition,
        setCurrentTransition,
        bmrgData,
        setBmrgData,
        isLoading,
        setIsLoading,
        error,
        setError,
        isSaving,
        setIsSaving,
        versions,
        setVersions,
        isVersionModalOpen,
        setIsVersionModalOpen,
    };
}
