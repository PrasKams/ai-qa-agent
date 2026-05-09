import {useState} from "react";

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

export default function ChatBot () {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);

    const sendMessage = async () => {
        if(!input.trim()) return;

        const userMessage: Message = {role: 'user', content: input}
        setMessages(prev => [...prev, userMessage])
        setInput('')
        setLoading(true);

        try {
            const response = await fetch('http://localhost:8000/api/chat', {
                method: 'POST',
                headers: {'content-type': 'application/json'},
                body: JSON.stringify({message: input})
            });

            const data = await response.json();

            const aiMessage: Message = { role: 'assistant', content: data.response };
            console.log(aiMessage);
            setMessages(prev => [...prev, aiMessage]);
        } catch (error) {
            console.error('Error:', error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
        <div className=" chat-container">
            <div className="messages">
                {messages.map((msg, idx) => (
                    <div key={idx} className={`message ${msg.role}`}>
                        <strong>{msg.role}:</strong>{msg.content}
                    </div>
                ))}
                {loading && <div className="loading"> AI is thinking...</div>}
            </div>

        </div>
        
        <div className="input-area">
            <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                placeholder="Ask me anything..."
            />
            <button onClick={sendMessage} disabled={loading}>
                Send
            </button>
        </div>
    </>
    )

}