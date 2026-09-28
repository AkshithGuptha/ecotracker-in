import { useState } from "react";

export default function Survey() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchSurvey = async () => {
    setLoading(true);
    const res = await fetch("/api/surveys/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic: "daily lifestyle habits" }),
    });

    const data = await res.json();
    setQuestions(JSON.parse(data.questions)); // API returns text → parse JSON
    setLoading(false);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Carbon Footprint Survey</h1>
      <button
        onClick={fetchSurvey}
        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
      >
        {loading ? "Generating..." : "Generate Survey"}
      </button>

      <div className="mt-6 space-y-4">
        {questions.map((q, i) => (
          <div key={i} className="p-4 border rounded-lg shadow-sm">
            <p className="font-medium">{q.question}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
