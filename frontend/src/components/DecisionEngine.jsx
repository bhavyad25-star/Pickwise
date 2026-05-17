import React, { useState, useEffect } from 'react';
import { 
  Sliders, Plus, Trash2, Brain, Film, Sparkles, Scale, AlertTriangle, CheckCircle 
} from 'lucide-react';

const INITIAL_CRITERIA = [
  { id: 'entertainment', name: 'Entertainment Value', weight: 0.35, description: 'Fun factor and pure enjoyment' },
  { id: 'pacing', name: 'Pacing & Engagement', weight: 0.25, description: 'How well it holds attention' },
  { id: 'critics', name: 'Critical Performance', weight: 0.20, description: 'Directing, acting, and script quality' },
  { id: 're-watch', name: 'Re-watchability', weight: 0.20, description: 'Would you watch this again?' }
];

export default function DecisionEngine() {
  const [options, setOptions] = useState([]);
  const [newOptionName, setNewOptionName] = useState('');
  const [loadingOptionId, setLoadingOptionId] = useState(null);
  
  // Dynamic Real-Time Core Weights State (Whole numbers 0-100 for easy slider control)
  const [dynamicWeights, setDynamicWeights] = useState({
    entertainment: 35,
    pacing: 25,
    critics: 20,
    're-watch': 20
  });

  // Calculate if sliders equal 100% combined
  const totalWeightSum = Object.values(dynamicWeights).reduce((sum, val) => sum + (val || 0), 0);
  const isWeightMatrixValid = totalWeightSum === 100;

  const handleWeightSliderChange = (id, value) => {
    setDynamicWeights(prev => ({
      ...prev,
      [id]: parseInt(value) || 0
    }));
  };

  // Resilient Fetch with automated retry logic to handle Render cold-starts
  const fetchWithRetry = async (url, options, retries = 3, delay = 4000) => {
    for (let i = 0; i < retries; i++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 25000); // 25 second extended window

        const response = await fetch(url, { ...options, signal: controller.signal });
        clearTimeout(timeoutId);
        
        if (response.ok) return await response.json();
      } catch (err) {
        console.log(`Connection attempt ${i + 1} paused/sleeping. Retrying in ${delay}ms...`);
        if (i === retries - 1) throw err;
        await new Promise(res => setTimeout(res, delay));
      }
    }
  };

  const handleAddOption = async (e) => {
    e.preventDefault();
    if (!newOptionName.trim() || !isWeightMatrixValid) return;

    const temporaryId = Date.now().toString();
    const targetName = newOptionName.trim();
    
    const newOptionItem = {
      id: temporaryId,
      name: targetName,
      scores: { entertainment: 50, pacing: 50, critics: 50, 're-watch': 50 },
      aiAnalysis: null
    };

    setOptions(prev => [newOptionItem, ...prev]); // Prepend to show new items on top of the list
    setNewOptionName('');
    setLoadingOptionId(temporaryId);

    try {
      const data = await fetchWithRetry('https://pickwise-zkt8.onrender.com/ask-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          optionName: targetName,
          domainContext: "Movie Choices",
          criteriaList: INITIAL_CRITERIA.map(c => `${c.name} (${c.description})`)
        })
      });

      setOptions(prev => prev.map(opt => {
        if (opt.id === temporaryId) {
          return {
            ...opt,
            aiAnalysis: data.analysis,
            scores: data.suggestedScores || opt.scores
          };
        }
        return opt;
      }));
    } catch (error) {
      setOptions(prev => prev.map(opt => {
        if (opt.id === temporaryId) {
          return { 
            ...opt, 
            aiAnalysis: "Backend service waking up. Pulling standard manual assessment layers below instead." 
          };
        }
        return opt;
      }));
    } {
      setLoadingOptionId(null);
    }
  };

  const handleItemSliderChange = (optionId, criteriaId, value) => {
    setOptions(prev => prev.map(opt => {
      if (opt.id === optionId) {
        return {
          ...opt,
          scores: { ...opt.scores, [criteriaId]: parseInt(value) }
        };
      }
      return opt;
    }));
  };

  const calculateFinalScore = (optionScores) => {
    let totalScore = 0;
    INITIAL_CRITERIA.forEach(c => {
      const sliderValue = optionScores[c.id] || 0;
      const adaptiveWeightPercentage = (dynamicWeights[c.id] || 0) / 100;
      totalScore += (sliderValue * adaptiveWeightPercentage);
    });
    return Math.round(totalScore);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans">
      <div className="max-w-3xl mx-auto space-y-8">
        
        {/* Top Branding Header */}
        <header className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 text-cyan-400 font-bold tracking-wider uppercase text-xs bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20">
            <Sparkles size={12} />
            <span>PickWise Match Matrix Engine</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight bg-gradient-to-b from-white to-slate-400 bg-clip-text text-transparent">
            Movie Choices Engine
          </h1>
          <p className="text-slate-400 text-sm max-w-md mx-auto">
            Evaluate what to watch based on your custom interest weights and genre metrics.
          </p>
        </header>

        {/* 1. TOP ADD BOX INPUT CONTROL */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <form onSubmit={handleAddOption} className="space-y-3">
            <label className="block text-xs font-bold tracking-widest text-slate-400 uppercase pl-1">
              Add New Movie Target
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newOptionName}
                disabled={!isWeightMatrixValid}
                onChange={(e) => setNewOptionName(e.target.value)}
                placeholder={!isWeightMatrixValid ? "Balance weights to unlock entry portal..." : "Enter movie title (e.g., Inception, Interstellar)..."}
                className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 w-full text-slate-200 placeholder:text-slate-600 disabled:opacity-40"
              />
              <button
                type="submit"
                disabled={!isWeightMatrixValid}
                className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 px-5 rounded-xl transition-all font-bold flex items-center justify-center disabled:opacity-40"
              >
                <Plus size={20} />
              </button>
            </div>
          </form>
        </div>

        {/* 2. CRITERIA DYNAMIC ALLOCATION WEIGHT SLIDERS (BELOW INPUT BOX) */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
            <h2 className="text-sm font-bold tracking-wider text-slate-200 flex items-center gap-2">
              <Scale size={16} className="text-cyan-400" />
              <span>Configure Genre / Criteria Matching Weights</span>
            </h2>
          </div>

          {/* Validation Banner Indicator */}
          <div className={`mb-5 p-3 rounded-xl border flex items-center gap-3 text-xs font-medium ${
            isWeightMatrixValid 
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
              : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
          }`}>
            {isWeightMatrixValid ? <CheckCircle size={15} /> : <AlertTriangle size={15} />}
            <p>
              Current Slider Balance Pool Sum: <span className="font-mono font-bold text-sm underline">{totalWeightSum}%</span> (Must equal exactly 100%)
            </p>
          </div>

          {/* Core Allocation Weights Sliders */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {INITIAL_CRITERIA.map((c) => {
              const currentVal = dynamicWeights[c.id] || 0;
              return (
                <div key={c.id} className="bg-slate-950/60 rounded-xl p-3 border border-slate-800/60 space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-300">{c.name}</span>
                    <span className="text-cyan-400 font-mono font-bold bg-slate-900 px-2 py-0.5 rounded border border-slate-800">{currentVal}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={currentVal}
                    onChange={(e) => handleWeightSliderChange(c.id, e.target.value)}
                    className="w-full h-1 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. LIVE MATCH OUTPUT CARDS LIST */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold tracking-widest text-slate-500 uppercase pl-1">
            Evaluated Matching Results List
          </h2>

          {options.length === 0 ? (
            <div className="border border-dashed border-slate-800 rounded-2xl p-10 text-center text-slate-600 flex flex-col items-center justify-center gap-2">
              <Film size={28} className="text-slate-700" />
              <p className="text-xs max-w-xs">
                No active targets listed. Add a title up top to review calculations.
              </p>
            </div>
          ) : (
            options.map((opt) => {
              const matchValue = calculateFinalScore(opt.scores);
              const isItemLoading = loadingOptionId === opt.id;

              return (
                <div key={opt.id} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4 transition-all">
                  
                  {/* Top Heading Box Metrics */}
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <h3 className="text-lg font-bold text-white tracking-tight">{opt.name}</h3>
                      <p className="text-[11px] text-slate-500 font-mono mt-0.5">Matching Matrix Profile Matrix Active</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="block text-[9px] font-bold tracking-widest text-slate-500 uppercase">
                          MATCH INDEX
                        </span>
                        <span className={`text-xl font-black font-mono ${
                          isWeightMatrixValid ? 'text-cyan-400' : 'text-rose-500/40 line-through'
                        }`}>
                          {isWeightMatrixValid ? `${matchValue}%` : 'ERR%'}
                        </span>
                      </div>
                      <button
                        onClick={() => setOptions(prev => prev.filter(o => o.id !== opt.id))}
                        className="text-slate-600 hover:text-rose-400 p-2 rounded-lg hover:bg-rose-500/10 transition-colors"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  {/* Gemini Response Block Container */}
                  <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-3.5">
                    <div className="flex items-center gap-2 text-cyan-400/90 text-[10px] font-bold uppercase tracking-wider mb-1.5">
                      <Brain size={12} className={isItemLoading ? "animate-pulse" : ""} />
                      <span>Gemini AI Cognitive Assessment Profile</span>
                    </div>
                    {isItemLoading ? (
                      <div className="flex items-center gap-2 text-slate-500 text-xs py-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" />
                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.2s]" />
                        <span className="text-[11px]">Connecting neural pipeline vectors...</span>
                      </div>
                    ) : (
                      <p className="text-slate-300 text-xs leading-relaxed">
                        {opt.aiAnalysis || "Manual assessment overrides active below."}
                      </p>
                    )}
                  </div>

                  {/* Movie Item Adjuster Sliders */}
                  <div className="space-y-3 pt-1 border-t border-slate-800/40">
                    {INITIAL_CRITERIA.map((c) => {
                      const value = opt.scores[c.id] || 0;
                      return (
                        <div key={c.id} className="space-y-1">
                          <div className="flex justify-between items-center text-[11px]">
                            <span className="text-slate-400 font-medium">{c.name}</span>
                            <span className="font-mono text-slate-300 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                              {value}%
                            </span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={value}
                            onChange={(e) => handleItemSliderChange(opt.id, c.id, e.target.value)}
                            className="w-full h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                          />
                        </div>
                      );
                    })}
                  </div>

                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
}