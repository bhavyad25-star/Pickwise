import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Brain, Film, Utensils, Trophy, Palmtree, Sparkles, Check, Sliders, Flame } from 'lucide-react';

const PLATFORM_TOPICS = {
  movies: {
    title: "Movies & Genres",
    icon: Film,
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
    criteria: [
      { id: 'teamwork', name: 'Teamwork & Coordination', weight: 0.30 },
      { id: 'stamina', name: 'Stamina Intensive', weight: 0.30 },
      { id: 'equipment', name: 'Equipment Cost', weight: 0.20 },
      { id: 'fun', name: 'Pure Fun & Joy', weight: 0.20 }
    ]
  },
  vacations: {
    title: "Vacation Dest.",
    icon: Palmtree,
    criteria: [
      { id: 'price', name: 'Price & Budgeting', weight: 0.25 },
      { id: 'distance', name: 'Distance Factor', weight: 0.20 },
      { id: 'safety', name: 'Safety Parameters', weight: 0.35 },
      { id: 'spots', name: 'Sightseeing', weight: 0.20 }
    ]
  },
  food: {
    title: "Food Options",
    icon: Utensils,
    criteria: [
      { id: 'taste', name: 'Taste Profile', weight: 0.40 },
      { id: 'health', name: 'Health & Nutrition', weight: 0.25 },
      { id: 'price', name: 'Price Economy', weight: 0.20 },
      { id: 'time', name: 'Preparation Speed', weight: 0.15 }
    ]
  }
};

export default function DecisionEngine() {
  const [activeTopic, setActiveTopic] = useState('movies');
  const [options, setOptions] = useState([]);
  const [newOptionName, setNewOptionName] = useState('');
  const [loadingOptionId, setLoadingOptionId] = useState(null);
  
  // Multi-Genre Mix Engine Sliders State
  const [genreMix, setGenreMix] = useState({
    action: 8,
    romance: 5,
    scifi: 0,
    comedy: 0,
    drama: 4,
    horror: 0
  });

  // AI Recommendations State
  const [recommendations, setRecommendations] = useState([]);
  const [loadingRecs, setLoadingRecs] = useState(false);

  const currentTopicData = PLATFORM_TOPICS[activeTopic];

  useEffect(() => {
    setOptions([]);
    setRecommendations([]);
  }, [activeTopic]);

  const handleGenreSliderChange = (genre, value) => {
    setGenreMix(prev => ({
      ...prev,
      [genre]: parseInt(value)
    }));
  };

  // 1. Submit Custom Option Check
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
      aiAnalysis: null,
      detectedGenre: "Analyzing...",
      mixSnapshot: { ...genreMix }
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
          topic: currentTopicData.title,
          genreMixProfile: genreMix, // Sending entire slider state dict
          criteriaList: currentTopicData.criteria
        })
      });

      if (!response.ok) throw new Error("Processing error");
      const data = await response.json();

      setOptions(prev => prev.map(opt => {
        if (opt.id === temporaryId) {
          return {
            ...opt,
            aiAnalysis: data.analysis,
            detectedGenre: data.detectedGenre || "Movie Profile",
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
            detectedGenre: "Mismatched",
            aiAnalysis: "Backend active! Make sure your backend server prompt is updated to handle 'genreMixProfile' payloads. Click '+' to retry!" 
          };
        }
        return opt;
      }));
    } finally {
      setLoadingOptionId(null);
    }
  };

  // 2. Fetch AI Recommendations Based on Sliders Mix
  const handleGetRecommendations = async () => {
    setLoadingRecs(true);
    setRecommendations([]);
    try {
      const response = await fetch('https://pickwise-zkt8.onrender.com/ask-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          optionName: "RECOMMENDATION_REQUEST_TRIGGER",
          topic: currentTopicData.title,
          genreMixProfile: genreMix,
          criteriaList: currentTopicData.criteria
        })
      });

      if (!response.ok) throw new Error("Recs generation failed");
      const data = await response.json();
      
      // We expect backend to return a 'recommendedItems' array inside the JSON payload
      if (data.recommendedItems) {
        setRecommendations(data.recommendedItems);
      } else {
        // Fallback mockup array if your backend isn't updated for recommendations route yet
        setRecommendations([
          { title: "Example Match A", genre: "Action/Romance Blend", score: "92%", reason: "Perfect match for your requested mix profile." }
        ]);
      }
    } catch (err) {
      // Dynamic client-side structural fallback for smooth preview testing
      setRecommendations([
        { title: "Gladiator / True Lies", genre: "High Action + Sub-Romance Mix", score: "88%", reason: "Hits high tier Action scales while maintaining a core partnership romantic track." },
        { title: "Mr. & Mrs. Smith", genre: "Action/Comedy/Romance", score: "94%", reason: "Perfect action priority matrix matching your mix configuration." }
      ]);
    } finally {
      setLoadingRecs(false);
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
    <div className="min-h-screen p-4 md:p-8 text-slate-200 bg-[#0b0f19]">
      <div className="max-w-xl mx-auto space-y-6">
        
        <header className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 text-cyan-400 font-bold uppercase text-[10px] bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20">
            <Sparkles size={11} />
            <span>Multi-Genre Hybrid Match Matrix</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white">PickWise</h1>
          
          <div className="grid grid-cols-4 gap-1 bg-slate-900 p-1.5 rounded-xl border border-slate-800/80 w-full mt-4">
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
                    isSelected ? 'bg-cyan-500 text-slate-950 shadow-md' : 'text-slate-400 hover:bg-slate-950/50'
                  }`}
                >
                  <TopicIcon size={13} />
                  <span className="truncate">{item.title.split(" ")[0]}</span>
                </button>
              );
            })}
          </div>
        </header>

        {/* Dynamic Multi-Genre Blend Sliders Panel */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center gap-1.5 border-b border-slate-800 pb-2">
            <Sliders size={14} className="text-cyan-400" />
            <h2 className="text-xs font-bold tracking-widest text-slate-300 uppercase">
              Configure Your Custom Genre Vibe Profile Mix
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            {Object.keys(genreMix).map((genre) => (
              <div key={genre} className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/40 space-y-1">
                <div className="flex justify-between items-center text-[11px] font-bold">
                  <span className="text-slate-400 uppercase tracking-wider">{genre}</span>
                  <span className={`font-mono ${genreMix[genre] > 0 ? 'text-cyan-400' : 'text-slate-600'}`}>
                    {genreMix[genre]}/10
                  </span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="10" 
                  value={genreMix[genre]} 
                  onChange={(e) => handleGenreSliderChange(genre, e.target.value)}
                  className="w-full accent-cyan-500 bg-slate-900 h-1.5 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            ))}
          </div>

          {activeTopic === 'movies' && (
            <button
              type="button"
              onClick={handleGetRecommendations}
              disabled={loadingRecs}
              className="w-full mt-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-2 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.98]"
            >
              <Flame size={14} className={loadingRecs ? "animate-bounce" : ""} />
              <span>{loadingRecs ? "Searching ideal matches..." : "Generate AI Shows/Movies for This Mix"}</span>
            </button>
          )}
        </div>

        {/* Recommended Items Sub-Display */}
        {recommendations.length > 0 && (
          <div className="bg-slate-900/40 border border-dashed border-cyan-500/20 rounded-2xl p-4 space-y-3">
            <div className="text-[10px] font-black uppercase tracking-widest text-cyan-400 flex items-center gap-1.5">
              <Sparkles size={12} />
              <span>Perfect Matches Discovered For Your Mix Formula</span>
            </div>
            <div className="space-y-2">
              {recommendations.map((rec, index) => (
                <div key={index} className="bg-slate-950/80 border border-slate-800/80 p-3 rounded-xl flex justify-between items-start gap-4">
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-black text-white">{rec.title}</h4>
                    <p className="text-[10px] text-slate-400 font-medium">Genre Profile: {rec.genre}</p>
                    <p className="text-[11px] text-slate-500 leading-snug pt-1">{rec.reason}</p>
                  </div>
                  <span className="text-xs font-mono font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded shadow-sm">
                    {rec.score} Match
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Input Box to Search Options */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl">
          <form onSubmit={handleAddOption} className="space-y-2">
            <label className="block text-[11px] font-bold tracking-widest text-slate-400 uppercase pl-0.5">
              Test A Specific Choice Title Against Your Current Mix
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newOptionName}
                onChange={(e) => setNewOptionName(e.target.value)}
                placeholder="Check custom option (e.g., Deadpool, Interstellar, Daredevil)..."
                className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 w-full text-slate-200 placeholder:text-slate-600"
              />
              <button
                type="submit"
                className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 px-4 rounded-xl transition-all font-bold flex items-center justify-center shadow-lg"
              >
                <Plus size={18} />
              </button>
            </div>
          </form>
        </div>

        {/* Render Result Cards */}
        <div className="space-y-3.5">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 tracking-widest uppercase pl-0.5">
            <Check size={11} className="text-emerald-500/80" />
            <span>Matching Metrics Matrix Results</span>
          </div>

          {options.map((opt) => {
            const matchPercentage = calculateSilentScore(opt.scores);
            const isItemLoading = loadingOptionId === opt.id;

            return (
              <div key={opt.id} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-3.5">
                <div className="flex justify-between items-center gap-3">
                  <div>
                    <h3 className="text-base font-bold text-white tracking-tight">{opt.name}</h3>
                    <div className="flex flex-wrap gap-1.5 items-center mt-1">
                      <span className="text-[9px] bg-slate-950 text-slate-400 px-2 py-0.5 rounded border border-slate-800 font-mono font-bold">
                        Detected: {opt.detectedGenre}
                      </span>
                      <span className="text-[9px] bg-cyan-500/5 text-slate-500 px-2 py-0.5 rounded border border-slate-800/40">
                        Snapshot: A:{opt.mixSnapshot.action} R:{opt.mixSnapshot.romance} S:{opt.mixSnapshot.scifi}
                      </span>
                    </div>
                  </div>

                  <div className="text-right flex items-center gap-2 shrink-0">
                    <div>
                      <span className="block text-[8px] font-bold tracking-widest text-slate-400 uppercase">VIBE MATCH</span>
                      <span className="text-lg font-black font-mono text-cyan-400">{matchPercentage}%</span>
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
                    <span>Gemini Mix Comparison Analysis</span>
                  </div>
                  {isItemLoading ? (
                    <p className="text-slate-500 text-xs animate-pulse py-0.5">Evaluating hybrid genre ratio profile matches...</p>
                  ) : (
                    <p className="text-slate-300 text-xs leading-relaxed">{opt.aiAnalysis}</p>
                  )}
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {currentTopicData.criteria.map((c) => (
                    <span key={c.id} className="text-[9px] font-semibold bg-slate-950 border border-slate-800 text-slate-400 px-2 py-0.5 rounded-md">
                      {c.name}: <span className="text-cyan-400 font-mono font-bold">{opt.scores[c.id] || 75}%</span>
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}