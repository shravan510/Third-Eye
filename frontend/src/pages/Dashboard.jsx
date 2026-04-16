import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

const VIOLATION_ICONS = {
  SPEEDING: '💨',
  HELMETLESS: '⛑️',
  TRIPLE_RIDING: '🏍️',
};

const DEMO_VIOLATIONS = [
  { id: 'demo-1', violation_type: 'SPEEDING',      plate_number: 'MH-10-AB-1234', location_name: 'Vishrambagh Chowk, Sangli', created_at: new Date(Date.now() - 60000).toISOString() },
  { id: 'demo-2', violation_type: 'HELMETLESS',    plate_number: 'MH-09-CD-5678', location_name: 'Sangli–Miraj Road',         created_at: new Date(Date.now() - 180000).toISOString() },
  { id: 'demo-3', violation_type: 'TRIPLE_RIDING', plate_number: 'MH-10-GH-9012', location_name: 'Pushparaj Chowk, Sangli',  created_at: new Date(Date.now() - 300000).toISOString() },
];

function StatPill({ icon, label, value }) {
  return (
    <div className="stat-pill">
      <span className="stat-icon">{icon}</span>
      <span>{label}</span>
      <span className="stat-num">{value}</span>
    </div>
  );
}

function ViolationCard({ v }) {
  const type = v.violation_type?.toUpperCase?.() || 'UNKNOWN';
  const icon = VIOLATION_ICONS[type] || '⚠️';
  return (
    <div className="violation-card">
      <div style={{ fontSize: '2rem' }}>{icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <span className={`badge ${type.toLowerCase()}`}>{type.replace('_', ' ')}</span>
        </div>
        <div className="font-mono" style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-bright)', letterSpacing: 1 }}>
          {v.plate_number || 'UNKNOWN'}
        </div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>
          📍 {v.location_name} • {new Date(v.created_at || Date.now()).toLocaleTimeString()}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <button className="btn btn-ghost btn-sm">Review</button>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [violations, setViolations] = useState(DEMO_VIOLATIONS);
  const [stats, setStats] = useState({ total: 3, pending: 2, verified: 1 });
  const [streamOk, setStreamOk] = useState(false);

  useEffect(() => {
    const socket = io('http://localhost:3000', { reconnectionAttempts: 3 });
    socket.on('new_violation', (violation) => {
      setViolations(prev => [violation, ...prev].slice(0, 20));
      setStats(prev => ({ ...prev, total: prev.total + 1, pending: prev.pending + 1 }));
    });
    socket.on('violation_verified', () => {
      setStats(prev => ({ ...prev, verified: prev.verified + 1, pending: Math.max(0, prev.pending - 1) }));
    });
    return () => socket.disconnect();
  }, []);

  return (
    <>
      {/* Top Bar */}
      <header className="topbar">
        <div className="topbar-title">
          <span className="live-dot" />
          Live Surveillance — CAM_001
        </div>
        <div className="stats-bar">
          <StatPill icon="🚨" label="Today"   value={stats.total}    />
          <StatPill icon="⏳" label="Pending" value={stats.pending}  />
          <StatPill icon="✅" label="Verified" value={stats.verified} />
        </div>
      </header>

      {/* Content */}
      <div className="content-area">

        {/* Live Feed */}
        <div className="live-feed-panel">
          <div className="live-feed-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-bright)' }}>CAM_001 · Sangli Main Road</span>
            </div>
            <span style={{ fontSize: '0.8rem', color: streamOk ? 'var(--accent-green)' : 'var(--accent-amber)', display: 'flex', alignItems: 'center', gap: 5 }}>
              <span className="live-dot" style={{ background: streamOk ? 'var(--accent-green)' : 'var(--accent-amber)', boxShadow: `0 0 6px ${streamOk ? 'var(--accent-green)' : 'var(--accent-amber)'}` }} />
              {streamOk ? 'LIVE · AI Processing' : 'Connecting…'}
            </span>
          </div>
          <div className="live-feed-view">
            <img
              src="http://localhost:8000/api/live-feed/CAM_001"
              alt="Live AI Stream"
              onLoad={() => setStreamOk(true)}
              onError={() => setStreamOk(false)}
              style={{ display: streamOk ? 'block' : 'none' }}
            />
            {!streamOk && (
              <div className="live-feed-offline">
                <div className="offline-icon">📷</div>
                <div style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Camera Offline</div>
                <div style={{ fontSize: '0.8rem' }}>Start the AI engine to view live feed</div>
                <div style={{ marginTop: 12, padding: '6px 14px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 8, fontSize: '0.78rem', color: 'var(--accent-amber)', fontFamily: 'monospace' }}>
                  python ai_engine/main.py
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Violation Feed */}
        <div className="violation-feed">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <h3 style={{ margin: 0, fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-bright)' }}>
              Real-time Violations
            </h3>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Auto-refreshing</span>
          </div>

          {violations.length === 0 ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 10, color: 'var(--text-muted)', textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem' }}>👁️</div>
              <div style={{ fontWeight: 600 }}>Watching stream…</div>
              <div style={{ fontSize: '0.82rem' }}>No violations detected yet</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto' }}>
              {violations.map((v, i) => <ViolationCard key={v.id || i} v={v} />)}
            </div>
          )}
        </div>

      </div>
    </>
  );
}
