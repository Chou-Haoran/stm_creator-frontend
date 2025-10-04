
interface LoadingStateProps {
    message?: string;
}

export function LoadingState({ message = 'Loading State Transition Model...' }: LoadingStateProps) {
    return (
        <div className="loading-container">
            <div className="loading-text">{message}</div>
            <div className="loading-spinner"></div>
        </div>
    );
}
