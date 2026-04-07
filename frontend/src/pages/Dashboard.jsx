import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

export default function Dashboard() {
  const [violations, setViolations] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, verified: 0 });

  useEffect(() => {
    // Connect to backend Socket.IO
    const socket = io('http://localhost:3000');
    
    socket.on('new_violation', (violation) => {
      setViolations(prev => [violation, ...prev]);
      setStats(prev => ({ ...prev, total: prev.total + 1, pending: prev.pending + 1 }));
    });

    socket.on('violation_verified', (data) => {
       setStats(prev => ({ ...prev, verified: prev.verified + 1, pending: Math.max(0, prev.pending - 1) }));
    });

    return () => socket.disconnect();
  }, []);

  return (
    <>
      <header className="topbar">
        <h2>Live Surveillance</h2>
        <div className="stats-bar">
          <div className="stat-item">Violations Today: <span className="stat-value">{stats.total}</span></div>
          <div className="stat-item">Pending Review: <span className="stat-value">{stats.pending}</span></div>
          <div className="stat-item">Verified: <span className="stat-value">{stats.verified}</span></div>
        </div>
      </header>

      <div className="content-area">
        {/* Left: Live Feed */}
        <div className="live-feed-panel">
          <div className="live-feed-header">
            <strong>CAM_001 Feed</strong>
            <span style={{color: '#3fb950'}}>● LIVE - AI Processing</span>
          </div>
          <div className="live-feed-view">
             {/* Streams directly from python FastAPI MJPEG endpoint */}
             <img src="http://localhost:8000/api/live-feed/CAM_001" alt="Live Stream" />
          </div>
        </div>

        {/* Right: Violations */}
        <div className="violation-feed">
          <h3>Real-time Violations</h3>
          {violations.length === 0 ? (
             <div style={{color: '#8b949e'}}>No violations detected yet. Watching stream...</div>
          ) : (
            violations.map((v, i) => (
              <div key={i} className="violation-card">
                <div style={{flex: 1}}>
                  <span className={`badge ${v.violation_type.toLowerCase()}`}>{v.violation_type}</span>
                  <h3 style={{margin: '10px 0'}}>{v.plate_number || 'UNKNOWN'}</h3>
                  <div style={{fontSize: '0.85rem', color: '#8b949e'}}>
                    <div>{v.location_name}</div>
                    <div>{new Date(v.created_at || Date.now()).toLocaleTimeString()}</div>
                  </div>
                </div>
                <div style={{display: 'flex', flexDirection: 'column', justifyContent: 'center'}}>
                  <button style={{
                     background: '#238636', color: 'white', border: 'none', 
                     padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold'
                  }}>
                    Review
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
