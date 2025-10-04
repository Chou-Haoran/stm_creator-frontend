
import { BMRGData, TransitionData } from './stateTransition';

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
        // In a real application, this would make a POST/PUT request to your backend
        // For demonstration purposes, we'll just log the data
        console.log('Saving model data:', data);
        alert('In a real application, this would save the data to the server. The model has been "saved" successfully!');

        // Here's what the actual server request would look like:
        // const response = await fetch('/api/save-bmrg-data', {
        //   method: 'POST',
        //   headers: {
        //     'Content-Type': 'application/json',
        //   },
        //   body: JSON.stringify(data),
        // });

        // if (!response.ok) {
        //   throw new Error(`Failed to save data: ${response.status} ${response.statusText}`);
        // }

        // return await response.json();

        return true;
    } catch (error) {
        console.error('Error saving BMRG data:', error);
        throw error;
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