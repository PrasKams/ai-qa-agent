type SSEOptions ={
    reader: ReadableStreamDefaultReader<Uint8Array>;
    onMessage: (data: any) => void;
    onDone?: () => void;
    onError?: (err: unknown) => void
};

export async function parseSSEStream({
    reader,
    onMessage,
    onDone,
    onError
}: SSEOptions) {
    const decoder = new TextDecoder();
    let buffer ='';

    try{
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, {stream: true});

            const parts = buffer.split('\n\n');
            buffer = parts.pop() || '';

            for (const part of parts) {
                if (!part.startsWith('data: ')) continue;

                const content = part.slice(6).trim();

                if (content === '[DONE]') {
                    onDone?.();
                    return;
                }

                try {
                    const parsed = JSON.parse(content);
                    onMessage(parsed);
                } catch (err) {
                    onError?.(err);
                    console.error('Invalid JSON chunk: ', content);
                }
            }
        }
    } catch (err) {
        onError?.(err);
    }
}
    
