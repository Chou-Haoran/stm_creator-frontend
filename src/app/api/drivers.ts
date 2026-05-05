import { API_BASE, getAuthHeader } from '../auth/api';

export interface DriverSearchResult {
    id: number;
    name: string;
    description: string | null;
    driver_group: string | null;
}

async function readError(response: Response): Promise<string> {
    try {
        const data = await response.json() as { error?: unknown; message?: unknown };
        const message = data.error ?? data.message;
        return typeof message === 'string' ? message : `Driver search failed (${response.status})`;
    } catch {
        return `Driver search failed (${response.status})`;
    }
}

export async function searchDrivers(
    query: string,
    options: { limit?: number; signal?: AbortSignal } = {},
): Promise<DriverSearchResult[]> {
    const params = new URLSearchParams({
        q: query,
        limit: String(options.limit ?? 12),
    });

    const response = await fetch(`${API_BASE}/drivers/search?${params.toString()}`, {
        headers: {
            Accept: 'application/json',
            ...getAuthHeader(),
        },
        signal: options.signal,
    });

    if (!response.ok) {
        throw new Error(await readError(response));
    }

    const data = await response.json() as unknown;
    return Array.isArray(data) ? data as DriverSearchResult[] : [];
}
