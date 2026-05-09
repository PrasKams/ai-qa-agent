import { useState } from 'react';
import  './StreamingTestGenerator.css'
import { parseSSEStream } from './parseSSEStream';
 
export default function StreamingTestGenerator() {
  const [feature, setFeature] = useState('');
  const [testCases, setTestCases] = useState('');
  const [streaming, setStreaming] = useState(false);
 
  const generate = async () => {
    setTestCases('');
    setStreaming(true);
 
    try {
      const response = await fetch('http://localhost:8000/api/stream-test-cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feature })
      });
 
      const reader = response.body?.getReader();
      await parseSSEStream({
        reader: reader!,
        onMessage: (data) => {
            if (!data?.token) return;
            setTestCases(prev => prev + data.token);
        },
        onDone: () => setStreaming(false),
        onError: (err) => console.error(err)

      });
      
 
    
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setStreaming(false);
    }
  };
 
  return (
    <div className="streaming-generator">
      <h2>Streaming Test Generator</h2>
      
      <textarea
        value={feature}
        onChange={e => setFeature(e.target.value)}
        placeholder="Describe feature..."
        rows={3}
        disabled={streaming}
      />
      
      <button onClick={generate} disabled={streaming}>
        {streaming ? 'Generating...' : 'Generate'}
      </button>
 
      <div className="output">
        <pre className="output">{testCases}</pre>
        {streaming && <span className="cursor">▊</span>}
      </div>
    </div>
  );
}