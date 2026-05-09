import { useState } from "react";

interface UseAIOptions {
    endpoint: string;
    onSuccess?:(data: any) => void;
    onError?: (error: Error) =>void;
}

export function useAI({ onSuccess, onError}: UseAIOptions) {
    const [ loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const [ data, setData ] = useState<any>(null);

    const execute = async(payload: any) => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch('http://localhost:8000${endpoint}', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if(!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Request failed');
            }
            const result = await response.json();
            setData(result)
            onSuccess?.(result);

            return result;
        } catch (err) {
            const error = err as Error;
            setError(error);
            onError?.(error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const reset = () => {
        setError(null);
        setData(null);
    };

    return { execute, loading, error, data, reset };

}