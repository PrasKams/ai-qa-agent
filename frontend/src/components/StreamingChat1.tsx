import { useEffect, useRef, useState } from "react"



interface Message {
    role: 'user' | 'assistant';
    content: string;
}

export default function StreamingChat1 () {
    const [ messages, setMessages ] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [streaming, setStreaming] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    // const API_URL = 'https://qa-ai-backend-puww.onrender.com';

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth'});
    }, [messages]);

    const sendMessage = async () =>{
        if (!input.trim() || streaming) return;
    
        const userMessage: Message = {role : 'user', content: input};
        setMessages(prev => [...prev, userMessage]);
        const currentInput = input;
        setInput('');
        setStreaming(true);

        setMessages(prev => [...prev, { role: 'assistant', content: ''}]);
        
        try {
            const response = await fetch(`${API_URL}/api/chat`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ message: currentInput})
            });

            console.log('Response body:', response.body);

            const data = await response.json();
            console.log('Response data:', data);

            setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                    role: 'assistant',
                    content: data.response
                };
                    return updated;
                });

            
        } catch (error) {
            console.error('Streaming error:', error);
        } finally {
            setStreaming(false);
        }
        };

    return (
        <div className="streaming-chat">
            <h2>Streaming Chat</h2>

            <div className="messages">
                {messages.map((msg, idx) => (
                    <div key={idx} className={`message ${msg.role}`}>
                        <strong>{msg.role}:</strong>
                        <div className="content"> {msg.content}</div>
                        {msg.role === 'assistant' && streaming && idx === messages.length -1 && (
                            <span className="cursor">▊</span>
                        )}
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            <div className=" input-area">
                <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !streaming && sendMessage()}
                placeholder="Type message..."
                disabled= {streaming}
            />
            <button onClick={sendMessage} disabled= {streaming || !input.trim()}>
                {streaming ? 'streaming...' : 'Send'}
            </button>
            </div>
        </div>
    );
}