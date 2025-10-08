
import { DefaultEdgeOptions, EdgeTypes, NodeTypes } from '@xyflow/react';

import { edgeTypes } from '../../edges';
import CustomEdge from '../../edges/customEdge';
import { nodeTypes as baseNodeTypes } from '../../nodes';
import { CustomNode } from '../../nodes/customNode';

export const EXTENDED_NODE_TYPES: NodeTypes = {
    ...baseNodeTypes,
    custom: CustomNode,
};

export const EXTENDED_EDGE_TYPES: EdgeTypes = {
    ...edgeTypes,
    custom: CustomEdge,
};

export const DEFAULT_EDGE_OPTIONS: DefaultEdgeOptions = {
    type: 'custom',
    animated: false,
};
