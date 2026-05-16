import React, { useState } from 'react';

const DecisionEngine = () => {
  const [options, setOptions] = useState([]);
  const [history, setHistory] = useState([]);
  const [category, setCategory] = useState('food');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  // Initializing weights state for all criteria mappings across all categories
  const [weights, setWeights] = useState({ 
    price: 5, health: 5, taste: 5, protein: 5, hygiene: 5,
    action: 5, romance: 5, thriller: 5, fantasy: 5, comedy: 5, drama: 5, horror: 5, sciFi: 5,
    weather: 5, safety: 5, adventure: 5, distanceFromIndia: 5, nightlife: 5, relaxation: 5,
    staminaIntensity: 5, teamwork: 5, equipmentCost: 5, injuryRisk: 5, fun: 5, popularity: 5,
    vibe: 5, music: 5, crowd: 5
  });

  // Complete, expanded categories structure mapping
  const criteriaMap = {
    food: ["price", "health", "taste", "protein", "hygiene"],
    movie: ["action", "romance", "thriller", "fantasy", "comedy", "drama", "horror", "sciFi"],
    vacation: ["price", "weather", "safety", "adventure", "distanceFromIndia", "nightlife", "relaxation"],
    sports: ["staminaIntensity", "teamwork", "equipmentCost", "injuryRisk", "fun", "popularity"],
    nightout: ["vibe", "music", "crowd", "price", "safety"]
  };

  const addOption = async () => {
    if (!input.trim()) return;

    // Duplicate Prevention validation filter check
    const alreadyExists = options.some(
      o =>
        o.name.toLowerCase() === input.trim().toLowerCase() &&
        o.category === category
    );

    if (alreadyExists) {
      alert("Option already added to this configuration matrix!");
      return;
    }

    setLoading(true);
    
    try {
      // BINDED TO YOUR LAPTOP NETWORK IP FOR WSL/MOBILE DISCOVERY
      const res = await fetch('http://192.168.1.21:5000/ask-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemName: input.trim(), category })
      });
      
      const data = await res.json();

      if (data && data.scores) {
        const structuralEntry = {
          id: Date.now(),
          name: input.trim(),
          category: category, 
          scores: data.scores
        };
        setOptions(prev => [...prev, structuralEntry]);
      }
      setInput('');
    } catch (err) {
      console.error("Critical transmission pipeline disruption:", err);
    } finally {
      setLoading(false);
    }
  };

  // --- REWIRED LINEAR WEIGHTED RECOMMENDATION ENGINE ---
  const getRankings = () => {
    const activeGroup = options.filter(o => o.category === category);

    if (activeGroup.length === 0) return [];

    const currentCriteria = criteriaMap[category];

    // Calculate weighted scores
    const ranked = activeGroup.map(option => {
      let total = 0;

      currentCriteria.forEach(criteria => {
        const aiScore = Number(option.scores?.[criteria] || 5);
        const userWeight = Number(weights?.[criteria] || 5);

        // Weighted Recommendation Engine Logic Formula
        total += aiScore * userWeight;
      });

      // AI EXPLANATION ENGINE INSIGHT EXTRACTION
      const strongest = currentCriteria.reduce((best, curr) =>
        Number(option.scores?.[curr] || 5) > Number(option.scores?.[best] || 5) ? curr : best
      );

      const weakest = currentCriteria.reduce((worst, curr) =>
        Number(option.scores?.[curr] || 5) < Number(option.scores?.[worst] || 5) ? curr : worst
      );

      return {
        ...option,
        rawScore: total,
        strongest,
        weakest
      };
    });

    // Total score calculation pool
    const pool = ranked.reduce((sum, item) => sum + item.rawScore, 0);

    // Normalize value tracking allocations to percentages
    const normalized = ranked.map(item => ({
      ...item,
      percentage:
        pool > 0
          ? Number(((item.rawScore / pool) * 100).toFixed(1))
          : 0
    }));

    // Rounding optimization handler to anchor matrix total strictly at 100%
    const totalPercent = normalized.reduce((sum, item) => sum + item.percentage, 0);
    const difference = Number((100 - totalPercent).toFixed(1));

    if (normalized.length > 0) {
      normalized[0].percentage = Number((normalized[0].percentage + difference).toFixed(1));
    }

    return normalized.sort((a, b) => b.percentage - a.percentage);
  };

  const currentActiveRankings = getRankings();

  return (
    <div className="p-8 bg-[#0f172a] min-h-screen text-white font-sans selection:bg-pink-500/30">
      <div className="max-w-5xl mx-auto">
        
        {/* INTERACTIVE COMPONENT CONTROL HUB */}
        <div className="flex flex-col sm:flex-row gap-4 mb-10 bg-slate-800/40 p-6 rounded-[24px] border border-white/10 shadow-2xl">
          <select 
            value={category} 
            onChange={(e) => setCategory(e.target.value)} 
            className="bg-slate-900 p-4 rounded-xl border border-white/10 outline-none text-sm font-bold text-pink-400 cursor-pointer focus:border-pink-500"
          >
            <option value="food">🍔 Food Options</option>
            <option value="movie">🎬 Movie Choices</option>
            <option value="vacation">✈️ Vacation Packages</option>
            <option value="sports">⚽ Sports Matrix</option>
            <option value="nightout">🌌 Night Out Spots</option>
          </select>
          
          <input 
            className="flex-grow bg-slate-900 p-4 rounded-xl border border-white/10 outline-none text-sm placeholder:text-slate-600 focus:border-pink-500" 
            value={input} 
            onChange={(e) => setInput(e.target.value)} 
            placeholder={`Analyze variant targets inside ${category}...`}
            onKeyDown={(e) => e.key === 'Enter' && addOption()}
          />
          
          <button 
            onClick={addOption} 
            disabled={loading}
            className="bg-pink-600 hover:bg-pink-500 disabled:bg-slate-800 text-white px-10 py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-transform active:scale-95 duration-75"
          >
            {loading ? "FETCHING..." : "ADD OPTION"}
          </button>
        </div>

        {/* METRICS & ANALYSIS MATRIX WORKSPACE split */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          
          {/* TARGET PRIORITY CONTROL SLIDERS */}
          <div className="space-y-6">
            <h3 className="text-pink-500 font-black uppercase text-xs tracking-widest pl-1">Target Priorities</h3>
            {criteriaMap[category].map(metric => (
              <div key={metric} className="bg-slate-800/20 p-5 rounded-2xl border border-white/5 shadow-md">
                <div className="flex justify-between mb-2.5 uppercase text-[11px] font-black tracking-wider text-slate-400">
                  <span className="capitalize">{metric.replace(/([A-Z])/g, ' $1')}</span>
                  <span className="text-pink-500 text-sm">{weights[metric]}</span>
                </div>
                <input 
                  type="range" min="1" max="10" 
                  value={weights[metric]} 
                  className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-pink-500" 
                  onChange={(e) => setWeights({...weights, [metric]: parseInt(e.target.value)})} 
                />
              </div>
            ))}
          </div>

          {/* DYNAMIC METRIC RANKING PANEL */}
          <div className="bg-slate-900/40 p-8 rounded-[32px] border border-white/10 shadow-2xl flex flex-col backdrop-blur-sm">
            <h2 className="text-center font-black text-pink-500 tracking-wider text-sm uppercase mb-6 border-b border-white/5 pb-4">Live Decision Intelligence Matrix</h2>
            
            <div className="space-y-5 flex-grow">
              {/* --- ANIMATED PULSE SKELETON LOADER AND INTERLOCK MODULES --- */}
              {loading ? (
                <div className="text-center py-20 text-pink-400 animate-pulse font-black uppercase tracking-widest text-xs">
                  ⚡ AI Analyzing Decision Vectors...
                </div>
              ) : currentActiveRankings.length > 0 ? (
                currentActiveRankings.map(opt => (
                  <div key={opt.id} className="p-5 bg-slate-800/40 rounded-2xl border border-white/5 group relative transition-colors hover:bg-slate-800/60 shadow-lg">
                    <div className="flex justify-between items-center mb-3">
                      <span className="font-bold text-base text-slate-200 capitalize">{opt.name}</span>
                      <span className="text-2xl font-black text-white">{opt.percentage}%</span>
                    </div>
                    
                    <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-pink-600 to-rose-400 transition-all duration-500" 
                        style={{ width: `${opt.percentage}%` }}
                      ></div>
                    </div>

                    {/* DYNAMIC LOGIC INSIGHT COMPONENT BLOCKS */}
                    <div className="mt-4 pt-3 border-t border-white/5 text-xs font-semibold space-y-1">
                      <p className="text-emerald-400 flex items-center gap-1.5">
                        ✔ Strong in: <span className="capitalize text-slate-300 font-normal">{opt.strongest.replace(/([A-Z])/g, ' $1')}</span>
                      </p>
                      <p className="text-rose-400 flex items-center gap-1.5">
                        ✖ Weak in: <span className="capitalize text-slate-300 font-normal">{opt.weakest.replace(/([A-Z])/g, ' $1')}</span>
                      </p>
                    </div>

                    {/* INTERACTION ACTION BAR ON MOUSE HOVER */}
                    <div className="mt-4 flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                      <button 
                        onClick={() => {
                          setHistory([{ ...opt, timestamp: new Date().toLocaleTimeString() }, ...history]);
                          setOptions(options.filter(o => o.id !== opt.id));
                        }} 
                        className="bg-emerald-600 hover:bg-emerald-500 text-[10px] font-extrabold uppercase px-3 py-1.5 rounded-md tracking-wider transition-colors"
                      >
                        Lock Choice
                      </button>
                      <button 
                        onClick={() => setOptions(options.filter(o => o.id !== opt.id))} 
                        className="bg-rose-600 hover:bg-rose-500 text-[10px] font-extrabold uppercase px-3 py-1.5 rounded-md tracking-wider transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-20 text-slate-500 text-sm italic tracking-wide">
                  No vectors tracking. Add options above to populate.
                </div>
              )}
            </div>
          </div>

        </div>

        {/* HISTORICAL LOG TRACKER EXECUTION CONTAINER */}
        {history.length > 0 && (
          <div className="mt-16 pt-8 border-t border-white/5">
            <h3 className="text-center text-slate-500 font-bold uppercase text-[10px] tracking-[0.25em] mb-6">Execution History Logs</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {history.map((loggedChoice, index) => (
                <div key={index} className="bg-slate-900/60 p-4 rounded-xl border border-white/5 text-center shadow-inner">
                  <span className="text-[9px] font-mono text-slate-500 block mb-1">{loggedChoice.timestamp}</span>
                  <span className="font-extrabold text-pink-400 text-sm capitalize">{loggedChoice.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default DecisionEngine;