import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
const socket = io('http://localhost:5000');

const HistoryLog = () => {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    socket.on('init', ({ history }) => setLogs(history));
    socket.on('historyUpdated', (newHistory) => setLogs(newHistory));
  }, []);

  return (
    <div className="mt-10 p-6 border-t bg-gray-50">
      <h3 className="text-lg font-bold mb-4">Past Wisdom (History)</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {logs.map(log => (
          <div key={log.id} className="bg-white p-3 rounded shadow-sm border-l-4 border-blue-500">
            <p className="font-bold">{log.winner}</p>
            <p className="text-xs text-gray-500">{log.time}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HistoryLog;