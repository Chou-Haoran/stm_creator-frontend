import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
} from '@xyflow/react';
import { toPng } from 'html-to-image';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';

import '@xyflow/react/dist/style.css';
import './EdgeStyles.css';
import './SwimlaneStyle.css';
import './App.css';

import { GraphToolbar } from './app/components/GraphToolbar';
import { EdgeCreationHint } from './app/components/EdgeCreationHint';
import { ErrorState } from './app/components/ErrorState';
import { LoadingState } from './app/components/LoadingState';
import { TipsPanel } from './app/components/TipsPanel';
import { CommentPanel, type CommentEntry } from './app/components/CommentPanel';
import { getComments } from './app/api/comments';
import { getAssignedModels } from './app/api/models';
import { acquireModelLock, getModelLock, releaseModelLock, renewModelLock, type ModelLockInfo } from './app/api/locks';
import {
    CanvasContextMenu,
    type CanvasContextMenuState,
} from './app/components/CanvasContextMenu';
import { MilestoneModal } from './app/components/MilestoneModal';
import { ModelListModal } from './app/components/ModelListModal';
import { HelpModal } from './app/components/HelpModal';
import { VersionComparisonModal } from './app/components/VersionComparisonModal';
import { ModelPermissionsModal } from './components/ModelPermissionsModal';
import { useGraphEditor } from './app/hooks/useGraphEditor';
import { NodeModal, type NodeAttributes } from './nodes/nodeModal';
import { TransitionModal, type Driver } from './transitions/transitionModal';

import { TransitionFilterPanel } from './extensions/TransitionFilterPanel';
import './extensions/extensions.css';

import AuthPage from './app/auth/AuthPage';
import { authStorage, type AuthUser } from './app/auth/api';
import { emitEntityPatch, subscribeEntityPatchEvents } from './collab/socket';
import { parseStateId } from './app/hooks/graph-utils';
import {
  connectCollabSocket,
  disconnectCollabSocket,
  emitCursorMove,
  emitNodeLockAcquire,
  emitNodeLockRelease,
  subscribeCursorEvents,
  subscribePresenceEvents,
  subscribeNodeLockEvents,
  type OnlineUser,
} from './collab/socket';
import Home from './pages/Home';
import NotFound from './pages/NotFound';
import AdminDashboard from './pages/AdminDashboard';
import VerifyEmail from './pages/VerifyEmail';
import Forbidden from './pages/Forbidden';
import ProtectedAdminRoute from './components/admin/ProtectedAdminRoute';

import { Tour } from './extensions/onboarding/Tour';
import { coachSteps } from './extensions/onboarding/coachmarks';
import { useOnboarding } from './extensions/onboarding/useOnboarding';
import { CONDITION_CLASS_ORDER, CONDITION_CLASS_COLOURS } from './utils/conditionColours';
import { MODEL_ROLES, isModelRole, type ModelRole } from './constants/roles';
import { canAcquireLock, canEditModel, isAdmin } from './utils/permissions';

type NodeLockState = Record<
  string,
  {
    entityId: number;
    lockOwner: string | null;
    lockColor: string | null;
    ownedByMe: boolean;
  }
>;

type RemoteCursorState = Record<
  number,
  {
    userId: number;
    x: number;
    y: number;
    color: string;
  }
>;

function GraphEditor() {
  const navigate = useNavigate();
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isModelListOpen, setIsModelListOpen] = useState(false);
  const [isModelPermissionsOpen, setIsModelPermissionsOpen] = useState(false);
  const [isVersionComparisonOpen, setIsVersionComparisonOpen] = useState(false);
  const [tipsOpen, setTipsOpen] = useState(true);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [comments, setComments] = useState<CommentEntry[]>([]);
  const [commentsTotal, setCommentsTotal] = useState(0);
  const [commentsLimit, setCommentsLimit] = useState(50);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsError, setCommentsError] = useState<string | null>(null);
  // Sidebar legend collapse/expand state. Persisted in localStorage so the
  // user's choice sticks across sessions; defaults to expanded.
  const [legendCollapsed, setLegendCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('stmCreator.legendCollapsed') === '1';
    } catch {
      return false;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(
        'stmCreator.legendCollapsed',
        legendCollapsed ? '1' : '0',
      );
    } catch {
      // ignore quota / private-mode failures — the toggle still works
    }
  }, [legendCollapsed]);
  const [auth, setAuth] = useState<{ token: string; user: AuthUser } | null>(() => {
    const token = authStorage.getToken();
    const user = authStorage.getUser();
    return token && user ? { token, user } : null;
  });
  const [currentModelRole, setCurrentModelRole] = useState<ModelRole | null>(null);
  const [modelLockId, setModelLockId] = useState<string | null>(null);
  const [lockType, setLockType] = useState<'edit' | 'review' | null>(null);
  const [lockHolder, setLockHolder] = useState<string | null>(null);
  const [lockExpiresAt, setLockExpiresAt] = useState<string | null>(null);
  const [modelLockOwnedByMe, setModelLockOwnedByMe] = useState(false);
  useEffect(() => {
    const handler = () => {
      setAuth(null);
      navigate('/login');
    };
    window.addEventListener('auth:expired', handler);
    return () => window.removeEventListener('auth:expired', handler);
  }, [navigate]);
  useEffect(() => {
    const handler = () => {
      navigate('/forbidden');
    };
    window.addEventListener('auth:forbidden', handler);
    return () => window.removeEventListener('auth:forbidden', handler);
  }, [navigate]);
  const [isGuest, setIsGuest] = useState(false);
  const [nodeLocks, setNodeLocks] = useState<NodeLockState>({});
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [remoteCursors, setRemoteCursors] = useState<RemoteCursorState>({});
  const activeNodeLockRef = useRef<{ nodeId: string | null; entityId: number | null }>({
    nodeId: null,
    entityId: null,
  });
  const canvasAreaRef = useRef<HTMLDivElement | null>(null);
  const cursorEmitFrameRef = useRef<number | null>(null);
  const pendingCursorRef = useRef<{ x: number; y: number } | null>(null);
  const dragPatchFrameRef = useRef<number | null>(null);
  const pendingDragPatchRef = useRef<{
    nodeId: string;
    graphStateId: number;
    position: { x: number; y: number };
  } | null>(null);

  const onboarding = useOnboarding();

  const [tourOpen, setTourOpen] = useState<boolean>(false);
  const closeTour = () => {
    setTourOpen(false);
    onboarding.complete();
  };

  const modelNameFromLocks = useRef<string | null>(null);
  const baseCanEdit = Boolean(auth || isGuest);
  const hasGlobalAdminAccess = isAdmin(auth?.user.role ?? undefined);
  const canAcquireModelEditLock = Boolean(
    auth?.token &&
    (
      canAcquireLock(currentModelRole ?? undefined) ||
      hasGlobalAdminAccess
    ),
  );
  const canMutateModelWithLock = Boolean(
    canEditModel(currentModelRole ?? undefined) ||
    hasGlobalAdminAccess
  );
  const canEditCurrentModel = isGuest || (
    Boolean(auth?.token) &&
    canMutateModelWithLock &&
    modelLockOwnedByMe &&
    lockType === 'edit'
  );

  const releaseActiveNodeLock = (reasonModelName?: string | null) => {
    const activeNodeId = activeNodeLockRef.current.nodeId;
    const activeEntityId = activeNodeLockRef.current.entityId;
    const effectiveModelName = reasonModelName ?? modelNameFromLocks.current;
    if (!activeNodeId || !activeEntityId || !effectiveModelName) {
      activeNodeLockRef.current = { nodeId: null, entityId: null };
      return;
    }

    emitNodeLockRelease(effectiveModelName, activeEntityId);
    activeNodeLockRef.current = { nodeId: null, entityId: null };
    setNodeLocks((prev) => {
      const next = { ...prev };
      delete next[activeNodeId];
      return next;
    });
  };

  const requestNodeEdit = async (nodeId: string): Promise<boolean> => {
    if (!baseCanEdit) {
      window.alert('Please sign in or continue as guest to edit nodes.');
      return false;
    }

    const entityId = parseStateId(nodeId);
    if (!auth?.token || !modelName || entityId === null) {
      return true;
    }

    const existing = nodeLocks[nodeId];
    if (existing?.ownedByMe) {
      activeNodeLockRef.current = { nodeId, entityId };
      return true;
    }

    if (existing && !existing.ownedByMe) {
      window.alert(`Node is currently being edited by ${existing.lockOwner ?? 'another user'}.`);
      return false;
    }

    releaseActiveNodeLock(modelName);

    return await new Promise<boolean>((resolve) => {
      let settled = false;
      let unsubscribe: () => void = () => {};

      const finish = (allowed: boolean) => {
        if (settled) {
          return;
        }
        settled = true;
        globalThis.clearTimeout(timeout);
        unsubscribe();
        resolve(allowed);
      };

      unsubscribe = subscribeNodeLockEvents({
        onAcquired: (payload) => {
          if (payload.entityType !== 'node' || payload.entityId !== entityId || payload.modelName !== modelName) {
            return;
          }
          setNodeLocks((prev) => ({
            ...prev,
            [nodeId]: {
              entityId,
              lockOwner: payload.lockedBy ?? auth.user.email,
              lockColor: payload.color ?? '#22c55e',
              ownedByMe: payload.userId === Number(auth.user.id),
            },
          }));
          if (payload.userId === Number(auth.user.id)) {
            activeNodeLockRef.current = { nodeId, entityId };
            finish(true);
          }
        },
        onDenied: (payload) => {
          if (payload.entityType !== 'node' || payload.entityId !== entityId || payload.modelName !== modelName) {
            return;
          }
          window.alert(`Node is currently being edited by ${payload.lockedBy ?? 'another user'}.`);
          finish(false);
        },
      });

      const timeout = globalThis.setTimeout(() => {
        unsubscribe();
        window.alert('Unable to acquire node lock from collaboration service.');
        resolve(false);
      }, 2000);
      emitNodeLockAcquire(modelName, entityId);
    });
  };

  const {
    nodesWithCallbacks,
    edges,
    nodeTypes,
    customEdgeTypes,
    defaultEdgeOptions,
    bmrgData,
    isLoading,
    error,
    isSaving,
    edgeCreationMode,
    startNodeId,
    showSelfTransitions,
    deltaFilter,
    isNodeModalOpen,
    isTransitionModalOpen,
    isEditing,
    initialNodeValues,
    currentTransition,
    stateNameMap,
    versions,
    isVersionModalOpen,
    onNodesChange,
    onConnect,
    onEdgeClick,
    onEdgeDoubleClick,
    handleEdgesChange,
    handleSaveNode,
    handleDuplicateState,
    applyRemoteNodePatch,
    handleSaveTransition,
    handleDeleteTransition,
    handleSaveModel,
    handleDeleteState,
    handleDeleteModel,
    openEditNode,
    openEditTransition,
    handleReLayout,
    applyLayout,
    toggleEdgeCreationMode,
    loadExistingEdges,
    toggleSelfTransitions,
    toggleDeltaFilter,
    openAddNodeModal,
    closeNodeModal,
    closeTransitionModal,
    saveCurrentVersion,
    openVersionManager,
    closeVersionManager,
    restoreVersion,
    deleteVersion,
    exportToEKS,
    importFromEKS,
  } = useGraphEditor({
    initialise: Boolean(auth || isGuest),
    canEdit: canEditCurrentModel,
    onReadOnlyAction: () => {
      window.alert('Acquire an edit lock before changing this model.');
    },
    requestNodeEdit,
    nodeLocks,
  });

  const modelName = bmrgData?.stm_name?.trim() || null;

  const applyModelLock = (lock: ModelLockInfo) => {
    const ownedByCurrentUser = Boolean(
      lock.locked &&
      (
        lock.owner ||
        (
          lock.lockId &&
          (!lock.lockedBy || lock.lockedBy === auth?.user.email)
        )
      ),
    );
    setModelLockId(lock.lockId ?? null);
    setLockType(lock.locked ? lock.lockType ?? null : null);
    setLockHolder(lock.locked ? lock.lockedBy ?? null : null);
    setLockExpiresAt(lock.locked ? lock.expiresAt ?? null : null);
    setModelLockOwnedByMe(ownedByCurrentUser);
  };

  const clearModelLock = () => {
    setModelLockId(null);
    setLockType(null);
    setLockHolder(null);
    setLockExpiresAt(null);
    setModelLockOwnedByMe(false);
  };

  useEffect(() => {
    if (!auth?.token || !modelName) {
      setCurrentModelRole(null);
      return;
    }

    if (isModelRole(bmrgData?.model_role)) {
      setCurrentModelRole(bmrgData.model_role);
      return;
    }

    let cancelled = false;
    const run = async () => {
      try {
        const assignedModels = await getAssignedModels();
        if (cancelled) return;
        const assignedModel = assignedModels.find((model) => model.stm_name === modelName);
        setCurrentModelRole(isModelRole(assignedModel?.model_role) ? assignedModel.model_role : null);
      } catch {
        if (!cancelled) setCurrentModelRole(null);
      }
    };
    void run();
    return () => { cancelled = true; };
  }, [auth?.token, bmrgData?.model_role, modelName]);

  useEffect(() => {
    if (!auth?.token || !modelName) {
      clearModelLock();
      return;
    }

    let cancelled = false;
    const run = async () => {
      try {
        const lock = await getModelLock(modelName);
        if (!cancelled) applyModelLock(lock);
      } catch {
        if (!cancelled) clearModelLock();
      }
    };
    void run();
    return () => { cancelled = true; };
  }, [auth?.token, modelName]);

  const handleAcquireModelLock = async () => {
    if (!modelName || !canAcquireModelEditLock) {
      return;
    }
    try {
      const lock = await acquireModelLock(modelName);
      applyModelLock(lock);
    } catch (error) {
      window.alert((error as Error).message || 'Unable to acquire edit lock.');
    }
  };

  const handleRefreshModelLock = async () => {
    if (!modelName) return;
    const lock = modelLockId
      ? await renewModelLock(modelName, modelLockId)
      : await getModelLock(modelName);
    applyModelLock(lock);
  };

  const handleReleaseModelLock = async () => {
    if (!modelName || !modelLockId) return;
    await releaseModelLock(modelName, modelLockId);
    clearModelLock();
  };

  // Right-click context menu state for canvas (state nodes & transition edges).
  const [contextMenu, setContextMenu] =
    useState<(CanvasContextMenuState & {
      // Cached identifiers for the action handlers below — keeps the menu
      // closure simple and avoids re-resolving on click.
      readonly nodeId?: string;
      readonly graphStateId?: number;
      readonly transitionId?: number;
    }) | null>(null);

  const handleNodeContextMenu = (
    event: React.MouseEvent,
    node: { id: string },
  ) => {
    if (!canEditCurrentModel) return;
    event.preventDefault();
    const graphStateId = parseStateId(node.id);
    if (graphStateId === null) return;
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      target: 'state',
      nodeId: node.id,
      graphStateId,
    });
  };

  const handleEdgeContextMenu = (
    event: React.MouseEvent,
    edge: { id: string },
  ) => {
    if (!canEditCurrentModel) return;
    event.preventDefault();
    const match = /^transition-(\d+)$/.exec(edge.id);
    if (!match) return;
    const transitionId = parseInt(match[1], 10);
    if (Number.isNaN(transitionId)) return;
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      target: 'transition',
      transitionId,
    });
  };

  const closeContextMenu = () => setContextMenu(null);

  const handleContextMenuEdit = () => {
    if (!contextMenu) return;
    if (contextMenu.target === 'state' && contextMenu.nodeId) {
      openEditNode(contextMenu.nodeId);
    } else if (
      contextMenu.target === 'transition' &&
      typeof contextMenu.transitionId === 'number'
    ) {
      openEditTransition(contextMenu.transitionId);
    }
  };

  const handleContextMenuDelete = () => {
    if (!contextMenu) return;
    if (
      contextMenu.target === 'state' &&
      typeof contextMenu.graphStateId === 'number'
    ) {
      handleDeleteState(contextMenu.graphStateId);
    } else if (
      contextMenu.target === 'transition' &&
      typeof contextMenu.transitionId === 'number' &&
      bmrgData
    ) {
      const transition = bmrgData.transitions.find(
        (t) => t.transition_id === contextMenu.transitionId,
      );
      if (transition) {
        handleDeleteTransition(transition);
      }
    }
  };

  const refreshComments = useCallback(async () => {
    if (!auth?.token || !modelName) {
      setComments([]);
      setCommentsTotal(0);
      setCommentsError(null);
      setCommentsLoading(false);
      return;
    }

    setCommentsLoading(true);
    setCommentsError(null);
    try {
      const response = await getComments(modelName, commentsLimit, 0);
      setCommentsTotal(response.total);
      setCommentsLimit(response.limit);
      setComments((existing) => {
        const incomingIds = new Set(response.comments.map((comment) => comment.id));
        return [
          ...response.comments,
          ...existing.filter((comment) => !incomingIds.has(comment.id)),
        ];
      });
    } catch (error_) {
      setCommentsError(error_ instanceof Error ? error_.message : 'Failed to load comments.');
    } finally {
      setCommentsLoading(false);
    }
  }, [auth?.token, commentsLimit, modelName]);

  const loadMoreComments = useCallback(async () => {
    if (!auth?.token || !modelName || comments.length >= commentsTotal) return;
    setCommentsLoading(true);
    setCommentsError(null);
    try {
      const response = await getComments(modelName, commentsLimit, comments.length);
      setCommentsTotal(response.total);
      setCommentsLimit(response.limit);
      setComments((existing) => {
        const existingIds = new Set(existing.map((comment) => comment.id));
        return [
          ...existing,
          ...response.comments.filter((comment) => !existingIds.has(comment.id)),
        ];
      });
    } catch (error_) {
      setCommentsError(error_ instanceof Error ? error_.message : 'Failed to load comments.');
    } finally {
      setCommentsLoading(false);
    }
  }, [auth?.token, comments.length, commentsLimit, commentsTotal, modelName]);

  useEffect(() => {
    void refreshComments();
  }, [refreshComments]);

  useEffect(() => {
    if (!auth?.token || !modelName) return;

    const timer = window.setInterval(() => {
      void refreshComments();
    }, 15000);

    return () => window.clearInterval(timer);
  }, [auth?.token, modelName, refreshComments]);

  const commentStats = useMemo(() => {
    const empty = {
      nodeCounts: {} as Record<string, number>,
      edgeCounts: {} as Record<string, number>,
    };
    if (!modelName) return empty;

    const openComments = comments.filter((comment) => !comment.resolved && typeof comment.body === 'string');
    const nodeCounts: Record<string, number> = {};
    const edgeCounts: Record<string, number> = {};

    nodesWithCallbacks.forEach((node) => {
      const label = String(node.data.label || '').trim();
      if (!label) return;
      const graphStateId = parseStateId(node.id);
      const mentionToken = `@[${label}]`;
      nodeCounts[node.id] = openComments.filter((comment) =>
        (comment.entityType === 'node' && comment.entityId === graphStateId) ||
        comment.body.includes(mentionToken)
      ).length;
    });

    edges.forEach((edge) => {
      const srcNode = nodesWithCallbacks.find((node) => node.id === edge.source);
      const tgtNode = nodesWithCallbacks.find((node) => node.id === edge.target);
      const sourceLabel = String(srcNode?.data.label || edge.source).trim();
      const targetLabel = String(tgtNode?.data.label || edge.target).trim();
      const transitionId = /^transition-(\d+)$/.exec(edge.id)?.[1];
      const mentionToken = `@[${sourceLabel} -> ${targetLabel}]`;
      edgeCounts[edge.id] = openComments.filter((comment) =>
        (comment.entityType === 'edge' && comment.entityId === Number(transitionId)) ||
        comment.body.includes(mentionToken)
      ).length;
    });

    return { nodeCounts, edgeCounts };
  }, [modelName, nodesWithCallbacks, edges, comments]);

  const nodesForRender = nodesWithCallbacks.map((node) => ({
    ...node,
    data: {
      ...node.data,
      commentCount: commentStats.nodeCounts[node.id] ?? 0,
      onCommentBubbleClick: () => {
        setCommentsOpen(true);
        setTipsOpen(false);
      },
    },
  }));

  const edgesForRender = edges.map((edge) => ({
    ...edge,
    data: {
      ...edge.data,
      commentCount: commentStats.edgeCounts[edge.id] ?? 0,
      onCommentBubbleClick: () => {
        setCommentsOpen(true);
        setTipsOpen(false);
      },
    },
  }));

  const driverOptions = useMemo<Driver[]>(() => {
    const drivers = bmrgData?.transitions.flatMap((transition) =>
      (transition.causal_chain ?? []).flatMap((part: unknown) => {
        const maybePart = part as { drivers?: unknown };
        return Array.isArray(maybePart.drivers) ? maybePart.drivers : [];
      }),
    ) ?? [];

    const seen = new Set<string>();
    return drivers.filter((driver: unknown): driver is Driver => {
      const candidate = driver as Partial<Driver> | null;
      if (!candidate || typeof candidate.driver !== 'string' || typeof candidate.driver_group !== 'string') {
        return false;
      }
      const key = `${candidate.driver_group}:::${candidate.driver}`.toLowerCase();
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }, [bmrgData]);

  // ---- Save validation: state id must be unique ----
  const validateUniqueStateIds = () => {
    const counts = new Map<string, number>();

    nodesWithCallbacks.forEach((node) => {
      const id = String(node.id ?? '').trim();
      if (!id) return;
      counts.set(id, (counts.get(id) ?? 0) + 1);
    });

    const duplicates = Array.from(counts.entries())
      .filter(([, count]) => count > 1)
      .map(([id]) => id);

    return {
      valid: duplicates.length === 0,
      duplicates,
    };
  };

  const handleSaveModelWithValidation = async () => {
    const result = validateUniqueStateIds();

    if (!result.valid) {
      window.alert(`State ID must be unique. Duplicate IDs: ${result.duplicates.join(', ')}`);
      throw new Error('Duplicate state IDs.');
    }

    return await handleSaveModel();
  };

  const emitConfirmedNodeUpdate = (attributes: NodeAttributes) => {
    const nodeId = initialNodeValues?.id;
    const graphStateId = nodeId ? parseStateId(nodeId) : null;
    if (!isEditing || !auth?.token || !modelName || !nodeId || graphStateId === null) {
      return;
    }

    const bounds = /Condition\s*range:\s*([\d.+-]+)\s*-\s*([\d.+-]+)/i.exec(attributes.condition ?? '');
    const patches: Array<[string, unknown]> = [
      ['stateName', attributes.stateName],
      ['stateNumber', attributes.stateNumber],
      ['vastClass', attributes.vastClass],
      ['note', attributes.note ?? ''],
      ['imageUrls', attributes.imageUrls ?? (attributes.imageUrl ? [attributes.imageUrl] : [])],
      ['imageUrl', attributes.imageUrl ?? ''],
      ['template', attributes.template],
    ];

    if (bounds) {
      patches.push(['conditionLower', bounds[1]], ['conditionUpper', bounds[2]]);
    }

    patches.forEach(([field, value]) => {
      emitEntityPatch(modelName, graphStateId, field, value);
    });
  };

  const emitNodePositionPatch = (graphStateId: number, position: { x: number; y: number }) => {
    applyRemoteNodePatch(`state-${graphStateId}`, graphStateId, 'position', {
      x: position.x,
      y: position.y,
    });

    if (!auth?.token || !modelName) {
      return;
    }

    emitEntityPatch(modelName, graphStateId, 'position', {
      x: position.x,
      y: position.y,
    });
  };

  const handleNodeDragStart = (_event: React.MouseEvent, node: { id: string }) => {
    void requestNodeEdit(node.id);
  };

  const handleNodeDrag = (_event: React.MouseEvent, node: { id: string; position: { x: number; y: number } }) => {
    const graphStateId = parseStateId(node.id);
    if (!auth?.token || !modelName || graphStateId === null) {
      return;
    }

    if (!nodeLocks[node.id]?.ownedByMe) {
      return;
    }

    pendingDragPatchRef.current = {
      nodeId: node.id,
      graphStateId,
      position: {
        x: node.position.x,
        y: node.position.y,
      },
    };

    if (dragPatchFrameRef.current !== null) {
      return;
    }

    dragPatchFrameRef.current = globalThis.requestAnimationFrame(() => {
      dragPatchFrameRef.current = null;
      const next = pendingDragPatchRef.current;
      if (!next) {
        return;
      }
      emitNodePositionPatch(next.graphStateId, next.position);
    });
  };

  const handleNodeDragStop = (_event: React.MouseEvent, node: { id: string; position: { x: number; y: number } }) => {
    const graphStateId = parseStateId(node.id);
    if (!auth?.token || !modelName || graphStateId === null || !nodeLocks[node.id]?.ownedByMe) {
      return;
    }

    if (dragPatchFrameRef.current !== null) {
      globalThis.cancelAnimationFrame(dragPatchFrameRef.current);
      dragPatchFrameRef.current = null;
    }
    pendingDragPatchRef.current = null;

    emitNodePositionPatch(graphStateId, {
      x: node.position.x,
      y: node.position.y,
    });
    emitNodeLockRelease(modelName, graphStateId);
  };

  useEffect(() => {
    modelNameFromLocks.current = modelName;

    if (!auth?.token || !modelName) {
      disconnectCollabSocket();
      setNodeLocks({});
      setOnlineUsers([]);
      setRemoteCursors({});
      activeNodeLockRef.current = { nodeId: null, entityId: null };
      return;
    }

    connectCollabSocket({
      token: auth.token,
      modelName,
    });

    const unsubscribePresence = subscribePresenceEvents({
      onSync: (payload) => {
        setOnlineUsers(payload.users);
      },
      onJoin: (payload) => {
        setOnlineUsers((prev) => {
          const next = prev.filter((user) => user.userId !== payload.user.userId);
          next.push(payload.user);
          return next;
        });
      },
      onLeave: (payload) => {
        setOnlineUsers((prev) => prev.filter((user) => user.userId !== payload.userId));
        setRemoteCursors((prev) => {
          const next = { ...prev };
          delete next[payload.userId];
          return next;
        });
      },
    });

    const unsubscribeCursor = subscribeCursorEvents({
      onMove: (payload) => {
        if (payload.userId === Number(auth.user.id)) {
          return;
        }
        setRemoteCursors((prev) => ({
          ...prev,
          [payload.userId]: {
            userId: payload.userId,
            x: payload.x,
            y: payload.y,
            color: payload.color || '#3b82f6',
          },
        }));
      },
    });

    const unsubscribeEntityPatch = subscribeEntityPatchEvents({
      onPatch: (payload) => {
        if (payload.entityType !== 'node' || payload.userId === Number(auth.user.id)) {
          return;
        }
        const nodeId = `state-${payload.entityId}`;
        applyRemoteNodePatch(nodeId, payload.entityId, payload.field, payload.value);
      },
    });

    const unsubscribe = subscribeNodeLockEvents({
      onAcquired: (payload) => {
        if (payload.entityType !== 'node' || payload.modelName !== modelName) {
          return;
        }
        const nodeId = `state-${payload.entityId}`;
        setNodeLocks((prev) => ({
          ...prev,
          [nodeId]: {
            entityId: payload.entityId,
            lockOwner: payload.lockedBy ?? null,
            lockColor: payload.color ?? '#f59e0b',
            ownedByMe: payload.userId === Number(auth.user.id),
          },
        }));
      },
      onReleased: (payload) => {
        if (payload.entityType !== 'node' || payload.modelName !== modelName) {
          return;
        }
        const nodeId = `state-${payload.entityId}`;
        setNodeLocks((prev) => {
          const next = { ...prev };
          delete next[nodeId];
          return next;
        });
        if (activeNodeLockRef.current.entityId === payload.entityId) {
          activeNodeLockRef.current = { nodeId: null, entityId: null };
        }
      },
    });

    return () => {
      unsubscribePresence();
      unsubscribeCursor();
      unsubscribeEntityPatch();
      unsubscribe();
      releaseActiveNodeLock(modelName);
      disconnectCollabSocket();
      setNodeLocks({});
      setOnlineUsers([]);
      setRemoteCursors({});
    };
  }, [auth?.token, auth?.user.id, modelName]);

  useEffect(() => {
    const onBeforeUnload = () => {
      releaseActiveNodeLock(modelNameFromLocks.current);
    };

    globalThis.addEventListener('beforeunload', onBeforeUnload);
    return () => {
      globalThis.removeEventListener('beforeunload', onBeforeUnload);
    };
  }, []);

  const handleCreateNewModel = (nextModelName: string) => {
    setCurrentModelRole(MODEL_ROLES.OWNER);
    globalThis.location.href = `/editor?model=${encodeURIComponent(nextModelName)}`;
  };

  const handleLoadExistingModel = (nextModelName: string) => {
    globalThis.location.href = `/editor?model=${encodeURIComponent(nextModelName)}`;
  };

  const handleModelSelection = (nextModelName: string, createNew: boolean) => {
    if (createNew) {
      handleCreateNewModel(nextModelName);
    } else {
      handleLoadExistingModel(nextModelName);
    }
  };

  if (!auth && !isGuest) {
    return (
      <AuthPage
        onAuthenticated={(a) => setAuth(a)}
        onContinueGuest={() => setIsGuest(true)}
        onModelSelected={handleModelSelection}
      />
    );
  }

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={() => globalThis.location.reload()} />;

  const plausibleTransitionCount =
    bmrgData ? bmrgData.transitions.filter((t) => t.time_25 === 1).length : 0;

  const classCountMap: Record<string, number> = {};
  if (bmrgData) {
    for (const s of bmrgData.states) {
      const cls = s.vast_state?.vast_class || 'Unknown';
      classCountMap[cls] = (classCountMap[cls] || 0) + 1;
    }
  }

  // Swatch colours mirror the rendered node colours from customNode.css
  // (.class-color-1 .. .class-color-6). Keep these in sync if those change
  // — the legend is meant to be a faithful preview of the canvas.
  const legendItems = CONDITION_CLASS_ORDER.map((className) => ({
    cls: className,
    label: CONDITION_CLASS_COLOURS[className].label,
    bg: CONDITION_CLASS_COLOURS[className].background,
    border: CONDITION_CLASS_COLOURS[className].border,
  }));

  const handleCanvasMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!auth?.token || !modelName || !canvasAreaRef.current) {
      return;
    }

    const rect = canvasAreaRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    pendingCursorRef.current = { x, y };

    if (cursorEmitFrameRef.current !== null) {
      return;
    }

    cursorEmitFrameRef.current = globalThis.requestAnimationFrame(() => {
      cursorEmitFrameRef.current = null;
      const next = pendingCursorRef.current;
      if (!next || !modelName) {
        return;
      }
      emitCursorMove(modelName, next.x, next.y);
    });
  };

  const handleCanvasMouseLeave = () => {
    pendingCursorRef.current = null;
    if (cursorEmitFrameRef.current !== null) {
      globalThis.cancelAnimationFrame(cursorEmitFrameRef.current);
      cursorEmitFrameRef.current = null;
    }
  };

  const handleExportPng = async () => {
    const canvasArea = canvasAreaRef.current;
    if (!canvasArea) {
      window.alert('Canvas is not ready for export yet.');
      return;
    }

    const reactFlowRoot = canvasArea.querySelector('.react-flow') as HTMLElement | null;
    if (!reactFlowRoot) {
      window.alert('Could not find the current canvas viewport.');
      return;
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filenameBase = bmrgData?.stm_name?.trim() || 'stm-canvas';
    const backgroundColor = getComputedStyle(canvasArea).backgroundColor;

    try {
      const dataUrl = await toPng(reactFlowRoot, {
        backgroundColor,
        cacheBust: true,
        width: reactFlowRoot.clientWidth,
        height: reactFlowRoot.clientHeight,
        pixelRatio: Math.min(globalThis.devicePixelRatio || 1, 2),
        filter: (node: HTMLElement) => {
          if (!(node instanceof Element)) {
            return true;
          }

          return !(
            node.classList.contains('react-flow__background') ||
            node.classList.contains('react-flow__minimap') ||
            node.classList.contains('react-flow__controls') ||
            node.classList.contains('edge-comment-foreignobject') ||
            node.classList.contains('edge-comment-bubble')
          );
        },
      });

      const anchor = document.createElement('a');
      anchor.href = dataUrl;
      anchor.download = `${filenameBase}-${timestamp}-powerpoint-export.png`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
    } catch (error) {
      console.error('Failed to export canvas for PowerPoint', error);
      window.alert('PowerPoint image export failed. Please try again.');
    }
  };

  return (
    <div className="app-container">
      <div data-tour="toolbar">
        <GraphToolbar
          onAddNode={openAddNodeModal}
          onToggleEdgeCreation={toggleEdgeCreationMode}
          onLoadEdges={loadExistingEdges}
          onSaveModel={handleSaveModelWithValidation}
          onOpenModelList={() => setIsModelListOpen(true)}
          onCreateNewModel={handleCreateNewModel}
          onDeleteModel={handleDeleteModel}
          onApplyLayout={applyLayout}
          onOpenMilestone={openVersionManager}
          onImportEKS={importFromEKS}
          onExportEKS={exportToEKS}
          onExportPNG={handleExportPng}
          onRelayout={handleReLayout}
          onToggleSelfTransitions={toggleSelfTransitions}
          onOpenVersionCompare={() => setIsVersionComparisonOpen(true)}
          edgeCreationMode={edgeCreationMode}
          isSaving={isSaving}
          showSelfTransitions={showSelfTransitions}
          bmrgData={bmrgData}
          onOpenHelp={() => setIsHelpOpen(true)}
          onToggleComments={() => setCommentsOpen(prev => !prev)}
          onOpenModelPermissions={() => setIsModelPermissionsOpen(true)}
          userEmail={auth?.user.email ?? null}
          userRole={auth?.user.role ?? null}
          currentModelRole={currentModelRole}
          isGuest={isGuest}
          canEdit={canEditCurrentModel}
          lockHolder={lockHolder}
          lockExpiresAt={lockExpiresAt}
          hasActiveLock={modelLockOwnedByMe}
          onAcquireLock={canAcquireModelEditLock && !modelLockOwnedByMe ? () => { void handleAcquireModelLock(); } : undefined}
          onRefreshLock={modelLockOwnedByMe ? () => { void handleRefreshModelLock(); } : undefined}
          onReleaseLock={modelLockOwnedByMe && modelLockId ? () => { void handleReleaseModelLock(); } : undefined}
          onLogout={() => {
            releaseActiveNodeLock(modelName);
            disconnectCollabSocket();
            authStorage.clear();
            setAuth(null);
            setIsGuest(false);
            setNodeLocks({});
          }}
          onSignIn={() => {
            setIsGuest(false);
          }}
        />
      </div>

      <div className="header-bar">
        <div className="model-name">{bmrgData?.stm_name || 'STM Creator'}</div>
        {bmrgData && (
          <>
            <div className="meta-pill">
              <span className="dot dot-green"></span>
              {bmrgData.states.length} states
            </div>
            <div className="meta-pill">
              <span className="dot dot-amber"></span>
              {plausibleTransitionCount} / {bmrgData.transitions.length} transitions
            </div>
          </>
        )}

        <div className="meta-pill">
          <span
            className="dot"
            style={{
              background: canEditCurrentModel ? 'var(--accent)' : 'var(--amber)',
            }}
          />
          {canEditCurrentModel ? 'Edit lock active' : 'Read-only'}
        </div>

        {lockType && (
          <div
            className="meta-pill"
            style={{
              borderColor: lockType === 'review' ? '#f59e0b' : '#f97316',
              color: lockType === 'review' ? '#92400e' : '#9a3412',
              background: lockType === 'review' ? '#fffbeb' : '#fff7ed',
            }}
          >
            {lockType === 'review'
              ? '🔒 Locked for review — editing is paused while a reviewer is active'
              : `🔒 Being edited by ${lockHolder ?? 'another user'}`}
          </div>
        )}

        {auth?.user.email && (
          <div className="meta-pill">
            {auth.user.email}
          </div>
        )}

        <div className="presence-strip">
          <div className="presence-title">
            Online {onlineUsers.length > 0 ? `(${onlineUsers.length})` : ''}
          </div>
          {onlineUsers.length === 0 ? (
            <div className="presence-empty">No active collaborators</div>
          ) : (
            <div className="presence-list">
              {onlineUsers.map((user) => {
                const label = user.email?.trim() || `User ${user.userId}`;
                const initials = label.slice(0, 2).toUpperCase();
                const isMe = auth?.user && Number(auth.user.id) === user.userId;
                return (
                  <div
                    key={user.userId}
                    className={`presence-chip${isMe ? ' me' : ''}`}
                    title={`${label}${user.role ? ` (${user.role})` : ''}`}
                  >
                    <span
                      className="presence-avatar"
                      style={{ backgroundColor: user.color || '#3b82f6' }}
                    >
                      {initials}
                    </span>
                    <span className="presence-name">
                      {isMe ? `${label} (You)` : label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="workspace">
        <div className="sidebar">
          <div className="sidebar-section">
            <button
              type="button"
              className="sidebar-label legend-toggle"
              onClick={() => setLegendCollapsed((v) => !v)}
              aria-expanded={!legendCollapsed}
              aria-controls="legend-list"
              title={legendCollapsed ? 'Expand legend' : 'Collapse legend'}
            >
              <span
                className="legend-toggle-arrow"
                aria-hidden="true"
                style={{
                  display: 'inline-block',
                  marginRight: 6,
                  transform: legendCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
                  transition: 'transform .15s ease',
                }}
              >
                ▾
              </span>
              Condition classes
            </button>
            {!legendCollapsed && (
              <div id="legend-list">
                {legendItems.map((item) => (
                  <div className="legend-item" key={item.cls}>
                    <div
                      className="legend-swatch"
                      style={{ background: item.bg, border: `1px solid ${item.border}` }}
                    />
                    <span className="legend-text">{item.label}</span>
                    <span className="legend-count">{classCountMap[item.cls] || 0}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="sidebar-divider" />

          <TransitionFilterPanel
            bmrgData={bmrgData}
            showSelfTransitions={showSelfTransitions}
            deltaFilter={deltaFilter}
            onToggleSelfTransitions={toggleSelfTransitions}
            onDeltaFilterChange={toggleDeltaFilter}
            onReset={loadExistingEdges}
            inSidebar
          />
        </div>

        <div
          ref={canvasAreaRef}
          className="canvas-area"
          onMouseMoveCapture={handleCanvasMouseMove}
          onMouseLeave={handleCanvasMouseLeave}
        >
          <ReactFlow
            nodes={nodesForRender}
            edges={edgesForRender}
            nodeTypes={nodeTypes}
            edgeTypes={customEdgeTypes}
            defaultEdgeOptions={defaultEdgeOptions}
            onNodesChange={onNodesChange}
            onEdgesChange={handleEdgesChange}
            onConnect={onConnect}
            onEdgeClick={onEdgeClick}
            onEdgeDoubleClick={onEdgeDoubleClick}
            onNodeContextMenu={handleNodeContextMenu}
            onEdgeContextMenu={handleEdgeContextMenu}
            onPaneContextMenu={(event) => {
              // Right-clicking empty canvas dismisses the menu but otherwise
              // keeps the browser's default suppressed for a consistent feel.
              event.preventDefault();
              closeContextMenu();
            }}
            onNodeDragStart={handleNodeDragStart}
            onNodeDrag={handleNodeDrag}
            onNodeDragStop={handleNodeDragStop}
            edgesFocusable
            elementsSelectable
            edgesReconnectable={canEditCurrentModel}
            reconnectRadius={10}
            fitView
            fitViewOptions={{ padding: 0.2, includeHiddenNodes: false }}
            proOptions={{ hideAttribution: true }}
            minZoom={0.2}
            maxZoom={2}
            nodesDraggable={canEditCurrentModel}
            connectOnClick={canEditCurrentModel}
            zoomOnDoubleClick={false}
            panOnDrag
            panOnScroll
            snapToGrid
            snapGrid={[20, 20]}
          >
            <Background />
            <MiniMap />
            <Controls />
          </ReactFlow>

          <div className="cursor-layer" aria-hidden="true">
            {Object.values(remoteCursors).map((cursor) => {
              const user = onlineUsers.find((item) => item.userId === cursor.userId);
              const label = user?.email?.trim() || `User ${cursor.userId}`;
              return (
                <div
                  key={cursor.userId}
                  className="remote-cursor"
                  style={
                    {
                      left: cursor.x,
                      top: cursor.y,
                      '--cursor-color': cursor.color,
                    } as React.CSSProperties
                  }
                >
                  <div className="remote-cursor-pointer" />
                  <div className="remote-cursor-label">{label}</div>
                </div>
              );
            })}
          </div>

          {bmrgData && (
            <div className="statusbar">
              <div className="statusbar-dot" />
              <span>nodes</span> <b>{bmrgData.states.length}</b>
              <span>transitions</span> <b>{plausibleTransitionCount}</b>
            </div>
          )}
        </div>

        <div className={`right-panel ${tipsOpen || commentsOpen ? 'open' : ''}`}>
          <div className="rp-inner">
            {commentsOpen ? (
              <CommentPanel
                onClose={() => setCommentsOpen(false)}
                comments={comments}
                onCommentsChange={setComments}
                onReload={refreshComments}
                onLoadMore={loadMoreComments}
                hasMore={comments.length < commentsTotal}
                isLoading={commentsLoading}
                error={commentsError}
                canComment={Boolean(auth?.token && modelName)}
                currentModelRole={currentModelRole}
                userEmail={auth?.user.email ?? null}
                userRole={auth?.user.role ?? null}
                nodes={nodesForRender.map((n) => ({ id: n.id, label: n.data.label || n.id }))}
                edges={edges.map((e) => {
                  const srcNode = nodesForRender.find((n) => n.id === e.source);
                  const tgtNode = nodesForRender.find((n) => n.id === e.target);
                  return {
                    id: e.id,
                    sourceLabel: srcNode?.data.label || e.source,
                    targetLabel: tgtNode?.data.label || e.target,
                  };
                })}
                modelName={modelName || 'unnamed'}
              />
            ) : tipsOpen ? (
              <TipsPanel onClose={() => setTipsOpen(false)} />
            ) : null}
          </div>
        </div>
      </div>

      <Tour open={tourOpen} onClose={closeTour} steps={coachSteps} />

      <EdgeCreationHint isActive={edgeCreationMode} hasStartNode={Boolean(startNodeId)} />

      <NodeModal
        isOpen={isNodeModalOpen}
        onClose={() => {
          releaseActiveNodeLock(modelName);
          closeNodeModal();
        }}
        onSave={(attributes) => {
          emitConfirmedNodeUpdate(attributes);
          handleSaveNode(attributes);
          releaseActiveNodeLock(modelName);
        }}
        onDelete={() => {
          const raw = initialNodeValues?.id ?? '';
          const idStr = raw.startsWith('state-') ? raw.replace('state-', '') : raw.replace('node-', '');
          const graphId = parseInt(idStr, 10);
          if (!Number.isNaN(graphId)) {
            handleDeleteState(graphId);
          }
          releaseActiveNodeLock(modelName);
        }}
        onDuplicate={() => {
          if (initialNodeValues?.id) {
            handleDuplicateState(initialNodeValues.id);
          }
          releaseActiveNodeLock(modelName);
        }}
        initialValues={initialNodeValues}
        isEditing={isEditing}
      />

      <TransitionModal
        isOpen={isTransitionModalOpen}
        onClose={closeTransitionModal}
        onSave={handleSaveTransition}
        onDelete={handleDeleteTransition}
        transition={currentTransition}
        stateNames={stateNameMap}
        driverOptions={driverOptions}
      />

      <MilestoneModal
        isOpen={isVersionModalOpen}
        versions={versions}
        onClose={closeVersionManager}
        onSave={saveCurrentVersion}
        onRestore={restoreVersion}
        onDelete={deleteVersion}
        canEdit={canEditCurrentModel}
        modelName={modelName}
        currentModelRole={currentModelRole}
        userRole={auth?.user.role ?? null}
      />

      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
      <VersionComparisonModal
        isOpen={isVersionComparisonOpen}
        versions={versions}
        currentData={bmrgData}
        onClose={() => setIsVersionComparisonOpen(false)}
      />
      <ModelListModal
        isOpen={isModelListOpen}
        onClose={() => setIsModelListOpen(false)}
        userRole={auth?.user.role ?? null}
      />
      <ModelPermissionsModal
        isOpen={isModelPermissionsOpen}
        modelName={modelName}
        currentModelRole={currentModelRole}
        onClose={() => setIsModelPermissionsOpen(false)}
      />

      <CanvasContextMenu
        menu={contextMenu}
        onClose={closeContextMenu}
        onEdit={handleContextMenuEdit}
        onDelete={handleContextMenuDelete}
      />
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/editor" element={<GraphEditor />} />
        <Route path="/home" element={<Home />} />
        <Route path="/login" element={<Navigate to="/editor" replace />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/forbidden" element={<Forbidden />} />
        <Route path="/notfound" element={<NotFound />} />
        <Route path="/admin" element={<ProtectedAdminRoute><AdminDashboard /></ProtectedAdminRoute>} />
        <Route path="*" element={<Navigate to="/notfound" replace />} />
      </Routes>
    </Router>
  );
}

export default function AppWithProvider() {
  return (
    <ReactFlowProvider>
      <App />
    </ReactFlowProvider>
  );
}
