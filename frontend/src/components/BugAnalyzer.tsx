import React, { useState } from 'react';

interface TriageResult {
  severity: string;
  priority: string;
  analysis: string;
  recommended_team: string;
  suggested_fix: string;
}

const SEVERITY_COLORS: Record<string, string> = {
  P0: '#dc3545',
  P1: '#fd7e14',
  P2: '#ffc107',
  P3: '#28a745'
};

export default function BugTriage() {
  const [form, setForm] = useState({
    title: '',
    description: '',
    environment: '',
    impact: ''
  });
  const [result, setResult] = useState<TriageResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async () => {
    if (!form.title || !form.description) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(`${API_URL}/api/triage-bug`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });

      if (!response.ok) {
        throw new Error('Triage failed');
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError('Failed to triage bug. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    const level = Object.keys(SEVERITY_COLORS).find(k => severity.includes(k));
    return level ? SEVERITY_COLORS[level] : '#6c757d';
  };

  return (
    <div className="bug-triage">
      <h2>🐛 Bug Triage AI</h2>
      <p className="subtitle">AI-powered bug classification and routing</p>

      <div className="form-grid">
        <div className="form-group">
          <label>Bug Title *</label>
          <input
            type="text"
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="App crashes on payment submission"
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label>Environment</label>
          <input
            type="text"
            name="environment"
            value={form.environment}
            onChange={handleChange}
            placeholder="iOS 17, Production"
            disabled={loading}
          />
        </div>

        <div className="form-group full-width">
          <label>Description *</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Describe the bug in detail..."
            rows={4}
            disabled={loading}
          />
        </div>

        <div className="form-group full-width">
          <label>Impact</label>
          <input
            type="text"
            name="impact"
            value={form.impact}
            onChange={handleChange}
            placeholder="All users affected, 100% failure rate"
            disabled={loading}
          />
        </div>
      </div>

      <button
        className="submit-btn"
        onClick={handleSubmit}
        disabled={loading || !form.title || !form.description}
      >
        {loading ? '🤖 Analyzing...' : '🔍 Triage Bug'}
      </button>

      {error && <div className="error">⚠️ {error}</div>}

      {result && (
        <div className="triage-result">
          <h3>Triage Results</h3>

          <div className="result-grid">
            <div
              className="result-card severity-card"
              style={{ borderColor: getSeverityColor(result.severity) }}
            >
              <span className="label">Severity</span>
              <span
                className="value"
                style={{ color: getSeverityColor(result.severity) }}
              >
                {result.severity}
              </span>
            </div>

            <div className="result-card">
              <span className="label">Priority</span>
              <span className="value">{result.priority}</span>
            </div>

            <div className="result-card full-width">
              <span className="label">Recommended Team</span>
              <span className="value">{result.recommended_team}</span>
            </div>

            <div className="result-card full-width">
              <span className="label">Analysis</span>
              <p className="analysis">{result.analysis}</p>
            </div>

            <div className="result-card full-width">
              <span className="label">Suggested Fix</span>
              <p className="analysis">{result.suggested_fix}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}