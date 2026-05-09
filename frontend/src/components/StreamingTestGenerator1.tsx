import { useState } from "react";

export default function TestCaseGenerator() {
  const [feature, setFeature] = useState("");
  const [testCases, setTestCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
  
  const generate = async () => {
    if (!feature.trim()) return;

    setLoading(true);
    setTestCases([]);

    try {
      const response = await fetch(
        `${API_URL}/api/generate-test-cases`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ feature }),
        }
      );

      const data = await response.json();
      console.log("API response:", data);

      setTestCases(data.testCases || []);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Format keys nicely (e.g. expected_result → Expected Result)
  const formatKey = (key: string) => {
    return key
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  // 🔹 Handle any type of value (string, array, object)
  const renderValue = (value: any) => {
    if (Array.isArray(value)) {
      return value.join(", ");
    }

    if (typeof value === "object" && value !== null) {
      return (
        <div style={{ marginLeft: "10px" }}>
          {Object.entries(value).map(([k, v]) => (
            <div key={k}>
              <strong>{formatKey(k)}:</strong> {String(v)}
            </div>
          ))}
        </div>
      );
    }

    return String(value);
  };

  return (
    <div className="container">
      <h2>Test Case Generator</h2>

      <textarea
        value={feature}
        onChange={(e) => setFeature(e.target.value)}
        placeholder="Enter feature (e.g. password reset, login, payments...)"
        rows={3}
        disabled={loading}
      />

      <button onClick={generate} disabled={loading || !feature.trim()}>
        {loading ? "Generating..." : "Generate Test Cases"}
      </button>

      {/* 🔹 Output */}
      <div className="output">
        {testCases.length === 0 && !loading && (
          <p>No test cases yet</p>
        )}

        {testCases.map((tc, index) => (
          <div key={index} className="card">
            <h3>Test Case {index + 1}</h3>

            {Object.entries(tc).map(([key, value]) => (
              <div key={key} className="field">
                <strong>{formatKey(key)}:</strong>{" "}
                {renderValue(value)}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}