import {useState, useEffect, useRef} from "react";
import  './StreamingTestGenerator.css'
import { parseSSEStream } from "./parseSSEStream";

interface Message {
    role: 'user' | 'assistant';
    content: string
}

export default function StreamingChat() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [streaming, setStreaming] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null);


    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({behavior: 'smooth'});
    };

    useEffect(() => {
        scrollToBottom();
    },[messages]);

    const sendMessage = async () => {
        if (!input.trim()) return;

        const userMessage: Message = {role : 'user', content: input}

        setMessages(prev => [...prev, userMessage])
        setInput('')
        setStreaming(true)

        
        setMessages(prev => [...prev, { role: 'assistant', content: ''}])
        
        try{
            const response = await fetch('http://localhost:8000/api/stream-chat', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ message: input})
            });

            const reader = response.body?.getReader();

            await parseSSEStream({
                reader: reader!,
                onMessage: (data) => {
                    setMessages(prev => {
                        const updated = [...prev];
                        updated[updated.length - 1] = {
                            ...updated[updated.length - 1],
                            content:
                            updated[updated.length - 1].content + data.token
                        };
                        return updated;
                    });
                }
            })


        } catch (error) {
            console.error('Error:', error);
        } finally {
            setStreaming(false)
        }
    };


    return (
        <div className="streaming-chat">
            <h2>Streaming AI chat</h2>

            <div>
                {messages.map((msg, idx) => (
                    <div key={idx} className={`message ${msg.role}`}>
                        <strong>{msg.role}</strong>
                        <div className="content">{msg.content}</div>
                            {msg.role === 'assistant' && streaming && idx === messages.length -1 && (
                            <span className="cursor">▊</span>
                            )}
                        </div>
                    ))}
                    <div ref = {messagesEndRef} />
            </div>

            <div className=" input-area">
                <input 
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !streaming && sendMessage()}
                    placeholder="Type your Message..."
                    disabled = {streaming}
                />
                <button onClick={sendMessage} disabled ={streaming}>
                    {streaming ? 'Streaming...' : 'Send'}
                </button>
            </div>
        </div>
    )
}