import {
    DefaultEdgeOptions,
    Edge,
    EdgeChange,
    EdgeMouseHandler,
    EdgeTypes,
    NodeTypes,
    OnConnect,
    OnNodesChange,
} from '@xyflow/react';

import { NodeAttributes } from '../../nodes/nodeModal';
import { AppNode } from '../../nodes/types';
import { ModelData, TransitionData } from '../../utils/stateTransition';
import type { LayoutStrategy } from '../../utils/layoutStrategies';
import { DeltaFilterOption, GraphModelVersion } from '../types';
import type { SaveModelResponse } from './graphModel';

export interface UseGraphEditorResult {
    nodesWithCallbacks: AppNode[];
    edges: Edge[];
    nodeTypes: NodeTypes;
    customEdgeTypes: EdgeTypes;
    defaultEdgeOptions: DefaultEdgeOptions;
    modelData: ModelData | null;
    isLoading: boolean;
    error: string | null;
    isSaving: boolean;
    edgeCreationMode: boolean;
    startNodeId: string | null;
    showSelfTransitions: boolean;
    deltaFilter: DeltaFilterOption;
    isNodeModalOpen: boolean;
    isTransitionModalOpen: boolean;
    isEditing: boolean;
    initialNodeValues: NodeAttributes | undefined;
    currentTransition: TransitionData | null;
    stateNameMap: Record<number, string>;
    versions: GraphModelVersion[];
    isVersionModalOpen: boolean;
    onNodesChange: OnNodesChange<AppNode>;
    onConnect: OnConnect;
    onEdgeClick: EdgeMouseHandler;
    onEdgeDoubleClick: EdgeMouseHandler;
    handleEdgesChange: (changes: EdgeChange[]) => void;
    handleSaveNode: (attributes: NodeAttributes) => void;
    handleDuplicateState: (nodeId: string) => void;
    applyRemoteNodePatch: (nodeId: string, graphStateId: number, field: string, value: unknown) => void;
    handleSaveTransition: (transition: TransitionData) => void;
    handleDeleteTransition: (transition: TransitionData) => void;
    handleSaveModel: () => Promise<SaveModelResponse>;
    handleDeleteState: (graphStateId: number) => void;
    handleDeleteModel: () => void;
    openEditNode: (nodeId: string) => void;
    openEditTransition: (transitionId: number) => void;
    handleReLayout: () => void;
    applyLayout?: (strategy: LayoutStrategy) => Promise<void> | void;
    toggleEdgeCreationMode: () => void;
    beginTransitionFromNode: (nodeId: string) => void;
    snapAllNodesToGrid: (size: number) => void;
    loadExistingEdges: () => void;
    toggleSelfTransitions: () => void;
    toggleDeltaFilter: (option: DeltaFilterOption) => void;
    openAddNodeModal: () => void;
    closeNodeModal: () => void;
    closeTransitionModal: () => void;
    saveCurrentVersion: (customName?: string) => void;
    openVersionManager: () => void;
    closeVersionManager: () => void;
    restoreVersion: (id: string) => void;
    deleteVersion: (id: string) => void;
    exportToEKS: () => void;
    importFromEKS: (file: File) => Promise<void>;
}
