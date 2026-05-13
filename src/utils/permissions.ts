import { GLOBAL_ROLES, MODEL_ROLES, type GlobalRole, type ModelRole } from '../constants/roles';

export const isAdmin = (role?: GlobalRole): boolean =>
  role === GLOBAL_ROLES.ADMIN;

export const isEditor = (role?: GlobalRole): boolean =>
  role === GLOBAL_ROLES.EDITOR || role === GLOBAL_ROLES.ADMIN;

export const isViewer = (role?: GlobalRole): boolean =>
  role === GLOBAL_ROLES.VIEWER;

// Model-level permission checks
export const canEditModel = (modelRole?: ModelRole): boolean =>
  modelRole === MODEL_ROLES.OWNER || modelRole === MODEL_ROLES.EDITOR;

export const canReviewModel = (modelRole?: ModelRole): boolean =>
  modelRole === MODEL_ROLES.OWNER ||
  modelRole === MODEL_ROLES.EDITOR ||
  modelRole === MODEL_ROLES.REVIEWER;

export const canManageModelPermissions = (modelRole?: ModelRole, globalRole?: GlobalRole): boolean =>
  globalRole === GLOBAL_ROLES.ADMIN || modelRole === MODEL_ROLES.OWNER;

export const canAcquireLock = (modelRole?: ModelRole): boolean =>
  modelRole === MODEL_ROLES.OWNER ||
  modelRole === MODEL_ROLES.EDITOR ||
  modelRole === MODEL_ROLES.REVIEWER;

export const canPostComments = (modelRole?: ModelRole): boolean =>
  modelRole === MODEL_ROLES.OWNER ||
  modelRole === MODEL_ROLES.EDITOR ||
  modelRole === MODEL_ROLES.REVIEWER;
