import { ErrorBoundary } from './components/ErrorBoundary';
import Navigation from './components/Navigation';
import './App.css';
import StreamingChat1 from './components/StreamingChat1';
import StreamingTestGenerator1 from './components/StreamingTestGenerator1';
import BugTriage from './components/BugAnalyzer';
import { useState } from 'react';

type Page ='chat' | 'test-generator' | 'bug-triage';
 
export default function App() {

  const [currentPage, setCurrentPage] = useState<Page>('chat')

  const renderPage =() =>{
    switch (currentPage) {
      case 'chat': return <StreamingChat1 />;
      case 'test-generator': return <StreamingTestGenerator1 />;
      case 'bug-triage': return <BugTriage />
    }
  };

  return (
    <ErrorBoundary>
      <div className="app">
        <header>
          <h1>🤖 QA AI Assistant</h1>
          <p>Production-Ready AI Tools with Streaming</p>
        </header>
        <Navigation
          currentPage={currentPage}
          onNavigate={setCurrentPage}
        />
        <main className="page-content">
          {renderPage()}
        </main>
 
        <footer>
          <p>Powered by FastAPI + React + OpenAI</p>
        </footer>
      </div>
    </ErrorBoundary>
  );
}