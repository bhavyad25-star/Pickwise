import React, { useState } from 'react';

export default function DecisionEngine() {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchRecs = async () => {
    setLoading(true);
    try {
      const response = await fetch('https://pickwise-zkt8.onrender.com/ask-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: "Movies" })
      });
      const data = await response.json();
      setRecommendations(data.recommendedItems || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-10 bg-slate-950 text-white min-h-screen">
      <button onClick={fetchRecs} className="bg-cyan-600 px-6 py-3 rounded-xl font-bold">
        {loading ? "Loading..." : "Get Recommendations"}
      </button>
      <div className="mt-6 space-y-4">
        {recommendations.map((item, i) => (
          <div key={i} className="p-4 border border-slate-700 rounded-lg">
            <h3 className="font-bold text-lg">{item.title}</h3>
            <p className="text-slate-400">{item.reason}</p>
          </div>
        ))}
      </div>
    </div>
  );
}