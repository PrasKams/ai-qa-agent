import {useState} from "react";

interface BugAnalysis {
  severity: string;
  reasoning: string;
  suggestedFix: string;
}

 export default function BugAnalyzer() {
    const [description, setDescription] = useState('');
    const [analysis, setAnalysis] = useState<BugAnalysis | null>(null);
    const [loading, setLoading] = useState(false);

    const analyze = async () => {
        setLoading(true);

        try {
            const response = await fetch('http://localhost:8000/api/analyze-bug', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ description})
            });

            const data = await response.json();

            console.log(data.bug_analysis)
            
            setAnalysis(data.bug_analysis);
            
        } catch (error) {
            console.error('Error:', error)
        } finally {
            setLoading(false)
        }
    };

    return (
        <div className="bug_analyzer">

            <h2>Bug Analyzer </h2>
            <textarea
                value={description}
                onChange={e=> setDescription(e.target.value)}
                placeholder="Describe the bug..."
                rows={6}
            />

            <button onClick={analyze} disabled= {loading}>
                {loading ?  'Analysing...': 'Analyse Bug'}
            </button>

            {analysis && (
                <div className="analysis-result">
                    <div className={`severity ${analysis.severity}`}>
                        Severity: {analysis.severity}
                    </div>
                    <div className="reasoning">
                        <strong>Reasoning:</strong>
                        <p>{analysis.reasoning}</p>
                    </div>
                    <div className="fix">
                        <strong>Suggessted Fix:</strong>
                        <p>{analysis.suggestedFix}</p>
                    </div>
                    </div>
            )}
        </div>
    )

 }