import React, { useState, useEffect } from 'react';
import { Sliders, Plus, Trash2, Brain, Film, Sparkles, Scale, AlertTriangle, CheckCircle } from 'lucide-react';

// Pure Dedicated Movie Genre Profiles Matrix
const MOVIE_GENRES = {
  scifi: {
    title: "Sci-Fi / Tech Thrillers",
    description: "Deep conceptual plots, futuristic science, and mind-bending logic.",
    criteria: [
      { id: 'concept', name: 'Mind-Bending Concept', weight: 0.35, description: 'Originality of the sci-fi premise' },
      { id: 'vfx', name: 'Visuals & World Building', weight: 0.25, description: 'Immersive environments and CGI quality' },
      { id: 'pacing', name: 'Pacing & Suspense', weight: 0.20, description: 'How well it maintains technical tension' },
      { id: 'rewatch', name: 'Re-watchability Factor', weight: 0.20, description: 'Value of watching it multiple times' }
    ]
  },
  action: {
    title: "Action & Adventure",
    description: "High-octane stunts, intense sequences, and fast-paced thrill factors.",
    criteria: [
      { id: 'stunts', name: 'Choreography & Stunts', weight: 0.40, description: 'Quality of fight scenes or chases' },
      { id: 'pacing', name: 'Adrenaline & Pacing', weight: 0.30, description: 'Speed and thrill intensity' },
      { id: 'entertainment', name: 'Pure Fun Value', weight: 0.15, description: 'Popcorn entertainment factor' },
      { id: 'vfx', name: 'Sound & Visual Scale', weight: 0.15, description: 'Explosions and audio design' }
    ]
  },
  drama: {
    title: "Drama & Story-Driven",
    description: "Character development, deep emotional narrative, and powerful acting.",
    criteria: [
      { id: 'acting', name: 'Acting Performances', weight: 0.35, description: 'Believability and power of the cast' },
      { id: 'script', name: 'Screenplay & Dialogues', weight: 0.30, description: 'Depth of the written story' },
      { id: 'emotional', name: 'Emotional Impact', weight: 0.20, description: 'How moving or thought-provoking it is' },
      { id: 'direction', name: 'Direction & Score', weight: 0.15, description: 'Cinematography and backing music' }
    ]
  },
  horror: {
    title: "Horror / Dark Thrillers",
    description: "Atmosphere, suspense building, psychological tension, and scares.",
    criteria: [
      { id: 'atmosphere', name: 'Creepy Atmosphere', weight: 0.35, description: 'Dread and environmental tension' },
      { id: 'scares', name: 'Jump Scares & Payoffs', weight: 0.25, description: 'Execution of horror elements' },
      { id: 'plot', name: 'Mystery & Logic', weight: 0.20, description: 'Does the plot make sense?' },
      { id: 'sound', name: 'Audio Design / Creepy Score', weight: 0.20, description: 'Sound effects that build fear' }
    ]
  }
};

export default function DecisionEngine() {
  const [activeGenre, setActiveGenre] = useState('scifi');
  const [options, setOptions] = useState([]);
  const [newOptionName, setNewOptionName] = useState('');
  const [loadingOptionId, setLoadingOptionId] = useState(null);
  const [dynamicWeights, setDynamicWeights] = useState({});

  const currentGenreData = MOVIE_GENRES[activeGenre];

  // Keep dynamic slider weights perfectly updated whenever user clicks a genre button
  useEffect(() => {
    const initialWeights = {};
    currentGenreData.criteria.forEach(c => {
      initialWeights[c.id] = c.weight * 100;
    });
    setDynamicWeights(initialWeights);
    setOptions([]); 
  }, [activeGenre]);

  const totalWeightSum = Object.values(dynamicWeights).reduce((sum, val) => sum + (val || 0), 0);
  const isWeightMatrixValid = totalWeightSum === 100;

  const handleWeightSliderChange = (id, value) => {
    setDynamicWeights(prev => ({
      ...prev,
      [id]: parseInt(value) || 0
    }));
  };

  // Robust network bridge to protect against backend timeouts
  const fetchWithRetry = async (url, fetchOptions, retries = 3, delay = 4000) => {
    for (let i = 0; i < retries; i++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 25000);
        const response = await fetch(url, { ...fetchOptions, signal: controller.signal });
        clearTimeout(timeoutId);
        if (response.ok) return await response.json();
      } catch (err) {
        console.log(`Retrying API connection loop...`);
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
    currentGenreData.criteria.forEach(c => {
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
          domainContext: currentGenreData.title,
          criteriaList: currentGenreData.criteria.map(c => `${c.name} (${c.description})`)
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
            aiAnalysis: "Backend is currently booting up. Manual matching sliders remain active below." 
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
    currentGenreData.criteria.forEach(c => {
      const sliderValue = optionScores[c.id] || 0;
      const adaptiveWeightPercentage = (dynamicWeights[c.id] || 0) / 100;
      totalScore += (sliderValue * adaptiveWeightPercentage);
    });
    return Math.round(totalScore);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Header Title branding */}
        <header className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 text-cyan-400 font-bold uppercase text-[10px] bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20">
            <Sparkles size={12} />
            <span>Movie Weighted Match Engine</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            Movie Choices Matcher
          </h1>
          
          {/* Movie Genre Selector Bar */}
          <div className="flex flex-wrap gap-1 bg-slate-900 p-1.5 rounded-xl border border-slate-800 w-full mt-3">
            {Object.keys(MOVIE_GENRES).map((genreKey) => {
              const item = MOVIE_GENRES[genreKey];
              const isSelected = activeGenre === genreKey;
              return (
                <button
                  key={genreKey}
                  type="button"
                  onClick={() => setActiveGenre(genreKey)}
                  className={`flex-1 py-2 px-3 text-xs font-bold rounded-lg transition-all ${
                    isSelected 
                      ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/10' 
                      : 'text-slate-400 hover:bg-slate-950 hover:text-slate-200'
                  }`}
                >
                  {item.title.split(" ")[0]}
                </button>
              );
            })}
          </div>
        </header>

        {/* 1. MOVIE ENTRY BOX AT THE TOP */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <form onSubmit={handleAddOption} className="space-y-3">
            <label className="block text-xs font-bold tracking-widest text-slate-400 uppercase pl-1">
              Add New Movie Name Below
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newOptionName}
                disabled={!isWeightMatrixValid}
                onChange={(e) => setNewOptionName(e.target.value)}
                placeholder={!isWeightMatrixValid ? "Please balance your weights to 100% first..." : `Enter title (e.g., Interstellar, John Wick, Shutter Island)...`}
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

        {/* 2. GENRE CRITERIA WEIGHT SLIDERS (BELOW THE ADD BOX) */}
        <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-sm shadow-xl">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2 mb-3">
            <Scale size={14} className="text-cyan-400" />
            <h2 className="text-xs font-bold tracking-wider text-slate-200 uppercase">
              {currentGenreData.title} Importance Sliders
            </h2>
          </div>
          <p className="text-[11px] text-slate-400 mb-3 italic">{currentGenreData.description}</p>

          <div className={`mb-4 p-2.5 rounded-xl border flex items-center gap-2.5 text-[11px] ${
            isWeightMatrixValid ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
          }`}>
            {isWeightMatrixValid ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
            <p>
              Current Weight Balance Total: <span className="font-mono font-bold text-xs underline">{totalWeightSum}%</span> (Must equal exactly 100%)
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {currentGenreData.criteria.map((c) => {
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

        {/* 3. CALCULATED MOVIE ALTERNATIVES MATCHING RESULTS LIST */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold tracking-widest text-slate-500 uppercase pl-1">
            Evaluated Movie List With Matching Percentages
          </h2>

          {options.length === 0 ? (
            <div className="border border-dashed border-slate-800 rounded-2xl p-10 text-center text-slate-600 flex flex-col items-center justify-center gap-2">
              <Film size={24} className="text-slate-700" />
              <p className="text-xs max-w-xs">
                Your evaluated list is empty. Type a movie name inside the box at the top to check calculations!
              </p>
            </div>
          ) : (
            options.map((opt) => {
              const matchValue = calculateFinalScore(opt.scores);
              const isItemLoading = loadingOptionId === opt.id;

              return (
                <div key={opt.id} className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
                  
                  {/* Top Heading */}
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <h3 className="text-lg font-bold text-white tracking-tight">{opt.name}</h3>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">Profile: {currentGenreData.title}</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="block text-[9px] font-bold tracking-widest text-slate-500 uppercase">
                          MATCHING INDEX
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

                  {/* AI Bridge Context box */}
                  <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-3.5">
                    <div className="flex items-center gap-2 text-cyan-400/90 text-[10px] font-bold uppercase tracking-wider mb-1.5">
                      <Brain size={12} className={isItemLoading ? "animate-pulse" : ""} />
                      <span>Gemini Movie Assessment Vector</span>
                    </div>
                    {isItemLoading ? (
                      <div className="flex items-center gap-1.5 text-slate-500 text-xs py-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" />
                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.2s]" />
                        <span className="text-[11px] ml-1">Analyzing film attributes...</span>
                      </div>
                    ) : (
                      <p className="text-slate-300 text-xs leading-relaxed">
                        {opt.aiAnalysis || "Manual slider mode active."}
                      </p>
                    )}
                  </div>

                  {/* Criteria Sliders inside each Movie item */}
                  <div className="space-y-3 pt-1 border-t border-slate-800/40">
                    {currentGenreData.criteria.map((c) => {
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