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
import { BMRGData, TransitionData } from '../../utils/stateTransition';
import { DeltaFilterOption } from '../types';

export interface UseGraphEditorResult {
    nodesWithCallbacks: AppNode[];
    edges: Edge[];
    nodeTypes: NodeTypes;
    customEdgeTypes: EdgeTypes;
    defaultEdgeOptions: DefaultEdgeOptions;
    bmrgData: BMRGData | null;
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
    onNodesChange: OnNodesChange<AppNode>;
    onConnect: OnConnect;
    onEdgeClick: EdgeMouseHandler;
    onEdgeDoubleClick: EdgeMouseHandler;
    handleEdgesChange: (changes: EdgeChange[]) => void;
    handleSaveNode: (attributes: NodeAttributes) => void;
    handleSaveTransition: (transition: TransitionData) => void;
    handleSaveModel: () => Promise<void>;
    handleReLayout: () => void;
    toggleEdgeCreationMode: () => void;
    loadExistingEdges: () => void;
    toggleSelfTransitions: () => void;
    toggleDeltaFilter: (option: DeltaFilterOption) => void;
    openAddNodeModal: () => void;
    closeNodeModal: () => void;
    closeTransitionModal: () => void;
}
