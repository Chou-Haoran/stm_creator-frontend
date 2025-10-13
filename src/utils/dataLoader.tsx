
import { BMRGData, TransitionData } from './stateTransition';
import { API_BASE, getAuthHeader } from '../app/auth/api';

/**
 * Loads BMRG data from the JSON file
 */
export async function loadBMRGData(): Promise<BMRGData> {
    try {
        const response = await fetch('/BMRG_Rainforests.json');
        if (!response.ok) {
            throw new Error(`Failed to load data: ${response.status} ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error loading BMRG data:', error);
        throw error;
    }
}

/**
 * Saves the updated BMRG data back to the server
 */
export async function saveBMRGData(data: BMRGData): Promise<boolean> {
    try {
        const res = await fetch(`${API_BASE}/models/save`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeader(),
            },
            body: JSON.stringify(data),
        });
        if (res.status === 401 || res.status === 403) {
            alert('需要具备 Editor/Admin 权限并登录后才能保存到服务器。您当前的账户或游客模式没有权限。');
            return false;
        }
        if (!res.ok) {
            const msg = await safeError(res);
            throw new Error(msg || `Failed to save data: ${res.status} ${res.statusText}`);
        }
        return true;
    } catch (error) {
        console.error('Error saving BMRG data:', error);
        throw error;
    }
}

async function safeError(res: Response): Promise<string | undefined> {
    try {
        const data = await res.json();
        return (data as any)?.error || (data as any)?.message;
    } catch {
        return undefined;
    }
}

/**
 * Updates a specific transition in the BMRG data
 */
export function updateTransition(data: BMRGData, updatedTransition: TransitionData): BMRGData {
    return {
        ...data,
        transitions: data.transitions.map(transition =>
            transition.transition_id === updatedTransition.transition_id
                ? updatedTransition
                : transition
        )
    };
}
