import { ErrorBoundary } from './components/ErrorBoundary';

import './App.css';
import StreamingChat1 from './components/StreamingChat1';
import StreamingTestGenerator1 from './components/StreamingTestGenerator1';
 
export default function App() {
  return (
    <ErrorBoundary>
      <div className="app">
        <header>
          <h1>🤖 QA AI Assistant</h1>
          <p>Production-Ready AI Tools with Streaming</p>
        </header>
 
        <main className="dashboard">
          <section>
            <StreamingChat1 />
          </section>
          
          <section>
            <StreamingTestGenerator1 />
          </section>
        </main>
 
        <footer>
          <p>Powered by FastAPI + React + OpenAI</p>
        </footer>
      </div>
    </ErrorBoundary>
  );
}