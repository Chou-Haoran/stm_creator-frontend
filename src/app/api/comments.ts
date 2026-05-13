import { API_BASE, apiFetch } from '../auth/api';

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
    total: number;
    limit: number;
    offset: number;
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

export const getComments = async (
    modelName: string,
    limit = 50,
    offset = 0,
): Promise<{ comments: BackendComment[]; total: number; limit: number; offset: number }> => {
    const response = await apiFetch(
        `${API_BASE}/collab/${encodeURIComponent(modelName)}/comments?limit=${limit}&offset=${offset}`,
        {
        headers: {
            Accept: 'application/json',
        },
        },
    );

    if (!response.ok) {
        throw new Error(await readError(response));
    }

    const data = await response.json() as CommentsResponse;
    return {
        comments: Array.isArray(data.comments) ? data.comments : [],
        total: typeof data.total === 'number' ? data.total : data.comments.length,
        limit: typeof data.limit === 'number' ? data.limit : limit,
        offset: typeof data.offset === 'number' ? data.offset : offset,
    };
};

export async function fetchComments(modelName: string): Promise<BackendComment[]> {
    const data = await getComments(modelName);
    return data.comments;
}

export async function createComment(modelName: string, body: string): Promise<BackendComment> {
    const response = await apiFetch(`${API_BASE}/collab/${encodeURIComponent(modelName)}/comments`, {
        method: 'POST',
        headers: {
            Accept: 'application/json',
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
    const response = await apiFetch(
        `${API_BASE}/collab/${encodeURIComponent(modelName)}/comments/${commentId}/resolve`,
        {
            method: 'PATCH',
            headers: {
                Accept: 'application/json',
            },
        },
    );

    if (!response.ok) {
        throw new Error(await readError(response));
    }
}

export async function deleteComment(modelName: string, commentId: number): Promise<void> {
    const response = await apiFetch(
        `${API_BASE}/collab/${encodeURIComponent(modelName)}/comments/${commentId}`,
        {
            method: 'DELETE',
            headers: {
                Accept: 'application/json',
            },
        },
    );

    if (!response.ok) {
        throw new Error(await readError(response));
    }
}
