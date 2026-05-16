import React, { useState } from 'react';
import DecisionEngine from './components/DecisionEngine';

function App() {
  // isJoined MUST start as false to show the login page
  const [isJoined, setIsJoined] = useState(false);
  const [userData, setUserData] = useState({ name: '', topic: '' });

  const handleStart = (e) => {
    e.preventDefault();
    if (userData.name.trim() && userData.topic.trim()) {
      setIsJoined(true);
    } else {
      alert("Please enter both a name and a topic!");
    }
  };

  // PAGE 1: LOGIN SCREEN
  if (!isJoined) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#0f172a] p-6">
        <div className="relative z-10 w-full max-w-md bg-white/5 backdrop-blur-2xl p-12 rounded-[50px] border border-white/10 text-center shadow-2xl">
          <h1 className="text-5xl font-black text-white italic mb-2">PickWise</h1>
          <p className="text-pink-500 font-bold uppercase text-[10px] tracking-[0.3em] mb-10">AI-Powered Decisions</p>
          
          <form onSubmit={handleStart} className="space-y-4">
            <input 
              className="w-full bg-white/10 border border-white/10 p-5 rounded-2xl text-white outline-none focus:border-pink-500 transition-all placeholder:text-white/20"
              placeholder="Your Name..."
              value={userData.name}
              onChange={(e) => setUserData({...userData, name: e.target.value})}
            />
            <input 
              className="w-full bg-white/10 border border-white/10 p-5 rounded-2xl text-white outline-none focus:border-pink-500 transition-all placeholder:text-white/20"
              placeholder="Decision Topic (e.g., Dinner)"
              value={userData.topic}
              onChange={(e) => setUserData({...userData, topic: e.target.value})}
            />
            <button 
              type="submit"
              className="w-full bg-pink-600 py-5 rounded-2xl font-black text-white text-xl shadow-lg hover:bg-pink-500 transition-all"
            >
              START HUDDLE
            </button>
          </form>
        </div>
      </div>
    );
  }

  // PAGE 2: MAIN DASHBOARD
  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-6 lg:p-10">
      <nav className="max-w-7xl mx-auto flex justify-between items-end mb-12 border-b border-white/5 pb-8">
        <div>
          <h1 className="text-4xl font-black italic">PickWise</h1>
          <p className="text-[10px] uppercase font-bold text-green-500 tracking-widest">● Live Session</p>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase font-black text-pink-500">Topic</p>
          <p className="text-2xl font-bold">{userData.topic}</p>
          <p className="text-xs text-white/30">User: {userData.name}</p>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto">
        <DecisionEngine userName={userData.name} topic={userData.topic} />
      </main>
    </div>
  );
}

export default App;