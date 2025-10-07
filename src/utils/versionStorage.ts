import { GraphModelVersion } from '../app/types';

const STORAGE_KEY = 'stmCreator.versions';

function hasLocalStorage(): boolean {
    try {
        return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
    } catch {
        return false;
    }
}

export function loadVersions(): GraphModelVersion[] {
    if (!hasLocalStorage()) {
        return [];
    }

    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
        return [];
    }

    try {
        const parsed = JSON.parse(raw) as GraphModelVersion[];
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        console.error('Failed to parse stored versions', error);
        return [];
    }
}

export function persistVersions(versions: GraphModelVersion[]): void {
    if (!hasLocalStorage()) {
        return;
    }

    try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(versions));
    } catch (error) {
        console.error('Failed to store versions', error);
    }
}

export function saveVersion(version: GraphModelVersion): GraphModelVersion[] {
    const versions = loadVersions();
    const next = [version, ...versions].slice(0, 50);
    persistVersions(next);
    return next;
}

export function deleteVersion(id: string): GraphModelVersion[] {
    const versions = loadVersions().filter((item) => item.id !== id);
    persistVersions(versions);
    return versions;
}

export function clearVersions(): void {
    if (!hasLocalStorage()) {
        return;
    }
    window.localStorage.removeItem(STORAGE_KEY);
}
