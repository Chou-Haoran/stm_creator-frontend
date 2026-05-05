import { API_BASE, getAuthHeader } from '../auth/api';

export interface BackendComment {
    id: number;
    entityType: string | null;
    entityId: number | null;
    parentId: number | null;
    body: string;
    resolved: boolean;
    createdAt: string;
    updatedAt: string;
    author: {
        id: number;
        email: string;
    };
    mentions: string[];
}

interface CommentsResponse {
    comments: BackendComment[];
}

interface CommentResponse {
    comment: BackendComment;
}

async function readError(response: Response): Promise<string> {
    try {
        const data = await response.json() as { error?: unknown; message?: unknown };
        const message = data.error ?? data.message;
        return typeof message === 'string' ? message : `Request failed (${response.status})`;
    } catch {
        return `Request failed (${response.status})`;
    }
}

export async function fetchComments(modelName: string): Promise<BackendComment[]> {
    const response = await fetch(`${API_BASE}/collab/${encodeURIComponent(modelName)}/comments`, {
        headers: {
            Accept: 'application/json',
            ...getAuthHeader(),
        },
    });

    if (!response.ok) {
        throw new Error(await readError(response));
    }

    const data = await response.json() as CommentsResponse;
    return Array.isArray(data.comments) ? data.comments : [];
}

export async function createComment(modelName: string, body: string): Promise<BackendComment> {
    const response = await fetch(`${API_BASE}/collab/${encodeURIComponent(modelName)}/comments`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            ...getAuthHeader(),
        },
        body: JSON.stringify({ body }),
    });

    if (!response.ok) {
        throw new Error(await readError(response));
    }

    const data = await response.json() as CommentResponse;
    return data.comment;
}

export async function resolveComment(modelName: string, commentId: number): Promise<void> {
    const response = await fetch(
        `${API_BASE}/collab/${encodeURIComponent(modelName)}/comments/${commentId}/resolve`,
        {
            method: 'PATCH',
            headers: {
                Accept: 'application/json',
                ...getAuthHeader(),
            },
        },
    );

    if (!response.ok) {
        throw new Error(await readError(response));
    }
}

export async function deleteComment(modelName: string, commentId: number): Promise<void> {
    const response = await fetch(
        `${API_BASE}/collab/${encodeURIComponent(modelName)}/comments/${commentId}`,
        {
            method: 'DELETE',
            headers: {
                Accept: 'application/json',
                ...getAuthHeader(),
            },
        },
    );

    if (!response.ok) {
        throw new Error(await readError(response));
    }
}
