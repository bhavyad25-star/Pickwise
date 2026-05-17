import React, { useState, useEffect } from 'react';
import { 
  Sliders, Plus, Trash2, Brain, Film, Utensils, Trophy, Briefcase, Sparkles, Scale, AlertTriangle, CheckCircle 
} from 'lucide-react';

// Domain Specific Matching Framework Criteria Matrix Mapping
const DOMAIN_MATRICES = {
  movies: {
    title: "Movie Choices",
    icon: Film,
    description: "Evaluate what to watch based on mood, pacing, and critical elements.",
    criteria: [
      { id: 'entertainment', name: 'Entertainment Value', weight: 0.35, description: 'Fun factor and pure enjoyment' },
      { id: 'pacing', name: 'Pacing & Engagement', weight: 0.25, description: 'How well it holds attention' },
      { id: 'critics', name: 'Critical Performance', weight: 0.20, description: 'Directing, acting, and script quality' },
      { id: 're-watch', name: 'Re-watchability', weight: 0.20, description: 'Would you watch this again?' }
    ]
  },
  food: {
    title: "Food Options",
    icon: Utensils,
    description: "Pick your next meal using budget, health, and convenience metrics.",
    criteria: [
      { id: 'taste', name: 'Taste & Craving', weight: 0.40, description: 'How much you want this specific flavor' },
      { id: 'cost', name: 'Cost Effectiveness', weight: 0.25, description: 'Value for money spent' },
      { id: 'health', name: 'Nutritional Value', weight: 0.20, description: 'Healthiness and fitness goals alignment' },
      { id: 'time', name: 'Preparation Time', weight: 0.15, description: 'Speed of delivery or cooking' }
    ]
  },
  sports: {
    title: "Sports & Workouts",
    icon: Trophy,
    description: "Analyze games or workouts balancing intensity, risk, and recovery.",
    criteria: [
      { id: 'intensity', name: 'Physical Intensity', weight: 0.35, description: 'Cardio and strength workload' },
      { id: 'skill', name: 'Skill Development', weight: 0.30, description: 'Technique and strategy improvement' },
      { id: 'safety', name: 'Injury Risk (Inverse)', weight: 0.20, description: 'Higher means safer / lower risk' },
      { id: 'fun', name: 'Team Play / Fun', weight: 0.15, description: 'Social engagement and pure joy' }
    ]
  },
  career: {
    title: "Career & Projects",
    icon: Briefcase,
    description: "Score professional ventures or side projects dynamically.",
    criteria: [
      { id: 'impact', name: 'Growth & Learning', weight: 0.35, description: 'Skill acquisition and resume value' },
      { id: 'roi', name: 'Financial Return', weight: 0.30, description: 'Potential income or monetization' },
      { id: 'effort', name: 'Feasibility (Inverse)', weight: 0.20, description: 'Higher means easier to build/execute' },
      { id: 'passion', name: 'Personal Interest', weight: 0.15, description: 'How excited you are to build this' }
    ]
  }
};

export default function DecisionEngine() {
  const [activeDomain, setActiveDomain] = useState('movies');
  const [options, setOptions] = useState([]);
  const [newOptionName, setNewOptionName] = useState('');
  const [loadingOptionId, setLoadingOptionId] = useState(null);
  
  // Real-time Dynamic Allocation Weight State Map
  const [dynamicWeights, setDynamicWeights] = useState({});

  const currentMatrix = DOMAIN_MATRICES[activeDomain];

  // Sync state weights smoothly whenever the active category matrix changes
  useEffect(() => {
    const initialWeights = {};
    currentMatrix.criteria.forEach(c => {
      initialWeights[c.id] = c.weight * 100; 
    });
    setDynamicWeights(initialWeights);
    setOptions([]); // Reset temporary list on switch to ensure smooth math calculations
  }, [activeDomain]);

  const totalWeightSum = Object.values(dynamicWeights).reduce((sum, val) => sum + (val || 0), 0);
  const isWeightMatrixValid = totalWeightSum === 100;

  const handleWeightSliderChange = (id, value) => {
    setDynamicWeights(prev => ({
      ...prev,
      [id]: parseInt(value) || 0
    }));
  };

  // Resilient Fetch network interface backplane with automated retry loops for sleeper backends
  const fetchWithRetry = async (url, fetchOptions, retries = 3, delay = 4000) => {
    for (let i = 0; i < retries; i++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 25000);

        const response = await fetch(url, { ...fetchOptions, signal: controller.signal });
        clearTimeout(timeoutId);
        
        if (response.ok) return await response.json();
      } catch (err) {
        console.log(`Connection fallback trace attempt ${i + 1}. Retrying...`);
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
    
    const initialScores = {};
    currentMatrix.criteria.forEach(c => {
      initialScores[c.id] = 50;
    });

    const newOptionItem = {
      id: temporaryId,
      name: targetName,
      scores: initialScores,
      aiAnalysis: null
    };

    setOptions(prev => [newOptionItem, ...prev]); 
    setNewOptionName('');
    setLoadingOptionId(temporaryId);

    try {
      const data = await fetchWithRetry('https://pickwise-zkt8.onrender.com/ask-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          optionName: targetName,
          domainContext: currentMatrix.title,
          criteriaList: currentMatrix.criteria.map(c => `${c.name} (${c.description})`)
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
            aiAnalysis: "Backend cloud module is booting up. Manual evaluation tracking active below." 
          };
        }
        return opt;
      }));
    } finally {
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
    currentMatrix.criteria.forEach(c => {
      const sliderValue = optionScores[c.id] || 0;
      const adaptiveWeightPercentage = (dynamicWeights[c.id] || 0) / 100;
      totalScore += (sliderValue * adaptiveWeightPercentage);
    });
    return Math.round(totalScore);
  };

  const IconComponent = currentMatrix.icon;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Dynamic Navigation Platform Branding */}
        <header className="flex flex-col items-center text-center space-y-3 pb-2">
          <div className="inline-flex items-center gap-2 text-cyan-400 font-bold tracking-wider uppercase text-xs bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20">
            <Sparkles size={12} />
            <span>Linear Weighted AI Decision Matrix</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight bg-gradient-to-b from-white to-slate-400 bg-clip-text text-transparent">
            PickWise Dashboard
          </h1>

          {/* Core App Category Switcher */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 bg-slate-900/80 p-1.5 rounded-xl border border-slate-800/80 w-full">
            {Object.keys(DOMAIN_MATRICES).map((domainKey) => {
              const dom = DOMAIN_MATRICES[domainKey];
              const isSelected = activeDomain === domainKey;
              return (
                <button
                  key={domainKey}
                  type="button"
                  onClick={() => setActiveDomain(domainKey)}
                  className={`flex items-center justify-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 flex-1 md:flex-initial ${
                    isSelected 
                      ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/10' 
                      : 'text-slate-400 hover:bg-slate-950 hover:text-slate-200'
                  }`}
                >
                  <dom.icon size={14} />
                  <span>{dom.title}</span>
                </button>
              );
            })}
          </div>
        </header>

        {/* 1. TOP INPUT ENTRY PORT */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <form onSubmit={handleAddOption} className="space-y-3">
            <label className="block text-xs font-bold tracking-widest text-slate-400 uppercase pl-1">
              Add New {currentMatrix.title} Target Choice
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newOptionName}
                disabled={!isWeightMatrixValid}
                onChange={(e) => setNewOptionName(e.target.value)}
                placeholder={!isWeightMatrixValid ? "Balance category settings to unlock entry input..." : `Enter item name (e.g., ${activeDomain === 'movies' ? 'Inception' : activeDomain === 'food' ? 'Pizza' : 'Gym Workout'})...`}
                className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 w-full text-slate-200 placeholder:text-slate-600 disabled:opacity-40"
              />
              <button
                type="submit"
                disabled={!isWeightMatrixValid}
                className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 px-5 rounded-xl transition-all font-bold flex items-center justify-center disabled:opacity-40 shadow-lg shadow-cyan-500/10"
              >
                <Plus size={20} />
              </button>
            </div>
          </form>
        </div>

        {/* 2. DYNAMIC PREFERENCE ACCORDION WEIGHT SLIDERS (BELOW INPUT BOX) */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-sm shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-3">
            <h2 className="text-xs font-bold tracking-wider text-slate-200 flex items-center gap-2">
              <Scale size={14} className="text-cyan-400" />
              <span>Configure Adaptive Matrix Matching Weights</span>
            </h2>
          </div>

          <div className={`mb-4 p-2.5 rounded-xl border flex items-center gap-2.5 text-[11px] font-medium ${
            isWeightMatrixValid 
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
              : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
          }`}>
            {isWeightMatrixValid ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
            <p>
              Current Core Pool Distribution Total: <span className="font-mono font-bold text-xs underline">{totalWeightSum}%</span> (Must equal 100%)
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {currentMatrix.criteria.map((c) => {
              const currentVal = dynamicWeights[c.id] || 0;
              return (
                <div key={c.id} className="bg-slate-950/60 rounded-xl p-3 border border-slate-800/60 space-y-1">
                  <div className="flex justify-between items-center text-[11px]">
                    <div>
                      <span className="font-semibold text-slate-300 block">{c.name}</span>
                      <span className="text-[10px] text-slate-500 block leading-none mt-0.5">{c.description}</span>
                    </div>
                    <span className="text-cyan-400 font-mono font-bold bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800 text-xs">{currentVal}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={currentVal}
                    onChange={(e) => handleWeightSliderChange(c.id, e.target.value)}
                    className="w-full h-1 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-cyan-400 mt-1"
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. CALCULATED MATCH OUTPUT MODULE */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold tracking-widest text-slate-500 uppercase pl-1">
            Evaluated Decision Alternatives Matrix Stack
          </h2>

          {options.length === 0 ? (
            <div className="border border-dashed border-slate-800 rounded-2xl p-10 text-center text-slate-600 flex flex-col items-center justify-center gap-2">
              <IconComponent size={24} className="text-slate-700" />
              <p className="text-xs max-w-xs leading-relaxed">
                No targets mapped inside this workspace layer. Input an option name to activate neural analytics calculations.
              </p>
            </div>
          ) : (
            options.map((opt) => {
              const matchValue = calculateFinalScore(opt.scores);
              const isItemLoading = loadingOptionId === opt.id;

              return (
                <div key={opt.id} className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4 backdrop-blur-xs">
                  
                  {/* Top Vector Target Headers */}
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <h3 className="text-lg font-bold text-white tracking-tight">{opt.name}</h3>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">Calculations Active across category profile</p>
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

                  {/* Dynamic Gemini Core Insight Presentation Layer */}
                  <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-3.5">
                    <div className="flex items-center gap-2 text-cyan-400/90 text-[10px] font-bold uppercase tracking-wider mb-1.5">
                      <Brain size={12} className={isItemLoading ? "animate-pulse" : ""} />
                      <span>Gemini AI Analytical Assessment Vector</span>
                    </div>
                    {isItemLoading ? (
                      <div className="flex items-center gap-1.5 text-slate-500 text-xs py-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" />
                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.2s]" />
                        <span className="text-[11px] ml-1">Streaming matching vectors...</span>
                      </div>
                    ) : (
                      <p className="text-slate-300 text-xs leading-relaxed">
                        {opt.aiAnalysis || "Manual assessment overrides active below."}
                      </p>
                    )}
                  </div>

                  {/* Individual Alternative Score Metrics Adjustment Vector Sliders */}
                  <div className="space-y-3 pt-1 border-t border-slate-800/40">
                    {currentMatrix.criteria.map((c) => {
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