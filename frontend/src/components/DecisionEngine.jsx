import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Brain, Film, Utensils, Trophy, Palmtree, Sparkles, Check } from 'lucide-react';

const PLATFORM_TOPICS = {
  movies: {
    title: "Movies & Genres",
    icon: Film,
    hasSubgenres: true,
    subgenres: [
      { id: 'scifi', name: 'Sci-Fi / Tech Thrillers' },
      { id: 'action', name: 'Action & Adventure' },
      { id: 'drama', name: 'Drama & Story-Driven' },
      { id: 'horror', name: 'Horror & Dark Thrillers' }
    ],
    criteria: [
      { id: 'entertainment', name: 'Entertainment Value', weight: 0.35 },
      { id: 'pacing', name: 'Pacing & Engagement', weight: 0.25 },
      { id: 'critics', name: 'Critical Performance', weight: 0.20 },
      { id: 'rewatch', name: 'Re-watchability Factor', weight: 0.20 }
    ]
  },
  sports: {
    title: "Sports & Fitness",
    icon: Trophy,
    hasSubgenres: false,
    criteria: [
      { id: 'teamwork', name: 'Teamwork & Coordination', weight: 0.30 },
      { id: 'stamina', name: 'Stamina Intensive', weight: 0.30 },
      { id: 'equipment', name: 'Equipment Cost (Value)', weight: 0.20 },
      { id: 'fun', name: 'Pure Fun & Joy', weight: 0.20 }
    ]
  },
  vacations: {
    title: "Vacation Dest.",
    icon: Palmtree,
    hasSubgenres: false,
    criteria: [
      { id: 'price', name: 'Price & Budgeting', weight: 0.25 },
      { id: 'distance', name: 'Distance from India', weight: 0.20 },
      { id: 'diversibility', name: 'Diversibility / Culture', weight: 0.20 },
      { id: 'safety', name: 'Safety Parameters', weight: 0.20 },
      { id: 'spots', name: 'Tourist Spots / Sightseeing', weight: 0.15 }
    ]
  },
  food: {
    title: "Food Options",
    icon: Utensils,
    hasSubgenres: false,
    criteria: [
      { id: 'taste', name: 'Taste Profile', weight: 0.40 },
      { id: 'health', name: 'Healthiness & Nutrition', weight: 0.25 },
      { id: 'price', name: 'Price / Economy', weight: 0.20 },
      { id: 'time', name: 'Preparation Speed', weight: 0.15 }
    ]
  }
};

export default function DecisionEngine() {
  const [activeTopic, setActiveTopic] = useState('movies');
  const [activeSubgenre, setActiveSubgenre] = useState('scifi');
  const [options, setOptions] = useState([]);
  const [newOptionName, setNewOptionName] = useState('');
  const [loadingOptionId, setLoadingOptionId] = useState(null);

  const currentTopicData = PLATFORM_TOPICS[activeTopic];

  useEffect(() => {
    setOptions([]);
  }, [activeTopic, activeSubgenre]);

  const handleAddOption = async (e) => {
    e.preventDefault();
    if (!newOptionName.trim()) return;

    const temporaryId = Date.now().toString();
    const targetName = newOptionName.trim();
    
    const baseScores = {};
    currentTopicData.criteria.forEach(c => {
      baseScores[c.id] = 75; 
    });

    const newOptionItem = {
      id: temporaryId,
      name: targetName,
      scores: baseScores,
      aiAnalysis: null
    };

    setOptions(prev => [newOptionItem, ...prev]);
    setNewOptionName('');
    setLoadingOptionId(temporaryId);

    try {
      const response = await fetch('https://pickwise-zkt8.onrender.com/ask-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          optionName: targetName,
          topic: activeTopic,
          subgenre: currentTopicData.hasSubgenres ? activeSubgenre : null,
          criteriaList: currentTopicData.criteria
        })
      });

      if (!response.ok) throw new Error("Gateway connection offline");
      const data = await response.json();

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
            aiAnalysis: "Backend is booting up! Render free services take about 60 seconds to wake up from inactivity sleep. Please hit '+' again shortly!" 
          };
        }
        return opt;
      }));
    } finally {
      setLoadingOptionId(null);
    }
  };

  const calculateSilentScore = (optionScores) => {
    let combinedScore = 0;
    currentTopicData.criteria.forEach(c => {
      const fieldScore = optionScores[c.id] || 75;
      combinedScore += (fieldScore * c.weight);
    });
    return Math.round(combinedScore);
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-xl mx-auto space-y-6">
        
        <header className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 text-cyan-400 font-bold uppercase text-[10px] bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20">
            <Sparkles size={11} />
            <span>AI Powered Preference Tracker</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white">PickWise</h1>
          
          <div className="grid grid-cols-4 gap-1 bg-slate-900 p-1.5 rounded-xl border border-slate-800/80 w-full mt-4 shadow-inner">
            {Object.keys(PLATFORM_TOPICS).map((topicKey) => {
              const item = PLATFORM_TOPICS[topicKey];
              const isSelected = activeTopic === topicKey;
              const TopicIcon = item.icon;
              return (
                <button
                  key={topicKey}
                  type="button"
                  onClick={() => setActiveTopic(topicKey)}
                  className={`flex flex-col sm:flex-row items-center justify-center gap-1 py-2 px-1 rounded-lg text-[10px] sm:text-xs font-bold transition-all ${
                    isSelected 
                      ? 'bg-cyan-500 text-slate-950 shadow-md' 
                      : 'text-slate-400 hover:bg-slate-950/50 hover:text-slate-200'
                  }`}
                >
                  <TopicIcon size={13} />
                  <span className="truncate">{item.title.split(" ")[0]}</span>
                </button>
              );
            })}
          </div>

          {currentTopicData.hasSubgenres && (
            <div className="flex flex-wrap gap-1 bg-slate-900/40 p-1 rounded-lg border border-slate-900/60 w-full mt-2">
              {currentTopicData.subgenres.map((genre) => {
                const isGenreSelected = activeSubgenre === genre.id;
                return (
                  <button
                    key={genre.id}
                    type="button"
                    onClick={() => setActiveSubgenre(genre.id)}
                    className={`flex-1 py-1.5 px-2 text-[10px] font-semibold rounded-md transition-colors ${
                      isGenreSelected 
                        ? 'bg-slate-800 text-cyan-400 border border-cyan-500/20' 
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {genre.name.split(" ")[0]}
                  </button>
                );
              })}
            </div>
          )}
        </header>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl">
          <form onSubmit={handleAddOption} className="space-y-2">
            <label className="block text-[11px] font-bold tracking-widest text-slate-400 uppercase pl-0.5">
              Add New {currentTopicData.hasSubgenres ? currentTopicData.subgenres.find(g => g.id === activeSubgenre)?.name : currentTopicData.title} Choice
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newOptionName}
                onChange={(e) => setNewOptionName(e.target.value)}
                placeholder={`Type item (e.g., ${activeTopic === 'movies' ? 'Inception' : activeTopic === 'food' ? 'Butter Chicken' : activeTopic === 'vacations' ? 'Goa' : 'Cricket'})...`}
                className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 w-full text-slate-200 placeholder:text-slate-600"
              />
              <button
                type="submit"
                className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 px-4 rounded-xl transition-all font-bold flex items-center justify-center shadow-lg shadow-cyan-500/10"
              >
                <Plus size={18} />
              </button>
            </div>
          </form>
        </div>

        <div className="space-y-3.5">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 tracking-widest uppercase pl-0.5">
            <Check size={11} className="text-emerald-500/80" />
            <span>Matching Metrics Matrix Results</span>
          </div>

          {options.length === 0 ? (
            <div className="border border-dashed border-slate-800/80 rounded-2xl p-8 text-center text-slate-600 flex flex-col items-center justify-center gap-1.5">
              <p className="text-xs max-w-xs">
                Your matching list is ready. Type an item in the input box above to see the calculation match!
              </p>
            </div>
          ) : (
            options.map((opt) => {
              const matchPercentage = calculateSilentScore(opt.scores);
              const isItemLoading = loadingOptionId === opt.id;

              return (
                <div key={opt.id} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-3.5 transition-all">
                  
                  <div className="flex justify-between items-center gap-3">
                    <div>
                      <h3 className="text-base font-bold text-white tracking-tight">{opt.name}</h3>
                      <p className="text-[9px] text-slate-500 font-mono mt-0.5">
                        Category: {currentTopicData.title} {currentTopicData.hasSubgenres && `(${currentTopicData.subgenres.find(g => g.id === activeSubgenre)?.name})`}
                      </p>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <div className="text-right">
                        <span className="block text-[8px] font-bold tracking-widest text-slate-400 uppercase">
                          MATCH INDEX
                        </span>
                        <span className="text-lg font-black font-mono text-cyan-400">
                          {matchPercentage}%
                        </span>
                      </div>
                      <button
                        onClick={() => setOptions(prev => prev.filter(o => o.id !== opt.id))}
                        className="text-slate-600 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-500/10 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="bg-slate-950 border border-slate-800/60 rounded-xl p-3">
                    <div className="flex items-center gap-1.5 text-cyan-400/90 text-[9px] font-bold uppercase tracking-wider mb-1">
                      <Brain size={11} className={isItemLoading ? "animate-pulse" : ""} />
                      <span>Gemini Evaluation breakdown</span>
                    </div>
                    {isItemLoading ? (
                      <div className="flex items-center gap-1 text-slate-500 text-xs py-0.5">
                        <div className="w-1 h-1 rounded-full bg-cyan-400 animate-bounce" />
                        <div className="w-1 h-1 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.2s]" />
                        <span className="text-[10px] ml-1">Analyzing characteristics...</span>
                      </div>
                    ) : (
                      <p className="text-slate-300 text-xs leading-relaxed">
                        {opt.aiAnalysis || "Aggregating preference tracking scores..."}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {currentTopicData.criteria.map((c) => (
                      <span 
                        key={c.id} 
                        className="text-[9px] font-semibold bg-slate-950 border border-slate-800 text-slate-400 px-2 py-0.5 rounded-md"
                      >
                        {c.name}: <span className="text-cyan-400 font-mono font-bold">{opt.scores[c.id] || 75}%</span>
                      </span>
                    ))}
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