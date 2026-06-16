import { io, type Socket } from 'socket.io-client';

import { API_BASE } from '../app/auth/api';

export type OnlineUser = {
  userId: number;
  email: string;
  role: string;
  color: string;
};

export type PresenceSyncPayload = {
  users: OnlineUser[];
};

export type PresenceJoinPayload = {
  user: OnlineUser;
};

export type PresenceLeavePayload = {
  userId: number;
};

export type CursorMovePayload = {
  userId: number;
  color: string;
  x: number;
  y: number;
};

export type ViewportUpdatePayload = {
  userId: number;
  x: number;
  y: number;
  zoom: number;
};

export type LockEventPayload = {
  entityType: 'node' | string;
  entityId: number;
  modelName: string;
  userId?: number;
  lockedBy?: string;
  color?: string;
};

export type LockDeniedPayload = {
  entityType: 'node' | string;
  entityId: number;
  modelName: string;
  lockedBy?: string;
};

export type EntityPatchPayload = {
  entityType: 'node' | string;
  entityId: number;
  field: string;
  value: unknown;
  userId?: number;
  modelName?: string;
};

type ServerToClientEvents = {
  'presence:sync': (payload: PresenceSyncPayload) => void;
  'presence:join': (payload: PresenceJoinPayload) => void;
  'presence:leave': (payload: PresenceLeavePayload) => void;
  'cursor:move': (payload: CursorMovePayload) => void;
  'viewport:update': (payload: ViewportUpdatePayload) => void;
  'lock:acquired': (payload: LockEventPayload) => void;
  'lock:released': (payload: LockEventPayload) => void;
  'lock:denied': (payload: LockDeniedPayload) => void;
  'entity:patch': (payload: EntityPatchPayload) => void;
  'error:validation': (payload: { message?: string }) => void;
};

type ClientToServerEvents = {
  'room:join': (payload: { modelName: string }) => void;
  'cursor:move': (payload: { modelName: string; x: number; y: number }) => void;
  'viewport:update': (payload: { modelName: string; x: number; y: number; zoom: number }) => void;
  'lock:acquire': (payload: { entityType: 'node'; entityId: number; modelName: string }) => void;
  'lock:release': (payload: { entityType: 'node'; entityId: number; modelName: string }) => void;
  'entity:patch': (payload: { entityType: 'node'; entityId: number; modelName: string; field: string; value: unknown }) => void;
};

type CollabSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

type ConnectOptions = {
  token: string;
  modelName: string;
};

let socket: CollabSocket | null = null;
let socketToken: string | null = null;
let joinedModelName: string | null = null;

function getCollabUrl(): string {
  const envUrl = (import.meta as any).env?.VITE_COLLAB_URL as string | undefined;
  return envUrl?.trim() || API_BASE;
}

function ensureSocket(token: string): CollabSocket {
  if (socket && socketToken === token) {
    return socket;
  }

  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
  }

  socket = io(getCollabUrl(), {
    autoConnect: false,
    transports: [ 'polling','websocket'],
    auth: { token },
  });
  socketToken = token;
  joinedModelName = null;

  socket.on('connect_error', (error) => {
    console.error('[collab] socket connection failed:', error.message);
  });

  socket.on('error:validation', (payload) => {
    console.error('[collab] validation error:', payload?.message || 'unknown validation error');
  });

  return socket;
}

function joinCurrentModel(activeSocket: CollabSocket, modelName: string): void {
  if (!modelName || joinedModelName === modelName) {
    return;
  }

  activeSocket.emit('room:join', { modelName });
  joinedModelName = modelName;
}

export function connectCollabSocket(options: ConnectOptions): CollabSocket {
  const activeSocket = ensureSocket(options.token);

  function handleConnectJoin() {
    joinCurrentModel(activeSocket, options.modelName);
  }

  if (!activeSocket.connected) {
    activeSocket.off('connect', handleConnectJoin); // still won't work with new refs
    activeSocket.once('connect', handleConnectJoin); // ← use .once() instead
    activeSocket.connect();
  } else {
    joinCurrentModel(activeSocket, options.modelName);
  }

  return activeSocket;
}

export function disconnectCollabSocket(): void {
  if (!socket) {
    return;
  }

  socket.removeAllListeners();
  socket.disconnect();
  socket = null;
  socketToken = null;
  joinedModelName = null;
}

export function getCollabSocket(): CollabSocket | null {
  return socket;
}

export function subscribePresenceEvents(handlers: {
  onSync?: (payload: PresenceSyncPayload) => void;
  onJoin?: (payload: PresenceJoinPayload) => void;
  onLeave?: (payload: PresenceLeavePayload) => void;
}): () => void {
  const activeSocket = socket;
  if (!activeSocket) {
    return () => undefined;
  }

  const handleSync = (payload: PresenceSyncPayload) => handlers.onSync?.(payload);
  const handleJoin = (payload: PresenceJoinPayload) => handlers.onJoin?.(payload);
  const handleLeave = (payload: PresenceLeavePayload) => handlers.onLeave?.(payload);

  activeSocket.on('presence:sync', handleSync);
  activeSocket.on('presence:join', handleJoin);
  activeSocket.on('presence:leave', handleLeave);

  return () => {
    activeSocket.off('presence:sync', handleSync);
    activeSocket.off('presence:join', handleJoin);
    activeSocket.off('presence:leave', handleLeave);
  };
}

export function emitCursorMove(modelName: string, x: number, y: number): void {
  socket?.emit('cursor:move', { modelName, x, y });
}

export function emitEntityPatch(modelName: string, entityId: number, field: string, value: unknown): void {
  socket?.emit('entity:patch', { entityType: 'node', entityId, modelName, field, value });
}

export function subscribeCursorEvents(handlers: {
  onMove?: (payload: CursorMovePayload) => void;
}): () => void {
  const activeSocket = socket;
  if (!activeSocket) {
    return () => undefined;
  }

  const handleMove = (payload: CursorMovePayload) => handlers.onMove?.(payload);
  activeSocket.on('cursor:move', handleMove);

  return () => {
    activeSocket.off('cursor:move', handleMove);
  };
}

export function subscribeEntityPatchEvents(handlers: {
  onPatch?: (payload: EntityPatchPayload) => void;
}): () => void {
  const activeSocket = socket;
  if (!activeSocket) {
    return () => undefined;
  }

  const handlePatch = (payload: EntityPatchPayload) => handlers.onPatch?.(payload);
  activeSocket.on('entity:patch', handlePatch);

  return () => {
    activeSocket.off('entity:patch', handlePatch);
  };
}

export function emitNodeLockAcquire(modelName: string, entityId: number): void {
  socket?.emit('lock:acquire', { entityType: 'node', entityId, modelName });
}

export function emitNodeLockRelease(modelName: string, entityId: number): void {
  socket?.emit('lock:release', { entityType: 'node', entityId, modelName });
}

export function subscribeNodeLockEvents(handlers: {
  onAcquired?: (payload: LockEventPayload) => void;
  onReleased?: (payload: LockEventPayload) => void;
  onDenied?: (payload: LockDeniedPayload) => void;
}): () => void {
  const activeSocket = socket;
  if (!activeSocket) {
    return () => undefined;
  }

  const handleAcquired = (payload: LockEventPayload) => handlers.onAcquired?.(payload);
  const handleReleased = (payload: LockEventPayload) => handlers.onReleased?.(payload);
  const handleDenied = (payload: LockDeniedPayload) => handlers.onDenied?.(payload);

  activeSocket.on('lock:acquired', handleAcquired);
  activeSocket.on('lock:released', handleReleased);
  activeSocket.on('lock:denied', handleDenied);

  return () => {
    activeSocket.off('lock:acquired', handleAcquired);
    activeSocket.off('lock:released', handleReleased);
    activeSocket.off('lock:denied', handleDenied);
  };
}
