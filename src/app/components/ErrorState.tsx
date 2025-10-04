
interface ErrorStateProps {
    message: string;
    onRetry: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
    return (
        <div className="error-container">
            <div className="error-title">Error</div>
            <div>{message}</div>
            <button onClick={onRetry} className="error-button">
                Retry
            </button>
        </div>
    );
}
