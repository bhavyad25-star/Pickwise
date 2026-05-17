import React, { useState } from 'react';
import { 
  Sliders, Plus, Trash2, Brain, Activity, 
  Film, Utensils, Trophy, Briefcase, Sparkles 
} from 'lucide-react';

// 1. Domain Matrix Configurations
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
    title: "Sports Matrix",
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
  // Application State
  const [activeDomain, setActiveDomain] = useState('movies');
  const [options, setOptions] = useState([]);
  const [newOptionName, setNewOptionName] = useState('');
  const [loadingOptionId, setLoadingOptionId] = useState(null);

  const currentMatrix = DOMAIN_MATRICES[activeDomain];

  // State initialization helper when adding an option
  const generateInitialScores = () => {
    const scores = {};
    currentMatrix.criteria.forEach(c => {
      scores[c.id] = 50; // Start sliders at exact midpoint (50%)
    });
    return scores;
  };

  // 2. Call the Hosted Live Render Cloud API Gateway Backend
  const handleAddOption = async (e) => {
    e.preventDefault();
    if (!newOptionName.trim()) return;

    const temporaryId = Date.now().toString();
    const targetName = newOptionName.trim();
    
    // Add option to UI instantly with loading state active
    const newOptionItem = {
      id: temporaryId,
      name: targetName,
      scores: generateInitialScores(),
      aiAnalysis: null
    };

    setOptions(prev => [...prev, newOptionItem]);
    setNewOptionName('');
    setLoadingOptionId(temporaryId);

    try {
      // 🚀 LINKED TO YOUR LIVE RENDER CLOUD INSTANCE BACKEND
      const response = await fetch('https://pickwise-zkt8.onrender.com/ask-ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          optionName: targetName,
          domainContext: currentMatrix.title,
          criteriaList: currentMatrix.criteria.map(c => `${c.name} (${c.description})`)
        })
      });

      if (!response.ok) throw new Error('Network boundary execution failure');
      
      const data = await response.json();

      // Update the added option with the live AI evaluation matrix results
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
      console.error("AI Evaluation Gateway Error: ", error);
      // Fail gracefully: remove loading spinner, keep defaults intact
      setOptions(prev => prev.map(opt => {
        if (opt.id === temporaryId) {
          return { ...opt, aiAnalysis: "AI evaluation connection timed out. Manual override enabled." };
        }
        return opt;
      }));
    } finally {
      setLoadingOptionId(null);
    }
  };

  const handleSliderChange = (optionId, criteriaId, value) => {
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

  const handleDeleteOption = (id) => {
    setOptions(prev => prev.filter(opt => opt.id !== id));
  };

  // 3. Mathematical Operations: Linear Weighted Engine Calculation
  const calculateFinalScore = (optionScores) => {
    let totalScore = 0;
    currentMatrix.criteria.forEach(c => {
      const sliderValue = optionScores[c.id] || 0;
      totalScore += (sliderValue * c.weight);
    });
    return Math.round(totalScore);
  };

  const IconComponent = currentMatrix.icon;

  return (
    <div className="min-gradient min-h-screen bg-slate-900 text-slate-100 p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        
        {/* Header Branding Panel */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-6 mb-8">
          <div>
            <div className="flex items-center gap-2 text-cyan-400 font-bold tracking-wider uppercase text-sm">
              <Sparkles size={16} />
              <span>Linear Weighted Math Matrix Engine</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              PickWise Platform
            </h1>
          </div>
          
          {/* Domain Selection Matrix Switcher */}
          <div className="flex items-center gap-2 bg-slate-950/60 p-1.5 rounded-xl border border-slate-800 w-full md:w-auto">
            {Object.keys(DOMAIN_MATRICES).map((domainKey) => {
              const dom = DOMAIN_MATRICES[domainKey];
              const isSelected = activeDomain === domainKey;
              return (
                <button
                  key={domainKey}
                  onClick={() => {
                    setActiveDomain(domainKey);
                    setOptions([]); // Clear working set to reload configurations cleanly
                  }}
                  className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 w-full md:w-auto ${
                    isSelected 
                      ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20 font-semibold' 
                      : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                  }`}
                >
                  <dom.icon size={16} />
                  <span className="hidden sm:inline">{dom.title}</span>
                </button>
              );
            })}
          </div>
        </header>

        {/* Informative Workspace Grid Setup */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Layout Bar: Domain Parameters Evaluation System */}
          <div className="space-y-6 lg:col-span-1">
            <div className="bg-slate-950/40 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm">
              <div className="flex items-center gap-3 text-cyan-400 mb-3">
                <IconComponent className="h-6 w-6" />
                <h2 className="text-xl font-bold">{currentMatrix.title}</h2>
              </div>
              <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                {currentMatrix.description}
              </p>

              <h3 className="text-xs font-bold tracking-widest text-slate-500 uppercase mb-4">
                Criteria Allocation Weights
              </h3>
              <div className="space-y-4">
                {currentMatrix.criteria.map((c) => (
                  <div key={c.id} className="bg-slate-900/50 rounded-xl p-3 border border-slate-800/40">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-semibold text-slate-300">{c.name}</span>
                      <span className="text-cyan-400 font-mono font-bold">{(c.weight * 100)}%</span>
                    </div>
                    <p className="text-xs text-slate-500">{c.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Target Entry Input Form */}
            <form onSubmit={handleAddOption} className="space-y-3">
              <label className="block text-xs font-bold tracking-widest text-slate-500 uppercase pl-1">
                Insert Assessment Alternative
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newOptionName}
                  onChange={(e) => setNewOptionName(e.target.value)}
                  placeholder={`e.g., ${activeDomain === 'movies' ? 'Inception' : activeDomain === 'food' ? 'Sushi Roll' : 'Gym Workout'}`}
                  className="bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 w-full text-slate-200 placeholder:text-slate-600"
                />
                <button
                  type="submit"
                  className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 px-4 rounded-xl transition-all font-bold flex items-center justify-center shadow-lg shadow-cyan-500/10"
                >
                  <Plus size={20} />
                </button>
              </div>
            </form>
          </div>

          {/* Right Layout Bar: Real-time Evaluation Vector Cards Stack */}
          <div className="lg:col-span-2 space-y-6">
            {options.length === 0 ? (
              <div className="border border-dashed border-slate-800 rounded-2xl p-12 text-center text-slate-600 flex flex-col items-center justify-center gap-3">
                <Sliders size={36} className="text-slate-700" />
                <p className="text-sm max-w-xs leading-relaxed">
                  No active assessment targets listed. Input an option on the left layer to activate the AI decision matrix.
                </p>
              </div>
            ) : (
              options.map((opt) => {
                const calculatedFinalValue = calculateFinalScore(opt.scores);
                const isItemLoading = loadingOptionId === opt.id;

                return (
                  <div 
                    key={opt.id} 
                    className="bg-slate-950/40 border border-slate-800 rounded-2xl p-6 relative group backdrop-blur-sm transition-all hover:border-slate-700/60"
                  >
                    {/* Item Heading Row */}
                    <div className="flex justify-between items-start mb-6 gap-4">
                      <div>
                        <h3 className="text-xl font-bold text-white tracking-tight">{opt.name}</h3>
                        <div className="flex items-center gap-1.5 mt-1 text-slate-500 text-xs font-mono">
                          <Activity size={12} />
                          <span>UUID Index Target Matrix Active</span>
                        </div>
                      </div>

                      {/* Score Badge Block */}
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="block text-[10px] font-bold tracking-widest text-slate-500 uppercase">
                            Evaluated Matrix Index
                          </span>
                          <span className="text-2xl font-black text-cyan-400 font-mono">
                            {calculatedFinalValue}%
                          </span>
                        </div>
                        <button
                          onClick={() => handleDeleteOption(opt.id)}
                          className="text-slate-600 hover:text-rose-400 p-2 rounded-xl hover:bg-rose-500/10 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Gemini AI Summary Response Insights Block */}
                    <div className="mb-6 bg-slate-900/60 border border-slate-800/60 rounded-xl p-4">
                      <div className="flex items-center gap-2 text-cyan-400/90 text-xs font-bold uppercase tracking-wider mb-2">
                        <Brain size={14} className={isItemLoading ? "animate-pulse" : ""} />
                        <span>Gemini AI Cognitive Assessment Vector</span>
                      </div>
                      
                      {isItemLoading ? (
                        <div className="flex items-center gap-2 text-slate-500 text-sm py-1">
                          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" />
                          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.2s]" />
                          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.4s]" />
                          <span className="ml-1 text-xs tracking-wide">Pinging neural server interface layers...</span>
                        </div>
                      ) : (
                        <p className="text-slate-300 text-xs leading-relaxed">
                          {opt.aiAnalysis || "Manual evaluation tracking active."}
                        </p>
                      )}
                    </div>

                    {/* Interactive Criteria Sliders Layout */}
                    <div className="space-y-4">
                      {currentMatrix.criteria.map((c) => {
                        const sliderVal = opt.scores[c.id] || 0;
                        return (
                          <div key={c.id} className="space-y-1">
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-slate-400 font-medium">{c.name}</span>
                              <span className="font-mono text-slate-300 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                                {sliderVal}%
                              </span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={sliderVal}
                              onChange={(e) => handleSliderChange(opt.id, c.id, e.target.value)}
                              className="w-full h-1 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-cyan-400 focus:outline-none"
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
    </div>
  );
}