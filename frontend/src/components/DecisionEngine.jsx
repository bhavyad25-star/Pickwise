import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Brain, Film, Utensils, Trophy, Palmtree, Sparkles, Check, Sliders, Flame } from 'lucide-react';

const PLATFORM_TOPICS = {
  movies: {
    title: "Movies & Genres",
    icon: Film,
    sliders: ['Action', 'Romance', 'SciFi', 'Comedy', 'Drama', 'Horror'],
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
    sliders: ['Cardio', 'Strength', 'Teamwork', 'Outdoor', 'Budget Friendly', 'Skill Intensive'],
    criteria: [
      { id: 'teamwork', name: 'Teamwork & Coordination', weight: 0.30 },
      { id: 'stamina', name: 'Stamina Intensive', weight: 0.30 },
      { id: 'equipment', name: 'Equipment Cost', weight: 0.20 },
      { id: 'fun', name: 'Pure Fun & Joy', weight: 0.20 }
    ]
  },
  vacations: {
    title: "Vacation Destinations",
    icon: Palmtree,
    sliders: ['Beach Vibe', 'Adventure', 'Historical', 'Budget', 'Nightlife', 'Relaxation'],
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
    sliders: ['Spicy', 'Sweet', 'Savory', 'Healthy', 'Fast Food', 'Exotic Cuisine'],
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
  const [genreMix, setGenreMix] = useState({});
  const [recommendations, setRecommendations] = useState([]);
  const [loadingRecs, setLoadingRecs] = useState(false);

  const currentTopicData = PLATFORM_TOPICS[activeTopic];

  useEffect(() => {
    const initialSliders = {};
    currentTopicData.sliders.forEach(sliderName => {
      if (sliderName === 'Action' || sliderName === 'Spicy' || sliderName === 'Beach Vibe') {
        initialSliders[sliderName] = 8;
      } else if (sliderName === 'Romance' || sliderName === 'Sweet' || sliderName === 'Adventure') {
        initialSliders[sliderName] = 5;
      } else {
        initialSliders[sliderName] = 0;
      }
    });
    setGenreMix(initialSliders);
    setOptions([]);
    setRecommendations([]);
  }, [activeTopic]);

  const handleSliderValueChange = (sliderKey, val) => {
    setGenreMix(prev => ({ ...prev, [sliderKey]: parseInt(val) }));
  };

  const handleAddOption = async (e) => {
    e.preventDefault();
    if (!newOptionName.trim()) return;

    const temporaryId = Date.now().toString();
    const targetName = newOptionName.trim();
    
    const initialBlankScores = {};
    currentTopicData.criteria.forEach(c => {
      initialBlankScores[c.id] = 75; 
    });

    const newOptionItem = {
      id: temporaryId,
      name: targetName,
      scores: initialBlankScores,
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
          genreMixProfile: genreMix,
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
            detectedGenre: data.detectedGenre || "Profile Match",
            scores: data.suggestedScores || opt.scores,
            isLiveAI: true
          };
        }
        return opt;
      }));
    } catch (error) {
      console.error(error);
      setOptions(prev => prev.map(opt => {
        if (opt.id === temporaryId) {
          return { 
            ...opt, 
            detectedGenre: "Backend Sleep Mode",
            aiAnalysis: "Render instances sleep during inactivity. Since your backend URL is waking up, click the '+' button again right now to fetch computations!",
            isLiveAI: false
          };
        }
        return opt;
      }));
    } finally {
      setLoadingOptionId(null);
    }
  };

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
      if (data.recommendedItems) {
        setRecommendations(data.recommendedItems.map(item => ({ ...item, isLiveAI: true })));
      }
    } catch (err) {
      console.error(err);
      
      if (activeTopic === 'movies') {
        setRecommendations([
          { title: "Inception", genre: "Sci-Fi / Action Blend", reason: "Matches your high preference for structural depth and heavy pacing.", score: "94%", isLiveAI: false },
          { title: "The Dark Knight", genre: "Action / Drama Blend", reason: "High critical reception profile aligned with your tracking values.", score: "88%", isLiveAI: false }
        ]);
      } else if (activeTopic === 'food') {
        setRecommendations([
          { title: "Spicy Honey Glazed Wings", genre: "Spicy / Savory Mix", reason: "Matches your preference for intense heat balanced with a rich flavor profile.", score: "95%", isLiveAI: false },
          { title: "Sweet Chili Thai Noodles", genre: "Sweet / Spicy Mix", reason: "An excellent option matching your speed and preparation constraints.", score: "86%", isLiveAI: false }
        ]);
      } else if (activeTopic === 'vacations') {
        setRecommendations([
          { title: "Amalfi Coast, Italy", genre: "Beach Vibe / Relaxation", reason: "A perfect destination combining safety with absolute visual quality.", score: "92%", isLiveAI: false },
          { title: "Kyoto, Japan", genre: "Historical / Relaxation", reason: "High sightseeing score parameters matching your comfort criteria.", score: "89%", isLiveAI: false }
        ]);
      } else {
        setRecommendations([
          { title: "HIIT Circuit Training", genre: "Cardio / Stamina Intensive", reason: "Perfect selection matching your top health priorities.", score: "90%", isLiveAI: false },
          { title: "Outdoor Rock Climbing", genre: "Adventure / Strength", reason: "Maintains high outdoor scores while keeping equipment costs low.", score: "85%", isLiveAI: false }
        ]);
      }
    } finally {
      setLoadingRecs(false);
    }
  };

  const calculateDynamicScore = (optionScores) => {
    let combinedScore = 0;
    currentTopicData.criteria.forEach(c => {
      const fieldScore = optionScores[c.id] !== undefined ? optionScores[c.id] : 75;
      combinedScore += (fieldScore * c.weight);
    });
    return Math.round(combinedScore);
  };

  return (
    <div className="min-h-screen p-4 md:p-8 text-slate-200">
      <div className="max-w-xl mx-auto space-y-6">
        
        <header className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 text-cyan-400 font-bold uppercase text-[10px] bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20">
            <Sparkles size={11} />
            <span>Multi-Matrix Hybrid Preference Engine</span>
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

        {/* Dynamic Category Sliders Block */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center gap-1.5 border-b border-slate-800 pb-2">
            <Sliders size={14} className="text-cyan-400" />
            <h2 className="text-xs font-bold tracking-widest text-slate-300 uppercase">
              Configure {currentTopicData.title} Profile Mix
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            {Object.keys(genreMix).map((sliderKey) => (
              <div key={sliderKey} className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/40 space-y-1">
                <div className="flex justify-between items-center text-[11px] font-bold">
                  <span className="text-slate-400 uppercase tracking-wider">{sliderKey}</span>
                  <span className={`font-mono ${genreMix[sliderKey] > 0 ? 'text-cyan-400' : 'text-slate-600'}`}>
                    {genreMix[sliderKey]}/10
                  </span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="10" 
                  value={genreMix[sliderKey] || 0} 
                  onChange={(e) => handleSliderValueChange(sliderKey, e.target.value)}
                  className="w-full accent-cyan-500 bg-slate-900 h-1.5 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={handleGetRecommendations}
            disabled={loadingRecs}
            className="w-full mt-2 'bg-gradient-to-r' from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.98]"
          >
            <Flame size={14} className={loadingRecs ? "animate-pulse" : ""} />
            <span>{loadingRecs ? "Mining Perfect Matches..." : `Auto-Suggest Ideal ${currentTopicData.title}`}</span>
          </button>
        </div>

        {/* AI Recommendations Stream Panel */}
        {recommendations.length > 0 && (
          <div className="bg-slate-900/40 border border-dashed border-cyan-500/20 rounded-2xl p-4 space-y-3">
            <div className="text-[10px] font-black uppercase tracking-widest text-cyan-400 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Sparkles size={12} />
                <span>Top AI Picks for your Mix</span>
              </div>
            </div>
            <div className="space-y-2">
              {recommendations.map((rec, index) => (
                <div key={index} className="bg-slate-950/80 border border-slate-800/80 p-3 rounded-xl flex justify-between items-start gap-4">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-black text-white">{rec.title}</h4>
                      <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded font-mono ${
                        rec.isLiveAI 
                          ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' 
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {rec.isLiveAI ? 'LIVE GEMINI' : 'SERVER SLEEPING (FALLBACK)'}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium font-mono">Profile: {rec.genre}</p>
                    <p className="text-[11px] text-slate-500 leading-snug pt-1">{rec.reason}</p>
                  </div>
                  <span className="text-xs font-mono font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded shrink-0">
                    {rec.score} Match
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Input Submission Search Panel */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl">
          <form onSubmit={handleAddOption} className="space-y-2">
            <label className="block text-[11px] font-bold tracking-widest text-slate-400 uppercase pl-0.5">
              Cross-Analyze Specific Choice Against Current Metrics
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newOptionName}
                onChange={(e) => setNewOptionName(e.target.value)}
                placeholder="Enter custom title item name..."
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

        {/* Results Stream Matrix */}
        <div className="space-y-3.5">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 tracking-widest uppercase pl-0.5">
            <Check size={11} className="text-emerald-500/80" />
            <span>Matching Metrics Matrix Results</span>
          </div>

          {options.map((opt) => {
            const matchPercentage = calculateDynamicScore(opt.scores);
            const isItemLoading = loadingOptionId === opt.id;

            return (
              <div key={opt.id} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-3.5">
                <div className="flex justify-between items-center gap-3">
                  <div>
                    <h3 className="text-base font-bold text-white tracking-tight">{opt.name}</h3>
                    <div className="flex flex-wrap gap-1.5 items-center mt-1">
                      <span className="text-[9px] bg-slate-950 text-slate-400 px-2 py-0.5 rounded border border-slate-800 font-mono font-bold">
                        Tag: {opt.detectedGenre}
                      </span>
                    </div>
                  </div>

                  <div className="text-right flex items-center gap-2 shrink-0">
                    <div>
                      <span className="block text-[8px] font-bold tracking-widest text-slate-400 uppercase">VIBE MATCH</span>
                      <span className="text-lg font-black font-mono text-cyan-400">{matchPercentage}%</span>
                    </div>
                    <button
                      type="button"
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
                    <span>Gemini Core Verification</span>
                  </div>
                  {isItemLoading ? (
                    <p className="text-slate-500 text-xs animate-pulse py-0.5">Processing custom metric alignments from profile array...</p>
                  ) : (
                    <p className="text-slate-300 text-xs leading-relaxed">{opt.aiAnalysis}</p>
                  )}
                </div>

                {/* Dynamic Labels Render Panel */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {currentTopicData.criteria.map((c) => (
                    <span key={c.id} className="text-[9px] font-semibold bg-slate-950 border border-slate-800 text-slate-400 px-2 py-0.5 rounded-md">
                      {c.name}: <span className="text-cyan-400 font-mono font-bold">{opt.scores[c.id] !== undefined ? opt.scores[c.id] : 75}%</span>
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