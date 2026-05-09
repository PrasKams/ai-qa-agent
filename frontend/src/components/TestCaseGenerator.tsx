import {useState} from "react";


interface TestCase {
    id: number;
    description: string;
    type: 'positive'| 'negative' | 'edge'
}



export default function TestCaseGenerator() {
    const [feature, setFeature] = useState('');
    const [testCases, setTestCases] = useState<TestCase[]>([]);
    const [loading, setLoading] = useState(false)

    const generate = async () => {
        setLoading(true);

        try {
            const response = await fetch('http://localhost:8000/api/generate-test-cases',{
                method: 'POST',
                headers: {'Content-Type': 'application/json' },
                body: JSON.stringify({ feature })
            });

            const data = await response.json();

           if (Array.isArray(data.testCases)) {
                setTestCases(data.testCases);
            } else {
                console.error("Unexpected format:", data.testCases);
            }
        } catch (error) {
            console.error('Error:', error)
        } finally {
            setLoading(false)
        }
    };


    return (
        <div className="test-generator">
            <h2>AI Test Case Generator</h2>

            <textarea
                value={feature}
                onChange={e=> setFeature(e.target.value)}
                placeholder="Describe the feature to test..."
                rows={4}
            />
            <button onClick={generate} disabled={loading}>
                {loading ? 'Generating...' : 'Generate Test Cases'}
            </button>

            <div className="test-cases">
        {testCases.map(tc => (
          <div key={tc.id} className={`test-case ${tc.type}`}>
            <span className="badge">{tc.type}</span>
            <p>{tc.description}</p>
          </div>
        ))}
        </div>
    </div>
  );
};
